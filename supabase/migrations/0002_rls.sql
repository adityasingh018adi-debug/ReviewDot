-- ReviewDot V2 — row level security
--
-- Tenant isolation is enforced here, in the database. The browser never supplies
-- organization_id for authorization; every policy derives it from the
-- authenticated user's membership. Frontend filtering is a convenience only.
--
-- Three audiences:
--   authenticated  business users, scoped to their organizations and outlets
--   anon           the public scan experience, which may insert feedback for an
--                  active campaign but may never read another customer's data
--   service_role   server-side jobs; bypasses RLS by design, never shipped to a client

-- ---------------------------------------------------------------- helpers

-- Organizations the current user belongs to.
create or replace function app_member_orgs()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select organization_id from organization_members where user_id = auth.uid()
$$;

-- The current user's role in one organization.
create or replace function app_role(org uuid)
returns org_role
language sql stable security definer set search_path = public as $$
  select role from organization_members
  where user_id = auth.uid() and organization_id = org
$$;

-- Roles that manage the whole organization rather than assigned outlets.
create or replace function app_is_org_admin(org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app_role(org) in ('OWNER', 'ADMIN'), false)
$$;

-- Outlet visibility: org admins see everything, others only assigned outlets.
create or replace function app_can_see_outlet(org uuid, outlet uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when app_is_org_admin(org) then true
    else exists (
      select 1
      from team_assignments ta
      join organization_members m on m.id = ta.member_id
      where ta.outlet_id = outlet and m.user_id = auth.uid() and m.organization_id = org
    )
  end
$$;

create or replace function app_is_platform_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from profiles where id = auth.uid()), false)
$$;

-- A campaign that the public scan experience is allowed to act on.
create or replace function app_campaign_is_live(campaign uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from qr_campaigns c
    join outlets o on o.id = c.outlet_id
    join organizations org on org.id = c.organization_id
    where c.id = campaign
      and c.status = 'active'
      and o.status = 'active'
      and org.is_suspended = false
  )
$$;

-- ---------------------------------------------------------------- enable RLS

alter table organizations        enable row level security;
alter table organization_members enable row level security;
alter table profiles             enable row level security;
alter table subscriptions        enable row level security;
alter table outlets              enable row level security;
alter table team_assignments     enable row level security;
alter table products             enable row level security;
alter table qr_campaigns         enable row level security;
alter table qr_scans             enable row level security;
alter table customer_sessions    enable row level security;
alter table customer_feedback    enable row level security;
alter table ai_review_drafts     enable row level security;
alter table review_events        enable row level security;
alter table review_responses     enable row level security;
alter table product_mentions     enable row level security;
alter table notifications        enable row level security;
alter table analytics_events     enable row level security;
alter table usage_counters       enable row level security;
alter table plans                enable row level security;

-- ---------------------------------------------------------------- plans

create policy plans_readable on plans
  for select using (is_public or app_is_platform_admin());

-- ---------------------------------------------------------------- identity

create policy profiles_self on profiles
  for select using (id = auth.uid() or app_is_platform_admin());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy organizations_read on organizations
  for select using (id in (select app_member_orgs()) or app_is_platform_admin());
create policy organizations_update on organizations
  for update using (app_is_org_admin(id)) with check (app_is_org_admin(id));

create policy members_read on organization_members
  for select using (organization_id in (select app_member_orgs()) or app_is_platform_admin());
create policy members_write on organization_members
  for all using (app_is_org_admin(organization_id))
  with check (app_is_org_admin(organization_id));

create policy assignments_read on team_assignments
  for select using (organization_id in (select app_member_orgs()));
create policy assignments_write on team_assignments
  for all using (app_is_org_admin(organization_id))
  with check (app_is_org_admin(organization_id));

create policy subscriptions_read on subscriptions
  for select using (organization_id in (select app_member_orgs()) or app_is_platform_admin());

-- ---------------------------------------------------------------- outlets

create policy outlets_read on outlets
  for select using (app_can_see_outlet(organization_id, id) or app_is_platform_admin());
create policy outlets_write on outlets
  for all using (app_is_org_admin(organization_id))
  with check (app_is_org_admin(organization_id));

create policy products_read on products
  for select using (organization_id in (select app_member_orgs()));
create policy products_write on products
  for all using (app_is_org_admin(organization_id))
  with check (app_is_org_admin(organization_id));

-- ---------------------------------------------------------------- QR

create policy campaigns_read on qr_campaigns
  for select using (app_can_see_outlet(organization_id, outlet_id) or app_is_platform_admin());
create policy campaigns_write on qr_campaigns
  for all using (
    app_is_org_admin(organization_id)
    or (app_role(organization_id) = 'OUTLET_MANAGER' and app_can_see_outlet(organization_id, outlet_id))
  )
  with check (
    app_is_org_admin(organization_id)
    or (app_role(organization_id) = 'OUTLET_MANAGER' and app_can_see_outlet(organization_id, outlet_id))
  );

create policy scans_read on qr_scans
  for select using (app_can_see_outlet(organization_id, outlet_id));
-- the public scan page records a scan, and may only do so for a live campaign
create policy scans_public_insert on qr_scans
  for insert to anon, authenticated
  with check (app_campaign_is_live(campaign_id));

create policy sessions_read on customer_sessions
  for select using (app_can_see_outlet(organization_id, outlet_id));
create policy sessions_public_insert on customer_sessions
  for insert to anon, authenticated
  with check (app_campaign_is_live(campaign_id));

-- ---------------------------------------------------------------- feedback

create policy feedback_read on customer_feedback
  for select using (app_can_see_outlet(organization_id, outlet_id));
create policy feedback_public_insert on customer_feedback
  for insert to anon, authenticated
  with check (campaign_id is not null and app_campaign_is_live(campaign_id));
-- staff triage: status, assignment and notes, within visible outlets
create policy feedback_update on customer_feedback
  for update using (app_can_see_outlet(organization_id, outlet_id))
  with check (app_can_see_outlet(organization_id, outlet_id));

create policy drafts_read on ai_review_drafts
  for select using (app_can_see_outlet(organization_id, outlet_id));

create policy review_events_read on review_events
  for select using (app_can_see_outlet(organization_id, outlet_id));

create policy responses_read on review_responses
  for select using (organization_id in (select app_member_orgs()));
create policy responses_write on review_responses
  for all using (organization_id in (select app_member_orgs()))
  with check (organization_id in (select app_member_orgs()));

create policy mentions_read on product_mentions
  for select using (organization_id in (select app_member_orgs()));

-- ---------------------------------------------------------------- ops

create policy notifications_own on notifications
  for select using (user_id = auth.uid());
create policy notifications_update on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy analytics_read on analytics_events
  for select using (organization_id in (select app_member_orgs()));

create policy usage_read on usage_counters
  for select using (organization_id in (select app_member_orgs()) or app_is_platform_admin());

-- AI drafts, review events and usage counters are written by server-side code
-- holding the service role, which bypasses RLS. No client-facing insert policy
-- exists for them on purpose: a browser must not be able to forge a draft,
-- a review click or usage metering.
