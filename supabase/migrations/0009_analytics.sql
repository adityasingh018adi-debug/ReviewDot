-- ReviewDot V2 — analytics aggregates
--
-- Three more rollups, on the same terms as 0006: computed here, SECURITY
-- INVOKER so row level security decides what the caller can see, and `p_org` is
-- an argument rather than an authorization.

-- ---------------------------------------------------------------- tags

-- What customers actually keep mentioning. Tags are a text[] on each piece of
-- feedback, so this unnests rather than making the browser flatten thousands of
-- arrays to count them.
create or replace function app_tag_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
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
    and f.created_at >= p_from and f.created_at <= p_to
  group by t.tag
  order by count(*) desc, t.tag;
$$;

-- ---------------------------------------------------------------- funnel

-- Where the journey loses people: scanned → opened a session → left feedback →
-- got a draft → approved it → clicked through. Each step is its own count, so
-- the caller can render the drop-off without deriving it from a list of rows.
create or replace function app_funnel(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (
  scans bigint,
  sessions bigint,
  feedback bigint,
  drafts bigint,
  approved bigint,
  clicks bigint
)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*) from qr_scans s
      where s.organization_id = p_org and (p_outlet is null or s.outlet_id = p_outlet)
        and s.created_at >= p_from and s.created_at <= p_to),
    (select count(*) from customer_sessions cs
      where cs.organization_id = p_org and (p_outlet is null or cs.outlet_id = p_outlet)
        and cs.created_at >= p_from and cs.created_at <= p_to),
    (select count(*) from customer_feedback f
      where f.organization_id = p_org and (p_outlet is null or f.outlet_id = p_outlet)
        and f.created_at >= p_from and f.created_at <= p_to),
    (select count(*) from ai_review_drafts d
      where d.organization_id = p_org and (p_outlet is null or d.outlet_id = p_outlet)
        and d.created_at >= p_from and d.created_at <= p_to),
    (select count(*) from ai_review_drafts d
      where d.organization_id = p_org and (p_outlet is null or d.outlet_id = p_outlet)
        and d.status = 'approved'
        and d.created_at >= p_from and d.created_at <= p_to),
    (select count(*) from review_events e
      where e.organization_id = p_org and (p_outlet is null or e.outlet_id = p_outlet)
        and e.clicked_at >= p_from and e.clicked_at <= p_to);
$$;

-- ---------------------------------------------------------------- customers

-- People who left a way to reach them, grouped so the same person across three
-- visits is one row.
--
-- Erased contacts drop out: app_erase_feedback_contact() nulls the fields and
-- stamps contact_erased_at, and a customer who asked to be forgotten should not
-- reappear in a list a week later.
create or replace function app_customers(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null,
  p_limit integer default 100
)
returns table (
  contact text,
  name text,
  visits bigint,
  avg_rating numeric,
  last_seen timestamptz
)
language sql stable security invoker set search_path = public as $$
  select
    coalesce(f.contact_email, f.contact_phone) as contact,
    max(f.contact_name),
    count(*),
    round(avg(f.rating)::numeric, 2),
    max(f.created_at)
  from customer_feedback f
  where f.organization_id = p_org
    and (p_outlet is null or f.outlet_id = p_outlet)
    and f.created_at >= p_from and f.created_at <= p_to
    and f.contact_erased_at is null
    and coalesce(f.contact_email, f.contact_phone) is not null
  group by coalesce(f.contact_email, f.contact_phone)
  order by max(f.created_at) desc
  limit greatest(1, least(p_limit, 500));
$$;

-- ---------------------------------------------------------------- grants

revoke all on function app_tag_breakdown(uuid, timestamptz, timestamptz, uuid) from public, anon;
revoke all on function app_funnel(uuid, timestamptz, timestamptz, uuid) from public, anon;
revoke all on function app_customers(uuid, timestamptz, timestamptz, uuid, integer) from public, anon;

grant execute on function app_tag_breakdown(uuid, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function app_funnel(uuid, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function app_customers(uuid, timestamptz, timestamptz, uuid, integer) to authenticated;
