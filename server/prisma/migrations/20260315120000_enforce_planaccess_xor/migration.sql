-- Enforce XOR constraint on PlanAccess table
-- Exactly one of examId or seriesId must be non-null

ALTER TABLE "PlanAccess" DROP CONSTRAINT IF EXISTS planaccess_exactly_one;
ALTER TABLE "PlanAccess" DROP CONSTRAINT IF EXISTS planaccess_exam_xor_series_chk;

ALTER TABLE "PlanAccess" ADD CONSTRAINT planaccess_exactly_one 
  CHECK (("examId" IS NULL) != ("seriesId" IS NULL));
