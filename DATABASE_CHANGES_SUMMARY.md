# Database Schema Changes & Refactoring Summary
**For QA / Test Engineering**

## 1. Core Domain Refactors
The application layer has undergone significant refactoring which breaks older test assumptions.

### Visits -> Shifts
*   **Change**: The concept of "Visits" has been globally renamed to "Shifts".
*   **Impact**:
    *   Table `visits` **does not exist**. Use `shifts`.
    *   Columns like `visit_id` are now `shift_id` in related tables (e.g., `visit_notes` -> `shift_notes`, `gps_logs`, etc.).
    *   **Action**: Grep test suite for `visit` and replace with `shift` where referring to the scheduled event.

### Identity Model (Caregivers vs. Users)
*   **Change**: `caregivers` table is now strictly a profile extension. It does **not** contain PII like `first_name`, `last_name`, `email`, or `phone`.
*   **Impact**:
    *   Tests cannot query `SELECT first_name FROM caregivers`.
    *   **Action**: Tests must `JOIN users ON caregivers.user_id = users.id` to retrieve identity details.

## 2. Table & Column Renames
Older tests reference deprecated schema names.

| Old Name (Test Expectation) | New Name (Actual Schema) | Context |
| :--- | :--- | :--- |
| `pod_members` | `user_pod_memberships` | Pod governance |
| `pod_members.role` | `user_pod_memberships.role_in_pod` | Avoids ambiguity with system role |
| `caregivers.status` | `caregivers.employment_status` | Status of employment (active/terminated) |
| `*.primary_pod_id` | `*.pod_id` | Standardized foreign key across `clients`, `caregivers` |
| `background_checks.candidate_id` | `background_checks.applicant_id` | Refers to `applicants` table |
| `caregiver_availability` | `caregiver_availability_patterns` | Weekly recurring patterns |
| `users.active` | `users.is_active` | Boolean flag standard |

## 3. Module-Specific Changes

### Background Checks (Migration 058)
*   Tests inserting mock data must use:
    *   `applicant_id` (instead of `candidate_id`)
    *   `check_provider` (instead of `provider`)
    *   `submission_reference` (instead of `provider_check_id`)
    *   `check_type` (instead of `package_type`)
    *   `result` (instead of `overall_result`)

### Care Plans (Migration 075)
*   **Change**: `care_plans` table is fully defined in `075_client_assessments.sql`.
*   **Note**: A conflicting stub in `080` was removed.
*   **Schema**:
    *   Foreign Keys: `client_id`, `assessment_id`, `physician_order_id`.
    *   JSONB Fields: `goals`, `interventions`, `service_schedule`.

### On-Call Coverage (Migration 018)
*   **Change**: `is_active` column was removed from `oncall_rosters`.
*   **Action**: Validity is now calculated at runtime (SQL View or Application Logic) based on `start_datetime`, `end_datetime` and `status = 'active'`. Tests should check these fields instead of a flag.

### Missing Tables (Test Cleanup)
The test suite attempts to seed/query these tables which **do not exist** in the current schema and should be removed or mocked in tests:
*   `insurance_claims` (See `claims_batches` in 033)
*   `invoices`
*   `supervisory_shifts`
*   `caregiver_training` (Refactored to `training_assignments` in 055)
*   `recurring_visit_templates`

## 4. Key Joins Required
Queries in tests that previously accessed flat tables now require joins:
*   **Caregiver Name**: `caregivers` -> `users`
*   **Client Budget Payer**: `client_budgets` -> `payers`
*   **Org License**: `organization_licenses` -> `user_pod_memberships` -> `pods`
