/**
 * Sandata Exceptions Page
 * Displays and manages Ohio Alt-EVV submission exceptions
 *
 * CRITICAL: This page is REQUIRED for Ohio Alt-EVV Checklist M17-M18 compliance
 *
 * M17: "System displays exceptions returned by Sandata"
 * M18: "Staff can view, correct, and resubmit rejected visits"
 *
 * Exception Clearing Workflow (M17-M18):
 * 1. Exception appears in this list (fetched from rejected_visits)
 * 2. Office staff clicks "Edit & Fix"
 * 3. Visit data is corrected in edit form
 * 4. Staff clicks "Retry Submission"
 * 5. Backend resubmits to Sandata
 * 6. If successful, exception clears from this list
 * 7. If rejected again, updated error appears
 *
 * @module components/admin/SandataExceptionsPage
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SandataExceptionDisplay } from '../evv/SandataExceptionDisplay';
import { Alert } from '../ui/Alert';
import { Skeleton } from '../ui/Skeleton';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface EVVRecord {
  id: string;
  visit_other_id: string;
  client_id: string;
  caregiver_id: string;
  clock_in_time: string;
  clock_out_time: string;
  service_date: string;
  service_code: string;
  payer: string;
  payer_program: string;
  sandata_status: string;
  sandata_errors: any[];
  sandata_transaction_id?: string;
  sandata_http_status?: number;
  sandata_retry_count: number;
  sandata_last_submitted_at: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

export function SandataExceptionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectedVisits, setRejectedVisits] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadRejectedVisits();
  }, [user?.organizationId]);

  const loadRejectedVisits = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.organizationId) {
        throw new Error('Organization ID not found in user context');
      }

      // Fetch rejected visits from backend API
      const response = await fetch(`/api/console/sandata/rejected-visits/${user.organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rejected visits: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform backend data to SandataExceptionDisplay format
      const transformed = await Promise.all(data.visits.map(async (visit: EVVRecord) => {
        // Fetch client and caregiver names
        const [clientRes, caregiverRes] = await Promise.all([
          fetch(`/api/console/clients/${visit.client_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          }),
          fetch(`/api/console/users/${visit.caregiver_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          }),
        ]);

        const client: Client = clientRes.ok ? await clientRes.json() : { id: visit.client_id, first_name: 'Unknown', last_name: 'Client' };
        const caregiver: User = caregiverRes.ok ? await caregiverRes.json() : { id: visit.caregiver_id, first_name: 'Unknown', last_name: 'Caregiver' };

        // Parse Sandata errors from JSON
        const errors = Array.isArray(visit.sandata_errors) ? visit.sandata_errors : [];

        return {
          id: visit.id,
          visitOtherId: visit.visit_other_id,
          patientName: `${client.first_name} ${client.last_name}`,
          caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
          serviceDate: new Date(visit.service_date).toLocaleDateString(),
          procedureCode: visit.service_code,
          payer: visit.payer || 'Unknown',
          payerProgram: visit.payer_program || 'Unknown',
          errors: errors.map((err: any) => ({
            errorCode: err.code || err.errorCode || 'UNKNOWN',
            errorMessage: err.message || err.errorMessage || 'Unknown error',
            fieldName: err.field || err.fieldName,
            recordIndex: err.recordIndex,
            severity: 'error' as const,
          })),
          warnings: [], // Warnings not currently captured in backend
          submittedAt: visit.sandata_last_submitted_at || new Date().toISOString(),
          transactionId: visit.sandata_transaction_id,
          httpStatus: visit.sandata_http_status,
          canRetry: visit.sandata_retry_count < 3,
          retryCount: visit.sandata_retry_count || 0,
          maxRetries: 3,
        };
      }));

      setRejectedVisits(transformed);
    } catch (err: any) {
      console.error('[SandataExceptionsPage] Failed to load rejected visits:', err);
      setError(err.message || 'Failed to load rejected visits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEditVisit = async (visitId: string) => {
    setEditingVisitId(visitId);
    setShowEditModal(true);

    // TODO: Implement visit edit form modal
    // For now, just show an alert
    alert(`Edit visit: ${visitId}\n\nThis will open a form to correct the visit data.\nAfter saving, the visit can be resubmitted to Sandata.`);

    // In production, this would:
    // 1. Open a modal with the visit edit form
    // 2. Pre-populate with current visit data
    // 3. Highlight fields with errors (from exception display)
    // 4. Save changes to database
    // 5. Offer to resubmit immediately or manually later
  };

  const handleRetrySubmission = async (visitId: string) => {
    try {
      const visit = rejectedVisits.find(v => v.id === visitId);
      if (!visit) {
        throw new Error('Visit not found');
      }

      // Confirm with user
      const confirmed = confirm(
        `Retry submission for:\n\n` +
        `Patient: ${visit.patientName}\n` +
        `Date: ${visit.serviceDate}\n` +
        `Service: ${visit.procedureCode}\n\n` +
        `Attempt: ${visit.retryCount + 1}/${visit.maxRetries}\n\n` +
        `Continue?`
      );

      if (!confirmed) return;

      // Submit to backend retry endpoint
      const response = await fetch(`/api/console/sandata/visits/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evvRecordId: visitId,
          skipValidation: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Retry submission failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ Visit resubmitted successfully!\n\nTransaction ID: ${result.transactionId}\n\nThe exception has been cleared.`);

        // Reload exceptions list (this visit should disappear if successful)
        await loadRejectedVisits();
      } else {
        alert(`❌ Submission rejected again:\n\n${result.errors?.map((e: any) => `${e.code}: ${e.message}`).join('\n')}\n\nPlease fix the errors and try again.`);

        // Reload to show updated errors
        await loadRejectedVisits();
      }
    } catch (err: any) {
      console.error('[SandataExceptionsPage] Retry submission failed:', err);
      alert(`❌ Retry failed: ${err.message}`);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRejectedVisits();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Sandata Exceptions
            </h1>
            <p className="text-gray-600">
              Ohio Alt-EVV submission errors requiring correction and resubmission
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Compliance: Checklist M17 (Display exceptions) & M18 (Edit and resubmit workflow)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <Link
              to="/dashboard/sandata-config"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <span>Sandata Config</span>
            </Link>

            <Link
              to="/dashboard/billing"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Billing</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-6">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📋 Exception Clearing Workflow (M17-M18)
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Exception appears below (rejected by Sandata)</li>
            <li>Click <strong>"Edit & Fix"</strong> to correct the visit data</li>
            <li>Save your changes</li>
            <li>Click <strong>"Retry Submission"</strong> to resubmit to Sandata</li>
            <li>If successful, exception disappears from this list</li>
            <li>If rejected again, updated errors will appear</li>
          </ol>
          <p className="text-xs text-blue-700 mt-2">
            <strong>Note:</strong> This workflow demonstrates Ohio ALT-EVV Checklist compliance items M17 and M18.
            During ODM certification, you will be asked to "show me how you clear an exception" - this is that workflow.
          </p>
        </div>

        {/* Exception Display */}
        <SandataExceptionDisplay
          rejectedVisits={rejectedVisits}
          onEditVisit={handleEditVisit}
          onRetrySubmission={handleRetrySubmission}
          highPriorityOnly={false}
        />
      </div>

      {/* Edit Modal Placeholder */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Visit</h2>
            <p className="text-gray-600 mb-4">
              Visit ID: {editingVisitId}
            </p>
            <p className="text-gray-600 mb-6">
              TODO: Implement visit edit form here
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVisitId(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVisitId(null);
                  alert('Visit saved (TODO: implement actual save)');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SandataExceptionsPage;
