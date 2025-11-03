# Alternative EVV (Sandata) Integration Documentation

**Purpose:** Technical documentation for Sandata Alt-EVV integration

**Status:** Phase 0-1 - Structure created, API docs pending Phase 1-2

---

## Documentation Files (Planned)

### API Integration
- `API_CLIENT.md` - Sandata HTTP client implementation guide (Phase 1)
- `AUTHENTICATION.md` - OAuth 2.0 authentication flow (Phase 1)
- `ERROR_HANDLING.md` - Error taxonomy and retry logic (Phase 1)
- `RATE_LIMITING.md` - 429 handling and backoff strategy (Phase 2)

### Testing
- `TESTING_GUIDE.md` - Sandbox testing procedures (Phase 1)
- `MOCK_RESPONSES.md` - Mock data for unit tests (Phase 1)
- `INTEGRATION_TESTS.md` - E2E test scenarios (Phase 2)

### Certification
- `CERTIFICATION_CHECKLIST.md` - Step-by-step certification process (Phase 2)
- `FIELD_MAPPING_GUIDE.md` - How to map Serenity → Sandata fields (Phase 2)

### Operations
- `DEPLOYMENT_GUIDE.md` - Sandbox → Production cutover (Phase 3)
- `MONITORING.md` - SLOs, alerts, and dashboards (Phase 3)
- `TROUBLESHOOTING.md` - Common issues and fixes (Phase 3)

---

## Quick Links

- [Sandata Config](/backend/src/config/sandata.ts)
- [Database Migrations](/backend/src/database/migrations/015_sandata_integration.sql)
- [Feature Flags Seed](/backend/src/database/seeds/003_manifesto_feature_flags.sql)

---

**Last Updated:** 2025-11-03
**Phase:** 0-1 (Foundation)
