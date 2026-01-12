-- Migration 126: Seed Test Accounts
-- Creates all test users for role-based testing
-- SAFE_MIGRATION: This is intentional seeding of test accounts

-- Remove failed migration record to allow re-run
DELETE FROM _migrations WHERE filename = '126_seed_test_accounts.sql';

-- The organization ID (Serenity Care Partners)
-- acdf0560-4c26-47ad-a38d-2b2153fcb039

-- All passwords are bcrypt hashed with 10 rounds
-- See docs/test-credentials.md for password list

-- Executive Leadership
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'founder@test.serenitycare.com', '$2b$10$IsQiiyCAvpOG8ftfvS/TK.nlV.BvrcMtzVmmro6oOwXd8LIYbQErC', 'Test', 'Founder', '+15135550001', 'founder', 'EXEC', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'ceo@test.serenitycare.com', '$2b$10$f5o0AAhNF.2kvmg8GaRNA.UpcuV9g0/fVc9OhHqPDHgu/y/kfErkm', 'Test', 'CEO', '+15135550002', 'ceo', 'EXEC', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'cfo@test.serenitycare.com', '$2b$10$3QOiv4BEjh2q1rvrdqVsyO3wFnNviSnmka/s6DMvKdth37RgtZrr.', 'Test', 'CFO', '+15135550003', 'cfo', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'coo@test.serenitycare.com', '$2b$10$pz8i02CfcVkbNrvX25FALuuhq97GXnJ7DiGAlOpDYrryrzfk9dem6', 'Test', 'COO', '+15135550004', 'coo', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- Finance Department
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'finance.director@test.serenitycare.com', '$2b$10$tQn5yFn775hUntqg.3rOQOLaMXwJjwk7LSk0hIKHLKD8vQjxJC4lG', 'Test', 'FinanceDirector', '+15135550010', 'finance_director', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'finance.manager@test.serenitycare.com', '$2b$10$EoW3hWGgPgrw6KiBAJmh7.YOGhxwa50BM6RZfxv0yt7Wyp/e.IoQy', 'Test', 'FinanceManager', '+15135550011', 'finance_manager', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'billing.manager@test.serenitycare.com', '$2b$10$fC89mrc0M9CMl8uNSMHxAuQXBPNu0AHf0zcmpwzhGQUvwPADVRmd2', 'Test', 'BillingManager', '+15135550012', 'billing_manager', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'rcm.analyst@test.serenitycare.com', '$2b$10$LYV2srv/UHCFUYwq8rt1w.N897phJxTrorDw405vmoSNtO6cPx3SS', 'Test', 'RCMAnalyst', '+15135550013', 'rcm_analyst', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'insurance.manager@test.serenitycare.com', '$2b$10$IcNc5n1c8RCc/vDhh6Tskuu/OSlEHQ8zr/24gE3l.D3qJaTmDv9y.', 'Test', 'InsuranceManager', '+15135550014', 'insurance_manager', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'billing.coder@test.serenitycare.com', '$2b$10$3wxdqb7u882X0YwU/PrXpuLpUN6l0lxKJcBs3igTmTzvBFYBF2OyG', 'Test', 'BillingCoder', '+15135550015', 'billing_coder', 'FIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- Operations Department
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'ops.manager@test.serenitycare.com', '$2b$10$xIxPrb.N/lLdi6F27rmGv.HJRL02intfReyUdWjDivFgcO0D8rqoK', 'Test', 'OpsManager', '+15135550020', 'operations_manager', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'field.ops.manager@test.serenitycare.com', '$2b$10$RaoiB1NSBGWL6FDxiwP3peQCl7IrTq6ViiwMIIangaRfcxMoerQTu', 'Test', 'FieldOpsManager', '+15135550021', 'field_ops_manager', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'pod.lead@test.serenitycare.com', '$2b$10$Xwo/tGyk9lZZ3q6/iJkDF.9SsTOHAGyhGYKjXXC9JETX89cGUw1m6', 'Test', 'PodLead', '+15135550022', 'pod_lead', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'field.supervisor@test.serenitycare.com', '$2b$10$8HFHF.5KFQ5kcO48FDzdju0wRUrsafhIbEQrxtIYh6wsu8bm72I4y', 'Test', 'FieldSupervisor', '+15135550023', 'field_supervisor', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'scheduling.manager@test.serenitycare.com', '$2b$10$8Keld2gbKj0YQxZEPX9wieVrSS4cqXWqWc7.8mo0/FPMXKgmEowQe', 'Test', 'SchedulingManager', '+15135550024', 'scheduling_manager', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'scheduler@test.serenitycare.com', '$2b$10$wAAd2PwupZaZhzPCNmykse2xveHxt5.iEt2PZ5l41MMmIDrw/ymQO', 'Test', 'Scheduler', '+15135550025', 'scheduler', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'dispatcher@test.serenitycare.com', '$2b$10$0BI0ahCzgZLWnd2jMwmyWeowRBlnAT.SHMGibpY.qbGeSeV60doOK', 'Test', 'Dispatcher', '+15135550026', 'dispatcher', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'qa.manager@test.serenitycare.com', '$2b$10$mdvuUORrg7ogj0SqPTvsCu9OSWsrVIh2PcUkTcOYDn.7ppLzh32pq', 'Test', 'QAManager', '+15135550027', 'qa_manager', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- Direct Care Staff
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'dsp.med@test.serenitycare.com', '$2b$10$/y5r/TCSpJ9Md1qQaNZof.010EMVLKxbkNmF1s/eaun1BWgrjAJhi', 'Test', 'DSPMed', '+15135550040', 'dsp_med', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'dsp.basic@test.serenitycare.com', '$2b$10$SBc9T.JVa8aD1gkGzFnPw.SrJT/kdqTPty.nBtOhuf2sEhZC/0ppG', 'Test', 'DSPBasic', '+15135550041', 'dsp_basic', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'caregiver@test.serenitycare.com', '$2b$10$Qpl4bC6wp10lpZPW1OZOou69FD8k8X.SAoxFkGJaOqeXY7nTtT9a2', 'Test', 'Caregiver', '+15135550044', 'caregiver', 'OPS', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- Clinical Department
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'don@test.serenitycare.com', '$2b$10$t9Pj05BBoGdin9kABR6dkuYV5nGusdMT6FzBqjrKv7N6Z9mUTo48K', 'Test', 'DirectorOfNursing', '+15135550030', 'director_of_nursing', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'clinical.director@test.serenitycare.com', '$2b$10$86o6W229y9yFgHm8oBmQl.9OJdNDF1T1gShlmPr/ewrWT5oXSO0vO', 'Test', 'ClinicalDirector', '+15135550031', 'clinical_director', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'nursing.supervisor@test.serenitycare.com', '$2b$10$xFOpjMIV9Djm0/50bHmeVOE2GQxV1/3HRPHRTRfZak5TGLZi/9yy2', 'Test', 'NursingSupervisor', '+15135550032', 'nursing_supervisor', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'rn.case.manager@test.serenitycare.com', '$2b$10$PMZwqqK6eQNsyc997g.s3uwdNYOykRJG4we/4ou7omH1l1TDt/9Hi', 'Test', 'RNCaseManager', '+15135550033', 'rn_case_manager', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'lpn@test.serenitycare.com', '$2b$10$eVC27Io7MpAUbGyJKo9dX.2ffllLpwHR6hJnmd4Yzdic3SdypbAgG', 'Test', 'LPN', '+15135550034', 'lpn_lvn', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'qidp@test.serenitycare.com', '$2b$10$1v0fHA4OMeNtnv9kfaK6Su6OhcMl8A80yDaOC5Yj8aAGo0Tbcqp.a', 'Test', 'QIDP', '+15135550035', 'qidp', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'therapist@test.serenitycare.com', '$2b$10$RhqRIOI.wBmSpazYNZSMPOVWtcH4lgJTbQgPKD7nfwUtyCEW/P70u', 'Test', 'Therapist', '+15135550036', 'therapist', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'hha@test.serenitycare.com', '$2b$10$gbMSgSaR/gSwWH2uHk3m6ezo7wPvJTy6xVsyQJF5v7X8OVO69tHAu', 'Test', 'HHA', '+15135550042', 'hha', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'cna@test.serenitycare.com', '$2b$10$e6qEmHeY.L0JhQ90s5yMv.YUCQKJHAcO0LXbYxWPDH7pzHaQtUi76', 'Test', 'CNA', '+15135550043', 'cna', 'CLIN', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- HR Department
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'hr.director@test.serenitycare.com', '$2b$10$tdVjQp4BFLuhFQ4gyPnTLeG55qhGXWFWYNtX9PBRokKI8y.V3waum', 'Test', 'HRDirector', '+15135550050', 'hr_director', 'HR', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'hr.manager@test.serenitycare.com', '$2b$10$koFoFTpGVUz8FdLWnzZnzeJ.Ff4nU2iXr/lMVDfxdIpFy31xWdGI2', 'Test', 'HRManager', '+15135550051', 'hr_manager', 'HR', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'recruiter@test.serenitycare.com', '$2b$10$yfhUQT7/pxWaCriR4A0Qgu/XyED8Wf0eW9zgT5jPjqelunKB4fkr.', 'Test', 'Recruiter', '+15135550052', 'recruiter', 'HR', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'credentialing@test.serenitycare.com', '$2b$10$NA2pFiVKaSBu4nOrFrAWCuTZtYtWpmAwgGC10Kk3N.RvYMqzXSNGi', 'Test', 'CredentialingSpec', '+15135550053', 'credentialing_specialist', 'HR', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- Compliance & Security
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'compliance.officer@test.serenitycare.com', '$2b$10$/UfEpSclQ72ssK0C1Ycfd.RA8/NSnRvNkCOVbD9xpJHrOe4djKTZ2', 'Test', 'ComplianceOfficer', '+15135550060', 'compliance_officer', 'COMP', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'security.officer@test.serenitycare.com', '$2b$10$1i0YT0Z5S9ciHp2f.LEfheixZkq0VVM9kJuDwxJHKvhR//8n60y0e', 'Test', 'SecurityOfficer', '+15135550061', 'security_officer', 'IT', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- IT Department
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'it.admin@test.serenitycare.com', '$2b$10$fiRJFKbd00tHyk2huh3HmeTIRyoN4S5pzlH8V/jl9JrD5xcvfpqf2', 'Test', 'ITAdmin', '+15135550070', 'it_admin', 'IT', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'support.agent@test.serenitycare.com', '$2b$10$HQpDWVTfYdljpHkJkwaV3OGX5VckFwfDGiKkxzDfrHHw6CeiYO.gu', 'Test', 'SupportAgent', '+15135550071', 'support_agent', 'IT', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

-- External Access
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'client@test.serenitycare.com', '$2b$10$rmPAq7kOTURdxDm2J6oGAOjNVdE3NSWOugg8sFWFc1C2xDfoo4tlW', 'Test', 'Client', '+15135550080', 'client', NULL, 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'family@test.serenitycare.com', '$2b$10$JfBlIDEV5eTBG6bZ4KX.qOuSIvCLtgmLP0FspXvXNVcOH.rzEyONC', 'Test', 'FamilyMember', '+15135550081', 'family', NULL, 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, department, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'acdf0560-4c26-47ad-a38d-2b2153fcb039', 'payer.auditor@test.serenitycare.com', '$2b$10$2GnCnWlWiinfe5uSxWX2xu.ynkShmcfxvbnJLyYZnEDT38dNl7TLy', 'Test', 'PayerAuditor', '+15135550082', 'payer_auditor', NULL, 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = NOW();
