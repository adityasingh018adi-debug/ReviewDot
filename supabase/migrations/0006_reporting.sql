-- ReviewDot V2 — reporting
--
-- The dashboard computed every figure in the browser: fetch every row, then
-- bucket, average and trend them in JavaScript. That is free against a seeded
-- array and impossible against two million feedback rows, so the aggregation
-- moves here before the first real query is written rather than after.
--
-- Every function is SECURITY INVOKER — the default, and load-bearing. These read
-- tenant tables, so they must run as the caller with row level security
-- applying. A SECURITY DEFINER function here would hand any authenticated user
-- every organization's numbers, which is precisely the isolation 0002 exists to
-- enforce.
--
-- `p_org` is supplied by the caller and is *not* trusted: the policies on the
-- underlying tables decide whether those rows are visible, so passing another
-- organization's id returns zeroes rather than their data. There is a test for
-- exactly that.
--
-- `p_outlet` null means every outlet the caller can see, which is already
-- narrowed by app_can_see_outlet.

-- ---------------------------------------------------------------- overview

-- The headline figures for one window. Counts rather than ratios: division is
-- the caller's job, so an empty window is an empty state rather than a NaN
-- travelling through three layers before someone notices.
create or replace function app_overview(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (
  scans bigint,
  reviews bigint,
  rating numeric,
  google_clicks bigint,
  positive bigint,
  negative bigint
)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*) from qr_scans s
      where s.organization_id = p_org
        and (p_outlet is null or s.outlet_id = p_outlet)
        and s.created_at >= p_from and s.created_at <= p_to),
    (select count(*) from customer_feedback f
      where f.organization_id = p_org
        and (p_outlet is null or f.outlet_id = p_outlet)
        and f.created_at >= p_from and f.created_at <= p_to),
    (select round(avg(f.rating)::numeric, 2) from customer_feedback f
      where f.organization_id = p_org
        and (p_outlet is null or f.outlet_id = p_outlet)
        and f.created_at >= p_from and f.created_at <= p_to),
    (select count(*) from review_events e
      where e.organization_id = p_org
        and (p_outlet is null or e.outlet_id = p_outlet)
        and e.clicked_at >= p_from and e.clicked_at <= p_to),
    (select count(*) from customer_feedback f
      where f.organization_id = p_org
        and (p_outlet is null or f.outlet_id = p_outlet)
        and f.created_at >= p_from and f.created_at <= p_to
        and f.sentiment = 'positive'),
    (select count(*) from customer_feedback f
      where f.organization_id = p_org
        and (p_outlet is null or f.outlet_id = p_outlet)
        and f.created_at >= p_from and f.created_at <= p_to
        and f.sentiment = 'negative');
$$;

-- ---------------------------------------------------------------- daily series

-- One row per day across the window, including days with no activity —
-- generate_series rather than a group-by, so a quiet Tuesday is a zero on the
-- chart instead of a gap the line is drawn straight through.
create or replace function app_daily_series(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (day date, scans bigint, reviews bigint)
language sql stable security invoker set search_path = public as $$
  with days as (
    select generate_series(p_from::date, p_to::date, interval '1 day')::date as day
  ),
  scans as (
    select s.created_at::date as day, count(*) as n
      from qr_scans s
     where s.organization_id = p_org
       and (p_outlet is null or s.outlet_id = p_outlet)
       and s.created_at >= p_from and s.created_at <= p_to
     group by 1
  ),
  reviews as (
    select f.created_at::date as day, count(*) as n
      from customer_feedback f
     where f.organization_id = p_org
       and (p_outlet is null or f.outlet_id = p_outlet)
       and f.created_at >= p_from and f.created_at <= p_to
     group by 1
  )
  select d.day, coalesce(s.n, 0), coalesce(r.n, 0)
    from days d
    left join scans s on s.day = d.day
    left join reviews r on r.day = d.day
   order by d.day;
$$;

-- ---------------------------------------------------------------- breakdowns

-- Outlets the caller can see, with their numbers for the window. Outlets with
-- no activity still appear: "no feedback yet" is information.
create or replace function app_outlet_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  outlet_id uuid,
  outlet_name text,
  scans bigint,
  reviews bigint,
  rating numeric
)
language sql stable security invoker set search_path = public as $$
  select
    o.id,
    o.name,
    (select count(*) from qr_scans s
      where s.outlet_id = o.id and s.created_at >= p_from and s.created_at <= p_to),
    (select count(*) from customer_feedback f
      where f.outlet_id = o.id and f.created_at >= p_from and f.created_at <= p_to),
    (select round(avg(f.rating)::numeric, 2) from customer_feedback f
      where f.outlet_id = o.id and f.created_at >= p_from and f.created_at <= p_to)
  from outlets o
  where o.organization_id = p_org and o.status <> 'archived'
  order by o.name;
$$;

-- How the ratings are spread, for the donut. Ratings with no feedback are
-- omitted; the caller fills 1–5 so the chart shape is stable.
create or replace function app_rating_distribution(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (rating smallint, count bigint)
language sql stable security invoker set search_path = public as $$
  select f.rating, count(*)
    from customer_feedback f
   where f.organization_id = p_org
     and (p_outlet is null or f.outlet_id = p_outlet)
     and f.created_at >= p_from and f.created_at <= p_to
   group by f.rating
   order by f.rating;
$$;

-- ---------------------------------------------------------------- grants

-- anon has no business reading a dashboard; the scan page never calls these.
revoke all on function app_overview(uuid, timestamptz, timestamptz, uuid) from public, anon;
revoke all on function app_daily_series(uuid, timestamptz, timestamptz, uuid) from public, anon;
revoke all on function app_outlet_breakdown(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function app_rating_distribution(uuid, timestamptz, timestamptz, uuid) from public, anon;

grant execute on function app_overview(uuid, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function app_daily_series(uuid, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function app_outlet_breakdown(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function app_rating_distribution(uuid, timestamptz, timestamptz, uuid) to authenticated;
