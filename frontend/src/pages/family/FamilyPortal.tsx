import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Login states
type AuthState = 'login' | 'magic-link-sent' | 'authenticated';

// Tabs for authenticated portal
type PortalTab = 'schedule' | 'visits' | 'care-plan' | 'care-team' | 'feedback' | 'referral';

// Mock data interfaces (will be replaced with API calls)
interface Visit {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    caregiverName: string;
    caregiverInitials: string;
    services: string[];
    status: 'completed' | 'scheduled' | 'in_progress' | 'cancelled';
    notes?: string;
    rating?: number;
}

interface CarePlanGoal {
    id: string;
    category: string;
    description: string;
    targetDate?: string;
    progress: 'not_started' | 'in_progress' | 'achieved';
}

interface CareTeamMember {
    id: string;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
    photo?: string;
}

interface FamilyFeedback {
    id: string;
    type: 'compliment' | 'concern' | 'suggestion';
    message: string;
    submittedAt: string;
    status: 'pending' | 'reviewed' | 'resolved';
    response?: string;
}

export const FamilyPortal: React.FC = () => {
    const [authState, setAuthState] = useState<AuthState>('login');
    const [email, setEmail] = useState('');
    const [familyUser, setFamilyUser] = useState<{ name: string; initials: string; clientName: string } | null>(null);
    const [activeTab, setActiveTab] = useState<PortalTab>('schedule');

    const [referralForm, setReferralForm] = useState({
        friendName: '',
        friendPhone: '',
        friendEmail: '',
        note: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    // Feedback form state - must be at top level before any returns
    const [feedbackType, setFeedbackType] = useState<'compliment' | 'concern' | 'suggestion'>('compliment');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // Magic link request mutation
    const magicLinkMutation = useMutation({
        mutationFn: async (email: string) => {
            // In production, this would call the backend API
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { success: true };
        },
        onSuccess: () => {
            setAuthState('magic-link-sent');
        }
    });

    // Demo login for testing
    const handleDemoLogin = () => {
        setFamilyUser({ name: 'Sarah Miller', initials: 'SM', clientName: 'Robert Miller' });
        setAuthState('authenticated');
    };

    const handleMagicLinkRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            magicLinkMutation.mutate(email);
        }
    };

    const handleLogout = () => {
        setAuthState('login');
        setFamilyUser(null);
        setEmail('');
    };

    const referralMutation = useMutation({
        mutationFn: async (data: typeof referralForm) => {
            const res = await fetch('/api/public/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: data.friendName.split(' ')[0] || 'Friend',
                    lastName: data.friendName.split(' ')[1] || '',
                    email: data.friendEmail,
                    phone: data.friendPhone,
                    serviceInterest: 'Client Referral',
                    source: 'client_referral',
                    notes: `Referral from Family Portal. Note: ${data.note}`
                })
            });
            if (!res.ok) throw new Error('Failed to submit referral');
            return res.json();
        },
        onSuccess: () => {
            setIsSubmitted(true);
            setReferralForm({ friendName: '', friendPhone: '', friendEmail: '', note: '' });
            setTimeout(() => setIsSubmitted(false), 5000);
        }
    });

    const handleReferralSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        referralMutation.mutate(referralForm);
    };

    // Login Screen
    if (authState === 'login') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-gray-900 tracking-tight">Serenity</span>
                                <span className="text-xs text-gray-600 font-medium -mt-1">Care Partners</span>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Login Form */}
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Family Portal</h1>
                                <p className="text-gray-600 mt-2">
                                    Stay connected with your loved one's care
                                </p>
                            </div>

                            <form onSubmit={handleMagicLinkRequest} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        placeholder="you@example.com"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        We'll send you a secure login link - no password needed
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={magicLinkMutation.isPending}
                                    className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {magicLinkMutation.isPending ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send Login Link'
                                    )}
                                </button>
                            </form>

                            {/* Demo Login for Testing */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-xs text-gray-500 text-center mb-3">For demonstration purposes:</p>
                                <button
                                    onClick={handleDemoLogin}
                                    className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition text-sm"
                                >
                                    Demo Login (Sarah Miller)
                                </button>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-600">
                                    Need help? Call us at{' '}
                                    <a href="tel:+15134005113" className="text-indigo-600 font-medium hover:underline">
                                        (513) 400-5113
                                    </a>
                                </p>
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            <Link to="/" className="text-indigo-600 hover:underline">
                                Back to Serenity Care Partners
                            </Link>
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    // Magic Link Sent Screen
    if (authState === 'magic-link-sent') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-gray-900 tracking-tight">Serenity</span>
                                <span className="text-xs text-gray-600 font-medium -mt-1">Care Partners</span>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Check Email Message */}
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                            <p className="text-gray-600 mb-6">
                                We've sent a login link to<br />
                                <strong className="text-gray-900">{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Click the link in the email to access the Family Portal. The link expires in 15 minutes.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => magicLinkMutation.mutate(email)}
                                    disabled={magicLinkMutation.isPending}
                                    className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
                                >
                                    Resend Link
                                </button>
                                <button
                                    onClick={() => setAuthState('login')}
                                    className="w-full py-2.5 px-4 text-indigo-600 font-medium text-sm hover:underline"
                                >
                                    Use a different email
                                </button>
                            </div>

                            {/* Demo: Skip to authenticated for testing */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-3">For demonstration:</p>
                                <button
                                    onClick={handleDemoLogin}
                                    className="text-sm text-indigo-600 hover:underline"
                                >
                                    Simulate clicking the email link
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Mock data for demonstration
    const mockUpcomingSchedule: Visit[] = [
        { id: '1', date: 'Today', startTime: '09:00 AM', endTime: '05:00 PM', caregiverName: 'Maria Rodriguez', caregiverInitials: 'MR', services: ['Personal Care', 'Medication Reminder'], status: 'in_progress' },
        { id: '2', date: 'Tomorrow', startTime: '09:00 AM', endTime: '05:00 PM', caregiverName: 'Sarah Johnson', caregiverInitials: 'SJ', services: ['Personal Care', 'Meal Prep'], status: 'scheduled' },
        { id: '3', date: 'Monday', startTime: '09:00 AM', endTime: '05:00 PM', caregiverName: 'Sarah Johnson', caregiverInitials: 'SJ', services: ['Personal Care', 'Light Housekeeping'], status: 'scheduled' },
    ];

    const mockVisitHistory: Visit[] = [
        { id: '4', date: '2024-01-04', startTime: '09:00 AM', endTime: '05:00 PM', caregiverName: 'Maria Rodriguez', caregiverInitials: 'MR', services: ['Personal Care', 'Medication Reminder'], status: 'completed', notes: 'Good day. Client was in good spirits. Completed all ADLs with minimal assistance.', rating: 5 },
        { id: '5', date: '2024-01-03', startTime: '09:00 AM', endTime: '05:00 PM', caregiverName: 'Sarah Johnson', caregiverInitials: 'SJ', services: ['Personal Care', 'Meal Prep'], status: 'completed', notes: 'Client enjoyed the homemade soup. Ate well at lunch.', rating: 5 },
        { id: '6', date: '2024-01-02', startTime: '09:00 AM', endTime: '05:00 PM', caregiverName: 'Maria Rodriguez', caregiverInitials: 'MR', services: ['Personal Care'], status: 'completed', notes: 'Regular visit. All tasks completed.', rating: 4 },
    ];

    const mockCarePlanGoals: CarePlanGoal[] = [
        { id: '1', category: 'Mobility', description: 'Maintain current mobility level with daily exercises and assisted walks', progress: 'in_progress' },
        { id: '2', category: 'Nutrition', description: 'Ensure balanced meals with adequate protein intake', progress: 'in_progress' },
        { id: '3', category: 'Social', description: 'Encourage family visits and social interaction to maintain mental well-being', progress: 'in_progress' },
        { id: '4', category: 'Safety', description: 'Monitor for fall risks and maintain safe home environment', progress: 'achieved' },
    ];

    const mockCareTeam: CareTeamMember[] = [
        { id: '1', name: 'Maria Rodriguez', role: 'Primary Caregiver', phone: '(513) 555-0101', isPrimary: true },
        { id: '2', name: 'Sarah Johnson', role: 'Backup Caregiver', phone: '(513) 555-0102', isPrimary: false },
        { id: '3', name: 'Jennifer Williams', role: 'Care Coordinator', phone: '(513) 400-5113', email: 'jwilliams@serenitycarepartners.com', isPrimary: false },
        { id: '4', name: 'Dr. Michael Chen', role: 'Supervising Physician', phone: '(513) 555-0200', isPrimary: false },
    ];

    const mockPreviousFeedback: FamilyFeedback[] = [
        { id: '1', type: 'compliment', message: 'Maria is wonderful with my father. She always goes above and beyond!', submittedAt: '2024-01-01', status: 'reviewed', response: 'Thank you for your kind words! We have shared your feedback with Maria.' },
    ];

    // Tab navigation
    const tabs: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
        { id: 'schedule', label: 'Schedule', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        { id: 'visits', label: 'Visit History', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        { id: 'care-plan', label: 'Care Plan', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
        { id: 'care-team', label: 'Care Team', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        { id: 'feedback', label: 'Feedback', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
        { id: 'referral', label: 'Refer a Friend', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    ];

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackSubmitted(true);
        setTimeout(() => {
            setFeedbackSubmitted(false);
            setFeedbackMessage('');
        }, 3000);
    };

    // Authenticated - Show Portal Dashboard
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                        </Link>
                        <span className="text-2xl font-bold text-indigo-900">Serenity</span>
                        <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">Family Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm text-gray-600">Welcome, <strong>{familyUser?.name}</strong></p>
                            <p className="text-xs text-gray-500">Care for: {familyUser?.clientName}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {familyUser?.initials}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1 overflow-x-auto py-2" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Upcoming Care Schedule</h2>
                            <span className="text-sm text-gray-500">{familyUser?.clientName}'s Schedule</span>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                            {mockUpcomingSchedule.map((visit) => (
                                <div key={visit.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[70px]">
                                                <div className="text-xs text-gray-500 font-medium uppercase">{visit.date}</div>
                                                <div className="text-sm font-semibold text-gray-900">{visit.startTime}</div>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {visit.caregiverInitials}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{visit.caregiverName}</div>
                                                <div className="text-xs text-gray-500">{visit.services.join(' • ')}</div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            visit.status === 'in_progress' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {visit.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Need a Change Card */}
                        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl shadow-lg p-6 text-white">
                            <h3 className="text-lg font-bold mb-2">Need to Make a Change?</h3>
                            <p className="text-indigo-100 text-sm mb-4">Contact your Care Coordinator to request schedule changes, add services, or discuss any care needs.</p>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="tel:+15134005113"
                                    className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition inline-flex items-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call (513) 400-5113
                                </a>
                                <a
                                    href="mailto:care@serenitycarepartners.com"
                                    className="bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition border border-indigo-600 text-sm"
                                >
                                    Send Email
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visit History Tab */}
                {activeTab === 'visits' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Visit History</h2>
                            <span className="text-sm text-gray-500">Recent care visits for {familyUser?.clientName}</span>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                            {mockVisitHistory.map((visit) => (
                                <div key={visit.id} className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {visit.caregiverInitials}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{visit.caregiverName}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(visit.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {visit.startTime} - {visit.endTime}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {visit.rating && (
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-4 h-4 ${i < visit.rating! ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            )}
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                Completed
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {visit.services.map((service, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                    {visit.notes && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-sm text-gray-600 font-medium mb-1">Visit Notes:</p>
                                            <p className="text-sm text-gray-700">{visit.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Visit notes contain general care observations appropriate for family viewing.
                            Detailed clinical notes are maintained in the client's medical record.
                        </p>
                    </div>
                )}

                {/* Care Plan Tab */}
                {activeTab === 'care-plan' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Care Plan Overview</h2>
                            <span className="text-sm text-gray-500">Goals for {familyUser?.clientName}</span>
                        </div>

                        {/* Care Plan Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-pink-100 rounded-xl">
                                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Personalized Care Plan</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        This care plan is designed with {familyUser?.clientName}'s specific needs and preferences in mind.
                                        Our team works together to ensure these goals are achieved.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Plan Start</p>
                                    <p className="font-medium text-gray-900">Jan 1, 2024</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Last Review</p>
                                    <p className="font-medium text-gray-900">Dec 15, 2024</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Next Review</p>
                                    <p className="font-medium text-gray-900">Mar 15, 2025</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Service Hours</p>
                                    <p className="font-medium text-gray-900">40 hrs/week</p>
                                </div>
                            </div>
                        </div>

                        {/* Care Goals */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Care Goals</h3>
                            <div className="space-y-4">
                                {mockCarePlanGoals.map((goal) => (
                                    <div key={goal.id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-lg">
                                        <div className={`mt-0.5 p-1 rounded-full ${
                                            goal.progress === 'achieved' ? 'bg-green-100' :
                                            goal.progress === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                                        }`}>
                                            {goal.progress === 'achieved' ? (
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{goal.category}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    goal.progress === 'achieved' ? 'bg-green-100 text-green-700' :
                                                    goal.progress === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {goal.progress === 'achieved' ? 'Achieved' : goal.progress === 'in_progress' ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{goal.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            This is a family-friendly summary of the care plan.
                            For detailed clinical information, please contact your Care Coordinator.
                        </p>
                    </div>
                )}

                {/* Care Team Tab */}
                {activeTab === 'care-team' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{familyUser?.clientName}'s Care Team</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockCareTeam.map((member) => (
                                <div key={member.id} className={`bg-white rounded-xl shadow-sm border p-5 ${member.isPrimary ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm ${
                                            member.isPrimary ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                                {member.isPrimary && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{member.role}</p>
                                            <div className="mt-3 space-y-1">
                                                {member.phone && (
                                                    <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {member.phone}
                                                    </a>
                                                )}
                                                {member.email && (
                                                    <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {member.email}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Emergency Contacts */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                            <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Emergency Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-red-800 font-medium">For Medical Emergencies</p>
                                    <p className="text-sm text-red-700">Call 911 immediately</p>
                                </div>
                                <div>
                                    <p className="text-sm text-red-800 font-medium">After-Hours Care Line</p>
                                    <a href="tel:+15134005113" className="text-sm text-red-700 hover:underline">(513) 400-5113</a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Submit Feedback Form */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Your Feedback</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Your feedback helps us improve care for {familyUser?.clientName} and all our clients.
                            </p>

                            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type of Feedback</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFeedbackType('compliment')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                                feedbackType === 'compliment'
                                                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                            }`}
                                        >
                                            Compliment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFeedbackType('concern')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                                feedbackType === 'concern'
                                                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                            }`}
                                        >
                                            Concern
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFeedbackType('suggestion')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                                feedbackType === 'suggestion'
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                            }`}
                                        >
                                            Suggestion
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                                    <textarea
                                        rows={4}
                                        value={feedbackMessage}
                                        onChange={(e) => setFeedbackMessage(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder={
                                            feedbackType === 'compliment' ? "Tell us what's going well..." :
                                            feedbackType === 'concern' ? "Share your concern so we can address it..." :
                                            "Share your ideas for improvement..."
                                        }
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={feedbackSubmitted}
                                    className={`w-full py-3 rounded-lg font-medium transition ${
                                        feedbackSubmitted
                                            ? 'bg-green-600 text-white'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {feedbackSubmitted ? 'Thank You!' : 'Submit Feedback'}
                                </button>
                            </form>
                        </div>

                        {/* Previous Feedback */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Previous Feedback</h2>

                            {mockPreviousFeedback.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No previous feedback submitted.</p>
                            ) : (
                                <div className="space-y-4">
                                    {mockPreviousFeedback.map((feedback) => (
                                        <div key={feedback.id} className="border border-gray-100 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    feedback.type === 'compliment' ? 'bg-green-100 text-green-700' :
                                                    feedback.type === 'concern' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(feedback.submittedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2">{feedback.message}</p>
                                            {feedback.response && (
                                                <div className="bg-gray-50 rounded p-3 mt-2">
                                                    <p className="text-xs text-gray-500 font-medium mb-1">Response from Serenity Care:</p>
                                                    <p className="text-sm text-gray-700">{feedback.response}</p>
                                                </div>
                                            )}
                                            <div className="mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    feedback.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                    feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Referral Tab */}
                {activeTab === 'referral' && (
                    <div className="max-w-xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-purple-100 text-purple-600 mb-4">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Share the Care</h2>
                                <p className="text-gray-600 mt-2">
                                    Know someone who could benefit from quality home care? Refer them to Serenity and receive
                                    <span className="font-semibold text-purple-600"> 4 hours of respite care credit</span> when they become a client.
                                </p>
                            </div>

                            <form onSubmit={handleReferralSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Friend's Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={referralForm.friendName}
                                        onChange={(e) => setReferralForm({ ...referralForm, friendName: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Friend's Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={referralForm.friendPhone}
                                        onChange={(e) => setReferralForm({ ...referralForm, friendPhone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Friend's Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={referralForm.friendEmail}
                                        onChange={(e) => setReferralForm({ ...referralForm, friendEmail: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                                    <textarea
                                        rows={3}
                                        value={referralForm.note}
                                        onChange={(e) => setReferralForm({ ...referralForm, note: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Any specific needs or best time to call?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={referralMutation.isPending || isSubmitted}
                                    className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                                        isSubmitted
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
                                    }`}
                                >
                                    {referralMutation.isPending ? 'Sending...' : isSubmitted ? 'Referral Sent!' : 'Send Referral'}
                                </button>
                            </form>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Your referral's information will only be used to contact them about Serenity Care services.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
