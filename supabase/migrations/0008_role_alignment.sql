-- ReviewDot V2 — align the write policies with the role matrix
--
-- src/lib/permissions.ts grants REGIONAL_MANAGER `outlet:update`,
-- `product:manage` and `campaign:create/update/archive`, and describes the role
-- as "manages the outlets assigned to them". The policies granted none of those
-- — outlets and products were org-admin only, and campaigns allowed
-- OUTLET_MANAGER but not REGIONAL_MANAGER.
--
-- The two disagreeing is the failure the matrix is meant to prevent: the UI
-- offers a button and the database refuses it, with nothing to tell the user
-- why. Writing the tests for the campaign form is what surfaced it.
--
-- The policies are widened to match the documented intent rather than the
-- matrix narrowed, because a regional manager who cannot create a QR code for
-- their own outlets is not the role the product describes. Scoping is unchanged
-- in substance: every new grant is still filtered by app_can_see_outlet, so a
-- regional manager reaches their assigned outlets and no others.

-- ---------------------------------------------------------------- helpers

-- Who may create and edit QR campaigns for an outlet.
create or replace function app_can_manage_campaigns(org uuid, outlet uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select app_is_org_admin(org)
     or (app_role(org) in ('REGIONAL_MANAGER', 'OUTLET_MANAGER')
         and app_can_see_outlet(org, outlet));
$$;

-- Who may edit an outlet's own details. Creating and archiving one stays with
-- the organization's admins: `outlet:create` and `outlet:archive` are not in a
-- regional manager's list.
create or replace function app_can_manage_outlet(org uuid, outlet uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select app_is_org_admin(org)
     or (app_role(org) = 'REGIONAL_MANAGER' and app_can_see_outlet(org, outlet));
$$;

-- ---------------------------------------------------------------- campaigns

drop policy if exists campaigns_write on qr_campaigns;

create policy campaigns_write on qr_campaigns
  for all to authenticated
  using (app_can_manage_campaigns(organization_id, outlet_id))
  with check (app_can_manage_campaigns(organization_id, outlet_id));

-- ---------------------------------------------------------------- outlets

drop policy if exists outlets_write on outlets;

create policy outlets_insert on outlets
  for insert to authenticated
  with check (app_is_org_admin(organization_id));

create policy outlets_update on outlets
  for update to authenticated
  using (app_can_manage_outlet(organization_id, id))
  with check (app_can_manage_outlet(organization_id, id));

create policy outlets_delete on outlets
  for delete to authenticated
  using (app_is_org_admin(organization_id));

-- ---------------------------------------------------------------- products

drop policy if exists products_write on products;

-- A product may be organization-wide (outlet_id null) or tied to one outlet. A
-- regional manager reaches the ones in outlets they can see; the shared ones
-- stay with the organization's admins.
create policy products_write on products
  for all to authenticated
  using (
    app_is_org_admin(organization_id)
    or (outlet_id is not null and app_can_manage_outlet(organization_id, outlet_id))
  )
  with check (
    app_is_org_admin(organization_id)
    or (outlet_id is not null and app_can_manage_outlet(organization_id, outlet_id))
  );
