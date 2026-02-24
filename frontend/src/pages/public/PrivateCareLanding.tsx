import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define schema for lead capture form
const leadSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    serviceInterest: z.string().min(1, 'Please select a service'),
    notes: z.string().optional()
});

type LeadForm = z.infer<typeof leadSchema>;

export const PrivateCareLanding: React.FC = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LeadForm>({
        resolver: zodResolver(leadSchema)
    });

    const onSubmit = async (data: LeadForm) => {
        try {
            setError(null);
            const response = await fetch('/api/public/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, source: 'private-care-landing' })
            });

            if (!response.ok) throw new Error('Failed to submit request');

            setIsSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again or call us directly.');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center">
                            <span className="text-2xl font-serif font-bold text-gray-900">Serenity Private</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#services" className="text-gray-600 hover:text-gray-900 transition">Services</a>
                            <a href="#about" className="text-gray-600 hover:text-gray-900 transition">Our Standard</a>
                            <a href="#contact" className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition">
                                Request Consultation
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-90"></div>
                    {/* Abstract Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-50 blur-3xl opacity-50"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-gray-900 mb-8">
                        Concierge Home Care <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900 italic">
                            Redefined.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
                        Experience the peace of mind that comes with elite, private-duty home care and companionship.
                        Tailored exclusively for families who demand the exceptional.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <a href="#contact" className="px-8 py-4 bg-gray-900 text-white rounded-full text-lg font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Begin Your Journey
                        </a>
                        <a href="#services" className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full text-lg font-medium hover:bg-gray-50 transition">
                            Explore Services
                        </a>
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section id="about" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center p-8">
                            <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-3xl">
                                🛡️
                            </div>
                            <h3 className="text-xl font-bold mb-4">Uncompromising Privacy</h3>
                            <p className="text-gray-600">
                                Discreet, confidential care that respects your home and your lifestyle. strict HIPAA compliance and NDA-bound staff.
                            </p>
                        </div>
                        <div className="text-center p-8">
                            <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-3xl">
                                ⭐
                            </div>
                            <h3 className="text-xl font-bold mb-4">Elite Caregivers</h3>
                            <p className="text-gray-600">
                                Top 1% of talent. Our caregivers are rigorously vetted, highly trained, and selected for their emotional intelligence.
                            </p>
                        </div>
                        <div className="text-center p-8">
                            <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-3xl">
                                🕰️
                            </div>
                            <h3 className="text-xl font-bold mb-4">24/7 Concierge Access</h3>
                            <p className="text-gray-600">
                                Direct access to your dedicated Care Manager around the clock. We are there whenever you need us.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lead Capture Section */}
            <section id="contact" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                        <div className="p-12">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Request a Private Consultation</h2>
                                <p className="text-gray-600">
                                    Tell us about your needs. We will contact you within 2 hours to schedule a confidential consultation.
                                </p>
                            </div>

                            {isSubmitted ? (
                                <div className="text-center py-12 bg-green-50 rounded-xl">
                                    <div className="text-5xl mb-4">✨</div>
                                    <h3 className="text-2xl font-bold text-green-900 mb-2">Request Received</h3>
                                    <p className="text-green-700">
                                        Thank you for trusting Serenity Private. We will be in touch shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            <input
                                                {...register('firstName')}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                                                placeholder="Jane"
                                            />
                                            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            <input
                                                {...register('lastName')}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                                                placeholder="Doe"
                                            />
                                            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                            <input
                                                {...register('email')}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                                                placeholder="jane@example.com"
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                            <input
                                                {...register('phone')}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                                                placeholder="(555) 123-4567"
                                            />
                                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Interest</label>
                                        <select
                                            {...register('serviceInterest')}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                                        >
                                            <option value="">Select a service...</option>
                                            <option value="24/7 Care">24/7 Concierge Care</option>
                                            <option value="Post-Op">Post-Operative Companion Support</option>
                                            <option value="Dementia Care">Memory & Dementia Care</option>
                                            <option value="Companionship">Companionship & Travel</option>
                                            <option value="Other">Other / Custom Request</option>
                                        </select>
                                        {errors.serviceInterest && <p className="mt-1 text-sm text-red-600">{errors.serviceInterest.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                                        <textarea
                                            {...register('notes')}
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                                            placeholder="Please share any specific requirements or questions..."
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gray-900 text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Confidential Consultation'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-2xl font-serif font-bold mb-4">Serenity Private</p>
                    <p className="text-gray-400 mb-8">Excellence in Home Care. Unmatched Privacy.</p>
                    <div className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Serenity Care Partners. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};
