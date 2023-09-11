-- Formatting does not currently work with parsing errors (even if ignored)
SET MODE LEGACY; -- noqa: PRS

-- 割引金額
SELECT c.a from b c; -- noqa: PRS

SELECT c.a from b c; -- noqa: L031

SELECT c.a
from b c; -- noqa: L031
