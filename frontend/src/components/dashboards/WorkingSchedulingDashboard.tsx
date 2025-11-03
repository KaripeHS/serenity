import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SchedulingMetrics {
  totalVisits: number;
  unassignedVisits: number;
  caregiverUtilization: number;
  avgTravelTime: number;
  scheduleCompliance: number;
  emergencyRequests: number;
}

interface Visit {
  id: string;
  patientName: string;
  serviceType: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  requiredSkills: string[];
  status: 'unassigned' | 'assigned' | 'confirmed' | 'completed' | 'cancelled';
  assignedCaregiver?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  patientAge?: number;
  patientDiagnosis?: string;
  specialInstructions?: string;
  emergencyContact?: string;
  medicationReminders?: string[];
  lastVisitNotes?: string;
  caregiverPreferences?: string;
  payerSource?: string;
  authorizationNumber?: string;
  estimatedCost?: number;
}

interface Caregiver {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: string[];
  location: string;
  rating: number;
  isActive: boolean;
}

export function WorkingSchedulingDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<SchedulingMetrics | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'schedule' | 'matcher' | 'optimization' | 'calendar'>('dashboard');
  const [visits, setVisits] = useState<Visit[]>([
    {
      id: 'V001',
      patientName: 'Eleanor Johnson',
      serviceType: 'Personal Care',
      date: '2024-01-16',
      time: '09:00',
      duration: 120,
      location: 'Columbus, OH',
      requiredSkills: ['Personal Care', 'Medication Management'],
      status: 'unassigned',
      priority: 'high',
      patientAge: 89,
      patientDiagnosis: 'Post-surgical recovery, Type 2 Diabetes',
      specialInstructions: 'Patient is recovering from hip replacement surgery. Assistance needed with mobility and medication adherence.',
      emergencyContact: 'Sarah Johnson (daughter) - 614-555-0123',
      medicationReminders: ['Insulin - 8AM, 2PM, 8PM', 'Blood pressure medication - 9AM', 'Pain medication as needed'],
      lastVisitNotes: 'Patient showed good progress with mobility. Continue encouraging walking exercises.',
      caregiverPreferences: 'Female caregiver preferred',
      payerSource: 'Medicare',
      authorizationNumber: 'AUTH-2024-001234',
      estimatedCost: 245.50
    },
    {
      id: 'V002',
      patientName: 'Robert Smith',
      serviceType: 'Physical Therapy',
      date: '2024-01-16',
      time: '14:00',
      duration: 60,
      location: 'Dublin, OH',
      requiredSkills: ['Physical Therapy', 'Mobility Training'],
      status: 'assigned',
      assignedCaregiver: 'David Chen',
      priority: 'medium',
      patientAge: 76,
      patientDiagnosis: 'Stroke recovery, Left-side weakness',
      specialInstructions: 'Focus on balance and coordination exercises. Patient is motivated but gets tired easily.',
      emergencyContact: 'Linda Smith (wife) - 614-555-0456',
      medicationReminders: ['Anticoagulant - 9AM', 'Cholesterol medication - 6PM'],
      lastVisitNotes: 'Significant improvement in balance. Recommend continuing current exercise regimen.',
      caregiverPreferences: 'Experienced with stroke recovery',
      payerSource: 'Private Insurance - Aetna',
      authorizationNumber: 'AUTH-2024-002456',
      estimatedCost: 380.00
    },
    {
      id: 'V003',
      patientName: 'Mary Williams',
      serviceType: 'Medication Management',
      date: '2024-01-16',
      time: '11:00',
      duration: 45,
      location: 'Westerville, OH',
      requiredSkills: ['Medication Management', 'Vital Signs'],
      status: 'unassigned',
      priority: 'urgent',
      patientAge: 82,
      patientDiagnosis: 'Congestive Heart Failure, Dementia (early stage)',
      specialInstructions: 'URGENT: Patient missed medication doses yesterday. Critical to ensure compliance with heart medications.',
      emergencyContact: 'Michael Williams (son) - 614-555-0789',
      medicationReminders: ['Heart medication - 7AM, 7PM (CRITICAL)', 'Diuretic - 9AM', 'Memory supplement - 6PM'],
      lastVisitNotes: 'Patient confused about medication schedule. Recommend daily monitoring.',
      caregiverPreferences: 'Patient-certified caregiver required for dementia care',
      payerSource: 'Medicaid',
      authorizationNumber: 'AUTH-2024-003789',
      estimatedCost: 120.75
    }
  ]);

  const [caregivers, _setCaregivers] = useState<Caregiver[]>([
    {
      id: 'C001',
      name: 'Maria Rodriguez',
      role: 'Senior Caregiver',
      skills: ['Personal Care', 'Medication Management', 'Wound Care'],
      availability: ['09:00-17:00'],
      location: 'Columbus, OH',
      rating: 4.8,
      isActive: true
    },
    {
      id: 'C002',
      name: 'David Chen',
      role: 'Physical Therapist',
      skills: ['Physical Therapy', 'Mobility Training', 'Pain Management'],
      availability: ['08:00-16:00'],
      location: 'Dublin, OH',
      rating: 4.9,
      isActive: true
    },
    {
      id: 'C003',
      name: 'Jennifer Miller',
      role: 'Registered Nurse',
      skills: ['Medication Management', 'Vital Signs', 'Wound Care', 'IV Therapy'],
      availability: ['10:00-18:00'],
      location: 'Westerville, OH',
      rating: 4.7,
      isActive: true
    }
  ]);

  const [_selectedVisit, _setSelectedVisit] = useState<string | null>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Visit | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        totalVisits: 127,
        unassignedVisits: 23,
        caregiverUtilization: 82.5,
        avgTravelTime: 18.5,
        scheduleCompliance: 94.2,
        emergencyRequests: 3
      });
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  const handleAssignCaregiver = (visitId: string, caregiverId: string) => {
    const caregiver = caregivers.find(c => c.id === caregiverId);
    setVisits(prev => prev.map(visit =>
      visit.id === visitId
        ? { ...visit, status: 'assigned', assignedCaregiver: caregiver?.name }
        : visit
    ));
    alert(`Visit ${visitId} assigned to ${caregiver?.name}`);
  };

  const handleOptimizeSchedule = () => {
    // Simulate AI optimization
    alert('AI Schedule Optimization initiated. Analyzing 127 visits across 22 Ohio cities...');
    setTimeout(() => {
      alert('Optimization complete! 25 minutes saved in travel time, 3 conflicts resolved.');
    }, 2000);
  };

  const handleViewDetails = (visitId: string) => {
    setViewDetailsModal(visitId);
  };

  const handleEditVisit = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      setEditFormData({...visit});
      setEditModal(visitId);
    }
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      setVisits(prev => prev.map(visit =>
        visit.id === editFormData.id ? editFormData : visit
      ));
      setEditModal(null);
      setEditFormData(null);
      alert(`Visit ${editFormData.id} updated successfully!`);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unassigned': return { bg: '#fecaca', text: '#dc2626' };
      case 'assigned': return { bg: '#fef3c7', text: '#92400e' };
      case 'confirmed': return { bg: '#dbeafe', text: '#1e40af' };
      case 'completed': return { bg: '#dcfce7', text: '#166534' };
      case 'cancelled': return { bg: '#f3f4f6', text: '#6b7280' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: '#dc2626', text: 'white' };
      case 'high': return { bg: '#f59e0b', text: 'white' };
      case 'medium': return { bg: '#3b82f6', text: 'white' };
      case 'low': return { bg: '#6b7280', text: 'white' };
      default: return { bg: '#6b7280', text: 'white' };
    }
  };

  if (!metrics) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading Scheduling Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              AI-Powered Scheduling System
            </h1>
            <p style={{ color: '#6b7280' }}>
              Intelligent caregiver matching, route optimization, and schedule management
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Emergency Alerts */}
        {metrics.emergencyRequests > 0 && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#dc2626',
                    margin: 0
                  }}>
                    {metrics.emergencyRequests} Emergency Schedule Requests
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                    Urgent coverage needed for today's visits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('schedule')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Handle Emergencies
              </button>
            </div>
          </div>
        )}

        {/* AI Optimization Banner */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <div>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0284c7',
                  margin: 0
                }}>
                  AI Schedule Optimization Available
                </p>
                <p style={{ fontSize: '0.875rem', color: '#0c4a6e', margin: 0 }}>
                  Save 25+ minutes travel time with intelligent route optimization
                </p>
              </div>
            </div>
            <button
              onClick={handleOptimizeSchedule}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🚀 Optimize Now
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard', count: null },
              { key: 'schedule', label: '📅 Schedule', count: visits.filter(v => v.status === 'unassigned').length },
              { key: 'matcher', label: '🎯 AI Matcher', count: null },
              { key: 'optimization', label: '⚡ Optimization', count: null },
              { key: 'calendar', label: '📆 Calendar', count: null }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: activeView === tab.key ? '#2563eb' : 'transparent',
                  color: activeView === tab.key ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span style={{
                    backgroundColor: activeView === tab.key ? 'rgba(255,255,255,0.2)' : '#dc2626',
                    color: 'white',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Total Visits Today
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {metrics.totalVisits}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  +12% vs yesterday
                </p>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Unassigned Visits
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  {metrics.unassignedVisits}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                  Need assignment
                </p>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Caregiver Utilization
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  {metrics.caregiverUtilization}%
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  Optimal range
                </p>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Avg Travel Time
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  {metrics.avgTravelTime}m
                </p>
                <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
                  -3m improved
                </p>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Schedule Compliance
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  {metrics.scheduleCompliance}%
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  Above target
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                Quick Actions
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setActiveView('schedule')}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  📅 Assign Visits ({visits.filter(v => v.status === 'unassigned').length})
                </button>
                <button
                  onClick={() => setActiveView('matcher')}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  🎯 AI Caregiver Matcher
                </button>
                <button
                  onClick={handleOptimizeSchedule}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Optimize Routes
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  📆 View Calendar
                </button>
              </div>
            </div>
          </>
        )}

        {/* Schedule Management View */}
        {activeView === 'schedule' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Visit Assignments & Scheduling
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visits.map((visit) => {
                const statusColors = getStatusColor(visit.status);
                const priorityColors = getPriorityColor(visit.priority);
                return (
                  <div key={visit.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: visit.priority === 'urgent' ? '#fef2f2' : '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1f2937'
                          }}>
                            {visit.patientName} - {visit.serviceType}
                          </h4>
                          <span style={{
                            backgroundColor: priorityColors.bg,
                            color: priorityColors.text,
                            padding: '0.125rem 0.375rem',
                            borderRadius: '9999px',
                            fontSize: '0.625rem',
                            fontWeight: '500'
                          }}>
                            {visit.priority}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          📅 {visit.date} at {visit.time} • {visit.duration}min • 📍 {visit.location}
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                          <strong>Required Skills:</strong> {visit.requiredSkills.join(', ')}
                        </div>
                        {visit.assignedCaregiver && (
                          <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                            👤 Assigned to: {visit.assignedCaregiver}
                          </p>
                        )}
                      </div>
                      <span style={{
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {visit.status}
                      </span>
                    </div>

                    {visit.status === 'unassigned' && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
                          Available Caregivers:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {caregivers.filter(cg =>
                            cg.isActive &&
                            visit.requiredSkills.some(skill => cg.skills.includes(skill))
                          ).map(caregiver => (
                            <div key={caregiver.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem',
                              backgroundColor: 'white',
                              borderRadius: '0.25rem',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div>
                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                  {caregiver.name}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                  {caregiver.role} • ⭐ {caregiver.rating} • 📍 {caregiver.location}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAssignCaregiver(visit.id, caregiver.id)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#059669',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Assign
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleViewDetails(visit.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ View Details
                      </button>
                      <button
                        onClick={() => handleEditVisit(visit.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      {visit.status === 'assigned' && (
                        <button
                          onClick={() => alert(`Sending confirmation to ${visit.assignedCaregiver}`)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          📧 Send Confirmation
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Matcher View */}
        {activeView === 'matcher' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              🤖 AI-Powered Caregiver Matching
            </h3>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.5rem',
              border: '1px solid #bae6fd'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🎯</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.5rem' }}>
                Advanced AI Matching Engine
              </h4>
              <p style={{ color: '#0c4a6e', marginBottom: '1rem' }}>
                Our AI analyzes 50+ factors including skills, location, availability, patient preferences, and historical performance to find the perfect caregiver match.
              </p>
              <button
                onClick={() => alert('AI Matching initiated for all unassigned visits...')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🚀 Run AI Matching for All Visits
              </button>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewDetailsModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {(() => {
                const visit = visits.find(v => v.id === viewDetailsModal);
                if (!visit) return null;
                return (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '1rem'
                    }}>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#1f2937'
                      }}>
                        Visit Details - {visit.id}
                      </h2>
                      <button
                        onClick={() => setViewDetailsModal(null)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '50%',
                          width: '2rem',
                          height: '2rem',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          Patient Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div><strong>Name:</strong> {visit.patientName}</div>
                          <div><strong>Age:</strong> {visit.patientAge} years old</div>
                          <div style={{ gridColumn: '1 / -1' }}><strong>Diagnosis:</strong> {visit.patientDiagnosis}</div>
                          <div style={{ gridColumn: '1 / -1' }}><strong>Emergency Contact:</strong> {visit.emergencyContact}</div>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#f0f9ff',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #bae6fd'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          Visit Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div><strong>Service Type:</strong> {visit.serviceType}</div>
                          <div><strong>Duration:</strong> {visit.duration} minutes</div>
                          <div><strong>Date:</strong> {visit.date}</div>
                          <div><strong>Time:</strong> {visit.time}</div>
                          <div style={{ gridColumn: '1 / -1' }}><strong>Location:</strong> {visit.location}</div>
                          <div style={{ gridColumn: '1 / -1' }}><strong>Required Skills:</strong> {visit.requiredSkills.join(', ')}</div>
                          {visit.assignedCaregiver && (
                            <div style={{ gridColumn: '1 / -1' }}><strong>Assigned Caregiver:</strong> {visit.assignedCaregiver}</div>
                          )}
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#fef3c7',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #fed7aa'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          Special Instructions
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '0.5rem' }}>
                          {visit.specialInstructions}
                        </p>
                        <div style={{ fontSize: '0.875rem' }}>
                          <strong>Caregiver Preferences:</strong> {visit.caregiverPreferences}
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#f0fdf4',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #bbf7d0'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          Medication Reminders
                        </h3>
                        <ul style={{ fontSize: '0.875rem', color: '#065f46', paddingLeft: '1rem' }}>
                          {visit.medicationReminders?.map((med, index) => (
                            <li key={index} style={{ marginBottom: '0.25rem' }}>{med}</li>
                          ))}
                        </ul>
                      </div>

                      {visit.lastVisitNotes && (
                        <div style={{
                          backgroundColor: '#fefce8',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #fef08a'
                        }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                            Last Visit Notes
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#a16207' }}>
                            {visit.lastVisitNotes}
                          </p>
                        </div>
                      )}

                      <div style={{
                        backgroundColor: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          Billing & Authorization
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div><strong>Payer Source:</strong> {visit.payerSource}</div>
                          <div><strong>Estimated Cost:</strong> ${visit.estimatedCost?.toFixed(2)}</div>
                          <div style={{ gridColumn: '1 / -1' }}><strong>Authorization #:</strong> {visit.authorizationNumber}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => {
                          setViewDetailsModal(null);
                          handleEditVisit(visit.id);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit Visit
                      </button>
                      <button
                        onClick={() => setViewDetailsModal(null)}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal && editFormData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  Edit Visit - {editFormData.id}
                </h2>
                <button
                  onClick={() => {
                    setEditModal(null);
                    setEditFormData(null);
                  }}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '50%',
                    width: '2rem',
                    height: '2rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.patientName}
                      onChange={(e) => handleEditFormChange('patientName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Service Type
                    </label>
                    <select
                      value={editFormData.serviceType}
                      onChange={(e) => handleEditFormChange('serviceType', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Personal Care">Personal Care</option>
                      <option value="Physical Therapy">Physical Therapy</option>
                      <option value="Medication Management">Medication Management</option>
                      <option value="Wound Care">Wound Care</option>
                      <option value="Companionship">Companionship</option>
                      <option value="Meal Preparation">Meal Preparation</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => handleEditFormChange('date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={editFormData.time}
                      onChange={(e) => handleEditFormChange('time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={editFormData.duration}
                      onChange={(e) => handleEditFormChange('duration', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => handleEditFormChange('location', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Priority
                    </label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => handleEditFormChange('priority', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => handleEditFormChange('status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="unassigned">Unassigned</option>
                      <option value="assigned">Assigned</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                    Special Instructions
                  </label>
                  <textarea
                    value={editFormData.specialInstructions || ''}
                    onChange={(e) => handleEditFormChange('specialInstructions', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => {
                    setEditModal(null);
                    setEditFormData(null);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}