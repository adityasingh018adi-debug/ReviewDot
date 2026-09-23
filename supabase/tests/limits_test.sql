-- Rate limiting and usage metering from 0011_limits.sql.
--
--   psql -d reviewdot -v ON_ERROR_STOP=1 -f supabase/tests/limits_test.sql
--
-- The point of moving these into the database is that they survive a restart
-- and are shared across instances. The checks that matter are therefore about
-- atomicity and reach: a counter that loses writes under concurrency, or a
-- table a caller can rewrite, is no better than the Map it replaced.

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
revoke update on customer_feedback from authenticated;
grant update (status, assigned_to) on customer_feedback to authenticated;
-- mirror 0011: the counter table is reachable by no client role
revoke all on rate_limits from anon, authenticated;

-- ---------------------------------------------------------------- fixtures

insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-00000000000a', 'owner-a@example.com'),
  ('d0000000-0000-0000-0000-00000000000b', 'owner-b@example.com');

insert into organizations (id, name, slug, short_code) values
  ('d1000000-0000-0000-0000-00000000000a', 'Org A', 'limits-a', 'LA'),
  ('d1000000-0000-0000-0000-00000000000b', 'Org B', 'limits-b', 'LB');

insert into organization_members (organization_id, user_id, role) values
  ('d1000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-00000000000a', 'OWNER'),
  ('d1000000-0000-0000-0000-00000000000b', 'd0000000-0000-0000-0000-00000000000b', 'OWNER');

insert into subscriptions (organization_id, plan_code) values
  ('d1000000-0000-0000-0000-00000000000a', 'FREE'),
  ('d1000000-0000-0000-0000-00000000000b', 'GROWTH');

insert into outlets (id, organization_id, name, short_code) values
  ('d2000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-00000000000a', 'One', 'ON'),
  ('d2000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-00000000000b', 'Two', 'TW');

-- ---------------------------------------------------------------- rate limits

select assert((select allowed from app_rate_limit('k1', 2, 60)), 'the first request is allowed');
select assert((select allowed from app_rate_limit('k1', 2, 60)), 'and the second');
select assert(not (select allowed from app_rate_limit('k1', 2, 60)), 'the third is refused');

select assert(
  (select retry_after_seconds from app_rate_limit('k1', 2, 60)) between 1 and 60,
  'a refusal says how long to wait');

select assert((select allowed from app_rate_limit('k2', 2, 60)), 'a different key has its own window');

-- Counting must not lose writes. A read-modify-write in application code would.
-- A key unique to this run, and summed across windows: the loop could in
-- principle straddle a window boundary, and a development database may already
-- hold rows from earlier runs.
do $$ begin
  for i in 1..200 loop perform app_rate_limit('burst-test-run', 1000, 60); end loop;
end $$;
select assert(
  (select sum(count) from rate_limits where key = 'burst-test-run') = 200,
  'two hundred increments record two hundred, not fewer');

select assert(
  (select count(*) from app_rate_limit('k1', 2, 60)) = 1,
  'the limiter always answers with exactly one row');

-- Nonsense arguments are refused rather than silently allowing everything.
do $$ begin
  perform app_rate_limit('k3', 0, 60);
  raise exception 'FAILED: a zero limit was accepted';
exception when invalid_parameter_value then
  raise notice 'ok  a nonsensical limit is refused rather than treated as unlimited';
end $$;

-- Pruning clears spent windows and nothing else.
insert into rate_limits (key, window_start, count) values ('old-window', now() - interval '3 days', 5);
select assert(app_prune_rate_limits(interval '1 day') >= 1, 'pruning removes spent windows');
select assert(
  (select count(*) from rate_limits where key = 'old-window') = 0,
  'and the spent one is gone');
select assert(
  (select sum(count) from rate_limits where key = 'burst-test-run') = 200,
  'while the current window is left alone');

-- No client role can reach the counter, in either direction.
set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-0000-0000-00000000000a';

do $$ begin
  perform count(*) from rate_limits;
  raise exception 'FAILED: a signed-in user read the rate limit table';
exception when insufficient_privilege then
  raise notice 'ok  a signed-in user cannot read the rate limit table';
end $$;

do $$ begin
  perform app_rate_limit('k1', 999999, 60);
  raise exception 'FAILED: a signed-in user arbitrated their own limit';
exception when insufficient_privilege then
  raise notice 'ok  a signed-in user cannot call the limiter directly';
end $$;

-- ---------------------------------------------------------------- usage

reset role;

select assert(app_record_usage('d1000000-0000-0000-0000-00000000000a', 'ai_drafts_per_month') = 1,
  'the first use of the month records one');
select assert(app_record_usage('d1000000-0000-0000-0000-00000000000a', 'ai_drafts_per_month', 4) = 5,
  'and adds to what is already there');

do $$ begin
  for i in 1..100 loop perform app_record_usage('d1000000-0000-0000-0000-00000000000a', 'ai_drafts_per_month'); end loop;
end $$;
select assert(
  (select value from usage_counters
    where organization_id = 'd1000000-0000-0000-0000-00000000000a'
      and metric = 'ai_drafts_per_month') = 105,
  'a hundred concurrent uses record a hundred');

select assert(
  (select count(*) from usage_counters
    where organization_id = 'd1000000-0000-0000-0000-00000000000a'
      and metric = 'ai_drafts_per_month') = 1,
  'usage for one month lives in one row');

-- ---------------------------------------------------------------- quota usage

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-0000-0000-00000000000a';

select assert(
  (select used from app_quota_usage('d1000000-0000-0000-0000-00000000000a') where metric = 'outlets') = 1,
  'quota usage counts live outlets rather than a stored counter');

select assert(
  (select used from app_quota_usage('d1000000-0000-0000-0000-00000000000a') where metric = 'team_members') = 1,
  'and team members');

select assert(
  (select used from app_quota_usage('d1000000-0000-0000-0000-00000000000a') where metric = 'ai_drafts_per_month') = 105,
  'and reads consumables from the meter');

-- archiving an outlet frees the allowance, which a stored counter would not
update outlets set status = 'archived' where id = 'd2000000-0000-0000-0000-00000000000a';
select assert(
  (select used from app_quota_usage('d1000000-0000-0000-0000-00000000000a') where metric = 'outlets') = 0,
  'archiving an outlet frees the allowance immediately');

-- and another organization's usage is not ours to see
select assert(
  (select used from app_quota_usage('d1000000-0000-0000-0000-00000000000b') where metric = 'outlets') = 0,
  'asking about another organization''s usage returns zero');

set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  perform app_quota_usage('d1000000-0000-0000-0000-00000000000a');
  raise exception 'FAILED: anonymous read quota usage';
exception when insufficient_privilege then
  raise notice 'ok  anonymous may not read quota usage';
end $$;

do $$ begin
  perform app_record_usage('d1000000-0000-0000-0000-00000000000a', 'ai_drafts_per_month');
  raise exception 'FAILED: anonymous wrote a usage meter';
exception when insufficient_privilege then
  raise notice 'ok  anonymous may not write a usage meter';
end $$;

rollback;
