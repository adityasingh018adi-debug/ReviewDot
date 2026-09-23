-- Reporting functions from 0006_reporting.sql.
--
-- The important checks here are not arithmetic. They are that these functions
-- respect row level security: they take an organization id from the caller, and
-- a SECURITY DEFINER slip would turn every one of them into a way to read
-- another tenant's numbers.
--
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/reporting_test.sql

\set QUIET on
begin;

create or replace function assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then raise exception 'FAILED: %', label; end if;
  raise notice 'ok  %', label;
end;
$$;

grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------- fixtures

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-00000000000a', 'owner-a@example.com'),
  ('c0000000-0000-0000-0000-00000000000b', 'owner-b@example.com'),
  ('c0000000-0000-0000-0000-00000000000e', 'manager-a@example.com');

insert into organizations (id, name, slug, short_code) values
  ('c1000000-0000-0000-0000-00000000000a', 'Org A', 'org-a', 'OA'),
  ('c1000000-0000-0000-0000-00000000000b', 'Org B', 'org-b', 'OB');

insert into organization_members (id, organization_id, user_id, role) values
  ('c1000000-1111-0000-0000-00000000000a', 'c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'OWNER'),
  ('c1000000-1111-0000-0000-00000000000b', 'c1000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000b', 'OWNER'),
  ('c1000000-1111-0000-0000-00000000000e', 'c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000e', 'OUTLET_MANAGER');

insert into outlets (id, organization_id, name, short_code) values
  ('c2000000-0000-0000-0000-00000000000a', 'c1000000-0000-0000-0000-00000000000a', 'Thane', 'TH'),
  ('c2000000-0000-0000-0000-00000000000b', 'c1000000-0000-0000-0000-00000000000a', 'Bandra', 'BN'),
  ('c2000000-0000-0000-0000-00000000000c', 'c1000000-0000-0000-0000-00000000000b', 'Pune', 'PN');

-- the manager can see Thane only
insert into team_assignments (organization_id, member_id, outlet_id) values
  ('c1000000-0000-0000-0000-00000000000a', 'c1000000-1111-0000-0000-00000000000e', 'c2000000-0000-0000-0000-00000000000a');

insert into products (id, organization_id, outlet_id, name) values
  ('c1000000-3333-0000-0000-00000000000a', 'c1000000-0000-0000-0000-00000000000a',
   'c2000000-0000-0000-0000-00000000000a', 'Mango Cheesecake'),
  ('c1000000-3333-0000-0000-00000000000b', 'c1000000-0000-0000-0000-00000000000b',
   'c2000000-0000-0000-0000-00000000000c', 'Pune Special');

insert into qr_campaigns (id, organization_id, outlet_id, name, public_id, reference_code) values
  ('c3000000-0000-0000-0000-00000000000a', 'c1000000-0000-0000-0000-00000000000a', 'c2000000-0000-0000-0000-00000000000a', 'T1', 'aaaaaaaaaa', 'RD-OA-TH-T01'),
  ('c3000000-0000-0000-0000-00000000000b', 'c1000000-0000-0000-0000-00000000000a', 'c2000000-0000-0000-0000-00000000000b', 'T2', 'bbbbbbbbbb', 'RD-OA-BN-T01'),
  ('c3000000-0000-0000-0000-00000000000c', 'c1000000-0000-0000-0000-00000000000b', 'c2000000-0000-0000-0000-00000000000c', 'T3', 'cccccccccc', 'RD-OB-PN-T01');

set local role service_role;

-- Org A, Thane: 10 scans, 4 pieces of feedback (ratings 5,5,4,2), 2 clicks
insert into qr_scans (organization_id, outlet_id, campaign_id, created_at)
select 'c1000000-0000-0000-0000-00000000000a', 'c2000000-0000-0000-0000-00000000000a',
       'c3000000-0000-0000-0000-00000000000a', now() - (g || ' hours')::interval
  from generate_series(1, 10) g;

insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, comment, sentiment, created_at) values
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a',5,'great','positive', now() - interval '2 hours'),
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a',5,'great','positive', now() - interval '3 hours'),
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a',4,'good','positive', now() - interval '4 hours'),
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a',2,'poor','negative', now() - interval '5 hours');

update customer_feedback set tags = '{Coffee,Service}'
 where organization_id = 'c1000000-0000-0000-0000-00000000000a' and rating = 5;
update customer_feedback set tags = '{Coffee}', contact_email = 'regular@example.com', contact_name = 'Priya'
 where organization_id = 'c1000000-0000-0000-0000-00000000000a' and rating = 4;
update customer_feedback set tags = '{Waiting time}', contact_phone = '+919000000001'
 where organization_id = 'c1000000-0000-0000-0000-00000000000a' and rating = 2;
update customer_feedback set contact_email = 'other-org@example.com'
 where organization_id = 'c1000000-0000-0000-0000-00000000000b';

insert into customer_sessions (organization_id, outlet_id, campaign_id) values
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a'),
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a');

insert into review_events (organization_id, outlet_id, campaign_id, destination, clicked_at) values
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a','google', now() - interval '2 hours'),
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000a','c3000000-0000-0000-0000-00000000000a','google', now() - interval '3 hours');

-- Org A, Bandra: 5 scans, 1 piece of feedback
insert into qr_scans (organization_id, outlet_id, campaign_id, created_at)
select 'c1000000-0000-0000-0000-00000000000a', 'c2000000-0000-0000-0000-00000000000b',
       'c3000000-0000-0000-0000-00000000000b', now() - (g || ' hours')::interval
  from generate_series(1, 5) g;
insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, sentiment, created_at) values
  ('c1000000-0000-0000-0000-00000000000a','c2000000-0000-0000-0000-00000000000b','c3000000-0000-0000-0000-00000000000b',3,'neutral', now() - interval '2 hours');

-- Org B: numbers that must never appear in Org A's dashboard
insert into qr_scans (organization_id, outlet_id, campaign_id, created_at)
select 'c1000000-0000-0000-0000-00000000000b', 'c2000000-0000-0000-0000-00000000000c',
       'c3000000-0000-0000-0000-00000000000c', now() - (g || ' hours')::interval
  from generate_series(1, 99) g;
insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, sentiment, created_at) values
  ('c1000000-0000-0000-0000-00000000000b','c2000000-0000-0000-0000-00000000000c','c3000000-0000-0000-0000-00000000000c',1,'negative', now() - interval '2 hours');

-- ---------------------------------------------------------------- owner A

set local role authenticated;
set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000a';

select * from app_overview('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now()) \gset ov_

select assert(:ov_scans = 15, 'overview counts scans across every visible outlet');
select assert(:ov_reviews = 5, 'overview counts feedback');
select assert(:ov_rating = 3.80, 'overview averages the rating');
select assert(:ov_google_clicks = 2, 'overview counts destination clicks');
select assert(:ov_positive = 3, 'overview counts positive feedback');
select assert(:ov_negative = 1, 'overview counts negative feedback');

-- scoped to one outlet
select * from app_overview('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now(),
                           'c2000000-0000-0000-0000-00000000000a') \gset th_
select assert(:th_scans = 10, 'overview narrows to a single outlet');
select assert(:th_reviews = 4, 'and its feedback');

-- an empty window is empty, not an error
select * from app_overview('c1000000-0000-0000-0000-00000000000a',
                           now() - interval '400 days', now() - interval '399 days') \gset empty_
select assert(:empty_scans = 0, 'an empty window reports zero scans');
select assert(
  (select rating from app_overview('c1000000-0000-0000-0000-00000000000a',
     now() - interval '400 days', now() - interval '399 days')) is null,
  'and a null rating rather than a division by zero');

-- ---------------------------------------------------------------- isolation

-- The organization id is an argument, so this is the check that matters: asking
-- for someone else's must return nothing, not their numbers.
select * from app_overview('c1000000-0000-0000-0000-00000000000b', now() - interval '2 days', now()) \gset other_
select assert(:other_scans = 0, 'asking for another organization returns no scans');
select assert(:other_reviews = 0, 'asking for another organization returns no feedback');
select assert(
  (select rating from app_overview('c1000000-0000-0000-0000-00000000000b',
     now() - interval '2 days', now())) is null,
  'asking for another organization returns no rating');

select assert(
  (select count(*) from app_outlet_breakdown('c1000000-0000-0000-0000-00000000000b', now() - interval '2 days', now())) = 0,
  'another organization''s outlet breakdown is empty');

select assert(
  (select coalesce(sum(scans), 0) from app_daily_series('c1000000-0000-0000-0000-00000000000b', now() - interval '2 days', now())) = 0,
  'another organization''s series is empty');

-- ---------------------------------------------------------------- outlet-scoped role

set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000e';

select * from app_overview('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now()) \gset mgr_
select assert(:mgr_scans = 10, 'an outlet manager sees only their outlet''s scans');
select assert(:mgr_reviews = 4, 'and only their outlet''s feedback');

select assert(
  (select count(*) from app_outlet_breakdown('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now())) = 1,
  'an outlet manager''s breakdown lists one outlet');

-- ---------------------------------------------------------------- series and distribution

set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000a';

select assert(
  (select count(*) from app_daily_series('c1000000-0000-0000-0000-00000000000a',
     now() - interval '6 days', now())) = 7,
  'the series has one row per day including quiet ones');

select assert(
  (select sum(scans) from app_daily_series('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())) = 15,
  'the series totals match the overview');

select assert(
  (select count(*) from app_daily_series('c1000000-0000-0000-0000-00000000000a',
     now() - interval '6 days', now()) where scans = 0) >= 4,
  'quiet days appear as zeroes rather than gaps');

select assert(
  (select count from app_rating_distribution('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now()) where rating = 5) = 2,
  'the rating distribution counts each rating');

select assert(
  (select count(*) from app_rating_distribution('c1000000-0000-0000-0000-00000000000b',
     now() - interval '2 days', now())) = 0,
  'another organization''s distribution is empty');

-- ---------------------------------------------------------------- per-campaign

select assert(
  (select scans from app_campaign_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())
    where campaign_id = 'c3000000-0000-0000-0000-00000000000a') = 10,
  'the campaign breakdown counts scans per code');

select assert(
  (select reviews from app_campaign_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())
    where campaign_id = 'c3000000-0000-0000-0000-00000000000a') = 4,
  'and feedback per code');

select assert(
  (select clicks from app_campaign_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())
    where campaign_id = 'c3000000-0000-0000-0000-00000000000a') = 2,
  'and destination clicks per code');

select assert(
  (select count(*) from app_campaign_breakdown('c1000000-0000-0000-0000-00000000000b',
     now() - interval '2 days', now())) = 0,
  'another organization''s campaign breakdown is empty');

-- an outlet-scoped member sees only their own outlet's codes
set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000e';
select assert(
  (select count(*) from app_campaign_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())) = 1,
  'an outlet manager''s campaign breakdown covers only their outlet');
set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000a';

-- ---------------------------------------------------------------- tags

select assert(
  (select mentions from app_tag_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now()) where tag = 'Coffee') = 3,
  'the tag breakdown counts mentions across feedback');

select assert(
  (select positive from app_tag_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now()) where tag = 'Waiting time') = 0,
  'and separates the ones that came with negative feedback');

select assert(
  (select tag from app_tag_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now()) limit 1) = 'Coffee',
  'the most mentioned tag comes first');

select assert(
  (select count(*) from app_tag_breakdown('c1000000-0000-0000-0000-00000000000b',
     now() - interval '2 days', now())) = 0,
  'another organization''s tags are not visible');

-- ---------------------------------------------------------------- funnel

select * from app_funnel('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now()) \gset fn_

select assert(:fn_scans = 15, 'the funnel starts from scans');
select assert(:fn_sessions = 2, 'and counts the sessions that opened');
select assert(:fn_feedback = 5, 'and the feedback left');
select assert(:fn_clicks = 2, 'and the customers who went to post');
select assert(:fn_drafts = 0, 'a step with nothing in it reports zero rather than being omitted');

select assert(
  (select scans from app_funnel('c1000000-0000-0000-0000-00000000000b', now() - interval '2 days', now())) = 0,
  'another organization''s funnel is empty');

-- ---------------------------------------------------------------- customers

select assert(
  (select count(*) from app_customers('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())) = 2,
  'customers are grouped by the contact they left');

select assert(
  (select name from app_customers('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now()) where contact = 'regular@example.com') = 'Priya',
  'and keep the name they gave');

select assert(
  (select count(*) from app_customers('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now()) where contact = 'other-org@example.com') = 0,
  'another organization''s customers never appear');

-- erasing a contact removes them from the list, which is the point of erasing
select app_erase_feedback_contact(
  (select id from customer_feedback
    where contact_email = 'regular@example.com' limit 1));
select assert(
  (select count(*) from app_customers('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())) = 1,
  'an erased customer drops out of the customer list');

-- ---------------------------------------------------------------- products

-- feedback in org A is already tied to the Mango Cheesecake by the fixtures
update customer_feedback set product_id = 'c1000000-3333-0000-0000-00000000000a'
 where organization_id = 'c1000000-0000-0000-0000-00000000000a' and rating >= 4;

select assert(
  (select reviews from app_product_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())
    where product_id = 'c1000000-3333-0000-0000-00000000000a') = 3,
  'the product breakdown counts the feedback tied to a product');

select assert(
  (select rating from app_product_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())
    where product_id = 'c1000000-3333-0000-0000-00000000000a') = 4.67,
  'and averages its rating');

-- a product nobody has mentioned still appears; "no feedback yet" is information
insert into products (id, organization_id, outlet_id, name) values
  ('c1000000-3333-0000-0000-00000000000f', 'c1000000-0000-0000-0000-00000000000a',
   'c2000000-0000-0000-0000-00000000000a', 'Untouched Scone');
select assert(
  (select reviews from app_product_breakdown('c1000000-0000-0000-0000-00000000000a',
     now() - interval '2 days', now())
    where product_id = 'c1000000-3333-0000-0000-00000000000f') = 0,
  'a product with no feedback still appears, with zero');

select assert(
  (select count(*) from app_product_breakdown('c1000000-0000-0000-0000-00000000000b',
     now() - interval '2 days', now())) = 0,
  'another organization''s products are not visible');

-- ---------------------------------------------------------------- anon

set local role anon;
set local request.jwt.claim.sub = '';

do $$ begin
  perform app_overview('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now());
  raise exception 'FAILED: anonymous read a dashboard overview';
exception when insufficient_privilege then
  raise notice 'ok  anonymous may not execute the reporting functions';
end $$;

do $$ begin
  perform app_campaign_breakdown('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now());
  raise exception 'FAILED: anonymous read a campaign breakdown';
exception when insufficient_privilege then
  raise notice 'ok  anonymous may not read a campaign breakdown';
end $$;

do $$ begin
  perform app_customers('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now());
  raise exception 'FAILED: anonymous read a customer list';
exception when insufficient_privilege then
  raise notice 'ok  anonymous may not read the customer list';
end $$;

do $$ begin
  perform app_product_breakdown('c1000000-0000-0000-0000-00000000000a', now() - interval '2 days', now());
  raise exception 'FAILED: anonymous read a product breakdown';
exception when insufficient_privilege then
  raise notice 'ok  anonymous may not read a product breakdown';
end $$;

rollback;
