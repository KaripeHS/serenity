/**
 * Team Members Manager
 * Manage leadership and staff profiles
 */

import React, { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  full_name: string;
  title?: string;
  department?: string;
  bio?: string;
  quote?: string;
  photo_url?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  display_order: number;
  published: boolean;
  featured: boolean;
}

export const TeamMembersManager: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    title: '',
    department: '',
    bio: '',
    quote: '',
    photo_url: '',
    email: '',
    phone: '',
    linkedin_url: '',
    display_order: 0,
    published: true,
    featured: false,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/team-members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch team members');

      const data = await response.json();
      setMembers(data.data || []);
    } catch (err: any) {
      setError(err.message);
      // Mock data
      setMembers([
        {
          id: '1',
          full_name: 'Gloria Patterson',
          title: 'Co-Founder & CEO',
          bio: 'Passionate about transforming home care through the pod model.',
          photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
          display_order: 0,
          published: true,
          featured: true,
        },
        {
          id: '2',
          full_name: 'Bignon Davis',
          title: 'Co-Founder & COO',
          bio: 'Dedicated to operational excellence and caregiver success.',
          photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
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
      const url = editingMember
        ? `/api/admin/content/team-members/${editingMember.id}`
        : '/api/admin/content/team-members';

      const method = editingMember ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save team member');

      await fetchMembers();
      setShowForm(false);
      setEditingMember(null);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const response = await fetch(`/api/admin/content/team-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete team member');

      await fetchMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      title: '',
      department: '',
      bio: '',
      quote: '',
      photo_url: '',
      email: '',
      phone: '',
      linkedin_url: '',
      display_order: members.length,
      published: true,
      featured: false,
    });
  };

  const editMember = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      title: member.title || '',
      department: member.department || '',
      bio: member.bio || '',
      quote: member.quote || '',
      photo_url: member.photo_url || '',
      email: member.email || '',
      phone: member.phone || '',
      linkedin_url: member.linkedin_url || '',
      display_order: member.display_order,
      published: member.published,
      featured: member.featured,
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
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-sm text-gray-600">Manage your leadership and staff profiles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingMember(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            {member.photo_url && (
              <img
                src={member.photo_url}
                alt={member.full_name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{member.full_name}</h3>
                  {member.title && (
                    <p className="text-sm text-blue-600">{member.title}</p>
                  )}
                  {member.department && (
                    <p className="text-xs text-gray-500">{member.department}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => editMember(member)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {member.bio && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{member.bio}</p>
              )}

              <div className="flex gap-2 mt-3">
                {member.published ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                    ✓ Published
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                    Draft
                  </span>
                )}
                {member.featured && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {members.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No team members yet. Add your first team member!
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CEO, Director of Nursing"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Leadership, Clinical"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about this team member..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="A personal quote or motto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="text"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/..."
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
                      setEditingMember(null);
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
                    {loading ? 'Saving...' : editingMember ? 'Update' : 'Create'}
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
