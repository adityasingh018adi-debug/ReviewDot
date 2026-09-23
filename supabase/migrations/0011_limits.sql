-- ReviewDot V2 — durable rate limiting and usage metering
--
-- Two things that were held in a Node process and therefore were not really
-- held at all:
--
--   Rate limits lived in a Map. On more than one instance the real ceiling was
--   (instances × limit), and every cold start reset it. Fine as a brake on a
--   script, useless as a quota.
--
--   Usage was never recorded. usage_counters has existed since 0001 and has
--   never held a row, so plan limits were data nobody read.
--
-- Both move here, where there is one copy of the truth and it survives a
-- restart.

-- ---------------------------------------------------------------- rate limits

-- A fixed window per key. Rows are disposable: anything older than its window
-- is dead weight, and app_prune_rate_limits() clears it.
create table if not exists rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);

-- No client role touches this table. The function below is the only way in, and
-- it is security definer so it can write without granting anyone the ability to
-- rewrite their own counter.
alter table rate_limits enable row level security;
revoke all on rate_limits from public;

-- `from public` is not enough on Supabase: anon and authenticated are granted
-- explicitly by default privileges on the public schema, and a grant to a role
-- survives a revoke from PUBLIC. Named roles have to be named.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on rate_limits from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on rate_limits from authenticated';
  end if;
end $$;

/**
 * Counts one request against `p_key` and says whether it is allowed.
 *
 * Returns the remaining allowance and when the window frees up, so a caller can
 * set Retry-After honestly rather than guessing.
 *
 * The insert-then-update shape is deliberate: two requests racing on the same
 * key both land on the primary key and one takes the `do update`, so the count
 * cannot be lost the way a read-modify-write would lose it.
 */
create or replace function app_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public as $$
declare
  bucket timestamptz;
  current_count integer;
begin
  if p_max < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit' using errcode = '22023';
  end if;

  -- Truncate now() to the window, so every caller in the same window shares a row.
  bucket := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into rate_limits (key, window_start, count)
  values (p_key, bucket, 1)
  on conflict (key, window_start)
    do update set count = rate_limits.count + 1
  returning rate_limits.count into current_count;

  return query select
    current_count <= p_max,
    greatest(0, p_max - current_count),
    greatest(0, ceil(extract(epoch from (bucket + make_interval(secs => p_window_seconds)) - now()))::integer);
end;
$$;

revoke all on function app_rate_limit(text, integer, integer) from public, anon, authenticated;

-- Housekeeping. Safe to call from anywhere; nothing depends on old windows.
create or replace function app_prune_rate_limits(p_older_than interval default interval '1 day')
returns integer
language plpgsql security definer set search_path = public as $$
declare
  removed integer;
begin
  delete from rate_limits where window_start < now() - p_older_than;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function app_prune_rate_limits(interval) from public, anon, authenticated;

create index if not exists rate_limits_window_idx on rate_limits (window_start);

-- ---------------------------------------------------------------- usage

/**
 * Records metered usage for the current calendar month.
 *
 * Atomic for the same reason as above: the previous design incremented a
 * counter in JavaScript after reading it, which loses writes under any
 * concurrency at all.
 */
create or replace function app_record_usage(
  p_org uuid,
  p_metric text,
  p_amount integer default 1
)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  new_value integer;
begin
  insert into usage_counters (organization_id, metric, period_start, value)
  values (p_org, p_metric, date_trunc('month', now())::date, greatest(0, p_amount))
  on conflict (organization_id, metric, period_start)
    do update set value = usage_counters.value + greatest(0, p_amount)
  returning usage_counters.value into new_value;

  return new_value;
end;
$$;

revoke all on function app_record_usage(uuid, text, integer) from public, anon, authenticated;

/**
 * What this organization is using against what its plan allows.
 *
 * Counts that are a live total (outlets, campaigns, team members, products) are
 * counted here rather than metered, because a counter would drift the moment
 * anything is deleted. Only genuinely consumable things — AI drafts — come from
 * usage_counters.
 *
 * SECURITY INVOKER: the counts are the caller's own rows, so row level security
 * decides what is countable, and asking about another organization returns
 * zeroes.
 */
create or replace function app_quota_usage(p_org uuid)
returns table (metric text, used bigint)
language sql stable security invoker set search_path = public as $$
  select 'outlets', (select count(*) from outlets o
                      where o.organization_id = p_org and o.status <> 'archived')
  union all
  select 'qr_campaigns', (select count(*) from qr_campaigns c
                           where c.organization_id = p_org and c.status <> 'archived')
  union all
  select 'team_members', (select count(*) from organization_members m
                           where m.organization_id = p_org)
  union all
  select 'products', (select count(*) from products p
                       where p.organization_id = p_org and p.is_active)
  union all
  select 'ai_drafts_per_month', (select coalesce(sum(u.value), 0) from usage_counters u
                                  where u.organization_id = p_org
                                    and u.metric = 'ai_drafts_per_month'
                                    and u.period_start = date_trunc('month', now())::date);
$$;

revoke all on function app_quota_usage(uuid) from public, anon;
grant execute on function app_quota_usage(uuid) to authenticated;
