-- ReviewDot V2 — product reporting
--
-- "Which product are people actually reviewing, and what do they say about it?"
-- Feedback carries an optional product_id, and product_mentions records the
-- richer link. Same terms as the rest: aggregated here, SECURITY INVOKER.

create or replace function app_product_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (
  product_id uuid,
  product_name text,
  outlet_id uuid,
  reviews bigint,
  rating numeric,
  positive bigint,
  is_active boolean
)
language sql stable security invoker set search_path = public as $$
  select
    p.id,
    p.name,
    p.outlet_id,
    count(f.id),
    round(avg(f.rating)::numeric, 2),
    count(f.id) filter (where f.sentiment = 'positive'),
    p.is_active
  from products p
  left join customer_feedback f
    on f.product_id = p.id
   and f.created_at >= p_from
   and f.created_at <= p_to
  where p.organization_id = p_org
    and (p_outlet is null or p.outlet_id = p_outlet or p.outlet_id is null)
  group by p.id, p.name, p.outlet_id, p.is_active
  order by count(f.id) desc, p.name;
$$;

revoke all on function app_product_breakdown(uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function app_product_breakdown(uuid, timestamptz, timestamptz, uuid) to authenticated;
