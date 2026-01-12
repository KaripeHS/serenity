import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import DashboardLayout from './components/layouts/DashboardLayout';
import { ProtectedRoute } from './hooks/useRoleAccess';
import { LeadPipeline } from './pages/admin/crm/LeadPipeline';
import { AssessmentWizard } from './pages/admin/intake/AssessmentWizard';
import { PartnerPortal } from './pages/partners/PartnerPortal';
import { FamilyPortal } from './pages/family/FamilyPortal';
import { WebEVVClock } from './components/evv/WebEVVClock';
import { PatientList } from './pages/patients/PatientList';
import { PatientDetail } from './pages/patients/PatientDetail';
import HomePage from './pages/HomePage';
import WorkingHomePage from './components/WorkingHomePage';

// Dashboard Components
import ExecutiveDashboard from './components/dashboards/ExecutiveDashboard';
import { AdminRoleManager } from './pages/admin/users/AdminRoleManager';
import { ComprehensiveUserManagement } from './pages/admin/users/ComprehensiveUserManagement';
import { UserDetailPage } from './pages/admin/users/UserDetailPage';
import { PodManagement } from './pages/admin/PodManagement';
import { PodDetailPage } from './pages/admin/pods/PodDetailPage';
import { CreatePodPage } from './pages/admin/pods/CreatePodPage';
import { WorkingTaxDashboard } from './components/dashboards/WorkingTaxDashboard';
import { WorkingTrainingDashboard } from './components/dashboards/WorkingTrainingDashboard';

// Command Center Dashboards (consolidated, modern implementations)
import TalentCommandCenter from './components/dashboards/TalentCommandCenter';
import ClinicalCommandCenter from './components/dashboards/ClinicalCommandCenter';
import ComplianceCommandCenter from './components/dashboards/ComplianceCommandCenter';
import OperationsCommandCenter from './components/dashboards/OperationsCommandCenter';

// Year 2 Enhanced Dashboards
import { ExecutiveOpportunityDashboard } from './components/dashboards/ExecutiveOpportunityDashboard';
import { DoddHpcDashboard } from './components/dashboards/DoddHpcDashboard';
import { PayrollDashboard } from './components/dashboards/PayrollDashboard';
import { ConsumerDirectedDashboard } from './components/dashboards/ConsumerDirectedDashboard';
import { SchedulingCalendar } from './components/dashboards/SchedulingCalendar';
import { BillingARDashboard } from './components/dashboards/BillingARDashboard';
import { BackgroundCheckDashboard } from './components/dashboards/BackgroundCheckDashboard';
import { ClientIntakeWizard } from './components/dashboards/ClientIntakeWizard';
import { ClaimsWorkflow } from './components/dashboards/ClaimsWorkflow';
import { LicenseManagement } from './components/dashboards/LicenseManagement';
import { CredentialExpiration } from './components/dashboards/CredentialExpiration';
import { CaregiverBonusDashboard } from './components/dashboards/CaregiverBonusDashboard';
import { TrainingManagement } from './components/dashboards/TrainingManagement';
import { CoverageDispatch } from './components/dashboards/CoverageDispatch';
import { CarePlanEditor } from './components/dashboards/CarePlanEditor';
import { OnboardingDashboard } from './components/dashboards/OnboardingDashboard';
import SupervisoryVisitsDashboard from './components/dashboards/SupervisoryVisitsDashboard';
import IncidentsDashboard from './components/dashboards/IncidentsDashboard';
import AuthorizationDashboard from './components/dashboards/AuthorizationDashboard';
import { DenialDashboard } from './components/dashboards/DenialDashboard';
import LmsDashboard from './components/dashboards/LmsDashboard';
import CaregiverPortal from './components/dashboards/CaregiverPortal';
import SandataEVVDashboard from './components/dashboards/SandataEVVDashboard';
import PodLeadDashboard from './components/dashboards/PodLeadDashboard';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage';
import { SubscriptionDetailPage } from './pages/admin/SubscriptionDetailPage';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage';
import { IntakeInvitations } from './components/admin/IntakeInvitations';
import SearchResultsPage from './pages/SearchResultsPage';
import { NewHirePortal } from './components/onboarding';
import { StaffProfile } from './pages/hr/StaffProfile';
import { ProfilePage, EditProfilePage, ChangePasswordPage } from './pages/profile';
import { PatientIntakeWorkflow } from './components/patients/PatientIntakeWorkflow';
import {
  DemographicsPage,
  InsurancePage,
  AssessmentPage,
  PhysicianOrdersPage,
  CarePlanPage,
  CaregiverAssignmentPage,
  ServiceAuthorizationPage,
  FirstVisitPage,
} from './pages/patients/intake';
import { PatientBinder } from './components/patients/intake/PatientBinder';

import BankAccounts from './pages/finance/BankAccounts';
import FinancialReports from './pages/finance/FinancialReports';
import { VendorCenter } from './pages/finance/VendorCenter';
import { ExpensePortal } from './pages/finance/ExpensePortal';
import { BankFeed } from './pages/finance/BankFeed';
import AuditLogs from './pages/admin/AuditLogs';
import { PayrollManager } from './pages/admin/PayrollManager';
import { PayrollConnect } from './pages/payroll/PayrollConnect';
import CommunicationSettings from './pages/admin/CommunicationSettings';
import EmailAccountsManager from './pages/admin/EmailAccountsManager';

// Helper to detect subdomain
const getSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  // Handle localhost and IP addresses
  if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }
  // Extract subdomain from hostname like "console.serenitycarepartners.com"
  const parts = hostname.split('.');
  // If we have a subdomain (e.g., console.serenitycarepartners.com has 3+ parts)
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    // Return subdomain if it's not "www"
    if (subdomain !== 'www') {
      return subdomain;
    }
  }
  return null;
};

// Get the portal type based on subdomain
export type PortalType = 'public' | 'console' | 'staff' | 'caregiver';

export const getPortalType = (): PortalType => {
  const subdomain = getSubdomain();
  switch (subdomain) {
    case 'console':
      return 'console';
    case 'staff':
      return 'staff';
    case 'caregiver':
      return 'caregiver';
    default:
      return 'public';
  }
};

// Public Marketing Pages (ported from public-site)
import { PublicLayout } from './components/marketing';
import PublicHomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesPage from './pages/public/ServicesPage';
import CareersPage from './pages/public/CareersPage';
import ContactPage from './pages/public/ContactPage';
import ReferralPage from './pages/public/ReferralPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import HIPAAPage from './pages/public/HIPAAPage';
import NonDiscriminationPage from './pages/public/NonDiscriminationPage';
import AccessibilityPage from './pages/public/AccessibilityPage';
import ClientSelfIntake from './pages/public/ClientSelfIntake';

const queryClient = new QueryClient();

// Build timestamp: 2025-12-04T10:00:00Z - forces cache bust

// Error Boundary to catch component errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
          <h2 className="text-xl font-bold text-red-800 mb-2">Component Error</h2>
          <p className="text-red-700 mb-4">Something went wrong loading this component.</p>
          <pre className="bg-red-100 p-4 rounded text-sm overflow-auto text-red-900">
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Determine portal type once at app load
const portalType = getPortalType();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              {/* ============================================= */}
              {/* ROOT ROUTE - Subdomain-aware                  */}
              {/* ============================================= */}
              {portalType === 'public' ? (
                // PUBLIC MARKETING WEBSITE (with shared layout)
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<PublicHomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/referral" element={<ReferralPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/hipaa" element={<HIPAAPage />} />
                  <Route path="/non-discrimination" element={<NonDiscriminationPage />} />
                  <Route path="/accessibility" element={<AccessibilityPage />} />
                  <Route path="/family" element={<FamilyPortal />} />
                  <Route path="/client-intake" element={<ClientSelfIntake />} />
                </Route>
              ) : (
                // ERP PORTAL (console/staff/caregiver subdomains)
                <Route path="/" element={<HomePage />} />
              )}

              {/* ============================================= */}
              {/* ERP / STAFF PORTAL (also accessible via path) */}
              {/* ============================================= */}
              <Route path="/erp" element={<HomePage />} />
              <Route path="/login" element={<HomePage />} />
              <Route path="/staff" element={<HomePage />} />

              {/* Global Search Results */}
              <Route path="/search" element={<DashboardLayout><SearchResultsPage /></DashboardLayout>} />

              {/* Alerts Route */}
              <Route
                path="/alerts"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">System Alerts</h1>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600">Critical alerts and notifications will appear here.</p>
                        <div className="mt-4 space-y-3">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 font-medium">No critical alerts at this time</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DashboardLayout>
                }
              />

              {/* Dashboard Routes - All protected by RBAC */}
              {/* Core Dashboard Routes - Using Command Centers for consolidated views */}
              <Route path="/dashboard/executive" element={<DashboardLayout><ProtectedRoute route="/dashboard/executive"><ExecutiveDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/hr" element={<DashboardLayout><ProtectedRoute route="/dashboard/hr"><TalentCommandCenter /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/tax" element={<DashboardLayout><ProtectedRoute route="/dashboard/tax"><WorkingTaxDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/operations" element={<DashboardLayout><ProtectedRoute route="/dashboard/operations"><OperationsCommandCenter /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/clinical" element={<DashboardLayout><ProtectedRoute route="/dashboard/clinical"><ClinicalCommandCenter /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/billing" element={<DashboardLayout><ProtectedRoute route="/dashboard/billing"><BillingARDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/compliance" element={<DashboardLayout><ProtectedRoute route="/dashboard/compliance"><ComplianceCommandCenter /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/training" element={<DashboardLayout><ProtectedRoute route="/dashboard/training"><WorkingTrainingDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/scheduling" element={<DashboardLayout><ProtectedRoute route="/dashboard/scheduling"><SchedulingCalendar /></ProtectedRoute></DashboardLayout>} />

              {/* Year 2 Enhanced Dashboard Routes - All protected by RBAC */}
              <Route path="/dashboard/executive-v2" element={<DashboardLayout><ProtectedRoute route="/dashboard/executive-v2"><ExecutiveOpportunityDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/dodd-hpc" element={<DashboardLayout><ProtectedRoute route="/dashboard/dodd-hpc"><DoddHpcDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/payroll-v2" element={<DashboardLayout><ProtectedRoute route="/dashboard/payroll-v2"><PayrollDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/consumer-directed" element={<DashboardLayout><ProtectedRoute route="/dashboard/consumer-directed"><ConsumerDirectedDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/scheduling-calendar" element={<DashboardLayout><ProtectedRoute route="/dashboard/scheduling-calendar"><SchedulingCalendar /></ProtectedRoute></DashboardLayout>} />
              {/* /dashboard/billing-ar redirects to /dashboard/billing - consolidated */}
              <Route path="/dashboard/billing-ar" element={<DashboardLayout><ProtectedRoute route="/dashboard/billing"><BillingARDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/background-checks" element={<DashboardLayout><ProtectedRoute route="/dashboard/background-checks"><BackgroundCheckDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/client-intake" element={<DashboardLayout><ProtectedRoute route="/dashboard/client-intake"><ClientIntakeWizard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/claims-workflow" element={<DashboardLayout><ProtectedRoute route="/dashboard/claims-workflow"><ClaimsWorkflow /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/licenses" element={<DashboardLayout><ProtectedRoute route="/dashboard/licenses"><LicenseManagement /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/credentials" element={<DashboardLayout><ProtectedRoute route="/dashboard/credentials"><CredentialExpiration /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/caregiver-bonuses" element={<DashboardLayout><ProtectedRoute route="/dashboard/caregiver-bonuses"><CaregiverBonusDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/dispatch" element={<DashboardLayout><ProtectedRoute route="/dashboard/dispatch"><CoverageDispatch /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/care-plans" element={<DashboardLayout><ProtectedRoute route="/dashboard/care-plans"><CarePlanEditor /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/sandata-evv" element={<DashboardLayout><ProtectedRoute route="/dashboard/sandata-evv"><SandataEVVDashboard /></ProtectedRoute></DashboardLayout>} />

              {/* New Clinical & Compliance Routes */}
              <Route path="/dashboard/supervisory-visits" element={<DashboardLayout><ProtectedRoute route="/dashboard/supervisory-visits"><SupervisoryVisitsDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/incidents" element={<DashboardLayout><ProtectedRoute route="/dashboard/incidents"><IncidentsDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/authorizations" element={<DashboardLayout><ProtectedRoute route="/dashboard/authorizations"><AuthorizationDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/denials" element={<DashboardLayout><ProtectedRoute route="/dashboard/denials"><DenialDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/lms" element={<DashboardLayout><ProtectedRoute route="/dashboard/lms"><LmsDashboard /></ProtectedRoute></DashboardLayout>} />

              {/* Caregiver Portal - Simplified field-focused portal for caregivers */}
              <Route path="/caregiver-portal" element={<DashboardLayout><ProtectedRoute route="/caregiver-portal"><CaregiverPortal /></ProtectedRoute></DashboardLayout>} />

              {/* Pod Lead Dashboard - Mini-COO view for pod management */}
              <Route path="/dashboard/pod-lead" element={<DashboardLayout><ProtectedRoute route="/dashboard/pod-lead"><PodLeadDashboard /></ProtectedRoute></DashboardLayout>} />

              {/* Admin Routes - Protected by RBAC */}
              <Route
                path="/dashboard/crm"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/crm">
                      <LeadPipeline />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/intake/new"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/client-intake">
                      <AssessmentWizard />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />

              {/* Profile Routes - Available to all authenticated users */}
              <Route
                path="/profile"
                element={<ProfilePage />}
              />
              <Route
                path="/profile/edit"
                element={<EditProfilePage />}
              />
              <Route
                path="/profile/password"
                element={<ChangePasswordPage />}
              />

              {/* Admin & Access Control Routes - Protected by RBAC */}
              <Route
                path="/admin/users"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/users">
                      <ComprehensiveUserManagement />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/users/:userId"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/users">
                      <UserDetailPage />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/pods"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/pods">
                      <PodManagement />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/pods/new"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/pods">
                      <CreatePodPage />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/pods/:podId"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/pods">
                      <PodDetailPage />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/subscriptions"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/subscriptions">
                      <SubscriptionsPage />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/subscriptions/:serviceId"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/subscriptions">
                      <SubscriptionDetailPage />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/roles">
                      <RolesPermissionsPage />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/intake-invitations"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/intake-invitations">
                      <IntakeInvitations />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/pods"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/pods">
                      <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Pod Management</h1>
                        <div className="bg-white rounded-lg shadow p-6">
                          <p className="text-gray-600 mb-4">Organize teams into care pods</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                              <h3 className="font-semibold text-blue-800 mb-2">Columbus Central Pod</h3>
                              <p className="text-sm text-gray-600 mb-2">Primary: Downtown Columbus</p>
                              <div className="text-xs text-gray-500">
                                <p>Lead: Pod Lead Test</p>
                                <p>Caregivers: 12</p>
                                <p>Active Patients: 45</p>
                              </div>
                            </div>
                            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                              <h3 className="font-semibold text-green-800 mb-2">Cleveland East Pod</h3>
                              <p className="text-sm text-gray-600 mb-2">Primary: East Cleveland</p>
                              <div className="text-xs text-gray-500">
                                <p>Lead: Sarah Davis</p>
                                <p>Caregivers: 8</p>
                                <p>Active Patients: 32</p>
                              </div>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                              <button className="text-gray-500 hover:text-gray-700">+ Create New Pod</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/audit">
                      <AuditLogs />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />

              {/* Partner Portal */}
              <Route path="/partners" element={<PartnerPortal />} />

              {/* Family Portal */}
              <Route path="/family-portal" element={<FamilyPortal />} />

              {/* Client Self-Service Intake (public link for clients to fill out) */}
              <Route path="/client-intake" element={<ClientSelfIntake />} />

              {/* EVV Routes */}
              <Route path="/evv-clock" element={<WebEVVClock />} />
              <Route path="/evv/clock" element={<DashboardLayout><WebEVVClock /></DashboardLayout>} />
              <Route
                path="/evv/*"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">EVV System</h1>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 mb-4">Electronic Visit Verification dashboard</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Link to="/evv/clock" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                            <h3 className="font-semibold text-blue-900">Clock In/Out</h3>
                            <p className="text-sm text-blue-700">Start or end your shift</p>
                          </Link>
                          <Link to="/dashboard/scheduling" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                            <h3 className="font-semibold text-green-900">Today's Visits</h3>
                            <p className="text-sm text-green-700">View scheduled visits</p>
                          </Link>
                          <Link to="/dashboard/operations" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                            <h3 className="font-semibold text-purple-900">History</h3>
                            <p className="text-sm text-purple-700">Past visit records</p>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </DashboardLayout>
                }
              />

              {/* Scheduling Routes */}
              <Route path="/scheduling/*" element={<DashboardLayout><SchedulingCalendar /></DashboardLayout>} />

              {/* Patient Routes */}
              <Route
                path="/patients"
                element={
                  <DashboardLayout>
                    <PatientList />
                  </DashboardLayout>
                }
              />
              <Route
                path="/patients/new"
                element={
                  <DashboardLayout>
                    <PatientIntakeWorkflow />
                  </DashboardLayout>
                }
              />
              <Route
                path="/patients/intake/:patientId"
                element={
                  <DashboardLayout>
                    <PatientIntakeWorkflow />
                  </DashboardLayout>
                }
              />
              {/* Patient Intake Step Pages */}
              <Route path="/patients/intake/new/demographics" element={<DemographicsPage />} />
              <Route path="/patients/intake/new/insurance" element={<InsurancePage />} />
              <Route path="/patients/intake/new/assessment" element={<AssessmentPage />} />
              <Route path="/patients/intake/new/physician-orders" element={<PhysicianOrdersPage />} />
              <Route path="/patients/intake/new/care-plan" element={<CarePlanPage />} />
              <Route path="/patients/intake/new/caregiver-assignment" element={<CaregiverAssignmentPage />} />
              <Route path="/patients/intake/new/service-authorization" element={<ServiceAuthorizationPage />} />
              <Route path="/patients/intake/new/first-visit" element={<FirstVisitPage />} />
              <Route path="/patients/intake/:patientId/demographics" element={<DemographicsPage />} />
              <Route path="/patients/intake/:patientId/insurance" element={<InsurancePage />} />
              <Route path="/patients/intake/:patientId/assessment" element={<AssessmentPage />} />
              <Route path="/patients/intake/:patientId/physician-orders" element={<PhysicianOrdersPage />} />
              <Route path="/patients/intake/:patientId/care-plan" element={<CarePlanPage />} />
              <Route path="/patients/intake/:patientId/caregiver-assignment" element={<CaregiverAssignmentPage />} />
              <Route path="/patients/intake/:patientId/service-authorization" element={<ServiceAuthorizationPage />} />
              <Route path="/patients/intake/:patientId/first-visit" element={<FirstVisitPage />} />
              {/* Patient Binder Print View */}
              <Route path="/patients/intake/new/binder" element={<PatientBinder />} />
              <Route path="/patients/intake/:patientId/binder" element={<PatientBinder />} />
              <Route
                path="/patients/:patientId"
                element={
                  <DashboardLayout>
                    <PatientDetail />
                  </DashboardLayout>
                }
              />

              {/* Billing Routes - Redirects to consolidated billing dashboard */}
              <Route
                path="/billing/*"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/billing">
                      <BillingARDashboard />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />


              {/* Finance Routes (Phase 11) - Protected by RBAC */}
              <Route
                path="/dashboard/finance/bank-accounts"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/finance/bank-accounts">
                      <BankAccounts />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/finance/reports"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/finance/reports">
                      <FinancialReports />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/finance/vendors"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/finance/vendors">
                      <VendorCenter />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/finance/expenses"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/finance/expenses">
                      <ExpensePortal />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/finance/bank-feeds"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/finance/bank-feeds">
                      <BankFeed />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/finance/payroll"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/finance/payroll">
                      <PayrollManager />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              {/* Payroll Provider Connection Routes */}
              <Route
                path="/payroll/connect/:provider"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/payroll/connect">
                      <PayrollConnect />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/settings/communications"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/settings/communications">
                      <CommunicationSettings />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/settings/email-accounts"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/settings/email-accounts">
                      <EmailAccountsManager />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />

              {/* HR Routes - redirect /hr/applications to the HR Dashboard */}
              <Route
                path="/hr/applications"
                element={<Navigate to="/dashboard/hr" replace />}
              />
              {/* Dashboard Onboarding redirect - search index links here */}
              <Route
                path="/dashboard/onboarding"
                element={<Navigate to="/dashboard/hr" replace />}
              />
              {/* Onboarding Route - must be before /hr/* wildcard */}
              <Route
                path="/hr/onboarding/:applicantId"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/dashboard/hr">
                      <ErrorBoundary fallback={<div>Error loading onboarding</div>}>
                        <OnboardingDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />

              {/* Staff Profile Route - must be before /hr/* wildcard */}
              <Route
                path="/hr/staff/:staffId"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/hr/staff">
                      <ErrorBoundary fallback={<div>Error loading staff profile</div>}>
                        <StaffProfile />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />

              {/* New Hire Self-Service Portal */}
              <Route
                path="/onboarding/my-tasks"
                element={
                  <NewHirePortal />
                }
              />

              <Route
                path="/hr/*"
                element={
                  <DashboardLayout>
                    <TalentCommandCenter />
                  </DashboardLayout>
                }
              />

              <Route
                path="/ai-assistant"
                element={
                  <DashboardLayout>
                    <AIAssistantPage />
                  </DashboardLayout>
                }
              />

              {/* Catch-all route */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-4">Page not found</p>
                      <Link
                        to="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Return Home
                      </Link>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;