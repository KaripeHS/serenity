# Serenity Care Partners - Organizational Structure

## Overview

This document defines the organizational hierarchy for Serenity Care Partners, designed to scale from the current team to 500+ caregivers. The structure supports progressive delegation - founders can hold multiple positions initially and transfer responsibilities as the team grows.

---

## Two Supervision Tracks for Field Staff

Serenity has **two distinct types of direct care workers** with different supervision chains:

### Track 1: Operations (DSP/Caregivers)
```
COO → Director of Operations → Field Ops Manager → Pod Lead → DSP/Caregiver
```
- **Staff**: DSP Basic, DSP Med, Caregiver
- **Services**: Developmental disability, behavioral health, personal care
- **Supervision**: Operational/administrative (scheduling, EVV, attendance)

### Track 2: Clinical (Nursing/Home Health)
```
CEO → Director of Nursing → Nursing Supervisor → RN Case Manager → LPN/HHA/CNA
```
- **Staff**: LPN, HHA, CNA
- **Services**: Home health, skilled nursing, medical care
- **Supervision**: Clinical oversight (care plans, assessments, med administration)

> **Why two tracks?** Clinical staff require RN supervision per state regulations. DSP/caregivers have different training requirements and service types.

---

## Organizational Chart (500-Scale)

```
                                    BOARD OF DIRECTORS
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │   FOUNDER / OWNER      │
                              │   Role: founder        │
                              │   Bignon Deguenon      │
                              └───────────┬────────────┘
                                          │
                              ┌───────────▼────────────┐
                              │         CEO            │
                              │   Role: ceo            │
                              │   Gloria Aflya (RN)    │
                              └───────────┬────────────┘
                                          │
       ┌──────────────┬───────────────────┼───────────────────┬──────────────┐
       │              │                   │                   │              │
       ▼              ▼                   ▼                   ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│     CFO      │ │     COO      │ │   Director   │ │ HR Director  │ │  Compliance  │
│  Role: cfo   │ │  Role: coo   │ │  of Nursing  │ │Role:hr_director│ │   Officer   │
│     TBH      │ │Bignon (temp) │ │Role:director_│ │     TBH      │ │Role:compliance│
│              │ │              │ │ of_nursing   │ │              │ │   _officer   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
   FINANCE          OPERATIONS       CLINICAL            HR
   DEPARTMENT       DEPARTMENT       DEPARTMENT       DEPARTMENT
```

---

## Department Details

### 1. EXECUTIVE LEADERSHIP

| Position | System Role | Current Holder | Permissions |
|----------|-------------|----------------|-------------|
| **Founder/Owner** | `founder` | Bignon Deguenon | Full system access (all 41 permissions) |
| **CEO** | `ceo` | Gloria Aflya | Full system access + Clinical oversight |
| **CFO** | `cfo` | TBH (Bignon temp) | Finance, billing, payroll, reporting |
| **COO** | `coo` | TBH (Bignon temp) | Operations, HR, scheduling, EVV |

**Notes:**
- Gloria also has `clinical_role: rn_case_manager` for clinical tracking
- Bignon wears Founder + COO + CFO hats until positions are filled

---

### 2. FINANCE DEPARTMENT

```
                    ┌──────────────────┐
                    │       CFO        │
                    │    Role: cfo     │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ Finance Director │          │ Insurance Manager│
    │Role: finance_    │          │Role: insurance_  │
    │    director      │          │    manager       │
    └────────┬─────────┘          └──────────────────┘
             │
    ┌────────┼────────────────┐
    │        │                │
    ▼        ▼                ▼
┌────────┐ ┌────────┐   ┌────────┐
│Finance │ │Finance │   │Finance │
│Manager │ │Manager │   │Manager │
│Payroll │ │Billing │   │  A/P   │
│Role:   │ │Role:   │   │Role:   │
│finance_│ │finance_│   │finance_│
│manager │ │manager │   │manager │
└────────┘ └───┬────┘   └────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Billing │ │Billing │ │  RCM   │
│ Coder  │ │ Coder  │ │Analyst │
│Role:   │ │Role:   │ │Role:   │
│billing_│ │billing_│ │rcm_    │
│ coder  │ │ coder  │ │analyst │
└────────┘ └────────┘ └────────┘
```

| Position | System Role | Count | Key Permissions |
|----------|-------------|-------|-----------------|
| CFO | `cfo` | 1 | Full finance + executive oversight |
| Finance Director | `finance_director` | 1 | Billing approve, financial reporting |
| Finance Manager | `finance_manager` | 3 | Billing create/submit, HR read |
| Insurance Manager | `insurance_manager` | 1 | Billing read/update |
| Billing Coder | `billing_coder` | 2-3 | Billing read/update |
| RCM Analyst | `rcm_analyst` | 1-2 | Billing read/update, analytics |

---

### 3. OPERATIONS DEPARTMENT

```
                         ┌──────────────────┐
                         │       COO        │
                         │    Role: coo     │
                         └────────┬─────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Director of    │    │   Scheduling     │    │   QA Manager     │
│   Operations     │    │    Manager       │    │ Role: qa_manager │
│Role: operations_ │    │Role: scheduling_ │    └──────────────────┘
│    manager       │    │    manager       │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         │              ▼                 ▼
         │        ┌──────────┐      ┌──────────┐
         │        │Scheduler │      │Dispatcher│
         │        │Role:     │      │Role:     │
         │        │scheduler │      │dispatcher│
         │        └──────────┘      └──────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │         │         │         │
    ▼         ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Field  │ │ Field  │ │ Field  │ │ Field  │
│  Ops   │ │  Ops   │ │  Ops   │ │  Ops   │
│Manager │ │Manager │ │Manager │ │Manager │
│Role:   │ │Role:   │ │Role:   │ │Role:   │
│field_  │ │field_  │ │field_  │ │field_  │
│ops_mgr │ │ops_mgr │ │ops_mgr │ │ops_mgr │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Pod Lead│ │Pod Lead│ │Pod Lead│ │Pod Lead│
│  (4)   │ │  (4)   │ │  (4)   │ │  (3)   │
│Role:   │ │Role:   │ │Role:   │ │Role:   │
│pod_lead│ │pod_lead│ │pod_lead│ │pod_lead│
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Caregivr│ │Caregivr│ │Caregivr│ │Caregivr│
│ (~135) │ │ (~135) │ │ (~135) │ │ (~95)  │
│dsp_med │ │dsp_med │ │dsp_med │ │dsp_med │
│dsp_basic│ │dsp_basic│ │dsp_basic│ │dsp_basic│
│hha/cna │ │hha/cna │ │hha/cna │ │hha/cna │
└────────┘ └────────┘ └────────┘ └────────┘
```

| Position | System Role | Count | Key Permissions |
|----------|-------------|-------|-----------------|
| COO | `coo` | 1 | Full operations + HR oversight |
| Director of Operations | `operations_manager` | 1 | User/client/schedule CRUD, EVV override |
| Field Operations Manager | `field_ops_manager` | 4+ | Schedule CRUD, EVV update, multi-pod oversight |
| Pod Lead | `pod_lead` | 15 | Schedule read/update, EVV update |
| Field Supervisor | `field_supervisor` | As needed | Schedule read/update, EVV update |
| Scheduling Manager | `scheduling_manager` | 1 | Full schedule CRUD |
| Scheduler | `scheduler` | 3-5 | Schedule create/update/assign |
| Dispatcher | `dispatcher` | 1-2 | Schedule read/update, real-time |
| QA Manager | `qa_manager` | 1 | Audit read, incident manage |

**Note on Field Operations Manager:**
- **Job Title**: "Field Operations Manager" (displayed to employees/clients)
- **System Role**: `field_ops_manager` (internal system identifier)
- **Why flexible naming**: Allows multiple managers within a single large market (e.g., 3 Field Ops Managers for Cincinnati if it has 200+ clients) without the title implying geographic exclusivity. Can manage by geography, client portfolio, service line, or shift type.

**Operations Field Staff (DSP/Caregivers) - Report to Pod Leads:**

| Role | System Role | Certification | Key Permissions |
|------|-------------|---------------|-----------------|
| DSP Med-Certified | `dsp_med` | Med admin cert | Med administer, care plan read |
| DSP Basic | `dsp_basic` | Basic training | Care plan read, behavior log |
| Caregiver (Legacy) | `caregiver` | Varies | Schedule read, EVV create |

> **Note:** DSP roles are primarily for developmental disability / behavioral health services, supervised by Operations (Pod Leads → Field Ops Managers → Director of Operations).

---

### 4. CLINICAL DEPARTMENT

> **Note:** Clinical field staff (HHA, CNA, LPN) provide home health / skilled nursing services. They report to RN Case Managers, NOT to Operations Pod Leads. This is a separate supervision track with clinical oversight.

```
                    ┌──────────────────────┐
                    │  Director of Nursing │
                    │ Role: director_of_   │
                    │       nursing        │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Nursing Supervisors │              │  QIDP/Therapist      │
│      (by market)     │              │    Coordinator       │
│ Role: nursing_       │              │ Role: clinical_      │
│       supervisor     │              │       director       │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
    ┌──────┴──────┐                       ┌──────┴──────┐
    │             │                       │             │
    ▼             ▼                       ▼             ▼
┌────────┐  ┌────────┐              ┌────────┐   ┌────────┐
│RN Case │  │RN Case │              │  QIDP  │   │Therapist│
│Manager │  │Manager │              │ Role:  │   │ Role:  │
│ Role:  │  │ Role:  │              │  qidp  │   │therapist│
│rn_case_│  │rn_case_│              └────────┘   └────────┘
│manager │  │manager │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────────────────────────────────────┐
│     CLINICAL FIELD STAFF               │
│  (Supervised by RN Case Managers)      │
├────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │  LPN   │  │  HHA   │  │  CNA   │   │
│  │ Role:  │  │ Role:  │  │ Role:  │   │
│  │lpn_lvn │  │  hha   │  │  cna   │   │
│  └────────┘  └────────┘  └────────┘   │
└────────────────────────────────────────┘
```

**Clinical Department Staff:**

| Position | System Role | Count | Key Permissions | Reports To |
|----------|-------------|-------|-----------------|------------|
| Director of Nursing | `director_of_nursing` | 1 | PHI access, care plans, med order, credential verify | CEO |
| Clinical Director | `clinical_director` | 1 | PHI access, care plans, incident manage | Director of Nursing |
| Nursing Supervisor | `nursing_supervisor` | 3 | PHI access, care plans, med order | Director of Nursing |
| RN Case Manager | `rn_case_manager` | 5-8 | PHI access, care plans, med order, assessments | Nursing Supervisor |
| QIDP | `qidp` | 3-5 | PHI access, care plans, behavior plans | Clinical Director |
| Therapist (PT/OT/SLP) | `therapist` | 2-3 | PHI access, assessments, therapy goals | Clinical Director |

**Clinical Field Staff (Direct Care):**

| Position | System Role | Count | Key Permissions | Reports To |
|----------|-------------|-------|-----------------|------------|
| LPN/LVN | `lpn_lvn` | 3-5 | PHI access, care plan read, med administer | RN Case Manager |
| Home Health Aide | `hha` | 20-50 | Care plan read, EVV | RN Case Manager |
| CNA | `cna` | 20-50 | Care plan read, med administer, EVV | RN Case Manager |

---

### 5. HR DEPARTMENT

```
                    ┌──────────────────┐
                    │   HR Director    │
                    │ Role: hr_director│
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   HR Manager     │ │   HR Manager     │ │  Credentialing   │
│   (Recruiting)   │ │ (Emp Relations)  │ │    Manager       │
│ Role: hr_manager │ │ Role: hr_manager │ │ Role: hr_manager │
└────────┬─────────┘ └──────────────────┘ └────────┬─────────┘
         │                                         │
    ┌────┴────┐                              ┌─────┴─────┐
    │         │                              │           │
    ▼         ▼                              ▼           ▼
┌────────┐ ┌────────┐                  ┌──────────┐ ┌──────────┐
│Recruiter│ │Recruiter│                 │Credential│ │Credential│
│ Role:  │ │ Role:  │                  │Specialist│ │Specialist│
│recruiter│ │recruiter│                 │Role:     │ │Role:     │
└────────┘ └────────┘                  │credential│ │credential│
                                       │_specialist│ │_specialist│
                                       └──────────┘ └──────────┘
```

| Position | System Role | Count | Key Permissions |
|----------|-------------|-------|-----------------|
| HR Director | `hr_director` | 1 | Full HR + user management + role assignment |
| HR Manager | `hr_manager` | 2 | User create/update, HR CRUD, credential verify |
| Recruiter | `recruiter` | 2-3 | User create, HR create/read/update |
| Credentialing Specialist | `credentialing_specialist` | 2-3 | HR read/update, credential verify |

---

### 6. COMPLIANCE & IT

```
┌──────────────────┐                    ┌──────────────────┐
│   Compliance     │                    │     IT Admin     │
│    Officer       │                    │  Role: it_admin  │
│Role: compliance_ │                    └────────┬─────────┘
│    officer       │                             │
└────────┬─────────┘                             ▼
         │                              ┌──────────────────┐
         ▼                              │  Support Agent   │
┌──────────────────┐                    │Role: support_    │
│   Compliance     │                    │    agent         │
│    Analyst       │                    └──────────────────┘
│Role: compliance_ │
│officer (limited) │
└──────────────────┘
```

| Position | System Role | Count | Key Permissions |
|----------|-------------|-------|-----------------|
| Compliance Officer | `compliance_officer` | 1 | PHI access, audit read, incident manage |
| Security Officer | `security_officer` | 1 | Security manage, audit read, AI admin |
| QA Manager | `qa_manager` | 1 | PHI access, audit read, incident manage |
| IT Admin | `it_admin` | 1 | System config, security manage, user update |
| Support Agent | `support_agent` | 1-2 | User read, client read, schedule read |

---

## Role Hierarchy Summary

### Full Access (All 41 Permissions)
- `founder`
- `ceo`

### Executive Access (Department Oversight)
- `cfo` - Finance + executive monitoring
- `coo` - Operations + HR + oversight

### Director Level
- `finance_director` - Finance department
- `operations_manager` - Operations department
- `director_of_nursing` - Clinical department
- `hr_director` - HR department

### Manager Level
- `finance_manager` - Finance functions
- `field_ops_manager` - Field Operations Manager (multiple pods)
- `scheduling_manager` - Scheduling team
- `clinical_director` - Clinical oversight
- `nursing_supervisor` - Regional nursing
- `hr_manager` - HR functions
- `qa_manager` - Quality assurance

### Supervisor/Lead Level
- `pod_lead` - Single pod
- `field_supervisor` - Field operations
- `billing_manager` - Billing team

### Specialist Level
- `scheduler` / `dispatcher`
- `recruiter` / `credentialing_specialist`
- `rn_case_manager` / `lpn_lvn` / `therapist` / `qidp`
- `rcm_analyst` / `billing_coder` / `insurance_manager`

### Direct Care Staff
- `dsp_med` - Med-certified DSP
- `dsp_basic` - Basic DSP
- `hha` - Home Health Aide
- `cna` - Certified Nursing Assistant
- `caregiver` - Legacy role

### External Access
- `client` - Patient portal
- `family` - Family portal
- `payer_auditor` - Payer audit access

---

## Current State (Startup Phase)

| Person | System Role | Wearing Hats For |
|--------|-------------|------------------|
| Bignon Deguenon | `founder` | Owner, COO, CFO, Dir. of Ops, HR Director, Finance Director |
| Gloria Aflya | `ceo` + `clinical_role: rn_case_manager` | CEO, Director of Nursing, RN Case Manager |
| Kurtis Deguenon | `founder` | Management assistance |
| 2 Existing Caregivers | `dsp_basic` or `caregiver` | Direct care |

---

## Delegation Roadmap

### Phase 1: 0-100 Caregivers (Current)
- Bignon: `founder` (all hats)
- Gloria: `ceo` (CEO + clinical)
- Use `field_supervisor` for pod leaders
- Use `hr_manager` for first HR hire
- Use `finance_director` for first finance hire

### Phase 2: 100-250 Caregivers
**Hire & Assign:**
- Director of Operations → `operations_manager`
- 2 Pod Leaders → `pod_lead` or `field_supervisor`
- HR Manager → `hr_manager`
- Finance Manager → `finance_manager`
- 1-2 Recruiters → `recruiter`

### Phase 3: 250-500 Caregivers
**Hire & Assign:**
- CFO → `cfo` (Bignon releases CFO hat)
- 4+ Field Operations Managers → `field_ops_manager` (can have multiple per large market)
- 15 Pod Leaders → `pod_lead`
- HR Director → `hr_director`
- Director of Nursing → `director_of_nursing` (Gloria focuses on CEO)
- 3 Nursing Supervisors → `nursing_supervisor`
- 5-8 RN Case Managers → `rn_case_manager`
- Scheduling Manager → `scheduling_manager`
- 3-5 Schedulers → `scheduler`
- Finance Director → `finance_director`
- 3 Finance Managers → `finance_manager`
- QA Manager → `qa_manager`
- Compliance Officer → `compliance_officer`

---

## Database Support

The organizational structure is supported by:

1. **users.manager_id** - Direct reporting relationship
2. **users.department** - Department assignment (EXEC, OPS, CLIN, FIN, HR, COMP, IT)
3. **departments** table - Department definitions
4. **pod_groups** table - Regional pod groupings
5. **org_chart_positions** table - Formal position tracking

---

## Files Reference

- Backend roles: [backend/src/auth/access-control.ts](../backend/src/auth/access-control.ts)
- Frontend roles: [frontend/src/hooks/useRoleAccess.tsx](../frontend/src/hooks/useRoleAccess.tsx)
- Database migration: [backend/src/database/migrations/083_organizational_hierarchy.sql](../backend/src/database/migrations/083_organizational_hierarchy.sql)
- HR credential mappings: [backend/src/modules/hr/hr.service.ts](../backend/src/modules/hr/hr.service.ts)

---

## Job Descriptions

### EXECUTIVE LEADERSHIP

---

#### Founder / Owner
**System Role:** `founder`
**Reports To:** Board of Directors
**Department:** Executive

**Position Summary:**
The Founder/Owner has ultimate authority and accountability for all aspects of Serenity Care Partners. This role encompasses strategic vision, business development, financial oversight, and ensuring the company delivers exceptional care while maintaining regulatory compliance and profitability.

**Key Responsibilities:**
- Set strategic direction and long-term vision for the organization
- Oversee all business operations, finances, and growth initiatives
- Ensure regulatory compliance across all service lines (DODD, Medicaid, Medicare)
- Build and maintain relationships with payers, partners, and stakeholders
- Recruit and develop executive leadership team
- Approve major financial decisions, contracts, and organizational changes
- Represent the company to external stakeholders and the community

**System Permissions:** Full access to all 41 system permissions

**Required Qualifications:**
- Business ownership/leadership experience
- Understanding of home care industry regulations
- Financial acumen and strategic planning skills
- Strong leadership and decision-making abilities

**Compensation Range:** Equity + market-rate salary

---

#### Chief Executive Officer (CEO)
**System Role:** `ceo`
**Reports To:** Founder / Board of Directors
**Department:** Executive

**Position Summary:**
The CEO is responsible for the overall management and direction of Serenity Care Partners. This role focuses on executing the company's strategic vision, managing day-to-day operations through department heads, and ensuring the organization meets its financial and quality objectives.

**Key Responsibilities:**
- Execute strategic initiatives established by the Founder/Board
- Oversee all department heads (COO, CFO, Director of Nursing, HR Director)
- Ensure quality of care meets or exceeds industry standards
- Manage relationships with key payers and regulatory bodies
- Lead organizational culture and employee engagement initiatives
- Review and approve operational policies and procedures
- Drive revenue growth and operational efficiency
- Report organizational performance to the Founder/Board

**System Permissions:** Full access to all 41 system permissions

**Required Qualifications:**
- Bachelor's degree in Healthcare Administration, Business, or related field (Master's preferred)
- 5+ years healthcare leadership experience
- Strong understanding of home care operations and regulations
- Excellent communication and relationship-building skills
- RN license preferred (especially for clinical oversight)

**Compensation Range:** $120,000 - $180,000 + performance bonus

---

#### Chief Financial Officer (CFO)
**System Role:** `cfo`
**Reports To:** CEO
**Department:** Executive / Finance

**Position Summary:**
The CFO oversees all financial operations of Serenity Care Partners, including billing, revenue cycle management, payroll, accounts payable/receivable, and financial reporting. This role ensures the company maintains financial health while maximizing revenue from payer contracts.

**Key Responsibilities:**
- Develop and manage annual budgets and financial forecasts
- Oversee billing operations, claims submission, and revenue cycle
- Manage relationships with payers and negotiate contracts
- Ensure accurate and timely financial reporting
- Oversee payroll processing and employee compensation
- Manage cash flow, banking relationships, and investments
- Ensure compliance with financial regulations and audit requirements
- Lead Finance Director, Finance Managers, and billing staff

**System Permissions:**
- Full billing access (create, read, update, submit, approve)
- User read/create/update
- Schedule and EVV read
- HR read
- Audit read
- System monitor

**Required Qualifications:**
- Bachelor's degree in Accounting, Finance, or related field (CPA or MBA preferred)
- 5+ years healthcare finance experience
- Deep understanding of Medicaid/Medicare billing and revenue cycle
- Experience with multi-payer environments
- Strong analytical and strategic planning skills

**Compensation Range:** $100,000 - $150,000 + performance bonus

---

#### Chief Operating Officer (COO)
**System Role:** `coo`
**Reports To:** CEO
**Department:** Executive / Operations

**Position Summary:**
The COO oversees all operational functions of Serenity Care Partners, including scheduling, EVV compliance, field operations, HR, and quality assurance. This role ensures efficient service delivery while maintaining compliance with all regulatory requirements.

**Key Responsibilities:**
- Oversee daily operations across all service regions
- Manage Director of Operations, HR Director, and Scheduling Manager
- Ensure EVV compliance meets payer and regulatory requirements
- Develop and implement operational policies and procedures
- Monitor key performance indicators (KPIs) for service delivery
- Resolve escalated operational issues and client concerns
- Lead expansion into new markets and service lines
- Ensure adequate staffing levels across all pods

**System Permissions:**
- Full user management (create, read, update, manage roles)
- Full client management (create, read, update)
- Full schedule management (CRUD + assign)
- EVV read/update/override
- Full HR access (CRUD)
- Incident management
- Audit read

**Required Qualifications:**
- Bachelor's degree in Healthcare Administration, Business, or related field
- 5+ years healthcare operations experience
- Strong understanding of EVV requirements and scheduling systems
- Experience managing multi-site operations
- Excellent problem-solving and leadership skills

**Compensation Range:** $90,000 - $140,000 + performance bonus

---

### FINANCE DEPARTMENT

---

#### Finance Director
**System Role:** `finance_director`
**Reports To:** CFO
**Department:** Finance

**Position Summary:**
The Finance Director manages day-to-day financial operations, supervises finance managers and billing staff, and ensures accurate claims submission and revenue collection. This role serves as the primary point of contact for financial reporting and analysis.

**Key Responsibilities:**
- Supervise Finance Managers (Payroll, Billing, A/P)
- Review and approve claims before submission
- Analyze revenue trends and identify improvement opportunities
- Prepare monthly financial reports for executive leadership
- Manage payer relationships and resolve claim denials
- Ensure compliance with billing regulations and payer contracts
- Coordinate with external auditors and accountants
- Develop and maintain financial policies and procedures

**System Permissions:**
- Billing create/read/update/approve
- User read
- Client read
- Schedule read
- EVV read
- HR read

**Required Qualifications:**
- Bachelor's degree in Accounting, Finance, or Healthcare Administration
- 3+ years healthcare billing/finance experience
- Knowledge of Medicaid/Medicare billing codes and requirements
- Experience with claims management systems
- Strong analytical and supervisory skills

**Compensation Range:** $70,000 - $95,000

---

#### Finance Manager
**System Role:** `finance_manager`
**Reports To:** Finance Director
**Department:** Finance

**Position Summary:**
Finance Managers handle specialized financial functions including payroll processing, billing/accounts receivable, or accounts payable. Each Finance Manager focuses on their area while collaborating with the team to ensure overall financial health.

**Key Responsibilities (varies by specialty):**

*Payroll Specialty:*
- Process bi-weekly payroll for all employees
- Manage time and attendance records
- Handle payroll tax filings and compliance
- Administer employee benefits deductions
- Resolve payroll discrepancies

*Billing/AR Specialty:*
- Submit claims to payers (Medicaid, Medicare, private)
- Follow up on unpaid claims and denials
- Post payments and reconcile accounts
- Generate aging reports and collection activities
- Work with billing coders on documentation issues

*A/P Specialty:*
- Process vendor invoices and payments
- Manage expense reports and reimbursements
- Reconcile bank statements
- Maintain vendor relationships
- Track budget vs. actual spending

**System Permissions:**
- Billing create/read/update/submit
- User read
- Client read
- Schedule read
- EVV read
- HR read

**Required Qualifications:**
- Associate's or Bachelor's degree in Accounting, Finance, or related field
- 2+ years experience in respective specialty area
- Proficiency with accounting/billing software
- Attention to detail and accuracy
- Healthcare experience preferred

**Compensation Range:** $50,000 - $70,000

---

#### Billing Manager
**System Role:** `billing_manager`
**Reports To:** Finance Director
**Department:** Finance

**Position Summary:**
The Billing Manager oversees the billing team, ensures timely claims submission, and manages the revenue cycle from service delivery to payment collection. This role focuses on maximizing revenue while maintaining compliance.

**Key Responsibilities:**
- Supervise billing coders and RCM analysts
- Review claims for accuracy before submission
- Manage denial management and appeals process
- Monitor key billing metrics (DSO, clean claim rate, denial rate)
- Train staff on billing codes and payer requirements
- Coordinate with operations on documentation issues
- Prepare billing reports for leadership

**System Permissions:**
- Billing create/read/update/submit
- Client read
- Schedule read
- EVV read

**Required Qualifications:**
- Associate's or Bachelor's degree preferred
- 3+ years healthcare billing experience
- CPC or similar certification preferred
- Knowledge of ICD-10, CPT, HCPCS codes
- Experience with Medicaid/Medicare billing

**Compensation Range:** $55,000 - $75,000

---

#### RCM Analyst
**System Role:** `rcm_analyst`
**Reports To:** Billing Manager or Finance Director
**Department:** Finance

**Position Summary:**
The Revenue Cycle Management Analyst analyzes billing data, identifies trends, and recommends process improvements to maximize revenue collection and reduce denials. This role provides data-driven insights to the finance team.

**Key Responsibilities:**
- Analyze claims data to identify denial patterns
- Create reports on revenue cycle performance metrics
- Recommend process improvements to reduce denials
- Monitor payer contract performance
- Track and report on key financial indicators
- Support audits with data analysis
- Identify underpayments and recovery opportunities

**System Permissions:**
- Billing read/update
- Client read
- Schedule read
- EVV read

**Required Qualifications:**
- Bachelor's degree in Finance, Healthcare Administration, or related field
- 2+ years revenue cycle or healthcare analytics experience
- Strong Excel and data analysis skills
- Knowledge of healthcare billing processes
- Attention to detail

**Compensation Range:** $50,000 - $70,000

---

#### Insurance Manager
**System Role:** `insurance_manager`
**Reports To:** Finance Director
**Department:** Finance

**Position Summary:**
The Insurance Manager handles payer relationships, manages contract negotiations, and ensures the organization is properly credentialed with all payers. This role maximizes payer reimbursement and maintains compliance with contract terms.

**Key Responsibilities:**
- Maintain relationships with payer representatives
- Negotiate and renew payer contracts
- Ensure organizational credentialing with all payers
- Review and interpret contract terms
- Identify opportunities for rate improvements
- Resolve complex payer disputes
- Track contract renewal dates and terms

**System Permissions:**
- Billing read/update
- Client read

**Required Qualifications:**
- Bachelor's degree preferred
- 3+ years healthcare payer relations experience
- Strong negotiation skills
- Knowledge of Medicaid/Medicare programs
- Excellent communication skills

**Compensation Range:** $55,000 - $75,000

---

#### Billing Coder
**System Role:** `billing_coder`
**Reports To:** Billing Manager
**Department:** Finance

**Position Summary:**
Billing Coders prepare and submit claims for reimbursement, ensuring accurate coding and documentation. This role is critical to revenue generation and compliance.

**Key Responsibilities:**
- Review clinical documentation for billing accuracy
- Apply appropriate diagnosis and procedure codes
- Submit claims to payers electronically
- Correct and resubmit denied claims
- Maintain knowledge of coding updates
- Ensure compliance with payer-specific requirements
- Query clinicians for documentation clarification

**System Permissions:**
- Billing read/update
- Client read

**Required Qualifications:**
- High school diploma required; Associate's degree preferred
- CPC, CCS, or similar certification preferred
- 1+ years medical billing/coding experience
- Knowledge of ICD-10, CPT, HCPCS
- Attention to detail

**Compensation Range:** $40,000 - $55,000

---

### OPERATIONS DEPARTMENT

---

#### Director of Operations / Operations Manager
**System Role:** `operations_manager`
**Reports To:** COO
**Department:** Operations

**Position Summary:**
The Director of Operations oversees all field operations, including scheduling, EVV compliance, pod management, and service delivery. This role ensures efficient operations across all markets while maintaining quality standards and regulatory compliance.

**Key Responsibilities:**
- Manage Field Operations Managers across all regions/markets
- Ensure EVV compliance meets payer requirements (95%+ compliance)
- Oversee scheduling operations and staffing levels
- Resolve escalated operational and client issues
- Develop and implement operational policies
- Monitor service delivery metrics and KPIs
- Coordinate with clinical department on care quality
- Lead expansion planning for new markets

**System Permissions:**
- Full user management (read, create, update)
- Full client management (read, create, update)
- Full schedule management (CRUD + assign)
- EVV read/update/override
- HR read/update
- Audit read
- Incident management

**Required Qualifications:**
- Bachelor's degree in Healthcare Administration or related field
- 3+ years home care operations experience
- Strong understanding of EVV and scheduling systems
- Experience managing remote/distributed teams
- Excellent problem-solving skills

**Compensation Range:** $70,000 - $95,000

---

#### Field Operations Manager
**System Role:** `field_ops_manager`
**Reports To:** Director of Operations
**Department:** Operations

**Position Summary:**
The Field Operations Manager oversees multiple pods of caregivers, ensuring service delivery quality and operational efficiency. This role can manage by geography (market), client portfolio, service line, or shift type depending on organizational needs.

**Key Responsibilities:**
- Supervise 3-5 Pod Leads and their teams (100-150 caregivers)
- Ensure EVV compliance for assigned pods
- Monitor scheduling coverage and fill open shifts
- Handle escalated caregiver and client issues
- Conduct performance reviews for Pod Leads
- Coordinate with HR on hiring and terminations
- Visit clients and caregivers in the field regularly
- Report operational metrics to Director of Operations

**System Permissions:**
- User read
- Client read/update
- Schedule create/read/update/assign
- EVV read/update
- HR read

**Required Qualifications:**
- Associate's or Bachelor's degree preferred
- 2+ years home care supervisory experience
- Valid driver's license and reliable transportation
- Strong communication and leadership skills
- Experience with scheduling software

**Compensation Range:** $55,000 - $75,000

---

#### Pod Lead
**System Role:** `pod_lead`
**Reports To:** Field Operations Manager
**Department:** Operations

**Position Summary:**
The Pod Lead manages a single pod of 30-40 caregivers, serving as the primary point of contact for caregivers in their pod. This role ensures daily operations run smoothly and caregivers have the support they need.

**Key Responsibilities:**
- Supervise 30-40 caregivers in assigned pod
- Handle day-to-day scheduling adjustments and call-offs
- Monitor EVV compliance and coach caregivers on proper use
- Conduct caregiver check-ins and support visits
- Onboard new caregivers in the pod
- Address caregiver questions and concerns
- Report issues to Field Operations Manager
- Maintain caregiver engagement and retention

**System Permissions:**
- User read
- Client read
- Schedule read/update/assign
- EVV read/update
- HR read

**Required Qualifications:**
- High school diploma required; Associate's degree preferred
- 1+ years home care experience
- Previous supervisory experience preferred
- Strong communication and organizational skills
- Ability to work flexible hours

**Compensation Range:** $45,000 - $60,000

---

#### Field Supervisor
**System Role:** `field_supervisor`
**Reports To:** Pod Lead or Field Operations Manager
**Department:** Operations

**Position Summary:**
The Field Supervisor provides on-the-ground support to caregivers, conducts supervisory visits, and ensures quality service delivery. This role bridges the gap between office staff and field caregivers.

**Key Responsibilities:**
- Conduct supervisory visits to client homes
- Observe caregiver performance and provide feedback
- Verify care plan compliance during visits
- Handle immediate field issues and escalations
- Train new caregivers on client-specific needs
- Document supervisory visit findings
- Report concerns to Pod Lead

**System Permissions:**
- User read
- Client read
- Schedule read/update
- EVV read/update
- HR read

**Required Qualifications:**
- High school diploma required
- 2+ years caregiving experience
- Valid driver's license and reliable transportation
- Strong interpersonal skills
- Ability to provide constructive feedback

**Compensation Range:** $40,000 - $55,000

---

#### Scheduling Manager
**System Role:** `scheduling_manager`
**Reports To:** COO or Director of Operations
**Department:** Operations

**Position Summary:**
The Scheduling Manager oversees the scheduling team and ensures all client shifts are covered with qualified caregivers. This role optimizes scheduling efficiency while balancing client needs and caregiver preferences.

**Key Responsibilities:**
- Supervise schedulers and dispatchers
- Develop scheduling policies and procedures
- Ensure adequate coverage across all markets
- Optimize caregiver utilization and travel time
- Handle complex scheduling situations
- Monitor scheduling metrics (fill rate, overtime, etc.)
- Coordinate with HR on staffing needs
- Implement scheduling system improvements

**System Permissions:**
- Full schedule management (CRUD + assign)
- User read
- Client read
- EVV read
- HR read

**Required Qualifications:**
- Associate's or Bachelor's degree preferred
- 2+ years scheduling or operations experience
- Experience with scheduling software
- Strong analytical and problem-solving skills
- Excellent organizational abilities

**Compensation Range:** $50,000 - $70,000

---

#### Scheduler
**System Role:** `scheduler`
**Reports To:** Scheduling Manager
**Department:** Operations

**Position Summary:**
Schedulers create and maintain caregiver schedules, matching clients with qualified caregivers while considering availability, skills, and geography. This role ensures all authorized hours are scheduled and staffed.

**Key Responsibilities:**
- Create and maintain weekly caregiver schedules
- Match caregivers to clients based on qualifications and preferences
- Handle schedule changes and call-offs
- Communicate schedule updates to caregivers
- Monitor authorization hours vs. scheduled hours
- Coordinate with billing on service verification
- Maintain scheduling records and documentation

**System Permissions:**
- Schedule create/read/update/assign
- User read
- Client read
- EVV read
- HR read

**Required Qualifications:**
- High school diploma required; Associate's degree preferred
- 1+ years scheduling or customer service experience
- Proficiency with scheduling software
- Strong attention to detail
- Excellent communication skills

**Compensation Range:** $38,000 - $50,000

---

#### Dispatcher
**System Role:** `dispatcher`
**Reports To:** Scheduling Manager
**Department:** Operations

**Position Summary:**
The Dispatcher handles real-time scheduling needs, including same-day call-offs, urgent shift coverage, and caregiver coordination. This fast-paced role requires quick thinking and excellent communication.

**Key Responsibilities:**
- Monitor real-time scheduling status
- Handle same-day call-offs and find replacement coverage
- Communicate urgent schedule changes
- Track caregiver locations and ETAs
- Escalate coverage issues that cannot be resolved
- Maintain call log and documentation
- Support after-hours scheduling needs

**System Permissions:**
- Schedule read/update
- User read
- Client read
- EVV read

**Required Qualifications:**
- High school diploma required
- Customer service or dispatch experience
- Ability to work in fast-paced environment
- Strong problem-solving skills
- Flexible schedule (may include evenings/weekends)

**Compensation Range:** $35,000 - $48,000

---

#### QA Manager / Quality Assurance Manager
**System Role:** `qa_manager`
**Reports To:** COO or CEO
**Department:** Operations / Compliance

**Position Summary:**
The QA Manager ensures service quality meets organizational standards and regulatory requirements. This role conducts audits, manages incident reports, and drives continuous quality improvement.

**Key Responsibilities:**
- Develop and implement quality assurance programs
- Conduct internal audits of documentation and processes
- Manage incident reporting and investigation
- Track and analyze quality metrics
- Lead quality improvement initiatives
- Ensure compliance with regulatory requirements
- Train staff on quality standards
- Prepare for external audits and surveys

**System Permissions:**
- Client read + PHI access
- User read
- Schedule read
- EVV read
- Billing read
- HR read
- Audit read
- Incident management

**Required Qualifications:**
- Bachelor's degree in Healthcare Administration or related field
- 3+ years healthcare quality assurance experience
- Knowledge of DODD, Medicaid, and CMS requirements
- Experience with incident management
- Strong analytical skills

**Compensation Range:** $60,000 - $80,000

---

### CLINICAL DEPARTMENT

---

#### Director of Nursing
**System Role:** `director_of_nursing`
**Reports To:** CEO
**Department:** Clinical

**Position Summary:**
The Director of Nursing provides clinical leadership for all nursing and home health services. This role ensures clinical quality, regulatory compliance, and proper oversight of clinical staff including RNs, LPNs, and home health aides.

**Key Responsibilities:**
- Oversee all clinical staff and nursing operations
- Ensure clinical compliance with state and federal regulations
- Develop and implement clinical policies and procedures
- Review and approve care plans
- Manage clinical staff credentialing and competencies
- Handle clinical escalations and complex care situations
- Coordinate with operations on service delivery
- Participate in interdisciplinary care planning
- Lead clinical quality improvement initiatives

**System Permissions:**
- User read/create
- Client read + PHI access
- Client assess (OASIS, evaluations)
- Care plan read/write
- Med order
- Schedule read
- EVV read
- HR read/update
- Credential verify
- Incident management
- Audit read

**Required Qualifications:**
- Bachelor's degree in Nursing (BSN required; MSN preferred)
- Active RN license in Ohio
- 5+ years nursing experience with 2+ years in leadership
- Home health or home care experience required
- Strong knowledge of Medicare/Medicaid regulations
- Excellent clinical judgment and leadership skills

**Compensation Range:** $85,000 - $120,000

---

#### Clinical Director
**System Role:** `clinical_director`
**Reports To:** Director of Nursing or CEO
**Department:** Clinical

**Position Summary:**
The Clinical Director supports the Director of Nursing in overseeing clinical operations, focusing on care plan management, clinical documentation, and quality assurance. This role may specialize in specific service lines or populations.

**Key Responsibilities:**
- Review and approve care plans
- Conduct clinical audits and chart reviews
- Manage clinical incidents and grievances
- Support clinical staff training and development
- Coordinate with QIDP/therapist teams
- Ensure documentation meets regulatory requirements
- Participate in case conferences and care planning

**System Permissions:**
- User read
- Client read + PHI access
- Client assess
- Care plan read/write
- Incident management
- Audit read

**Required Qualifications:**
- Bachelor's degree in Nursing or related clinical field
- Active clinical license (RN, LISW, etc.)
- 3+ years clinical leadership experience
- Strong documentation and analytical skills
- Knowledge of regulatory requirements

**Compensation Range:** $70,000 - $95,000

---

#### Nursing Supervisor
**System Role:** `nursing_supervisor`
**Reports To:** Director of Nursing
**Department:** Clinical

**Position Summary:**
The Nursing Supervisor provides clinical oversight for RN Case Managers and clinical field staff within an assigned market or region. This role ensures clinical quality and supports nurses in complex care situations.

**Key Responsibilities:**
- Supervise RN Case Managers and clinical field staff
- Review and co-sign care plans and assessments
- Provide clinical guidance on complex cases
- Conduct supervisory visits and chart audits
- Ensure clinical documentation compliance
- Handle clinical escalations
- Participate in on-call rotation
- Support clinical staff training

**System Permissions:**
- User read
- Client read + PHI access
- Client assess
- Care plan read/write
- Med order
- Schedule read
- EVV read
- HR read

**Required Qualifications:**
- Bachelor's degree in Nursing (BSN preferred)
- Active RN license in Ohio
- 3+ years nursing experience
- Supervisory experience preferred
- Home health experience preferred

**Compensation Range:** $70,000 - $90,000

---

#### RN Case Manager
**System Role:** `rn_case_manager`
**Reports To:** Nursing Supervisor or Director of Nursing
**Department:** Clinical

**Position Summary:**
The RN Case Manager provides clinical oversight for assigned clients, developing care plans, conducting assessments, and ensuring quality care delivery. This role serves as the clinical lead for client care coordination.

**Key Responsibilities:**
- Conduct initial and ongoing client assessments
- Develop and update individualized care plans
- Coordinate care with physicians and other providers
- Supervise LPNs, HHAs, and CNAs providing care
- Make skilled nursing visits as needed
- Document clinical findings and interventions
- Participate in interdisciplinary care conferences
- Educate clients and families on care needs

**System Permissions:**
- User read
- Client read + PHI access
- Client assess
- Care plan read/write
- Med order
- Med administer
- Schedule read
- EVV create/read
- HR read

**Required Qualifications:**
- Bachelor's degree in Nursing preferred (ADN accepted)
- Active RN license in Ohio
- 2+ years nursing experience
- Home health or case management experience preferred
- Strong assessment and documentation skills
- Valid driver's license

**Compensation Range:** $65,000 - $85,000

---

#### LPN / LVN (Licensed Practical Nurse)
**System Role:** `lpn_lvn`
**Reports To:** RN Case Manager
**Department:** Clinical

**Position Summary:**
The LPN provides skilled nursing care to clients under the supervision of an RN. This role performs nursing tasks within the LPN scope of practice, including medication administration, wound care, and health monitoring.

**Key Responsibilities:**
- Provide skilled nursing care per the care plan
- Administer medications and treatments
- Monitor client health status and report changes
- Document care provided and observations
- Communicate with RN Case Manager on client needs
- Educate clients and families on care procedures
- Maintain supplies and equipment

**System Permissions:**
- Client read + PHI access
- Care plan read
- Med administer
- Schedule read
- EVV create

**Required Qualifications:**
- Graduate of accredited LPN program
- Active LPN/LVN license in Ohio
- 1+ years nursing experience preferred
- Home health experience preferred
- Valid driver's license

**Compensation Range:** $45,000 - $58,000 (or $22-28/hour)

---

#### QIDP (Qualified Intellectual Disability Professional)
**System Role:** `qidp`
**Reports To:** Clinical Director or Director of Nursing
**Department:** Clinical

**Position Summary:**
The QIDP develops and oversees Individual Service Plans (ISPs) for clients with developmental disabilities. This role ensures person-centered planning and coordination of services to support client independence and community integration.

**Key Responsibilities:**
- Develop and update Individual Service Plans (ISPs)
- Conduct assessments for functional abilities
- Coordinate services across providers
- Monitor progress toward goals
- Write behavior support plans
- Train DSPs on ISP implementation
- Participate in ISP team meetings
- Ensure documentation compliance

**System Permissions:**
- Client read + PHI access
- Care plan read/write
- Behavior plan write
- Behavior log write
- Schedule update

**Required Qualifications:**
- Bachelor's degree in human services field
- QIDP certification or eligibility
- 2+ years experience with DD population
- Strong person-centered planning skills
- Knowledge of DODD regulations

**Compensation Range:** $50,000 - $70,000

---

#### Therapist (PT/OT/SLP)
**System Role:** `therapist`
**Reports To:** Clinical Director or Director of Nursing
**Department:** Clinical

**Position Summary:**
Therapists provide specialized rehabilitation services to clients in their homes. This includes Physical Therapists (PT), Occupational Therapists (OT), and Speech-Language Pathologists (SLP).

**Key Responsibilities:**
- Conduct therapy evaluations and assessments
- Develop treatment plans with measurable goals
- Provide therapeutic interventions per the plan
- Document progress and adjust treatment as needed
- Educate clients and families on exercises/techniques
- Coordinate with other care team members
- Maintain therapy equipment and supplies

**System Permissions:**
- Client read + PHI access
- Client assess
- Care plan read/write (therapy goals)
- Schedule read

**Required Qualifications:**
- Graduate degree in respective therapy discipline
- Active state license (PT, OT, or SLP)
- 1+ years clinical experience
- Home health experience preferred
- Valid driver's license

**Compensation Range:** $70,000 - $95,000 (or $40-55/hour per visit)

---

### DIRECT CARE STAFF

---

#### DSP Med-Certified (Direct Support Professional - Medication Certified)
**System Role:** `dsp_med`
**Reports To:** Pod Lead (Operations) / RN Case Manager (Clinical oversight)
**Department:** Operations (with clinical dotted line)

**Position Summary:**
The Med-Certified DSP provides direct care to clients with developmental disabilities, including medication administration. This role supports clients with daily living activities while ensuring their health and safety.

**Key Responsibilities:**
- Provide personal care assistance (bathing, dressing, toileting)
- Administer medications per physician orders
- Document medication administration and observations
- Support clients with daily living activities
- Implement behavior support plans
- Transport clients to appointments and activities
- Complete EVV clock-in/out for all visits
- Report changes in client condition

**System Permissions:**
- Client read
- Care plan read
- Med administer
- Behavior log write
- Schedule read
- EVV create

**Required Qualifications:**
- High school diploma or GED
- Medication Administration certification (DODD)
- DSP certification or completion within 120 days
- First Aid/CPR certification
- Reliable transportation
- Pass background check

**Compensation Range:** $16-20/hour

---

#### DSP Basic (Direct Support Professional)
**System Role:** `dsp_basic`
**Reports To:** Pod Lead (Operations) / RN Case Manager (Clinical oversight)
**Department:** Operations (with clinical dotted line)

**Position Summary:**
The DSP provides direct care to clients with developmental disabilities, supporting them with daily activities and community integration. This entry-level caregiving role focuses on promoting client independence and quality of life.

**Key Responsibilities:**
- Provide personal care assistance
- Support clients with daily living activities
- Accompany clients on community outings
- Document care provided and observations
- Implement ISP goals and objectives
- Complete EVV clock-in/out for all visits
- Report changes in client condition
- Maintain client dignity and respect

**System Permissions:**
- Client read
- Care plan read
- Behavior log write
- Schedule read
- EVV create

**Required Qualifications:**
- High school diploma or GED
- DSP certification or completion within 120 days
- First Aid/CPR certification
- Reliable transportation
- Pass background check
- Compassionate and patient demeanor

**Compensation Range:** $14-18/hour

---

#### Home Health Aide (HHA)
**System Role:** `hha`
**Reports To:** RN Case Manager (Clinical)
**Department:** Clinical

**Position Summary:**
The Home Health Aide provides personal care services to clients in their homes under the supervision of a registered nurse. This role focuses on helping clients with activities of daily living and monitoring their health status.

**Key Responsibilities:**
- Assist clients with bathing, grooming, and personal hygiene
- Help with dressing and mobility
- Prepare meals and assist with feeding
- Perform light housekeeping duties
- Take and record vital signs
- Complete EVV clock-in/out for all visits
- Report changes in client condition to RN
- Document care provided

**System Permissions:**
- Client read
- Care plan read
- Schedule read
- EVV create/read
- HR read

**Required Qualifications:**
- High school diploma or GED
- State-approved HHA certification (75+ hours training)
- First Aid/CPR certification
- Reliable transportation
- Pass background check
- Compassionate and patient demeanor

**Compensation Range:** $14-18/hour

---

#### CNA (Certified Nursing Assistant)
**System Role:** `cna`
**Reports To:** RN Case Manager (Clinical)
**Department:** Clinical

**Position Summary:**
The CNA provides nursing assistant care to clients under RN supervision. This role has expanded scope compared to HHA, including ability to assist with certain medication administration and more complex care tasks.

**Key Responsibilities:**
- Provide personal care (bathing, dressing, toileting)
- Assist with medication reminders/administration (as permitted)
- Take and record vital signs
- Assist with mobility and transfers
- Perform range of motion exercises
- Maintain clean and safe environment
- Complete EVV clock-in/out for all visits
- Document care and report changes to RN

**System Permissions:**
- Client read
- Care plan read
- Med administer (as delegated)
- Schedule read
- EVV create/read
- HR read

**Required Qualifications:**
- High school diploma or GED
- State CNA certification
- Listed on Nurse Aide Registry
- First Aid/CPR certification
- Reliable transportation
- Pass background check

**Compensation Range:** $15-20/hour

---

#### Caregiver (Legacy)
**System Role:** `caregiver`
**Reports To:** Pod Lead
**Department:** Operations

**Position Summary:**
This is a legacy role for caregivers who may not fit specifically into DSP, HHA, or CNA categories. The role provides general caregiving services based on training and certification level.

**Key Responsibilities:**
- Provide care per individual training and certification
- Support clients with authorized services
- Complete EVV clock-in/out for all visits
- Document care provided
- Report concerns to supervisor

**System Permissions:**
- Schedule read
- EVV create/read
- HR read

**Required Qualifications:**
- High school diploma or GED
- Relevant certifications for services provided
- First Aid/CPR certification
- Reliable transportation
- Pass background check

**Compensation Range:** $13-18/hour (varies by certification)

---

### HR DEPARTMENT

---

#### HR Director
**System Role:** `hr_director`
**Reports To:** COO or CEO
**Department:** Human Resources

**Position Summary:**
The HR Director oversees all human resources functions including recruiting, employee relations, credentialing, and compliance. This role ensures the organization attracts, develops, and retains qualified staff while maintaining regulatory compliance.

**Key Responsibilities:**
- Develop and implement HR policies and procedures
- Oversee recruiting and talent acquisition
- Manage employee relations and performance issues
- Ensure compliance with employment laws
- Oversee credentialing and background check processes
- Administer employee benefits programs
- Lead workforce planning and development
- Manage HR budget and vendors

**System Permissions:**
- Full user management (CRUD + manage roles)
- Full HR management (CRUD)
- Credential verify
- Audit read

**Required Qualifications:**
- Bachelor's degree in Human Resources, Business, or related field
- SHRM-CP/SHRM-SCP or PHR/SPHR preferred
- 5+ years HR experience with 2+ years in leadership
- Healthcare HR experience preferred
- Strong knowledge of employment law
- Excellent interpersonal skills

**Compensation Range:** $75,000 - $100,000

---

#### HR Manager
**System Role:** `hr_manager`
**Reports To:** HR Director
**Department:** Human Resources

**Position Summary:**
HR Managers handle day-to-day HR operations in specialized areas such as recruiting, employee relations, or credentialing. This role serves as the primary HR contact for employees and supervisors.

**Key Responsibilities:**
- Handle employee relations issues and investigations
- Process new hires and terminations
- Manage employee records and documentation
- Support benefits administration
- Conduct employee orientations
- Assist with performance management
- Ensure compliance with HR policies
- Generate HR reports and metrics

**System Permissions:**
- User create/read/update
- Full HR management (CRUD)
- Credential verify

**Required Qualifications:**
- Bachelor's degree in Human Resources or related field
- 2+ years HR experience
- Knowledge of employment laws and regulations
- Strong interpersonal and communication skills
- Attention to detail

**Compensation Range:** $50,000 - $70,000

---

#### Recruiter
**System Role:** `recruiter`
**Reports To:** HR Manager or HR Director
**Department:** Human Resources

**Position Summary:**
The Recruiter sources, screens, and hires qualified caregivers and other staff to meet organizational staffing needs. This high-volume role requires creativity and persistence to maintain adequate staffing levels.

**Key Responsibilities:**
- Source candidates through job boards, social media, referrals
- Screen resumes and conduct phone screens
- Coordinate and conduct interviews
- Manage applicant tracking and communication
- Attend job fairs and recruiting events
- Onboard new hires and coordinate orientation
- Track recruiting metrics and report results
- Build talent pipeline for future needs

**System Permissions:**
- User create/read
- HR create/read/update

**Required Qualifications:**
- Associate's or Bachelor's degree preferred
- 1+ years recruiting or HR experience
- Healthcare recruiting experience preferred
- Strong communication and sales skills
- Proficiency with applicant tracking systems

**Compensation Range:** $45,000 - $60,000 + hiring bonuses

---

#### Credentialing Specialist
**System Role:** `credentialing_specialist`
**Reports To:** HR Manager or HR Director
**Department:** Human Resources

**Position Summary:**
The Credentialing Specialist ensures all staff credentials, certifications, and background checks are current and compliant with regulatory requirements. This detail-oriented role is critical for maintaining eligibility to provide services.

**Key Responsibilities:**
- Verify credentials and certifications for new hires
- Monitor credential expiration dates
- Process background checks and exclusion list checks
- Maintain credential files and documentation
- Send renewal reminders to employees
- Coordinate license verifications with state boards
- Ensure compliance with payer credentialing requirements
- Generate credentialing reports and audits

**System Permissions:**
- User read
- HR read/update
- Credential verify

**Required Qualifications:**
- High school diploma required; Associate's degree preferred
- 1+ years credentialing or HR experience
- Healthcare credentialing experience preferred
- Strong attention to detail
- Proficiency with credentialing software

**Compensation Range:** $40,000 - $55,000

---

### COMPLIANCE & IT DEPARTMENT

---

#### Compliance Officer
**System Role:** `compliance_officer`
**Reports To:** CEO or COO
**Department:** Compliance

**Position Summary:**
The Compliance Officer ensures organizational compliance with all applicable laws, regulations, and payer requirements. This role develops compliance programs, conducts audits, and manages risk.

**Key Responsibilities:**
- Develop and maintain compliance program
- Conduct internal audits and risk assessments
- Monitor regulatory changes and update policies
- Investigate compliance concerns and complaints
- Manage incident reporting and resolution
- Coordinate with external auditors and surveyors
- Train staff on compliance requirements
- Report compliance status to leadership

**System Permissions:**
- User read
- Client read + PHI access
- Schedule read
- EVV read
- Billing read
- HR read
- Audit read
- Incident management

**Required Qualifications:**
- Bachelor's degree in Healthcare Administration, Law, or related field
- CHC or similar certification preferred
- 3+ years healthcare compliance experience
- Strong knowledge of healthcare regulations
- Excellent analytical and investigation skills

**Compensation Range:** $70,000 - $95,000

---

#### Security Officer
**System Role:** `security_officer`
**Reports To:** CEO or IT Admin
**Department:** Compliance / IT

**Position Summary:**
The Security Officer is responsible for information security, including HIPAA compliance, data protection, and security incident management. This role ensures the organization protects sensitive information.

**Key Responsibilities:**
- Develop and maintain security policies
- Conduct security risk assessments
- Manage security incidents and breaches
- Ensure HIPAA compliance for ePHI
- Oversee access controls and user permissions
- Conduct security awareness training
- Monitor security systems and alerts
- Coordinate penetration testing and audits

**System Permissions:**
- User read
- Audit read
- Security manage
- Incident management
- System monitor
- AI admin

**Required Qualifications:**
- Bachelor's degree in Information Security, IT, or related field
- CISSP, CISM, or similar certification preferred
- 3+ years information security experience
- Healthcare security experience preferred
- Strong knowledge of HIPAA requirements

**Compensation Range:** $75,000 - $100,000

---

#### IT Admin
**System Role:** `it_admin`
**Reports To:** COO or CEO
**Department:** IT

**Position Summary:**
The IT Admin manages all technology systems, including the ERP platform, network infrastructure, and user support. This role ensures reliable system operation and provides technical support to staff.

**Key Responsibilities:**
- Manage ERP system configuration and updates
- Administer user accounts and access
- Maintain network and hardware infrastructure
- Provide technical support to staff
- Manage vendor relationships for IT services
- Implement system backups and disaster recovery
- Monitor system performance and security
- Support mobile device management

**System Permissions:**
- User read/update
- System config
- System backup
- System monitor
- Security manage
- AI admin

**Required Qualifications:**
- Bachelor's degree in Information Technology or related field
- 3+ years IT administration experience
- Experience with cloud systems (GCP/AWS)
- Strong troubleshooting skills
- Healthcare IT experience preferred

**Compensation Range:** $65,000 - $90,000

---

#### Support Agent
**System Role:** `support_agent`
**Reports To:** IT Admin
**Department:** IT

**Position Summary:**
The Support Agent provides first-line technical support to staff and users, resolving issues with the ERP system, mobile apps, and other technology. This role ensures users can effectively use organizational systems.

**Key Responsibilities:**
- Respond to help desk tickets and calls
- Troubleshoot system and application issues
- Guide users through system features
- Document issues and resolutions
- Escalate complex issues to IT Admin
- Create user guides and documentation
- Assist with user training
- Monitor system status and alerts

**System Permissions:**
- User read
- Client read
- Schedule read

**Required Qualifications:**
- High school diploma required; Associate's degree preferred
- 1+ years help desk or customer service experience
- Strong communication and patience
- Technical aptitude and troubleshooting skills
- Ability to explain technical concepts simply

**Compensation Range:** $35,000 - $50,000

---

### EXTERNAL ACCESS ROLES

---

#### Client
**System Role:** `client`
**Portal:** Client Portal
**Department:** N/A (External)

**Position Summary:**
Clients receiving care services have limited access to view their own care information through the client portal.

**Portal Access:**
- View personal schedule
- See upcoming and past visits
- Access care plan (if enabled)
- Contact their care team
- Provide feedback on services

**System Permissions:**
- Schedule read (own schedule only)
- AI interact (chat support)

---

#### Family Member
**System Role:** `family`
**Portal:** Family Portal
**Department:** N/A (External)

**Position Summary:**
Authorized family members can access limited information about their loved one's care through the family portal.

**Portal Access:**
- View family member's schedule
- See visit history
- Receive notifications
- Contact the care team
- Provide feedback

**System Permissions:**
- Schedule read (authorized family member only)
- AI interact (chat support)

**Requirements:**
- Must be authorized by client or legal guardian
- Portal access explicitly enabled
- Signed confidentiality agreement

---

#### Payer Auditor
**System Role:** `payer_auditor`
**Portal:** Audit Portal
**Department:** N/A (External)

**Position Summary:**
Payer auditors from Medicaid, Medicare, or private insurance companies have read-only access to conduct audits and reviews.

**Audit Access:**
- Client records (de-identified unless specific audit)
- Schedule and visit documentation
- EVV records
- Billing claims and documentation
- Audit trails

**System Permissions:**
- Client read
- Schedule read
- EVV read
- Billing read
- Audit read

**Requirements:**
- Formal audit request from payer
- Time-limited access
- All access logged and monitored
- Signed confidentiality agreement

---

#### AI Service
**System Role:** `ai_service`
**Department:** System (Internal)

**Position Summary:**
This is a system role for AI-powered services and automation that need to access data for processing, analysis, and recommendations.

**System Access:**
- Read-only access to operational data
- No PHI access without explicit authorization
- Actions logged for audit

**System Permissions:**
- User read
- Client read
- Schedule read
- EVV read
- Billing read
- HR read
- AI interact

**Requirements:**
- Service account with no human login
- All actions logged
- Regular access reviews
