-- What the customer did, not what we wish had happened.
--
-- review_events recorded one fact — a destination was chosen — and the
-- dashboard had no way to say whether the customer shared the text through
-- their phone, copied it, or only opened the platform and wandered off. Those
-- are different things, and only the first two mean the review actually left
-- with them.
--
-- The enum carries all six statuses so there is one vocabulary, but only the
-- four that involve a destination are written here: review_events.destination
-- is not null by design. `generated` and `edited` already live on
-- ai_review_drafts, which is where the text and its provenance are — splitting
-- them across two tables would mean two places to ask the same question.
--
-- `submitted` is in the enum and is never written by the app. No platform
-- reports a posting back, so claiming one from a click would be inventing the
-- single number a business most wants to believe. It is here for the day a
-- platform confirms it, and for nothing else.

create type review_event_kind as enum (
  'generated',
  'edited',
  'shared',
  'copied',
  'opened',
  'submitted'
);

alter table review_events
  add column if not exists kind review_event_kind not null default 'opened';

-- Rows written before this migration recorded a click-through and nothing more,
-- which is exactly what 'opened' means; the default above already says so.

create index if not exists review_events_kind_idx
  on review_events (organization_id, kind, clicked_at desc);

comment on column review_events.kind is
  'What the customer did with the review. Never set to submitted from a click — no platform confirms posting.';
