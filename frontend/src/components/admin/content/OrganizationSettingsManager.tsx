/**
 * Organization Settings Manager
 * Manage global site settings and trust metrics
 */

import React, { useState, useEffect } from 'react';

interface OrganizationSettings {
  id?: string;
  primary_phone?: string;
  primary_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  business_hours?: Record<string, string>;
  patient_satisfaction_rate?: number;
  total_pods?: number;
  years_of_experience?: number;
  cities_served?: number;
  total_caregivers?: number;
  total_clients_served?: number;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
}

export const OrganizationSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<OrganizationSettings>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<OrganizationSettings>({
    primary_phone: '',
    primary_email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'OH',
    zip_code: '',
    business_hours: {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: 'Closed',
      sunday: 'Closed',
    },
    patient_satisfaction_rate: 95,
    total_pods: 3,
    years_of_experience: 8,
    cities_served: 3,
    total_caregivers: 45,
    total_clients_served: 200,
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    instagram_url: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      if (data.data) {
        setSettings(data.data);
        setFormData({ ...formData, ...data.data });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/content/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccess(true);
      await fetchSettings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Settings saved successfully!
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Organization Settings</h2>
        <p className="text-sm text-gray-600">Manage global site settings, contact info, and trust metrics</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone
              </label>
              <input
                type="tel"
                value={formData.primary_phone || ''}
                onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Email
              </label>
              <input
                type="email"
                value={formData.primary_email || ''}
                onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="info@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.address_line1 || ''}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line2 || ''}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Suite 100"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip_code || ''}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Trust Metrics & Statistics</h3>
          <p className="text-sm text-gray-600 mb-4">These metrics are displayed on the homepage as trust badges</p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Satisfaction Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.patient_satisfaction_rate || ''}
                onChange={(e) => setFormData({ ...formData, patient_satisfaction_rate: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Active Pods
              </label>
              <input
                type="number"
                min="0"
                value={formData.total_pods || ''}
                onChange={(e) => setFormData({ ...formData, total_pods: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={formData.years_of_experience || ''}
                onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cities Served
              </label>
              <input
                type="number"
                min="0"
                value={formData.cities_served || ''}
                onChange={(e) => setFormData({ ...formData, cities_served: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Caregivers
              </label>
              <input
                type="number"
                min="0"
                value={formData.total_caregivers || ''}
                onChange={(e) => setFormData({ ...formData, total_caregivers: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Clients Served
              </label>
              <input
                type="number"
                min="0"
                value={formData.total_clients_served || ''}
                onChange={(e) => setFormData({ ...formData, total_clients_served: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.facebook_url || ''}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedin_url || ''}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter URL
              </label>
              <input
                type="url"
                value={formData.twitter_url || ''}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.instagram_url || ''}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Legal Links</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Privacy Policy URL
              </label>
              <input
                type="url"
                value={formData.privacy_policy_url || ''}
                onChange={(e) => setFormData({ ...formData, privacy_policy_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/privacy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms of Service URL
              </label>
              <input
                type="url"
                value={formData.terms_of_service_url || ''}
                onChange={(e) => setFormData({ ...formData, terms_of_service_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/terms"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
