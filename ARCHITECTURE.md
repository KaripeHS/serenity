# Serenity ERP System Architecture

## Overview
HIPAA-compliant, AI-driven ERP system for Serenity Care Partners home health agency with end-to-end business management, AI automation, and maximum security.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Headless UI components
- **State Management**: Zustand with persist middleware
- **Routing**: React Router v6 with role-based guards
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for dashboards
- **PWA**: Service Worker for offline EVV clock-in

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify with OpenAPI/Swagger auto-generation
- **Database**: PostgreSQL 15+ with Row-Level Security (RLS)
- **ORM**: Prisma with custom RLS middleware
- **Authentication**: Auth0 or AWS Cognito with MFA
- **Authorization**: Custom RBAC/ABAC with attribute-based scoping
- **Caching**: Redis for sessions and AI agent results
- **Queue**: Bull/BullMQ for background jobs
- **File Storage**: AWS S3 with encryption at rest

### AI Agent Layer
- **Orchestration**: LangChain/LangGraph for agent workflows
- **Vector Database**: Pinecone or pgvector for RAG knowledge base
- **LLM Routing**: 
  - PHI contexts → Azure OpenAI (HIPAA BAA)
  - Non-PHI → OpenAI GPT-4/Claude
- **Agent Framework**: Custom event-driven agent system
- **Knowledge Base**: Policy documents, SOPs, Medicaid rules

### Infrastructure
- **Cloud**: AWS (HIPAA eligible with BAA)
- **Container**: Docker with multi-stage builds
- **Orchestration**: AWS ECS Fargate or EKS
- **Load Balancer**: AWS ALB with SSL termination
- **CDN**: CloudFront for static assets
- **Monitoring**: AWS CloudWatch, DataDog, or New Relic
- **Secrets**: AWS Secrets Manager or HashiCorp Vault
- **Backup**: Automated daily backups with point-in-time recovery

## System Components

### 1. Identity & Access Management
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Auth Provider │────│  RBAC/ABAC      │────│  RLS Policies   │
│   (Auth0/Cognito)│    │  Engine          │    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2. Core Application Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Fastify)                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Scheduling    │    Billing      │       HR/Credentialing │
│   Module        │    Module       │       Module            │
├─────────────────┼─────────────────┼─────────────────────────┤
│   Compliance    │    Family       │       Leadership        │
│   Module        │    Portal       │       Dashboards        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 3. AI Agent Ecosystem
```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Scheduler      │  EVV Watchdog   │  Billing Compliance     │
│  Agent          │  Agent          │  Agent                  │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Policy Brain   │  HIPAA Guardian │  Executive Copilot      │
│  (RAG)          │  Agent          │  Agent                  │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 4. Data Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│                    (Row-Level Security)                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Core Tables   │   Audit Tables  │   AI Knowledge Base     │
│   (Users, Orgs, │   (Immutable    │   (Policies, SOPs,      │
│   Clients,      │   Activity Log) │   Medicaid Rules)       │
│   Schedules)    │                 │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Security Architecture

### HIPAA Compliance Layers
1. **Administrative Safeguards**
   - Documented policies and procedures
   - Workforce training and sanctions
   - Risk assessments and incident response

2. **Technical Safeguards**
   - Multi-factor authentication (MFA)
   - Encryption at rest and in transit (AES-256)
   - Automatic session timeout
   - Role-based access control with attribute scoping
   - Audit logging with immutable trails

3. **Physical Safeguards**
   - AWS HIPAA-eligible infrastructure
   - Secure data centers with physical access controls
   - Encrypted backups and disaster recovery

### PHI Protection
- **Redaction Middleware**: Automatic PHI detection and masking
- **Secure Messaging**: In-app only, no SMS/email for PHI
- **Model Routing**: PHI contexts use HIPAA-compliant LLMs only
- **Access Logging**: All PHI access logged with user attribution

## Deployment Architecture

### Production Environment (AWS)
```
Internet Gateway
       │
   CloudFront CDN
       │
   Application Load Balancer (ALB)
       │
   ┌─────────────────────────────────┐
   │         ECS Fargate             │
   │  ┌──────────────┐ ┌────────────┐│
   │  │   Frontend   │ │   Backend  ││
   │  │   (React)    │ │ (Fastify)  ││
   │  └──────────────┘ └────────────┘│
   └─────────────────────────────────┘
              │
   ┌─────────────────────────────────┐
   │         RDS PostgreSQL          │
   │    (Multi-AZ, Encrypted)        │
   └─────────────────────────────────┘
```

### AI Agent Infrastructure
```
   ┌─────────────────────────────────┐
   │       Agent Orchestrator        │
   │        (ECS Service)            │
   └─────────────────────────────────┘
              │
   ┌─────────────────┬───────────────┐
   │   Vector DB     │   LLM APIs    │
   │  (Pinecone/     │   (Azure      │
   │   pgvector)     │   OpenAI)     │
   └─────────────────┴───────────────┘
```

## Development Workflow

### Environment Structure
- **Local**: Docker Compose with PostgreSQL, Redis, MinIO
- **Development**: AWS ECS with RDS (single AZ)
- **Staging**: Production-like with sanitized data
- **Production**: Multi-AZ, high availability

### CI/CD Pipeline
1. **Code Push** → GitHub Actions triggered
2. **Security Scan** → SAST, dependency check, secret scan
3. **Tests** → Unit, integration, HIPAA compliance tests
4. **Build** → Docker images with security hardening
5. **Deploy** → Infrastructure as Code (Terraform)
6. **Monitoring** → Health checks, performance metrics

## Performance & Scalability

### Horizontal Scaling
- **Frontend**: CloudFront CDN + multiple ECS tasks
- **Backend**: Auto-scaling ECS services behind ALB
- **Database**: Read replicas for reporting queries
- **AI Agents**: Queue-based processing with worker scaling

### Caching Strategy
- **Redis**: Session data, AI agent results, frequent queries
- **Application**: Memoization for expensive operations
- **Database**: Query optimization with proper indexing
- **CDN**: Static assets and API responses where appropriate

## Monitoring & Observability

### Application Monitoring
- **APM**: New Relic or DataDog for performance tracking
- **Logs**: Centralized logging with CloudWatch
- **Metrics**: Custom business metrics for KPIs
- **Alerts**: Automated alerts for critical issues

### HIPAA Compliance Monitoring
- **Access Audit**: Real-time access pattern analysis
- **PHI Leak Detection**: Automated scanning for exposed PHI
- **Breach Detection**: Anomaly detection for unauthorized access
- **Compliance Dashboard**: Real-time compliance status

## Integration Points

### External Systems
- **Sandata/ODM**: EVV data submission and validation
- **Payers**: Claims submission and ERA processing
- **Banks**: ACH processing for payroll
- **Background Check**: Automated credential verification
- **SMS/Email**: Notifications (non-PHI only)

### API Design
- **REST**: OpenAPI 3.0 specification
- **GraphQL**: Client-specific data fetching
- **Webhooks**: Real-time event notifications
- **Rate Limiting**: Protect against abuse
- **Versioning**: Backward compatibility

This architecture ensures HIPAA compliance, scalability, and AI-first automation while maintaining security and auditability throughout the system.