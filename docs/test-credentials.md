# Serenity Care Partners - Test Credentials

## Quick Start

Run the seed script to create all test users:
```bash
cd backend
npx tsx src/database/seeds/seed-test-roles.ts
```

---

## All Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **EXECUTIVE** | | |
| founder | founder@test.serenitycare.com | Founder123! |
| ceo | ceo@test.serenitycare.com | Ceo123456! |
| cfo | cfo@test.serenitycare.com | Cfo123456! |
| coo | coo@test.serenitycare.com | Coo123456! |
| **FINANCE** | | |
| finance_director | finance.director@test.serenitycare.com | FinDir123! |
| finance_manager | finance.manager@test.serenitycare.com | FinMgr123! |
| billing_manager | billing.manager@test.serenitycare.com | BillMgr123! |
| rcm_analyst | rcm.analyst@test.serenitycare.com | Rcm12345! |
| insurance_manager | insurance.manager@test.serenitycare.com | InsMgr123! |
| billing_coder | billing.coder@test.serenitycare.com | Coder1234! |
| **OPERATIONS** | | |
| operations_manager | ops.manager@test.serenitycare.com | OpsMgr123! |
| field_ops_manager | field.ops.manager@test.serenitycare.com | FieldOps123! |
| pod_lead | pod.lead@test.serenitycare.com | PodLead123! |
| field_supervisor | field.supervisor@test.serenitycare.com | FieldSup123! |
| scheduling_manager | scheduling.manager@test.serenitycare.com | SchedMgr123! |
| scheduler | scheduler@test.serenitycare.com | Sched12345! |
| dispatcher | dispatcher@test.serenitycare.com | Dispatch123! |
| qa_manager | qa.manager@test.serenitycare.com | QaMgr1234! |
| **CLINICAL** | | |
| director_of_nursing | don@test.serenitycare.com | Don1234567! |
| clinical_director | clinical.director@test.serenitycare.com | ClinDir123! |
| nursing_supervisor | nursing.supervisor@test.serenitycare.com | NurseSup123! |
| rn_case_manager | rn.case.manager@test.serenitycare.com | RnCase123! |
| lpn_lvn | lpn@test.serenitycare.com | Lpn1234567! |
| qidp | qidp@test.serenitycare.com | Qidp123456! |
| therapist | therapist@test.serenitycare.com | Therapist1! |
| **DIRECT CARE** | | |
| dsp_med | dsp.med@test.serenitycare.com | DspMed123! |
| dsp_basic | dsp.basic@test.serenitycare.com | DspBasic123! |
| hha | hha@test.serenitycare.com | Hha1234567! |
| cna | cna@test.serenitycare.com | Cna1234567! |
| caregiver | caregiver@test.serenitycare.com | Caregiver1! |
| **HR** | | |
| hr_director | hr.director@test.serenitycare.com | HrDir1234! |
| hr_manager | hr.manager@test.serenitycare.com | HrMgr1234! |
| recruiter | recruiter@test.serenitycare.com | Recruit123! |
| credentialing_specialist | credentialing@test.serenitycare.com | Cred123456! |
| **COMPLIANCE & IT** | | |
| compliance_officer | compliance.officer@test.serenitycare.com | Comply123! |
| security_officer | security.officer@test.serenitycare.com | Secure123! |
| it_admin | it.admin@test.serenitycare.com | ItAdmin123! |
| support_agent | support.agent@test.serenitycare.com | Support123! |
| **EXTERNAL** | | |
| client | client@test.serenitycare.com | Client1234! |
| family | family@test.serenitycare.com | Family1234! |
| payer_auditor | payer.auditor@test.serenitycare.com | Auditor123! |

---

## Credentials by Permission Level

### Full System Access
```
founder@test.serenitycare.com / Founder123!
ceo@test.serenitycare.com / Ceo123456!
```

### Executive Access
```
cfo@test.serenitycare.com / Cfo123456!      (Finance + executive)
coo@test.serenitycare.com / Coo123456!      (Operations + HR + oversight)
```

### Director Level
```
finance.director@test.serenitycare.com / FinDir123!
ops.manager@test.serenitycare.com / OpsMgr123!
don@test.serenitycare.com / Don1234567!
hr.director@test.serenitycare.com / HrDir1234!
```

### Manager Level
```
finance.manager@test.serenitycare.com / FinMgr123!
billing.manager@test.serenitycare.com / BillMgr123!
field.ops.manager@test.serenitycare.com / FieldOps123!
scheduling.manager@test.serenitycare.com / SchedMgr123!
nursing.supervisor@test.serenitycare.com / NurseSup123!
clinical.director@test.serenitycare.com / ClinDir123!
hr.manager@test.serenitycare.com / HrMgr1234!
qa.manager@test.serenitycare.com / QaMgr1234!
```

### Supervisor/Lead Level
```
pod.lead@test.serenitycare.com / PodLead123!
field.supervisor@test.serenitycare.com / FieldSup123!
```

### Specialist Level
```
scheduler@test.serenitycare.com / Sched12345!
dispatcher@test.serenitycare.com / Dispatch123!
recruiter@test.serenitycare.com / Recruit123!
credentialing@test.serenitycare.com / Cred123456!
rn.case.manager@test.serenitycare.com / RnCase123!
lpn@test.serenitycare.com / Lpn1234567!
therapist@test.serenitycare.com / Therapist1!
qidp@test.serenitycare.com / Qidp123456!
rcm.analyst@test.serenitycare.com / Rcm12345!
billing.coder@test.serenitycare.com / Coder1234!
insurance.manager@test.serenitycare.com / InsMgr123!
```

### Direct Care Staff
```
dsp.med@test.serenitycare.com / DspMed123!
dsp.basic@test.serenitycare.com / DspBasic123!
hha@test.serenitycare.com / Hha1234567!
cna@test.serenitycare.com / Cna1234567!
caregiver@test.serenitycare.com / Caregiver1!
```

### IT & Compliance
```
compliance.officer@test.serenitycare.com / Comply123!
security.officer@test.serenitycare.com / Secure123!
it.admin@test.serenitycare.com / ItAdmin123!
support.agent@test.serenitycare.com / Support123!
```

### External Access
```
client@test.serenitycare.com / Client1234!
family@test.serenitycare.com / Family1234!
payer.auditor@test.serenitycare.com / Auditor123!
```

---

## Testing Scenarios

### Test Billing Flow
1. Login as `billing.coder@test.serenitycare.com` - Create claims
2. Login as `billing.manager@test.serenitycare.com` - Review claims
3. Login as `finance.director@test.serenitycare.com` - Approve claims
4. Login as `cfo@test.serenitycare.com` - Final oversight

### Test Scheduling Flow
1. Login as `scheduler@test.serenitycare.com` - Create schedules
2. Login as `scheduling.manager@test.serenitycare.com` - Approve schedules
3. Login as `pod.lead@test.serenitycare.com` - Manage pod shifts
4. Login as `caregiver@test.serenitycare.com` - View assigned shifts

### Test Clinical Flow
1. Login as `rn.case.manager@test.serenitycare.com` - Create care plans
2. Login as `nursing.supervisor@test.serenitycare.com` - Review care plans
3. Login as `don@test.serenitycare.com` - Approve care plans
4. Login as `lpn@test.serenitycare.com` - View care plans, administer meds

### Test HR Flow
1. Login as `recruiter@test.serenitycare.com` - Create new hire
2. Login as `credentialing@test.serenitycare.com` - Verify credentials
3. Login as `hr.manager@test.serenitycare.com` - Approve hire
4. Login as `hr.director@test.serenitycare.com` - Assign role

### Test Compliance/Audit
1. Login as `compliance.officer@test.serenitycare.com` - Run internal audit
2. Login as `qa.manager@test.serenitycare.com` - Review incidents
3. Login as `payer.auditor@test.serenitycare.com` - External audit access

---

## API Testing with cURL

### Login and get token
```bash
# Login as founder
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@test.serenitycare.com","password":"Founder123!"}'

# Login as caregiver
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"caregiver@test.serenitycare.com","password":"Caregiver1!"}'
```

### Use token for authenticated requests
```bash
TOKEN="<jwt_token_from_login>"

curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Notes

- All test accounts use `@test.serenitycare.com` domain
- Passwords follow pattern: `RoleName123!` (varies slightly for uniqueness)
- All accounts are created in `active` status
- Field roles (pod_lead, caregivers, etc.) are auto-assigned to CIN-A pod
- Clinical roles include appropriate `clinical_role` assignment
- Run `seed-initial-data.ts` first if organization doesn't exist
