# Backend API Endpoints Specification
**Phase 1: Dashboard Integration - 21 Critical Endpoints**

**Date:** December 13, 2025
**Status:** Ready for Implementation
**Estimated Effort:** 3 weeks (120 hours)

---

## Overview

This document specifies all backend API endpoints required to connect the 11 web-based command centers to live data. All endpoints must enforce RBAC at the API level and return consistent response formats.

---

## Standard Response Format

### Success Response
```typescript
{
  success: true,
  data: T, // Response data
  meta?: {
    total?: number,
    page?: number,
    pageSize?: number,
    lastUpdated?: string
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string, // e.g., "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR"
    message: string,
    details?: any
  }
}
```

### Standard HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (RBAC)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Week 1: Executive & Strategic Growth APIs (7 endpoints)

### 1. GET /api/executive/overview

**Purpose:** Executive Command Center - Overview tab

**Required Permissions:**
- Dashboard: `EXECUTIVE_COMMAND_CENTER`
- Feature: None (dashboard access is sufficient)

**Query Parameters:**
- `organizationId` (UUID, required)
- `dateRange` (string, optional) - "today", "week", "month", "quarter", "year" (default: "month")

**Response Schema:**
```typescript
{
  businessHealth: {
    score: number, // 0-100
    trend: "up" | "down" | "stable",
    metrics: {
      revenueGrowth: { value: number, target: number, status: "green" | "yellow" | "red" },
      clientRetention: { value: number, target: number, status: "green" | "yellow" | "red" },
      caregiverRetention: { value: number, target: number, status: "green" | "yellow" | "red" },
      onTimeRate: { value: number, target: number, status: "green" | "yellow" | "red" },
      complianceScore: { value: number, target: number, status: "green" | "yellow" | "red" },
      cashFlow: { value: number, target: number, status: "green" | "yellow" | "red" },
      profitMargin: { value: number, target: number, status: "green" | "yellow" | "red" },
      nps: { value: number, target: number, status: "green" | "yellow" | "red" }
    }
  },
  kpis: {
    totalRevenue: number,
    revenueChange: number, // Percentage change vs previous period
    activeClients: number,
    clientsChange: number,
    activeCaregivers: number,
    caregiversChange: number,
    totalVisits: number,
    visitsChange: number
  },
  revenueTrend: Array<{
    month: string, // "2025-01", "2025-02", etc.
    revenue: number,
    target: number
  }>,
  urgentItems: Array<{
    type: "risk" | "opportunity" | "alert",
    title: string,
    description: string,
    priority: "urgent" | "important" | "info",
    deadline?: string, // ISO 8601
    action?: {
      label: string,
      route: string
    }
  }>
}
```

**Data Sources:**
- `organizations` - Business health metrics
- `visits` - Visit counts and trends
- `clients` - Active client counts
- `users` (caregivers) - Caregiver counts
- `billing` - Revenue data
- Custom calculation for business health score

**RBAC Logic:**
```typescript
// Must be Founder or Finance Director
if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(user.role)) {
  return 403;
}
```

---

### 2. GET /api/executive/revenue

**Purpose:** Executive Command Center - Revenue Analytics tab

**Required Permissions:**
- Dashboard: `EXECUTIVE_COMMAND_CENTER`
- Feature: `VIEW_REVENUE_ANALYTICS`

**Query Parameters:**
- `organizationId` (UUID, required)
- `startDate` (ISO 8601, required)
- `endDate` (ISO 8601, required)
- `groupBy` (string, optional) - "day", "week", "month" (default: "month")

**Response Schema:**
```typescript
{
  revenueByServiceLine: Array<{
    serviceType: string, // "PDC", "HCBS Waiver", "Private Pay", etc.
    revenue: number,
    visits: number,
    avgReimbursement: number,
    percentage: number // Percentage of total revenue
  }>,
  revenueByPayer: Array<{
    payerName: string,
    revenue: number,
    claims: number,
    avgDaysToPayment: number,
    collectionRate: number
  }>,
  profitabilityAnalysis: {
    totalRevenue: number,
    totalCosts: number, // Labor costs from payroll
    grossProfit: number,
    grossMargin: number, // Percentage
    netProfit: number,
    netMargin: number
  },
  revenueTimeline: Array<{
    date: string, // ISO 8601
    revenue: number,
    costs: number,
    profit: number
  }>
}
```

**Data Sources:**
- `visits` with `service_type`
- `billing_claims` with `payer_id`
- `payroll` - Labor costs
- `billing_payments` - Revenue collections

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(user.role)) {
  return 403;
}
```

---

### 3. GET /api/executive/risks

**Purpose:** Executive Command Center - Risk Dashboard tab

**Required Permissions:**
- Dashboard: `EXECUTIVE_COMMAND_CENTER`
- Feature: `VIEW_RISK_DASHBOARD`

**Query Parameters:**
- `organizationId` (UUID, required)

**Response Schema:**
```typescript
{
  strategicRisks: Array<{
    id: string,
    category: "financial" | "operational" | "compliance" | "strategic" | "reputational",
    title: string,
    description: string,
    severity: "critical" | "high" | "medium" | "low",
    likelihood: "very_likely" | "likely" | "possible" | "unlikely",
    impact: number, // 1-10
    mitigationStatus: "unaddressed" | "in_progress" | "mitigated",
    owner: string, // User name
    dueDate?: string, // ISO 8601
    actions: Array<{
      description: string,
      status: "pending" | "in_progress" | "completed",
      completedAt?: string
    }>
  }>,
  riskTrend: {
    critical: number,
    high: number,
    medium: number,
    low: number,
    trend: "improving" | "stable" | "worsening"
  },
  complianceRisks: Array<{
    requirement: string, // e.g., "OAC 173-39-02.11"
    status: "compliant" | "at_risk" | "non_compliant",
    lastAssessed: string, // ISO 8601
    nextAssessment: string
  }>
}
```

**Data Sources:**
- New table: `strategic_risks` (to be created if doesn't exist)
- `compliance_items` - Compliance risks
- `incidents` - Operational risks
- `quality_metrics` - Quality-related risks

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(user.role)) {
  return 403;
}
```

---

### 4. GET /api/analytics/growth-overview

**Purpose:** Strategic Growth Dashboard - Growth Overview tab

**Required Permissions:**
- Dashboard: `STRATEGIC_GROWTH`

**Query Parameters:**
- `organizationId` (UUID, required)
- `forecastDays` (number, optional) - Default: 90

**Response Schema:**
```typescript
{
  currentMetrics: {
    activeClients: number,
    activeCaregivers: number,
    clientsPerCaregiver: number,
    marketPenetration: number, // Percentage
    monthlyGrowthRate: number // Percentage
  },
  clientAcquisitionForecast: {
    predicted: number, // Predicted new clients in next 90 days
    confidence: number, // 0-1
    timeline: Array<{
      date: string, // ISO 8601
      predictedClients: number,
      lowerBound: number,
      upperBound: number
    }>
  },
  growthDrivers: Array<{
    driver: string, // "referrals", "marketing", "partnerships", etc.
    contribution: number, // Percentage
    trend: "up" | "down" | "stable"
  }>,
  marketOpportunities: Array<{
    zipCode: string,
    currentClients: number,
    marketSize: number,
    penetration: number, // Percentage
    growthPotential: "high" | "medium" | "low"
  }>
}
```

**Data Sources:**
- `clients` - Historical growth data
- `client_leads` - Lead conversion data
- Machine learning predictions (Phase 3 - placeholder for now)

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(user.role)) {
  return 403;
}
```

---

### 5. GET /api/analytics/hiring-forecast

**Purpose:** Strategic Growth Dashboard - Hiring Forecast tab

**Required Permissions:**
- Dashboard: `STRATEGIC_GROWTH`
- Feature: `VIEW_PREDICTIVE_ANALYTICS`

**Query Parameters:**
- `organizationId` (UUID, required)
- `forecastDays` (number, optional) - Default: 90

**Response Schema:**
```typescript
{
  currentStaffing: {
    totalCaregivers: number,
    totalClients: number,
    ratio: number, // Clients per caregiver
    targetRatio: number,
    gap: number // Caregivers needed to reach target
  },
  hiringRecommendations: Array<{
    role: string, // "RN", "LPN", "DSP", etc.
    recommendedHires: number,
    urgency: "immediate" | "30_days" | "60_days" | "90_days",
    reason: string,
    estimatedCost: number
  }>,
  staffingForecast: Array<{
    date: string, // ISO 8601
    predictedCaregivers: number,
    predictedClients: number,
    predictedRatio: number,
    recommendedHires: number
  }>,
  capacityAnalysis: {
    currentCapacity: number, // Total weekly hours available
    utilizedCapacity: number, // Total weekly hours scheduled
    utilizationRate: number, // Percentage
    additionalCapacityNeeded: number // Hours per week
  }
}
```

**Data Sources:**
- `users` (role = caregiver) - Current staffing
- `clients` - Current client count
- `visits` - Utilization data
- Machine learning predictions (Phase 3 - use historical ratio for now)

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'FINANCE_DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
  return 403;
}
```

---

### 6. GET /api/analytics/churn-predictions

**Purpose:** Strategic Growth Dashboard - Churn Prediction tab

**Required Permissions:**
- Dashboard: `STRATEGIC_GROWTH`
- Feature: `VIEW_PREDICTIVE_ANALYTICS`

**Query Parameters:**
- `organizationId` (UUID, required)
- `riskThreshold` (number, optional) - 0-1, default: 0.5

**Response Schema:**
```typescript
{
  churnRisks: Array<{
    caregiverId: string,
    caregiverName: string,
    role: string,
    hireDate: string, // ISO 8601
    tenure: number, // Days
    churnProbability: number, // 0-1
    riskLevel: "critical" | "high" | "medium" | "low",
    riskFactors: Array<{
      factor: string, // "low_spi_score", "declining_visits", "complaints", etc.
      impact: "high" | "medium" | "low",
      value: string
    }>,
    interventions: Array<{
      type: string, // "recognition", "training", "coaching", etc.
      description: string,
      priority: number
    }>
  }>,
  churnStatistics: {
    totalAtRisk: number,
    criticalRisk: number,
    highRisk: number,
    mediumRisk: number,
    lowRisk: number,
    estimatedCostIfAllLeave: number
  },
  historicalChurn: Array<{
    month: string, // "2025-01"
    churnCount: number,
    churnRate: number, // Percentage
    averageTenure: number // Days
  }>
}
```

**Data Sources:**
- `users` (caregivers) - Tenure, performance
- `spi_daily_scores` - Performance metrics
- `visits` - Visit frequency and trends
- `disciplinary_actions` - Discipline history
- Machine learning predictions (Phase 3 - use rule-based scoring for now)

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'FINANCE_DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
  return 403;
}
```

---

### 7. GET /api/analytics/lead-scoring

**Purpose:** Strategic Growth Dashboard - Lead Scoring tab

**Required Permissions:**
- Dashboard: `STRATEGIC_GROWTH`
- Feature: `VIEW_PREDICTIVE_ANALYTICS`

**Query Parameters:**
- `organizationId` (UUID, required)
- `minScore` (number, optional) - 0-100, default: 0
- `status` (string, optional) - "new", "contacted", "qualified", "converted", "lost"

**Response Schema:**
```typescript
{
  leads: Array<{
    leadId: string,
    name: string,
    source: string, // "referral", "marketing", "website", etc.
    createdAt: string, // ISO 8601
    status: "new" | "contacted" | "qualified" | "converted" | "lost",
    conversionScore: number, // 0-100
    conversionProbability: number, // 0-1
    priority: "hot" | "warm" | "cold",
    scoringFactors: Array<{
      factor: string, // "source_referral", "response_time_fast", etc.
      impact: number, // Points added
      value: string
    }>,
    recommendedActions: Array<{
      action: string,
      timing: string,
      expectedImpact: "high" | "medium" | "low"
    }>
  }>,
  leadsummary: {
    totalLeads: number,
    hotLeads: number,
    warmLeads: number,
    coldLeads: number,
    averageScore: number,
    conversionRate: number, // Percentage
    averageTimeToConversion: number // Days
  },
  conversionFunnel: Array<{
    stage: string,
    count: number,
    conversionRate: number, // To next stage
    averageDuration: number // Days in this stage
  }>
}
```

**Data Sources:**
- `client_leads` table (if exists, otherwise create)
- `clients` - Conversion tracking
- Machine learning predictions (Phase 3 - use rule-based scoring for now)

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(user.role)) {
  return 403;
}
```

---

## Week 2: Operations & Caregiver Portal APIs (7 endpoints)

### 8. GET /api/operations/overview

**Purpose:** Operations Command Center - Overview tab

**Required Permissions:**
- Dashboard: `OPERATIONS_COMMAND_CENTER`

**Query Parameters:**
- `organizationId` (UUID, required)
- `date` (ISO 8601, optional) - Default: today

**Response Schema:**
```typescript
{
  todayStats: {
    totalVisits: number,
    completedVisits: number,
    inProgressVisits: number,
    missedVisits: number,
    onTimeRate: number, // Percentage
    lateCheckIns: number,
    geofenceViolations: number
  },
  scheduleIssues: Array<{
    type: "unassigned" | "double_booked" | "exceeds_max_hours" | "missing_credentials",
    count: number,
    visits: Array<{
      visitId: string,
      clientName: string,
      scheduledTime: string,
      issue: string,
      action: {
        label: string,
        route: string
      }
    }>
  }>,
  caregiverStatus: {
    totalOnDuty: number,
    onTime: number,
    late: number,
    missedCheckIn: number
  },
  performanceMetrics: {
    weeklyOnTimeRate: number,
    weeklyCompletionRate: number,
    avgCheckInDelay: number, // Minutes
    avgCheckOutDelay: number
  }
}
```

**Data Sources:**
- `visits` - Visit data for date
- `visit_check_ins` - EVV data
- `gps_logs` - Geofence violations

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'CLINICAL_DIRECTOR'].includes(user.role)) {
  return 403;
}
```

---

### 9. GET /api/operations/schedule

**Purpose:** Operations Command Center - Scheduling tab

**Required Permissions:**
- Dashboard: `OPERATIONS_COMMAND_CENTER`
- Feature: `VIEW_SCHEDULE`

**Query Parameters:**
- `organizationId` (UUID, required)
- `startDate` (ISO 8601, required)
- `endDate` (ISO 8601, required)
- `caregiverId` (UUID, optional) - Filter by caregiver
- `clientId` (UUID, optional) - Filter by client

**Response Schema:**
```typescript
{
  visits: Array<{
    visitId: string,
    clientId: string,
    clientName: string,
    caregiverId: string | null,
    caregiverName: string | null,
    scheduledStart: string, // ISO 8601
    scheduledEnd: string,
    serviceType: string,
    status: "scheduled" | "in_progress" | "completed" | "missed" | "cancelled",
    issues: Array<{
      type: string,
      severity: "error" | "warning" | "info",
      message: string
    }>
  }>,
  optimizationSuggestions: Array<{
    type: "reduce_travel" | "balance_workload" | "fill_gap",
    description: string,
    estimatedSavings: string,
    affectedVisits: string[]
  }>,
  utilizationByCaregiver: Array<{
    caregiverId: string,
    caregiverName: string,
    scheduledHours: number,
    maxHours: number,
    utilizationRate: number, // Percentage
    status: "underutilized" | "optimal" | "overutilized"
  }>
}
```

**Data Sources:**
- `visits` - Schedule data
- `users` (caregivers) - Max hours
- Custom route optimization logic (Phase 2 - basic for now)

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'CLINICAL_DIRECTOR'].includes(user.role)) {
  return 403;
}

// Feature-level permission
if (!user.permissions.includes('VIEW_SCHEDULE')) {
  return 403;
}
```

---

### 10. GET /api/operations/gps

**Purpose:** Operations Command Center - GPS Tracking tab

**Required Permissions:**
- Dashboard: `OPERATIONS_COMMAND_CENTER`
- Feature: `VIEW_GPS_TRACKING`

**Query Parameters:**
- `organizationId` (UUID, required)
- `caregiverId` (UUID, optional) - Filter by caregiver
- `active` (boolean, optional) - Show only active visits

**Response Schema:**
```typescript
{
  activeVisits: Array<{
    visitId: string,
    caregiverId: string,
    caregiverName: string,
    clientName: string,
    clientAddress: string,
    scheduledStart: string,
    actualCheckIn: string | null,
    status: "en_route" | "checked_in" | "checked_out",
    currentLocation: {
      latitude: number,
      longitude: number,
      accuracy: number, // Meters
      timestamp: string // ISO 8601
    } | null,
    geofence: {
      latitude: number,
      longitude: number,
      radiusMeters: number
    },
    isWithinGeofence: boolean,
    distanceFromClient: number | null // Meters
  }>,
  geofenceViolations: Array<{
    visitId: string,
    caregiverName: string,
    clientName: string,
    checkInLocation: {
      latitude: number,
      longitude: number
    },
    clientLocation: {
      latitude: number,
      longitude: number
    },
    distance: number, // Meters
    timestamp: string,
    status: "pending_review" | "approved" | "rejected",
    reason: string | null
  }>,
  locationHistory: Array<{
    caregiverId: string,
    locations: Array<{
      latitude: number,
      longitude: number,
      timestamp: string
    }>
  }>
}
```

**Data Sources:**
- `visits` - Visit data
- `visit_check_ins` - Check-in locations
- `gps_logs` - Location tracking
- `clients` - Client addresses and geofences

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'CLINICAL_DIRECTOR'].includes(user.role)) {
  return 403;
}

if (!user.permissions.includes('VIEW_GPS_TRACKING')) {
  return 403;
}
```

---

### 11. GET /api/operations/mileage

**Purpose:** Operations Command Center - Mileage tab

**Required Permissions:**
- Dashboard: `OPERATIONS_COMMAND_CENTER`
- Feature: `VIEW_MILEAGE`

**Query Parameters:**
- `organizationId` (UUID, required)
- `status` (string, optional) - "pending", "approved", "paid", "rejected"
- `caregiverId` (UUID, optional)
- `startDate` (ISO 8601, optional)
- `endDate` (ISO 8601, optional)

**Response Schema:**
```typescript
{
  mileageReimbursements: Array<{
    id: string,
    caregiverId: string,
    caregiverName: string,
    submitDate: string,
    payPeriod: string,
    totalMiles: number,
    reimbursementRate: number, // Per mile
    totalAmount: number,
    status: "pending" | "approved" | "paid" | "rejected",
    entries: Array<{
      date: string,
      fromAddress: string,
      toAddress: string,
      miles: number,
      purpose: string,
      verified: boolean
    }>,
    reviewedBy: string | null,
    reviewedAt: string | null,
    notes: string | null
  }>,
  summary: {
    totalPending: number,
    totalPendingAmount: number,
    totalApprovedThisMonth: number,
    totalPaidThisMonth: number,
    averageReimbursementPerCaregiver: number
  }
}
```

**Data Sources:**
- `mileage_reimbursements` table (if exists, otherwise create)
- `users` (caregivers)
- `visits` - For verification

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'CLINICAL_DIRECTOR'].includes(user.role)) {
  return 403;
}

if (!user.permissions.includes('VIEW_MILEAGE')) {
  return 403;
}
```

---

### 12. GET /api/caregiver-portal/visits/today

**Purpose:** Caregiver Portal - Today's Schedule tab

**Required Permissions:**
- Dashboard: `CAREGIVER_PORTAL`

**Query Parameters:**
- `caregiverId` (UUID, required) - Must match authenticated user
- `date` (ISO 8601, optional) - Default: today

**Response Schema:**
```typescript
{
  visits: Array<{
    visitId: string,
    clientName: string,
    clientAddress: string,
    scheduledStart: string,
    scheduledEnd: string,
    serviceType: string,
    tasks: Array<{
      task: string,
      completed: boolean
    }>,
    status: "upcoming" | "in_progress" | "completed" | "missed",
    checkIn: {
      time: string | null,
      location: { latitude: number, longitude: number } | null
    } | null,
    checkOut: {
      time: string | null,
      location: { latitude: number, longitude: number } | null
    } | null,
    geofence: {
      latitude: number,
      longitude: number,
      radiusMeters: number
    },
    notes: string | null,
    emergencyContacts: Array<{
      name: string,
      relationship: string,
      phone: string
    }>
  }>,
  summary: {
    totalVisits: number,
    completed: number,
    remaining: number,
    totalHours: number
  }
}
```

**Data Sources:**
- `visits` - Schedule data for caregiver
- `visit_check_ins` - Check-in/out data
- `clients` - Client info and emergency contacts

**RBAC Logic:**
```typescript
// Must be a caregiver viewing their own schedule
if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(user.role)) {
  return 403;
}

if (caregiverId !== user.id) {
  return 403; // Can only view own schedule
}
```

---

### 13. GET /api/caregiver-portal/expenses

**Purpose:** Caregiver Portal - Expenses tab

**Required Permissions:**
- Dashboard: `CAREGIVER_PORTAL`

**Query Parameters:**
- `caregiverId` (UUID, required) - Must match authenticated user
- `status` (string, optional) - "draft", "submitted", "approved", "paid", "rejected"

**Response Schema:**
```typescript
{
  expenses: Array<{
    id: string,
    expenseType: "mileage" | "supplies" | "other",
    date: string,
    description: string,
    amount: number,
    receiptUrl: string | null,
    status: "draft" | "submitted" | "approved" | "paid" | "rejected",
    submittedAt: string | null,
    approvedAt: string | null,
    approvedBy: string | null,
    rejectionReason: string | null
  }>,
  summary: {
    totalDraft: number,
    totalSubmitted: number,
    totalApproved: number,
    totalPaidThisMonth: number
  }
}
```

**Data Sources:**
- `caregiver_expenses` table (if exists, otherwise create)
- `mileage_reimbursements` table

**RBAC Logic:**
```typescript
if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(user.role)) {
  return 403;
}

if (caregiverId !== user.id) {
  return 403;
}
```

---

### 14. POST /api/caregiver-portal/expenses

**Purpose:** Caregiver Portal - Submit expense

**Required Permissions:**
- Dashboard: `CAREGIVER_PORTAL`

**Request Body:**
```typescript
{
  caregiverId: string, // Must match authenticated user
  expenseType: "mileage" | "supplies" | "other",
  date: string, // ISO 8601
  description: string,
  amount: number,
  receiptBase64: string | null // Base64-encoded image
}
```

**Response Schema:**
```typescript
{
  expenseId: string,
  status: "submitted",
  submittedAt: string
}
```

**RBAC Logic:**
```typescript
if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(user.role)) {
  return 403;
}

if (caregiverId !== user.id) {
  return 403;
}
```

---

## Week 3: Portal & Admin APIs (7 endpoints)

### 15. GET /api/client-portal/overview

**Purpose:** Client & Family Portal - Overview tab

**Required Permissions:**
- Dashboard: `CLIENT_FAMILY_PORTAL`

**Query Parameters:**
- `clientId` (UUID, required) - Must match authenticated user's client

**Response Schema:**
```typescript
{
  clientInfo: {
    name: string,
    enrollmentDate: string,
    serviceType: string,
    status: "active" | "on_hold" | "discharged"
  },
  nextVisit: {
    visitId: string,
    caregiverName: string,
    scheduledStart: string,
    scheduledEnd: string,
    serviceType: string
  } | null,
  upcomingVisits: Array<{
    visitId: string,
    caregiverName: string,
    scheduledStart: string,
    serviceType: string
  }>,
  recentUpdates: Array<{
    type: "visit_completed" | "care_plan_updated" | "message",
    title: string,
    description: string,
    timestamp: string
  }>,
  accountSummary: {
    currentBalance: number,
    lastPayment: {
      amount: number,
      date: string
    } | null,
    nextBilling: {
      amount: number,
      dueDate: string
    } | null
  }
}
```

**Data Sources:**
- `clients` - Client info
- `visits` - Upcoming visits
- `users` (caregivers) - Caregiver info
- `billing_invoices` - Account summary

**RBAC Logic:**
```typescript
if (!['CLIENT', 'FAMILY'].includes(user.role)) {
  return 403;
}

// Must be viewing own client record or authorized family member
if (user.clientId !== clientId && !user.authorizedClients?.includes(clientId)) {
  return 403;
}
```

---

### 16. GET /api/client-portal/care-plan

**Purpose:** Client & Family Portal - Care Plan tab

**Required Permissions:**
- Dashboard: `CLIENT_FAMILY_PORTAL`
- Feature: `VIEW_CARE_PLAN`

**Query Parameters:**
- `clientId` (UUID, required)

**Response Schema:**
```typescript
{
  carePlan: {
    effectiveDate: string,
    reviewDate: string,
    goals: Array<{
      goalId: string,
      description: string,
      targetDate: string,
      status: "in_progress" | "achieved" | "modified",
      progress: number // 0-100
    }>,
    services: Array<{
      serviceType: string,
      frequency: string, // "3x per week", "Daily", etc.
      duration: string, // "2 hours"
      tasks: string[]
    }>,
    assessments: Array<{
      assessmentType: string,
      assessmentDate: string,
      nextDue: string,
      assessedBy: string
    }>
  },
  progressNotes: Array<{
    date: string,
    caregiverName: string,
    note: string,
    tasksCompleted: string[]
  }>
}
```

**Data Sources:**
- `client_assessments` - Care plan data
- `care_plans` table (if exists)
- `visit_notes` - Progress notes

**RBAC Logic:**
```typescript
if (!['CLIENT', 'FAMILY'].includes(user.role)) {
  return 403;
}

if (!user.permissions.includes('VIEW_CARE_PLAN')) {
  return 403;
}

if (user.clientId !== clientId && !user.authorizedClients?.includes(clientId)) {
  return 403;
}
```

---

### 17. GET /api/client-portal/visits

**Purpose:** Client & Family Portal - Visits tab

**Required Permissions:**
- Dashboard: `CLIENT_FAMILY_PORTAL`
- Feature: `VIEW_VISIT_LOGS`

**Query Parameters:**
- `clientId` (UUID, required)
- `startDate` (ISO 8601, optional)
- `endDate` (ISO 8601, optional)
- `limit` (number, optional) - Default: 50

**Response Schema:**
```typescript
{
  visits: Array<{
    visitId: string,
    caregiverName: string,
    scheduledStart: string,
    scheduledEnd: string,
    actualStart: string | null,
    actualEnd: string | null,
    serviceType: string,
    status: "scheduled" | "completed" | "missed" | "cancelled",
    tasksCompleted: string[],
    notes: string | null,
    caregiverSignature: string | null // URL to signature image
  }>,
  upcomingCount: number,
  completedCount: number,
  missedCount: number
}
```

**Data Sources:**
- `visits` - Visit data for client
- `visit_check_ins` - Actual times
- `visit_notes` - Notes and tasks
- `users` (caregivers)

**RBAC Logic:**
```typescript
if (!['CLIENT', 'FAMILY'].includes(user.role)) {
  return 403;
}

if (!user.permissions.includes('VIEW_VISIT_LOGS')) {
  return 403;
}

if (user.clientId !== clientId && !user.authorizedClients?.includes(clientId)) {
  return 403;
}
```

---

### 18. GET /api/client-portal/invoices

**Purpose:** Client & Family Portal - Billing tab

**Required Permissions:**
- Dashboard: `CLIENT_FAMILY_PORTAL`
- Feature: `VIEW_BILLING_STATEMENTS`

**Query Parameters:**
- `clientId` (UUID, required)
- `status` (string, optional) - "unpaid", "paid", "overdue"

**Response Schema:**
```typescript
{
  invoices: Array<{
    invoiceId: string,
    invoiceNumber: string,
    invoiceDate: string,
    dueDate: string,
    amount: number,
    amountPaid: number,
    balance: number,
    status: "unpaid" | "partial" | "paid" | "overdue",
    lineItems: Array<{
      description: string,
      quantity: number,
      rate: number,
      amount: number
    }>,
    pdfUrl: string // URL to PDF invoice
  }>,
  accountSummary: {
    totalOutstanding: number,
    currentDue: number,
    overdueDue: number,
    lastPayment: {
      amount: number,
      date: string,
      method: string
    } | null
  },
  paymentHistory: Array<{
    paymentId: string,
    date: string,
    amount: number,
    method: string,
    appliedTo: string // Invoice number
  }>
}
```

**Data Sources:**
- `billing_invoices` - Invoice data
- `billing_payments` - Payment history
- `clients` - Account summary

**RBAC Logic:**
```typescript
if (!['CLIENT', 'FAMILY'].includes(user.role)) {
  return 403;
}

if (!user.permissions.includes('VIEW_BILLING_STATEMENTS')) {
  return 403;
}

if (user.clientId !== clientId && !user.authorizedClients?.includes(clientId)) {
  return 403;
}
```

---

### 19. GET /api/admin/overview

**Purpose:** Admin & System Dashboard - System Overview tab

**Required Permissions:**
- Dashboard: `ADMIN_SYSTEM`

**Query Parameters:**
- `organizationId` (UUID, required)

**Response Schema:**
```typescript
{
  systemHealth: {
    status: "healthy" | "degraded" | "critical",
    uptime: number, // Percentage
    lastRestart: string,
    uptimeDays: number
  },
  performance: {
    avgApiResponseTime: number, // Milliseconds
    p95ApiResponseTime: number,
    p99ApiResponseTime: number,
    requestsPerMinute: number,
    errorRate: number // Percentage
  },
  database: {
    size: number, // Bytes
    connections: number,
    slowQueries: number,
    lastBackup: string,
    backupStatus: "healthy" | "warning" | "failed"
  },
  users: {
    totalUsers: number,
    activeUsers: number, // Last 24 hours
    activeNow: number,
    newUsersToday: number
  },
  storage: {
    totalUsed: number, // Bytes
    documentsCount: number,
    photosCount: number,
    backupsSize: number
  }
}
```

**Data Sources:**
- System metrics (Node.js process, database)
- `users` - User counts
- `audit_logs` - Activity tracking
- Cloud storage API - Storage metrics

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'IT_ADMIN', 'SECURITY_OFFICER'].includes(user.role)) {
  return 403;
}
```

---

### 20. GET /api/admin/security

**Purpose:** Admin & System Dashboard - Security tab

**Required Permissions:**
- Dashboard: `ADMIN_SYSTEM`
- Feature: `VIEW_SYSTEM_LOGS`

**Query Parameters:**
- `organizationId` (UUID, required)
- `eventType` (string, optional) - "failed_login", "phi_access", "permission_denied", etc.
- `startDate` (ISO 8601, optional)
- `endDate` (ISO 8601, optional)
- `limit` (number, optional) - Default: 100

**Response Schema:**
```typescript
{
  securityEvents: Array<{
    eventId: string,
    eventType: "failed_login" | "phi_access" | "permission_denied" | "suspicious_activity" | "data_export",
    timestamp: string,
    userId: string | null,
    userName: string | null,
    ipAddress: string,
    userAgent: string,
    resource: string,
    action: string,
    severity: "critical" | "high" | "medium" | "low",
    requiresAction: boolean,
    details: any
  }>,
  summary: {
    totalEvents: number,
    criticalEvents: number,
    failedLogins: number,
    phiAccesses: number,
    suspiciousActivities: number
  },
  trends: {
    eventsLast24h: number,
    eventsLast7d: number,
    trend: "increasing" | "stable" | "decreasing"
  }
}
```

**Data Sources:**
- `audit_logs` - Security events
- `phi_access_logs` - PHI access tracking
- `users` - User info

**RBAC Logic:**
```typescript
if (!['FOUNDER', 'IT_ADMIN', 'SECURITY_OFFICER'].includes(user.role)) {
  return 403;
}

if (!user.permissions.includes('VIEW_SYSTEM_LOGS')) {
  return 403;
}
```

---

### 21. GET /api/bi/reports

**Purpose:** Business Intelligence Dashboard - Custom Reports tab

**Required Permissions:**
- Dashboard: `BUSINESS_INTELLIGENCE`

**Query Parameters:**
- `organizationId` (UUID, required)
- `templateId` (string, optional) - Pre-configured report template

**Response Schema:**
```typescript
{
  templates: Array<{
    templateId: string,
    name: string,
    description: string,
    category: "clinical" | "financial" | "hr" | "operations",
    lastRun: string | null,
    scheduleFrequency: "daily" | "weekly" | "monthly" | null
  }>,
  scheduledReports: Array<{
    reportId: string,
    templateName: string,
    frequency: "daily" | "weekly" | "monthly",
    nextRun: string,
    recipients: string[],
    format: "pdf" | "excel" | "csv"
  }>,
  recentReports: Array<{
    reportId: string,
    templateName: string,
    generatedAt: string,
    generatedBy: string,
    downloadUrl: string,
    format: string
  }>
}
```

**Data Sources:**
- `custom_reports` table (to create)
- `report_schedules` table (to create)
- Cloud storage - Report files

**RBAC Logic:**
```typescript
const allowedRoles = [
  'FOUNDER',
  'FINANCE_DIRECTOR',
  'BILLING_MANAGER',
  'RCM_ANALYST',
  'HR_MANAGER',
  'CLINICAL_DIRECTOR'
];

if (!allowedRoles.includes(user.role)) {
  return 403;
}
```

---

## Implementation Checklist

### Week 1: Executive & Strategic Growth
- [ ] Endpoint 1: GET /api/executive/overview
- [ ] Endpoint 2: GET /api/executive/revenue
- [ ] Endpoint 3: GET /api/executive/risks
- [ ] Endpoint 4: GET /api/analytics/growth-overview
- [ ] Endpoint 5: GET /api/analytics/hiring-forecast
- [ ] Endpoint 6: GET /api/analytics/churn-predictions
- [ ] Endpoint 7: GET /api/analytics/lead-scoring
- [ ] Integration testing with Executive & Strategic Growth dashboards
- [ ] RBAC enforcement verified

### Week 2: Operations & Caregiver Portal
- [ ] Endpoint 8: GET /api/operations/overview
- [ ] Endpoint 9: GET /api/operations/schedule
- [ ] Endpoint 10: GET /api/operations/gps
- [ ] Endpoint 11: GET /api/operations/mileage
- [ ] Endpoint 12: GET /api/caregiver-portal/visits/today
- [ ] Endpoint 13: GET /api/caregiver-portal/expenses
- [ ] Endpoint 14: POST /api/caregiver-portal/expenses
- [ ] Integration testing with Operations & Caregiver Portal
- [ ] RBAC enforcement verified

### Week 3: Portals & Admin
- [ ] Endpoint 15: GET /api/client-portal/overview
- [ ] Endpoint 16: GET /api/client-portal/care-plan
- [ ] Endpoint 17: GET /api/client-portal/visits
- [ ] Endpoint 18: GET /api/client-portal/invoices
- [ ] Endpoint 19: GET /api/admin/overview
- [ ] Endpoint 20: GET /api/admin/security
- [ ] Endpoint 21: GET /api/bi/reports
- [ ] Integration testing with all portals and admin
- [ ] End-to-end testing across all 11 dashboards
- [ ] Performance optimization (API response times < 200ms)
- [ ] RBAC enforcement verified

---

## Additional Tables to Create

Based on endpoint requirements, the following tables may need to be created:

```sql
-- Strategic risks tracking
CREATE TABLE strategic_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  category VARCHAR(50),
  title VARCHAR(200),
  description TEXT,
  severity VARCHAR(20),
  likelihood VARCHAR(20),
  impact INTEGER,
  mitigation_status VARCHAR(50),
  owner_id UUID REFERENCES users(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client leads for lead scoring
CREATE TABLE client_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(200),
  source VARCHAR(100),
  status VARCHAR(50),
  conversion_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  converted_client_id UUID REFERENCES clients(id)
);

-- Mileage reimbursements
CREATE TABLE mileage_reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id),
  submit_date DATE,
  pay_period VARCHAR(50),
  total_miles DECIMAL(10,2),
  reimbursement_rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  status VARCHAR(50),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregiver expenses
CREATE TABLE caregiver_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id),
  expense_type VARCHAR(50),
  date DATE,
  description TEXT,
  amount DECIMAL(10,2),
  receipt_url TEXT,
  status VARCHAR(50),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom reports
CREATE TABLE custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  template_id VARCHAR(100),
  name VARCHAR(200),
  description TEXT,
  category VARCHAR(50),
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ,
  file_url TEXT,
  format VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report schedules
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  template_id VARCHAR(100),
  frequency VARCHAR(20),
  next_run TIMESTAMPTZ,
  recipients JSONB,
  format VARCHAR(20),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Testing Requirements

### Unit Tests
- Each endpoint handler function
- RBAC logic for each endpoint
- Data transformation logic
- Error handling

### Integration Tests
- Full request/response cycle
- Database queries return expected data
- RBAC enforcement at API level
- Error responses for unauthorized access

### Performance Tests
- API response times < 200ms (95th percentile)
- Database query optimization
- Load testing (100+ concurrent requests)

### Security Tests
- RBAC bypass attempts
- SQL injection attempts
- XSS attempts
- CSRF protection

---

## Deployment Checklist

- [ ] All 21 endpoints implemented
- [ ] All new database tables created with migrations
- [ ] RBAC logic implemented and tested
- [ ] API documentation generated (Swagger/OpenAPI)
- [ ] Frontend dashboards connected to APIs
- [ ] Loading states, error states, empty states working
- [ ] Integration testing complete
- [ ] Performance benchmarks met (< 200ms)
- [ ] Security testing complete
- [ ] Production deployment plan reviewed
- [ ] Rollback plan prepared

---

**Document Owner:** Claude Sonnet 4.5 (AI Development Assistant)
**Last Updated:** December 13, 2025
**Status:** Ready for Backend Team Implementation
**Estimated Effort:** 120 hours (3 weeks, 1 developer)
