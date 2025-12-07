import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import {
  familyPortalService,
  Visit,
  CareTeamMember,
  BillingInfo,
  Message
} from '../../services/familyPortal.service';

interface PortalData {
  patientId: string; // Mock context
  familyId: string; // Mock context
}

export function WorkingFamilyPortal() {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'schedule' | 'caregivers' | 'billing' | 'messages'>('overview');

  // Data State
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [billing, setBilling] = useState<BillingInfo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Mock Context (Replace with actual auth/context in production)
  const mockContext: PortalData = { patientId: 'mock-patient-1', familyId: 'mock-family-1' };

  useEffect(() => {
    async function loadPortalData() {
      try {
        setLoading(true);
        const [recent, upcoming, team, bills, msgs] = await Promise.all([
          familyPortalService.getRecentVisits(mockContext.patientId),
          familyPortalService.getUpcomingVisits(mockContext.patientId),
          familyPortalService.getCareTeam(mockContext.patientId),
          familyPortalService.getBillingInformation(mockContext.patientId),
          familyPortalService.getMessages(mockContext.familyId)
        ]);

        setRecentVisits(recent);
        setUpcomingVisits(upcoming);
        setCareTeam(team);
        setBilling(bills);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load family portal data", error);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, []);

  const handleSendMessage = async () => {
    const text = prompt('Type your message to the care team:');
    if (text) {
      // Optimistic update
      const tempMsg: Message = {
        id: Date.now().toString(),
        from: 'You',
        to: 'Care Team',
        subject: 'New Message',
        content: text,
        timestamp: new Date().toISOString(),
        read: true,
        urgent: false
      };
      setMessages(prev => [tempMsg, ...prev]);

      try {
        await familyPortalService.sendMessage('Care Team', 'New Message', text);
      } catch (err) {
        alert('Failed to send message');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full md:col-span-2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const nextVisit = upcomingVisits[0];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👨‍👩‍👧 Family Portal
            </h1>
            <p className="text-gray-600">
              Care dashboard for your loved one
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSendMessage} className="shadow-sm hover:shadow-md transition-shadow">
              💬 Send Message
            </Button>
            <Link to="/" className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Next Visit Alert */}
        {nextVisit && (
          <Alert className="mb-8 bg-blue-50 border-blue-100 shadow-sm">
            <AlertDescription>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">
                      Next Visit: {new Date(nextVisit.date).toLocaleDateString()} at {nextVisit.time}
                    </p>
                    <p className="text-sm text-blue-700">
                      {nextVisit.services.join(', ')} with {nextVisit.caregiverName}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => alert('Reminder set!')} className="border-blue-200 text-blue-700 hover:bg-blue-100">
                  🔔 Set Reminder
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-2 md:p-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {[
                { key: 'overview', label: '🏠 Overview' },
                { key: 'schedule', label: '📅 Schedule' },
                { key: 'caregivers', label: '👥 Care Team' },
                { key: 'billing', label: '💳 Billing' },
                { key: 'messages', label: '💬 Messages', count: messages.filter(m => !m.read && m.from !== 'You').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key as any)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${activeView === tab.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Views */}
        <div className="animate-fade-in">
          {/* Overview View */}
          {activeView === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recent Care Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentVisits.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent visits recorded.</p>
                    ) : (
                      recentVisits.slice(0, 3).map((visit) => (
                        <div key={visit.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-primary-100 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {visit.services.join(', ')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(visit.date).toLocaleDateString()} • {visit.caregiverName}
                              </p>
                            </div>
                            <Badge variant="success">Completed</Badge>
                          </div>
                          {visit.notes && <p className="text-sm text-gray-700 italic">"{visit.notes}"</p>}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle>My Care Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {careTeam.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="h-10 w-10 bg-caregiver-100 rounded-full flex items-center justify-center text-caregiver-700 font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => alert(`Calling ${member.phone}`)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            📞
                          </button>
                          <button onClick={() => alert(`Messaging ${member.email}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            💬
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <button onClick={() => setActiveView('caregivers')} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View Full Team
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Schedule View */}
          {activeView === 'schedule' && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingVisits.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No upcoming visits scheduled.</p>
                    </div>
                  ) : (
                    upcomingVisits.map((visit) => (
                      <div key={visit.id} className="flex items-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                          <span className="text-xl font-bold">{new Date(visit.date).getDate()}</span>
                          <span className="block text-xs uppercase font-bold">{new Date(visit.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{visit.caregiverName}</h4>
                          <p className="text-sm text-gray-500">{visit.time} ({visit.duration} mins) • {visit.services.join(', ')}</p>
                        </div>
                        <Badge variant="info">Scheduled</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages View */}
          {activeView === 'messages' && (
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Message Center</CardTitle>
                  <Button size="sm" onClick={handleSendMessage}>
                    📝 New Message
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 my-auto">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === 'You' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-4 ${msg.from === 'You'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}>
                        <div className="flex justify-between items-baseline mb-1 gap-4">
                          <span className={`text-xs font-bold ${msg.from === 'You' ? 'text-primary-100' : 'text-gray-500'}`}>
                            {msg.from}
                          </span>
                          <span className={`text-xs ${msg.from === 'You' ? 'text-primary-200' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <Button onClick={handleSendMessage} className="w-full">
                  Write a Message
                </Button>
              </div>
            </Card>
          )}

          {/* Billing View */}
          {activeView === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {billing.map((bill) => (
                        <tr key={bill.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(bill.serviceDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bill.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${bill.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'pending' ? 'warning' : 'danger'}>
                              {bill.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Caregivers View */}
          {activeView === 'caregivers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {careTeam.map((member) => (
                <Card key={member.id} className="text-center p-6">
                  <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-3xl">
                    {member.avatar ? <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" /> : '👤'}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  <p className="text-primary-600 font-medium mb-4">{member.role}</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => alert('Call')}>Call</Button>
                    <Button size="sm" onClick={() => alert('Message')}>Message</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
