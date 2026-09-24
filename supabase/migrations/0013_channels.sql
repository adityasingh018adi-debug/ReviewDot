-- Review channels: Zomato and Swiggy.
--
-- The destination enum was written around Google and the western platforms,
-- which leaves the two that matter most to an Indian café unrepresentable. They
-- are added here, alone, because a new enum value cannot be *used* in the same
-- transaction that adds it — the breakdown function that reads them lives in
-- 0014 for exactly that reason.

alter type review_destination add value if not exists 'zomato';
alter type review_destination add value if not exists 'swiggy';
