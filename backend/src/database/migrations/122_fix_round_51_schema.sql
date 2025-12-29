-- Drop FK on caregiver_training.caregiver_id to allow Applicant IDs
ALTER TABLE caregiver_training DROP CONSTRAINT IF EXISTS caregiver_training_caregiver_id_fkey;
