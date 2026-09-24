-- Per-channel reporting (0014), and the thing it must never do.
--
-- app_channel_breakdown counts click-throughs — customers ReviewDot sent to a
-- platform. It must not be mistaken for "reviews on that platform", which no
-- platform tells us. These checks pin the counting, the configured/not-set-up
-- distinction, and that another organization's numbers stay invisible.

\set QUIET on
begin;

create or replace function assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'ok  %', label;
end;
$$;

grant select, insert, update on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

insert into auth.users (id, email) values
  ('c1111111-1111-1111-1111-111111111111', 'chan-owner@example.com'),
  ('c2222222-2222-2222-2222-222222222222', 'other-owner@example.com');

-- two unrelated businesses
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1111111-1111-1111-1111-111111111111', true);
select set_config('test.org', app_create_organization('Chan Cafe', 'Thane', 'cafe')::text, false);
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config('test.other', app_create_organization('Rival Cafe', 'Juhu', 'cafe')::text, false);
set local role postgres;

-- Chan Cafe points at Google (legacy column) and Zomato (destinations array).
-- Swiggy is deliberately left unconfigured but receives a click anyway, which
-- is what an outlet whose destination was removed after the fact looks like.
update outlets set google_review_url = 'https://g.page/chan',
                   review_destinations = '["zomato"]'::jsonb
 where organization_id = current_setting('test.org')::uuid;

insert into review_events (organization_id, outlet_id, destination, clicked_at)
select o.organization_id, o.id, d.dest::review_destination, now()
  from outlets o, (values ('google'), ('google'), ('zomato'), ('swiggy')) as d(dest)
 where o.organization_id = current_setting('test.org')::uuid;

-- the rival's traffic, which must never appear in Chan Cafe's numbers
update outlets set google_review_url = 'https://g.page/rival'
 where organization_id = current_setting('test.other')::uuid;
insert into review_events (organization_id, outlet_id, destination, clicked_at)
select o.organization_id, o.id, 'google'::review_destination, now()
  from outlets o
 where o.organization_id = current_setting('test.other')::uuid;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1111111-1111-1111-1111-111111111111', true);

create temporary view chan as
  select * from app_channel_breakdown(
    current_setting('test.org')::uuid,
    now() - interval '7 days',
    now() + interval '1 day');

select assert((select clicks from chan where destination = 'google') = 2,
  'counts the click-throughs sent to a channel');

select assert((select configured from chan where destination = 'google'),
  'google_review_url alone marks Google as configured');

select assert((select configured from chan where destination = 'zomato'),
  'a destination in review_destinations marks that channel configured');

select assert((select clicks from chan where destination = 'swiggy') = 1,
  'traffic to a channel nobody configured is still counted, not hidden');

select assert(not (select configured from chan where destination = 'swiggy'),
  'and that channel is reported as not set up, which is a different problem');

select assert((select count(*) from chan where destination = 'instagram') = 0,
  'a channel with neither traffic nor configuration is simply absent');

select assert((select sum(clicks) from chan) = 4,
  'another organization''s click-throughs never reach these numbers');

-- and the reverse, from the rival's side
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select assert(
  (select coalesce(sum(clicks), 0) from app_channel_breakdown(
     current_setting('test.org')::uuid, now() - interval '7 days', now() + interval '1 day')) = 0,
  'asking for a channel breakdown of an organization you do not belong to returns nothing');

rollback;
