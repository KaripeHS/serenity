-- Fix recurring_visit_templates
ALTER TABLE recurring_visit_templates DROP COLUMN IF EXISTS status;
ALTER TABLE recurring_visit_templates ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Fix users skills
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';

-- Fix spi_daily_scores date
ALTER TABLE spi_daily_scores ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Fix expense_categories status
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create visits view
CREATE OR REPLACE VIEW visits AS SELECT * FROM shifts;
