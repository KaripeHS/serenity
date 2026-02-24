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
                        Effective Date: December 1, 2025 | Last Updated: December 2025
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">

                        <p className="lead text-xl text-warm-gray-700 mb-8">
                            Welcome to Serenity Care Partners. These Terms of Service ("Terms") govern your use of our website serenitycarepartners.com (the "Site") and describe the terms under which Serenity Care Partners ("we," "us," or "our") provides information about our non-medical home health care services.
                        </p>

                        {/* Important Healthcare Disclaimer */}
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl mb-8">
                            <h3 className="text-lg font-bold text-amber-800 mb-2 mt-0">Important Healthcare Disclaimer</h3>
                            <p className="text-amber-900 mb-0">
                                Serenity Care Partners provides <strong>non-medical home health care services</strong> only. We do not provide medical care, nursing services, medical diagnoses, or medical treatment. Our services include personal care assistance, homemaker services, companionship, and respite care. For medical emergencies, call 911 immediately. For medical advice, consult a licensed healthcare provider.
                            </p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using this Site, you agree to be bound by these Terms and our <Link to="/privacy" className="text-serenity-green-600 hover:underline">Privacy Policy</Link>. If you do not agree to these Terms, you must not access or use the Site. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Site following any modifications constitutes acceptance of the modified Terms.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">2. Description of Services</h2>
                        <p>
                            Serenity Care Partners is a licensed non-medical home health care agency providing services in Greater Cincinnati, Ohio. Through this Site, we provide:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Information about our non-medical home care services</li>
                            <li>Client referral submission forms</li>
                            <li>Employment application submissions</li>
                            <li>Contact and inquiry forms</li>
                            <li>Educational content about home care</li>
                        </ul>
                        <p>
                            <strong>Services We Provide:</strong> Personal care assistance, homemaker services, companionship, respite care, and related non-medical support services.
                        </p>
                        <p>
                            <strong>Services We Do NOT Provide:</strong> Medical care, nursing services, medication administration (except reminders), physical therapy, occupational therapy, speech therapy, medical diagnoses, or any services requiring a medical license.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">3. Not Medical Advice</h2>
                        <p>
                            The information provided on this Site is for general informational purposes only and is not intended as, and shall not be understood or construed as, medical advice, diagnosis, or treatment. The Site does not provide medical or healthcare services and is not a substitute for professional medical advice, diagnosis, or treatment.
                        </p>
                        <p>
                            <strong>Always seek the advice of your physician or other qualified healthcare provider</strong> with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this Site.
                        </p>
                        <p>
                            <strong>If you think you may have a medical emergency, call your doctor or 911 immediately.</strong> Serenity Care Partners does not recommend or endorse any specific tests, physicians, products, procedures, opinions, or other information that may be mentioned on the Site.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">4. Use of the Site</h2>
                        <p>
                            You may use this Site only for lawful purposes and in accordance with these Terms. You agree not to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Use the Site in any way that violates any applicable federal, state, local, or international law or regulation</li>
                            <li>Submit false, misleading, or fraudulent information through any forms</li>
                            <li>Impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
                            <li>Attempt to gain unauthorized access to any portion of the Site or any systems connected to the Site</li>
                            <li>Use any robot, spider, or other automatic device to access the Site</li>
                            <li>Introduce any viruses, malware, or other harmful material</li>
                            <li>Interfere with or disrupt the Site or servers or networks connected to the Site</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">5. User Submissions</h2>
                        <p>
                            When you submit information through our Site (including contact forms, referral forms, or job applications), you represent and warrant that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>All information you provide is true, accurate, and complete</li>
                            <li>You have the right and authority to submit such information</li>
                            <li>Your submission does not violate any applicable laws or third-party rights</li>
                        </ul>
                        <p>
                            We reserve the right to refuse or remove any submission that violates these Terms or that we deem inappropriate.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">6. Intellectual Property</h2>
                        <p>
                            The Site and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Serenity Care Partners, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                        </p>
                        <p>
                            You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Site without our prior written consent, except that you may print or download one copy of materials for your own non-commercial, personal use.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">7. Disclaimer of Warranties</h2>
                        <p>
                            THE SITE AND ALL INFORMATION, CONTENT, MATERIALS, AND SERVICES PROVIDED ON THE SITE ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                        </p>
                        <p>
                            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SERENITY CARE PARTNERS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                            <li>WARRANTIES THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS</li>
                            <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY INFORMATION ON THE SITE</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">8. Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SERENITY CARE PARTNERS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                            <li>LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
                            <li>DAMAGES RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE SITE</li>
                            <li>DAMAGES RESULTING FROM ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SITE</li>
                            <li>DAMAGES RESULTING FROM UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
                        </ul>
                        <p>
                            THE FOREGOING LIMITATIONS APPLY WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                        </p>
                        <p>
                            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE OF THE SITE EXCEED ONE HUNDRED DOLLARS ($100).
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">9. Indemnification</h2>
                        <p>
                            You agree to indemnify, defend, and hold harmless Serenity Care Partners and its officers, directors, employees, agents, affiliates, successors, and assigns from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including but not limited to attorney's fees) arising from:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Your use of and access to the Site</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party right, including any intellectual property, privacy, or proprietary right</li>
                            <li>Any claim that your submissions caused damage to a third party</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">10. Dispute Resolution</h2>
                        <p>
                            <strong>Governing Law:</strong> These Terms and any dispute arising out of or related to these Terms or the Site shall be governed by and construed in accordance with the laws of the State of Ohio, without regard to its conflict of law provisions.
                        </p>
                        <p>
                            <strong>Informal Resolution:</strong> Before filing any formal legal action, you agree to first contact us and attempt to resolve any dispute informally by sending a written notice to Hello@serenitycarepartners.com describing the nature of your claim and the relief sought. We will attempt to resolve the dispute within 30 days.
                        </p>
                        <p>
                            <strong>Venue:</strong> Any legal action or proceeding arising out of or relating to these Terms shall be brought exclusively in the state or federal courts located in Hamilton County, Ohio. You consent to the personal jurisdiction and venue of such courts.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">11. Service Area Limitations</h2>
                        <p>
                            Serenity Care Partners is licensed to provide non-medical home health care services only within our designated service area in Greater Cincinnati, Ohio, which includes Hamilton, Butler, Warren, and Clermont counties. Information on this Site regarding our services is applicable only within this service area.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">12. No Professional Relationship</h2>
                        <p>
                            Use of this Site does not create a caregiver-client relationship, employment relationship, or any other professional relationship between you and Serenity Care Partners. Such relationships are only established through formal written agreements.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">13. Third-Party Links</h2>
                        <p>
                            The Site may contain links to third-party websites or resources. These links are provided for your convenience only. We have no control over the contents of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them. If you access any third-party website, you do so entirely at your own risk.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">14. Accessibility</h2>
                        <p>
                            We are committed to making our Site accessible to all users. If you experience any accessibility issues, please contact us so we can work to address them. For more information, see our <Link to="/accessibility" className="text-serenity-green-600 hover:underline">Accessibility Statement</Link>.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">15. Severability</h2>
                        <p>
                            If any provision of these Terms is held by a court of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be modified to the minimum extent necessary to make it valid, legal, and enforceable, and the remaining provisions of these Terms will continue in full force and effect.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">16. Entire Agreement</h2>
                        <p>
                            These Terms, together with our Privacy Policy and any other legal notices published by us on the Site, constitute the entire agreement between you and Serenity Care Partners concerning your use of the Site. These Terms supersede all prior agreements or understandings regarding the Site.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">17. Waiver</h2>
                        <p>
                            No waiver by Serenity Care Partners of any term or condition set out in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">18. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms of Service, please contact us:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners</p>
                            <p className="text-warm-gray-700">Blue Ash, Ohio</p>
                            <p className="text-warm-gray-700 mt-2">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>

                        <div className="mt-12 pt-8 border-t border-warm-gray-200">
                            <p className="text-warm-gray-500 text-sm">
                                These Terms of Service were last updated in December 2025.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
