-- Colleagues: seeing them, and inviting them (0012_team.sql).
--
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/team_test.sql
--
-- The first two checks are the regressions this migration exists for. Before
-- it, an owner saw two members and one profile, and no code path could create
-- a membership for anyone but its own caller.

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
revoke all on rate_limits from anon, authenticated;

-- ---------------------------------------------------------------- fixtures

insert into auth.users (id, email, raw_user_meta_data) values
  ('e0000000-0000-0000-0000-00000000000a', 'owner@example.com',     '{"full_name":"Owner Person"}'),
  ('e0000000-0000-0000-0000-00000000000b', 'colleague@example.com', '{"full_name":"Colleague Person"}'),
  ('e0000000-0000-0000-0000-00000000000c', 'outsider@example.com',  '{"full_name":"Outside Person"}'),
  ('e0000000-0000-0000-0000-00000000000d', 'wrong@example.com',     '{"full_name":"Wrong Person"}');

insert into organizations (id, name, slug, short_code) values
  ('e1000000-0000-0000-0000-00000000000a', 'Team Org', 'team-org', 'TO'),
  ('e1000000-0000-0000-0000-00000000000b', 'Other Org', 'other-org', 'OO');

insert into organization_members (organization_id, user_id, role) values
  ('e1000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000a', 'OWNER'),
  ('e1000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000c', 'OWNER');

insert into subscriptions (organization_id, plan_code) values
  ('e1000000-0000-0000-0000-00000000000a', 'GROWTH'),
  ('e1000000-0000-0000-0000-00000000000b', 'FREE');

-- ---------------------------------------------------------------- seeing colleagues

set local role authenticated;
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000a';

-- before 0012 this returned 1: your own profile and nobody else's
select assert(
  (select count(*) from profiles) = 1,
  'with no colleagues yet, an owner sees only their own profile');

select assert(
  (select full_name from profiles where id = 'e0000000-0000-0000-0000-00000000000c') is null,
  'and never sees someone from another organization');

-- ---------------------------------------------------------------- inviting

select app_create_invite('e1000000-0000-0000-0000-00000000000a', 'Colleague@Example.com ', 'OUTLET_MANAGER') as token \gset

select set_config('test.token', :'token', true);
select assert(length(:'token') >= 32, 'inviting returns an unguessable token');
select assert(
  (select email from organization_invites where token = :'token') = 'colleague@example.com',
  'the address is normalised before it is stored');

-- the preview tells someone what they are joining, without naming anyone else
select assert(
  (select organization_name from app_invite_preview(:'token')) = 'Team Org',
  'the join page can name the workspace');

-- re-inviting the same person replaces the open invitation rather than failing
select app_create_invite('e1000000-0000-0000-0000-00000000000a', 'colleague@example.com', 'STAFF') as token2 \gset
select assert(
  (select count(*) from organization_invites where organization_id = 'e1000000-0000-0000-0000-00000000000a') = 1,
  'inviting the same address twice leaves one invitation');
select set_config('test.token2', :'token2', true);
select assert(:'token' <> :'token2', 'and issues a fresh token');

-- ---------------------------------------------------------------- who may invite

set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000c';
do $$ begin
  perform app_create_invite('e1000000-0000-0000-0000-00000000000a', 'someone@example.com');
  raise exception 'FAILED: an outsider invited someone into our workspace';
exception when insufficient_privilege then
  raise notice 'ok  someone outside the organization may not invite into it';
end $$;

-- ---------------------------------------------------------------- accepting

-- the wrong person, holding a valid link, gets nowhere
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000d';
do $$ begin
  perform app_accept_invite(current_setting('test.token2'));
  raise exception 'FAILED: the wrong account accepted an invitation';
exception when insufficient_privilege then
  raise notice 'ok  a forwarded link does not let the wrong account in';
end $$;

-- and the token the re-invite replaced is dead
do $$ begin
  perform app_accept_invite(current_setting('test.token'));
  raise exception 'FAILED: a replaced invitation token still worked';
exception when sqlstate 'P0002' then
  raise notice 'ok  re-inviting invalidates the previous link';
end $$;

-- the right person joins
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000b';
select app_accept_invite(:'token2') as joined \gset
select assert(:'joined' = 'e1000000-0000-0000-0000-00000000000a', 'accepting returns the workspace joined');

select assert(
  (select role from organization_members
    where organization_id = 'e1000000-0000-0000-0000-00000000000a'
      and user_id = 'e0000000-0000-0000-0000-00000000000b') = 'STAFF',
  'the invitation''s role is the one applied');

-- a spent invitation cannot be replayed
do $$ begin
  perform app_accept_invite(current_setting('test.token2'));
  raise exception 'FAILED: an invitation was accepted twice';
exception when invalid_parameter_value then
  raise notice 'ok  an invitation cannot be used twice';
end $$;

-- ---------------------------------------------------------------- colleagues, now

set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000a';
select assert((select count(*) from profiles) = 2, 'the owner now sees their colleague''s profile');
select assert(
  (select full_name from profiles where id = 'e0000000-0000-0000-0000-00000000000b') = 'Colleague Person',
  'with the name the team list needs');
select assert(
  (select email from profiles where id = 'e0000000-0000-0000-0000-00000000000b') = 'colleague@example.com',
  'and the email');

-- it reads both ways, and still stops at the organization boundary
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000b';
select assert((select count(*) from profiles) = 2, 'and the colleague sees the owner');
select assert(
  (select count(*) from profiles where id = 'e0000000-0000-0000-0000-00000000000c') = 0,
  'but neither of them sees anyone from another organization');

-- a staff member cannot see the invitations
do $$ begin
  if (select count(*) from organization_invites) > 0 then
    raise exception 'FAILED: staff read the invitation list';
  end if;
  raise notice 'ok  only admins see outstanding invitations';
end $$;

-- ---------------------------------------------------------------- seats

-- Other Org is on FREE, which allows two members; it has one, so one invite fits
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000c';
select app_create_invite('e1000000-0000-0000-0000-00000000000b', 'first@example.com') as seat1 \gset
select set_config('test.seat1', :'seat1', true);
select assert(length(:'seat1') >= 32, 'the second seat on the free plan may be invited');

do $$ begin
  perform app_create_invite('e1000000-0000-0000-0000-00000000000b', 'second@example.com');
  raise exception 'FAILED: the plan seat limit was exceeded';
exception when configuration_limit_exceeded then
  raise notice 'ok  an outstanding invitation counts against the seat limit';
end $$;

-- inviting someone already in the workspace is refused rather than dangling
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000a';
do $$ begin
  perform app_create_invite('e1000000-0000-0000-0000-00000000000a', 'colleague@example.com');
  raise exception 'FAILED: an existing member was invited again';
exception when unique_violation then
  raise notice 'ok  someone already in the workspace cannot be invited';
end $$;

-- ---------------------------------------------------------------- anonymous

set local role anon;
set local request.jwt.claim.sub = '';
select assert(
  (select organization_name from app_invite_preview(:'seat1')) = 'Other Org',
  'a signed-out visitor can see what they are being invited to');
do $$ begin
  perform app_accept_invite(current_setting('test.seat1'));
  raise exception 'FAILED: anonymous accepted an invitation';
exception when insufficient_privilege then
  raise notice 'ok  but cannot accept it without signing in';
end $$;

rollback;
