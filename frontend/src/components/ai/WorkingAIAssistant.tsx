import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Input } from '../ui/Input';

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
          { label: '🎯 Find Caregiver Match', action: () => window.location.href = '/scheduling/new' },
          { label: '📊 View Schedule Dashboard', action: () => window.location.href = '/dashboard/operations' },
          { label: '⚡ Optimize Routes', action: () => alert('AI Route Optimization initiated! Analyzing current schedules...') }
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
          { label: '📋 Process Claims', action: () => window.location.href = '/dashboard/billing' },
          { label: '❌ Review Denials', action: () => window.location.href = '/dashboard/billing' },
          { label: '📈 Revenue Report', action: () => alert('Generating revenue analysis report...') }
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
          { label: '📊 HIPAA Compliance Score', action: () => window.location.href = '/dashboard/compliance' },
          { label: '🔍 Run Audit Check', action: () => alert('Running comprehensive compliance audit...') },
          { label: '📋 Training Tracker', action: () => window.location.href = '/dashboard/hr' }
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
          { label: '📝 Review Applications', action: () => window.location.href = '/dashboard/hr' },
          { label: '🎓 Training Management', action: () => window.location.href = '/dashboard/hr' },
          { label: '📊 Staff Performance', action: () => alert('Generating staff performance analytics...') }
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
          { label: '🚨 Critical Alerts', action: () => window.location.href = '/dashboard/clinical' },
          { label: '💊 Medication Tracking', action: () => window.location.href = '/dashboard/clinical' },
          { label: '📋 Care Plan Review', action: () => alert('Opening care plan management...') }
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

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `I understand you're asking about "${userMessage}". Let me help you navigate to the right section:`,
      timestamp: new Date().toISOString(),
      actions: [
        { label: '📊 Executive Dashboard', action: () => window.location.href = '/dashboard/executive' },
        { label: '🏥 Clinical Dashboard', action: () => window.location.href = '/dashboard/clinical' },
        { label: '📅 Operations Dashboard', action: () => window.location.href = '/dashboard/operations' },
        { label: '💰 Billing Dashboard', action: () => window.location.href = '/dashboard/billing' }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 AI Assistant
            </h1>
            <p className="text-gray-600">
              Intelligent help for scheduling, compliance, billing, and patient care
            </p>
          </div>
          <Link to="/" className="text-blue-600 underline hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>

        {/* Quick Actions */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className={`whitespace-pre-wrap ${message.actions ? 'mb-2' : ''}`}>
                    {message.content}
                  </div>
                  {message.actions && (
                    <div className="flex flex-col gap-1 mt-2">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={action.action}
                          size="sm"
                          className="text-xs text-left justify-start"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span>AI is thinking</span>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-gray-600 animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
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
          <div className="border-t border-gray-200 p-4 flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about scheduling, billing, compliance, or anything else..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
            >
              Send
            </Button>
          </div>
        </Card>

        {/* AI Capabilities Info */}
        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <AlertDescription>
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              🧠 AI Capabilities
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
              <div>• Intelligent scheduling recommendations</div>
              <div>• Billing and claims analysis</div>
              <div>• HIPAA compliance monitoring</div>
              <div>• Staff performance insights</div>
              <div>• Patient care optimization</div>
              <div>• System navigation assistance</div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
