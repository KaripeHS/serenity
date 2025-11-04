/**
 * Sandata Exception Display Component
 * Displays Ohio Alt-EVV submission errors and provides resolution workflow
 *
 * CRITICAL: This component is REQUIRED for Ohio Alt-EVV demo compliance
 *
 * Features:
 * - Displays Sandata rejection errors in user-friendly format
 * - Groups errors by severity (error vs warning)
 * - Provides field-level error highlighting
 * - Suggests fixes for common errors
 * - Allows office staff to correct and resubmit visits
 * - Tracks error history for compliance reporting
 *
 * Required by Ohio Alt-EVV Checklist 4/2024:
 * - Section 3.2: "System displays exceptions returned by Sandata"
 * - Section 3.3: "Staff can view, correct, and resubmit rejected visits"
 *
 * @module components/evv/SandataExceptionDisplay
 */

import { useState, useEffect } from 'react';
import { loggerService } from '../../shared/services/logger.service';

/**
 * Sandata validation error
 */
interface SandataError {
  errorCode: string;
  errorMessage: string;
  fieldName?: string;
  recordIndex?: number;
  severity: 'error' | 'warning';
}

/**
 * Sandata validation warning
 */
interface SandataWarning {
  warningCode: string;
  warningMessage: string;
  fieldName?: string;
  recordIndex?: number;
  severity: 'warning';
}

/**
 * Visit submission with errors
 */
interface RejectedVisit {
  id: string;
  visitOtherId: string;
  patientName: string;
  caregiverName: string;
  serviceDate: string;
  procedureCode: string;
  payer: string;
  payerProgram: string;
  errors: SandataError[];
  warnings: SandataWarning[];
  submittedAt: string;
  transactionId?: string;
  httpStatus?: number;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

/**
 * Component props
 */
interface SandataExceptionDisplayProps {
  /**
   * Array of rejected visits to display
   */
  rejectedVisits: RejectedVisit[];

  /**
   * Callback when user clicks to edit a visit
   */
  onEditVisit: (visitId: string) => void;

  /**
   * Callback when user clicks to retry submission
   */
  onRetrySubmission: (visitId: string) => void;

  /**
   * Callback when user dismisses a warning
   */
  onDismissWarning?: (visitId: string, warningCode: string) => void;

  /**
   * Show only high-priority errors (default: false)
   */
  highPriorityOnly?: boolean;
}

/**
 * Sandata Exception Display Component
 */
export function SandataExceptionDisplay({
  rejectedVisits,
  onEditVisit,
  onRetrySubmission,
  onDismissWarning,
  highPriorityOnly = false,
}: SandataExceptionDisplayProps) {
  const [selectedVisit, setSelectedVisit] = useState<RejectedVisit | null>(null);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');

  // Filter visits based on priority and filter type
  const filteredVisits = rejectedVisits.filter((visit) => {
    if (highPriorityOnly && visit.errors.length === 0) {
      return false;
    }

    if (filter === 'errors' && visit.errors.length === 0) {
      return false;
    }

    if (filter === 'warnings' && visit.warnings.length === 0) {
      return false;
    }

    return true;
  });

  // Group visits by error type for summary
  const errorSummary = filteredVisits.reduce(
    (acc, visit) => {
      acc.totalVisits++;
      acc.totalErrors += visit.errors.length;
      acc.totalWarnings += visit.warnings.length;

      visit.errors.forEach((error) => {
        acc.errorsByCode[error.errorCode] = (acc.errorsByCode[error.errorCode] || 0) + 1;
      });

      return acc;
    },
    {
      totalVisits: 0,
      totalErrors: 0,
      totalWarnings: 0,
      errorsByCode: {} as Record<string, number>,
    }
  );

  const toggleVisitExpanded = (visitId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  const getErrorIcon = (severity: 'error' | 'warning') => {
    if (severity === 'error') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  const getSuggestedFix = (errorCode: string): string | null => {
    // Map error codes to suggested fixes
    const fixSuggestions: Record<string, string> = {
      VAL_001: 'Check that all required fields are filled in. Missing fields are indicated below.',
      VAL_GPS: 'GPS coordinates are outside the allowed geofence. Verify the visit location or adjust geofence settings.',
      VAL_TIME: 'Clock in/out times are outside the tolerance window. Check scheduled vs actual times.',
      BUS_AUTH_MISSING: 'Add a valid authorization number for this service.',
      BUS_AUTH_EXCEEDED: 'This visit exceeds available authorization units. Check authorization limits.',
      BUS_SERVICE: 'Invalid payer/program/procedure combination. Verify Appendix G compliance.',
      BUS_IND_404: 'Patient not found in Sandata. Sync patient to Sandata before submitting visits.',
      BUS_EMP_404: 'Caregiver not found in Sandata. Sync staff member to Sandata before submitting visits.',
    };

    return fixSuggestions[errorCode] || null;
  };

  if (filteredVisits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-green-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exceptions to Display</h3>
        <p className="text-gray-600">
          All visits have been successfully submitted to Sandata. Great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sandata Exceptions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visits rejected by Sandata require correction and resubmission
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({rejectedVisits.length})
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'errors'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Errors ({rejectedVisits.filter((v) => v.errors.length > 0).length})
            </button>
            <button
              onClick={() => setFilter('warnings')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'warnings'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Warnings ({rejectedVisits.filter((v) => v.warnings.length > 0).length})
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm font-medium text-red-800">Total Errors</div>
            <div className="text-3xl font-bold text-red-900">{errorSummary.totalErrors}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-800">Total Warnings</div>
            <div className="text-3xl font-bold text-yellow-900">{errorSummary.totalWarnings}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-800">Affected Visits</div>
            <div className="text-3xl font-bold text-gray-900">{errorSummary.totalVisits}</div>
          </div>
        </div>

        {/* Top Errors */}
        {Object.keys(errorSummary.errorsByCode).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Most Common Errors</h3>
            <div className="space-y-1">
              {Object.entries(errorSummary.errorsByCode)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([code, count]) => (
                  <div key={code} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-mono">{code}</span>
                    <span className="text-gray-900 font-semibold">{count} occurrences</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejected Visits List */}
      <div className="space-y-4">
        {filteredVisits.map((visit) => {
          const isExpanded = expandedVisits.has(visit.id);

          return (
            <div key={visit.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Visit Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleVisitExpanded(visit.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {visit.patientName} - {visit.caregiverName}
                      </h3>
                      {visit.errors.length > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          {visit.errors.length} Error{visit.errors.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {visit.warnings.length > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          {visit.warnings.length} Warning{visit.warnings.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <span>Date: {visit.serviceDate}</span>
                      <span>Service: {visit.procedureCode}</span>
                      <span>Payer: {visit.payer} / {visit.payerProgram}</span>
                      <span>Retries: {visit.retryCount} / {visit.maxRetries}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {/* Errors */}
                  {visit.errors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Errors (Must Fix)</h4>
                      <div className="space-y-2">
                        {visit.errors.map((error, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              {getErrorIcon('error')}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs bg-red-200 text-red-900 px-2 py-0.5 rounded">
                                    {error.errorCode}
                                  </span>
                                  {error.fieldName && (
                                    <span className="text-xs text-red-700">
                                      Field: {error.fieldName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-red-900">{error.errorMessage}</p>
                                {getSuggestedFix(error.errorCode) && (
                                  <div className="mt-2 text-sm text-red-800 bg-red-100 rounded p-2">
                                    <strong>Suggested Fix:</strong> {getSuggestedFix(error.errorCode)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {visit.warnings.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Warnings (Optional Fix)
                      </h4>
                      <div className="space-y-2">
                        {visit.warnings.map((warning, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              {getErrorIcon('warning')}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded">
                                    {warning.warningCode}
                                  </span>
                                  {warning.fieldName && (
                                    <span className="text-xs text-yellow-700">
                                      Field: {warning.fieldName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-yellow-900">{warning.warningMessage}</p>
                              </div>
                              {onDismissWarning && (
                                <button
                                  onClick={() => onDismissWarning(visit.id, warning.warningCode)}
                                  className="text-xs text-yellow-700 hover:text-yellow-900"
                                >
                                  Dismiss
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Details */}
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Transaction Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Transaction ID:</span>{' '}
                        <span className="font-mono text-gray-900">{visit.transactionId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">HTTP Status:</span>{' '}
                        <span className="font-mono text-gray-900">{visit.httpStatus || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Submitted At:</span>{' '}
                        <span className="text-gray-900">{new Date(visit.submittedAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Visit ID:</span>{' '}
                        <span className="font-mono text-gray-900">{visit.visitOtherId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditVisit(visit.id)}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
                    >
                      Edit & Fix
                    </button>
                    {visit.canRetry && visit.retryCount < visit.maxRetries && (
                      <button
                        onClick={() => onRetrySubmission(visit.id)}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
                      >
                        Retry Submission ({visit.retryCount + 1}/{visit.maxRetries})
                      </button>
                    )}
                    {visit.retryCount >= visit.maxRetries && (
                      <div className="flex-1 bg-red-100 text-red-800 px-4 py-2 rounded-md text-center text-sm font-medium">
                        Max Retries Reached - Edit Required
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SandataExceptionDisplay;
