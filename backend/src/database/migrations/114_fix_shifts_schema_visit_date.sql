-- Add visit_date to shifts to support triggers
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS visit_date DATE DEFAULT CURRENT_DATE;
