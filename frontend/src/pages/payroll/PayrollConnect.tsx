/**
 * Payroll Provider Connection Page
 * Handles OAuth flow and configuration for payroll providers (ADP, Gusto, Paychex, QuickBooks)
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const PROVIDER_CONFIG: Record<string, {
  name: string;
  logo: string;
  color: string;
  description: string;
  features: string[];
  setupUrl?: string;
  comingSoon?: boolean;
}> = {
  gusto: {
    name: 'Gusto',
    logo: '💚',
    color: 'bg-green-500',
    description: 'Modern payroll, benefits, and HR platform for small businesses.',
    features: [
      'Automated payroll processing',
      'Tax filing and compliance',
      'Employee self-service portal',
      'Benefits administration',
      'Time tracking integration'
    ],
    comingSoon: true
  },
  adp: {
    name: 'ADP',
    logo: '🔴',
    color: 'bg-red-500',
    description: 'Enterprise-grade payroll and HR management solutions.',
    features: [
      'Multi-state payroll processing',
      'Comprehensive tax compliance',
      'Advanced reporting and analytics',
      'HR management integration',
      'Time and attendance sync'
    ],
    comingSoon: true
  },
  paychex: {
    name: 'Paychex',
    logo: '🔵',
    color: 'bg-blue-500',
    description: 'Full-service payroll and HR solutions for businesses of all sizes.',
    features: [
      'Payroll processing and tax services',
      'Employee benefits administration',
      'HR administration tools',
      'Compliance assistance',
      'Mobile payroll access'
    ],
    comingSoon: true
  },
  quickbooks: {
    name: 'QuickBooks Payroll',
    logo: '🟢',
    color: 'bg-emerald-500',
    description: 'Integrated payroll solution for QuickBooks users.',
    features: [
      'Seamless QuickBooks integration',
      'Automatic tax calculations',
      'Direct deposit payments',
      'Same-day payroll option',
      'Employee self-onboarding'
    ],
    comingSoon: true
  }
};

export function PayrollConnect() {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();

  const config = provider ? PROVIDER_CONFIG[provider.toLowerCase()] : null;

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Provider Not Found</h2>
            <p className="text-gray-600 mb-6">
              The requested payroll provider is not available.
            </p>
            <Link
              to="/dashboard/payroll-v2"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Payroll Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/payroll-v2"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Payroll Dashboard
          </Link>
        </div>

        {/* Provider Card */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Header */}
          <div className={`${config.color} p-6`}>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{config.logo}</div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">Connect {config.name}</h1>
                <p className="opacity-90">{config.description}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {config.comingSoon ? (
              <>
                {/* Coming Soon Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">Integration Coming Soon</h3>
                      <p className="text-yellow-700 text-sm mt-1">
                        Direct integration with {config.name} is currently under development.
                        In the meantime, you can manually sync payroll data or contact support for assistance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Planned Features</h3>
                  <ul className="space-y-2">
                    {config.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-600">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => window.open(`https://www.${provider}.com`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Visit {config.name} Website
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/payroll-v2')}
                    className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Return to Payroll Dashboard
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* OAuth Connection Flow - for when integrations are ready */}
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-6">
                    Click the button below to securely connect your {config.name} account.
                  </p>
                  <button
                    onClick={() => {
                      // Future: Initiate OAuth flow
                      alert('OAuth integration not yet implemented');
                    }}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Connect {config.name} Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact <a href="mailto:support@serenitycarepartners.com" className="text-primary-600 hover:underline">support@serenitycarepartners.com</a></p>
        </div>
      </div>
    </div>
  );
}

export default PayrollConnect;
