import React, { useState, useEffect } from 'react';

interface JobRequisition {
  id: string;
  title: string;
  jobType: string;
  description: string;
  payRange: string;
  requirements: string[];
  location: string;
  status: 'draft' | 'active' | 'closed';
  postedAt: string;
  applicationsCount?: number;
}

interface JobFormData {
  title: string;
  jobType: string;
  description: string;
  payRange: string;
  requirements: string;
  location: string;
  status: 'draft' | 'active' | 'closed';
}

export const JobRequisitionsManager: React.FC = () => {
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobRequisition | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'closed'>('all');

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    jobType: 'full-time',
    description: '',
    payRange: '',
    requirements: '',
    location: 'Ohio',
    status: 'draft'
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:3000/api/admin/jobs');
      // const data = await response.json();

      // Mock data for development
      const mockJobs: JobRequisition[] = [
        {
          id: 'job-001',
          title: 'Home Health Aide (HHA)',
          jobType: 'full-time',
          description: 'Provide compassionate in-home care to clients in the Dayton area.',
          payRange: '$15-$18/hour + bonuses',
          requirements: ['HHA or STNA certification', '1+ years experience', 'Reliable transportation', 'CPR certified'],
          location: 'Dayton, OH',
          status: 'active',
          postedAt: '2024-11-01T10:00:00Z',
          applicationsCount: 12
        },
        {
          id: 'job-002',
          title: 'Licensed Practical Nurse (LPN)',
          jobType: 'full-time',
          description: 'Provide skilled nursing care to homebound patients.',
          payRange: '$22-$28/hour',
          requirements: ['Active LPN license in Ohio', '2+ years home health experience', 'Valid driver\'s license'],
          location: 'Columbus, OH',
          status: 'active',
          postedAt: '2024-10-28T14:00:00Z',
          applicationsCount: 5
        },
        {
          id: 'job-003',
          title: 'Registered Nurse (RN)',
          jobType: 'full-time',
          description: 'Lead nursing care and supervise care team.',
          payRange: '$30-$38/hour',
          requirements: ['Active RN license', '3+ years experience', 'Leadership experience preferred'],
          location: 'Cincinnati, OH',
          status: 'draft',
          postedAt: '2024-11-02T09:00:00Z',
          applicationsCount: 0
        },
        {
          id: 'job-004',
          title: 'Pod Lead',
          jobType: 'full-time',
          description: 'Manage pod operations and caregiver scheduling.',
          payRange: '$45,000-$55,000/year',
          requirements: ['Healthcare management experience', 'Strong leadership skills', 'Scheduling expertise'],
          location: 'Dayton, OH',
          status: 'closed',
          postedAt: '2024-10-15T10:00:00Z',
          applicationsCount: 8
        }
      ];

      setJobs(mockJobs);
    } catch (err) {
      setError('Failed to load job requisitions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      jobType: 'full-time',
      description: '',
      payRange: '',
      requirements: '',
      location: 'Ohio',
      status: 'draft'
    });
    setShowForm(true);
  };

  const handleEdit = (job: JobRequisition) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      jobType: job.jobType,
      description: job.description,
      payRange: job.payRange,
      requirements: job.requirements.join('\n'),
      location: job.location,
      status: job.status
    });
    setShowForm(true);
  };

  const handleFormChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim())
      };

      if (editingJob) {
        // Update existing job
        // await fetch(`http://localhost:3000/api/admin/jobs/${editingJob.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });

        // Mock update
        setJobs(prev => prev.map(job =>
          job.id === editingJob.id
            ? { ...job, ...payload, requirements: payload.requirements }
            : job
        ));
      } else {
        // Create new job
        // const response = await fetch('http://localhost:3000/api/admin/jobs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });

        // Mock create
        const newJob: JobRequisition = {
          id: `job-${Date.now()}`,
          ...payload,
          requirements: payload.requirements,
          postedAt: new Date().toISOString(),
          applicationsCount: 0
        };

        setJobs(prev => [newJob, ...prev]);
      }

      setShowForm(false);
      setEditingJob(null);
    } catch (err) {
      setError('Failed to save job requisition');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job requisition?')) return;

    setLoading(true);
    try {
      // await fetch(`http://localhost:3000/api/admin/jobs/${jobId}`, {
      //   method: 'DELETE'
      // });

      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err) {
      setError('Failed to delete job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (job: JobRequisition) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';

    setLoading(true);
    try {
      // await fetch(`http://localhost:3000/api/admin/jobs/${job.id}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });

      setJobs(prev => prev.map(j =>
        j.id === job.id ? { ...j, status: newStatus } : j
      ));
    } catch (err) {
      setError('Failed to update job status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = filterStatus === 'all'
    ? jobs
    : jobs.filter(job => job.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Active' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: '📝 Draft' },
      closed: { bg: 'bg-red-100', text: 'text-red-800', label: '🔒 Closed' }
    };

    const style = styles[status] || styles.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  if (showForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setShowForm(false)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Jobs
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingJob ? 'Edit Job Requisition' : 'Create New Job Requisition'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                  placeholder="e.g., Home Health Aide (HHA)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Job Type *</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => handleFormChange('jobType', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="per-diem">Per Diem</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Pay Range *</label>
                <input
                  type="text"
                  value={formData.payRange}
                  onChange={(e) => handleFormChange('payRange', e.target.value)}
                  required
                  placeholder="e.g., $15-$18/hour + bonuses"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  required
                  placeholder="e.g., Dayton, OH"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                required
                rows={4}
                placeholder="Describe the role, responsibilities, and what makes it great..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Requirements * (one per line)
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleFormChange('requirements', e.target.value)}
                required
                rows={6}
                placeholder="HHA or STNA certification&#10;1+ years experience&#10;Reliable transportation&#10;CPR certified"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">Enter each requirement on a new line</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value as 'draft' | 'active' | 'closed')}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft (not visible on public website)</option>
                <option value="active">Active (visible on public website)</option>
                <option value="closed">Closed (no longer accepting applications)</option>
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : (editingJob ? 'Update Job' : 'Create Job')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Job Requisitions</h1>
          <p className="text-gray-600 mt-1">Manage job postings and track applications</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Create New Job
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 border-b border-gray-200">
        {(['all', 'active', 'draft', 'closed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filterStatus === status
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${jobs.length})`}
            {status !== 'all' && ` (${jobs.filter(j => j.status === status).length})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && !jobs.length ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading job requisitions...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No {filterStatus !== 'all' && filterStatus} jobs found</p>
          <button
            onClick={handleCreateNew}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first job requisition →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {job.jobType} • {job.location} • {job.payRange}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(job)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  {job.status !== 'closed' && (
                    <button
                      onClick={() => handleToggleStatus(job)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {job.status === 'active' ? 'Close' : 'Activate'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{job.description}</p>

              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Requirements:</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  {job.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Posted {new Date(job.postedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-800">{job.applicationsCount || 0}</span>
                  <span className="text-gray-600"> application{job.applicationsCount !== 1 ? 's' : ''}</span>
                  {job.applicationsCount! > 0 && (
                    <button className="ml-3 text-blue-600 hover:text-blue-700 font-medium">
                      View Applications →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
