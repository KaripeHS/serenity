import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardLayout,
  TabContainer,
  UrgentSection,
  WidgetContainer,
  StatWidget,
  WidgetGrid,
} from '@/components/ui/CommandCenter';
import type { Tab } from '@/components/ui/CommandCenter';
import { api } from '@/lib/api';
import {
  useRoleAccess,
  DashboardPermission,
  FeaturePermission,
  withRoleAccess,
} from '@/hooks/useRoleAccess';
import {
  User,
  Calendar,
  FileText,
  DollarSign,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
} from 'lucide-react';

interface CarePlan {
  id: string;
  clientName: string;
  startDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  goals: string[];
  services: string[];
  frequency: string;
}

interface Visit {
  id: string;
  caregiverName: string;
  caregiverPhoto?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  period: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
}

function ClientFamilyPortal() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Executives (Founder, CEO, COO) get full access to all tabs for oversight
  const isExecutive = roleAccess.isFounder || roleAccess.isExecutive;

  // Fetch urgent items
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['client-portal', 'urgent'],
    queryFn: async () => {
      const [upcomingVisits, pendingInvoices]: any[] = await Promise.all([
        api.get('/client-portal/visits/upcoming'),
        api.get('/client-portal/invoices/pending'),
      ]);
      return {
        upcomingVisits: upcomingVisits.data,
        pendingInvoices: pendingInvoices.data,
      };
    },
  });

  // Build urgent items
  const urgentItems = [
    // Upcoming visits today
    ...(urgentData?.upcomingVisits || [])
      .filter((visit: Visit) => {
        const today = new Date().toDateString();
        return new Date(visit.scheduledDate).toDateString() === today;
      })
      .map((visit: Visit) => ({
        id: `visit-${visit.id}`,
        title: `📅 Visit Today: ${visit.scheduledTime}`,
        description: `${visit.caregiverName} - ${visit.services.join(', ')}`,
        priority: 'info' as const,
      })),
    // Pending invoices
    ...(urgentData?.pendingInvoices || [])
      .filter((invoice: Invoice) => invoice.status === 'overdue')
      .map((invoice: Invoice) => ({
        id: `invoice-${invoice.id}`,
        title: `💳 Payment Overdue: ${invoice.invoiceNumber}`,
        description: `Balance due: $${invoice.balanceDue.toFixed(2)}`,
        deadline: new Date(invoice.dueDate),
        priority: 'urgent' as const,
        action: {
          label: 'Pay Now',
          onClick: () => (window.location.href = `/client-portal/invoices/${invoice.id}/pay`),
        },
      })),
  ];

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <User className="w-4 h-4" />,
      content: <OverviewTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_CARE_PLAN)) && {
      id: 'care-plan',
      label: 'Care Plan',
      icon: <Heart className="w-4 h-4" />,
      content: <CarePlanTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_VISIT_LOGS)) && {
      id: 'visits',
      label: 'Visits',
      icon: <Calendar className="w-4 h-4" />,
      content: <VisitsTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_BILLING_STATEMENTS)) && {
      id: 'billing',
      label: 'Billing',
      icon: <DollarSign className="w-4 h-4" />,
      content: <BillingTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.SUBMIT_FEEDBACK)) && {
      id: 'feedback',
      label: 'Feedback',
      icon: <MessageCircle className="w-4 h-4" />,
      content: <FeedbackTab />,
    },
  ].filter(Boolean) as Tab[];

  return (
    <DashboardLayout
      title="Client & Family Portal"
      subtitle="Manage your care, view visits, and communicate with your care team"
      urgentSection={urgentItems.length > 0 ? <UrgentSection items={urgentItems} /> : undefined}
    >
      <TabContainer
        tabs={tabs}
        defaultTab="overview"
        onChange={(tabId) => setSelectedTab(tabId)}
      />
    </DashboardLayout>
  );
}

/**
 * Overview Tab
 */
function OverviewTab() {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['client-portal', 'overview'],
    queryFn: async () => {
      const response = await api.get('/client-portal/overview');
      return (response as any).data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <WidgetContainer>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {overviewData?.clientName || 'Client'}!
            </h2>
            <p className="text-gray-600 mt-1">
              Your care team is here to support you. Here's what's happening today.
            </p>
          </div>
        </div>
      </WidgetContainer>

      {/* Key Stats */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Next Visit"
          value={overviewData?.nextVisit?.time || 'No visits scheduled'}
          icon={<Calendar className="w-5 h-5" />}
          variant="default"
        />
        <StatWidget
          label="This Month's Visits"
          value={overviewData?.monthlyVisits || '0'}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="Current Caregiver"
          value={overviewData?.primaryCaregiver || 'Not assigned'}
          icon={<Heart className="w-5 h-5" />}
        />
        <StatWidget
          label="Balance Due"
          value={`$${overviewData?.balanceDue || '0.00'}`}
          variant={overviewData?.balanceDue > 0 ? 'warning' : 'success'}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Today's Visit */}
      {overviewData?.todayVisit && (
        <WidgetContainer title="Today's Visit" icon={<Calendar className="w-5 h-5" />}>
          <div className="flex items-center gap-6 p-4 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                {overviewData.todayVisit.caregiverName}
              </h3>
              <p className="text-sm text-gray-600">
                {overviewData.todayVisit.scheduledTime} ({overviewData.todayVisit.duration})
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Services: {overviewData.todayVisit.services.join(', ')}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                On Time
              </span>
            </div>
          </div>
        </WidgetContainer>
      )}

      {/* Quick Actions */}
      <WidgetContainer title="Quick Actions">
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/client-portal/care-plan'}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Care Plan
          </button>
          <button
            onClick={() => window.location.href = '/client-portal/schedule-change'}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Schedule Change Request
          </button>
          <button
            onClick={() => window.location.href = '/client-portal/feedback'}
            className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Submit Feedback
          </button>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Care Plan Tab
 */
function CarePlanTab() {
  const { data: carePlan, isLoading } = useQuery({
    queryKey: ['client-portal', 'care-plan'],
    queryFn: async () => {
      const response = await api.get('/client-portal/care-plan');
      return (response as any).data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading care plan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Care Plan Summary */}
      <WidgetContainer title="Care Plan Details" icon={<Heart className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(carePlan?.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Review</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(carePlan?.lastReviewDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Review</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(carePlan?.nextReviewDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Service Frequency</p>
            <p className="text-lg font-medium text-gray-900">{carePlan?.frequency}</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Goals */}
      <WidgetContainer title="Care Goals" subtitle="What we're working on together">
        <div className="space-y-3">
          {carePlan?.goals?.map((goal: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-900">{goal}</p>
            </div>
          ))}
        </div>
      </WidgetContainer>

      {/* Services */}
      <WidgetContainer title="Authorized Services">
        <div className="grid grid-cols-2 gap-3">
          {carePlan?.services?.map((service: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{service}</span>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Visits Tab
 */
function VisitsTab() {
  const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming');

  const { data: visits, isLoading } = useQuery({
    queryKey: ['client-portal', 'visits', filter],
    queryFn: async () => {
      const response = await api.get(`/client-portal/visits?filter=${filter}`);
      return (response as any).data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading visits...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-md ${filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming Visits
        </button>
        <button
          className={`px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilter('completed')}
        >
          Visit History
        </button>
      </div>

      {/* Visits List */}
      <WidgetContainer>
        {visits?.length > 0 ? (
          <div className="space-y-4">
            {visits.map((visit: Visit) => (
              <div
                key={visit.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{visit.caregiverName}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                  </p>
                  <p className="text-sm text-gray-600">{visit.services.join(', ')}</p>
                  {visit.notes && (
                    <p className="text-sm text-gray-500 mt-1 italic">{visit.notes}</p>
                  )}
                </div>
                <div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      visit.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : visit.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : visit.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {visit.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No visits found</div>
        )}
      </WidgetContainer>
    </div>
  );
}

/**
 * Billing Tab
 */
function BillingTab() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['client-portal', 'invoices'],
    queryFn: async () => {
      const response = await api.get('/client-portal/invoices');
      return (response as any).data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading billing information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <WidgetGrid columns={3}>
        <StatWidget
          label="Current Balance"
          value={`$${invoices?.summary?.currentBalance || '0.00'}`}
          variant={invoices?.summary?.currentBalance > 0 ? 'warning' : 'success'}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatWidget
          label="Last Payment"
          value={`$${invoices?.summary?.lastPayment || '0.00'}`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatWidget
          label="Next Due Date"
          value={
            invoices?.summary?.nextDueDate
              ? new Date(invoices.summary.nextDueDate).toLocaleDateString()
              : 'N/A'
          }
          icon={<Clock className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Invoices */}
      <WidgetContainer
        title="Invoices"
        action={{
          label: 'Download All',
          onClick: () => {},
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices?.invoices?.map((invoice: Invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.period}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ${invoice.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ${invoice.paidAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    ${invoice.balanceDue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button className="text-blue-600 hover:underline text-sm">View</button>
                      {invoice.balanceDue > 0 && (
                        <button className="text-green-600 hover:underline text-sm">Pay</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Feedback Tab
 */
function FeedbackTab() {
  const [feedbackType, setFeedbackType] = useState<'compliment' | 'concern' | 'suggestion'>(
    'compliment'
  );
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit feedback logic here
    alert('Thank you for your feedback!');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <WidgetContainer
        title="Submit Feedback"
        subtitle="We value your input! Let us know how we're doing."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Feedback
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${feedbackType === 'compliment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFeedbackType('compliment')}
              >
                😊 Compliment
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${feedbackType === 'concern' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFeedbackType('concern')}
              >
                😟 Concern
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${feedbackType === 'suggestion' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFeedbackType('suggestion')}
              >
                💡 Suggestion
              </button>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
            <textarea
              className="w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Submit Feedback
          </button>
        </form>
      </WidgetContainer>

      {/* Previous Feedback */}
      <WidgetContainer title="Your Previous Feedback">
        <div className="text-center py-8 text-gray-500">
          No previous feedback submissions
        </div>
      </WidgetContainer>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(ClientFamilyPortal, DashboardPermission.CLIENT_FAMILY_PORTAL);
