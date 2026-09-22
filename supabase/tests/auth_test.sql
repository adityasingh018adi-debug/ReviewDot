-- Authentication and onboarding tests for 0004_auth.sql.
-- Run against a database with every migration applied:
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/auth_test.sql
-- The whole run is one transaction and rolls back, so it is safe against a
-- development database. Every check raises on failure.

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

-- ---------------------------------------------------------------- signup trigger

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-1111-1111-111111111111', 'owner@example.com', '{"full_name": "Ritika Shah"}'),
  ('a2222222-2222-2222-2222-222222222222', 'second@example.com', '{}'),
  ('a3333333-3333-3333-3333-333333333333', 'oauth@example.com',
     '{"name": "Google Person", "avatar_url": "https://example.com/a.png"}');

select assert(
  (select count(*) from profiles where id = 'a1111111-1111-1111-1111-111111111111') = 1,
  'signing up creates a profile');

select assert(
  (select full_name from profiles where id = 'a1111111-1111-1111-1111-111111111111') = 'Ritika Shah',
  'the profile takes full_name from user metadata');

select assert(
  (select email from profiles where id = 'a1111111-1111-1111-1111-111111111111') = 'owner@example.com',
  'the profile mirrors the auth email');

-- Google returns `name` and `avatar_url` rather than `full_name`
select assert(
  (select full_name from profiles where id = 'a3333333-3333-3333-3333-333333333333') = 'Google Person',
  'an OAuth signup falls back to the name claim');
select assert(
  (select avatar_url from profiles where id = 'a3333333-3333-3333-3333-333333333333') is not null,
  'an OAuth signup keeps the avatar');

select assert(
  (select is_platform_admin from profiles where id = 'a1111111-1111-1111-1111-111111111111') = false,
  'a new profile is never a platform admin');

-- changing the email in auth keeps the mirror in step
update auth.users set email = 'renamed@example.com' where id = 'a2222222-2222-2222-2222-222222222222';
select assert(
  (select email from profiles where id = 'a2222222-2222-2222-2222-222222222222') = 'renamed@example.com',
  'changing the auth email updates the profile');

-- ---------------------------------------------------------------- short codes

select assert(app_short_code('Love & Latte') = 'LL', 'short code takes initials');
select assert(app_short_code('Thane') = 'THAN', 'short code falls back to the first word');
select assert(app_short_code('') = 'XX', 'short code has a safe fallback');
select assert(app_short_code('A') = 'AX', 'short code is padded to the minimum length');
select assert(app_short_code('Love & Latte') ~ '^[A-Z0-9]{2,6}$', 'short code matches the column constraint');

-- ---------------------------------------------------------------- onboarding

set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';

select app_create_organization('Love & Latte', 'Thane', 'Cafe', 'Thane', 'India') as org \gset

select assert((select count(*) from organizations where id = :'org') = 1, 'onboarding creates the organization');
select assert((select slug from organizations where id = :'org') = 'love-latte', 'onboarding derives a slug');
select assert((select short_code from organizations where id = :'org') = 'LL', 'onboarding derives a short code');

select assert(
  (select role from organization_members
   where organization_id = :'org' and user_id = 'a1111111-1111-1111-1111-111111111111') = 'OWNER',
  'onboarding makes the caller the owner');

select assert(
  (select accepted_at from organization_members
   where organization_id = :'org' and user_id = 'a1111111-1111-1111-1111-111111111111') is not null,
  'the owner membership is already accepted');

select assert((select count(*) from outlets where organization_id = :'org') = 1, 'onboarding creates the first outlet');
select assert((select name from outlets where organization_id = :'org') = 'Thane', 'the outlet keeps its name');

select assert(
  (select plan_code from subscriptions where organization_id = :'org') = 'FREE',
  'a new workspace starts on the free plan');

-- the owner can immediately see their workspace through RLS
select assert((select count(*) from organizations) = 1, 'the new owner sees their organization');
select assert((select count(*) from outlets) = 1, 'the new owner sees their outlet');

-- and can create more outlets, because they are an org admin
insert into outlets (organization_id, name, short_code) values (:'org', 'Bandra', 'BN');
select assert((select count(*) from outlets) = 2, 'the owner may create further outlets');

-- ---------------------------------------------------------------- onboarding guards

do $$ begin
  perform app_create_organization('Second Workspace', 'Anywhere');
  raise exception 'FAILED: one account created two organizations';
exception when unique_violation then
  raise notice 'ok  an account may only own one organization';
end $$;

do $$ begin
  perform app_create_organization('   ', 'Anywhere');
  raise exception 'FAILED: a blank organization name was accepted';
exception when invalid_parameter_value then
  raise notice 'ok  a blank organization name is refused';
end $$;

-- a different signed-in user gets their own workspace, and sees only it
set local request.jwt.claim.sub = 'a2222222-2222-2222-2222-222222222222';
select app_create_organization('Second Co', 'Pune') as org_b \gset
select assert((select count(*) from organizations) = 1, 'a second owner sees only their own organization');
select assert((select id from organizations) = :'org_b', 'and it is the one they just created');
select assert(
  (select short_code from organizations where id = :'org_b') <> 'LL',
  'a colliding short code is de-duplicated');

-- ---------------------------------------------------------------- anonymous

set local role anon;
set local request.jwt.claim.sub = '';

do $$ begin
  perform app_create_organization('Anonymous Co', 'Nowhere');
  raise exception 'FAILED: anonymous created an organization';
exception
  when insufficient_privilege then raise notice 'ok  anonymous may not execute onboarding';
  when sqlstate '28000' then raise notice 'ok  anonymous may not execute onboarding';
end $$;

rollback;
