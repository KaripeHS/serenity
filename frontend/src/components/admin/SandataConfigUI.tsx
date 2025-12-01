/**
 * Sandata Configuration UI
 * User-friendly interface for managing Ohio Alt-EVV / Sandata credentials and settings
 *
 * CRITICAL: This UI allows non-developers to manage Sandata integration config
 * without editing .env files or redeploying the application.
 *
 * Features:
 * - Manage Sandata credentials (Client ID, Client Secret)
 * - Configure Provider IDs (BusinessEntityID, ODME Provider ID)
 * - Toggle sandbox vs production mode
 * - Test connection to Sandata API
 * - View/edit business rules (geofence, rounding, etc.)
 * - Manage Appendix G data source
 *
 * @module components/admin/SandataConfigUI
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';

/**
 * Sandata configuration structure
 */
interface SandataConfig {
  // Connection settings
  sandataEnabled: boolean;
  environment: 'sandbox' | 'production';
  baseUrl: string;

  // Credentials (OAuth 2.0)
  oauthClientId: string;
  oauthClientSecret: string;

  // Provider IDs
  businessEntityId: string; // Sandata's ID for Serenity
  businessEntityMedicaidId: string; // 7-digit ODME Provider ID

  // Defaults
  defaultTimeZone: string;
  altEvvVersion: string;
  appendixGSource: 'database' | 'file';

  // Feature flags
  featureFlags: {
    submissionsEnabled: boolean;
    claimsGateEnabled: boolean;
    claimsGateMode: 'disabled' | 'warn' | 'strict';
    correctionsEnabled: boolean;
  };

  // Business rules
  businessRules: {
    geofenceRadiusMiles: number;
    clockInToleranceMinutes: number;
    roundingMinutes: number;
    roundingMode: 'nearest' | 'up' | 'down';
    maxRetryAttempts: number;
    retryDelaySeconds: number;
    requireAuthorizationMatch: boolean;
    blockOverAuthorization: boolean;
  };

  // Metadata
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

/**
 * Connection test result
 */
interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    baseUrl: string;
    authenticated: boolean;
    responseTime: number;
    sandataVersion?: string;
  };
}

/**
 * Sandata Config UI Component
 */
export function SandataConfigUI() {
  const [config, setConfig] = useState<SandataConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  /**
   * Load current Sandata configuration
   */
  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/sandata/config');
      if (!response.ok) {
        throw new Error('Failed to load Sandata configuration');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
      console.error('Failed to load Sandata config:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save configuration
   */
  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/sandata/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }

      const updated = await response.json();
      setConfig(updated);
      setSuccess('Configuration saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
      console.error('Failed to save Sandata config:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test Sandata connection
   */
  const testConnection = async () => {
    if (!config) return;

    try {
      setTesting(true);
      setError(null);
      setTestResult(null);

      const response = await fetch('/api/admin/sandata/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: config.environment,
          baseUrl: config.baseUrl,
          clientId: config.oauthClientId,
          clientSecret: config.oauthClientSecret,
        }),
      });

      const result: ConnectionTestResult = await response.json();
      setTestResult(result);

      if (!result.success) {
        setError(`Connection test failed: ${result.message}`);
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
      setTestResult({
        success: false,
        message: err.message || 'Network error',
      });
    } finally {
      setTesting(false);
    }
  };

  /**
   * Update config field
   */
  const updateField = (path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading Sandata configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <Alert variant="error">
        <div className="font-semibold">Failed to load configuration</div>
        <div className="text-sm mt-1">{error}</div>
        <Button onClick={loadConfig} className="mt-4">
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sandata Configuration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ohio Alt-EVV v{config.altEvvVersion} Integration Settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={testConnection}
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            {testing ? (
              <>
                <span className="animate-spin">⏳</span>
                Testing...
              </>
            ) : (
              <>
                🔌 Test Connection
              </>
            )}
          </Button>
          <Button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                💾 Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="error">
          <div className="font-semibold">❌ Error</div>
          <div className="text-sm mt-1">{error}</div>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <div className="font-semibold">✅ Success</div>
          <div className="text-sm mt-1">{success}</div>
        </Alert>
      )}

      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'error'}>
          <div className="font-semibold">
            {testResult.success ? '✅ Connection Successful' : '❌ Connection Failed'}
          </div>
          <div className="text-sm mt-1">{testResult.message}</div>
          {testResult.details && (
            <div className="text-xs mt-2 space-y-1">
              <div>Base URL: {testResult.details.baseUrl}</div>
              <div>Authenticated: {testResult.details.authenticated ? 'Yes' : 'No'}</div>
              <div>Response Time: {testResult.details.responseTime}ms</div>
              {testResult.details.sandataVersion && (
                <div>Sandata Version: {testResult.details.sandataVersion}</div>
              )}
            </div>
          )}
        </Alert>
      )}

      {/* Environment Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="environment"
                value="sandbox"
                checked={config.environment === 'sandbox'}
                onChange={(e) => updateField('environment', e.target.value)}
                className="w-4 h-4"
              />
              <span className="font-medium">🧪 Sandbox / UAT</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="environment"
                value="production"
                checked={config.environment === 'production'}
                onChange={(e) => updateField('environment', e.target.value)}
                className="w-4 h-4"
              />
              <span className="font-medium">🚀 Production</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <Input
              value={config.baseUrl}
              onChange={(e) => updateField('baseUrl', e.target.value)}
              placeholder="https://uat-api.sandata.com"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Sandbox: https://uat-api.sandata.com | Production: https://api.sandata.com
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.sandataEnabled}
                onChange={(e) => updateField('sandataEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable Sandata Integration</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.featureFlags.submissionsEnabled}
                onChange={(e) => updateField('featureFlags.submissionsEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable Submissions</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🔑 OAuth 2.0 Credentials</CardTitle>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSecrets ? '🙈 Hide Secrets' : '👁️ Show Secrets'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID <span className="text-red-600">*</span>
            </label>
            <Input
              type={showSecrets ? 'text' : 'password'}
              value={config.oauthClientId}
              onChange={(e) => updateField('oauthClientId', e.target.value)}
              placeholder="SERENITY_SANDBOX_CLIENT_ID"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provided by Sandata during onboarding
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret <span className="text-red-600">*</span>
            </label>
            <Input
              type={showSecrets ? 'text' : 'password'}
              value={config.oauthClientSecret}
              onChange={(e) => updateField('oauthClientSecret', e.target.value)}
              placeholder="••••••••••••••••"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Keep this secret secure - never share or log this value
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider IDs */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Provider Identifiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BusinessEntityID <span className="text-red-600">*</span>
            </label>
            <Input
              value={config.businessEntityId}
              onChange={(e) => updateField('businessEntityId', e.target.value)}
              placeholder="SERENITY_BE_PLACEHOLDER"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Sandata's unique ID for Serenity Care Partners (assigned during onboarding)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ODME Provider ID (BusinessEntityMedicaidIdentifier) <span className="text-red-600">*</span>
            </label>
            <Input
              value={config.businessEntityMedicaidId}
              onChange={(e) => updateField('businessEntityMedicaidId', e.target.value)}
              placeholder="1234567"
              maxLength={7}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              7-digit Ohio Department of Medicaid Enterprise Provider ID
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Rules */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Business Rules</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geofence Radius (miles)
            </label>
            <Input
              type="number"
              step="0.05"
              value={config.businessRules.geofenceRadiusMiles}
              onChange={(e) => updateField('businessRules.geofenceRadiusMiles', parseFloat(e.target.value))}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clock-In Tolerance (minutes)
            </label>
            <Input
              type="number"
              value={config.businessRules.clockInToleranceMinutes}
              onChange={(e) => updateField('businessRules.clockInToleranceMinutes', parseInt(e.target.value))}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rounding Minutes
            </label>
            <Select
              value={config.businessRules.roundingMinutes.toString()}
              onChange={(e) => updateField('businessRules.roundingMinutes', parseInt(e.target.value))}
              className="text-sm"
            >
              <option value="6">6 minutes (0.1 hour)</option>
              <option value="15">15 minutes (0.25 hour)</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rounding Mode
            </label>
            <Select
              value={config.businessRules.roundingMode}
              onChange={(e) => updateField('businessRules.roundingMode', e.target.value)}
              className="text-sm"
            >
              <option value="nearest">Nearest</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Retry Attempts
            </label>
            <Input
              type="number"
              value={config.businessRules.maxRetryAttempts}
              onChange={(e) => updateField('businessRules.maxRetryAttempts', parseInt(e.target.value))}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Delay (seconds)
            </label>
            <Input
              type="number"
              value={config.businessRules.retryDelaySeconds}
              onChange={(e) => updateField('businessRules.retryDelaySeconds', parseInt(e.target.value))}
              className="text-sm"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.businessRules.requireAuthorizationMatch}
                onChange={(e) => updateField('businessRules.requireAuthorizationMatch', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Require Authorization Match</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.businessRules.blockOverAuthorization}
                onChange={(e) => updateField('businessRules.blockOverAuthorization', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Block Over-Authorization</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appendix G Source
            </label>
            <Select
              value={config.appendixGSource}
              onChange={(e) => updateField('appendixGSource', e.target.value)}
              className="text-sm"
            >
              <option value="database">Database (Migration 023)</option>
              <option value="file">File (ohio-types.ts sample)</option>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Database source includes ~50 valid payer/program/procedure combinations
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Time Zone
            </label>
            <Select
              value={config.defaultTimeZone}
              onChange={(e) => updateField('defaultTimeZone', e.target.value)}
              className="text-sm"
            >
              <option value="America/New_York">America/New_York (Eastern)</option>
              <option value="America/Chicago">America/Chicago (Central)</option>
              <option value="America/Denver">America/Denver (Mountain)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Ohio uses Eastern Time (America/New_York)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      {config.lastUpdatedAt && (
        <div className="text-xs text-gray-500 text-center">
          Last updated {new Date(config.lastUpdatedAt).toLocaleString()}
          {config.lastUpdatedBy && ` by ${config.lastUpdatedBy}`}
        </div>
      )}
    </div>
  );
}

export default SandataConfigUI;
