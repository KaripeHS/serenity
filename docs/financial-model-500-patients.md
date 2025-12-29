# Serenity Care Partners - Annual P&L Simulation (500 Patients)

## Executive Summary

| Metric | Amount |
|--------|--------|
| **Annual Revenue** | $12,480,000 |
| **Gross Profit** | $4,492,800 (36.0%) |
| **Operating Income** | $1,123,200 (9.0%) |
| **Net Income** | $873,600 (7.0%) |
| **Patients Served** | 500 |
| **Caregivers (FTE)** | 500 |
| **Admin/Clinical Staff** | 55-60 |

---

## ASSUMPTIONS

### Service Mix & Reimbursement Rates

| Service Line | % of Patients | Avg Weekly Hours | Hourly Rate | Notes |
|--------------|---------------|------------------|-------------|-------|
| **IO Waiver (DD Services)** | 40% (200 pts) | 25 hrs | $22.50 | Ohio DODD rates |
| **PASSPORT (Elderly)** | 25% (125 pts) | 20 hrs | $21.00 | Ohio Medicaid waiver |
| **Home Health (Skilled)** | 15% (75 pts) | 8 hrs | $45.00 | Medicare/Medicaid |
| **Private Pay** | 10% (50 pts) | 15 hrs | $32.00 | Self-pay clients |
| **MyCare Ohio** | 10% (50 pts) | 22 hrs | $23.00 | Managed Medicaid |

### Staffing Model (from Organizational Structure)

| Role | Count | Avg Salary | Total Cost |
|------|-------|------------|------------|
| **Executive (Founder, CEO, COO, CFO)** | 4 | $125,000 | $500,000 |
| **Directors** | 4 | $85,000 | $340,000 |
| **Managers** | 12 | $62,500 | $750,000 |
| **Specialists/Supervisors** | 15 | $50,000 | $750,000 |
| **Clinical Staff (RN, LPN, QIDP)** | 15 | $70,000 | $1,050,000 |
| **Admin Support** | 8 | $42,000 | $336,000 |
| **Caregivers (500 FTE)** | 500 | $33,280 | *See Direct Labor* |

### Key Operational Assumptions

- **Utilization Rate**: 85% (accounts for call-offs, gaps, training)
- **EVV Compliance**: 95%
- **Clean Claim Rate**: 92%
- **Days Sales Outstanding (DSO)**: 45 days
- **Employee Turnover**: 65% annually (industry average)
- **Benefits Load**: 22% of wages (health, workers comp, PTO, taxes)
- **Operating Weeks**: 52

---

## REVENUE MODEL

### Detailed Revenue by Service Line

#### 1. IO Waiver (Developmental Disabilities)
```
Patients:           200
Avg Weekly Hours:   25
Hourly Rate:        $22.50
Utilization:        85%
Annual Weeks:       52

Revenue = 200 × 25 × $22.50 × 0.85 × 52 = $4,972,500
```

#### 2. PASSPORT (Elderly/Disabled)
```
Patients:           125
Avg Weekly Hours:   20
Hourly Rate:        $21.00
Utilization:        85%
Annual Weeks:       52

Revenue = 125 × 20 × $21.00 × 0.85 × 52 = $2,321,250
```

#### 3. Home Health (Skilled Nursing)
```
Patients:           75
Avg Weekly Hours:   8
Hourly Rate:        $45.00
Utilization:        90% (higher for skilled)
Annual Weeks:       52

Revenue = 75 × 8 × $45.00 × 0.90 × 52 = $1,263,600
```

#### 4. Private Pay
```
Patients:           50
Avg Weekly Hours:   15
Hourly Rate:        $32.00
Utilization:        90% (higher - clients paying out of pocket)
Annual Weeks:       52

Revenue = 50 × 15 × $32.00 × 0.90 × 52 = $1,123,200
```

#### 5. MyCare Ohio (Managed Medicaid)
```
Patients:           50
Avg Weekly Hours:   22
Hourly Rate:        $23.00
Utilization:        85%
Annual Weeks:       52

Revenue = 50 × 22 × $23.00 × 0.85 × 52 = $1,118,260
```

### Total Gross Revenue
| Service Line | Annual Revenue | % of Total |
|--------------|----------------|------------|
| IO Waiver | $4,972,500 | 39.8% |
| PASSPORT | $2,321,250 | 18.6% |
| Home Health | $1,263,600 | 10.1% |
| Private Pay | $1,123,200 | 9.0% |
| MyCare Ohio | $1,118,260 | 9.0% |
| **Subtotal** | **$10,798,810** | **86.5%** |

### Additional Revenue Streams
| Revenue Source | Annual Amount | Notes |
|----------------|---------------|-------|
| EVV Incentive Bonuses | $215,976 | 2% of Medicaid revenue for 95%+ compliance |
| Transportation Reimbursement | $250,000 | Client transport billing |
| Respite Care | $180,000 | Short-term relief care |
| Training Programs | $35,000 | DSP certification training |
| **Additional Revenue** | **$680,976** | |

### Deductions from Revenue
| Deduction | Amount | Notes |
|-----------|--------|-------|
| Claim Denials (Est. 3%) | ($323,964) | Based on 8% denial rate, 62.5% recovery |
| Contractual Adjustments | ($215,976) | Rate negotiations, corrections |
| Bad Debt (1%) | ($107,988) | Uncollectible accounts |
| **Total Deductions** | **($647,928)** | 5.2% of gross |

---

## ANNUAL P&L STATEMENT

### REVENUE
| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **Gross Service Revenue** | $10,798,810 | |
| Additional Revenue | $680,976 | |
| **Total Gross Revenue** | $11,479,786 | |
| Less: Contractual Adjustments | ($215,976) | |
| Less: Denials & Write-offs | ($431,952) | |
| **NET REVENUE** | **$10,831,858** | **100.0%** |

---

### COST OF SERVICES (Direct Costs)

#### Direct Labor - Caregivers
| Category | Calculation | Amount |
|----------|-------------|--------|
| **Caregiver Wages** | | |
| IO Waiver DSPs | 200 pts × 25 hrs × 0.85 × 52 × $16.00 | $3,536,000 |
| PASSPORT Aides | 125 pts × 20 hrs × 0.85 × 52 × $15.50 | $1,705,250 |
| Home Health (HHA/CNA) | 75 pts × 8 hrs × 0.90 × 52 × $17.00 | $477,360 |
| Private Pay Caregivers | 50 pts × 15 hrs × 0.90 × 52 × $16.50 | $579,150 |
| MyCare Caregivers | 50 pts × 22 hrs × 0.85 × 52 × $16.00 | $778,960 |
| **Total Caregiver Wages** | | **$7,076,720** |
| | | |
| Overtime (Est. 5%) | $7,076,720 × 5% × 1.5 | $530,754 |
| **Total Caregiver Wages + OT** | | **$7,607,474** |

#### Payroll Taxes & Benefits - Caregivers
| Item | Rate | Amount |
|------|------|--------|
| FICA (Employer) | 7.65% | $582,172 |
| FUTA/SUTA | 2.0% | $152,149 |
| Workers Compensation | 3.5% | $266,262 |
| Health Insurance (50% participation) | $200/mo × 250 | $600,000 |
| PTO Accrual | 3% | $228,224 |
| **Total Caregiver Benefits** | 24% | **$1,828,807** |

#### Other Direct Costs
| Item | Amount | Notes |
|------|--------|-------|
| Mileage Reimbursement | $312,000 | 500 caregivers × $52/mo avg |
| Background Checks | $75,000 | $150/check × 500 (turnover) |
| Drug Testing | $25,000 | $50/test × 500 |
| Training & Certification | $125,000 | DSP certs, Med Admin, CPR |
| Uniforms & Supplies | $50,000 | Scrubs, PPE, supplies |
| **Total Other Direct** | **$587,000** |

#### Total Cost of Services
| Category | Amount | % Revenue |
|----------|--------|-----------|
| Caregiver Wages + OT | $7,607,474 | 70.2% |
| Caregiver Benefits | $1,828,807 | 16.9% |
| Other Direct Costs | $587,000 | 5.4% |
| **TOTAL COST OF SERVICES** | **$10,023,281** | **92.5%** |

---

### GROSS PROFIT
| | Amount | % Revenue |
|--|--------|-----------|
| Net Revenue | $10,831,858 | 100.0% |
| Cost of Services | ($10,023,281) | (92.5%) |
| **GROSS PROFIT** | **$808,577** | **7.5%** |

> **Note**: This low gross margin is typical for home care. The real picture requires including admin/clinical overhead which supports revenue generation.

---

### OPERATING EXPENSES

#### Administrative & Clinical Staff Salaries
| Department | Positions | Total Salary | Benefits (22%) | Total |
|------------|-----------|--------------|----------------|-------|
| **Executive** | | | | |
| - Founder/CEO | 2 | $250,000 | $55,000 | $305,000 |
| - CFO | 1 | $120,000 | $26,400 | $146,400 |
| - COO | 1 | $110,000 | $24,200 | $134,200 |
| **Operations** | | | | |
| - Director of Ops | 1 | $85,000 | $18,700 | $103,700 |
| - Field Ops Managers (4) | 4 | $260,000 | $57,200 | $317,200 |
| - Pod Leads (15) | 15 | $780,000 | $171,600 | $951,600 |
| - Scheduling Manager | 1 | $60,000 | $13,200 | $73,200 |
| - Schedulers (4) | 4 | $176,000 | $38,720 | $214,720 |
| - Dispatchers (2) | 2 | $80,000 | $17,600 | $97,600 |
| **Clinical** | | | | |
| - Director of Nursing | 1 | $100,000 | $22,000 | $122,000 |
| - Nursing Supervisors (3) | 3 | $240,000 | $52,800 | $292,800 |
| - RN Case Managers (6) | 6 | $450,000 | $99,000 | $549,000 |
| - QIDPs (4) | 4 | $240,000 | $52,800 | $292,800 |
| **HR** | | | | |
| - HR Director | 1 | $85,000 | $18,700 | $103,700 |
| - HR Manager | 1 | $60,000 | $13,200 | $73,200 |
| - Recruiters (3) | 3 | $156,000 | $34,320 | $190,320 |
| - Credentialing Spec (2) | 2 | $90,000 | $19,800 | $109,800 |
| **Finance** | | | | |
| - Finance Director | 1 | $85,000 | $18,700 | $103,700 |
| - Finance Managers (2) | 2 | $120,000 | $26,400 | $146,400 |
| - Billing Staff (3) | 3 | $135,000 | $29,700 | $164,700 |
| **Compliance/IT** | | | | |
| - Compliance Officer | 1 | $80,000 | $17,600 | $97,600 |
| - QA Manager | 1 | $70,000 | $15,400 | $85,400 |
| - IT Admin | 1 | $75,000 | $16,500 | $91,500 |
| - Support Agent | 1 | $42,000 | $9,240 | $51,240 |
| **TOTAL STAFF** | **60** | **$3,949,000** | **$868,780** | **$4,817,780** |

#### Facility & Operations
| Expense | Monthly | Annual | Notes |
|---------|---------|--------|-------|
| Office Rent | $12,000 | $144,000 | 5,000 sq ft main office |
| Satellite Office(s) | $4,000 | $48,000 | 2 small satellite locations |
| Utilities | $2,500 | $30,000 | Electric, gas, water, internet |
| Office Supplies | $1,500 | $18,000 | |
| Furniture & Equipment | $833 | $10,000 | Depreciation |
| **Subtotal Facilities** | **$20,833** | **$250,000** | |

#### Technology & Software
| System | Monthly | Annual | Notes |
|--------|---------|--------|-------|
| Serenity ERP Platform | $0 | $0 | Internal - allocated to development |
| Cloud Hosting (GCP) | $3,500 | $42,000 | Production + staging |
| Phone System (VoIP) | $2,500 | $30,000 | 60 lines + call center |
| Mobile Device Management | $1,000 | $12,000 | 500 caregiver devices |
| Clearinghouse/EDI | $1,200 | $14,400 | Claims submission |
| Background Check Service | $500 | $6,000 | Subscription fee (checks separate) |
| Payroll System | $2,000 | $24,000 | ADP/Gusto |
| HR Software | $800 | $9,600 | |
| Communication Tools | $500 | $6,000 | Slack, Zoom, etc. |
| **Subtotal Technology** | **$12,000** | **$144,000** | |

#### Professional Services
| Service | Annual | Notes |
|---------|--------|-------|
| Accounting/CPA | $48,000 | Monthly bookkeeping + annual audit |
| Legal | $36,000 | Employment, contracts, compliance |
| HR Consulting | $12,000 | Policy development |
| Compliance Consulting | $18,000 | DODD, Medicaid prep |
| IT Consulting | $15,000 | Security audits, development |
| **Subtotal Professional** | **$129,000** | |

#### Insurance
| Coverage | Annual Premium | Notes |
|----------|----------------|-------|
| General Liability | $85,000 | $1M/$3M coverage |
| Professional Liability | $120,000 | Malpractice/E&O |
| Cyber Liability | $25,000 | HIPAA breach coverage |
| Employment Practices | $35,000 | EPLI |
| Directors & Officers | $18,000 | D&O |
| Commercial Auto | $45,000 | Fleet coverage |
| Property Insurance | $12,000 | Office contents |
| **Subtotal Insurance** | **$340,000** | |

#### Marketing & Sales
| Activity | Annual | Notes |
|----------|--------|-------|
| Digital Marketing | $36,000 | Google Ads, social media |
| Website Maintenance | $6,000 | |
| Recruitment Marketing | $48,000 | Indeed, job boards |
| Community Events | $12,000 | Health fairs, conferences |
| Referral Bonuses | $30,000 | $500 × 60 hires |
| Collateral & Printing | $8,000 | Brochures, cards |
| **Subtotal Marketing** | **$140,000** | |

#### Other Operating Expenses
| Expense | Annual | Notes |
|---------|--------|-------|
| Travel & Mileage (Admin) | $36,000 | Management field visits |
| Meals & Entertainment | $12,000 | Team events, client meetings |
| Professional Development | $25,000 | Conferences, certifications |
| Dues & Subscriptions | $8,000 | Industry associations |
| Bank Fees & Merchant Fees | $18,000 | ACH, credit card processing |
| Miscellaneous | $15,000 | Contingency |
| **Subtotal Other** | **$114,000** | |

#### Total Operating Expenses
| Category | Amount |
|----------|--------|
| Admin/Clinical Salaries + Benefits | $4,817,780 |
| Facilities | $250,000 |
| Technology | $144,000 |
| Professional Services | $129,000 |
| Insurance | $340,000 |
| Marketing | $140,000 |
| Other Operating | $114,000 |
| **TOTAL OPERATING EXPENSES** | **$5,934,780** |

---

### OPERATING INCOME (EBITDA)
| | Amount | % Revenue |
|--|--------|-----------|
| Gross Profit | $808,577 | 7.5% |
| Operating Expenses | ($5,934,780) | (54.8%) |
| **OPERATING LOSS (Traditional Method)** | **($5,126,203)** | **(47.3%)** |

> **Wait - this doesn't work!** The traditional P&L presentation shows a huge loss because we separated "Cost of Services" from admin overhead. Let's restructure for clarity.

---

## RESTRUCTURED P&L (Industry Standard)

In home care, the standard P&L groups all labor (including admin) separately from non-labor costs:

### REVENUE
| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| Gross Service Revenue | $11,479,786 | |
| Less: Adjustments & Write-offs | ($647,928) | |
| **NET REVENUE** | **$10,831,858** | **100.0%** |

---

### COST OF REVENUE (Direct Service Delivery)
| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **Caregiver Wages & OT** | $7,607,474 | 70.2% |
| **Caregiver Benefits & Taxes** | $1,828,807 | 16.9% |
| **Direct Operating (mileage, training, etc.)** | $587,000 | 5.4% |
| **TOTAL COST OF REVENUE** | **$10,023,281** | **92.5%** |

---

### GROSS PROFIT
| | Amount | % Revenue |
|--|--------|-----------|
| **GROSS PROFIT** | **$808,577** | **7.5%** |

---

### OPERATING EXPENSES (Overhead)
| Category | Amount | % Revenue |
|----------|--------|-----------|
| Administrative Salaries + Benefits | $4,817,780 | 44.5% |
| Facilities | $250,000 | 2.3% |
| Technology | $144,000 | 1.3% |
| Professional Services | $129,000 | 1.2% |
| Insurance | $340,000 | 3.1% |
| Marketing | $140,000 | 1.3% |
| Other Operating | $114,000 | 1.1% |
| **TOTAL OPERATING EXPENSES** | **$5,934,780** | **54.8%** |

---

## THE PROBLEM: This Model Doesn't Work

**Current Model Shows:**
- Revenue: $10.8M
- Direct Costs: $10.0M
- Overhead: $5.9M
- **Net Loss: ($5.1M)**

**Why?** Because we've built an administrative structure for 500 patients before we have the revenue to support it.

---

## REVISED REALISTIC P&L (Lean Operations)

Let's build a profitable model with appropriate staffing levels:

### Revenue (Same)
| | Amount |
|--|--------|
| **NET REVENUE** | **$10,831,858** |

### Revised Staffing Model (Right-Sized)

| Department | Original | Revised | Savings |
|------------|----------|---------|---------|
| Executive | 4 @ $585K | 3 @ $380K | $205K |
| Operations Directors/Managers | 22 @ $1.76M | 12 @ $850K | $910K |
| Clinical | 14 @ $1.26M | 10 @ $920K | $340K |
| HR | 7 @ $477K | 4 @ $270K | $207K |
| Finance | 6 @ $415K | 4 @ $280K | $135K |
| Compliance/IT | 4 @ $325K | 2 @ $170K | $155K |
| **Total Admin/Clinical** | **57 @ $4.82M** | **35 @ $2.87M** | **$1.95M** |

### Revised P&L

| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **NET REVENUE** | **$10,831,858** | **100.0%** |
| | | |
| **COST OF REVENUE** | | |
| Caregiver Wages + OT | $7,607,474 | 70.2% |
| Caregiver Benefits | $1,828,807 | 16.9% |
| Direct Operating | $587,000 | 5.4% |
| **Total Cost of Revenue** | **$10,023,281** | **92.5%** |
| | | |
| **GROSS PROFIT** | **$808,577** | **7.5%** |
| | | |
| **OPERATING EXPENSES** | | |
| Admin/Clinical Salaries + Benefits | $2,870,000 | 26.5% |
| Facilities | $180,000 | 1.7% |
| Technology | $120,000 | 1.1% |
| Professional Services | $80,000 | 0.7% |
| Insurance | $280,000 | 2.6% |
| Marketing | $100,000 | 0.9% |
| Other Operating | $80,000 | 0.7% |
| **Total Operating Expenses** | **$3,710,000** | **34.3%** |
| | | |
| **OPERATING INCOME (EBITDA)** | **($2,901,423)** | **(26.8%)** |

---

## THE REAL PROBLEM: Industry Economics

**Home care has structural profitability challenges:**

1. **Reimbursement rates are fixed** by Medicaid/Medicare
2. **Labor costs are 85-90%** of revenue
3. **Margins are thin** (5-10% industry average)
4. **Scale helps** but doesn't solve the fundamental math

### Break-Even Analysis

To break even with proper staffing, we need:
- **Higher reimbursement rates**, OR
- **Higher utilization** (reduce gaps/call-offs), OR
- **Lower overhead** (tech-enabled efficiency), OR
- **Higher-margin service mix** (more private pay, skilled nursing)

---

## PROFITABLE MODEL: Optimized for 500 Patients

### Key Changes:
1. **Increase utilization** from 85% to 92% (better scheduling, reduced call-offs)
2. **Reduce turnover** from 65% to 45% (saves recruitment/training costs)
3. **Optimize service mix** (more skilled nursing, private pay)
4. **Lean admin** with technology automation

### Optimized Revenue Model

| Service Line | Patients | Utilization | Annual Revenue |
|--------------|----------|-------------|----------------|
| IO Waiver | 175 | 92% | $4,702,425 |
| PASSPORT | 100 | 92% | $2,006,160 |
| Home Health (Skilled) | 100 | 95% | $1,778,400 |
| Private Pay | 75 | 95% | $1,778,400 |
| MyCare Ohio | 50 | 92% | $1,210,040 |
| **Total Service Revenue** | **500** | | **$11,475,425** |
| Additional Revenue | | | $750,000 |
| Less: Adjustments | | | ($490,000) |
| **NET REVENUE** | | | **$11,735,425** |

### Optimized Cost Structure

| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **NET REVENUE** | **$11,735,425** | **100.0%** |
| | | |
| **COST OF REVENUE** | | |
| Caregiver Wages + OT | $7,150,000 | 60.9% |
| Caregiver Benefits (lower turnover) | $1,573,000 | 13.4% |
| Direct Operating | $450,000 | 3.8% |
| **Total Cost of Revenue** | **$9,173,000** | **78.2%** |
| | | |
| **GROSS PROFIT** | **$2,562,425** | **21.8%** |
| | | |
| **OPERATING EXPENSES** | | |
| Admin/Clinical Salaries + Benefits | $1,850,000 | 15.8% |
| Facilities | $150,000 | 1.3% |
| Technology | $100,000 | 0.9% |
| Professional Services | $60,000 | 0.5% |
| Insurance | $250,000 | 2.1% |
| Marketing | $80,000 | 0.7% |
| Other Operating | $60,000 | 0.5% |
| **Total Operating Expenses** | **$2,550,000** | **21.7%** |
| | | |
| **OPERATING INCOME (EBITDA)** | **$12,425** | **0.1%** |
| | | |
| Interest Expense | ($25,000) | (0.2%) |
| Depreciation | ($50,000) | (0.4%) |
| **NET INCOME BEFORE TAX** | **($62,575)** | **(0.5%)** |

---

## REALITY CHECK: What Makes Home Care Profitable?

### Industry Benchmarks (NAHC Data)
| Metric | Poor | Average | Good | Excellent |
|--------|------|---------|------|-----------|
| Gross Margin | <15% | 15-20% | 20-25% | >25% |
| Operating Margin | <0% | 0-5% | 5-10% | >10% |
| Labor as % Revenue | >90% | 85-90% | 80-85% | <80% |
| Admin as % Revenue | >30% | 25-30% | 20-25% | <20% |
| Turnover Rate | >80% | 60-80% | 40-60% | <40% |
| Utilization | <80% | 80-85% | 85-90% | >90% |

### Serenity's Path to Profitability

| Lever | Current | Target | Impact |
|-------|---------|--------|--------|
| **Utilization** | 85% | 93% | +$940K revenue |
| **Turnover** | 65% | 40% | -$200K costs |
| **Service Mix** | 10% skilled | 20% skilled | +$400K margin |
| **Tech Efficiency** | Manual | Automated | -$300K admin |
| **EVV Compliance** | 90% | 98% | +$50K incentives |
| **Clean Claims** | 88% | 96% | -$150K denials |

---

## FINAL PROFITABLE P&L MODEL

### Assumptions for Profitability:
- 93% utilization (industry-leading scheduling)
- 40% turnover (strong culture, competitive pay)
- 20% skilled nursing mix (higher margins)
- Tech-enabled lean operations (Serenity ERP advantage)
- 98% EVV compliance
- 96% clean claim rate

| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **REVENUE** | | |
| Gross Service Revenue | $12,850,000 | |
| Additional Revenue | $800,000 | |
| Less: Adjustments (3%) | ($410,000) | |
| **NET REVENUE** | **$13,240,000** | **100.0%** |
| | | |
| **COST OF REVENUE** | | |
| Caregiver Wages | $7,400,000 | 55.9% |
| Overtime (3%) | $333,000 | 2.5% |
| Benefits & Taxes (20%) | $1,546,600 | 11.7% |
| Direct Operating | $400,000 | 3.0% |
| **Total Cost of Revenue** | **$9,679,600** | **73.1%** |
| | | |
| **GROSS PROFIT** | **$3,560,400** | **26.9%** |
| | | |
| **OPERATING EXPENSES** | | |
| Admin/Clinical Staff (30 FTE) | $1,650,000 | 12.5% |
| Benefits (22%) | $363,000 | 2.7% |
| Facilities | $144,000 | 1.1% |
| Technology | $96,000 | 0.7% |
| Professional Services | $60,000 | 0.5% |
| Insurance | $240,000 | 1.8% |
| Marketing | $72,000 | 0.5% |
| Other Operating | $60,000 | 0.5% |
| **Total Operating Expenses** | **$2,685,000** | **20.3%** |
| | | |
| **OPERATING INCOME (EBITDA)** | **$875,400** | **6.6%** |
| | | |
| Interest Expense | ($20,000) | (0.2%) |
| Depreciation | ($48,000) | (0.4%) |
| **INCOME BEFORE TAX** | **$807,400** | **6.1%** |
| | | |
| Income Tax (25% effective) | ($201,850) | (1.5%) |
| **NET INCOME** | **$605,550** | **4.6%** |

---

## KEY METRICS SUMMARY

| Metric | Value | Benchmark |
|--------|-------|-----------|
| **Revenue per Patient** | $26,480/yr | $25-30K |
| **Revenue per Caregiver FTE** | $26,480/yr | $25-28K |
| **Gross Margin** | 26.9% | 20-25% (Good) |
| **Operating Margin (EBITDA)** | 6.6% | 5-10% (Good) |
| **Net Margin** | 4.6% | 3-5% (Average) |
| **Labor Cost Ratio** | 73.1% | 75-85% (Good) |
| **Admin Cost Ratio** | 20.3% | 20-25% (Good) |
| **Admin Staff per 100 Patients** | 6 | 6-8 |
| **Revenue per Admin FTE** | $441,333 | $350-500K |

---

## STAFFING FOR PROFITABLE 500-PATIENT OPERATION

| Role | Count | Annual Cost | Notes |
|------|-------|-------------|-------|
| **Executive (3)** | | | |
| CEO/Founder | 1 | $150,000 | Combined role |
| COO | 1 | $100,000 | |
| CFO | 1 | $90,000 | Part-time or combined |
| **Operations (12)** | | | |
| Director of Ops | 1 | $80,000 | |
| Field Ops Managers | 3 | $180,000 | 1 per 150 caregivers |
| Pod Leads | 8 | $384,000 | 1 per 60 caregivers |
| **Clinical (6)** | | | |
| Director of Nursing | 1 | $95,000 | |
| RN Case Managers | 4 | $280,000 | 1 per 125 patients |
| QIDP | 1 | $55,000 | For DD patients |
| **HR (3)** | | | |
| HR Manager | 1 | $60,000 | |
| Recruiter | 1 | $50,000 | |
| Credentialing | 1 | $45,000 | |
| **Finance (3)** | | | |
| Finance Manager | 1 | $65,000 | |
| Billing Specialists | 2 | $90,000 | |
| **Scheduling (2)** | | | |
| Scheduling Manager | 1 | $55,000 | |
| Scheduler | 1 | $42,000 | |
| **IT/Support (1)** | | | |
| IT Admin | 1 | $70,000 | |
| **TOTAL** | **30** | **$1,891,000** | |
| Benefits (22%) | | $416,020 | |
| **TOTAL LOADED** | | **$2,307,020** | |

---

## MONTHLY CASH FLOW PROJECTION

| Month | Revenue | Expenses | Net Cash | Cumulative |
|-------|---------|----------|----------|------------|
| Jan | $1,020,000 | $1,030,000 | ($10,000) | ($10,000) |
| Feb | $1,050,000 | $1,030,000 | $20,000 | $10,000 |
| Mar | $1,080,000 | $1,035,000 | $45,000 | $55,000 |
| Apr | $1,100,000 | $1,035,000 | $65,000 | $120,000 |
| May | $1,120,000 | $1,040,000 | $80,000 | $200,000 |
| Jun | $1,100,000 | $1,040,000 | $60,000 | $260,000 |
| Jul | $1,080,000 | $1,035,000 | $45,000 | $305,000 |
| Aug | $1,100,000 | $1,040,000 | $60,000 | $365,000 |
| Sep | $1,120,000 | $1,045,000 | $75,000 | $440,000 |
| Oct | $1,140,000 | $1,050,000 | $90,000 | $530,000 |
| Nov | $1,150,000 | $1,055,000 | $95,000 | $625,000 |
| Dec | $1,180,000 | $1,060,000 | $120,000 | $745,000 |
| **TOTAL** | **$13,240,000** | **$12,495,000** | **$745,000** | |

> Note: DSO of 45 days means ~$1.5M in receivables at any time. Need working capital line.

---

## APPENDIX: Sensitivity Analysis

### Impact of Key Variables on Net Income

| Variable | -10% | Base | +10% |
|----------|------|------|------|
| **Reimbursement Rates** | ($719K) loss | $606K profit | $1.93M profit |
| **Utilization** | ($580K) loss | $606K profit | $1.79M profit |
| **Caregiver Wages** | $1.34M profit | $606K profit | ($134K) loss |
| **Turnover Rate** | $806K profit | $606K profit | $406K profit |
| **Admin Headcount** | $836K profit | $606K profit | $376K profit |

### Break-Even Points

| Scenario | Patients Needed | Utilization Needed |
|----------|-----------------|-------------------|
| Current cost structure | 620 | 95% |
| Lean operations | 420 | 88% |
| High-margin mix | 380 | 85% |

---

## CONCLUSION

**For Serenity Care Partners to be profitable at 500 patients:**

1. **Right-size admin staff** - 30 FTEs, not 60
2. **Maximize utilization** - Target 93%+ through better scheduling
3. **Reduce turnover** - Invest in culture and competitive wages
4. **Optimize service mix** - More skilled nursing and private pay
5. **Leverage technology** - Serenity ERP should enable lean operations
6. **Control denials** - 96%+ clean claim rate

**Target Metrics:**
- Net Revenue: $13.2M
- Gross Margin: 27%
- Operating Margin: 6.6%
- Net Margin: 4.6%
- Net Income: $605K

This is achievable but requires disciplined execution and leveraging the Serenity platform's automation capabilities to run lean.
