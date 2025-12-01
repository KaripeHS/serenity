# QUICK START - Get Running in 30 Minutes

You have patients waiting. Here's the fastest path to operational.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running

## Step 1: Database Setup (5 minutes)

### Option A: Use Local PostgreSQL (Recommended)
```bash
# Open psql as admin
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres

# In psql, run:
CREATE DATABASE serenity_erp;
\q
```

### Option B: Use Docker
```bash
docker run --name serenity-db -e POSTGRES_PASSWORD=serenity123 -e POSTGRES_DB=serenity_erp -p 5432:5432 -d postgres:14
```

## Step 2: Backend Setup (5 minutes)

```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
DATABASE_URL=postgresql://postgres:YourPassword@localhost:5432/serenity_erp
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters-long-for-security
PORT=3001
NODE_ENV=development
```

## Step 3: Run Migrations (3 minutes)

```bash
cd backend
npm run migrate
```

## Step 4: Seed Test Data (2 minutes)

```bash
npm run seed
```

## Step 5: Start Backend Server (1 minute)

```bash
npm run dev:api
```

Backend runs at: http://localhost:3001

## Step 6: Start Frontend (2 minutes)

Open a NEW terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3002

## Step 7: Test Login

Open http://localhost:3002 in your browser and login with:
- **Email:** founder@serenitycarepartners.com
- **Password:** ChangeMe123!

If you see the dashboard, you're ready to go!

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Founder | founder@serenitycarepartners.com | ChangeMe123! |
| Pod Lead | podlead@serenitycarepartners.com | PodLead123! |
| Caregiver | maria.garcia@serenitycarepartners.com | Caregiver123! |

---

## What's Working After Quick Start

### Console (Web Dashboard)
- User login/logout with JWT authentication
- View dashboard (with sample data)
- View shifts with real-time status
- View caregivers list
- View clients list
- View pods structure

### Mobile/EVV API
- Caregiver login by phone + PIN
- View today's shifts for assigned caregiver
- EVV Clock-in with GPS coordinates
- EVV Clock-out with GPS coordinates and notes
- Real-time shift status updates

### API Endpoints Ready
- `POST /api/auth/login` - Console login
- `GET /api/auth/me` - Get current user
- `GET /api/console/shifts` - List shifts
- `GET /api/console/caregivers` - List caregivers
- `GET /api/console/clients` - List clients
- `GET /api/console/pods` - List pods
- `POST /api/mobile/auth/login` - Caregiver mobile login
- `GET /api/mobile/shifts/today` - Today's shifts
- `POST /api/mobile/evv/clock-in` - EVV clock in
- `POST /api/mobile/evv/clock-out` - EVV clock out

## What Needs More Work

- Sandata EVV submission (needs API credentials from Sandata)
- Email notifications (needs SendGrid API key)
- SMS dispatch (needs Twilio credentials)

---

## Next Steps

1. Read the full plan: [SPRINT_PLAN_TO_LAUNCH.md](./SPRINT_PLAN_TO_LAUNCH.md)
2. Sign up for SendGrid (free): https://sendgrid.com
3. Sign up for Twilio ($15): https://twilio.com
4. **CALL SANDATA TODAY** - they have 2-3 week lead time!

---

## Troubleshooting

### "Missing required environment variable: DATABASE_URL"
Your `.env` file is missing or DATABASE_URL is not set.

### "connection refused"
PostgreSQL is not running. Start it or use Docker.

### "relation does not exist"
Migrations haven't run. Run: `npx tsx src/database/run-migrations.ts`

### "invalid password"
Wrong credentials. Use the defaults above or check the seed script.
