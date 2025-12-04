import React from 'react';
import { Link } from 'react-router-dom';

export default function HIPAAPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100 border-b border-warm-gray-200">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif text-warm-gray-900 mb-4 tracking-tight">
                        HIPAA Compliance
                    </h1>
                    <p className="text-warm-gray-600 text-lg">
                        Notice of Privacy Practices
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">
                        <p className="lead text-xl text-warm-gray-700 mb-8">
                            THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Our Commitment to Your Privacy</h2>
                        <p>
                            Serenity Care Partners is dedicated to maintaining the privacy of your protected health information (PHI). In conducting our business, we will create records regarding you and the treatment and services we provide to you. We are required by law to maintain the confidentiality of health information that identifies you.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">How We May Use and Disclose Your PHI</h2>
                        <p>
                            The following categories describe the different ways in which we may use and disclose your PHI:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Treatment:</strong> We may use your PHI to treat you. For example, we may ask you to undergo tests, or we may use your PHI to write a prescription for you.</li>
                            <li><strong>Payment:</strong> We may use and disclose your PHI in order to bill and collect payment for the services and items you may receive from us.</li>
                            <li><strong>Health Care Operations:</strong> We may use and disclose your PHI to operate our business. As examples of the ways in which we may use and disclose your information for our operations, our agency may use your PHI to evaluate the quality of care you received from us, or to conduct cost-management and business planning activities for our agency.</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Your Rights Regarding Your PHI</h2>
                        <p>
                            You have the following rights regarding the PHI that we maintain about you:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Confidential Communications:</strong> You have the right to request that our agency communicate with you about your health and related issues in a particular manner or at a certain location.</li>
                            <li><strong>Requesting Restrictions:</strong> You have the right to request a restriction in our use or disclosure of your PHI for treatment, payment, or health care operations.</li>
                            <li><strong>Inspection and Copies:</strong> You have the right to inspect and obtain a copy of the PHI that may be used to make decisions about you, including patient medical records and billing records.</li>
                            <li><strong>Amendment:</strong> You may ask us to amend your health information if you believe it is incorrect or incomplete.</li>
                            <li><strong>Accounting of Disclosures:</strong> You have the right to request an "accounting of disclosures." An "accounting of disclosures" is a list of certain non-routine disclosures our agency has made of your PHI.</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Complaints</h2>
                        <p>
                            If you believe your privacy rights have been violated, you may file a complaint with our agency or with the Secretary of the Department of Health and Human Services. To file a complaint with our agency, contact our Privacy Officer. All complaints must be submitted in writing. You will not be penalized for filing a complaint.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Contact Information</h2>
                        <p>
                            For more information about our privacy practices, or to exercise your rights, please contact:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners</p>
                            <p className="text-warm-gray-700">Attn: Privacy Officer</p>
                            <p className="text-warm-gray-700">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
