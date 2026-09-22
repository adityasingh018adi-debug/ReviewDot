-- ReviewDot V2 — plan catalogue
--
-- Limits live in data, not in component branches: the app reads them through
-- BillingService, so changing a plan never means changing UI code.
-- -1 means unlimited.

insert into plans (code, name, monthly_price_cents, yearly_price_cents, sort_order, is_public, limits) values
  ('FREE', 'Free', 0, 0, 1, true, jsonb_build_object(
    'outlets', 1, 'qr_campaigns', 10, 'team_members', 2, 'ai_drafts_per_month', 50,
    'analytics_history_days', 30, 'exports', false, 'api_access', false, 'products', false
  )),
  ('STARTER', 'Starter', 99900, 999000, 2, true, jsonb_build_object(
    'outlets', 3, 'qr_campaigns', 50, 'team_members', 5, 'ai_drafts_per_month', 500,
    'analytics_history_days', 90, 'exports', true, 'api_access', false, 'products', true
  )),
  ('GROWTH', 'Growth', 249900, 2499000, 3, true, jsonb_build_object(
    'outlets', 10, 'qr_campaigns', -1, 'team_members', 15, 'ai_drafts_per_month', 2500,
    'analytics_history_days', 365, 'exports', true, 'api_access', false, 'products', true
  )),
  ('BUSINESS', 'Business', 599900, 5999000, 4, true, jsonb_build_object(
    'outlets', 50, 'qr_campaigns', -1, 'team_members', 50, 'ai_drafts_per_month', 10000,
    'analytics_history_days', 730, 'exports', true, 'api_access', true, 'products', true
  )),
  ('ENTERPRISE', 'Enterprise', 0, 0, 5, true, jsonb_build_object(
    'outlets', -1, 'qr_campaigns', -1, 'team_members', -1, 'ai_drafts_per_month', -1,
    'analytics_history_days', -1, 'exports', true, 'api_access', true, 'products', true
  ));
