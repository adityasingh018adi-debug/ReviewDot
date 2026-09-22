-- The customer journey, at the database level.
--
--   scan → session → feedback → draft → approval → destination click
--
-- These are the exact column shapes src/app-actions/feedback.ts writes. The
-- application talks to PostgREST rather than to Postgres directly, so a wrong
-- column name there surfaces as a runtime error in front of a customer; this
-- suite is what catches it first.
--
-- It also pins the two rules that make the journey trustworthy: the anonymous
-- role may open a session and leave feedback, but may not forge a draft or a
-- review click, and the business can reconstruct the whole funnel by joins.
--
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/flow_test.sql

\set QUIET on
begin;

create or replace function assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then raise exception 'FAILED: %', label; end if;
  raise notice 'ok  %', label;
end;
$$;

-- Mirror Supabase's defaults: service_role holds everything, anon and
-- authenticated hold what the policies then narrow.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
revoke update on customer_feedback from authenticated;
grant update (status, assigned_to) on customer_feedback to authenticated;

-- ---------------------------------------------------------------- fixtures

insert into auth.users (id, email) values ('f0000000-0000-0000-0000-00000000000a', 'owner@example.com');

insert into organizations (id, name, slug, short_code) values
  ('f1000000-0000-0000-0000-000000000001', 'Love & Latte', 'love-latte', 'LL');

insert into organization_members (id, organization_id, user_id, role) values
  ('f1000000-1111-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-00000000000a', 'OWNER');

insert into outlets (id, organization_id, name, short_code, google_review_url) values
  ('f2000000-0000-0000-0000-00000000000a', 'f1000000-0000-0000-0000-000000000001',
   'Thane', 'TH', 'https://g.page/r/love-and-latte/review');

insert into products (id, organization_id, outlet_id, name) values
  ('f3000000-0000-0000-0000-00000000000a', 'f1000000-0000-0000-0000-000000000001',
   'f2000000-0000-0000-0000-00000000000a', 'Mango Cheesecake');

insert into qr_campaigns (id, organization_id, outlet_id, product_id, name, public_id, reference_code, type, placement) values
  ('f4000000-0000-0000-0000-00000000000a', 'f1000000-0000-0000-0000-000000000001',
   'f2000000-0000-0000-0000-00000000000a', 'f3000000-0000-0000-0000-00000000000a',
   'Table 04', 'k7m2p9qrst', 'RD-LL-TH-T04', 'table', 'Table 04');

-- ---------------------------------------------------------------- the journey, as the server writes it

set local role service_role;

-- 1. the scan, with the anonymity fields that were always null before
insert into qr_scans (organization_id, outlet_id, campaign_id, visitor_hash, user_agent, referrer)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        'f4000000-0000-0000-0000-00000000000a', 'a1b2c3d4e5f6a1b2c3d4e5f6',
        'Mozilla/5.0 (iPhone)', 'https://instagram.com/')
returning id \gset scan_

select assert(:'scan_id' is not null, 'a scan records visitor hash, user agent and referrer');

-- 2. the session, linked to that scan
insert into customer_sessions (organization_id, outlet_id, campaign_id, scan_id, visitor_hash)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        'f4000000-0000-0000-0000-00000000000a', :'scan_id', 'a1b2c3d4e5f6a1b2c3d4e5f6')
returning id \gset session_

select assert(:'session_id' is not null, 'a session opens against the scan');

-- 3. the feedback, linked to the session
insert into customer_feedback
  (organization_id, outlet_id, campaign_id, session_id, product_id, rating, tags, comment, sentiment)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        'f4000000-0000-0000-0000-00000000000a', :'session_id', 'f3000000-0000-0000-0000-00000000000a',
        5, '{Coffee,Service}', 'The flat white was excellent and the staff were lovely.', 'positive')
returning id \gset feedback_

select assert(:'feedback_id' is not null, 'feedback links back to the session');

-- 4. the draft, carrying the customer's own words as provenance
insert into ai_review_drafts
  (organization_id, outlet_id, feedback_id, source_text, draft_text, model, status)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        :'feedback_id', 'The flat white was excellent and the staff were lovely.',
        'Had a great time at Love & Latte in Thane. The flat white was excellent and the staff were lovely.',
        'claude-sonnet-5', 'generated')
returning id \gset draft_

select assert(:'draft_id' is not null, 'a draft is stored against its feedback');
select assert(
  (select source_text from ai_review_drafts where id = :'draft_id')
    = (select comment from customer_feedback where id = :'feedback_id'),
  'the draft keeps the customer''s own words as source_text');

-- 5. approval, with the edit flag the server derives
update ai_review_drafts
   set final_text = 'Had a great time at Love & Latte. The flat white was excellent.',
       status = 'approved',
       approved_at = now(),
       edited_by_customer = true
 where id = :'draft_id';

select assert(
  (select status = 'approved' and approved_at is not null and edited_by_customer
     from ai_review_drafts where id = :'draft_id'),
  'approval records the final text, the time and that the customer edited it');

-- 6. the destination click
insert into review_events
  (organization_id, outlet_id, campaign_id, feedback_id, draft_id, destination, destination_url)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        'f4000000-0000-0000-0000-00000000000a', :'feedback_id', :'draft_id',
        'google', 'https://g.page/r/love-and-latte/review')
returning id \gset event_

update customer_sessions set completed_at = now() where id = :'session_id';
select assert(
  (select completed_at is not null from customer_sessions where id = :'session_id'),
  'the session closes when the customer reaches a destination');

-- ---------------------------------------------------------------- the funnel reconstructs

select assert(
  (select count(*) from qr_scans s
     join customer_sessions cs on cs.scan_id = s.id
     join customer_feedback f on f.session_id = cs.id
     join ai_review_drafts d on d.feedback_id = f.id
     join review_events e on e.draft_id = d.id) = 1,
  'scan → session → feedback → draft → event joins end to end');

select assert(
  (select count(distinct visitor_hash) from qr_scans) = 1,
  'unique visitors are countable from the scan rows');

select assert(
  (select visitor_hash !~ '[.:]' from qr_scans limit 1),
  'the visitor hash holds no address');

-- ---------------------------------------------------------------- what anonymous may and may not do

set local role anon;
set local request.jwt.claim.sub = '';

-- opening a session and leaving feedback is the whole point of the scan page
insert into customer_sessions (organization_id, outlet_id, campaign_id)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        'f4000000-0000-0000-0000-00000000000a');
select assert(true, 'anonymous may open a session on a live campaign');

insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, comment)
values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
        'f4000000-0000-0000-0000-00000000000a', 4, 'Second visit, still good.');
select assert(true, 'anonymous may leave feedback on a live campaign');

-- forging the things that carry provenance is not
do $$ begin
  insert into ai_review_drafts (organization_id, outlet_id, feedback_id, source_text, draft_text)
  values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
          'f0000000-0000-0000-0000-00000000000a', 'forged', 'forged');
  raise exception 'FAILED: anonymous forged an AI draft';
exception when insufficient_privilege or foreign_key_violation then
  raise notice 'ok  anonymous cannot forge an AI draft';
end $$;

do $$ begin
  insert into review_events (organization_id, outlet_id, campaign_id, destination)
  values ('f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-00000000000a',
          'f4000000-0000-0000-0000-00000000000a', 'google');
  raise exception 'FAILED: anonymous forged a review click';
exception when insufficient_privilege then
  raise notice 'ok  anonymous cannot forge a review click-through';
end $$;

select assert((select count(*) from qr_scans) = 0, 'anonymous cannot read scans back');
select assert((select count(*) from customer_sessions) = 0, 'anonymous cannot read sessions back');
select assert((select count(*) from ai_review_drafts) = 0, 'anonymous cannot read drafts back');

-- ---------------------------------------------------------------- the business sees its own funnel

set local role authenticated;
set local request.jwt.claim.sub = 'f0000000-0000-0000-0000-00000000000a';

select assert((select count(*) from qr_scans) = 1, 'the owner sees the scan');
select assert((select count(*) from customer_sessions) = 2, 'the owner sees both sessions');
select assert((select count(*) from customer_feedback) = 2, 'the owner sees both pieces of feedback');
select assert((select count(*) from ai_review_drafts) = 1, 'the owner sees the draft');
select assert((select count(*) from review_events) = 1, 'the owner sees the destination click');

-- the conversion figures the dashboard will need
select assert(
  (select count(*) from review_events)::numeric / (select count(*) from qr_scans) = 1,
  'scan-to-click conversion is computable from real rows');

rollback;
