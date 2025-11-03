/**
 * System Configuration Component
 * Admin interface for organization settings, integrations, and feature flags
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// Type Definitions
// ============================================================================

interface OrganizationConfig {
  id: string;
  name: string;
  legalName: string;
  npi: string;
  taxId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  settings: {
    businessHours: {
      start: string;
      end: string;
      daysOfWeek: number[];
    };
    evvSettings: {
      geofenceRadiusMeters: number;
      allowManualClockIn: boolean;
      requirePhotos: boolean;
      gracePeriodMinutes: number;
    };
    billingSettings: {
      defaultServiceCode: string;
      autoSubmitClaims: boolean;
      claimsSubmissionDay: number;
      requireAuthorizationForAll: boolean;
    };
    notificationSettings: {
      sendEmail: boolean;
      sendSms: boolean;
      sendPush: boolean;
    };
  };
}

interface Integration {
  enabled: boolean;
  environment?: string;
  lastSyncAt?: Date;
  syncStatus?: string;
  [key: string]: any;
}

interface Integrations {
  sandata: Integration;
  adp: Integration;
  gusto: Integration;
  sendgrid: Integration;
  twilio: Integration;
  openai: Integration;
}

interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage: number;
  description: string;
}

interface FeatureFlags {
  [key: string]: FeatureFlag;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: {
    before: any;
    after: any;
  };
  userName: string;
  ipAddress: string;
  createdAt: Date;
}

export function SystemConfiguration() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('organization');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<OrganizationConfig | null>(null);
  const [integrations, setIntegrations] = useState<Integrations | null>(null);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);

  // Check access
  const hasAccess = user?.role === 'admin' || user?.role === 'founder' || user?.permissions?.includes('system:admin');

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, integrationsRes, featuresRes, auditRes] = await Promise.all([
        fetch('/api/console/config'),
        fetch('/api/console/config/integrations'),
        fetch('/api/console/config/features'),
        fetch('/api/console/config/audit-log?limit=20')
      ]);

      setConfig(await configRes.json());
      setIntegrations(await integrationsRes.json());
      setFeatures(await featuresRes.json());
      const auditData = await auditRes.json();
      setAuditLog(auditData.items || auditData);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch('/api/console/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Organization settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save organization config:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleIntegration = async (integrationName: string, enabled: boolean) => {
    if (!integrations) return;

    try {
      const response = await fetch(`/api/console/config/integrations/${integrationName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, configuration: integrations[integrationName as keyof Integrations] })
      });

      if (response.ok) {
        setIntegrations({
          ...integrations,
          [integrationName]: { ...integrations[integrationName as keyof Integrations], enabled }
        });
      }
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const handleTestIntegration = async (integrationName: string) => {
    try {
      setTestingIntegration(integrationName);
      const response = await fetch(`/api/console/config/integrations/${integrationName}/test`, {
        method: 'POST'
      });

      const result = await response.json();
      alert(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (error) {
      console.error('Failed to test integration:', error);
      alert('Error testing integration');
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleToggleFeature = async (featureName: string, enabled: boolean) => {
    if (!features) return;

    try {
      const response = await fetch(`/api/console/config/features/${featureName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          rolloutPercentage: features[featureName].rolloutPercentage
        })
      });

      if (response.ok) {
        setFeatures({
          ...features,
          [featureName]: { ...features[featureName], enabled }
        });
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const handleUpdateRollout = async (featureName: string, percentage: number) => {
    if (!features) return;

    try {
      const response = await fetch(`/api/console/config/features/${featureName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: features[featureName].enabled,
          rolloutPercentage: percentage
        })
      });

      if (response.ok) {
        setFeatures({
          ...features,
          [featureName]: { ...features[featureName], rolloutPercentage: percentage }
        });
      }
    } catch (error) {
      console.error('Failed to update rollout:', error);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <h2 className="text-red-600 text-xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access system configuration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">System Configuration</h1>
          <p className="text-gray-600 text-lg">Manage organization settings, integrations, and features</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'organization', label: 'Organization' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'features', label: 'Feature Flags' },
              { id: 'audit', label: 'Audit Log' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Organization Settings */}
        {activeTab === 'organization' && config && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Organization Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name</label>
                <input
                  type="text"
                  value={config.legalName}
                  onChange={(e) => setConfig({ ...config, legalName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NPI Number</label>
                <input
                  type="text"
                  value={config.npi}
                  onChange={(e) => setConfig({ ...config, npi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID (EIN)</label>
                <input
                  type="text"
                  value={config.taxId}
                  onChange={(e) => setConfig({ ...config, taxId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={config.addressLine1}
                  onChange={(e) => setConfig({ ...config, addressLine1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={config.city}
                  onChange={(e) => setConfig({ ...config, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={config.state}
                  onChange={(e) => setConfig({ ...config, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  maxLength={2}
                />
              </div>
            </div>

            {/* EVV Settings */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">EVV Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geofence Radius (meters)
                  </label>
                  <input
                    type="number"
                    value={config.settings.evvSettings.geofenceRadiusMeters}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          evvSettings: {
                            ...config.settings.evvSettings,
                            geofenceRadiusMeters: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.settings.evvSettings.gracePeriodMinutes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          evvSettings: {
                            ...config.settings.evvSettings,
                            gracePeriodMinutes: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.settings.evvSettings.requirePhotos}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          evvSettings: {
                            ...config.settings.evvSettings,
                            requirePhotos: e.target.checked
                          }
                        }
                      })
                    }
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Require Photos</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={loadData}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrganization}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && integrations && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Integrations</h2>

            <div className="space-y-6">
              {Object.entries(integrations).map(([name, integration]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{name}</h3>
                      <p className="text-sm text-gray-600">
                        Status:{' '}
                        <span
                          className={
                            integration.enabled ? 'text-green-600 font-medium' : 'text-gray-400'
                          }
                        >
                          {integration.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                      {integration.lastSyncAt && (
                        <p className="text-xs text-gray-500">
                          Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestIntegration(name)}
                        disabled={!integration.enabled || testingIntegration === name}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {testingIntegration === name ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleToggleIntegration(name, !integration.enabled)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          integration.enabled
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {integration.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {integration.enabled && integration.environment && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Environment:</span>{' '}
                        <span className="font-medium">{integration.environment}</span>
                      </div>
                      {integration.syncStatus && (
                        <div>
                          <span className="text-gray-600">Sync Status:</span>{' '}
                          <span
                            className={`font-medium ${
                              integration.syncStatus === 'success'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {integration.syncStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Flags */}
        {activeTab === 'features' && features && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Flags</h2>

            <div className="space-y-4">
              {Object.entries(features).map(([name, feature]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                      {feature.enabled && (
                        <div className="mt-2">
                          <label className="text-xs text-gray-600">
                            Rollout: {feature.rolloutPercentage}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={feature.rolloutPercentage}
                            onChange={(e) => handleUpdateRollout(name, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleFeature(name, !feature.enabled)}
                      className={`ml-4 px-4 py-2 rounded-lg text-sm ${
                        feature.enabled
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {feature.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration Audit Log</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.resourceType}/{entry.resourceId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-md">
                          <pre className="text-xs bg-gray-50 p-2 rounded">
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
