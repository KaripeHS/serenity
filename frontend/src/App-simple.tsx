import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import WorkingHomePage from './components/WorkingHomePage';
import { WorkingExecutiveDashboard } from './components/dashboards/WorkingExecutiveDashboard';
import { WorkingHRDashboard } from './components/dashboards/WorkingHRDashboard';
import { WorkingOperationsDashboard } from './components/dashboards/WorkingOperationsDashboard';
import { WorkingClinicalDashboard } from './components/dashboards/WorkingClinicalDashboard';
import { WorkingBillingDashboard } from './components/dashboards/WorkingBillingDashboard';
import { WorkingComplianceDashboard } from './components/dashboards/WorkingComplianceDashboard';
import { WorkingSchedulingDashboard } from './components/dashboards/WorkingSchedulingDashboard';
import { WorkingTaxDashboard } from './components/dashboards/WorkingTaxDashboard';
import { WorkingTrainingDashboard } from './components/dashboards/WorkingTrainingDashboard';
import { WorkingFamilyPortal } from './components/family/WorkingFamilyPortal';
import { WorkingAIAssistant } from './components/ai/WorkingAIAssistant';
import { WorkingEVVClock } from './components/evv/WorkingEVVClock';
import { WorkingNewPatient } from './components/patients/WorkingNewPatient';
import { WorkingBillingProcess } from './components/billing/WorkingBillingProcess';
import { WorkingHRApplications } from './components/hr/WorkingHRApplications';
import { SuperAdminConsole } from './components/governance/SuperAdminConsole';

// Simple dashboard component for dashboard pages
// function _DashboardPage({ title }: { title: string }) {
//   return (
//     <div style={{
//       minHeight: '100vh',
//       backgroundColor: '#f9fafb',
//       padding: '2rem'
//     }}>
//       <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
//         <h1 style={{
//           fontSize: '2rem',
//           fontWeight: 'bold',
//           color: '#1f2937',
//           marginBottom: '1rem'
//         }}>
//           {title}
//         </h1>
//         <p style={{ color: '#6b7280' }}>This dashboard is under development.</p>
//         <a href="/" style={{
//           color: '#2563eb',
//           textDecoration: 'underline',
//           marginTop: '1rem',
//           display: 'inline-block'
//         }}>
//           ← Back to Home
//         </a>
//       </div>
//     </div>
//   );
// }

// Simple test homepage for debugging
function TestHomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#2563eb' }}>Loading...</h1>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#2563eb',
          marginBottom: '1rem'
        }}>
          Serenity ERP
        </h1>
        <p style={{ color: '#6b7280' }}>Home Health Management System</p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          Testing with AuthContext...
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#059669',
          marginTop: '1rem',
          fontWeight: 'bold'
        }}>
          ✅ {user ? `Logged in as: ${user.firstName} ${user.lastName} (${user.role})` : 'Auth loaded but no user'}
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Home Page */}
          <Route path="/" element={<WorkingHomePage />} />
          <Route path="/home" element={<WorkingHomePage />} />

          {/* Dashboard Pages */}
          <Route path="/dashboard/executive" element={<WorkingExecutiveDashboard />} />
          <Route path="/dashboard/hr" element={<WorkingHRDashboard />} />
          <Route path="/dashboard/tax" element={<WorkingTaxDashboard />} />
          <Route path="/dashboard/operations" element={<WorkingOperationsDashboard />} />
          <Route path="/dashboard/clinical" element={<WorkingClinicalDashboard />} />
          <Route path="/dashboard/billing" element={<WorkingBillingDashboard />} />
          <Route path="/dashboard/compliance" element={<WorkingComplianceDashboard />} />
          <Route path="/dashboard/training" element={<WorkingTrainingDashboard />} />

          {/* Other Pages */}
          <Route path="/scheduling/new" element={<WorkingSchedulingDashboard />} />
          <Route path="/evv/clock" element={<WorkingEVVClock />} />
          <Route path="/patients/new" element={<WorkingNewPatient />} />
          <Route path="/billing/process" element={<WorkingBillingProcess />} />
          <Route path="/hr/applications" element={<WorkingHRApplications />} />
          <Route path="/ai-assistant" element={<WorkingAIAssistant />} />
          <Route path="/family-portal" element={<WorkingFamilyPortal />} />

          {/* Governance & Administration */}
          <Route path="/admin/governance" element={<SuperAdminConsole />} />
          <Route path="/admin/pods" element={<SuperAdminConsole />} />
          <Route path="/super-admin" element={<SuperAdminConsole />} />

          {/* Test page for debugging */}
          <Route path="/test" element={<TestHomePage />} />

          {/* Catch-all route */}
          <Route path="*" element={<WorkingHomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;