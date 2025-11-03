# Compliance Policy Documents

**Purpose:** HIPAA and operational policy documentation

**Status:** Phase 0-1 - Structure created, policies pending Phase 4

---

## Policy Documents (Planned for Phase 4)

### EVV & Service Delivery
- `Consent_EVV_Location.md` - Patient consent for GPS location tracking (Ohio requirement)
- `EVV_Exception_Policy.md` - Procedures for EVV failures/exceptions
- `Service_Verification_Standards.md` - Standards for EVV 6-element compliance

### Data & Privacy
- `Data_Retention_Policy.md` - Retention periods for all data types (HIPAA compliance)
- `PHI_Handling_Policy.md` - PHI protection and redaction standards
- `Break_Glass_Access_Policy.md` - Emergency access procedures and logging

### HR & Operations
- `Earned_Overtime_Policy.md` - EO eligibility, accrual rates, and payout procedures
- `On_Call_Rotation_Policy.md` - On-call expectations, SLAs, and escalation
- `Policy_Acknowledgment_Requirements.md` - Staff training and sign-off requirements

### Technology & Security
- `AI_Guardrails_Policy.md` - AI usage restrictions and dual-approval requirements
- `Audit_Trail_Integrity_Policy.md` - Hash chain verification and tamper detection
- `Incident_Response_Policy.md` - Security incident handling procedures

---

## Policy Lifecycle

Each policy in the Policy Center follows this lifecycle:

1. **Draft** - Policy being written/reviewed
2. **Review** - Stakeholder review and approval
3. **Active** - Published and enforceable
4. **Superseded** - Replaced by new version
5. **Archived** - Retained for compliance but not active

---

## Policy Template

```markdown
# [Policy Title]

**Policy Code:** [EVV-001, HIPAA-001, etc.]
**Version:** 1.0
**Effective Date:** YYYY-MM-DD
**Review Frequency:** Annual / Quarterly
**Owner:** [Role]
**Requires Sign-off:** Yes / No

## Purpose
[Why this policy exists]

## Scope
[Who/what this applies to]

## Policy
[The actual policy statements]

## Procedures
[Step-by-step how-to]

## Responsibilities
[Who does what]

## Non-Compliance Consequences
[What happens if policy is violated]

## Regulatory Basis
[HIPAA, Ohio Admin Code, etc.]

## Related Policies
[Links to related policies]

## Revision History
| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | YYYY-MM-DD | Initial | [Name] |
```

---

## Integration with Policy Center

All policies are:
- Stored in `policies` database table
- Version-controlled
- Require staff sign-offs (tracked in `policy_signoffs` table)
- Automatically assigned to relevant roles
- Reminder notifications sent for unsigned policies

---

**Last Updated:** 2025-11-03
**Phase:** 0-1 (Foundation)
**Next Update:** Phase 4 (Policy Center implementation)
