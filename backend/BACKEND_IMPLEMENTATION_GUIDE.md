# Backend Implementation Guide - Phase 1
**Dashboard Integration API Endpoints**

**Status:** Ready for Implementation
**Estimated Effort:** 120 hours (3 weeks, 1 developer)

---

## 📋 Overview

This guide provides step-by-step instructions for implementing the 21 critical API endpoints required to connect all 11 web-based command centers to live data.

---

## 🏗️ Architecture

### Tech Stack
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL with Row-Level Security
- **ORM:** Direct SQL queries (for performance)
- **Validation:** Zod
- **Authentication:** JWT tokens
- **RBAC:** Role-based + feature-level permissions

### Code Structure
```
backend/
├── src/
│   ├── controllers/        # HTTP request handlers
│   │   ├── executive.controller.ts
│   │   ├── operations.controller.ts
│   │   ├── caregiver.controller.ts
│   │   ├── client.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/           # Business logic
│   │   ├── executive.service.ts
│   │   ├── operations.service.ts
│   │   ├── caregiver.service.ts
│   │   ├── client.service.ts
│   │   └── admin.service.ts
│   │
│   ├── routes/             # Express routes
│   │   ├── executive.routes.ts
│   │   ├── operations.routes.ts
│   │   ├── caregiver.routes.ts
│   │   ├── client.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── middleware/         # Auth, validation, error handling
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   │
│   └── database/
│       ├── connection.ts
│       └── migrations/
│
└── API_ENDPOINTS_SPEC.md  # Complete API specification
```

---

## 🔐 Authentication & RBAC

### Middleware Setup

All API endpoints MUST use the `authenticate` middleware:

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
    permissions: string[];
    clientId?: string;
    authorizedClients?: string[];
  };
  db: DatabaseConnection;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Fetch user from database
    const userResult = await req.db.query(
      `SELECT id, organization_id, role, permissions, client_id
       FROM users
       WHERE id = $1 AND status = 'active'`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or inactive'
        }
      });
    }

    const user = userResult.rows[0];

    // Set current organization for row-level security
    await req.db.query(
      `SET app.current_organization_id = $1`,
      [user.organization_id]
    );

    // Attach user to request
    req.user = {
      id: user.id,
      organizationId: user.organization_id,
      role: user.role,
      permissions: user.permissions || [],
      clientId: user.client_id
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token expired'
        }
      });
    }
    next(error);
  }
}
```

### RBAC Enforcement Pattern

**Dashboard-Level Permission:**
```typescript
// Must have dashboard access
if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this dashboard'
    }
  });
}
```

**Feature-Level Permission:**
```typescript
// Must have specific feature permission
if (!req.user!.permissions?.includes('VIEW_REVENUE_ANALYTICS')) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to view revenue analytics'
    }
  });
}
```

**Client Isolation (Client Portal):**
```typescript
// Can only view own client record or authorized family members
if (user.clientId !== clientId && !user.authorizedClients?.includes(clientId)) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this client record'
    }
  });
}
```

**Caregiver Isolation (Caregiver Portal):**
```typescript
// Caregivers can only view own data
if (caregiverId !== user.id) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You can only access your own data'
    }
  });
}
```

---

## 📝 Implementation Pattern

### Step-by-Step for Each Endpoint

#### 1. Create Service Layer

**File:** `src/services/[domain].service.ts`

```typescript
// Example: executive.service.ts
export class ExecutiveService {
  async getOverview(organizationId: string, dateRange: string) {
    // Business logic here
    // Database queries
    // Data transformation
    return data;
  }
}

export const executiveService = new ExecutiveService();
```

**Responsibilities:**
- Business logic
- Database queries
- Data transformation
- Calculation logic
- No HTTP concerns

#### 2. Create Controller Layer

**File:** `src/controllers/[domain].controller.ts`

```typescript
// Example: executive.controller.ts
export class ExecutiveController {
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // 1. RBAC enforcement
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({ ... });
      }

      // 2. Input validation
      const { dateRange } = req.query;
      // Validation logic

      // 3. Call service
      const data = await executiveService.getOverview(
        req.user!.organizationId,
        dateRange
      );

      // 4. Return response
      return res.status(200).json({
        success: true,
        data,
        meta: { lastUpdated: new Date().toISOString() }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const executiveController = new ExecutiveController();
```

**Responsibilities:**
- HTTP request/response handling
- RBAC enforcement
- Input validation
- Error handling
- Response formatting

#### 3. Create Routes Layer

**File:** `src/routes/[domain].routes.ts`

```typescript
// Example: executive.routes.ts
import { Router } from 'express';
import { executiveController } from '../controllers/executive.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Define routes
router.get('/overview', executiveController.getOverview.bind(executiveController));
router.get('/revenue', executiveController.getRevenueAnalytics.bind(executiveController));
router.get('/risks', executiveController.getRisks.bind(executiveController));

export default router;
```

**Responsibilities:**
- Route definitions
- Middleware application
- Binding controllers

#### 4. Register Routes in Main App

**File:** `src/index.ts` or `src/app.ts`

```typescript
import express from 'express';
import executiveRoutes from './routes/executive.routes';
import operationsRoutes from './routes/operations.routes';
// ... other imports

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/executive', executiveRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/caregiver-portal', caregiverRoutes);
app.use('/api/client-portal', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bi', biRoutes);

// Error handler
app.use(errorHandler);

export default app;
```

---

## 🚀 Week 1: Executive & Strategic Growth (7 endpoints)

### Endpoints to Implement

1. ✅ **GET /api/executive/overview** (Example provided)
   - Service: `executiveService.getOverview()`
   - Controller: `executiveController.getOverview()`
   - Route: `/api/executive/overview`

2. **GET /api/executive/revenue**
   - Service: `executiveService.getRevenueAnalytics()`
   - Controller: `executiveController.getRevenueAnalytics()`
   - Route: `/api/executive/revenue`

3. **GET /api/executive/risks**
   - Service: `executiveService.getRisks()`
   - Controller: `executiveController.getRisks()`
   - Route: `/api/executive/risks`

4. **GET /api/analytics/growth-overview**
   - Service: `analyticsService.getGrowthOverview()`
   - Controller: `analyticsController.getGrowthOverview()`
   - Route: `/api/analytics/growth-overview`

5. **GET /api/analytics/hiring-forecast**
   - Service: `analyticsService.getHiringForecast()`
   - Controller: `analyticsController.getHiringForecast()`
   - Route: `/api/analytics/hiring-forecast`

6. **GET /api/analytics/churn-predictions**
   - Service: `analyticsService.getChurnPredictions()`
   - Controller: `analyticsController.getChurnPredictions()`
   - Route: `/api/analytics/churn-predictions`

7. **GET /api/analytics/lead-scoring**
   - Service: `analyticsService.getLeadScoring()`
   - Controller: `analyticsController.getLeadScoring()`
   - Route: `/api/analytics/lead-scoring`

### Testing Checklist

- [ ] All 7 endpoints return correct data structure
- [ ] RBAC enforcement works (403 for unauthorized roles)
- [ ] Input validation works (400 for invalid parameters)
- [ ] API response times < 200ms (P95)
- [ ] Database queries use proper indexes
- [ ] Row-level security enforced
- [ ] Error handling works correctly
- [ ] Unit tests written for services
- [ ] Integration tests written for endpoints

---

## 🧪 Testing

### Unit Tests

**File:** `src/services/__tests__/executive.service.test.ts`

```typescript
import { executiveService } from '../executive.service';
import { db } from '../../database/connection';

jest.mock('../../database/connection');

describe('ExecutiveService', () => {
  describe('getOverview', () => {
    it('should return executive overview data', async () => {
      // Mock database responses
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ /* mock data */ }]
      });

      const result = await executiveService.getOverview('org-id', 'month');

      expect(result).toHaveProperty('businessHealth');
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('revenueTrend');
      expect(result).toHaveProperty('urgentItems');
    });

    it('should calculate business health score correctly', async () => {
      // Test business health calculation
    });
  });
});
```

### Integration Tests

**File:** `src/controllers/__tests__/executive.controller.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';

describe('Executive Controller', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'founder@example.com', password: 'password' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/executive/overview', () => {
    it('should return 200 with valid data for authorized user', async () => {
      const response = await request(app)
        .get('/api/executive/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ dateRange: 'month' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businessHealth');
    });

    it('should return 403 for unauthorized role', async () => {
      // Test with caregiver token
      const caregiverResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'caregiver@example.com', password: 'password' });

      const response = await request(app)
        .get('/api/executive/overview')
        .set('Authorization', `Bearer ${caregiverResponse.body.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/executive/overview');

      expect(response.status).toBe(401);
    });
  });
});
```

### Performance Tests

**File:** `src/__tests__/performance.test.ts`

```typescript
import request from 'supertest';
import app from '../app';

describe('API Performance', () => {
  it('executive overview should respond in < 200ms', async () => {
    const start = Date.now();

    await request(app)
      .get('/api/executive/overview')
      .set('Authorization', `Bearer ${authToken}`);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });
});
```

---

## 📊 Database Query Optimization

### Use Indexes

All required indexes are already created in migrations. Ensure queries use them:

```sql
-- Good: Uses index
EXPLAIN ANALYZE
SELECT * FROM visits
WHERE organization_id = $1
  AND scheduled_start >= $2
  AND scheduled_start <= $3;

-- Index scan on idx_visits_org_scheduled
```

### Use CTEs for Readability

```sql
WITH current_period AS (
  SELECT ...
),
previous_period AS (
  SELECT ...
)
SELECT * FROM current_period, previous_period;
```

### Fetch Data in Parallel

```typescript
// Good: Parallel queries
const [data1, data2, data3] = await Promise.all([
  db.query(query1, params1),
  db.query(query2, params2),
  db.query(query3, params3)
]);

// Bad: Sequential queries
const data1 = await db.query(query1, params1);
const data2 = await db.query(query2, params2);
const data3 = await db.query(query3, params3);
```

### Use EXPLAIN ANALYZE

Always test query performance:

```sql
EXPLAIN ANALYZE
SELECT ...;

-- Look for:
-- - Sequential scans (bad)
-- - Index scans (good)
-- - Execution time < 50ms
```

---

## 🔍 Debugging Tips

### Log Slow Queries

```typescript
const startTime = Date.now();
const result = await db.query(query, params);
const duration = Date.now() - startTime;

if (duration > 100) {
  console.warn(`Slow query (${duration}ms):`, query);
}
```

### Test RBAC Logic

```bash
# Test as Founder (should work)
curl -H "Authorization: Bearer $FOUNDER_TOKEN" \
  http://localhost:3000/api/executive/overview

# Test as Caregiver (should get 403)
curl -H "Authorization: Bearer $CAREGIVER_TOKEN" \
  http://localhost:3000/api/executive/overview
```

### Monitor API Response Times

```typescript
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });

  next();
});
```

---

## 📦 Deployment Checklist

### Environment Variables

```bash
# .env.production
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### Database Migrations

```bash
# Run all migrations in production
npm run migrate
```

### Health Check Endpoint

```typescript
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Monitoring

- Enable API response time tracking
- Set up error tracking (Sentry)
- Configure performance monitoring (Datadog/New Relic)
- Set up alerts for high error rates

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ All 21 endpoints implemented and tested
- ✅ API response times < 200ms (P95)
- ✅ Error rate < 0.1%
- ✅ Test coverage > 80%
- ✅ Zero RBAC bypass vulnerabilities

### Integration Metrics
- ✅ All 11 dashboards connected to live data
- ✅ Loading states working correctly
- ✅ Error states displaying user-friendly messages
- ✅ Empty states showing when no data

### Production Readiness
- ✅ All migrations run successfully
- ✅ Monitoring and alerting configured
- ✅ Error tracking enabled
- ✅ Performance benchmarks met
- ✅ Security testing complete

---

## 📞 Support

### Documentation
- **API Spec:** `API_ENDPOINTS_SPEC.md`
- **Database Schema:** `src/database/migrations/`
- **Example Service:** `src/services/executive.service.ts`
- **Example Controller:** `src/controllers/executive.controller.ts`
- **Example Routes:** `src/routes/executive.routes.ts`

### Questions?
Review the comprehensive documentation in `docs/`:
- `README.md` - Documentation index
- `NEXT_STEPS.md` - Complete roadmap
- `PHASE1_READY.md` - Backend integration prep

---

**Document Owner:** Claude Sonnet 4.5 (AI Development Assistant)
**Last Updated:** December 13, 2025
**Status:** Ready for Implementation
