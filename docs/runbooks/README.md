# Operational Runbooks

**Purpose:** Alert response procedures and operational guides

**Status:** Phase 0-1 - Structure created, runbooks pending Phase 3

---

## Runbook Index (Planned for Phase 3)

### Sandata Alert Runbooks
- `alert-sandata-429.md` - Rate limit exceeded (429) response
- `alert-sandata-5xx.md` - Sandata API outage/errors
- `alert-acceptance-low.md` - Acceptance rate <95% for 2 days
- `alert-queue-depth.md` - Submission queue depth exceeded
- `alert-corrections-spike.md` - Unusual number of corrections
- `alert-api-down.md` - Sandata API unreachable

### Audit & Compliance Runbooks
- `alert-audit-chain-mismatch.md` - Hash chain verification failed
- `alert-phi-exposure.md` - Suspected PHI exposure in logs
- `alert-retention-policy-violation.md` - Data retention SLA missed

### On-Call Runbooks
- `oncall-coverage-gap.md` - No coverage detected, escalation needed
- `oncall-sla-violation.md` - ACK or resolution SLA exceeded
- `oncall-notification-failure.md` - Failed to notify on-call person

### General Operations
- `database-migration.md` - How to run migrations safely
- `feature-flag-toggle.md` - Enabling/disabling features
- `kill-switch-activation.md` - Emergency Sandata kill switch procedure
- `secrets-rotation.md` - Rotating Sandata credentials

---

## Runbook Template

Each runbook follows this structure:

```markdown
# Alert: [Alert Name]

## Severity
[Critical | High | Medium | Low]

## Symptoms
- What you'll see in monitoring
- Error messages
- User impact

## Diagnosis
- How to confirm the issue
- Queries to run
- Logs to check

## Resolution Steps
1. Immediate action (stop the bleeding)
2. Root cause investigation
3. Long-term fix

## Escalation Path
- L1: [Role] - [SLA]
- L2: [Role] - [SLA]
- L3: [Vendor] - [Contact]

## Prevention
- Monitoring improvements
- Code changes
- Process updates

## Related Alerts
- Links to related runbooks
```

---

**Last Updated:** 2025-11-03
**Phase:** 0-1 (Foundation)
**Next Update:** Phase 3 (Alert implementation)
