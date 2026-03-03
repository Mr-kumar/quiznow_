-- Add XOR constraint to PlanAccess table
-- This ensures that either examId OR seriesId is set, but not both

ALTER TABLE "PlanAccess"
ADD CONSTRAINT planaccess_exam_xor_series_chk
CHECK (
  ("examId" IS NOT NULL AND "seriesId" IS NULL)
  OR
  ("examId" IS NULL AND "seriesId" IS NOT NULL)
);