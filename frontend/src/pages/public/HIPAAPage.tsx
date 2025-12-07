import { Link } from 'react-router-dom';

export default function HIPAAPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100 border-b border-warm-gray-200">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif text-warm-gray-900 mb-4 tracking-tight">
                        Notice of Privacy Practices
                    </h1>
                    <p className="text-warm-gray-600 text-lg">
                        Effective Date: December 1, 2025
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">

                        {/* Important Notice Box */}
                        <div className="bg-serenity-green-50 border-l-4 border-serenity-green-500 p-6 rounded-r-xl mb-8">
                            <p className="text-serenity-green-900 font-bold mb-2 text-lg">
                                THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION.
                            </p>
                            <p className="text-serenity-green-800 mb-0">
                                PLEASE REVIEW IT CAREFULLY.
                            </p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Our Commitment to Your Privacy</h2>
                        <p>
                            Serenity Care Partners is dedicated to maintaining the privacy of your protected health information (PHI). In conducting our business, we will create records regarding you and the services we provide to you. We are required by law to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Maintain the privacy of your PHI</li>
                            <li>Give you this Notice of our legal duties and privacy practices regarding your PHI</li>
                            <li>Follow the terms of this Notice currently in effect</li>
                            <li>Notify you if there is a breach of your unsecured PHI</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">How We May Use and Disclose Your PHI</h2>
                        <p>
                            The following categories describe the different ways we may use and disclose your PHI without your written authorization:
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Treatment</h3>
                        <p>
                            We may use your PHI to provide, coordinate, or manage your care and related services. For example, we may share information with caregivers providing your services, or coordinate care with other healthcare providers involved in your treatment.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Payment</h3>
                        <p>
                            We may use and disclose your PHI to bill and collect payment for the services you receive from us. For example, we may contact Medicaid or your insurance company to verify coverage, submit claims, or collect payment.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Health Care Operations</h3>
                        <p>
                            We may use and disclose your PHI for our business operations. These activities include, but are not limited to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Quality assessment and improvement activities</li>
                            <li>Employee review and training</li>
                            <li>Accreditation, certification, and licensing activities</li>
                            <li>Business planning and development</li>
                            <li>Conducting audits and compliance activities</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Other Uses and Disclosures Without Authorization</h3>
                        <p>
                            We may also use or disclose your PHI without your authorization in these situations:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>As Required by Law:</strong> When required by federal, state, or local law</li>
                            <li><strong>Public Health Activities:</strong> To report disease, injury, vital events, and to conduct public health surveillance, investigations, or interventions</li>
                            <li><strong>Abuse or Neglect:</strong> To report suspected abuse, neglect, or domestic violence to appropriate authorities</li>
                            <li><strong>Health Oversight Activities:</strong> To government agencies for audits, investigations, inspections, and licensure</li>
                            <li><strong>Legal Proceedings:</strong> In response to a court order, subpoena, or other lawful process</li>
                            <li><strong>Law Enforcement:</strong> For law enforcement purposes as permitted by law</li>
                            <li><strong>Coroners and Medical Examiners:</strong> To identify deceased persons or determine cause of death</li>
                            <li><strong>Organ Donation:</strong> To organ procurement organizations for tissue/organ donation</li>
                            <li><strong>Research:</strong> For research purposes under specific conditions</li>
                            <li><strong>Serious Threat to Health or Safety:</strong> To prevent or lessen a serious and imminent threat to a person or the public</li>
                            <li><strong>Workers' Compensation:</strong> As necessary for workers' compensation claims</li>
                            <li><strong>Military and Veterans:</strong> If you are a member of the armed forces, as required by military command authorities</li>
                            <li><strong>Inmates:</strong> If you are an inmate, to the correctional institution or law enforcement official</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Uses Requiring Your Written Authorization</h3>
                        <p>
                            We will not use or disclose your PHI for the following purposes without your written authorization:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Marketing:</strong> Using your PHI to communicate about products or services (with some exceptions)</li>
                            <li><strong>Sale of PHI:</strong> We will never sell your PHI</li>
                            <li><strong>Most uses of psychotherapy notes:</strong> If applicable</li>
                            <li><strong>Other uses and disclosures:</strong> Not described in this Notice</li>
                        </ul>
                        <p>
                            You may revoke any authorization you provide to us in writing at any time, except to the extent we have already taken action in reliance on your authorization.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Your Rights Regarding Your PHI</h2>
                        <p>
                            You have the following rights regarding the PHI we maintain about you:
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Right to Inspect and Copy</h3>
                        <p>
                            You have the right to inspect and obtain a copy of your PHI that may be used to make decisions about your care. This includes medical and billing records. To request access, submit your request in writing to our Privacy Officer. We may charge a reasonable fee for copies.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Right to Request Amendment</h3>
                        <p>
                            If you believe that PHI we have about you is incorrect or incomplete, you may request an amendment. To request an amendment, submit your request in writing to our Privacy Officer with a reason for the amendment. We may deny your request under certain circumstances.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Right to an Accounting of Disclosures</h3>
                        <p>
                            You have the right to request a list of disclosures we have made of your PHI, except for disclosures made for treatment, payment, healthcare operations, and certain other purposes. To request an accounting, submit your request in writing to our Privacy Officer.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Right to Request Restrictions</h3>
                        <p>
                            You have the right to request a restriction on the PHI we use or disclose about you for treatment, payment, or healthcare operations. We are not required to agree to your request, except we must agree to restrict disclosure to a health plan if you pay out of pocket in full for a service.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Right to Request Confidential Communications</h3>
                        <p>
                            You have the right to request that we communicate with you in a certain way or at a certain location. For example, you may request that we contact you only at work or only by mail. We will accommodate reasonable requests.
                        </p>

                        <h3 className="text-xl font-semibold text-warm-gray-800 mt-8 mb-4">Right to a Paper Copy of This Notice</h3>
                        <p>
                            You have the right to receive a paper copy of this Notice at any time, even if you have agreed to receive the Notice electronically. To obtain a paper copy, contact our Privacy Officer.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Personal Representatives</h2>
                        <p>
                            If you have a personal representative (such as a legal guardian, healthcare power of attorney, or authorized family member), that person may exercise your rights and make choices about your PHI. We will verify that the person has the authority to act on your behalf before taking action.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Minors</h2>
                        <p>
                            In most cases, a parent or guardian may exercise the privacy rights of a minor patient. However, there are exceptions under Ohio law where a minor may consent to certain types of healthcare without parental consent and control access to that information.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Breach Notification</h2>
                        <p>
                            We are required by law to maintain the security of your PHI. If there is a breach of your unsecured PHI, we will notify you as required by law. A breach is an impermissible use or disclosure that compromises the security or privacy of your PHI.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Changes to This Notice</h2>
                        <p>
                            We reserve the right to change the terms of this Notice at any time. Any changes will apply to all PHI we maintain, including information we created or received before the change. The new Notice will be available upon request, posted in our office, and on our website.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Complaints</h2>
                        <p>
                            If you believe your privacy rights have been violated, you have the right to file a complaint. You will not be penalized or retaliated against for filing a complaint.
                        </p>
                        <p>
                            <strong>To file a complaint with our agency:</strong>
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-4 mb-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners - Privacy Officer</p>
                            <p className="text-warm-gray-700">Blue Ash, Ohio</p>
                            <p className="text-warm-gray-700 mt-2">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>

                        <p>
                            <strong>To file a complaint with the federal government:</strong>
                        </p>
                        <div className="bg-warm-gray-50 p-6 rounded-xl border border-warm-gray-200 mt-4 mb-6">
                            <p className="font-semibold text-warm-gray-900">U.S. Department of Health and Human Services</p>
                            <p className="text-warm-gray-700">Office for Civil Rights</p>
                            <p className="text-warm-gray-700">200 Independence Avenue, SW</p>
                            <p className="text-warm-gray-700">Room 509F, HHH Building</p>
                            <p className="text-warm-gray-700">Washington, D.C. 20201</p>
                            <p className="text-warm-gray-700 mt-2">Phone: 1-877-696-6775</p>
                            <p className="text-warm-gray-700">Website: <a href="https://www.hhs.gov/ocr/privacy/hipaa/complaints/" target="_blank" rel="noopener noreferrer" className="text-serenity-green-600 hover:underline">www.hhs.gov/ocr/privacy/hipaa/complaints/</a></p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Contact Information</h2>
                        <p>
                            For more information about our privacy practices, to receive a copy of this Notice, or to exercise any of your rights, please contact:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners</p>
                            <p className="text-warm-gray-700">Attn: Privacy Officer</p>
                            <p className="text-warm-gray-700">Blue Ash, Ohio</p>
                            <p className="text-warm-gray-700 mt-2">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>

                        <div className="mt-12 pt-8 border-t border-warm-gray-200">
                            <p className="text-warm-gray-500 text-sm">
                                <strong>Effective Date:</strong> December 1, 2025<br />
                                This Notice was last updated in December 2025.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
