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
                        Effective Date: December 1, 2025 | Last Updated: December 2025
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">

                        {/* Important Notice Box */}
                        <div className="bg-serenity-green-50 border-l-4 border-serenity-green-500 p-6 rounded-r-xl mb-8">
                            <p className="text-serenity-green-900 mb-0">
                                <strong>Important:</strong> This Privacy Policy applies to information collected through our website. For information about how we handle Protected Health Information (PHI) in connection with our healthcare services, please see our <Link to="/hipaa" className="text-serenity-green-700 underline">HIPAA Notice of Privacy Practices</Link>.
                            </p>
                        </div>

                        <p className="lead text-xl text-warm-gray-700 mb-8">
                            At Serenity Care Partners ("we," "us," or "our"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website serenitycarepartners.com (the "Site").
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">1. Information We Collect</h2>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Personal Information You Provide</h3>
                        <p>
                            We collect personal information that you voluntarily provide when you:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Submit a contact form or request information about our services</li>
                            <li>Submit a patient referral form</li>
                            <li>Apply for employment or submit a job application</li>
                            <li>Sign up for newsletters or email communications</li>
                            <li>Communicate with us via email, phone, or other means</li>
                        </ul>
                        <p>
                            This information may include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Name (first and last)</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Mailing address</li>
                            <li>Employment history and qualifications (for job applicants)</li>
                            <li>Any other information you choose to provide</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Information Collected Automatically</h3>
                        <p>
                            When you visit our Site, we may automatically collect certain information, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>IP address and approximate geographic location</li>
                            <li>Browser type and version</li>
                            <li>Operating system</li>
                            <li>Pages viewed and time spent on pages</li>
                            <li>Referring website or source</li>
                            <li>Device type (desktop, mobile, tablet)</li>
                            <li>Date and time of visits</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Cookies and Tracking Technologies</h3>
                        <p>
                            We may use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities. Cookies are small data files stored on your device. You can control cookies through your browser settings, though disabling cookies may affect Site functionality.
                        </p>
                        <p>
                            We use:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Essential cookies:</strong> Required for basic Site functionality</li>
                            <li><strong>Analytics cookies:</strong> Help us understand how visitors use our Site</li>
                            <li><strong>Functional cookies:</strong> Remember your preferences</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">2. How We Use Your Information</h2>
                        <p>
                            We use the information we collect for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>To respond to your inquiries and provide requested information</li>
                            <li>To process and evaluate patient referrals</li>
                            <li>To process employment applications</li>
                            <li>To provide, maintain, and improve our services</li>
                            <li>To send you communications about our services (with your consent)</li>
                            <li>To analyze Site usage and improve user experience</li>
                            <li>To detect and prevent fraud or unauthorized access</li>
                            <li>To comply with legal obligations and regulatory requirements</li>
                            <li>To protect our rights, privacy, safety, or property</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">3. How We Share Your Information</h2>
                        <p>
                            We do not sell, trade, or rent your personal information to third parties for their marketing purposes. We may share your information in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Service Providers:</strong> We may share information with trusted third-party vendors who assist us in operating our Site, conducting our business, or providing services to you, subject to confidentiality agreements</li>
                            <li><strong>Legal Requirements:</strong> We may disclose information when required by law, subpoena, or other legal process, or to protect our rights or the safety of others</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
                            <li><strong>With Your Consent:</strong> We may share information for other purposes with your explicit consent</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Third-Party Service Providers</h3>
                        <p>
                            We work with the following types of service providers:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Website hosting and cloud infrastructure (Google Cloud Platform, Firebase)</li>
                            <li>Email communication services</li>
                            <li>Analytics services (Google Analytics)</li>
                            <li>Customer relationship management (CRM) systems</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">4. Data Retention</h2>
                        <p>
                            We retain personal information for as long as necessary to fulfill the purposes for which it was collected, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Contact inquiries:</strong> Up to 3 years after last interaction</li>
                            <li><strong>Job applications:</strong> Up to 2 years after application (unless hired)</li>
                            <li><strong>Patient referrals:</strong> Subject to HIPAA retention requirements</li>
                            <li><strong>Website analytics data:</strong> Up to 26 months</li>
                        </ul>
                        <p>
                            We may retain certain information longer as required by law or for legitimate business purposes.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">5. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational security measures to protect your personal information, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Encryption of data in transit (SSL/TLS)</li>
                            <li>Secure data storage with access controls</li>
                            <li>Regular security assessments</li>
                            <li>Employee training on data protection</li>
                        </ul>
                        <p>
                            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">6. Your Rights and Choices</h2>
                        <p>
                            You have certain rights regarding your personal information:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                            <li><strong>Cookies:</strong> Manage cookie preferences through your browser settings</li>
                        </ul>
                        <p>
                            To exercise these rights, please contact us using the information provided below.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">7. California Privacy Rights (CCPA)</h2>
                        <p>
                            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Right to Know:</strong> Request information about the categories and specific pieces of personal information we have collected</li>
                            <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                            <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (note: we do not sell personal information)</li>
                            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
                        </ul>
                        <p>
                            To submit a CCPA request, please contact us at Hello@serenitycarepartners.com or (513) 400-5113. We may need to verify your identity before processing your request.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">8. Children's Privacy</h2>
                        <p>
                            Our Site is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will take steps to delete such information.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">9. Third-Party Links</h2>
                        <p>
                            Our Site may contain links to third-party websites. We are not responsible for the privacy practices or content of these websites. We encourage you to read the privacy policies of any third-party sites you visit.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">10. Do Not Track Signals</h2>
                        <p>
                            Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want your online activity tracked. Our Site currently does not respond to DNT signals, as there is no industry standard for handling such signals.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">11. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will post any changes on this page with an updated "Last Updated" date. We encourage you to review this Privacy Policy periodically.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">12. Contact Us</h2>
                        <p>
                            If you have questions about this Privacy Policy, want to exercise your privacy rights, or have concerns about our data practices, please contact us:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners</p>
                            <p className="text-warm-gray-700">Attn: Privacy Inquiries</p>
                            <p className="text-warm-gray-700">Blue Ash, Ohio</p>
                            <p className="text-warm-gray-700 mt-2">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>

                        <div className="mt-12 pt-8 border-t border-warm-gray-200">
                            <p className="text-warm-gray-500 text-sm">
                                This Privacy Policy was last updated in December 2025.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
