/**
 * Testimonials Manager
 * Manage customer testimonials and reviews
 */

import React, { useState, useEffect } from 'react';

interface Testimonial {
  id: string;
  quote: string;
  author_name: string;
  author_title?: string;
  author_location?: string;
  rating?: number;
  author_photo_url?: string;
  display_order: number;
  published: boolean;
  featured: boolean;
}

export const TestimonialsManager: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const [formData, setFormData] = useState({
    quote: '',
    author_name: '',
    author_title: '',
    author_location: '',
    rating: 5,
    author_photo_url: '',
    display_order: 0,
    published: true,
    featured: false,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/testimonials', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch testimonials');

      const data = await response.json();
      setTestimonials(data.data || []);
    } catch (err: any) {
      setError(err.message);
      // Mock data
      setTestimonials([
        {
          id: '1',
          quote: 'The pod-based care model has been life-changing for our family. Having the same caregivers who truly know mom makes all the difference.',
          author_name: 'Sarah Johnson',
          author_title: 'Family Member',
          author_location: 'Dayton, OH',
          rating: 5,
          display_order: 0,
          published: true,
          featured: true,
        },
        {
          id: '2',
          quote: 'Professional, compassionate, and reliable. I couldn\'t ask for better care for my father.',
          author_name: 'Michael Chen',
          author_title: 'Client Family',
          author_location: 'Columbus, OH',
          rating: 5,
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
      const url = editingTestimonial
        ? `/api/admin/content/testimonials/${editingTestimonial.id}`
        : '/api/admin/content/testimonials';

      const method = editingTestimonial ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save testimonial');

      await fetchTestimonials();
      setShowForm(false);
      setEditingTestimonial(null);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testimonialId: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch(`/api/admin/content/testimonials/${testimonialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete testimonial');

      await fetchTestimonials();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      quote: '',
      author_name: '',
      author_title: '',
      author_location: '',
      rating: 5,
      author_photo_url: '',
      display_order: testimonials.length,
      published: true,
      featured: false,
    });
  };

  const editTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      quote: testimonial.quote,
      author_name: testimonial.author_name,
      author_title: testimonial.author_title || '',
      author_location: testimonial.author_location || '',
      rating: testimonial.rating || 5,
      author_photo_url: testimonial.author_photo_url || '',
      display_order: testimonial.display_order,
      published: testimonial.published,
      featured: testimonial.featured,
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
          <h2 className="text-xl font-semibold">Testimonials</h2>
          <p className="text-sm text-gray-600">Manage customer reviews and feedback</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingTestimonial(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Testimonial
        </button>
      </div>

      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {testimonial.rating && (
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < testimonial.rating! ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                )}
                <blockquote className="text-gray-700 italic mb-3">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  {testimonial.author_photo_url && (
                    <img
                      src={testimonial.author_photo_url}
                      alt={testimonial.author_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.author_name}</p>
                    {testimonial.author_title && (
                      <p className="text-sm text-gray-600">{testimonial.author_title}</p>
                    )}
                    {testimonial.author_location && (
                      <p className="text-xs text-gray-500">{testimonial.author_location}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {testimonial.published ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                      ✓ Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                      Draft
                    </span>
                  )}
                  {testimonial.featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => editTestimonial(testimonial)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(testimonial.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {testimonials.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
            No testimonials yet. Add your first testimonial!
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Testimonial Quote *
                  </label>
                  <textarea
                    required
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the testimonial text..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author Title
                    </label>
                    <input
                      type="text"
                      value={formData.author_title}
                      onChange={(e) => setFormData({ ...formData, author_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Family Member, Client"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.author_location}
                      onChange={(e) => setFormData({ ...formData, author_location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Dayton, OH"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author Photo URL
                    </label>
                    <input
                      type="text"
                      value={formData.author_photo_url}
                      onChange={(e) => setFormData({ ...formData, author_photo_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
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
                      setEditingTestimonial(null);
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
                    {loading ? 'Saving...' : editingTestimonial ? 'Update' : 'Create'}
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
