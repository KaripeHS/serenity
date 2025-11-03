# Pod Governance & Access Management - Operator Guide
**Serenity Care Partners ERP System**
**Version:** 1.0
**Date:** September 20, 2025
**Audience:** CEO, Security Officers, IT Administrators

---

## 🚀 Quick Start - Accessing the Super Admin Console

### Access URLs
- **Primary:** http://localhost:3009/super-admin
- **Alternative:** http://localhost:3009/admin/governance
- **Alternative:** http://localhost:3009/admin/pods

### Required Permissions
- **Role:** Founder, Security Officer, or IT Admin
- **Permissions:** `governance:admin` or founder-level access

### First-Time Setup
1. **Navigate to Home:** http://localhost:3009
2. **Locate Console:** Look for "Super Admin Console" card (visible only to authorized users)
3. **Click Access:** Direct access to Pod Governance & Access Management

---

## 🏢 Pod Management Overview

### What is a Pod?
A **Pod** is a local operational unit serving a specific geographic area (city or neighborhood). Each pod operates with:
- **1 Pod Team Lead** (Field Supervisor) managing up to 35 caregivers
- **Caregivers** (personal care aides, homemakers, companions, respite staff)
- **Clients/Families** assigned to that pod for service delivery

### Pod Structure Examples
```
Cincinnati Pod A (CIN-A)
├── Team Lead: Maria Rodriguez
├── Caregivers: 28/35 capacity
├── Active Clients: 87
└── EVV Compliance: 94.5%

Cincinnati Pod B (CIN-B)
├── Team Lead: James Wilson
├── Caregivers: 31/35 capacity
├── Active Clients: 92
└── EVV Compliance: 96.2%

Columbus Pod A (COL-A)
├── Team Lead: Sarah Chen
├── Caregivers: 24/35 capacity
├── Active Clients: 71
└── EVV Compliance: 92.8%
```

---

## 🎛️ Super Admin Console Features

### Tab 1: 🏢 Pod Management

#### Creating New Pods
1. **Click:** "➕ Create New Pod" button
2. **Required Fields:**
   - Pod Code (e.g., "DAY-A" for Dayton Pod A)
   - Pod Name (e.g., "Dayton Pod A")
   - City and State
   - Capacity (default: 35 caregivers)
3. **Optional Fields:**
   - Team Lead assignment
   - Service types
   - Coverage area (zip codes, geographic boundaries)

#### Managing Existing Pods
- **Status Management:** Active, Inactive, Suspended
- **Capacity Adjustments:** Modify caregiver limits
- **Team Lead Assignment:** Assign/reassign field supervisors
- **Performance Monitoring:** EVV compliance, client satisfaction

#### Pod Metrics Dashboard
```
Cincinnati Pod A (CIN-A)
┌─────────────────────────────────────┐
│ Capacity:    28/35 caregivers       │
│ Clients:     87 active              │
│ Compliance:  94.5% EVV              │
│ Created:     Jan 15, 2024           │
│ Status:      🟢 Active              │
└─────────────────────────────────────┘
```

### Tab 2: 👥 User Management & Pod Assignments

#### User Pod Membership Management
- **View Current Assignments:** See which pods each user can access
- **Assign Users to Pods:** Grant pod access with specific roles
- **Role Management:** Set role within pod (team_lead, caregiver, etc.)
- **Access Level Control:** Standard, Elevated, Emergency
- **Expiration Management:** Set temporary access with auto-expiry

#### User Security Overview
```
Maria Rodriguez
├── Role: field_supervisor
├── Pod Access: CIN-A (Primary, Team Lead)
├── MFA Status: ✅ Enabled
├── Last Login: Dec 15, 2024 08:30 AM
└── Permissions: EVV management, scheduling
```

### Tab 3: 🔑 Access Control & JIT Management

#### Just-in-Time (JIT) Access Grants
**Use Case:** Temporary elevated permissions for operational needs

**Example Scenario:**
```
User: Lisa Thompson
Request: Emergency claim submission for end-of-month deadline
Permissions: [billing:submit, billing:approve]
Duration: 120 minutes
Justification: "Emergency claim submission for end-of-month deadline"
Status: ✅ Active (expires 4:00 PM)
Usage: 3 times accessed
```

**JIT Grant Process:**
1. **Grant Access:** Click "⚡ Grant JIT Access"
2. **Select User:** Choose from active users
3. **Choose Permissions:** Select specific permissions to grant
4. **Set Duration:** Minutes (max 1440 = 24 hours)
5. **Justification:** Required business justification
6. **Monitor:** Real-time usage tracking
7. **Revoke:** Early termination if needed

#### Break-Glass Emergency Access
**Use Case:** Critical emergencies requiring immediate elevated access

**Example Scenario:**
```
Emergency Type: client_care_emergency
Severity: HIGH
Description: "Client emergency requiring immediate access to medical records"
User: Dr. Michael Adams
Permissions: [client:phi_access, schedule:update, evv:override]
Auto-Expires: 1 hour
Compliance Review: ⚠️ Required
```

**Break-Glass Process:**
1. **Emergency Declaration:** User activates break-glass
2. **Automatic Permissions:** System grants emergency permissions
3. **Time Limits:** Auto-expiry based on severity (5-60 minutes)
4. **Incident Creation:** Security incident automatically generated
5. **Compliance Review:** Mandatory post-incident review
6. **Audit Trail:** Complete logging for regulatory compliance

### Tab 4: 🛡️ Security Monitoring & SOD Violations

#### Separation of Duties (SOD) Monitoring
**Purpose:** Prevent conflicting permissions that violate compliance

**Example Violation:**
```
User: Alex Rivera
Violation: conflicting_permissions
Description: "User has both EVV override and billing submission permissions"
Permissions: [evv:override, billing:submit]
Severity: HIGH ⚠️
Status: Investigating
Detected: Dec 14, 2024 4:20 PM
```

**SOD Rules Enforced:**
- EVV Override ≠ Claim Submission
- User Creation ≠ Permission Assignment (for non-founders)
- Audit Log Access ≠ Data Modification
- Financial Approval ≠ Invoice Creation

#### Security Incident Management
- **Real-time Alerts:** Immediate notification of security events
- **Incident Tracking:** Complete incident lifecycle management
- **Automated Response:** System-triggered containment actions
- **Compliance Reporting:** Regulatory-ready incident reports

### Tab 5: 📋 Compliance & Audit Management

#### Compliance Binder Export
**Purpose:** Generate comprehensive compliance reports for auditors

**Export Types:**
- **HIPAA Compliance Report:** PHI access logs, breach notifications
- **Ohio EVV Compliance:** Visit verification records, compliance rates
- **Financial Audit:** Claims, payments, revenue cycle documentation
- **Security Audit:** Access logs, incidents, policy compliance
- **Pod Performance:** Operational metrics, quality indicators

#### Audit Log Viewer
**Search Capabilities:**
- **Date Range:** Specific time periods
- **User Activity:** Individual user actions
- **Pod-Specific:** Isolated pod activities
- **PHI Access:** Protected health information events
- **Security Events:** Login attempts, access denials, policy violations

#### Policy Configuration
**Configurable Settings:**
- **Session Timeouts:** Auto-logout periods
- **MFA Requirements:** Multi-factor authentication policies
- **Password Policies:** Complexity, expiration, history
- **Access Restrictions:** Time-based, location-based limitations
- **Data Classification:** PHI handling, redaction levels

---

## 🔐 Security & Compliance Features

### Least Privilege Access
- **Principle:** Users only access what they absolutely need
- **Implementation:** Role-based + pod-based restrictions
- **Enforcement:** Database-level Row Level Security (RLS)

### Pod Isolation
```
Caregiver in CIN-A Pod:
✅ Can access: CIN-A clients, schedules, EVV records
❌ Cannot access: CIN-B clients, COL-A data
❌ Cannot access: Cross-pod financial data
❌ Cannot access: Organization-wide reports
```

### Data Classification Levels
1. **Public:** General information, non-sensitive
2. **Internal:** Business information, restricted to employees
3. **Confidential:** Financial, strategic, management-only
4. **PHI:** Protected Health Information, HIPAA-protected

### Audit Trail Requirements
**Every action generates audit logs:**
```
{
  "timestamp": "2024-12-15T14:30:00Z",
  "userId": "user-123",
  "podId": "pod-cin-a-001",
  "action": "client:phi_access",
  "resourceId": "client-456",
  "outcome": "success",
  "ipAddress": "192.168.1.100",
  "dataClassification": "phi"
}
```

---

## 📊 Operational Workflows

### Daily Operations Checklist

#### Morning Review (8:00 AM)
- [ ] **Check Security Metrics:** Review overnight activity
- [ ] **Active JIT Grants:** Verify legitimate usage
- [ ] **Break-Glass Status:** Review any emergency access
- [ ] **SOD Violations:** Address any new violations
- [ ] **Pod Performance:** Monitor EVV compliance rates

#### Weekly Review (Monday 9:00 AM)
- [ ] **User Access Review:** Audit pod memberships
- [ ] **Permission Cleanup:** Remove expired access
- [ ] **Compliance Metrics:** Generate weekly reports
- [ ] **Security Incidents:** Review and close incidents
- [ ] **Policy Updates:** Review and update policies

#### Monthly Review (1st Monday)
- [ ] **Comprehensive Audit:** Full system access review
- [ ] **Compliance Export:** Generate monthly binders
- [ ] **Performance Analysis:** Pod efficiency metrics
- [ ] **Security Assessment:** Vulnerability review
- [ ] **Policy Review:** Update governance policies

### Emergency Procedures

#### Security Incident Response
1. **Detection:** Automated alerts or manual reporting
2. **Assessment:** Determine severity and scope
3. **Containment:** Immediate access restrictions
4. **Investigation:** Root cause analysis
5. **Resolution:** Permanent fixes implementation
6. **Documentation:** Complete incident reporting

#### Break-Glass Activation
1. **Emergency Declaration:** User or supervisor activates
2. **Immediate Access:** System grants emergency permissions
3. **Notification:** Real-time alerts to security team
4. **Monitoring:** Continuous activity surveillance
5. **Auto-Expiry:** Time-based access termination
6. **Review:** Mandatory compliance review process

---

## 🚨 Common Issues & Troubleshooting

### Issue: User Cannot Access Pod Data
**Symptoms:** User sees "Access Denied" or empty data
**Diagnosis:**
1. Check pod memberships in User Management tab
2. Verify user role permissions
3. Confirm pod status (active/inactive)
4. Review audit logs for access attempts

**Resolution:**
```
1. Navigate to: User Management tab
2. Find user: Search by name/email
3. Check memberships: Verify pod assignments
4. Add access: Click "Manage Access" → Add pod
5. Set role: Assign appropriate pod role
6. Test access: User refreshes application
```

### Issue: SOD Violation Detected
**Symptoms:** Red alert in Security Monitoring tab
**Diagnosis:**
1. Review violation details
2. Check permission history
3. Verify business justification
4. Assess risk level

**Resolution:**
```
1. Navigate to: Security Monitoring tab
2. Find violation: Review details and permissions
3. Choose action:
   - Remove conflicting permission
   - Create exception with justification
   - Assign role with different permissions
4. Document: Add resolution notes
5. Mark resolved: Update violation status
```

### Issue: Break-Glass Access Not Expiring
**Symptoms:** Emergency access shows as active beyond expected time
**Diagnosis:**
1. Check system time synchronization
2. Verify expiration settings
3. Review auto-expiry configuration

**Resolution:**
```
1. Navigate to: Access Control tab
2. Find break-glass: Locate active access
3. Manual deactivation: Click "🛑 Deactivate"
4. Review settings: Check auto-expiry configuration
5. Security review: Investigate why auto-expiry failed
```

---

## 📈 Performance Optimization

### Database Performance
- **RLS Policies:** Optimized for pod-based queries
- **Indexes:** Pod-aware indexing for faster filtering
- **Query Patterns:** Efficient pod-scoped data retrieval

### Security Performance
- **Permission Caching:** Role-based permission caching
- **Session Management:** Optimized session validation
- **Audit Batching:** Efficient audit log processing

### User Experience
- **Pod Switching:** Instant pod context changes
- **Real-time Updates:** Live security monitoring
- **Responsive Design:** Mobile-friendly administration

---

## 🔧 Advanced Configuration

### Pod Scaling Scenarios

#### Adding New City (e.g., Dayton)
```
Step 1: Create Pods
- DAY-A (Dayton Pod A) - Capacity: 35
- DAY-B (Dayton Pod B) - Capacity: 35

Step 2: Assign Team Leads
- Recruit/transfer experienced supervisors
- Assign pod management permissions

Step 3: Geographic Setup
- Define coverage areas (zip codes)
- Set service radius limits
- Configure EVV compliance rules

Step 4: User Migration
- Transfer users from other pods if needed
- Create new user accounts
- Set up pod memberships
```

#### Pod Capacity Expansion
```
Current: CIN-A at 28/35 caregivers
Target: Expand to 50 caregivers

Steps:
1. Update pod capacity: 35 → 50
2. Hire additional caregivers
3. Assess team lead capacity
4. Consider pod splitting at 45+ caregivers
```

### Custom Role Creation
```
New Role: "Clinical Supervisor"
Permissions:
- client:read, client:phi_access
- schedule:read, schedule:update
- evv:read, evv:override
- hr:read (caregivers only)
- audit:read (clinical events only)

Pod Scope: Single pod assignment
Access Level: Elevated
Restrictions: PHI access during business hours only
```

---

## 📋 Compliance Checklist

### HIPAA Compliance
- [ ] **PHI Access Controls:** Role-based PHI restrictions
- [ ] **Audit Logging:** Complete PHI access tracking
- [ ] **Data Encryption:** End-to-end encryption
- [ ] **Breach Notification:** Automated incident reporting
- [ ] **Business Associate:** Third-party compliance

### Ohio EVV Compliance
- [ ] **GPS Verification:** Location-based visit confirmation
- [ ] **Time Tracking:** Accurate visit duration recording
- [ ] **Service Verification:** Task completion confirmation
- [ ] **Real-time Submission:** Ohio Medicaid system integration
- [ ] **Compliance Reporting:** Automated compliance metrics

### SOX Compliance (if applicable)
- [ ] **Separation of Duties:** Conflicting permission prevention
- [ ] **Financial Controls:** Revenue cycle segregation
- [ ] **Audit Trails:** Financial transaction logging
- [ ] **Change Management:** Configuration change controls
- [ ] **Access Reviews:** Quarterly access certification

### Organizational Policies
- [ ] **Password Policy:** Complexity requirements
- [ ] **MFA Requirements:** Multi-factor authentication
- [ ] **Session Management:** Timeout and lockout policies
- [ ] **Training Compliance:** Security awareness training
- [ ] **Incident Response:** Security incident procedures

---

## 🎯 Success Metrics

### Security KPIs
- **Zero SOD Violations:** Target 0 active violations
- **JIT Usage Efficiency:** <2% of total access time
- **Break-Glass Frequency:** <1 per month per pod
- **Audit Compliance:** 100% audit log coverage
- **Incident Response:** <30 minutes to containment

### Operational KPIs
- **Pod Efficiency:** >95% caregiver utilization
- **EVV Compliance:** >98% compliance rate
- **User Satisfaction:** >90% administration ease
- **System Performance:** <300ms response time
- **Availability:** 99.9% uptime

### Compliance KPIs
- **HIPAA Compliance:** 100% PHI protection
- **Ohio EVV:** 100% visit verification
- **Audit Readiness:** <24 hours to export
- **Policy Compliance:** >95% user adherence
- **Training Completion:** 100% required training

---

## 📞 Support & Escalation

### Internal Support
- **IT Help Desk:** Standard user issues
- **Security Team:** Incident response, access issues
- **Compliance Officer:** Audit questions, policy clarification
- **System Administrator:** Configuration changes, performance

### External Support
- **Ohio Medicaid:** EVV compliance questions
- **HIPAA Consultant:** Privacy and security guidance
- **Audit Firm:** External audit preparation
- **Legal Counsel:** Regulatory compliance advice

### Emergency Contacts
```
Security Incident: security@serenitycare.com
System Outage: it-emergency@serenitycare.com
Compliance Issue: compliance@serenitycare.com
Legal Emergency: legal@serenitycare.com
```

---

## 📚 Additional Resources

### Documentation
- **Database Schema:** `/backend/src/database/migrations/001_pod_governance_schema.sql`
- **Access Control:** `/backend/src/auth/access-control.ts`
- **Type Definitions:** `/backend/src/types/pod-governance.ts`
- **Pod Context Hook:** `/frontend/src/hooks/usePodContext.ts`

### Training Materials
- **Video Tutorials:** Super Admin Console walkthrough
- **Interactive Guides:** Step-by-step pod management
- **Security Training:** Best practices and procedures
- **Compliance Training:** HIPAA, EVV, SOD requirements

### API Documentation
- **Pod Management API:** CRUD operations for pods
- **User Management API:** User and permission management
- **Audit API:** Log retrieval and analysis
- **Compliance API:** Report generation and export

---

**Document Version:** 1.0
**Last Updated:** September 20, 2025
**Next Review:** December 20, 2025
**Owner:** Serenity Care Partners IT Department
**Approved By:** Sarah Johnson, Founder & CEO