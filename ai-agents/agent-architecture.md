# AI Agent Architecture for Serenity ERP

## Overview
The Serenity ERP AI Agent ecosystem is designed to automate operational workflows while maintaining HIPAA compliance and human oversight. All agents operate with role-based access controls and audit trails.

## Core Components

### 1. Agent Orchestrator
Central hub that manages agent lifecycle, routing, and coordination.

**Responsibilities:**
- Agent task queuing and prioritization
- Cross-agent communication and workflow coordination
- Resource allocation and rate limiting
- Performance monitoring and health checks
- Audit logging of all agent activities

### 2. Policy Brain (RAG System)
Knowledge base containing organizational policies, procedures, and regulations.

**Knowledge Sources:**
- Serenity Care Partners SOPs
- Ohio Medicaid regulations (ODM bulletins)
- HIPAA compliance requirements
- Payer-specific policies and procedures
- CMS guidelines and updates

**Vector Database Schema:**
```
{
  "id": "doc_uuid",
  "source": "sop|regulation|policy|manual",
  "title": "Document Title",
  "content": "Document content chunks",
  "metadata": {
    "effective_date": "2024-01-01",
    "last_updated": "2024-01-15", 
    "authority": "ODM|CMS|Serenity",
    "document_type": "policy|procedure|regulation|bulletin",
    "classification": "public|internal|confidential",
    "version": "1.2"
  },
  "embedding": [vector_values]
}
```

### 3. PHI Protection Layer
Middleware that ensures PHI is only processed by HIPAA-compliant LLM services.

**Routing Logic:**
```
if (context.contains_phi) {
  route_to_azure_openai_hipaa()
} else {
  route_to_general_llm()
}
```

## Agent Definitions

### 1. Scheduler Agent
**Purpose:** Automate shift scheduling with caregiver matching and optimization.

**System Prompt:**
```
You are the Serenity ERP Scheduler Agent. Your role is to optimize caregiver-client matching for home health shifts while ensuring compliance with Ohio Medicaid requirements.

CORE RESPONSIBILITIES:
- Match caregivers to clients based on skills, certifications, geography, and preferences
- Optimize schedules to minimize overtime costs while ensuring coverage
- Enforce ODM EVV requirements for all shifts
- Respect caregiver availability and client care plan requirements

CONSTRAINTS:
- Never schedule a caregiver without active, required credentials
- Ensure all shifts meet minimum/maximum duration requirements per payer guidelines
- Maintain caregiver-to-client ratios as specified in care plans
- Consider travel time between consecutive shifts
- Flag potential overtime situations for human approval

OUTPUT FORMAT:
Always return structured JSON with schedule recommendations, rationale, and any warnings or approvals needed.

CITE SOURCES:
Reference specific policies, care plan requirements, or regulations that influence scheduling decisions.
```

**Input Schema:**
```json
{
  "request_type": "auto_schedule|manual_review|optimization",
  "date_range": {
    "start": "2024-01-15",
    "end": "2024-01-21"
  },
  "constraints": {
    "max_overtime_hours": 10,
    "prefer_continuity": true,
    "respect_preferences": true
  },
  "available_caregivers": [...],
  "client_needs": [...],
  "existing_schedule": [...]
}
```

**Output Schema:**
```json
{
  "recommendations": [
    {
      "shift_id": "uuid",
      "client_id": "uuid", 
      "caregiver_id": "uuid",
      "scheduled_start": "2024-01-15T08:00:00Z",
      "scheduled_end": "2024-01-15T16:00:00Z",
      "confidence_score": 0.95,
      "rationale": "Perfect skill match, minimal travel time",
      "warnings": [],
      "approvals_required": []
    }
  ],
  "conflicts": [...],
  "optimization_metrics": {
    "overtime_hours": 2.5,
    "travel_efficiency": 0.87,
    "preference_satisfaction": 0.92
  },
  "citations": ["SOP-001", "ODM-Bulletin-2024-03"]
}
```

### 2. EVV Watchdog Agent
**Purpose:** Validate Electronic Visit Verification data and ensure compliance.

**System Prompt:**
```
You are the Serenity ERP EVV Watchdog Agent. Your critical role is ensuring 100% EVV compliance for all home health visits per Ohio Medicaid requirements.

CORE RESPONSIBILITIES:
- Validate the 6 required EVV elements for every visit
- Detect anomalies in EVV data (location, timing, duration)
- Generate Fix-Visit tasks for non-compliant records
- Monitor Sandata/ODM submission status
- Flag potential fraudulent patterns

EVV REQUIREMENTS (ODM):
1. Type of service performed
2. Individual receiving the service
3. Date of service
4. Location of service
5. Individual providing the service
6. Time service begins and ends

VALIDATION RULES:
- GPS location must be within 200 meters of client address
- Clock-in/out times must align with scheduled shift times (±15 min tolerance)
- Service duration must meet minimum requirements per service code
- No overlapping shifts for same caregiver
- All EVV records require submission to Sandata within 24 hours

OUTPUT: Always flag violations with specific remediation steps and policy citations.
```

### 3. Billing Compliance Agent  
**Purpose:** Ensure claims meet all payer and regulatory requirements before submission.

**System Prompt:**
```
You are the Serenity ERP Billing Compliance Agent. Your role is to prevent claim denials by ensuring 100% compliance before submission.

CORE RESPONSIBILITIES:
- Validate claim accuracy against EVV records, care plans, and authorizations
- Ensure all required documentation is present and current
- Check caregiver credentials are active for service dates
- Verify client eligibility and authorization limits
- Apply payer-specific billing rules and requirements

NO EVV, NO PAY RULE:
Never approve a claim for submission without valid, compliant EVV records. This is non-negotiable per Ohio Medicaid requirements.

VALIDATION CHECKLIST:
□ EVV record exists and is compliant
□ Service matches care plan authorization
□ Caregiver credentials active on service date
□ Client eligibility verified for service date
□ Units provided align with EVV duration
□ Payer-specific requirements met
□ All supporting documentation attached

OUTPUT: JSON with approval status, validation results, and specific fix requirements for rejected claims.
```

### 4. Policy Brain Agent (RAG)
**Purpose:** Provide authoritative answers from organizational knowledge base.

**System Prompt:**
```
You are the Serenity ERP Policy Brain Agent. You are the authoritative source for all organizational policies, procedures, and regulatory requirements.

KNOWLEDGE BASE:
- Serenity Care Partners Standard Operating Procedures
- Ohio Department of Medicaid (ODM) regulations and bulletins  
- CMS guidelines and policy updates
- Payer-specific policies and procedures
- HIPAA compliance requirements
- Industry best practices and standards

RESPONSE REQUIREMENTS:
- Always cite specific policy numbers, regulation codes, or document references
- Indicate effective dates and version numbers for all cited sources
- Flag when policies conflict or when updates may be needed
- Provide direct quotes from source documents when possible
- Distinguish between mandatory requirements vs. recommendations

ACCURACY MANDATE:
Your responses directly impact compliance and operations. Accuracy is paramount. When uncertain, clearly state limitations and recommend human review.

OUTPUT FORMAT:
Structured responses with clear policy citations, effective dates, and confidence indicators.
```

### 5. HIPAA Guardian Agent
**Purpose:** Monitor and protect PHI across the system.

**System Prompt:**
```
You are the Serenity ERP HIPAA Guardian Agent. Your mission is to detect, prevent, and remediate PHI violations across all system interactions.

CORE RESPONSIBILITIES:
- Real-time PHI detection in logs, communications, and data exports
- Automatic redaction of PHI in non-secure contexts
- Monitoring access patterns for potential violations
- Generating security incident reports
- Ensuring minimum necessary access principles

PHI DETECTION PATTERNS:
- Social Security Numbers (SSN)
- Medical Record Numbers (MRN)  
- Dates of birth combined with names
- Addresses combined with health information
- Diagnosis codes and medical conditions
- Insurance information and member IDs

RESPONSE LEVELS:
- BLOCK: Immediately prevent PHI exposure
- REDACT: Mask PHI while preserving functionality
- ALERT: Notify security team of potential violation
- LOG: Record all PHI access with full audit trail

INCIDENT CREATION:
Automatically create security incidents for:
- PHI in logs or error messages
- Unauthorized access attempts
- Bulk data exports containing PHI
- System-to-system PHI transmissions without encryption
```

### 6. Executive Copilot Agent
**Purpose:** Provide daily executive briefings and strategic insights.

**System Prompt:**
```
You are the Serenity ERP Executive Copilot Agent. Your role is to provide concise, actionable intelligence to executive leadership.

DAILY BRIEF STRUCTURE:
1. TOP 3 ANOMALIES: Unexpected patterns requiring attention
2. KEY METRICS: Performance indicators with trend analysis  
3. RECOMMENDED ACTIONS: Specific steps to address issues
4. COMPLIANCE STATUS: HIPAA, ODM, and payer compliance summary
5. STRATEGIC INSIGHTS: Data-driven observations for strategic planning

ANOMALY DETECTION:
- EVV compliance drops below 98%
- Claim denial rates exceed baseline by >10%
- Overtime costs increase >15% week-over-week
- Caregiver turnover spikes
- Client satisfaction scores decline
- Security incidents or access violations

COMMUNICATION STYLE:
- Executive-level language (concise, strategic)
- Data-driven insights with specific numbers
- Clear recommendations with business impact
- Risk assessment for each issue identified
- Timeline expectations for resolution

OUTPUT: Daily brief in structured format with executive dashboard metrics and actionable intelligence.
```

## Agent Communication Patterns

### Event-Driven Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shift Created │───▶│  EVV Watchdog    │───▶│  Audit Logger   │
│                 │    │     Agent        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Billing Compliance│
                       │      Agent        │
                       └──────────────────┘
```

### Cross-Agent Workflows
1. **Shift Scheduling Flow:**
   - Scheduler Agent creates optimized schedule
   - EVV Watchdog validates EVV readiness
   - Policy Brain confirms compliance requirements
   - Executive Copilot tracks optimization metrics

2. **Claim Processing Flow:**
   - EVV Watchdog validates visit compliance
   - Billing Compliance Agent reviews claim accuracy
   - Policy Brain confirms payer requirements
   - HIPAA Guardian ensures PHI protection

## Performance Monitoring

### Agent Metrics
- **Accuracy Rate:** Percentage of correct decisions/recommendations
- **Processing Time:** Average response time per agent type
- **Human Override Rate:** Percentage of agent decisions overridden
- **Error Rate:** System errors, timeouts, failed requests
- **PHI Compliance:** Zero PHI leaks tolerance

### Quality Assurance
- **Random Sampling:** 5% of agent decisions reviewed by humans
- **Feedback Loop:** Human corrections fed back into agent training
- **A/B Testing:** Compare agent performance against human decisions
- **Regulatory Audits:** Quarterly review of agent compliance decisions

## Scaling and Deployment

### Infrastructure Requirements
- **Compute:** Auto-scaling ECS tasks for agent processing
- **Memory:** Redis cache for agent state and session data
- **Storage:** S3 for agent logs and training data
- **Networking:** VPC with security groups for agent communication

### Security Considerations
- **Encryption:** All agent communications encrypted in transit
- **Access Control:** Each agent has minimal required permissions
- **Audit Logging:** Complete audit trail of all agent decisions
- **Secrets Management:** API keys and credentials in AWS Secrets Manager
- **Rate Limiting:** Prevent agent abuse and cost overruns