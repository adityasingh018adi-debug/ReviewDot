-- ReviewDot V2 — multi-tenant schema
--
-- Every tenant-owned row carries organization_id; outlet-scoped rows also carry
-- outlet_id so row-level policies and team assignments can be enforced without
-- extra joins. Tenant isolation itself lives in 0002_rls.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums

create type org_role as enum ('OWNER', 'ADMIN', 'REGIONAL_MANAGER', 'OUTLET_MANAGER', 'STAFF');
create type outlet_status as enum ('active', 'paused', 'archived');
create type campaign_type as enum ('table', 'counter', 'receipt', 'packaging', 'delivery', 'staff', 'product', 'event', 'custom');
create type campaign_status as enum ('active', 'paused', 'archived');
create type sentiment as enum ('positive', 'neutral', 'negative');
create type feedback_status as enum ('new', 'reviewed', 'responded', 'resolved');
create type draft_status as enum ('generated', 'edited', 'approved', 'discarded');
create type review_destination as enum ('google', 'tripadvisor', 'facebook', 'instagram', 'custom');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'suspended');

-- ---------------------------------------------------------------- billing

create table plans (
  code text primary key,
  name text not null,
  monthly_price_cents integer not null default 0,
  yearly_price_cents integer not null default 0,
  currency text not null default 'INR',
  -- limits are data, never branching logic in components
  limits jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_public boolean not null default true
);

-- ---------------------------------------------------------------- tenants

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- short code used in human-readable QR identifiers, e.g. the LL in RD-LL-TH-T04
  short_code text not null unique check (short_code ~ '^[A-Z0-9]{2,6}$'),
  category text,
  country text,
  city text,
  logo_url text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  plan_code text not null references plans(code),
  status subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mirrors auth.users; profile data the app owns rather than the auth provider.
create table profiles (
  id uuid primary key,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role org_role not null default 'STAFF',
  invited_email text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ---------------------------------------------------------------- outlets

create table outlets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  -- short code for QR identifiers, e.g. the TH in RD-LL-TH-T04
  short_code text not null check (short_code ~ '^[A-Z0-9]{2,6}$'),
  address text,
  city text,
  country text,
  contact_number text,
  logo_url text,
  google_review_url text,
  review_destinations jsonb not null default '[]'::jsonb,
  status outlet_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, short_code)
);

-- Scopes a REGIONAL_MANAGER / OUTLET_MANAGER / STAFF member to specific outlets.
create table team_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references organization_members(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, outlet_id)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid references outlets(id) on delete cascade,
  name text not null,
  category text,
  price_cents integer,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- QR

create table qr_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  -- the scan URL segment: /r/{public_id}; unguessable, rotated by regenerating
  public_id text not null unique,
  -- human-readable label printed on collateral, e.g. RD-LL-TH-T04
  reference_code text not null,
  type campaign_type not null default 'table',
  placement text,
  destination review_destination not null default 'google',
  destination_url text,
  metadata jsonb not null default '{}'::jsonb,
  status campaign_status not null default 'active',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference_code)
);

create table qr_scans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  campaign_id uuid not null references qr_campaigns(id) on delete cascade,
  -- anonymous per-device identifier; no personal data, used for unique counts
  visitor_hash text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

-- One customer journey: scan → feedback → draft → destination click.
create table customer_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  campaign_id uuid not null references qr_campaigns(id) on delete cascade,
  scan_id uuid references qr_scans(id) on delete set null,
  visitor_hash text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------- feedback

create table customer_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  campaign_id uuid references qr_campaigns(id) on delete set null,
  session_id uuid references customer_sessions(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  comment text,
  sentiment sentiment,
  status feedback_status not null default 'new',
  assigned_to uuid references organization_members(id) on delete set null,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_review_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  feedback_id uuid not null references customer_feedback(id) on delete cascade,
  -- what the customer actually wrote, kept verbatim for provenance
  source_text text not null,
  draft_text text not null,
  final_text text,
  status draft_status not null default 'generated',
  model text,
  tokens_used integer,
  edited_by_customer boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table review_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  campaign_id uuid references qr_campaigns(id) on delete set null,
  feedback_id uuid references customer_feedback(id) on delete set null,
  draft_id uuid references ai_review_drafts(id) on delete set null,
  destination review_destination not null,
  destination_url text,
  -- the platform never confirms posting, so this records the click-through only
  clicked_at timestamptz not null default now()
);

create table review_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  feedback_id uuid not null references customer_feedback(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  tone text,
  ai_assisted boolean not null default false,
  created_at timestamptz not null default now()
);

create table product_mentions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  feedback_id uuid not null references customer_feedback(id) on delete cascade,
  sentiment sentiment,
  themes text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- ops

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table analytics_events (
  id bigserial primary key,
  organization_id uuid references organizations(id) on delete cascade,
  outlet_id uuid references outlets(id) on delete cascade,
  campaign_id uuid references qr_campaigns(id) on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Metered usage (AI calls, exports) for plan limits and platform billing.
create table usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  metric text not null,
  period_start date not null,
  value integer not null default 0,
  unique (organization_id, metric, period_start)
);

-- ---------------------------------------------------------------- indexes

create index on organization_members (user_id);
create index on organization_members (organization_id, role);
create index on team_assignments (organization_id, member_id);
create index on outlets (organization_id, status);
create index on products (organization_id, outlet_id);
create index on qr_campaigns (organization_id, outlet_id, status);
create index on qr_scans (organization_id, created_at desc);
create index on qr_scans (campaign_id, created_at desc);
create index on qr_scans (organization_id, outlet_id, created_at desc);
create index on customer_sessions (campaign_id, created_at desc);
create index on customer_feedback (organization_id, created_at desc);
create index on customer_feedback (organization_id, outlet_id, created_at desc);
create index on customer_feedback (organization_id, status) where status <> 'resolved';
create index on customer_feedback (product_id) where product_id is not null;
create index on ai_review_drafts (organization_id, created_at desc);
create index on review_events (organization_id, clicked_at desc);
create index on review_events (organization_id, outlet_id, clicked_at desc);
create index on product_mentions (organization_id, product_id);
create index on notifications (user_id, read_at);
create index on analytics_events (organization_id, created_at desc);

-- ---------------------------------------------------------------- triggers

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();
create trigger outlets_updated_at before update on outlets
  for each row execute function set_updated_at();
create trigger qr_campaigns_updated_at before update on qr_campaigns
  for each row execute function set_updated_at();
create trigger customer_feedback_updated_at before update on customer_feedback
  for each row execute function set_updated_at();
