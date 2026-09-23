-- ReviewDot V2 — per-campaign reporting
--
-- "Which code is actually working?" is the question the QR page exists to
-- answer, and it needs scan and feedback counts per campaign. Same rules as
-- 0006: aggregate here rather than in the browser, and SECURITY INVOKER so row
-- level security decides which campaigns the caller can see at all.

create or replace function app_campaign_breakdown(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_outlet uuid default null
)
returns table (campaign_id uuid, scans bigint, reviews bigint, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select
    c.id,
    (select count(*) from qr_scans s
      where s.campaign_id = c.id and s.created_at >= p_from and s.created_at <= p_to),
    (select count(*) from customer_feedback f
      where f.campaign_id = c.id and f.created_at >= p_from and f.created_at <= p_to),
    (select count(*) from review_events e
      where e.campaign_id = c.id and e.clicked_at >= p_from and e.clicked_at <= p_to)
  from qr_campaigns c
  where c.organization_id = p_org
    and (p_outlet is null or c.outlet_id = p_outlet)
    and c.status <> 'archived';
$$;

revoke all on function app_campaign_breakdown(uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function app_campaign_breakdown(uuid, timestamptz, timestamptz, uuid) to authenticated;
