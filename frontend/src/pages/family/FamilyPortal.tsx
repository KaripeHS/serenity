import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export const FamilyPortal: React.FC = () => {
    const [referralForm, setReferralForm] = useState({
        friendName: '',
        friendPhone: '',
        friendEmail: '',
        note: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        referralMutation.mutate(referralForm);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-900">Serenity</span>
                        <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">Family Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Welcome, <strong>Sarah Miller</strong></span>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            SM
                        </div>
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
                                    { day: 'Today', date: 'Dec 01', time: '09:00 AM - 05:00 PM', caregiver: 'Maria R. (RN)', status: 'Active' },
                                    { day: 'Tomorrow', date: 'Dec 02', time: '09:00 AM - 05:00 PM', caregiver: 'Sarah J. (CNA)', status: 'Scheduled' },
                                    { day: 'Wednesday', date: 'Dec 03', time: '09:00 AM - 05:00 PM', caregiver: 'Sarah J. (CNA)', status: 'Scheduled' },
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
                            <div className="flex gap-4">
                                <button className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition">
                                    Call Care Manager
                                </button>
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

                            <form onSubmit={handleSubmit} className="space-y-4">
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
