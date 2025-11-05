/**
 * Services Manager
 * Manage care services offered
 */

import React, { useState, useEffect } from 'react';

interface Service {
  id: string;
  service_name: string;
  service_slug: string;
  short_description?: string;
  full_description?: string;
  icon_name?: string;
  image_url?: string;
  features: string[];
  starting_price?: number;
  price_description?: string;
  display_order: number;
  published: boolean;
  featured: boolean;
}

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    service_name: '',
    service_slug: '',
    short_description: '',
    full_description: '',
    icon_name: '',
    image_url: '',
    features: [] as string[],
    featuresText: '', // For textarea input
    starting_price: '',
    price_description: '',
    display_order: 0,
    published: true,
    featured: false,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch services');

      const data = await response.json();
      setServices(data.data || []);
    } catch (err: any) {
      setError(err.message);
      // Mock data
      setServices([
        {
          id: '1',
          service_name: 'Personal Care',
          service_slug: 'personal-care',
          short_description: 'Assistance with daily living activities',
          features: ['Bathing', 'Dressing', 'Meal preparation', 'Medication reminders'],
          display_order: 0,
          published: true,
          featured: true,
        },
        {
          id: '2',
          service_name: 'Skilled Nursing',
          service_slug: 'skilled-nursing',
          short_description: 'Professional nursing care in the comfort of home',
          features: ['Wound care', 'IV therapy', 'Medication administration', 'Health monitoring'],
          display_order: 1,
          published: true,
          featured: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert features text to array
      const features = formData.featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const url = editingService
        ? `/api/admin/content/services/${editingService.id}`
        : '/api/admin/content/services';

      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...formData,
          features,
          starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save service');

      await fetchServices();
      setShowForm(false);
      setEditingService(null);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/content/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete service');

      await fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      service_slug: '',
      short_description: '',
      full_description: '',
      icon_name: '',
      image_url: '',
      features: [],
      featuresText: '',
      starting_price: '',
      price_description: '',
      display_order: services.length,
      published: true,
      featured: false,
    });
  };

  const editService = (service: Service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      service_slug: service.service_slug,
      short_description: service.short_description || '',
      full_description: service.full_description || '',
      icon_name: service.icon_name || '',
      image_url: service.image_url || '',
      features: service.features,
      featuresText: service.features.join('\n'),
      starting_price: service.starting_price?.toString() || '',
      price_description: service.price_description || '',
      display_order: service.display_order,
      published: service.published,
      featured: service.featured,
    });
    setShowForm(true);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Services</h2>
          <p className="text-sm text-gray-600">Manage care services offered to clients</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingService(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{service.service_name}</h3>
                <p className="text-sm text-gray-500">/{service.service_slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editService(service)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>

            {service.short_description && (
              <p className="text-gray-600 mb-3">{service.short_description}</p>
            )}

            {service.features && service.features.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Features:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {service.features.slice(0, 3).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                  {service.features.length > 3 && (
                    <li className="text-gray-400">+{service.features.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              {service.published ? (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                  ✓ Published
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  Draft
                </span>
              )}
              {service.featured && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                  ⭐ Featured
                </span>
              )}
            </div>
          </div>
        ))}

        {services.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
            No services yet. Add your first service!
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.service_name}
                      onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.service_slug}
                      onChange={(e) => setFormData({ ...formData, service_slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., personal-care"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description (1-2 sentences)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Description
                  </label>
                  <textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description of the service..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features (one per line)
                  </label>
                  <textarea
                    value={formData.featuresText}
                    onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Bathing assistance&#10;Medication reminders&#10;Meal preparation"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon Name
                    </label>
                    <input
                      type="text"
                      value={formData.icon_name}
                      onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="heart, medical"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.starting_price}
                      onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Description
                    </label>
                    <input
                      type="text"
                      value={formData.price_description}
                      onChange={(e) => setFormData({ ...formData, price_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Starting at $25/hour"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="published" className="ml-2 text-sm text-gray-700">
                      Published
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                      Featured (show on homepage)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingService(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : editingService ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
