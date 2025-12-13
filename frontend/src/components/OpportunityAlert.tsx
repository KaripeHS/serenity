/**
 * OpportunityAlert Component
 * Displays license opportunities and revenue potential alerts
 * Part of the License Enforcement System
 */

import React, { useState, useEffect } from 'react';
import { licenseService, RevenueOpportunity, LicenseType } from '../services/license.service';
import { loggerService } from '../shared/services/logger.service';

interface OpportunityAlertProps {
  showOnDashboard?: boolean;
  maxItems?: number;
  onDismiss?: () => void;
  variant?: 'banner' | 'card' | 'inline';
  filterPriority?: 'high' | 'medium' | 'low';
}

export const OpportunityAlert: React.FC<OpportunityAlertProps> = ({
  showOnDashboard = true,
  maxItems = 3,
  onDismiss,
  variant = 'card',
  filterPriority,
}) => {
  const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPotential, setTotalPotential] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, [filterPriority]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const dashboard = await licenseService.getOpportunityDashboard();
      let filteredOpps = dashboard.opportunities;

      if (filterPriority) {
        filteredOpps = filteredOpps.filter(o => o.priority === filterPriority);
      }

      // Filter out dismissed opportunities
      const storedDismissed = localStorage.getItem('dismissed_opportunities');
      const dismissedIds = storedDismissed ? JSON.parse(storedDismissed) : [];
      setDismissed(dismissedIds);

      filteredOpps = filteredOpps.filter(o => !dismissedIds.includes(o.id));

      setOpportunities(filteredOpps.slice(0, maxItems));
      setTotalPotential(dashboard.totalPotentialRevenue);
    } catch (error) {
      loggerService.error('Failed to load opportunities', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (oppId: string) => {
    const newDismissed = [...dismissed, oppId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_opportunities', JSON.stringify(newDismissed));
    setOpportunities(prev => prev.filter(o => o.id !== oppId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-32">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!showOnDashboard || opportunities.length === 0) {
    return null;
  }

  // Banner variant - shows as a top banner
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-lg mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="font-semibold text-lg">
                Unlock {formatCurrency(totalPotential)}/year in Additional Revenue
              </h3>
              <p className="text-emerald-100 text-sm">
                {opportunities.length} licensing opportunit{opportunities.length === 1 ? 'y' : 'ies'} available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/licenses"
              className="bg-white text-emerald-700 px-4 py-2 rounded-md font-medium hover:bg-emerald-50 transition-colors"
            >
              View Opportunities
            </a>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-emerald-200 hover:text-white p-2"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant - compact single line
  if (variant === 'inline') {
    const topOpp = opportunities[0];
    if (!topOpp) return null;

    return (
      <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        <span className="text-amber-600">💡</span>
        <span className="text-amber-800">
          <strong>{topOpp.title}</strong> - {topOpp.potentialRevenueRange}
        </span>
        <a
          href={topOpp.cta.link}
          className="text-amber-700 underline hover:text-amber-900 ml-2"
        >
          Learn more
        </a>
      </div>
    );
  }

  // Card variant (default) - full card display
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h3 className="font-semibold text-emerald-900">Revenue Opportunities</h3>
          </div>
          <span className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalPotential)}
            <span className="text-sm font-normal text-emerald-600">/year</span>
          </span>
        </div>
        <p className="text-sm text-emerald-700 mb-3">
          Based on your current Non-Medical Home Health license, here are opportunities to expand your services.
        </p>
      </div>

      {/* Individual Opportunities */}
      {opportunities.map((opp) => (
        <div
          key={opp.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(opp.priority)}`}>
                    {opp.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-xs text-gray-500">
                    {getEffortIcon(opp.effort)} {opp.effort} effort
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{opp.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{opp.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-700 font-semibold">
                    {opp.potentialRevenueRange}
                  </span>
                  <span className="text-gray-500">
                    {opp.timeToImplement}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(opp.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Dismiss opportunity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Expandable section */}
            {expanded === opp.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Steps to Unlock:</h5>
                <ul className="space-y-1 text-sm text-gray-600">
                  {opp.actionSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">✓</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4">
              <a
                href={opp.cta.link}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
              >
                {opp.cta.text}
              </a>
              <button
                onClick={() => setExpanded(expanded === opp.id ? null : opp.id)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                {expanded === opp.id ? 'Hide Details' : 'View Steps'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* View All Link */}
      {opportunities.length > 0 && (
        <div className="text-center">
          <a
            href="/admin/licenses"
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
          >
            View all licensing options →
          </a>
        </div>
      )}
    </div>
  );
};

/**
 * LicenseBlockedAlert - Shows when a user tries to access a blocked service
 */
interface LicenseBlockedAlertProps {
  serviceCode: string;
  serviceName: string;
  requiredLicense: LicenseType;
  onClose?: () => void;
}

export const LicenseBlockedAlert: React.FC<LicenseBlockedAlertProps> = ({
  serviceCode,
  serviceName,
  requiredLicense,
  onClose,
}) => {
  const licenseInfo = licenseService.getLicenseRequirements(requiredLicense);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔒</span>
            <h3 className="text-lg font-semibold text-gray-900">License Required</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>{serviceName}</strong> ({serviceCode}) requires the{' '}
            <strong>{licenseInfo.displayName}</strong> to provide this service.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-medium text-amber-800 mb-2">To unlock this service:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {licenseInfo.requirements.slice(0, 3).map((req, idx) => (
                <li key={idx}>• {req}</li>
              ))}
              {licenseInfo.requirements.length > 3 && (
                <li className="text-amber-600">+ {licenseInfo.requirements.length - 3} more steps</li>
              )}
            </ul>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Application Fee: ${licenseInfo.applicationFee}</span>
            <span>Timeline: ~{licenseInfo.estimatedTimelineDays} days</span>
          </div>

          <div className="flex gap-2">
            <a
              href={`/admin/licenses/apply?type=${requiredLicense}`}
              className="flex-1 text-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors"
            >
              Start Application
            </a>
            <a
              href={licenseInfo.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityAlert;
