-- Tenant isolation tests. Run against a database with the migrations applied:
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Every check raises on failure, so a clean run means the policies hold.

\set QUIET on
begin;

-- ---------------------------------------------------------------- fixtures

insert into profiles (id, full_name, email) values
  ('11111111-1111-1111-1111-111111111111', 'Owner A', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Owner B', 'b@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'Outlet Manager A', 'm@example.com'),
  ('99999999-9999-9999-9999-999999999999', 'Platform Admin', 'admin@reviewdot.in');
update profiles set is_platform_admin = true where id = '99999999-9999-9999-9999-999999999999';

insert into organizations (id, name, slug, short_code) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Business A', 'business-a', 'BA'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Business B', 'business-b', 'BB');

insert into organization_members (id, organization_id, user_id, role) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'OWNER'),
  ('bbbbbbbb-1111-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'OWNER'),
  ('aaaaaaaa-2222-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'OUTLET_MANAGER');

insert into outlets (id, organization_id, name, short_code) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'Thane', 'TH'),
  ('a0000000-0000-0000-0000-00000000000b', 'aaaaaaaa-0000-0000-0000-000000000001', 'Bandra', 'BN'),
  ('b0000000-0000-0000-0000-00000000000c', 'bbbbbbbb-0000-0000-0000-000000000002', 'Pune', 'PN');

-- the outlet manager is assigned to Thane only
insert into team_assignments (organization_id, member_id, outlet_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000a');

insert into qr_campaigns (id, organization_id, outlet_id, name, public_id, reference_code, type, placement, status) values
  ('c0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'Table 04', 'live-a', 'RD-BA-TH-T04', 'table', 'Table 04', 'active'),
  ('c0000000-0000-0000-0000-0000000000f0', 'aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000b', 'Paused card', 'paused-a', 'RD-BA-BN-C01', 'counter', 'Counter', 'paused'),
  ('c0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-00000000000c', 'Table 01', 'live-b', 'RD-BB-PN-T01', 'table', 'Table 01', 'active');

insert into customer_feedback (id, organization_id, outlet_id, campaign_id, rating, comment) values
  ('f0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 5, 'A / Thane feedback'),
  ('f0000000-0000-0000-0000-00000000000b', 'aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-0000000000f0', 4, 'A / Bandra feedback'),
  ('f0000000-0000-0000-0000-00000000000c', 'bbbbbbbb-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-00000000000c', 'c0000000-0000-0000-0000-00000000000b', 3, 'B / Pune feedback');

grant select, insert, update on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------- helper

create or replace function assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'ok  %', label;
end;
$$;

-- ---------------------------------------------------------------- owner A

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select assert((select count(*) from organizations) = 1, 'owner A sees only their own organization');
select assert((select count(*) from outlets) = 2, 'owner A sees both of their outlets');
select assert((select count(*) from customer_feedback) = 2, 'owner A sees only their own feedback');
select assert(not exists (select 1 from customer_feedback where comment like 'B /%'), 'owner A cannot read business B feedback');
select assert((select count(*) from qr_campaigns) = 2, 'owner A sees only their own campaigns');

-- ---------------------------------------------------------------- owner B

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select assert((select count(*) from organizations) = 1, 'owner B sees only their own organization');
select assert((select count(*) from outlets) = 1, 'owner B sees only their own outlet');
select assert(not exists (select 1 from customer_feedback where comment like 'A /%'), 'owner B cannot read business A feedback');
select assert((select count(*) from qr_campaigns where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001') = 0, 'owner B cannot read business A campaigns');

-- ---------------------------------------------------------------- outlet manager

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select assert((select count(*) from outlets) = 1, 'outlet manager sees only their assigned outlet');
select assert((select name from outlets) = 'Thane', 'outlet manager sees Thane, not Bandra');
select assert((select count(*) from customer_feedback) = 1, 'outlet manager sees only assigned-outlet feedback');
select assert((select count(*) from qr_campaigns) = 1, 'outlet manager sees only assigned-outlet campaigns');

-- ---------------------------------------------------------------- anonymous customer

set local role anon;
set local request.jwt.claim.sub = '';

select assert((select count(*) from customer_feedback) = 0, 'anonymous cannot read any feedback');
select assert((select count(*) from organizations) = 0, 'anonymous cannot read organizations');
select assert((select count(*) from outlets) = 0, 'anonymous cannot read outlets');
select assert((select count(*) from qr_campaigns) = 0, 'anonymous cannot read campaigns');

-- a scan and feedback against a live campaign are allowed
insert into qr_scans (organization_id, outlet_id, campaign_id)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a');
insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, comment)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 5, 'anon submission');
select assert(true, 'anonymous may submit feedback through a live campaign');

-- a paused campaign must reject submissions
do $$
begin
  insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, comment)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-0000000000f0', 5, 'should fail');
  raise exception 'FAILED: paused campaign accepted feedback';
exception when insufficient_privilege then
  raise notice 'ok  paused campaign rejects feedback';
end;
$$;

-- forging another tenant's organization_id must not grant a foothold
do $$
begin
  insert into customer_feedback (organization_id, outlet_id, campaign_id, rating, comment)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', null, 5, 'no campaign');
  raise exception 'FAILED: feedback without a campaign accepted';
exception when insufficient_privilege then
  raise notice 'ok  feedback without a live campaign is rejected';
end;
$$;

-- AI drafts are server-side only: no client insert policy exists
do $$
begin
  insert into ai_review_drafts (organization_id, outlet_id, feedback_id, source_text, draft_text)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a',
            'f0000000-0000-0000-0000-00000000000a', 'customer words', 'polished draft');
  raise exception 'FAILED: anonymous forged an AI draft';
exception when insufficient_privilege then
  raise notice 'ok  anonymous cannot forge an AI review draft';
end;
$$;

-- a business user cannot write into another tenant by supplying its ids
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$
begin
  insert into outlets (organization_id, name, short_code)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'Rogue outlet', 'RG');
  raise exception 'FAILED: owner B created an outlet inside business A';
exception when insufficient_privilege then
  raise notice 'ok  owner B cannot create an outlet inside business A';
end;
$$;

-- ---------------------------------------------------------------- platform admin

set local role authenticated;
set local request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';
select assert((select count(*) from organizations) = 2, 'platform admin sees every organization');

rollback;
