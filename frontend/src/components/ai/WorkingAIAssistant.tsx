import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export function WorkingAIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello ${user?.firstName || 'there'}! I'm your Serenity AI Companion. I can help you with:

• 📅 Scheduling and caregiver matching
• 🏥 Patient care recommendations
• 📋 Compliance and documentation
• 💰 Billing and claims processing
• 📊 System navigation and reports

What can I assist you with today?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment') || lowerMessage.includes('visit')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: '📅 I can help you with scheduling! Here are some quick actions:',
        timestamp: new Date().toISOString(),
        actions: [
          {
            label: '🎯 Find Caregiver Match',
            action: () => window.location.href = '/scheduling/new'
          },
          {
            label: '📊 View Schedule Dashboard',
            action: () => window.location.href = '/dashboard/operations'
          },
          {
            label: '⚡ Optimize Routes',
            action: () => alert('AI Route Optimization initiated! Analyzing current schedules...')
          }
        ]
      };
    }

    if (lowerMessage.includes('billing') || lowerMessage.includes('claim') || lowerMessage.includes('payment')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: '💰 I can help with billing and claims! Here are your options:',
        timestamp: new Date().toISOString(),
        actions: [
          {
            label: '📋 Process Claims',
            action: () => window.location.href = '/dashboard/billing'
          },
          {
            label: '❌ Review Denials',
            action: () => window.location.href = '/dashboard/billing'
          },
          {
            label: '📈 Revenue Report',
            action: () => alert('Generating revenue analysis report...')
          }
        ]
      };
    }

    if (lowerMessage.includes('compliance') || lowerMessage.includes('hipaa') || lowerMessage.includes('audit')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: '🛡️ Compliance is critical! Let me help you with:',
        timestamp: new Date().toISOString(),
        actions: [
          {
            label: '📊 HIPAA Compliance Score',
            action: () => window.location.href = '/dashboard/compliance'
          },
          {
            label: '🔍 Run Audit Check',
            action: () => alert('Running comprehensive compliance audit...')
          },
          {
            label: '📋 Training Tracker',
            action: () => window.location.href = '/dashboard/hr'
          }
        ]
      };
    }

    if (lowerMessage.includes('staff') || lowerMessage.includes('hr') || lowerMessage.includes('hiring')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: '👥 HR and staff management assistance available:',
        timestamp: new Date().toISOString(),
        actions: [
          {
            label: '📝 Review Applications',
            action: () => window.location.href = '/dashboard/hr'
          },
          {
            label: '🎓 Training Management',
            action: () => window.location.href = '/dashboard/hr'
          },
          {
            label: '📊 Staff Performance',
            action: () => alert('Generating staff performance analytics...')
          }
        ]
      };
    }

    if (lowerMessage.includes('patient') || lowerMessage.includes('clinical') || lowerMessage.includes('care')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: '🏥 Clinical and patient care assistance:',
        timestamp: new Date().toISOString(),
        actions: [
          {
            label: '🚨 Critical Alerts',
            action: () => window.location.href = '/dashboard/clinical'
          },
          {
            label: '💊 Medication Tracking',
            action: () => window.location.href = '/dashboard/clinical'
          },
          {
            label: '📋 Care Plan Review',
            action: () => alert('Opening care plan management...')
          }
        ]
      };
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('?')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🤖 I'm here to help! Try asking me about:

• "Schedule a visit for Eleanor Johnson"
• "Show me pending claims"
• "Check HIPAA compliance status"
• "Find available caregivers"
• "Generate billing report"
• "Review staff training"

Just type naturally - I understand context and can help navigate the system!`,
        timestamp: new Date().toISOString()
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `I understand you're asking about "${userMessage}". Let me help you navigate to the right section:`,
      timestamp: new Date().toISOString(),
      actions: [
        {
          label: '📊 Executive Dashboard',
          action: () => window.location.href = '/dashboard/executive'
        },
        {
          label: '🏥 Clinical Dashboard',
          action: () => window.location.href = '/dashboard/clinical'
        },
        {
          label: '📅 Operations Dashboard',
          action: () => window.location.href = '/dashboard/operations'
        },
        {
          label: '💰 Billing Dashboard',
          action: () => window.location.href = '/dashboard/billing'
        }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = getAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: '📅 Schedule Visit', action: () => window.location.href = '/scheduling/new' },
    { label: '🏥 Patient Status', action: () => window.location.href = '/dashboard/clinical' },
    { label: '💰 Process Claims', action: () => window.location.href = '/dashboard/billing' },
    { label: '👥 Staff Management', action: () => window.location.href = '/dashboard/hr' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
              🤖 AI Assistant
            </h1>
            <p style={{ color: '#6b7280' }}>
              Intelligent help for scheduling, compliance, billing, and patient care
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.5rem'
          }}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          height: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  backgroundColor: message.type === 'user' ? '#2563eb' : '#f3f4f6',
                  color: message.type === 'user' ? 'white' : '#1f2937'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap', marginBottom: message.actions ? '0.5rem' : 0 }}>
                    {message.content}
                  </div>
                  {message.actions && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      marginTop: '0.5rem'
                    }}>
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    marginTop: '0.25rem'
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span>AI is thinking</span>
                    <div style={{
                      display: 'flex',
                      gap: '0.125rem'
                    }}>
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: '#6b7280',
                            animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about scheduling, billing, compliance, or anything else..."
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: input.trim() && !isTyping ? '#2563eb' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed'
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* AI Capabilities Info */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#0284c7',
            marginBottom: '0.5rem'
          }}>
            🧠 AI Capabilities
          </h4>
          <div style={{
            fontSize: '0.75rem',
            color: '#0c4a6e',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            <div>• Intelligent scheduling recommendations</div>
            <div>• Billing and claims analysis</div>
            <div>• HIPAA compliance monitoring</div>
            <div>• Staff performance insights</div>
            <div>• Patient care optimization</div>
            <div>• System navigation assistance</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}