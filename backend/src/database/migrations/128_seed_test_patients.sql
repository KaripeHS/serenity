-- Migration: Seed 10 Test Patients at Various Lifecycle Stages
-- Purpose: Create test data for end-to-end patient care journey testing
-- All test data is marked with 'TEST-' prefix for easy identification and removal
-- SIMPLIFIED VERSION: Only creates clients, no related data

DO $$
DECLARE
    v_org_id UUID;
    v_pod_id UUID;

BEGIN
    -- Get organization
    SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%serenity%' LIMIT 1;
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM organizations LIMIT 1;
    END IF;

    -- Get a pod
    SELECT id INTO v_pod_id FROM pods WHERE organization_id = v_org_id LIMIT 1;

    -- Create pod if none exists
    IF v_pod_id IS NULL THEN
        INSERT INTO pods (id, organization_id, name, pod_type, status)
        VALUES (gen_random_uuid(), v_org_id, 'Test Pod', 'clinical', 'active')
        RETURNING id INTO v_pod_id;
    END IF;

    -- Skip if no organization found
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'No organization found, skipping test patient seed';
        RETURN;
    END IF;

    -- ============================================
    -- PATIENT 1: New Referral (Just entered system)
    -- Status: active (simulating pending intake)
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-001',
        'Eleanor', 'Thompson', '1945-03-15', 'OH12345001',
        '{"street": "123 Maple Lane", "city": "Cincinnati", "state": "OH", "zip": "45202"}'::jsonb,
        '[{"name": "Robert Thompson", "phone": "(513) 555-0102", "relationship": "Son"}]'::jsonb,
        '{"primaryDiagnosis": "I10 - Essential Hypertension", "notes": "TEST: New referral from Dr. Smith. Initial intake pending."}'::jsonb,
        'active'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 2: Pending Assessment
    -- Status: active (intake stage)
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-002',
        'Harold', 'Mitchell', '1938-07-22', 'OH12345002',
        '{"street": "456 Oak Street", "city": "Columbus", "state": "OH", "zip": "43215"}'::jsonb,
        '[{"name": "Susan Mitchell", "phone": "(614) 555-0203", "relationship": "Daughter"}]'::jsonb,
        '{"primaryDiagnosis": "G20 - Parkinsons Disease", "secondaryDiagnoses": ["E11 - Type 2 Diabetes"], "notes": "TEST: Assessment scheduled for next week."}'::jsonb,
        'active',
        CURRENT_DATE - INTERVAL '5 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 3: Assessment Complete, Awaiting Care Plan
    -- Status: active
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-003',
        'Dorothy', 'Williams', '1942-11-08', 'OH12345003',
        '{"street": "789 Elm Avenue", "city": "Cleveland", "state": "OH", "zip": "44114"}'::jsonb,
        '[{"name": "James Williams", "phone": "(216) 555-0304", "relationship": "Husband"}]'::jsonb,
        '{"primaryDiagnosis": "F03 - Dementia", "secondaryDiagnoses": ["I25 - Chronic Ischemic Heart Disease"], "notes": "TEST: Assessment complete. Care plan development in progress."}'::jsonb,
        'active',
        CURRENT_DATE - INTERVAL '10 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 4: Care Plan Draft (Not Yet Approved)
    -- Status: active
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-004',
        'William', 'Anderson', '1940-05-30', 'OH12345004',
        '{"street": "321 Pine Road", "city": "Dayton", "state": "OH", "zip": "45402"}'::jsonb,
        '[{"name": "Patricia Anderson", "phone": "(937) 555-0405", "relationship": "Wife"}]'::jsonb,
        '{"primaryDiagnosis": "G20 - Parkinsons Disease", "notes": "TEST: Care plan drafted, pending physician signature."}'::jsonb,
        'active',
        CURRENT_DATE - INTERVAL '14 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 5: Care Plan Active, Awaiting First Visit
    -- Status: active
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-005',
        'Dorothy', 'Wilson', '1944-09-12', 'OH12345005',
        '{"street": "555 Cedar Boulevard", "city": "Toledo", "state": "OH", "zip": "43604"}'::jsonb,
        '[{"name": "Michael Wilson", "phone": "(419) 555-0506", "relationship": "Son"}]'::jsonb,
        '{"primaryDiagnosis": "J44.1 - COPD", "notes": "TEST: Care plan approved. First visit scheduled for tomorrow."}'::jsonb,
        'active',
        CURRENT_DATE - INTERVAL '21 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 6: Actively Receiving Care (Multiple Visits)
    -- Status: active
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-006',
        'Robert', 'Johnson', '1936-02-28', 'OH12345006',
        '{"street": "777 Birch Lane", "city": "Akron", "state": "OH", "zip": "44308"}'::jsonb,
        '[{"name": "Mary Johnson", "phone": "(330) 555-0607", "relationship": "Daughter"}]'::jsonb,
        '{"primaryDiagnosis": "I63 - Cerebral Infarction (Stroke)", "secondaryDiagnoses": ["E11 - Type 2 Diabetes", "I10 - Hypertension"], "notes": "TEST: Active patient receiving daily care."}'::jsonb,
        'active',
        CURRENT_DATE - INTERVAL '60 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 7: Under Review (Annual Reassessment Due)
    -- Status: active
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-007',
        'Betty', 'Martinez', '1939-12-03', 'OH12345007',
        '{"street": "999 Walnut Court", "city": "Youngstown", "state": "OH", "zip": "44503"}'::jsonb,
        '[{"name": "Carlos Martinez", "phone": "(330) 555-0708", "relationship": "Son"}]'::jsonb,
        '{"primaryDiagnosis": "M17 - Osteoarthritis of Knee", "notes": "TEST: Annual reassessment due. Care plan review needed."}'::jsonb,
        'active',
        CURRENT_DATE - INTERVAL '365 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 8: Hospitalized (Care on Hold)
    -- Status: suspended
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-008',
        'Charles', 'Lee', '1941-08-17', 'OH12345008',
        '{"street": "111 Spruce Drive", "city": "Canton", "state": "OH", "zip": "44702"}'::jsonb,
        '[{"name": "Jennifer Lee", "phone": "(330) 555-0809", "relationship": "Daughter"}]'::jsonb,
        '{"primaryDiagnosis": "I50 - Heart Failure", "notes": "TEST: Hospitalized 3 days ago for CHF exacerbation. Care suspended pending discharge."}'::jsonb,
        'suspended',
        CURRENT_DATE - INTERVAL '120 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 9: Discharged
    -- Status: discharged
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date, discharge_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-009',
        'Margaret', 'Taylor', '1943-04-25', 'OH12345009',
        '{"street": "222 Cherry Lane", "city": "Springfield", "state": "OH", "zip": "45502"}'::jsonb,
        '[{"name": "David Taylor", "phone": "(937) 555-0910", "relationship": "Husband"}]'::jsonb,
        '{"primaryDiagnosis": "S72 - Fracture of Femur", "notes": "TEST: Discharged - met all care plan goals. Full recovery from hip replacement."}'::jsonb,
        'discharged',
        CURRENT_DATE - INTERVAL '90 days',
        CURRENT_DATE - INTERVAL '10 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    -- ============================================
    -- PATIENT 10: Deceased
    -- Status: inactive
    -- ============================================
    INSERT INTO clients (
        id, organization_id, pod_id, client_code,
        first_name, last_name, date_of_birth, medicaid_number,
        address, emergency_contacts, medical_info, status, admission_date, discharge_date
    ) VALUES (
        gen_random_uuid(), v_org_id, v_pod_id, 'TEST-010',
        'George', 'Brown', '1932-01-10', 'OH12345010',
        '{"street": "333 Ash Street", "city": "Hamilton", "state": "OH", "zip": "45011"}'::jsonb,
        '[{"name": "Nancy Brown", "phone": "(513) 555-1011", "relationship": "Daughter"}]'::jsonb,
        '{"primaryDiagnosis": "C34 - Lung Cancer", "notes": "TEST: Deceased - passed away peacefully at home with family present."}'::jsonb,
        'inactive',
        CURRENT_DATE - INTERVAL '180 days',
        CURRENT_DATE - INTERVAL '30 days'
    ) ON CONFLICT (client_code) DO NOTHING;

    RAISE NOTICE 'Successfully created 10 test patients (TEST-001 through TEST-010)';

END $$;
