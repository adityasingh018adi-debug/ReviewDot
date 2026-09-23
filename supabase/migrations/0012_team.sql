-- ReviewDot V2 — colleagues
--
-- Two holes the Phase 4 team page had, both found by auditing the deployed
-- build rather than by any test:
--
--   1. profiles_self lets you read only your own profile, so every colleague in
--      the team list came back null and rendered as "Pending invite" with a
--      blank email.
--
--   2. Nothing could create a membership for anyone but the caller.
--      app_create_organization() makes one for whoever runs it and refuses if
--      they already own an organization, so a colleague who signed up got their
--      own empty workspace. The roles, assignments and team UI were all
--      unreachable.

-- ---------------------------------------------------------------- 1. seeing colleagues

-- Security definer for the same reason every other helper here is: a subquery
-- over organization_members inside a policy on profiles would have that table's
-- own policies applied to it, and those reference profiles.
create or replace function app_shares_organization(other_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from organization_members mine
    join organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = other_user
  )
$$;

-- SELECT policies are OR-ed, so this widens profiles_self rather than replacing
-- it: your own profile, plus anyone you share an organization with. That is the
-- whole team list and nothing beyond it — a profile of someone in another
-- organization stays invisible.
--
-- Worth naming plainly: this exposes a colleague's name, email, phone and
-- avatar to the rest of their organization. Row level security is row level, so
-- a policy that returns the row returns every column of it. For a team
-- workspace that is the expected trade.
create policy profiles_colleagues on profiles
  for select using (app_shares_organization(id));

-- ---------------------------------------------------------------- 2. invitations

-- A separate table rather than a half-filled organization_members row:
-- member.user_id is NOT NULL and every policy in 0002 joins on it, so making it
-- nullable to hold pending invites would make each of those policies reason
-- about a null user. An invite is a different thing from a membership and gets
-- its own table.
create table if not exists organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  -- stored lowercase; matched against the accepting user's own auth email
  email text not null,
  role org_role not null default 'STAFF',
  -- the /join/{token} segment. Unguessable, like a scan code.
  token text not null unique,
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references profiles(id) on delete set null,
  unique (organization_id, email)
);

create index if not exists organization_invites_org_idx on organization_invites (organization_id);

alter table organization_invites enable row level security;

-- Admins of the organization can see and withdraw their own invitations. There
-- is deliberately no client insert policy: creating one goes through the
-- function below, which is where the quota and the role rules live.
create policy invites_read on organization_invites
  for select using (app_is_org_admin(organization_id));
create policy invites_delete on organization_invites
  for delete using (app_is_org_admin(organization_id));

/**
 * Invites someone by email. Returns the token to build a link from.
 *
 * Security definer because it has to check things a policy cannot express: the
 * caller is an admin, the plan still has room, and nobody is being invited to
 * an organization they are already in. Re-inviting the same address replaces
 * the open invitation rather than erroring, which is what someone clicking
 * "invite" twice means.
 */
create or replace function app_create_invite(
  p_org uuid,
  p_email text,
  p_role org_role default 'STAFF'
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  normalised text := lower(trim(p_email));
  new_token text;
  seats integer;
  used integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if not app_is_org_admin(p_org) then
    raise exception 'only an owner or admin may invite people' using errcode = '42501';
  end if;

  if normalised !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'that is not a valid email address' using errcode = '22023';
  end if;

  -- Already a member? Say so rather than creating an invite that can never be
  -- accepted.
  if exists (
    select 1 from organization_members m
    join profiles p on p.id = m.user_id
    where m.organization_id = p_org and lower(p.email) = normalised
  ) then
    raise exception 'that person is already in this workspace' using errcode = '23505';
  end if;

  -- Seats are counted as members plus invitations still outstanding, so a burst
  -- of invites cannot take an organization past its plan.
  select coalesce((pl.limits ->> 'team_members')::integer, -1)
    into seats
    from subscriptions s
    join plans pl on pl.code = s.plan_code
   where s.organization_id = p_org;

  if seats is not null and seats <> -1 then
    select (select count(*) from organization_members where organization_id = p_org)
         + (select count(*) from organization_invites
             where organization_id = p_org and accepted_at is null and expires_at > now())
      into used;

    if used >= seats then
      raise exception 'your plan includes % team members', seats using errcode = '53400';
    end if;
  end if;

  new_token := encode(gen_random_bytes(24), 'hex');

  insert into organization_invites (organization_id, email, role, token, invited_by)
  values (p_org, normalised, p_role, new_token, auth.uid())
  on conflict (organization_id, email) do update
    set role = excluded.role,
        token = excluded.token,
        invited_by = excluded.invited_by,
        created_at = now(),
        expires_at = now() + interval '14 days',
        accepted_at = null,
        accepted_by = null;

  return new_token;
end;
$$;

/**
 * Accepts an invitation and returns the organization joined.
 *
 * The token alone is not enough: the accepting account's own email has to match
 * the address that was invited. A link forwarded to the wrong person, or found
 * in a shared inbox, does not let them into the workspace.
 */
create or replace function app_accept_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  invite organization_invites%rowtype;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into invite from organization_invites where token = p_token;

  if invite.id is null then
    raise exception 'that invitation link is not valid' using errcode = 'P0002';
  end if;
  if invite.accepted_at is not null then
    raise exception 'that invitation has already been used' using errcode = '22023';
  end if;
  if invite.expires_at <= now() then
    raise exception 'that invitation has expired' using errcode = '22023';
  end if;

  select lower(email) into caller_email from profiles where id = auth.uid();

  if caller_email is null or caller_email <> invite.email then
    raise exception 'this invitation was sent to a different address' using errcode = '42501';
  end if;

  insert into organization_members (organization_id, user_id, role, invited_email, accepted_at)
  values (invite.organization_id, auth.uid(), invite.role, invite.email, now())
  on conflict (organization_id, user_id) do nothing;

  update organization_invites
     set accepted_at = now(), accepted_by = auth.uid()
   where id = invite.id;

  return invite.organization_id;
end;
$$;

-- Lets the join page tell someone what they are being invited to before they
-- sign in, without exposing who else is in it. Returns nothing for a token that
-- is unknown, spent or expired.
create or replace function app_invite_preview(p_token text)
returns table (organization_name text, email text, role org_role)
language sql stable security definer set search_path = public as $$
  select o.name, i.email, i.role
    from organization_invites i
    join organizations o on o.id = i.organization_id
   where i.token = p_token
     and i.accepted_at is null
     and i.expires_at > now();
$$;

revoke all on function app_create_invite(uuid, text, org_role) from public, anon;
revoke all on function app_accept_invite(text) from public, anon;
grant execute on function app_create_invite(uuid, text, org_role) to authenticated;
grant execute on function app_accept_invite(text) to authenticated;
-- the preview runs before sign-in, so anon needs it
grant execute on function app_invite_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------- 3. explicit service_role grants
--
-- 0011 revoked these from PUBLIC, which on a plain Postgres leaves service_role
-- with no way to call them at all — the durable rate limiter and the usage
-- meter would both fail into their fallbacks, silently. It works on Supabase
-- only because its default privileges grant service_role explicitly, which the
-- revoke happens to leave alone. Relying on that is not the same as saying it.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function app_rate_limit(text, integer, integer) to service_role';
    execute 'grant execute on function app_prune_rate_limits(interval) to service_role';
    execute 'grant execute on function app_record_usage(uuid, text, integer) to service_role';
  end if;
end $$;
