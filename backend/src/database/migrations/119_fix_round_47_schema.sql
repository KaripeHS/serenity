-- 1. Fix care_plans review_date default
ALTER TABLE care_plans ALTER COLUMN review_date SET DEFAULT CURRENT_DATE;

-- 2. Add columns to spi_daily_scores
ALTER TABLE spi_daily_scores ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5, 2);
ALTER TABLE spi_daily_scores ADD COLUMN IF NOT EXISTS punctuality_score DECIMAL(5, 2);
ALTER TABLE spi_daily_scores ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5, 2);
ALTER TABLE spi_daily_scores ADD COLUMN IF NOT EXISTS client_satisfaction_score DECIMAL(5, 2);

-- 3. Fix supervisory_visits schema (if needed, but mostly test update)
-- Just ensuring constraints are fine.
-- next_visit_due_date is required, visit_date is required.
