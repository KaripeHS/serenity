# Backend API - Ready for Use

## Status: ✅ OPERATIONAL

The Serenity ERP backend API is now running and functional.

## Quick Start

```bash
cd backend
npm run dev:api
```

Server runs on: http://localhost:3001

## Available Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@serenitycarepartners.com","password":"ChangeMe123!"}'

# Get Current User (with token)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Console Endpoints
```bash
# Get Shifts
curl http://localhost:3001/api/console/shifts

# Get Caregivers
curl http://localhost:3001/api/console/caregivers

# Get Clients
curl http://localhost:3001/api/console/clients

# Get Pods
curl http://localhost:3001/api/console/pods
```

## Test Accounts

### Founder (Full Access)
- Email: founder@serenitycarepartners.com
- Password: ChangeMe123!

### Pod Lead (Field Supervisor)
- Email: podlead@serenitycarepartners.com
- Password: PodLead123!

### Caregivers
All caregivers use password: Caregiver123!
- maria.garcia@serenitycarepartners.com
- james.wilson@serenitycarepartners.com
- emily.chen@serenitycarepartners.com
- michael.brown@serenitycarepartners.com
- ashley.davis@serenitycarepartners.com

## Database Status

- Database: serenity_erp
- Host: localhost:5432
- User: postgres
- Auth: Trust (no password for development)

### Tables Created
- organizations
- pods
- users
- user_pod_memberships
- clients
- caregivers
- shifts
- visits
- evv_records
- claims
- sessions
- certifications
- morning_check_ins
- feature_flags
- ... and 20+ more tables

### Sample Data
- 1 Organization (Serenity Care Partners)
- 3 Pods (CIN-A, CIN-B, COL-A)
- 7 Users (1 founder, 1 pod lead, 5 caregivers)
- 5 Clients
- 7 Shifts (for today)
- 15 Certifications

## npm Scripts

```bash
# Start API server
npm run dev:api

# Database commands
npm run db:create      # Create database
npm run migrate        # Run migrations
npm run seed           # Seed test data
npm run db:setup       # Full setup (create + migrate + seed)
```

## Next Steps for Production

1. **Console Frontend**: Build Next.js admin dashboard
2. **Mobile App**: Build React Native EVV app
3. **Sandata Integration**: Configure real API credentials
4. **Email/SMS**: Configure SendGrid and Twilio
5. **Security**:
   - Change pg_hba.conf back to scram-sha-256
   - Update JWT_SECRET to production value
   - Enable HTTPS

## Architecture

```
Backend (Express.js on port 3001)
    │
    ├── /api/auth      - Authentication
    ├── /api/console   - Staff dashboard
    ├── /api/admin     - Admin configuration
    ├── /api/public    - Public endpoints
    └── /api/mobile    - Mobile app endpoints
           │
           ▼
    PostgreSQL (serenity_erp on port 5432)
```
