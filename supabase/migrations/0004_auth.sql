-- ReviewDot V2 — authentication wiring
--
-- 0001 created `profiles` as a mirror of auth.users, but nothing tied the two
-- together and nothing populated it: a real signup produced an auth.users row,
-- no profile, and therefore no membership — so every policy in 0002 denied the
-- user everything. This migration closes that gap.
--
--   1. profiles.id becomes a real foreign key to auth.users(id)
--   2. a trigger creates the profile when the user is created
--   3. app_create_organization() performs onboarding atomically
--
-- Onboarding is a security definer function rather than an insert policy on
-- `organizations`, because a policy permissive enough to create the first
-- organization would also let any authenticated user create unlimited
-- organizations with arbitrary short codes. The function owns that rule.

-- ---------------------------------------------------------------- 1. profiles → auth.users

-- Safe on an empty database and on one whose profiles all came from signups.
-- If this fails, profiles hold ids with no matching auth user; reconcile those
-- rows before re-running rather than dropping the constraint.
alter table profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- ---------------------------------------------------------------- 2. signup trigger

-- Runs as the definer so it can write a profile before the new user has any
-- policy context of their own. Reads only the metadata Supabase itself sets.
create or replace function app_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
    set email     = excluded.email,
        full_name = coalesce(profiles.full_name, excluded.full_name),
        avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_handle_new_user();

-- Keep the mirror honest when the user changes their email or profile metadata.
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function app_handle_new_user();

-- ---------------------------------------------------------------- 3. onboarding

-- Creates the organization, the caller's OWNER membership and the first outlet
-- in one transaction. Returns the new organization id.
--
-- Security definer because `organizations` has no insert policy by design. The
-- checks a policy would make are made here instead, explicitly:
--   * the caller must be authenticated
--   * the caller must not already own an organization
--   * slug and short code are derived and de-duplicated server-side, never
--     taken from the browser verbatim
create or replace function app_create_organization(
  org_name text,
  outlet_name text,
  org_category text default null,
  outlet_city text default null,
  outlet_country text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  new_org uuid;
  new_member uuid;
  base_slug text;
  candidate_slug text;
  candidate_code text;
  suffix integer := 0;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if trim(coalesce(org_name, '')) = '' then
    raise exception 'organization name is required' using errcode = '22023';
  end if;

  if trim(coalesce(outlet_name, '')) = '' then
    raise exception 'outlet name is required' using errcode = '22023';
  end if;

  -- One organization per owner keeps signup from being an unbounded write.
  -- Additional organizations are an invitation or a support action, not a form.
  if exists (
    select 1 from organization_members
    where user_id = uid and role = 'OWNER'
  ) then
    raise exception 'this account already owns an organization' using errcode = '23505';
  end if;

  -- slug: lowercase, alphanumeric and dashes, de-duplicated with a counter
  base_slug := nullif(trim(both '-' from regexp_replace(lower(org_name), '[^a-z0-9]+', '-', 'g')), '');
  base_slug := coalesce(base_slug, 'workspace');
  candidate_slug := base_slug;
  while exists (select 1 from organizations where slug = candidate_slug) loop
    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix;
  end loop;

  -- short code: initials, padded and de-duplicated, matching the check constraint
  candidate_code := app_short_code(org_name);
  suffix := 0;
  while exists (select 1 from organizations where short_code = candidate_code) loop
    suffix := suffix + 1;
    if suffix > 999 then
      raise exception 'could not allocate a unique short code' using errcode = '23505';
    end if;
    candidate_code := left(app_short_code(org_name), 3) || suffix::text;
  end loop;

  insert into organizations (name, slug, short_code, category, country, city)
  values (trim(org_name), candidate_slug, candidate_code, nullif(trim(coalesce(org_category, '')), ''),
          nullif(trim(coalesce(outlet_country, '')), ''), nullif(trim(coalesce(outlet_city, '')), ''))
  returning id into new_org;

  insert into organization_members (organization_id, user_id, role, accepted_at)
  values (new_org, uid, 'OWNER', now())
  returning id into new_member;

  insert into outlets (organization_id, name, short_code, city, country)
  values (new_org, trim(outlet_name), app_short_code(outlet_name),
          nullif(trim(coalesce(outlet_city, '')), ''), nullif(trim(coalesce(outlet_country, '')), ''));

  -- Every new workspace starts on the free plan; billing upgrades it later.
  insert into subscriptions (organization_id, plan_code, status, trial_ends_at)
  values (new_org, 'FREE', 'trialing', now() + interval '14 days')
  on conflict (organization_id) do nothing;

  return new_org;
end;
$$;

-- Uppercase initials, 2–6 chars, matching the short_code check constraint.
-- Mirrors shortCodeFor() in src/lib/qr-identity.ts.
create or replace function app_short_code(source text, max_length integer default 4)
returns text
language plpgsql immutable set search_path = public as $$
declare
  words text[];
  initials text;
  candidate text;
begin
  words := regexp_split_to_array(trim(regexp_replace(upper(coalesce(source, '')), '[^A-Z0-9]+', ' ', 'g')), '\s+');
  words := array_remove(words, '');

  if coalesce(array_length(words, 1), 0) = 0 then
    return 'XX';
  end if;

  initials := string_agg(left(word, 1), '') from unnest(words) as word;

  if length(initials) >= 2 then
    candidate := initials;
  else
    candidate := left(words[1], max_length);
  end if;

  candidate := left(candidate, max_length);
  if length(candidate) < 2 then
    candidate := rpad(candidate, 2, 'X');
  end if;
  return candidate;
end;
$$;

-- Only an authenticated user may onboard; anon must never reach it.
revoke all on function app_create_organization(text, text, text, text, text) from public, anon;
grant execute on function app_create_organization(text, text, text, text, text) to authenticated;
