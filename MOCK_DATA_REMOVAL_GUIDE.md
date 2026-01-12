# Mock Data Removal Guide

**Last Updated**: January 4, 2026

## Overview

This document provides instructions for removing all mock/sample/hard-coded data from the Serenity ERP system once real operational data is available.

## ⚠️ IMPORTANT

**DO NOT** remove mock data until you have:
1. Real patients onboarded into the system
2. Staff/caregivers properly registered
3. Actual visits and billing data being generated
4. Confirmed that all dashboards are pulling from production APIs

## Quick Removal Steps

### Step 1: Delete Mock Data File
```bash
rm frontend/src/lib/mockData.ts
```

### Step 2: Find All Mock Data References
```bash
cd frontend
grep -r "MOCK_" src/
grep -r "// MOCK DATA" src/
grep -r "import.*mockData" src/
```

### Step 3: Remove Mock Data Sections
Search for these markers in the codebase and remove the marked sections:
- `// ===== MOCK DATA START =====`
- `// ===== MOCK DATA END =====`
- `// MOCK DATA - Remove in production`
- `MOCK_PATIENTS`
- `MOCK_STAFF`
- `MOCK_*` (any constant starting with MOCK_)

## Files Containing Mock Data

### Core Mock Data File
- **`frontend/src/lib/mockData.ts`**
  - Contains all centralized mock data constants
  - Safe to delete entirely once production data exists

### Dashboard Files with Mock Data

#### WorkingClinicalDashboard.tsx
**Location**: `frontend/src/components/dashboards/WorkingClinicalDashboard.tsx`

**Mock Data Sections**:
- Lines 232-278: High Priority Patients (Eleanor Johnson, Robert Smith, Mary Williams)
- Lines 293-324: Clinical Tasks Today
- Lines 355-380: Critical Alerts View
- Lines 388-420: Vital Signs View
- Lines 427-453: Medication Adherence View
- Lines 460-481: Care Plans View
- Lines 488-514: Active Patients View
- Lines 521-545: High Priority Patients Detail View
- Lines 552-581: Clinical Tasks View

**How to Remove**: Replace arrays with API calls or show empty state when `metrics.activePatients === 0`

#### WorkingComplianceDashboard.tsx
**Location**: `frontend/src/components/dashboards/WorkingComplianceDashboard.tsx`

**Mock Data Sections**:
- Lines 149-154: Certification expiration records (2026 dates, staff names)
- Lines 158-162: Training records
- Lines 166-168: Audit records
- Lines 172-173: Security incidents
- Lines 177-180: HIPAA compliance checklist

**How to Remove**: All these should come from API endpoints. Remove the hard-coded arrays and use API data.

#### WorkingBillingDashboard.tsx
**Location**: `frontend/src/components/dashboards/WorkingBillingDashboard.tsx`

**Mock Data Sections**:
- Lines 867, 920, 931: Hard-coded dates "2024-12-15", "2024-12-20", "2024-12-18"

**How to Remove**: Replace with dynamic dates from API or use `new Date().toISOString().split('T')[0]`

## Hard-Coded Dates to Update

### Current Year
The system is currently configured for **2026**. All date references should use:
```typescript
const currentYear = new Date().getFullYear(); // 2026
```

### Files with Hard-Coded Years

Search for these patterns and replace with dynamic dates:
```bash
grep -r "2024\|2025\|2023" frontend/src/components/dashboards/
```

## Environment Variables

### Disable Mock Data
Add to `.env.local`:
```
VITE_USE_MOCK_DATA=false
```

This will disable mock data if you've implemented the `isMockDataEnabled()` check.

## Testing After Removal

1. **Empty State Testing**
   - Navigate to each dashboard with zero patients/staff
   - Verify empty states show properly
   - Ensure no errors in console

2. **Production Data Testing**
   - Add 1-2 real patients
   - Verify they appear in dashboards
   - Confirm no mock names appear

3. **Search for Remnants**
   ```bash
   # Should return no results:
   grep -r "Eleanor Johnson" frontend/src/
   grep -r "Robert Smith" frontend/src/
   grep -r "Maria Garcia" frontend/src/
   grep -r "MOCK_" frontend/src/
   ```

## Rollback Plan

If you need to restore mock data:
```bash
git checkout HEAD -- frontend/src/lib/mockData.ts
git checkout HEAD -- MOCK_DATA_REMOVAL_GUIDE.md
```

## Support

If you encounter issues after removing mock data:
1. Check browser console for errors
2. Verify API endpoints are returning data
3. Ensure empty states are properly implemented
4. Contact development team with specific error messages

---

**Last Verified**: January 4, 2026
**System Version**: Pre-production
**Next Review**: After first patient onboarding
