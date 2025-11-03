# Serenity ERP API Endpoints

Complete API documentation for the Serenity Care Partners ERP system.

**Base URL**: `http://localhost:3000`

**Server Scripts**:
- Development: `npm run dev:api`
- Production: `npm start`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
3. [Console Endpoints](#console-endpoints) (Authenticated)
4. [Admin Endpoints](#admin-endpoints) (Admin Role Required)
5. [Mobile Endpoints](#mobile-endpoints) (Authenticated)

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting

- **Public**: 300 requests / 15 minutes
- **Auth**: 5 requests / 15 minutes
- **Default**: 100 requests / 15 minutes

---

## Public Endpoints

### Careers

#### `GET /api/public/careers/jobs`
Get list of open positions

**Response**:
```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Home Health Aide",
      "location": "Columbus, OH",
      "type": "full-time",
      "description": "..."
    }
  ]
}
```

#### `POST /api/public/careers/apply`
Submit job application

**Request**:
```json
{
  "jobId": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "614-555-1234",
  "resume": "base64_string"
}
```

---

## Console Endpoints

All Console endpoints require authentication with `requireAuth` middleware.

### Dashboard

#### `GET /api/console/dashboard/pod/:podId`
Get pod dashboard overview with KPIs

**Query Parameters**:
- `organizationId` (required)

**Response**:
```json
{
  "podId": "uuid",
  "organizationId": "uuid",
  "metrics": {
    "caregivers": {
      "total": 25,
      "active": 23,
      "onShiftToday": 15
    },
    "clients": {
      "total": 50,
      "active": 48,
      "scheduledToday": 42
    },
    "shifts": {
      "today": 42,
      "completed": 10,
      "inProgress": 15,
      "upcoming": 17,
      "missed": 0
    },
    "evvCompliance": {
      "weeklyRate": 98.5,
      "totalVisits": 200,
      "compliantVisits": 197,
      "pendingVisits": 2,
      "rejectedVisits": 1
    }
  }
}
```

#### `GET /api/console/dashboard/kpis/:organizationId`
Get high-level KPIs for organization

**Query Parameters**:
- `period` (default: 30) - days to look back

**Response**:
```json
{
  "kpis": {
    "billableHours": 1245.5,
    "totalVisits": 500,
    "sandataSyncRate": 99.2,
    "activeCaregivers": 25,
    "activeClients": 50,
    "expiringCertifications": 3
  }
}
```

#### `GET /api/console/dashboard/recent-activity/:organizationId`
Get recent system activity

**Query Parameters**:
- `limit` (default: 20)

#### `GET /api/console/dashboard/alerts/:organizationId`
Get system alerts (rejections, expirations, compliance issues)

---

### Pods

#### `GET /api/console/pods/:organizationId`
Get all pods for organization

#### `GET /api/console/pods/:organizationId/:podId`
Get detailed pod information with members and clients

#### `POST /api/console/pods/:organizationId`
Create a new pod

**Request**:
```json
{
  "name": "Pod-1",
  "podLeadUserId": "uuid"
}
```

#### `PUT /api/console/pods/:organizationId/:podId`
Update pod details

#### `POST /api/console/pods/:organizationId/:podId/members`
Assign caregivers to pod

**Request**:
```json
{
  "userIds": ["uuid1", "uuid2"]
}
```

#### `DELETE /api/console/pods/:organizationId/:podId/members/:userId`
Remove caregiver from pod

#### `POST /api/console/pods/:organizationId/:podId/clients`
Assign clients to pod

#### `DELETE /api/console/pods/:organizationId/:podId/clients/:clientId`
Remove client from pod

---

### Morning Check-In

#### `GET /api/console/morning-check-in/:organizationId/today`
Get today's morning check-in status

**Query Parameters**:
- `podId` (optional) - filter by pod

**Response**:
```json
{
  "summary": {
    "totalCaregivers": 25,
    "checkedIn": 22,
    "notCheckedIn": 3,
    "available": 20,
    "unavailable": 1,
    "late": 1,
    "absent": 0
  },
  "checkIns": [...],
  "notCheckedIn": [...]
}
```

#### `POST /api/console/morning-check-in/:organizationId`
Record morning check-in

**Request**:
```json
{
  "userId": "uuid",
  "status": "available|unavailable|late|absent",
  "notes": "Running 15 mins late"
}
```

#### `PUT /api/console/morning-check-in/:organizationId/:checkInId`
Update check-in record

#### `GET /api/console/morning-check-in/:organizationId/history`
Get historical check-in records

**Query Parameters**:
- `userId`, `startDate`, `endDate`, `status`, `limit`

#### `GET /api/console/morning-check-in/:organizationId/pod/:podId/today`
Get pod-specific check-in status

#### `GET /api/console/morning-check-in/:organizationId/stats`
Get check-in statistics and trends

---

### Shifts

#### `GET /api/console/shifts/:organizationId`
Get shifts with filtering

**Query Parameters**:
- `startDate`, `endDate`, `caregiverId`, `clientId`, `podId`, `status`, `limit`

#### `GET /api/console/shifts/:organizationId/:shiftId`
Get detailed shift information

#### `POST /api/console/shifts/:organizationId`
Create a new shift

**Request**:
```json
{
  "caregiverId": "uuid",
  "clientId": "uuid",
  "scheduledStartTime": "2025-11-02T08:00:00Z",
  "scheduledEndTime": "2025-11-02T12:00:00Z",
  "serviceCode": "T1019",
  "authorizationNumber": "AUTH-12345",
  "notes": "Client prefers morning visits"
}
```

#### `PUT /api/console/shifts/:organizationId/:shiftId`
Update shift details

#### `DELETE /api/console/shifts/:organizationId/:shiftId`
Cancel/delete shift

#### `GET /api/console/shifts/:organizationId/today`
Get today's shifts

#### `POST /api/console/shifts/:organizationId/:shiftId/start`
Mark shift as started (clock-in)

#### `POST /api/console/shifts/:organizationId/:shiftId/complete`
Mark shift as completed (clock-out)

---

### Caregivers

#### `GET /api/console/caregivers/:organizationId`
Get all caregivers

**Query Parameters**:
- `podId`, `status`, `search`

#### `GET /api/console/caregivers/:organizationId/:caregiverId`
Get detailed caregiver profile with certifications, clients, metrics

#### `POST /api/console/caregivers/:organizationId`
Create a new caregiver

**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phoneNumber": "614-555-5678",
  "dateOfBirth": "1990-05-15",
  "addressLine1": "123 Main St",
  "city": "Columbus",
  "state": "OH",
  "zipCode": "43215",
  "hireDate": "2025-01-01",
  "podId": "uuid"
}
```

#### `PUT /api/console/caregivers/:organizationId/:caregiverId`
Update caregiver profile

#### `POST /api/console/caregivers/:organizationId/:caregiverId/certifications`
Add certification

**Request**:
```json
{
  "certificationType": "HHA",
  "certificationNumber": "HHA-12345",
  "issuingAuthority": "Ohio Department of Health",
  "issueDate": "2024-01-01",
  "expirationDate": "2026-01-01"
}
```

#### `DELETE /api/console/caregivers/:organizationId/:caregiverId/certifications/:certificationId`
Expire certification

#### `GET /api/console/caregivers/:organizationId/:caregiverId/schedule`
Get caregiver's upcoming schedule

**Query Parameters**:
- `startDate`, `endDate`, `days` (default: 7)

---

### Clients

#### `GET /api/console/clients/:organizationId`
Get all clients

**Query Parameters**:
- `podId`, `status`, `search`

#### `GET /api/console/clients/:organizationId/:clientId`
Get detailed client profile

**Response includes**:
- Basic info, address, emergency contact
- EVV consent status
- Assigned caregivers
- Recent shifts
- Service authorizations
- Care plan

#### `POST /api/console/clients/:organizationId`
Create a new client

**Request**:
```json
{
  "firstName": "Mary",
  "lastName": "Johnson",
  "dateOfBirth": "1950-03-20",
  "medicaidNumber": "1234567890",
  "email": "mary@example.com",
  "phoneNumber": "614-555-9012",
  "addressLine1": "456 Oak Ave",
  "city": "Columbus",
  "state": "OH",
  "zipCode": "43215",
  "podId": "uuid",
  "emergencyContactName": "Bob Johnson",
  "emergencyContactPhone": "614-555-9013",
  "emergencyContactRelationship": "Son"
}
```

#### `PUT /api/console/clients/:organizationId/:clientId`
Update client profile

#### `POST /api/console/clients/:organizationId/:clientId/evv-consent`
Record EVV consent

**Request**:
```json
{
  "consentStatus": "signed|declined",
  "signedBy": "uuid"
}
```

#### `POST /api/console/clients/:organizationId/:clientId/authorizations`
Add service authorization

**Request**:
```json
{
  "authorizationNumber": "AUTH-12345",
  "serviceCode": "T1019",
  "unitsApproved": 240,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

#### `PUT /api/console/clients/:organizationId/:clientId/care-plan`
Update client care plan

#### `GET /api/console/clients/:organizationId/:clientId/schedule`
Get client's upcoming schedule

---

### Sandata Integration

#### `POST /api/console/sandata/individuals/sync`
Sync client to Sandata

**Request**:
```json
{
  "clientId": "uuid",
  "forceUpdate": false,
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "clientId": "uuid",
  "sandataIndividualId": "SANDATA-12345",
  "action": "created|updated|skipped",
  "errors": [],
  "warnings": []
}
```

#### `POST /api/console/sandata/employees/sync`
Sync caregiver to Sandata

**Request**:
```json
{
  "userId": "uuid",
  "forceUpdate": false,
  "dryRun": false,
  "includeCertifications": true
}
```

#### `POST /api/console/sandata/visits/submit`
Submit visit to Sandata

**Request**:
```json
{
  "evvRecordId": "uuid",
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "evvRecordId": "uuid",
  "visitKey": "ORG-20251102-001",
  "sandataVisitId": "SANDATA-VISIT-12345",
  "status": "accepted|rejected|pending",
  "errors": [],
  "transactionId": "uuid"
}
```

#### `POST /api/console/sandata/visits/correct`
Submit visit correction

**Request**:
```json
{
  "originalEVVRecordId": "uuid",
  "correctionType": "time_correction|location_correction|service_code_correction",
  "correctionReason": "Clock-in time was 15 minutes late",
  "correctedFields": {
    "clockInTime": "2025-11-02T08:15:00Z",
    "clockOutTime": "2025-11-02T12:00:00Z"
  },
  "correctedBy": "uuid"
}
```

#### `POST /api/console/sandata/visits/void`
Void a visit

**Request**:
```json
{
  "evvRecordId": "uuid",
  "voidReason": "duplicate|cancelled|no_show|data_entry_error|other",
  "voidReasonDescription": "Duplicate visit entry",
  "voidedBy": "uuid"
}
```

#### `GET /api/console/sandata/transactions`
Get Sandata transaction history

**Query Parameters**:
- `organizationId`, `evvRecordId`, `transactionType`, `status`, `startDate`, `endDate`, `limit`

#### `GET /api/console/sandata/pending-visits/:organizationId`
Get pending EVV submissions

#### `GET /api/console/sandata/rejected-visits/:organizationId`
Get rejected Sandata visits needing correction

---

## Admin Endpoints

All Admin endpoints require `admin` or `super_admin` role.

### Organizations

#### `GET /api/admin/organizations`
Get all organizations

#### `POST /api/admin/organizations`
Create new organization

**Request**:
```json
{
  "name": "Serenity Care Partners",
  "sandataProviderId": "PROVIDER-001"
}
```

#### `PUT /api/admin/organizations/:organizationId`
Update organization

---

### Sandata Configuration

#### `GET /api/admin/sandata/config/:organizationId`
Get Sandata configuration (API keys redacted)

**Response**:
```json
{
  "organizationId": "uuid",
  "sandataProviderId": "PROVIDER-001",
  "sandataApiKey": "***REDACTED***",
  "sandataEnvironment": "sandbox|production",
  "credentialsConfigured": true,
  "updatedAt": "2025-11-02T10:00:00Z"
}
```

#### `PUT /api/admin/sandata/config/:organizationId`
Update Sandata configuration

**Request**:
```json
{
  "sandataProviderId": "PROVIDER-001",
  "sandataApiKey": "your-api-key",
  "sandataEnvironment": "sandbox"
}
```

---

### Feature Flags

#### `GET /api/admin/feature-flags`
Get all feature flags

**Response**:
```json
{
  "flags": [
    {
      "key": "claims_gate_enabled",
      "value": false,
      "description": "Block claims submission without Sandata ACK",
      "updatedAt": "2025-11-02T10:00:00Z",
      "updatedBy": "uuid"
    },
    {
      "key": "sandata_sandbox_enabled",
      "value": true,
      "description": "Use Sandata sandbox endpoints",
      "updatedAt": "2025-11-02T10:00:00Z"
    }
  ]
}
```

#### `PUT /api/admin/feature-flags/:key`
Update feature flag

**Request**:
```json
{
  "value": true,
  "description": "Enable claims gate"
}
```

---

### User Management

#### `GET /api/admin/users`
Get all users across organizations

**Query Parameters**:
- `organizationId`, `role`, `status`, `search`, `limit`

#### `PUT /api/admin/users/:userId/role`
Update user role

**Request**:
```json
{
  "role": "caregiver|nurse|admin|super_admin|pod_lead"
}
```

---

### Audit Logs

#### `GET /api/admin/audit-logs`
Get audit logs with filtering

**Query Parameters**:
- `organizationId`, `userId`, `action`, `entityType`, `startDate`, `endDate`, `limit`

**Response**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "action": "user_role_updated",
      "entityType": "user",
      "entityId": "uuid",
      "changes": {
        "oldRole": "caregiver",
        "newRole": "pod_lead"
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2025-11-02T10:00:00Z"
    }
  ]
}
```

---

### System Metrics

#### `GET /api/admin/metrics`
Get system-wide metrics

**Query Parameters**:
- `period` (default: 7) - days

**Response**:
```json
{
  "period": "7 days",
  "metrics": {
    "totalOrganizations": 1,
    "totalUsers": 50,
    "totalClients": 100,
    "totalShifts": 500,
    "totalEVVRecords": 450,
    "sandataSubmissions": {
      "total": 450,
      "accepted": 445,
      "rejected": 3,
      "pending": 2,
      "successRate": 98.9
    },
    "activeSessions": 15
  }
}
```

---

## Mobile Endpoints

### EVV Clock-In/Out

#### `POST /api/mobile/evv/clock-in`
Record clock-in with GPS

**Request**:
```json
{
  "shiftId": "uuid",
  "latitude": 39.9612,
  "longitude": -82.9988,
  "accuracy": 10,
  "timestamp": "2025-11-02T08:00:00Z"
}
```

#### `POST /api/mobile/evv/clock-out`
Record clock-out

**Request**:
```json
{
  "shiftId": "uuid",
  "latitude": 39.9612,
  "longitude": -82.9988,
  "accuracy": 10,
  "timestamp": "2025-11-02T12:00:00Z"
}
```

#### `GET /api/mobile/shifts/today`
Get today's shifts for authenticated caregiver

#### `POST /api/mobile/offline-queue/sync`
Sync offline EVV records

**Request**:
```json
{
  "records": [
    {
      "shiftId": "uuid",
      "type": "clock-in|clock-out",
      "latitude": 39.9612,
      "longitude": -82.9988,
      "timestamp": "2025-11-02T08:00:00Z"
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters",
    "statusCode": 400,
    "details": {}
  }
}
```

**Error Codes**:
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

---

## Status Codes

- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## Next Steps

1. **Test with Postman/Thunder Client** - Import endpoints and test
2. **Add OpenAPI/Swagger** - Generate interactive API docs
3. **Wire to Frontend** - Connect Next.js Console UI
4. **Deploy** - Set up production environment variables

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
