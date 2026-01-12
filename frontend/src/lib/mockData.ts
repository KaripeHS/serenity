/**
 * ============================================================================
 * MOCK DATA CONSTANTS - FOR DEVELOPMENT/DEMO PURPOSES ONLY
 * ============================================================================
 *
 * This file contains all hard-coded sample data used throughout the application
 * for demonstration purposes before real patient/staff data is available.
 *
 * **IMPORTANT**: This file should be removed or emptied once production data
 * is being used. All data here is fictional and for testing/demo only.
 *
 * To remove all mock data from production:
 * 1. Delete this file: frontend/src/lib/mockData.ts
 * 2. Search for "MOCK_" in the codebase and remove those references
 * 3. Search for "// MOCK DATA" comments and remove those sections
 *
 * Last Updated: 2026-01-04
 * ============================================================================
 */

// ============================================================================
// MOCK PATIENT DATA
// ============================================================================
export const MOCK_PATIENTS = [
  {
    id: 12345,
    name: 'Eleanor Johnson',
    age: 89,
    condition: 'Post-surgical wound care',
    location: 'Columbus',
    status: 'Critical',
    alert: 'Infection risk - Daily monitoring required'
  },
  {
    id: 12346,
    name: 'Robert Smith',
    age: 76,
    condition: 'Diabetes management',
    location: 'Dublin',
    status: 'Monitor',
    alert: 'Blood sugar trending high'
  },
  {
    id: 12347,
    name: 'Mary Williams',
    age: 82,
    condition: 'Medication management',
    location: 'Westerville',
    status: 'Review',
    alert: 'Care plan review due tomorrow'
  },
  {
    id: 12348,
    name: 'James Brown',
    age: 71,
    condition: 'General care',
    location: 'Powell',
    status: 'Stable'
  },
  {
    id: 12349,
    name: 'Patricia Davis',
    age: 85,
    condition: 'Cardiac monitoring',
    location: 'Worthington',
    status: 'Monitor'
  },
  {
    id: 12350,
    name: 'Michael Wilson',
    age: 79,
    condition: 'Physical therapy',
    location: 'Hilliard',
    status: 'Stable'
  },
] as const;

// ============================================================================
// MOCK STAFF/CAREGIVER DATA
// ============================================================================
export const MOCK_STAFF = [
  { id: 'STF001', name: 'Maria Garcia', role: 'CNA', status: 'active' },
  { id: 'STF002', name: 'James Wilson', role: 'RN', status: 'active' },
  { id: 'STF003', name: 'Sarah Johnson', role: 'LPN', status: 'active' },
  { id: 'STF004', name: 'Michael Brown', role: 'HHA', status: 'active' },
  { id: 'STF005', name: 'Emily Davis', role: 'CNA', status: 'active' },
  { id: 'STF006', name: 'Robert Martinez', role: 'RN', status: 'active' },
  { id: 'STF007', name: 'Jane Smith', role: 'Scheduler', status: 'active' },
  { id: 'STF008', name: 'John Doe', role: 'Caregiver', status: 'active' },
] as const;

// ============================================================================
// MOCK CLINICAL DATA
// ============================================================================
export const MOCK_VITAL_SIGNS = [
  { patient: 'Eleanor Johnson', bp: '145/92', temp: '99.1°F', pulse: '88', o2: '95%', status: 'Monitor' },
  { patient: 'Robert Smith', bp: '138/85', temp: '98.6°F', pulse: '76', o2: '97%', status: 'Normal' },
  { patient: 'Mary Williams', bp: '128/78', temp: '98.4°F', pulse: '72', o2: '98%', status: 'Normal' },
] as const;

export const MOCK_MEDICATION_DATA = [
  { patient: 'Eleanor Johnson', compliance: 98, missed: 0, medications: 8 },
  { patient: 'Robert Smith', compliance: 95, missed: 2, medications: 12 },
  { patient: 'Mary Williams', compliance: 100, missed: 0, medications: 6 },
] as const;

export const MOCK_CARE_PLANS = [
  { patient: 'Eleanor Johnson', dueDate: '2026-01-05', type: 'Post-Surgical', priority: 'High' },
  { patient: 'Robert Smith', dueDate: '2026-01-06', type: 'Diabetes Management', priority: 'Medium' },
  { patient: 'Mary Williams', dueDate: '2026-01-05', type: 'Medication Review', priority: 'Medium' },
] as const;

export const MOCK_CLINICAL_ALERTS = [
  { patient: 'Eleanor Johnson', age: 89, alert: 'Infection risk detected', severity: 'Critical', location: 'Columbus' },
  { patient: 'Robert Smith', age: 76, alert: 'Blood sugar levels critically high', severity: 'Critical', location: 'Dublin' },
  { patient: 'Mary Williams', age: 82, alert: 'Missed medication doses', severity: 'High', location: 'Westerville' },
] as const;

export const MOCK_CLINICAL_TASKS = [
  { task: 'Wound Assessments', scheduled: 23, completed: 18, type: 'Assessment' },
  { task: 'Medication Reviews', scheduled: 15, completed: 15, type: 'Review' },
  { task: 'Care Plan Updates', scheduled: 8, completed: 3, type: 'Documentation' },
] as const;

// ============================================================================
// MOCK COMPLIANCE DATA
// ============================================================================
export const MOCK_CERTIFICATIONS = [
  { id: 'CERT001', staffName: 'Maria Garcia', certification: 'CPR/BLS', expiryDate: '2026-02-15', status: 'expiring_soon', daysUntilExpiry: 42 },
  { id: 'CERT002', staffName: 'James Wilson', certification: 'CNA License', expiryDate: '2026-03-01', status: 'expiring_soon', daysUntilExpiry: 56 },
  { id: 'CERT003', staffName: 'Sarah Johnson', certification: 'HIPAA Training', expiryDate: '2026-04-15', status: 'current', daysUntilExpiry: 101 },
  { id: 'CERT004', staffName: 'Michael Brown', certification: 'First Aid', expiryDate: '2026-12-31', status: 'current', daysUntilExpiry: 361 },
  { id: 'CERT005', staffName: 'Emily Davis', certification: 'TB Test', expiryDate: '2026-06-20', status: 'current', daysUntilExpiry: 168 },
  { id: 'CERT006', staffName: 'Robert Martinez', certification: 'Background Check', expiryDate: '2027-06-15', status: 'current', daysUntilExpiry: 527 },
] as const;

export const MOCK_TRAININGS = [
  { id: 'TRN001', staffName: 'Maria Garcia', trainingName: 'HIPAA Privacy Refresher', dueDate: '2026-02-28', status: 'in_progress', progress: 75 },
  { id: 'TRN002', staffName: 'James Wilson', trainingName: 'Infection Control', dueDate: '2026-03-15', status: 'in_progress', progress: 85 },
  { id: 'TRN003', staffName: 'Sarah Johnson', trainingName: 'Fall Prevention', dueDate: '2026-03-20', status: 'not_started', progress: 0 },
  { id: 'TRN004', staffName: 'Michael Brown', trainingName: 'Medication Administration', dueDate: '2026-02-10', status: 'completed', progress: 100 },
  { id: 'TRN005', staffName: 'Emily Davis', trainingName: 'Patient Rights', dueDate: '2026-03-01', status: 'in_progress', progress: 50 },
] as const;

export const MOCK_AUDITS = [
  { id: 'AUD001', auditName: 'Annual HIPAA Compliance Audit', auditor: 'Internal Compliance Team', startDate: '2026-01-15', status: 'in_progress', findings: 0, area: 'Privacy & Security' },
  { id: 'AUD002', auditName: 'EVV System Audit', auditor: 'State Medicaid Agency', startDate: '2026-02-01', status: 'scheduled', findings: 0, area: 'Billing Compliance' },
  { id: 'AUD003', auditName: 'Clinical Documentation Review', auditor: 'Quality Assurance', startDate: '2026-01-10', status: 'in_progress', findings: 0, area: 'Clinical' },
] as const;

export const MOCK_SECURITY_INCIDENTS = [
  { id: 'SEC001', type: 'Phishing Attempt', description: 'Suspicious email reported by staff', reportedDate: '2026-01-02', status: 'investigating', severity: 'low', affectedSystems: ['Email'] },
] as const;

// ============================================================================
// MOCK BILLING DATA
// ============================================================================
export const MOCK_BILLING_CLAIMS = [
  { id: 'CLM001', patientName: 'Sample Patient', amount: 450.00, status: 'pending', date: '2026-01-15' },
  { id: 'CLM002', patientName: 'Sample Patient 2', amount: 620.00, status: 'approved', date: '2026-01-18' },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if mock data is enabled (for development/demo)
 * Set environment variable VITE_USE_MOCK_DATA=false to disable
 */
export const isMockDataEnabled = () => {
  return import.meta.env.VITE_USE_MOCK_DATA !== 'false';
};

/**
 * Get current year for dynamic date generation
 */
export const getCurrentYear = () => new Date().getFullYear(); // Returns 2026

/**
 * Replace all instances of old year with current year in a date string
 */
export const updateMockDate = (dateString: string): string => {
  const currentYear = getCurrentYear();
  return dateString.replace(/202[3-5]/, currentYear.toString());
};
