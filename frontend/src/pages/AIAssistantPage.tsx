import { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: typeof SparklesIcon;
  title: string;
  description: string;
  prompt: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: ClockIcon,
    title: 'Schedule Optimization',
    description: 'Get help optimizing caregiver schedules',
    prompt: 'Help me optimize my caregiver schedules for this week',
    color: 'blue'
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Insights',
    description: 'Understand your operational metrics',
    prompt: 'What are the key metrics I should be monitoring for my home health agency?',
    color: 'purple'
  },
  {
    icon: UserGroupIcon,
    title: 'Pod Management',
    description: 'Tips for managing care team pods',
    prompt: 'What are best practices for organizing care teams into pods?',
    color: 'green'
  },
  {
    icon: DocumentTextIcon,
    title: 'Compliance Guide',
    description: 'Get compliance and regulatory guidance',
    prompt: 'What are the key compliance requirements for home health agencies?',
    color: 'orange'
  }
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Serenity AI Assistant. I can help you with scheduling, compliance, pod management, analytics, and more. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(userMessage.content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const generateResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();

    if (lower.includes('schedule') || lower.includes('scheduling')) {
      return "For schedule optimization, I recommend:\n\n1. **Balance workload** across your care teams\n2. **Consider travel time** between patient visits\n3. **Match caregiver skills** to patient needs\n4. **Use pods** to maintain continuity of care\n5. **Monitor overtime** to control costs\n\nWould you like specific guidance on any of these areas?";
    }

    if (lower.includes('pod') || lower.includes('team')) {
      return "Pod-based care teams work best when:\n\n1. **Size**: Keep pods between 8-12 members (6-8 caregivers, 2-4 patients)\n2. **Geography**: Assign pods to specific regions to minimize travel\n3. **Leadership**: Designate a pod leader for coordination\n4. **Skills**: Mix experience levels for mentoring\n5. **Continuity**: Keep assignments stable for better patient outcomes\n\nYou can manage pods from the Admin menu → Pods section.";
    }

    if (lower.includes('metric') || lower.includes('analytic') || lower.includes('kpi')) {
      return "Key metrics to monitor:\n\n**Operational:**\n- Visit completion rate\n- Caregiver utilization rate\n- Average visit duration\n- Travel time percentage\n\n**Financial:**\n- Revenue per visit\n- Cost per visit\n- Collection rate\n- Days in A/R\n\n**Quality:**\n- Patient satisfaction scores\n- Incident reports\n- Medication compliance\n- Readmission rates\n\nAccess these metrics from your Executive Dashboard.";
    }

    if (lower.includes('compliance') || lower.includes('regulation')) {
      return "Key compliance areas for home health:\n\n1. **Licensing**: Maintain current state licenses for all staff\n2. **Training**: Document ongoing education (12 hours/year minimum)\n3. **Documentation**: Complete visit notes within 24 hours\n4. **OASIS**: Submit assessments within required timeframes\n5. **Background checks**: Annual checks for all caregivers\n6. **Infection control**: Follow CDC guidelines\n\nCheck the Compliance Dashboard for alerts and upcoming expirations.";
    }

    if (lower.includes('hire') || lower.includes('recruit') || lower.includes('staff')) {
      return "For efficient hiring:\n\n1. **Use the HR Dashboard** to track applicants through your pipeline\n2. **Schedule interviews** directly from applicant profiles\n3. **Assign to pods** during offer acceptance to ensure smooth onboarding\n4. **Track credentials** to maintain compliance\n5. **Monitor performance** through regular reviews\n\nThe system will send automated welcome emails and create onboarding checklists.";
    }

    return "I understand you're asking about " + userInput + ". Here are some relevant resources:\n\n- Check the Help & Support section for detailed guides\n- Use the search function to find specific features\n- Contact your system administrator for custom configurations\n\nCould you provide more specific details about what you need help with?";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Serenity AI Assistant</h1>
            <p className="text-blue-100 text-sm">Your intelligent companion for home health management</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center gap-2 mb-4">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className={`p-4 bg-white rounded-lg border-2 border-${action.color}-200 hover:border-${action.color}-400 hover:shadow-md transition-all text-left group`}
                >
                  <Icon className={`w-6 h-6 text-${action.color}-600 mb-2`} />
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {message.role === 'assistant' && (
                  <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-5 h-5 text-purple-600 animate-pulse" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about Serenity ERP..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI-powered assistance for scheduling, compliance, analytics, and more
          </p>
        </div>
      </div>
    </div>
  );
}
