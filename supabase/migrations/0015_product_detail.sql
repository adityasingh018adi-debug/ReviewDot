-- Richer product rows, and feedback counted by status.
--
-- Two aggregates the dashboard needs in order to show a real workspace what the
-- seeded demo has always shown: the catalogue facts already stored against a
-- product (category, price), and the triage counts that the feedback tabs are
-- meant to sit on. Both were being computed in the browser from the seeded
-- dataset, which is exactly the split this replaces — a real account could not
-- see either.
--
-- app_product_breakdown gains columns, so it is dropped and recreated rather
-- than replaced: Postgres will not let `create or replace` change a function's
-- output columns.

drop function if exists app_product_breakdown(uuid, timestamptz, timestamptz, uuid);

create function app_product_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (
  product_id uuid,
  product_name text,
  outlet_id uuid,
  category text,
  price_cents integer,
  reviews bigint,
  rating numeric,
  positive bigint,
  private_feedback bigint,
  scans bigint,
  is_active boolean
)
language sql stable security invoker set search_path = public as $$
  select
    p.id,
    p.name,
    p.outlet_id,
    p.category,
    p.price_cents,
    count(f.id),
    round(avg(f.rating)::numeric, 2),
    count(f.id) filter (where f.sentiment = 'positive'),
    -- 3★ and below never reaches a public platform; it reaches the team
    count(f.id) filter (where f.rating <= 3),
    -- scans of the codes that name this product, counted separately so a
    -- product with traffic but no feedback is visible rather than a blank row
    (select count(*)
       from qr_scans s
       join qr_campaigns c on c.id = s.campaign_id
      where c.product_id = p.id
        and s.created_at >= p_from
        and s.created_at <= p_to),
    p.is_active
  from products p
  left join customer_feedback f
    on f.product_id = p.id
   and f.created_at >= p_from
   and f.created_at <= p_to
  where p.organization_id = p_org
    and (p_outlet is null or p.outlet_id = p_outlet or p.outlet_id is null)
  group by p.id, p.name, p.outlet_id, p.category, p.price_cents, p.is_active
  order by count(f.id) desc, p.name;
$$;

revoke all on function app_product_breakdown(uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function app_product_breakdown(uuid, timestamptz, timestamptz, uuid) to authenticated;

-- ---------------------------------------------------------------- triage counts

-- What the feedback tabs count. Doing it here rather than counting a page of
-- rows in the browser means the tab says how many there are, not how many were
-- fetched — which are different numbers the moment paging starts.

create or replace function app_feedback_status_counts(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (status text, count bigint)
language sql stable security invoker set search_path = public as $$
  select f.status::text, count(*)
    from customer_feedback f
   where f.organization_id = p_org
     and (p_outlet is null or f.outlet_id = p_outlet)
     and f.created_at >= p_from
     and f.created_at <= p_to
   group by f.status;
$$;

revoke all on function app_feedback_status_counts(uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function app_feedback_status_counts(uuid, timestamptz, timestamptz, uuid) to authenticated;
