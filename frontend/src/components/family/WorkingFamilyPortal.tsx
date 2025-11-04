import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Family Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👨‍👩‍👧 Family Portal
            </h1>
            <p className="text-gray-600">
              Care updates for {data.patientName}
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={sendMessage}>
              💬 Send Message
            </Button>
            <Link to="/" className="text-blue-600 underline hover:text-blue-700 flex items-center">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Next Visit Alert */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-blue-800">
                    Next Visit: {data.nextVisit.date} at {data.nextVisit.time}
                  </p>
                  <p className="text-sm text-blue-700">
                    {data.nextVisit.serviceType} with {data.nextVisit.caregiver}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => alert('Visit reminder set!')}>
                Set Reminder
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Navigation Tabs */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex gap-4 overflow-x-auto">
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
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                    activeView === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  {tab.count && (
                    <Badge className={`${
                      activeView === tab.key ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                    } text-xs font-bold`}>
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Care Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Care Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentVisits.slice(0, 3).map((visit, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {visit.serviceType} with {visit.caregiver}
                          </p>
                          <p className="text-xs text-gray-600">{visit.date}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < visit.rating ? 'text-amber-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{visit.notes}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Care Team Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Care Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.caregiverTeam.slice(0, 3).map((caregiver, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {caregiver.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {caregiver.role} • ⭐ {caregiver.rating}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => alert(`Calling ${caregiver.name} at ${caregiver.phone}`)}
                          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                        >
                          📞
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => alert(`Sending message to ${caregiver.name}`)}
                          className="text-xs px-2 py-1"
                        >
                          💬
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule View */}
        {activeView === 'schedule' && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Care Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-6xl block mb-4">📅</span>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Care Schedule
                </h4>
                <p className="text-gray-600 mb-6">
                  View upcoming visits, appointment times, and caregiver assignments
                </p>
                <Button onClick={() => alert('Opening detailed calendar view...')}>
                  View Full Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Caregivers View */}
        {activeView === 'caregivers' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Care Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.caregiverTeam.map((caregiver, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{caregiver.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{caregiver.role}</p>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-amber-400">⭐</span>
                          <span className="text-sm font-medium text-gray-900">{caregiver.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-700">📞 {caregiver.phone}</p>
                      <p className="text-sm text-gray-700">📧 {caregiver.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => alert(`Calling ${caregiver.name}`)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        📞 Call
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => alert(`Messaging ${caregiver.name}`)}
                        className="flex-1"
                      >
                        💬 Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing View */}
        {activeView === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 mb-1">Last Payment</p>
                  <p className="text-2xl font-bold text-green-900">{data.billingInfo.lastPayment}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-1">Next Billing</p>
                  <p className="text-2xl font-bold text-blue-900">{data.billingInfo.nextBilling}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{data.billingInfo.balance}</p>
                </div>
              </div>
              <div className="text-center py-8">
                <Button onClick={() => alert('Opening payment portal...')}>
                  💳 View Payment History
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages View */}
        {activeView === 'messages' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Messages & Updates</CardTitle>
                <Button size="sm" onClick={sendMessage}>
                  📝 New Message
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${
                      message.from === 'You'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {message.from}
                      </p>
                      <span className="text-xs text-gray-600">
                        {message.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
