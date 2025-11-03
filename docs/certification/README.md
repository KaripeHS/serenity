# Sandata Certification Packet

**Purpose:** Ohio Medicaid Alt-EVV v4.3 Certification Documentation

**Status:** Phase 0-1 - Structure Created, Content Pending Phase 2

---

## Certification Requirements

To certify Serenity ERP with Sandata for Ohio Medicaid Alt-EVV compliance, the following documentation must be completed and submitted:

### 1. Certification Cover Sheet
- **File:** `Certification_Cover_Sheet.pdf`
- **Status:** Template ready (to be filled in Phase 2)
- **Contents:**
  - Organization details (Serenity Care Partners LLC)
  - ODME Provider ID
  - Sandata account information
  - Technical contact information
  - Certification date and signatures

### 2. Field Mapping Specification
- **File:** `Sandata_Field_Mapping_v4.3.xlsx`
- **Status:** Headers created (to be populated in Phase 2 after sandbox testing)
- **Contents:**
  - Serenity field → Sandata field mapping
  - Data type specifications
  - Validation rules
  - Sample data for each field
  - Transformation logic (e.g., rounding, geofence)

### 3. Test Evidence Index
- **File:** `Test_Evidence_Index.md`
- **Status:** Structure created (to be filled during Phase 2 testing)
- **Contents:**
  - Test case IDs and descriptions
  - Test execution results (sandbox)
  - Screenshots/logs of successful submissions
  - Error handling test results
  - Edge case validation
  - Performance test results

---

## Certification Process Timeline

| Phase | Activity | Deliverable | Deadline |
|-------|----------|-------------|----------|
| Phase 0-1 | Structure creation | Folder + templates | ✅ Nov 3, 2025 |
| Phase 2 | Sandbox testing | Populated field mapping | Dec 15, 2025 |
| Phase 2 | Test execution | Test evidence logs | Dec 22, 2025 |
| Phase 3 | Certification review | Complete packet | Jan 5, 2026 |
| Phase 3 | Sandata certification | Approval letter | Jan 15, 2026 |
| Phase 4 | Production cutover | Go-live | Jan 20, 2026 |

---

## Files in This Directory (Planned)

- `Certification_Cover_Sheet.pdf` - Official submission cover sheet
- `Sandata_Field_Mapping_v4.3.xlsx` - Complete field mapping (Phase 2)
- `Test_Evidence_Index.md` - Test execution results (Phase 2)
- `Sandbox_Test_Results.pdf` - Exported test logs (Phase 2)
- `Error_Handling_Evidence.pdf` - Error taxonomy test results (Phase 2)
- `Performance_Test_Results.pdf` - Load testing evidence (Phase 2)

---

## Certification Checklist

### Prerequisites
- [ ] Sandata sandbox account active
- [ ] ODME Provider ID confirmed
- [ ] Ohio Alt-EVV v4.3 specification received
- [ ] Sandata BAA executed

### Documentation
- [ ] Field mapping complete and validated
- [ ] Test evidence documented with screenshots
- [ ] Error handling tested for all taxonomy codes
- [ ] Performance test results captured (1000 visits/hour)

### Technical
- [ ] 7-day green period achieved (98% acceptance, 0 backlog >24h)
- [ ] All 6 EVV elements captured and validated
- [ ] GPS accuracy within 0.25 mile geofence
- [ ] Time rounding verified (6-minute standard)
- [ ] Authorization matching working
- [ ] Retry logic tested (3 attempts, 5-min delay)

### Sandata Review
- [ ] Certification packet submitted to Sandata
- [ ] Sandata technical review completed
- [ ] Issues/feedback addressed
- [ ] Approval letter received
- [ ] Production credentials issued

---

## Contact Information

**Serenity Technical Lead:** TBD
**Sandata Account Rep:** TBD
**ODME Certification Contact:** TBD

---

**Last Updated:** 2025-11-03
**Phase:** 0-1 (Foundation)
**Next Review:** Phase 2 kickoff (Dec 1, 2025)
