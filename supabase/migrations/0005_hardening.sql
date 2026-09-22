-- ReviewDot V2 — policy and index hardening
--
-- Four things the audit found, none of which are visible until the database has
-- real volume or a real staff member behaving badly:
--
--   1. The hottest row-level-security path was unindexed.
--   2. review_responses and customer_feedback were writable far more widely
--      than permissions.ts intends.
--   3. There was no way to honour an erasure request except the service role.
--   4. Cascade deletes fell back to sequential scans.

-- ---------------------------------------------------------------- 1. indexes

-- app_can_see_outlet() filters `team_assignments where outlet_id = ?` and is
-- evaluated per row on every feedback, campaign, scan and session read. The only
-- index containing outlet_id is unique(member_id, outlet_id), whose leading
-- column is wrong for this lookup — so every visibility check was a scan.
create index if not exists team_assignments_outlet_idx on team_assignments (outlet_id);

-- Read policies filter on (organization_id, outlet_id); these tables had no
-- index that could serve it.
create index if not exists customer_sessions_org_outlet_idx
  on customer_sessions (organization_id, outlet_id, created_at desc);
create index if not exists ai_review_drafts_org_outlet_idx
  on ai_review_drafts (organization_id, outlet_id);

-- review_responses had exactly one index — its primary key — while its policy
-- filters on organization_id.
create index if not exists review_responses_org_idx on review_responses (organization_id);
create index if not exists review_responses_feedback_idx on review_responses (feedback_id);

-- Joins from a piece of feedback to everything hanging off it.
create index if not exists ai_review_drafts_feedback_idx on ai_review_drafts (feedback_id);
create index if not exists product_mentions_feedback_idx on product_mentions (feedback_id);
create index if not exists review_events_feedback_idx on review_events (feedback_id);
create index if not exists review_events_draft_idx on review_events (draft_id);
create index if not exists review_events_campaign_idx on review_events (campaign_id);
create index if not exists customer_feedback_campaign_idx on customer_feedback (campaign_id);
create index if not exists customer_feedback_session_idx on customer_feedback (session_id);
create index if not exists customer_feedback_assigned_idx
  on customer_feedback (assigned_to) where assigned_to is not null;
create index if not exists customer_sessions_scan_idx on customer_sessions (scan_id);
create index if not exists notifications_org_idx on notifications (organization_id);
create index if not exists qr_campaigns_product_idx
  on qr_campaigns (product_id) where product_id is not null;
create index if not exists qr_campaigns_created_by_idx on qr_campaigns (created_by);
create index if not exists review_responses_author_idx on review_responses (author_id);
create index if not exists subscriptions_plan_idx on subscriptions (plan_code);

-- Cascade paths from `outlets`. Every one of these tables carries outlet_id but
-- only inside a composite whose leading column is organization_id, which a
-- cascade from an outlet cannot use. Without them, deleting one outlet
-- sequentially scans each table while holding a lock on it.
--
-- On qr_scans and analytics_events this is a deliberate trade: one more index
-- to maintain on the two highest-volume insert paths, in exchange for outlet
-- and campaign deletion not locking those tables for minutes at scale. Revisit
-- when these tables are partitioned.
create index if not exists outlets_cascade_products_idx on products (outlet_id);
create index if not exists outlets_cascade_campaigns_idx on qr_campaigns (outlet_id);
create index if not exists outlets_cascade_feedback_idx on customer_feedback (outlet_id);
create index if not exists outlets_cascade_drafts_idx on ai_review_drafts (outlet_id);
create index if not exists outlets_cascade_events_idx on review_events (outlet_id);
create index if not exists outlets_cascade_scans_idx on qr_scans (outlet_id);
create index if not exists outlets_cascade_analytics_idx on analytics_events (outlet_id);
create index if not exists campaigns_cascade_analytics_idx on analytics_events (campaign_id);
create index if not exists outlets_cascade_sessions_idx on customer_sessions (outlet_id);
create index if not exists products_cascade_mentions_idx on product_mentions (product_id);

-- ---------------------------------------------------------------- 2. review_responses scope

-- Every other outlet-scoped table carries outlet_id so policies can authorize
-- without a join. review_responses was the exception, which is why its policy
-- fell back to plain organization membership — letting a STAFF member edit and
-- delete responses for outlets they cannot even see.
alter table review_responses add column if not exists outlet_id uuid references outlets(id) on delete cascade;

update review_responses r
   set outlet_id = f.outlet_id
  from customer_feedback f
 where f.id = r.feedback_id and r.outlet_id is null;

alter table review_responses alter column outlet_id set not null;

create index if not exists review_responses_outlet_idx on review_responses (organization_id, outlet_id);
-- and again with outlet_id leading, so a cascade from outlets can use it
create index if not exists outlets_cascade_responses_idx on review_responses (outlet_id);

drop policy if exists responses_read on review_responses;
drop policy if exists responses_write on review_responses;

create policy responses_read on review_responses
  for select using (app_can_see_outlet(organization_id, outlet_id));

-- You may reply to feedback in an outlet you can see, as yourself. Writing
-- another member's name onto a reply is not a thing the product does.
create policy responses_insert on review_responses
  for insert to authenticated
  with check (
    app_can_see_outlet(organization_id, outlet_id)
    and author_id = auth.uid()
  );

-- Editing is limited to your own reply; org admins can correct anyone's.
create policy responses_update on review_responses
  for update to authenticated
  using (
    app_can_see_outlet(organization_id, outlet_id)
    and (author_id = auth.uid() or app_is_org_admin(organization_id))
  )
  with check (
    app_can_see_outlet(organization_id, outlet_id)
    and (author_id = auth.uid() or app_is_org_admin(organization_id))
  );

create policy responses_delete on review_responses
  for delete to authenticated
  using (
    app_can_see_outlet(organization_id, outlet_id)
    and (author_id = auth.uid() or app_is_org_admin(organization_id))
  );

-- ---------------------------------------------------------------- 3. feedback triage scope

-- The feedback_update policy said "staff triage: status, assignment and notes",
-- but row level security cannot restrict columns, so it permitted rewriting the
-- customer's own comment and rating. That silently corrupts both the analytics
-- and the record of what the customer actually said.
--
-- Column privileges are the mechanism that can express this. service_role is
-- untouched and keeps full update rights for server-side jobs.
revoke update on customer_feedback from authenticated;
grant update (status, assigned_to) on customer_feedback to authenticated;

-- ---------------------------------------------------------------- 4. erasure

-- Personal data a customer may ask to have removed. Recording when it happened
-- keeps the audit trail honest without keeping the data.
alter table customer_feedback add column if not exists contact_erased_at timestamptz;

-- Erasure nulls the contact details and leaves the rating, comment and
-- timestamps intact, so honouring a request does not silently rewrite the
-- business's history. Full deletion is available separately for the cases that
-- genuinely require it.
create or replace function app_erase_feedback_contact(feedback uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  org uuid;
  outlet uuid;
begin
  select organization_id, outlet_id into org, outlet
    from customer_feedback where id = feedback;

  if org is null then
    raise exception 'no such feedback' using errcode = 'P0002';
  end if;

  if not app_is_org_admin(org) then
    raise exception 'only an owner or admin may erase contact details' using errcode = '42501';
  end if;

  update customer_feedback
     set contact_name = null,
         contact_email = null,
         contact_phone = null,
         contact_erased_at = now()
   where id = feedback;
end;
$$;

revoke all on function app_erase_feedback_contact(uuid) from public, anon;
grant execute on function app_erase_feedback_contact(uuid) to authenticated;

-- Outright deletion, for a request that erasure does not satisfy. Restricted to
-- org admins; the cascades take the drafts, mentions and responses with it and
-- null the review event, so no orphan survives.
create policy feedback_delete on customer_feedback
  for delete to authenticated
  using (app_is_org_admin(organization_id));

-- A member should be able to clear their own notifications.
create policy notifications_delete on notifications
  for delete to authenticated
  using (user_id = auth.uid());
