-- Per-product rating distribution and tag breakdown.
--
-- Both aggregates already existed; neither could be asked about one product, so
-- the product page's distribution and keyword panels were computed in the
-- browser from the seeded dataset and a real account could not have them. Adding
-- an optional p_product is the whole change: default null keeps every existing
-- caller identical.
--
-- Both are dropped and recreated rather than replaced. Postgres treats a new
-- parameter as a new overload, and leaving the four-argument version in place
-- would give PostgREST two candidates to choose between — which it resolves by
-- argument names, quietly, differently than you expect.

drop function if exists app_rating_distribution(uuid, timestamptz, timestamptz, uuid);

create function app_rating_distribution(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null,
  p_product uuid default null
)
returns table (rating smallint, count bigint)
language sql stable security invoker set search_path = public as $$
  select f.rating, count(*)
    from customer_feedback f
   where f.organization_id = p_org
     and (p_outlet is null or f.outlet_id = p_outlet)
     and (p_product is null or f.product_id = p_product)
     and f.created_at >= p_from and f.created_at <= p_to
   group by f.rating
   order by f.rating;
$$;

revoke all on function app_rating_distribution(uuid, timestamptz, timestamptz, uuid, uuid) from public, anon;
grant execute on function app_rating_distribution(uuid, timestamptz, timestamptz, uuid, uuid) to authenticated;

drop function if exists app_tag_breakdown(uuid, timestamptz, timestamptz, uuid);

create function app_tag_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null,
  p_product uuid default null
)
returns table (tag text, mentions bigint, positive bigint, avg_rating numeric)
language sql stable security invoker set search_path = public as $$
  select
    t.tag,
    count(*),
    count(*) filter (where f.sentiment = 'positive'),
    round(avg(f.rating)::numeric, 2)
  from customer_feedback f
  cross join lateral unnest(f.tags) as t(tag)
  where f.organization_id = p_org
    and (p_outlet is null or f.outlet_id = p_outlet)
    and (p_product is null or f.product_id = p_product)
    and f.created_at >= p_from and f.created_at <= p_to
  group by t.tag
  order by count(*) desc, t.tag;
$$;

revoke all on function app_tag_breakdown(uuid, timestamptz, timestamptz, uuid, uuid) from public, anon;
grant execute on function app_tag_breakdown(uuid, timestamptz, timestamptz, uuid, uuid) to authenticated;
