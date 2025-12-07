import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Login states
type AuthState = 'login' | 'magic-link-sent' | 'authenticated';

export const FamilyPortal: React.FC = () => {
    const [authState, setAuthState] = useState<AuthState>('login');
    const [email, setEmail] = useState('');
    const [familyUser, setFamilyUser] = useState<{ name: string; initials: string } | null>(null);

    const [referralForm, setReferralForm] = useState({
        friendName: '',
        friendPhone: '',
        friendEmail: '',
        note: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    // Magic link request mutation
    const magicLinkMutation = useMutation({
        mutationFn: async (email: string) => {
            // In production, this would call the backend API
            // For now, simulate the magic link flow
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { success: true };
        },
        onSuccess: () => {
            setAuthState('magic-link-sent');
        }
    });

    // Demo login for testing
    const handleDemoLogin = () => {
        setFamilyUser({ name: 'Sarah Miller', initials: 'SM' });
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
                        <span className="text-sm text-gray-600">Welcome, <strong>{familyUser?.name}</strong></span>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Care Schedule (Mock) */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Care Schedule</h2>
                            <div className="space-y-4">
                                {[
                                    { day: 'Today', date: 'Dec 06', time: '09:00 AM - 05:00 PM', caregiver: 'Maria R. (RN)', status: 'Active' },
                                    { day: 'Tomorrow', date: 'Dec 07', time: '09:00 AM - 05:00 PM', caregiver: 'Sarah J. (CNA)', status: 'Scheduled' },
                                    { day: 'Monday', date: 'Dec 09', time: '09:00 AM - 05:00 PM', caregiver: 'Sarah J. (CNA)', status: 'Scheduled' },
                                ].map((shift, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[60px]">
                                                <div className="text-xs text-gray-500 font-medium uppercase">{shift.day}</div>
                                                <div className="text-lg font-bold text-gray-900">{shift.date}</div>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200"></div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{shift.time}</div>
                                                <div className="text-sm text-gray-500">{shift.caregiver}</div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${shift.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
                                            }`}>
                                            {shift.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl shadow-lg p-8 text-white">
                            <h2 className="text-xl font-bold mb-2">Concierge Care Support</h2>
                            <p className="text-indigo-100 mb-6">Need to adjust the schedule or have a clinical question? Your Care Manager is available 24/7.</p>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="tel:+15134005113"
                                    className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition inline-flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call Care Manager
                                </a>
                                <button className="bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition border border-indigo-600">
                                    Send Message
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Referral Widget */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Share the Care</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Know a friend who needs exceptional care? Refer them to Serenity and earn <span className="font-semibold text-purple-600">4 hours of respite credit</span>.
                                </p>
                            </div>

                            <form onSubmit={handleReferralSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Friend's Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={referralForm.friendName}
                                        onChange={(e) => setReferralForm({ ...referralForm, friendName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Friend's Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={referralForm.friendPhone}
                                        onChange={(e) => setReferralForm({ ...referralForm, friendPhone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Friend's Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={referralForm.friendEmail}
                                        onChange={(e) => setReferralForm({ ...referralForm, friendEmail: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                                    <textarea
                                        rows={2}
                                        value={referralForm.note}
                                        onChange={(e) => setReferralForm({ ...referralForm, note: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        placeholder="Any specific needs?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={referralMutation.isPending || isSubmitted}
                                    className={`w-full py-2.5 rounded-lg font-medium text-white transition-all ${isSubmitted
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    {referralMutation.isPending ? 'Sending...' : isSubmitted ? 'Referral Sent!' : 'Send Referral'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
