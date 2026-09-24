-- Per-channel performance, aggregated in Postgres like every other figure.
--
-- What this counts is click-throughs: customers ReviewDot sent to a platform,
-- from review_events. It is deliberately NOT "reviews on Google". No platform
-- confirms that a review was posted — 0001 says so where review_events is
-- defined — so counting sends and calling them reviews would be inventing a
-- number about somebody else's business.
--
-- `configured` reports whether any outlet in scope actually points at that
-- destination, so the dashboard can tell "nobody went there" apart from "that
-- channel was never set up", which are different problems with different fixes.
--
-- security invoker, like the rest of 0006: RLS is what authorises the read, and
-- asking for another organization returns nothing.

create or replace function app_channel_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (
  destination text,
  clicks bigint,
  configured boolean
)
language sql stable security invoker set search_path = public as $$
  with sent as (
    select e.destination::text as destination, count(*) as clicks
      from review_events e
     where e.organization_id = p_org
       and (p_outlet is null or e.outlet_id = p_outlet)
       and e.clicked_at >= p_from and e.clicked_at <= p_to
     group by e.destination
  ),
  -- An outlet declares its destinations in a jsonb array; google_review_url is
  -- the older single-destination column and still counts as configuring Google.
  set_up as (
    select d.value as destination
      from outlets o
      cross join lateral jsonb_array_elements_text(o.review_destinations) as d(value)
     where o.organization_id = p_org
       and o.status <> 'archived'
       and (p_outlet is null or o.id = p_outlet)
    union
    select 'google'
      from outlets o
     where o.organization_id = p_org
       and o.status <> 'archived'
       and (p_outlet is null or o.id = p_outlet)
       and coalesce(o.google_review_url, '') <> ''
  )
  select
    coalesce(sent.destination, set_up.destination),
    coalesce(sent.clicks, 0),
    set_up.destination is not null
  from sent
  full outer join set_up on set_up.destination = sent.destination;
$$;

revoke all on function app_channel_breakdown(uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function app_channel_breakdown(uuid, timestamptz, timestamptz, uuid) to authenticated;
