import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100 border-b border-warm-gray-200">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif text-warm-gray-900 mb-4 tracking-tight">
                        Terms of Service
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
                            Welcome to Serenity Care Partners. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions of use.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">1. Acceptance of Terms</h2>
                        <p>
                            By accessing this website, you are agreeing to be bound by these website Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">2. Use License</h2>
                        <p>
                            Permission is granted to temporarily download one copy of the materials (information or software) on Serenity Care Partners' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Modify or copy the materials;</li>
                            <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>Attempt to decompile or reverse engineer any software contained on Serenity Care Partners' website;</li>
                            <li>Remove any copyright or other proprietary notations from the materials; or</li>
                            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">3. Disclaimer</h2>
                        <p>
                            The materials on Serenity Care Partners' website are provided "as is". Serenity Care Partners makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">4. Limitations</h2>
                        <p>
                            In no event shall Serenity Care Partners or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Serenity Care Partners' Internet site, even if Serenity Care Partners or a Serenity Care Partners authorized representative has been notified orally or in writing of the possibility of such damage.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">5. Revisions and Errata</h2>
                        <p>
                            The materials appearing on Serenity Care Partners' website could include technical, typographical, or photographic errors. Serenity Care Partners does not warrant that any of the materials on its website are accurate, complete, or current. Serenity Care Partners may make changes to the materials contained on its website at any time without notice.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">6. Governing Law</h2>
                        <p>
                            Any claim relating to Serenity Care Partners' website shall be governed by the laws of the State of Ohio without regard to its conflict of law provisions.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">7. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms of Service, please contact us at:
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
