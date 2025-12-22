import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
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

// Dashboard Components
import { WorkingExecutiveDashboard } from './components/dashboards/WorkingExecutiveDashboard';
import { AdminRoleManager } from './pages/admin/users/AdminRoleManager';
import { WorkingHRDashboard } from './components/dashboards/WorkingHRDashboard';
import { WorkingTaxDashboard } from './components/dashboards/WorkingTaxDashboard';
import { WorkingOperationsDashboard } from './components/dashboards/WorkingOperationsDashboard';
import { WorkingClinicalDashboard } from './components/dashboards/WorkingClinicalDashboard';
import { WorkingBillingDashboard } from './components/dashboards/WorkingBillingDashboard';
import { WorkingComplianceDashboard } from './components/dashboards/WorkingComplianceDashboard';
import { WorkingTrainingDashboard } from './components/dashboards/WorkingTrainingDashboard';
import { WorkingSchedulingDashboard } from './components/dashboards/WorkingSchedulingDashboard';

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

import BankAccounts from './pages/finance/BankAccounts';
import FinancialReports from './pages/finance/FinancialReports';
import { VendorCenter } from './pages/finance/VendorCenter';
import { ExpensePortal } from './pages/finance/ExpensePortal';
import { BankFeed } from './pages/finance/BankFeed';
import { PayrollManager } from './pages/admin/PayrollManager';
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

const queryClient = new QueryClient();

// Build timestamp: 2025-12-04T10:00:00Z - forces cache bust

// Determine portal type once at app load
const portalType = getPortalType();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              <Route path="/dashboard/executive" element={<DashboardLayout><ProtectedRoute route="/dashboard/executive"><WorkingExecutiveDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/hr" element={<DashboardLayout><ProtectedRoute route="/dashboard/hr"><WorkingHRDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/tax" element={<DashboardLayout><ProtectedRoute route="/dashboard/tax"><WorkingTaxDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/operations" element={<DashboardLayout><ProtectedRoute route="/dashboard/operations"><WorkingOperationsDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/clinical" element={<DashboardLayout><ProtectedRoute route="/dashboard/clinical"><WorkingClinicalDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/billing" element={<DashboardLayout><ProtectedRoute route="/dashboard/billing"><WorkingBillingDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/compliance" element={<DashboardLayout><ProtectedRoute route="/dashboard/compliance"><WorkingComplianceDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/training" element={<DashboardLayout><ProtectedRoute route="/dashboard/training"><WorkingTrainingDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/scheduling" element={<DashboardLayout><ProtectedRoute route="/dashboard/scheduling"><WorkingSchedulingDashboard /></ProtectedRoute></DashboardLayout>} />

              {/* Year 2 Enhanced Dashboard Routes - All protected by RBAC */}
              <Route path="/dashboard/executive-v2" element={<DashboardLayout><ProtectedRoute route="/dashboard/executive-v2"><ExecutiveOpportunityDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/dodd-hpc" element={<DashboardLayout><ProtectedRoute route="/dashboard/dodd-hpc"><DoddHpcDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/payroll-v2" element={<DashboardLayout><ProtectedRoute route="/dashboard/payroll-v2"><PayrollDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/consumer-directed" element={<DashboardLayout><ProtectedRoute route="/dashboard/consumer-directed"><ConsumerDirectedDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/scheduling-calendar" element={<DashboardLayout><ProtectedRoute route="/dashboard/scheduling-calendar"><SchedulingCalendar /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/billing-ar" element={<DashboardLayout><ProtectedRoute route="/dashboard/billing-ar"><BillingARDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/background-checks" element={<DashboardLayout><ProtectedRoute route="/dashboard/background-checks"><BackgroundCheckDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/client-intake" element={<DashboardLayout><ProtectedRoute route="/dashboard/client-intake"><ClientIntakeWizard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/claims-workflow" element={<DashboardLayout><ProtectedRoute route="/dashboard/claims-workflow"><ClaimsWorkflow /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/licenses" element={<DashboardLayout><ProtectedRoute route="/dashboard/licenses"><LicenseManagement /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/credentials" element={<DashboardLayout><ProtectedRoute route="/dashboard/credentials"><CredentialExpiration /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/caregiver-bonuses" element={<DashboardLayout><ProtectedRoute route="/dashboard/caregiver-bonuses"><CaregiverBonusDashboard /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/dispatch" element={<DashboardLayout><ProtectedRoute route="/dashboard/dispatch"><CoverageDispatch /></ProtectedRoute></DashboardLayout>} />
              <Route path="/dashboard/care-plans" element={<DashboardLayout><ProtectedRoute route="/dashboard/care-plans"><CarePlanEditor /></ProtectedRoute></DashboardLayout>} />

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

              {/* Admin & Access Control Routes - Protected by RBAC */}
              <Route
                path="/admin/users"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/users">
                      <AdminRoleManager />
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <DashboardLayout>
                    <ProtectedRoute route="/admin/roles">
                      <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Roles & Permissions</h1>
                        <div className="bg-white rounded-lg shadow p-6">
                          <p className="text-gray-600 mb-4">Configure role-based access control</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="border rounded-lg p-4">
                              <h3 className="font-semibold text-purple-600 mb-2">Founder</h3>
                              <p className="text-sm text-gray-500 mb-2">Full system access</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                <li>• All dashboards</li>
                                <li>• User management</li>
                                <li>• Financial data</li>
                                <li>• System configuration</li>
                              </ul>
                            </div>
                            <div className="border rounded-lg p-4">
                              <h3 className="font-semibold text-blue-600 mb-2">Pod Lead</h3>
                              <p className="text-sm text-gray-500 mb-2">Team management access</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Operations dashboard</li>
                                <li>• HR dashboard</li>
                                <li>• Clinical dashboard</li>
                                <li>• Scheduling</li>
                              </ul>
                            </div>
                            <div className="border rounded-lg p-4">
                              <h3 className="font-semibold text-green-600 mb-2">Caregiver</h3>
                              <p className="text-sm text-gray-500 mb-2">Field staff access</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                <li>• EVV clock in/out</li>
                                <li>• View schedule</li>
                                <li>• Patient info (assigned)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
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
                      <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
                        <div className="bg-white rounded-lg shadow p-6">
                          <p className="text-gray-600 mb-4">View system activity and access history</p>
                          <div className="space-y-3">
                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                              <p className="text-sm text-gray-900">User login: founder@serenitycarepartners.com</p>
                              <p className="text-xs text-gray-500">Today at 9:45 AM • IP: 192.168.1.1</p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4 py-2">
                              <p className="text-sm text-gray-900">Patient record viewed: John Smith</p>
                              <p className="text-xs text-gray-500">Today at 9:32 AM • User: maria.garcia@serenitycarepartners.com</p>
                            </div>
                            <div className="border-l-4 border-yellow-500 pl-4 py-2">
                              <p className="text-sm text-gray-900">Role modified: Pod Lead permissions updated</p>
                              <p className="text-xs text-gray-500">Yesterday at 4:15 PM • User: founder@serenitycarepartners.com</p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4 py-2">
                              <p className="text-sm text-gray-900">New user created: james.wilson@serenitycarepartners.com</p>
                              <p className="text-xs text-gray-500">Yesterday at 2:30 PM • User: founder@serenitycarepartners.com</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ProtectedRoute>
                  </DashboardLayout>
                }
              />

              {/* Partner Portal */}
              <Route path="/partners" element={<PartnerPortal />} />

              {/* Family Portal */}
              <Route path="/family-portal" element={<FamilyPortal />} />

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
              <Route path="/scheduling/*" element={<DashboardLayout><WorkingSchedulingDashboard /></DashboardLayout>} />

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
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">New Patient Intake</h1>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 mb-4">Start the patient intake process</p>
                        <Link to="/dashboard/intake/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Start Assessment Wizard
                        </Link>
                      </div>
                    </div>
                  </DashboardLayout>
                }
              />
              <Route
                path="/patients/:patientId"
                element={
                  <DashboardLayout>
                    <PatientDetail />
                  </DashboardLayout>
                }
              />

              {/* Billing Routes */}
              <Route
                path="/billing/process"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Process Claims</h1>
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <p className="text-emerald-800 font-medium">12 claims ready for submission</p>
                        </div>
                        <p className="text-gray-600 mb-4">Review and submit pending claims to payers</p>
                        <Link to="/dashboard/billing" className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                          Go to Billing Dashboard
                        </Link>
                      </div>
                    </div>
                  </DashboardLayout>
                }
              />
              <Route
                path="/billing/*"
                element={
                  <DashboardLayout>
                    <WorkingBillingDashboard />
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

              {/* HR Routes */}
              <Route
                path="/hr/applications"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Review Applications</h1>
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-orange-800 font-medium">8 applications pending review</p>
                        </div>
                        <p className="text-gray-600 mb-4">Review caregiver applications in the recruiting pipeline</p>
                        <Link to="/dashboard/hr" className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                          Go to HR Dashboard
                        </Link>
                      </div>
                    </div>
                  </DashboardLayout>
                }
              />
              <Route
                path="/hr/*"
                element={
                  <DashboardLayout>
                    <WorkingHRDashboard />
                  </DashboardLayout>
                }
              />

              <Route
                path="/ai-assistant"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-blue-900 mb-2">Serenity AI Companion</h2>
                        <p className="text-blue-800">Your intelligent assistant powered by GPT-5 is ready to help with:</p>
                        <ul className="mt-2 text-blue-700 list-disc list-inside">
                          <li>Scheduling questions and optimization</li>
                          <li>Policy clarification and compliance guidance</li>
                          <li>Patient care recommendations</li>
                          <li>System navigation and support</li>
                        </ul>
                        <div className="mt-4 p-3 bg-white rounded border">
                          <p className="text-sm text-gray-600 italic">
                            "Ask me anything about Serenity ERP - I'm here to help you work more efficiently!"
                          </p>
                        </div>
                      </div>
                    </div>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;