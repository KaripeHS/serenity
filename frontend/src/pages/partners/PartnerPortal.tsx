import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';

// Schema for referral submission
const referralSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    serviceInterest: z.string().min(1, 'Service interest is required'),
    notes: z.string().optional()
});

type ReferralFormValues = z.infer<typeof referralSchema>;

// Mock Partner ID for now (in a real app, this would come from auth context)
const MOCK_PARTNER_ID = '00000000-0000-0000-0000-000000000000';

export const PartnerPortal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ReferralFormValues>({
        resolver: zodResolver(referralSchema)
    });

    // Submit Referral Mutation
    const submitReferralMutation = useMutation({
        mutationFn: async (data: ReferralFormValues) => {
            const res = await fetch('/api/partners/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    partnerId: MOCK_PARTNER_ID
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to submit referral');
            }

            return res.json();
        },
        onSuccess: () => {
            alert('Referral submitted successfully!');
            reset();
            setActiveTab('track');
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        }
    });

    // Fetch Past Referrals
    const { data: referrals, isLoading } = useQuery({
        queryKey: ['partner-referrals', MOCK_PARTNER_ID],
        queryFn: async () => {
            const res = await fetch(`/api/partners/${MOCK_PARTNER_ID}/referrals`);
            if (!res.ok) throw new Error('Failed to fetch referrals');
            const json = await res.json();
            return json.data;
        },
        enabled: activeTab === 'track'
    });

    const onSubmit = (data: ReferralFormValues) => {
        submitReferralMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Serenity Partner Portal</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                        Welcome, Dr. Smith
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('submit')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'submit'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Submit New Referral
                    </button>
                    <button
                        onClick={() => setActiveTab('track')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'track'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Track Referrals
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'submit' ? (
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">New Client Referral</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        {...register('firstName')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Jane"
                                    />
                                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        {...register('lastName')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Doe"
                                    />
                                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        {...register('email')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="jane@example.com"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        {...register('phone')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="(555) 123-4567"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Interest</label>
                                <select
                                    {...register('serviceInterest')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Select a service...</option>
                                    <option value="24/7 Care">24/7 Live-in Care</option>
                                    <option value="Post-Op">Post-Operative Recovery</option>
                                    <option value="Companionship">Companionship & Transport</option>
                                    <option value="Dementia">Dementia/Alzheimer's Care</option>
                                </select>
                                {errors.serviceInterest && <p className="mt-1 text-sm text-red-600">{errors.serviceInterest.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes / Context</label>
                                <textarea
                                    {...register('notes')}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Please provide any relevant medical context or specific needs..."
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={submitReferralMutation.isPending}
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {submitReferralMutation.isPending ? 'Submitting...' : 'Submit Referral'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading referrals...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {referrals?.map((referral: any) => (
                                        <tr key={referral.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{referral.first_name} {referral.last_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{referral.service_interest}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${referral.status === 'converted' ? 'bg-green-100 text-green-800' :
                                                        referral.status === 'lost' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'}`}>
                                                    {referral.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(referral.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {referrals?.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                No referrals submitted yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
