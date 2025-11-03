/**
 * Main App Component for Serenity ERP
 * Handles routing and global application state
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import HomePage from './pages/HomePage';
import { WorkingExecutiveDashboard } from './components/dashboards/WorkingExecutiveDashboard';
import { WorkingHRDashboard } from './components/dashboards/WorkingHRDashboard';
import { WorkingTaxDashboard } from './components/dashboards/WorkingTaxDashboard';
import { WorkingClinicalDashboard } from './components/dashboards/WorkingClinicalDashboard';
import { WorkingSchedulingDashboard } from './components/dashboards/WorkingSchedulingDashboard';
import { WorkingBillingDashboard } from './components/dashboards/WorkingBillingDashboard';
import { WorkingComplianceDashboard } from './components/dashboards/WorkingComplianceDashboard';
import { WorkingFamilyPortal } from './components/family/WorkingFamilyPortal';
import { MorningCheckIn } from './components/operations/MorningCheckIn';
import { WebEVVClock } from './components/evv/WebEVVClock';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Styles
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Home Page */}
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />

              {/* Dashboard Routes with Layout */}
              <Route
                path="/dashboard/*"
                element={
                  <DashboardLayout>
                    <Routes>
                      <Route path="executive" element={<WorkingExecutiveDashboard />} />
                      <Route path="hr" element={<WorkingHRDashboard />} />
                      <Route path="tax" element={<WorkingTaxDashboard />} />
                      <Route path="operations" element={<WorkingSchedulingDashboard />} />
                      <Route path="clinical" element={<WorkingClinicalDashboard />} />
                      <Route path="billing" element={<WorkingBillingDashboard />} />
                      <Route path="compliance" element={<WorkingComplianceDashboard />} />
                      <Route path="training" element={<div className="p-6"><h1 className="text-2xl font-bold">Training Dashboard</h1><p>Coming soon...</p></div>} />
                      <Route path="morning-check-in" element={<MorningCheckIn />} />

                      {/* Legacy dashboard routes */}
                      <Route path="legacy/executive" element={<WorkingExecutiveDashboard />} />
                      <Route path="legacy/caregiver" element={<WorkingClinicalDashboard />} />
                    </Routes>
                  </DashboardLayout>
                }
              />

              {/* Standalone Routes */}
              <Route path="/family-portal" element={<WorkingFamilyPortal />} />
              <Route path="/evv-clock" element={<WebEVVClock />} />

              {/* Feature Routes */}
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