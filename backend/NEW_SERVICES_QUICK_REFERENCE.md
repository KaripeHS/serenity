# New Services Quick Reference Guide

Quick reference for all 18 new services created in Phases 2-7.

---

## Phase 2: ML & Optimization (5 files)

### 1. ML Forecast Service
**Path:** `src/services/ml/forecast.service.ts`

```typescript
import { mlForecastService } from '../services/ml/forecast.service';

// Client acquisition forecast (90 days)
const forecast = await mlForecastService.forecastClientAcquisition(organizationId, 90);

// Caregiver churn predictions
const churnRisk = await mlForecastService.predictCaregiverChurn(organizationId, 0.5);

// Lead conversion scoring
const leadScores = await mlForecastService.scoreLeads(organizationId, 50);
```

### 2. Schedule Optimizer
**Path:** `src/services/ml/schedule-optimizer.service.ts`

```typescript
import { scheduleOptimizerService } from '../services/ml/schedule-optimizer.service';

// Optimize schedule for date range
const optimization = await scheduleOptimizerService.optimizeSchedule(
  organizationId,
  startDate,
  endDate
);

// Get optimization suggestions
const suggestions = await scheduleOptimizerService.getOptimizationSuggestions(
  organizationId,
  startDate,
  endDate
);
```

### 3. WebSocket Service
**Path:** `src/services/realtime/websocket.service.ts`

```typescript
import { webSocketService } from '../services/realtime/websocket.service';

// Initialize WebSocket server
webSocketService.initialize(httpServer);

// Broadcast GPS update
webSocketService.broadcastGPSUpdate(organizationId, {
  caregiverId,
  latitude,
  longitude,
  timestamp: new Date()
});

// Broadcast schedule change
webSocketService.broadcastScheduleChange(organizationId, {
  visitId,
  caregiverId,
  scheduledStart,
  scheduledEnd
});
```

### 4. Redis Cache Service
**Path:** `src/services/cache/redis.service.ts`

```typescript
import { redisCacheService } from '../services/cache/redis.service';

// Initialize Redis
await redisCacheService.connect();

// Cache dashboard metrics
await redisCacheService.cacheDashboardMetrics(
  organizationId,
  'operations',
  metricsData,
  60 // TTL in seconds
);

// Get cached metrics
const cached = await redisCacheService.getCachedDashboardMetrics(
  organizationId,
  'operations'
);

// Store GPS location
await redisCacheService.setGPSLocation(caregiverId, latitude, longitude);

// Find nearby caregivers
const nearby = await redisCacheService.getNearbyCaregivers(
  latitude,
  longitude,
  5000 // radius in meters
);
```

### 5. ML Controller & Routes
**Path:** `src/controllers/ml.controller.ts`, `src/routes/ml.routes.ts`

**API Endpoints:**
- `GET /api/ml/forecast/client-acquisition?forecastDays=90`
- `GET /api/ml/predictions/churn?riskThreshold=0.5`
- `GET /api/ml/scoring/leads?minScore=50`
- `POST /api/ml/optimize/schedule`
- `GET /api/ml/optimize/suggestions`

---

## Phase 4: Mobile (4 files)

### 6. Offline Sync Service
**Path:** `src/services/mobile/offline-sync.service.ts`

```typescript
import { offlineSyncService } from '../services/mobile/offline-sync.service';

// Add to sync queue
const queueId = await offlineSyncService.addToQueue(
  userId,
  organizationId,
  'visit_check_in',
  'create',
  checkInData
);

// Sync user's queue
const result = await offlineSyncService.syncUserQueue(userId);
// Returns: { synced: 10, conflicts: 2, errors: 0 }

// Get conflicts for resolution
const conflicts = await offlineSyncService.getConflicts(userId);

// Resolve conflict
await offlineSyncService.resolveConflict(itemId, 'use_local');
```

### 7. Navigation Service
**Path:** `src/services/mobile/navigation.service.ts`

```typescript
import { navigationService } from '../services/mobile/navigation.service';

// Get route to client
const route = await navigationService.getRouteToClient(
  caregiverLat,
  caregiverLng,
  clientLat,
  clientLng,
  departureTime
);

// Find nearest caregivers
const nearest = await navigationService.findNearestCaregivers(
  clientLat,
  clientLng,
  organizationId,
  5 // max results
);

// Geocode address
const geocoded = await navigationService.geocodeAddress(
  '123 Main St, Columbus, OH 43215'
);

// Optimized multi-stop route
const optimized = await navigationService.getOptimizedRoute(
  startLat,
  startLng,
  waypoints,
  true // return to start
);
```

### 8. Voice-to-Text Service
**Path:** `src/services/mobile/voice-to-text.service.ts`

```typescript
import { voiceToTextService } from '../services/mobile/voice-to-text.service';

// Transcribe audio
const result = await voiceToTextService.transcribe(
  audioBase64,
  'WEBM_OPUS',
  48000,
  'en-US'
);

// Transcribe care note
const careNote = await voiceToTextService.transcribeCareNote(
  caregiverId,
  visitId,
  audioBase64,
  'WEBM_OPUS',
  48000
);

// Recognize voice command
const command = await voiceToTextService.recognizeCommand(
  audioBase64,
  'WEBM_OPUS',
  48000
);
// Returns: { command: 'Navigate to client', action: 'navigate', parameters: {} }
```

### 9. Photo Upload Service
**Path:** `src/services/mobile/photo-upload.service.ts`

```typescript
import { photoUploadService } from '../services/mobile/photo-upload.service';

// Upload expense receipt
const photo = await photoUploadService.uploadExpenseReceipt(
  caregiverId,
  organizationId,
  expenseId,
  fileBuffer,
  'receipt.jpg',
  'image/jpeg'
);

// Upload incident photo
const incidentPhoto = await photoUploadService.uploadIncidentPhoto(
  userId,
  organizationId,
  incidentId,
  fileBuffer,
  'incident.jpg',
  'image/jpeg'
);

// Get photos for entity
const photos = await photoUploadService.getPhotosForEntity(visitId, 'visit_photo');
```

---

## Phase 5: Integrations (3 files)

### 10. Background Check Adapter
**Path:** `src/services/integrations/background-check.adapter.ts`

```typescript
import { backgroundCheckAdapter } from '../services/integrations/background-check.adapter';

// Initiate background check
const result = await backgroundCheckAdapter.initiateBackgroundCheck(
  organizationId,
  {
    candidateId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-0100',
    dateOfBirth: '1990-01-01',
    ssn: '1234',
    zipCode: '43215',
    package: 'healthcare'
  }
);
// Returns: { checkId, invitationUrl }

// Get check status
const status = await backgroundCheckAdapter.getCheckStatus(checkId);

// Handle webhook
await backgroundCheckAdapter.handleWebhook(webhookPayload, 'checkr');
```

### 11. Insurance Verification Adapter
**Path:** `src/services/integrations/insurance-verification.adapter.ts`

```typescript
import { insuranceVerificationAdapter } from '../services/integrations/insurance-verification.adapter';

// Verify eligibility
const eligibility = await insuranceVerificationAdapter.verifyEligibility(
  organizationId,
  {
    memberId: 'ABC123456',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1950-05-15',
    payerId: '00192', // Medicare
    serviceType: '33', // Home health
    providerNPI: '1234567890'
  }
);

// Verify client insurance
const clientEligibility = await insuranceVerificationAdapter.verifyClientInsurance(
  clientId,
  organizationId
);

// Get supported payers
const payers = await insuranceVerificationAdapter.getSupportedPayers();
```

### 12. EHR Adapter
**Path:** `src/services/integrations/ehr.adapter.ts`

```typescript
import { ehrAdapter } from '../services/integrations/ehr.adapter';

// Import care plan
const carePlan = await ehrAdapter.importCarePlan(
  clientExternalId,
  organizationId
);

// Export progress note
const result = await ehrAdapter.exportProgressNote(organizationId, {
  clientId,
  visitId,
  noteDate: new Date(),
  author: 'RN Smith',
  noteType: 'progress',
  subjectiveFindings: 'Client reports feeling well...',
  objectiveFindings: 'Vital signs stable...',
  assessment: 'Condition improving...',
  plan: 'Continue current care plan...',
  vitalSigns: {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72
  }
});

// Test connection
const connection = await ehrAdapter.testConnection();
```

---

## Phase 6: Automation (2 files)

### 13. Smart Scheduler Service
**Path:** `src/services/automation/smart-scheduler.service.ts`

```typescript
import { smartSchedulerService } from '../services/automation/smart-scheduler.service';

// Generate optimized schedule
const schedule = await smartSchedulerService.generateOptimizedSchedule({
  organizationId,
  startDate: new Date('2025-01-15'),
  endDate: new Date('2025-01-21'),
  autoAssign: true,
  notifyCaregivers: true
});
// Returns: { totalVisits: 100, assigned: 95, unassigned: 3, conflicts: 2 }

// Auto-schedule recurring visits
const recurring = await smartSchedulerService.scheduleRecurringVisits(
  organizationId,
  4 // weeks ahead
);

// Re-optimize existing schedule
const improvements = await smartSchedulerService.reoptimizeSchedule(
  organizationId,
  new Date('2025-01-15')
);
// Returns: { improvements: 20, travelTimeSaved: 45, reassignments: 8 }
```

### 14. Approval Workflow Service
**Path:** `src/services/automation/approval-workflow.service.ts`

```typescript
import { approvalWorkflowService } from '../services/automation/approval-workflow.service';

// Start workflow
const workflow = await approvalWorkflowService.startWorkflow(
  organizationId,
  'expense',
  expenseId,
  requestedBy,
  { amount: 125.50, category: 'mileage' }
);
// Returns: { workflowId, autoApproved: false }

// Process approval
const result = await approvalWorkflowService.processApproval(
  taskId,
  approverId,
  'approved',
  'Looks good'
);
// Returns: { completed: true, finalStatus: 'approved' }

// Get pending approvals
const pending = await approvalWorkflowService.getPendingApprovals(userId);
```

---

## Phase 7: Enterprise (3 files)

### 15. Multi-State Compliance Service
**Path:** `src/services/enterprise/multi-state-compliance.service.ts`

```typescript
import { multiStateComplianceService } from '../services/enterprise/multi-state-compliance.service';

// Get state rules
const rules = await multiStateComplianceService.getStateRules('OH');

// Validate training compliance
const trainingCompliance = await multiStateComplianceService.validateTrainingCompliance(
  caregiverId,
  'OH'
);
// Returns: { compliant: true, missingHours: 0, missingCourses: [] }

// Calculate wages with state overtime rules
const wages = await multiStateComplianceService.calculateWages(
  caregiverId,
  organizationId,
  startDate,
  endDate
);

// Validate staffing ratios
const staffing = await multiStateComplianceService.validateStaffingRatios(
  organizationId,
  'OH'
);
// Returns: { compliant: true, currentRatio: '1:25', requiredRatio: '1:30' }

// Generate compliance report
const report = await multiStateComplianceService.generateComplianceReport(
  organizationId
);
```

### 16. White-Label Service
**Path:** `src/services/enterprise/white-label.service.ts`

```typescript
import { whiteLabelService } from '../services/enterprise/white-label.service';

// Get branding config
const branding = await whiteLabelService.getBrandingConfig(organizationId);

// Update branding
await whiteLabelService.updateBrandingConfig({
  organizationId,
  companyName: 'Acme Home Care',
  domain: 'acme-homecare.com',
  logoUrl: 'https://cdn.example.com/logo.png',
  colors: {
    primary: '#1E40AF',
    secondary: '#059669',
    accent: '#F59E0B',
    background: '#F9FAFB',
    text: '#111827'
  },
  fonts: {
    heading: 'Poppins, sans-serif',
    body: 'Inter, sans-serif'
  },
  terminology: {
    'caregiver': 'care professional',
    'client': 'patient'
  }
});

// Setup custom domain
const domain = await whiteLabelService.setupCustomDomain(
  organizationId,
  'acme-homecare.com'
);

// Get/update feature flags
const features = await whiteLabelService.getFeatureFlags(organizationId);
await whiteLabelService.updateFeatureFlags({
  organizationId,
  features: {
    mlForecasting: true,
    scheduleOptimization: true,
    voiceToText: false,
    ...
  }
});

// Generate custom email
const email = await whiteLabelService.generateCustomEmail(
  organizationId,
  'welcome',
  { firstName: 'John', loginUrl: 'https://...' }
);
```

### 17. Public API Service
**Path:** `src/services/enterprise/public-api.service.ts`

```typescript
import { publicAPIService } from '../services/enterprise/public-api.service';

// Generate API key
const credentials = await publicAPIService.generateAPIKey(
  organizationId,
  'Mobile App Integration',
  ['read:clients', 'write:visits', 'read:caregivers'],
  60, // rate limit per minute
  365 // expires in days
);
// Returns: { apiKey: 'sk_...', apiSecret: '...' }

// Authenticate API request
const auth = await publicAPIService.authenticateAPI(apiKey, apiSecret);
// Returns: { token, organizationId, scopes }

// Verify token
const verified = await publicAPIService.verifyAPIToken(token);

// Check rate limit
const rateLimit = await publicAPIService.checkRateLimit(apiKeyId);
// Returns: { allowed: true, remaining: 55, resetAt: Date }

// Create webhook
const webhook = await publicAPIService.createWebhook(
  organizationId,
  apiKeyId,
  'https://example.com/webhook',
  ['visit.created', 'visit.completed', 'client.updated']
);
// Returns: { webhookId, secret }

// Trigger webhook (internal)
await publicAPIService.triggerWebhook(
  organizationId,
  'visit.completed',
  { visitId, clientId, caregiverId }
);

// Get API analytics
const analytics = await publicAPIService.getAPIAnalytics(
  organizationId,
  startDate,
  endDate
);
```

---

## Quick Setup Guide

### 1. Install Dependencies
```bash
npm install socket.io redis ioredis @google-cloud/storage @google-cloud/speech sharp axios jsonwebtoken
```

### 2. Environment Variables
```env
# Redis
REDIS_URL=redis://localhost:6379

# Google Cloud
GOOGLE_MAPS_API_KEY=your-key
GOOGLE_CLOUD_SPEECH_API_KEY=your-key
GOOGLE_CLOUD_PROJECT_ID=your-project
GCS_BUCKET_NAME=your-bucket

# Background Checks
CHECKR_API_KEY=your-key

# Insurance
AVAILITY_CLIENT_ID=your-id
AVAILITY_CLIENT_SECRET=your-secret

# EHR
POINTCLICKCARE_API_KEY=your-key
POINTCLICKCARE_FACILITY_ID=your-id

# API
API_JWT_SECRET=your-secret
```

### 3. Initialize Services
```typescript
// In your main server file
import { redisCacheService } from './services/cache/redis.service';
import { webSocketService } from './services/realtime/websocket.service';

// Initialize Redis
await redisCacheService.connect();

// Initialize WebSocket
webSocketService.initialize(httpServer);
```

### 4. Add Routes
```typescript
// In your routes/index.ts
import mlRoutes from './routes/ml.routes';

app.use('/api/ml', mlRoutes);
```

---

## Common Use Cases

### Real-Time GPS Tracking
```typescript
// When caregiver sends GPS update
await redisCacheService.setGPSLocation(caregiverId, lat, lng);
webSocketService.broadcastGPSUpdate(organizationId, {
  caregiverId, latitude: lat, longitude: lng, timestamp: new Date()
});
```

### Offline Mobile Sync
```typescript
// Mobile app submits offline data
const queueId = await offlineSyncService.addToQueue(
  userId, organizationId, 'visit_check_in', 'create', data
);

// Background job processes sync
const result = await offlineSyncService.syncUserQueue(userId);
```

### Automated Scheduling
```typescript
// Generate optimized schedule for week
const schedule = await smartSchedulerService.generateOptimizedSchedule({
  organizationId,
  startDate: mondayDate,
  endDate: sundayDate,
  autoAssign: true,
  notifyCaregivers: true
});
```

### Approval Workflow
```typescript
// Caregiver submits expense
const workflow = await approvalWorkflowService.startWorkflow(
  organizationId, 'expense', expenseId, caregiverId, { amount: 50 }
);

// Manager approves
await approvalWorkflowService.processApproval(
  taskId, managerId, 'approved'
);
```

### White-Label Setup
```typescript
// Setup custom branding for franchise
await whiteLabelService.updateBrandingConfig({
  organizationId: franchiseId,
  companyName: 'Franchise XYZ',
  colors: { primary: '#FF5733', ... },
  ...
});

// Setup custom domain
await whiteLabelService.setupCustomDomain(franchiseId, 'franchise-xyz.com');
```

---

**Last Updated:** 2025-12-14
**Version:** Phase 7 Complete
