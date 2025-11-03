import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface AICompanionProps {
  className?: string;
}

export function AICompanion({ className = '' }: AICompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your Serenity AI Companion. I can help you with scheduling questions, policy clarification, patient care recommendations, and system navigation. What can I assist you with today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getAIResponse(input),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('schedule') || input.includes('appointment')) {
      return 'I can help you with scheduling! Currently, you have 127 visits scheduled for today with 94 completed. Would you like me to help you optimize routes, check caregiver availability, or schedule a new visit?';
    }

    if (input.includes('patient') || input.includes('care')) {
      return 'For patient care questions, I can provide clinical protocols, medication guidelines, and care plan recommendations. What specific patient care topic would you like assistance with?';
    }

    if (input.includes('compliance') || input.includes('hipaa')) {
      return 'I can help with compliance questions! Our current HIPAA compliance score is 95%. For specific compliance issues, I can guide you through proper protocols and documentation requirements.';
    }

    if (input.includes('billing') || input.includes('claim')) {
      return 'For billing assistance, I can help with claim status, denial reasons, and billing best practices. Currently, we have a 90% collection rate with 28 days average in AR.';
    }

    return 'I understand you\'re asking about "' + userInput + '". I can help with scheduling, patient care, compliance, billing, and system navigation. Could you provide more specific details about what you need assistance with?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🤖</span>
          <span>AI Companion</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages */}
          <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="How can I help you today?"
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
            >
              Send
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('How do I schedule a new visit?')}
            >
              Schedule Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Check compliance status')}
            >
              Compliance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Billing questions')}
            >
              Billing
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}