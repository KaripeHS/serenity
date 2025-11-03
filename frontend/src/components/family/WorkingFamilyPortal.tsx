import { useState, useEffect } from 'react';

interface FamilyPortalData {
  patientName: string;
  nextVisit: {
    date: string;
    time: string;
    caregiver: string;
    serviceType: string;
  };
  recentVisits: Array<{
    date: string;
    caregiver: string;
    serviceType: string;
    notes: string;
    rating: number;
  }>;
  caregiverTeam: Array<{
    name: string;
    role: string;
    phone: string;
    email: string;
    rating: number;
  }>;
  billingInfo: {
    lastPayment: string;
    nextBilling: string;
    balance: string;
  };
}

export function WorkingFamilyPortal() {
  const [data, setData] = useState<FamilyPortalData | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'schedule' | 'caregivers' | 'billing' | 'messages'>('overview');
  const [messages, setMessages] = useState([
    { id: 1, from: 'Maria Rodriguez', message: 'Eleanor had a great day today. Her mobility is improving.', time: '2 hours ago', type: 'update' },
    { id: 2, from: 'Care Coordinator', message: 'Appointment reminder: Physical therapy tomorrow at 2 PM', time: '1 day ago', type: 'reminder' },
    { id: 3, from: 'Billing Department', message: 'Your January invoice is ready for review', time: '3 days ago', type: 'billing' }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        patientName: 'Eleanor Johnson',
        nextVisit: {
          date: '2024-01-16',
          time: '09:00 AM',
          caregiver: 'Maria Rodriguez',
          serviceType: 'Personal Care'
        },
        recentVisits: [
          {
            date: '2024-01-15',
            caregiver: 'Maria Rodriguez',
            serviceType: 'Personal Care',
            notes: 'Patient was in good spirits. Assisted with bathing and medication. Vital signs normal.',
            rating: 5
          },
          {
            date: '2024-01-14',
            caregiver: 'David Chen',
            serviceType: 'Physical Therapy',
            notes: 'Continued range of motion exercises. Patient showing improvement in mobility.',
            rating: 5
          },
          {
            date: '2024-01-13',
            caregiver: 'Jennifer Miller',
            serviceType: 'Medication Management',
            notes: 'Reviewed medication schedule. All medications taken as prescribed.',
            rating: 4
          }
        ],
        caregiverTeam: [
          {
            name: 'Maria Rodriguez',
            role: 'Primary Caregiver',
            phone: '(614) 555-0123',
            email: 'maria.r@serenityhealth.com',
            rating: 4.9
          },
          {
            name: 'David Chen',
            role: 'Physical Therapist',
            phone: '(614) 555-0456',
            email: 'david.c@serenityhealth.com',
            rating: 4.8
          },
          {
            name: 'Jennifer Miller',
            role: 'Registered Nurse',
            phone: '(614) 555-0789',
            email: 'jennifer.m@serenityhealth.com',
            rating: 4.7
          }
        ],
        billingInfo: {
          lastPayment: '2024-01-01',
          nextBilling: '2024-02-01',
          balance: '$0.00'
        }
      });
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    const message = prompt('Type your message to the care team:');
    if (message) {
      setMessages(prev => [
        { id: Date.now(), from: 'You', message, time: 'Just now', type: 'family' },
        ...prev
      ]);
      alert('Message sent to care team!');
    }
  };

  if (!data) {
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
          <p style={{ color: '#6b7280' }}>Loading Family Portal...</p>
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
              Family Portal
            </h1>
            <p style={{ color: '#6b7280' }}>
              Care updates for {data.patientName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={sendMessage}
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
              💬 Send Message
            </button>
            <a href="/" style={{
              color: '#2563eb',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center'
            }}>
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Next Visit Alert */}
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
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0284c7',
                  margin: 0
                }}>
                  Next Visit: {data.nextVisit.date} at {data.nextVisit.time}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#0c4a6e', margin: 0 }}>
                  {data.nextVisit.serviceType} with {data.nextVisit.caregiver}
                </p>
              </div>
            </div>
            <button
              onClick={() => alert('Visit reminder set!')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Set Reminder
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
              { key: 'overview', label: '🏠 Overview' },
              { key: 'schedule', label: '📅 Schedule' },
              { key: 'caregivers', label: '👥 Care Team' },
              { key: 'billing', label: '💳 Billing' },
              { key: 'messages', label: '💬 Messages', count: messages.length }
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
                {tab.count && (
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

        {/* Overview */}
        {activeView === 'overview' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Recent Visit Summary */}
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
                Recent Care Updates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.recentVisits.slice(0, 3).map((visit, index) => (
                  <div key={index} style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {visit.serviceType} with {visit.caregiver}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {visit.date}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{
                            color: i < visit.rating ? '#f59e0b' : '#e5e7eb',
                            fontSize: '0.875rem'
                          }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                      {visit.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Care Team Quick Contact */}
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
                Care Team
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.caregiverTeam.slice(0, 3).map((caregiver, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {caregiver.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {caregiver.role} • ⭐ {caregiver.rating}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => alert(`Calling ${caregiver.name} at ${caregiver.phone}`)}
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
                        📞
                      </button>
                      <button
                        onClick={() => alert(`Sending message to ${caregiver.name}`)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        💬
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule View */}
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
              Upcoming Care Schedule
            </h3>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📅</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                Care Schedule
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                View upcoming visits, appointment times, and caregiver assignments
              </p>
              <button
                onClick={() => alert('Opening detailed calendar view...')}
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
                View Full Calendar
              </button>
            </div>
          </div>
        )}

        {/* Messages View */}
        {activeView === 'messages' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                Messages & Updates
              </h3>
              <button
                onClick={sendMessage}
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
                📝 New Message
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((message) => (
                <div key={message.id} style={{
                  padding: '1rem',
                  backgroundColor: message.from === 'You' ? '#f0f9ff' : '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {message.from}
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {message.time}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other views would be implemented similarly */}
      </div>
    </div>
  );
}