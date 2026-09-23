-- Policy tests for 0005_hardening.sql, plus the roles and tables the original
-- isolation suite never exercised: REGIONAL_MANAGER, STAFF, review responses,
-- feedback triage scope, erasure, products, subscriptions, notifications,
-- analytics and usage counters.
--
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/policy_test.sql
--
-- Runs in one transaction and rolls back. Every check raises on failure.

\set QUIET on
begin;

create or replace function assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then raise exception 'FAILED: %', label; end if;
  raise notice 'ok  %', label;
end;
$$;

-- Mirror what Supabase grants by default, then re-apply the column narrowing
-- from 0005 — a blanket `grant update` would quietly undo the thing under test.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
revoke update on customer_feedback from authenticated;
grant update (status, assigned_to) on customer_feedback to authenticated;

-- ---------------------------------------------------------------- fixtures

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'admin-a@example.com'),
  ('00000000-0000-0000-0000-0000000000a3', 'regional-a@example.com'),
  ('00000000-0000-0000-0000-0000000000a4', 'outletmgr-a@example.com'),
  ('00000000-0000-0000-0000-0000000000a5', 'staff-a@example.com'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@example.com');

insert into organizations (id, name, slug, short_code) values
  ('0a000000-0000-0000-0000-000000000001', 'Org A', 'org-a', 'OA'),
  ('0b000000-0000-0000-0000-000000000002', 'Org B', 'org-b', 'OB');

insert into subscriptions (organization_id, plan_code) values
  ('0a000000-0000-0000-0000-000000000001', 'GROWTH'),
  ('0b000000-0000-0000-0000-000000000002', 'FREE');

insert into organization_members (id, organization_id, user_id, role) values
  ('0a000000-1111-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'OWNER'),
  ('0a000000-1111-0000-0000-000000000002', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'ADMIN'),
  ('0a000000-1111-0000-0000-000000000003', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'REGIONAL_MANAGER'),
  ('0a000000-1111-0000-0000-000000000004', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a4', 'OUTLET_MANAGER'),
  ('0a000000-1111-0000-0000-000000000005', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', 'STAFF'),
  ('0b000000-1111-0000-0000-000000000001', '0b000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b1', 'OWNER');

insert into outlets (id, organization_id, name, short_code) values
  ('0a000000-2222-0000-0000-00000000000a', '0a000000-0000-0000-0000-000000000001', 'Thane', 'TH'),
  ('0a000000-2222-0000-0000-00000000000b', '0a000000-0000-0000-0000-000000000001', 'Bandra', 'BN'),
  ('0b000000-2222-0000-0000-00000000000c', '0b000000-0000-0000-0000-000000000002', 'Pune', 'PN');

-- regional manager covers both outlets; outlet manager and staff only Thane
insert into team_assignments (organization_id, member_id, outlet_id) values
  ('0a000000-0000-0000-0000-000000000001', '0a000000-1111-0000-0000-000000000003', '0a000000-2222-0000-0000-00000000000a'),
  ('0a000000-0000-0000-0000-000000000001', '0a000000-1111-0000-0000-000000000003', '0a000000-2222-0000-0000-00000000000b'),
  ('0a000000-0000-0000-0000-000000000001', '0a000000-1111-0000-0000-000000000004', '0a000000-2222-0000-0000-00000000000a'),
  ('0a000000-0000-0000-0000-000000000001', '0a000000-1111-0000-0000-000000000005', '0a000000-2222-0000-0000-00000000000a');

insert into products (id, organization_id, outlet_id, name) values
  ('0a000000-3333-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a', 'Mango Cheesecake'),
  ('0b000000-3333-0000-0000-000000000002', '0b000000-0000-0000-0000-000000000002', '0b000000-2222-0000-0000-00000000000c', 'Pune Special');

insert into customer_feedback (id, organization_id, outlet_id, product_id, rating, comment, contact_email, contact_phone) values
  ('0a000000-4444-0000-0000-00000000000a', '0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a', '0a000000-3333-0000-0000-000000000001', 5, 'Thane feedback', 'cust@example.com', '+911234567890'),
  ('0a000000-4444-0000-0000-00000000000b', '0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000b', null, 2, 'Bandra feedback', null, null),
  ('0b000000-4444-0000-0000-00000000000c', '0b000000-0000-0000-0000-000000000002', '0b000000-2222-0000-0000-00000000000c', null, 4, 'Pune feedback', null, null);

insert into product_mentions (organization_id, product_id, feedback_id, sentiment) values
  ('0a000000-0000-0000-0000-000000000001', '0a000000-3333-0000-0000-000000000001', '0a000000-4444-0000-0000-00000000000a', 'positive');

insert into notifications (organization_id, user_id, kind, title) values
  ('0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'feedback', 'For owner A'),
  ('0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', 'feedback', 'For staff A');

insert into analytics_events (organization_id, outlet_id, name) values
  ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a', 'scan'),
  ('0b000000-0000-0000-0000-000000000002', '0b000000-2222-0000-0000-00000000000c', 'scan');

insert into usage_counters (organization_id, metric, period_start, value) values
  ('0a000000-0000-0000-0000-000000000001', 'ai_drafts_per_month', date_trunc('month', now())::date, 12),
  ('0b000000-0000-0000-0000-000000000002', 'ai_drafts_per_month', date_trunc('month', now())::date, 3);

-- ---------------------------------------------------------------- REGIONAL_MANAGER

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';

select assert((select count(*) from outlets) = 2, 'regional manager sees both assigned outlets');
select assert((select count(*) from customer_feedback) = 2, 'regional manager sees feedback from both');
select assert((select count(*) from products) = 1, 'regional manager sees their organization products');
select assert((select count(*) from analytics_events) = 1, 'regional manager sees only their analytics');
select assert((select count(*) from usage_counters) = 1, 'regional manager sees only their usage counters');
select assert((select count(*) from subscriptions) = 1, 'regional manager sees their subscription');
select assert((select plan_code from subscriptions) = 'GROWTH', 'and it is their own plan');

-- not an org-wide role, so it may not create outlets
do $$ begin
  insert into outlets (organization_id, name, short_code)
  values ('0a000000-0000-0000-0000-000000000001', 'Andheri', 'AN');
  raise exception 'FAILED: regional manager created an outlet';
exception when insufficient_privilege then
  raise notice 'ok  regional manager may not create outlets';
end $$;

-- ---------------------------------------------------------------- STAFF

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';

select assert((select count(*) from outlets) = 1, 'staff sees only their assigned outlet');
select assert((select name from outlets) = 'Thane', 'and it is the right one');
select assert((select count(*) from customer_feedback) = 1, 'staff sees only assigned-outlet feedback');
select assert((select count(*) from notifications) = 1, 'staff sees only their own notifications');
select assert((select title from notifications) = 'For staff A', 'and not another member''s');

-- triage is allowed
update customer_feedback set status = 'reviewed' where id = '0a000000-4444-0000-0000-00000000000a';
select assert(
  (select status from customer_feedback where id = '0a000000-4444-0000-0000-00000000000a') = 'reviewed',
  'staff may triage feedback status');

-- but the customer's own words are not theirs to change
do $$ begin
  update customer_feedback set comment = 'rewritten' where id = '0a000000-4444-0000-0000-00000000000a';
  raise exception 'FAILED: staff rewrote a customer comment';
exception when insufficient_privilege then
  raise notice 'ok  staff may not rewrite a customer comment';
end $$;

do $$ begin
  update customer_feedback set rating = 1 where id = '0a000000-4444-0000-0000-00000000000a';
  raise exception 'FAILED: staff changed a customer rating';
exception when insufficient_privilege then
  raise notice 'ok  staff may not change a customer rating';
end $$;

do $$ begin
  delete from customer_feedback where id = '0a000000-4444-0000-0000-00000000000a';
  if found then raise exception 'FAILED: staff deleted feedback'; end if;
  raise notice 'ok  staff may not delete feedback';
end $$;

-- ---------------------------------------------------------------- review responses

-- staff may reply, as themselves, on an outlet they can see
insert into review_responses (organization_id, outlet_id, feedback_id, author_id, body)
values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a',
        '0a000000-4444-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a5', 'Thanks for visiting.');
select assert(true, 'staff may reply to feedback in their own outlet');

-- but not under someone else's name
do $$ begin
  insert into review_responses (organization_id, outlet_id, feedback_id, author_id, body)
  values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a',
          '0a000000-4444-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'Signed by the owner');
  raise exception 'FAILED: staff wrote a reply as another member';
exception when insufficient_privilege then
  raise notice 'ok  staff may not attribute a reply to someone else';
end $$;

-- nor on an outlet they are not assigned to
do $$ begin
  insert into review_responses (organization_id, outlet_id, feedback_id, author_id, body)
  values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000b',
          '0a000000-4444-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a5', 'Reaching too far');
  raise exception 'FAILED: staff replied on an outlet they cannot see';
exception when insufficient_privilege then
  raise notice 'ok  staff may not reply on an unassigned outlet';
end $$;

-- the outlet manager shares the outlet but not the reply
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
select assert((select count(*) from review_responses) = 1, 'outlet manager sees replies in their outlet');
do $$ begin
  update review_responses set body = 'edited by someone else';
  if found then raise exception 'FAILED: a peer edited another member''s reply'; end if;
  raise notice 'ok  a peer may not edit another member''s reply';
end $$;
do $$ begin
  delete from review_responses;
  if found then raise exception 'FAILED: a peer deleted another member''s reply'; end if;
  raise notice 'ok  a peer may not delete another member''s reply';
end $$;

-- the author may edit their own
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';
update review_responses set body = 'Thanks for visiting us.';
select assert(
  (select body from review_responses) = 'Thanks for visiting us.',
  'the author may edit their own reply');

-- and an org admin may correct anyone's
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
update review_responses set body = 'Corrected by an admin.';
select assert(
  (select body from review_responses) = 'Corrected by an admin.',
  'an org admin may correct any reply');

-- org B never sees any of it
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select assert((select count(*) from review_responses) = 0, 'another organization sees no replies');
select assert((select count(*) from product_mentions) = 0, 'another organization sees no product mentions');
select assert((select count(*) from usage_counters) = 1, 'another organization sees only its own usage');
select assert((select count(*) from analytics_events) = 1, 'another organization sees only its own analytics');

-- ---------------------------------------------------------------- campaign and outlet writes
--
-- These pin the alignment 0008 made: every role that permissions.ts says can
-- manage campaigns or outlets actually can, scoped to outlets it can see, and
-- no role gets more than the matrix says.

-- an outlet manager may create a code for their own outlet
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
insert into qr_campaigns (organization_id, outlet_id, name, public_id, reference_code, type)
values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a',
        'Table 04', 'mgr0000001', 'RD-OA-TH-T04', 'table');
select assert(true, 'an outlet manager may create a code for their own outlet');

-- but not for one they are not assigned to
do $$ begin
  insert into qr_campaigns (organization_id, outlet_id, name, public_id, reference_code, type)
  values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000b',
          'Reaching', 'mgr0000002', 'RD-OA-BN-T04', 'table');
  raise exception 'FAILED: outlet manager created a code for an unassigned outlet';
exception when insufficient_privilege then
  raise notice 'ok  an outlet manager may not create a code for another outlet';
end $$;

-- a regional manager covers both of their outlets
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
insert into qr_campaigns (organization_id, outlet_id, name, public_id, reference_code, type)
values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000b',
        'Bandra counter', 'reg0000001', 'RD-OA-BN-C01', 'counter');
select assert(true, 'a regional manager may create a code for an assigned outlet');

-- and may edit an outlet's details, which permissions.ts grants them
update outlets set city = 'Thane West' where id = '0a000000-2222-0000-0000-00000000000a';
select assert(
  (select city from outlets where id = '0a000000-2222-0000-0000-00000000000a') = 'Thane West',
  'a regional manager may edit an outlet they manage');

-- but creating a new outlet is still an org admin's job
do $$ begin
  insert into outlets (organization_id, name, short_code)
  values ('0a000000-0000-0000-0000-000000000001', 'Andheri', 'AN');
  raise exception 'FAILED: regional manager created an outlet';
exception when insufficient_privilege then
  raise notice 'ok  a regional manager may not create an outlet';
end $$;

-- staff manage nothing
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';
do $$ begin
  insert into qr_campaigns (organization_id, outlet_id, name, public_id, reference_code, type)
  values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a',
          'Staff code', 'stf0000001', 'RD-OA-TH-S01', 'table');
  raise exception 'FAILED: staff created a QR code';
exception when insufficient_privilege then
  raise notice 'ok  staff may not create a QR code';
end $$;

do $$ begin
  update outlets set city = 'Nowhere' where id = '0a000000-2222-0000-0000-00000000000a';
  if found then raise exception 'FAILED: staff edited an outlet'; end if;
  raise notice 'ok  staff may not edit an outlet';
end $$;

-- and another organization reaches none of it
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ begin
  insert into qr_campaigns (organization_id, outlet_id, name, public_id, reference_code, type)
  values ('0a000000-0000-0000-0000-000000000001', '0a000000-2222-0000-0000-00000000000a',
          'Trespass', 'oth0000001', 'RD-OA-TH-X01', 'table');
  raise exception 'FAILED: another organization created a code in ours';
exception when insufficient_privilege then
  raise notice 'ok  another organization may not create a code in ours';
end $$;

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';

-- ---------------------------------------------------------------- erasure

-- staff may not erase
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';
do $$ begin
  perform app_erase_feedback_contact('0a000000-4444-0000-0000-00000000000a');
  raise exception 'FAILED: staff erased contact details';
exception when insufficient_privilege then
  raise notice 'ok  staff may not erase contact details';
end $$;

-- an owner may, and the feedback itself survives
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select app_erase_feedback_contact('0a000000-4444-0000-0000-00000000000a');
select assert(
  (select contact_email is null and contact_phone is null and contact_name is null
     from customer_feedback where id = '0a000000-4444-0000-0000-00000000000a'),
  'erasure clears every contact field');
select assert(
  (select contact_erased_at is not null from customer_feedback where id = '0a000000-4444-0000-0000-00000000000a'),
  'erasure is recorded');
select assert(
  (select rating = 5 and comment = 'Thane feedback'
     from customer_feedback where id = '0a000000-4444-0000-0000-00000000000a'),
  'erasure leaves the rating and comment intact');

-- an owner of another organization may not erase ours
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ begin
  perform app_erase_feedback_contact('0a000000-4444-0000-0000-00000000000b');
  raise exception 'FAILED: another organization erased our data';
exception when insufficient_privilege then
  raise notice 'ok  another organization may not erase our contact details';
end $$;

-- ---------------------------------------------------------------- full deletion

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
delete from customer_feedback where id = '0a000000-4444-0000-0000-00000000000a';
select assert((select count(*) from customer_feedback) = 1, 'an owner may delete feedback outright');
select assert((select count(*) from review_responses) = 0, 'deleting feedback takes its replies with it');
select assert((select count(*) from product_mentions) = 0, 'and its product mentions');

-- ---------------------------------------------------------------- notifications

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';
delete from notifications;
select assert((select count(*) from notifications) = 0, 'a member may clear their own notifications');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select assert((select count(*) from notifications) = 1, 'and only their own — the owner''s survived');

rollback;
