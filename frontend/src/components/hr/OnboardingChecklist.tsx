import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  step: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  completedAt: string | null;
  completedBy: string | null;
  notes: string;
  required: boolean;
  order: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string;
  position: string;
  pod: string;
}

interface OnboardingChecklistProps {
  employeeId: string;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ employeeId }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchOnboardingData();
  }, [employeeId]);

  const fetchOnboardingData = async () => {
    setLoading(true);
    try {
      // Try backend API first
      const response = await fetch(`http://localhost:3000/api/console/hr/onboarding/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployee(data.employee);
        setChecklist(data.checklist);
        setLoading(false);
        return;
      }

      // Fall back to mock data if API fails
      console.log('Backend API not available, using mock data');

      // Mock employee data
      const mockEmployee: Employee = {
        id: employeeId,
        firstName: 'Lisa',
        lastName: 'Martinez',
        email: 'lmartinez@serenitycarepartners.com',
        hireDate: '2024-11-15',
        position: 'Home Health Aide (HHA)',
        pod: 'Pod-1 (Dayton)'
      };

      // Mock checklist items
      const mockChecklist: ChecklistItem[] = [
        {
          id: 'check-001',
          step: 'I-9 Verification',
          description: 'Complete Form I-9 and verify work authorization documents',
          status: 'completed',
          completedAt: '2024-11-15T10:00:00Z',
          completedBy: 'Gloria Martinez',
          notes: 'Driver license and Social Security card verified',
          required: true,
          order: 1
        },
        {
          id: 'check-002',
          step: 'W-4 Tax Form',
          description: 'Complete federal and state tax withholding forms',
          status: 'completed',
          completedAt: '2024-11-15T10:15:00Z',
          completedBy: 'Gloria Martinez',
          notes: 'Forms submitted to payroll',
          required: true,
          order: 2
        },
        {
          id: 'check-003',
          step: 'Background Check',
          description: 'Complete criminal background check and reference verification',
          status: 'completed',
          completedAt: '2024-11-10T14:00:00Z',
          completedBy: 'System',
          notes: 'Background check cleared - no issues found',
          required: true,
          order: 3
        },
        {
          id: 'check-004',
          step: 'TB Test',
          description: 'Complete tuberculosis skin test or chest X-ray',
          status: 'in_progress',
          completedAt: null,
          completedBy: null,
          notes: 'TB test scheduled for 11/16',
          required: true,
          order: 4
        },
        {
          id: 'check-005',
          step: 'CPR Certification',
          description: 'Upload current CPR certification or schedule training',
          status: 'completed',
          completedAt: '2024-11-15T11:00:00Z',
          completedBy: 'Lisa Martinez',
          notes: 'CPR cert expires 06/2025',
          required: true,
          order: 5
        },
        {
          id: 'check-006',
          step: 'HHA/STNA License',
          description: 'Upload and verify active HHA or STNA certification',
          status: 'completed',
          completedAt: '2024-11-15T11:05:00Z',
          completedBy: 'Lisa Martinez',
          notes: 'HHA license verified - expires 12/2025',
          required: true,
          order: 6
        },
        {
          id: 'check-007',
          step: 'Policy Acknowledgments',
          description: 'Review and sign HIPAA, Code of Conduct, and company policies',
          status: 'pending',
          completedAt: null,
          completedBy: null,
          notes: 'Policy packet sent via email',
          required: true,
          order: 7
        },
        {
          id: 'check-008',
          step: 'Direct Deposit Setup',
          description: 'Submit bank account information for payroll',
          status: 'pending',
          completedAt: null,
          completedBy: null,
          notes: '',
          required: true,
          order: 8
        },
        {
          id: 'check-009',
          step: 'Uniform/Badge',
          description: 'Issue company uniform and employee badge',
          status: 'pending',
          completedAt: null,
          completedBy: null,
          notes: '',
          required: true,
          order: 9
        },
        {
          id: 'check-010',
          step: 'Mobile App Setup',
          description: 'Install and configure EVV mobile app with credentials',
          status: 'pending',
          completedAt: null,
          completedBy: null,
          notes: '',
          required: true,
          order: 10
        },
        {
          id: 'check-011',
          step: 'Orientation Training',
          description: 'Complete new hire orientation and company overview',
          status: 'pending',
          completedAt: null,
          completedBy: null,
          notes: 'Scheduled for 11/18 9:00 AM',
          required: true,
          order: 11
        },
        {
          id: 'check-012',
          step: 'Pod Introduction',
          description: 'Meet Pod Lead and shadow experienced caregiver',
          status: 'pending',
          completedAt: null,
          completedBy: null,
          notes: '',
          required: true,
          order: 12
        }
      ];

      setEmployee(mockEmployee);
      setChecklist(mockChecklist);
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: ChecklistItem['status']) => {
    try {
      // Call backend API
      const response = await fetch(`http://localhost:3000/api/console/hr/onboarding/${employeeId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        // Update with backend response
        setChecklist(prev => prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                status: newStatus,
                completedAt: data.completedAt || (newStatus === 'completed' ? new Date().toISOString() : item.completedAt),
                completedBy: data.completedBy || (newStatus === 'completed' ? 'Current User' : item.completedBy)
              }
            : item
        ));
      } else {
        // Fallback to local update if API fails
        setChecklist(prev => prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : item.completedAt,
                completedBy: newStatus === 'completed' ? 'Current User' : item.completedBy
              }
            : item
        ));
      }
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      // Fallback to local update on error
      setChecklist(prev => prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : item.completedAt,
              completedBy: newStatus === 'completed' ? 'Current User' : item.completedBy
            }
          : item
      ));
    }
  };

  const handleAddNote = async (itemId: string) => {
    const note = prompt('Add note:');
    if (note) {
      try {
        // Call backend API
        const response = await fetch(`http://localhost:3000/api/console/hr/onboarding/${employeeId}/items/${itemId}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({ notes: note })
        });

        // Update checklist regardless of API response
        setChecklist(prev => prev.map(item =>
          item.id === itemId ? { ...item, notes: note } : item
        ));
      } catch (error) {
        console.error('Failed to save note:', error);
        // Still update locally
        setChecklist(prev => prev.map(item =>
          item.id === itemId ? { ...item, notes: note } : item
        ));
      }
    }
  };

  const filteredChecklist = checklist.filter(item => {
    if (filter === 'pending') return item.status === 'pending' || item.status === 'in_progress';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const stats = {
    total: checklist.length,
    completed: checklist.filter(i => i.status === 'completed').length,
    pending: checklist.filter(i => i.status === 'pending' || i.status === 'in_progress').length,
    percentComplete: Math.round((checklist.filter(i => i.status === 'completed').length / checklist.length) * 100)
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      not_applicable: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '—' }
    };

    const style = styles[status] || styles.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon} {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6 text-center">Loading onboarding checklist...</div>;
  }

  if (!employee) {
    return <div className="p-6 text-center text-red-600">Employee not found</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Employee Info Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-blue-100 text-lg">{employee.position}</p>
            <p className="text-blue-200 text-sm mt-1">
              {employee.pod} • Hire Date: {new Date(employee.hireDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.percentComplete}%</div>
            <div className="text-blue-100 text-sm">Complete</div>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-medium">Total Steps</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-medium">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm font-medium">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Onboarding Progress</span>
          <span>{stats.completed} of {stats.total} steps complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${stats.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 border-b border-gray-200">
        {(['all', 'pending', 'completed'] as const).map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === filterOption
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            {filterOption === 'all' && ` (${stats.total})`}
            {filterOption === 'pending' && ` (${stats.pending})`}
            {filterOption === 'completed' && ` (${stats.completed})`}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {filteredChecklist.map((item, index) => (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow p-5 ${
              item.status === 'completed' ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700">
                  {item.order}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-800">{item.step}</h3>
                    {item.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  {item.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <strong>Note:</strong> {item.notes}
                    </div>
                  )}
                  {item.completedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Completed {new Date(item.completedAt).toLocaleString()} by {item.completedBy}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 ml-4">
                {getStatusBadge(item.status)}
                <div className="flex space-x-2">
                  {item.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'completed')}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  {item.status === 'completed' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'pending')}
                      className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      Undo
                    </button>
                  )}
                  <button
                    onClick={() => handleAddNote(item.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Alert */}
      {stats.percentComplete === 100 && (
        <div className="mt-6 bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Onboarding Complete!</h3>
          <p className="text-green-700">
            {employee.firstName} has completed all onboarding requirements and is ready to start!
          </p>
        </div>
      )}
    </div>
  );
};
