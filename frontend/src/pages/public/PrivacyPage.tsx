import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100 border-b border-warm-gray-200">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif text-warm-gray-900 mb-4 tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-warm-gray-600 text-lg">
                        Last Updated: December 2025
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">
                        <p className="lead text-xl text-warm-gray-700 mb-8">
                            At Serenity Care Partners, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">1. Information We Collect</h2>
                        <p>
                            We may collect personal information that you voluntarily provide to us when you:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Request information about our services via our contact forms.</li>
                            <li>Apply for a career position with us.</li>
                            <li>Sign up for newsletters or updates.</li>
                            <li>Communicate with us via email or phone.</li>
                        </ul>
                        <p>
                            This information may include your name, email address, phone number, address, and any other details you choose to provide.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">2. How We Use Your Information</h2>
                        <p>
                            We use the information we collect for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>To provide and improve our home health care services.</li>
                            <li>To respond to your inquiries and requests.</li>
                            <li>To process job applications.</li>
                            <li>To communicate with you about updates, services, or news.</li>
                            <li>To comply with legal and regulatory obligations.</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">3. Information Sharing</h2>
                        <p>
                            We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers for the purposes outlined above.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">4. Data Security</h2>
                        <p>
                            We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Site.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">5. Your Rights</h2>
                        <p>
                            You have the right to request access to the personal information we hold about you and to ask for your data to be corrected or deleted. If you wish to exercise these rights, please contact us using the information below.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners</p>
                            <p className="text-warm-gray-700">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
