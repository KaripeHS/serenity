import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/layouts/DashboardLayout';
import { LeadPipeline } from './pages/admin/crm/LeadPipeline';
import { AssessmentWizard } from './pages/admin/intake/AssessmentWizard';
import { PartnerPortal } from './pages/partners/PartnerPortal';
import { FamilyPortal } from './pages/family/FamilyPortal';
import { WebEVVClock } from './components/evv/WebEVVClock';
import HomePage from './pages/HomePage';

// Public Marketing Pages (ported from public-site)
import { PublicLayout } from './components/marketing';
import PublicHomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesPage from './pages/public/ServicesPage';
import CareersPage from './pages/public/CareersPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import HIPAAPage from './pages/public/HIPAAPage';

const queryClient = new QueryClient();

// Build timestamp: 2025-12-03T08:25:00Z - forces cache bust


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              {/* ============================================= */}
              {/* PUBLIC MARKETING WEBSITE (with shared layout) */}
              {/* ============================================= */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<PublicHomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/hipaa" element={<HIPAAPage />} />
              </Route>

              {/* ============================================= */}
              {/* ERP / STAFF PORTAL                           */}
              {/* ============================================= */}
              <Route path="/erp" element={<HomePage />} />
              <Route path="/login" element={<HomePage />} />
              <Route path="/staff" element={<HomePage />} />

              {/* Admin Routes */}
              <Route
                path="/dashboard/crm"
                element={
                  <DashboardLayout>
                    <LeadPipeline />
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/intake/new"
                element={
                  <DashboardLayout>
                    <AssessmentWizard />
                  </DashboardLayout>
                }
              />

              {/* Partner Portal */}
              <Route path="/partners" element={<PartnerPortal />} />

              {/* Family Portal */}
              <Route path="/family-portal" element={<FamilyPortal />} />

              {/* EVV Clock */}
              <Route path="/evv-clock" element={<WebEVVClock />} />

              {/* Feature Placeholders */}
              <Route
                path="/scheduling/*"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Scheduling System</h1>
                      <p>AI-powered scheduling interface coming soon...</p>
                    </div>
                  </DashboardLayout>
                }
              />

              <Route
                path="/evv/*"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">EVV System</h1>
                      <p>Electronic Visit Verification interface coming soon...</p>
                    </div>
                  </DashboardLayout>
                }
              />

              <Route
                path="/patients/*"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Patient Management</h1>
                      <p>Patient management interface coming soon...</p>
                    </div>
                  </DashboardLayout>
                }
              />

              <Route
                path="/hr/*"
                element={
                  <DashboardLayout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">HR Management</h1>
                      <p>HR management interface coming soon...</p>
                    </div>
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
                      <a
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Return Home
                      </a>
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