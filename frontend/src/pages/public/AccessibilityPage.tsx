import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100 border-b border-warm-gray-200">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif text-warm-gray-900 mb-4 tracking-tight">
                        Accessibility Statement
                    </h1>
                    <p className="text-warm-gray-600 text-lg">
                        Our Commitment to Digital Accessibility
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">

                        <p className="lead text-xl text-warm-gray-700 mb-8">
                            Serenity Care Partners is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Our Commitment</h2>
                        <p>
                            We strive to ensure that our website is accessible to all individuals, including those with:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Visual impairments (blindness, low vision, color blindness)</li>
                            <li>Hearing impairments (deafness, hard of hearing)</li>
                            <li>Motor impairments (limited fine motor control, muscle slowness)</li>
                            <li>Cognitive impairments (dyslexia, attention deficit disorders, memory impairments)</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Accessibility Standards</h2>
                        <p>
                            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines explain how to make web content more accessible for people with disabilities. Conformance with these guidelines helps make the web more user-friendly for everyone.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Measures We Take</h2>
                        <p>
                            To help ensure accessibility, we:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Use semantic HTML markup to ensure proper document structure</li>
                            <li>Provide alternative text for images</li>
                            <li>Ensure sufficient color contrast between text and backgrounds</li>
                            <li>Make all functionality available from a keyboard</li>
                            <li>Provide visible focus indicators for interactive elements</li>
                            <li>Use clear and consistent navigation</li>
                            <li>Provide descriptive link text</li>
                            <li>Ensure forms are properly labeled</li>
                            <li>Design responsive pages that work across different devices</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Assistive Technologies</h2>
                        <p>
                            Our website is designed to be compatible with the following assistive technologies:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Screen readers (such as JAWS, NVDA, VoiceOver)</li>
                            <li>Screen magnification software</li>
                            <li>Speech recognition software</li>
                            <li>Keyboard-only navigation</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Known Limitations</h2>
                        <p>
                            Despite our best efforts to ensure accessibility of our website, there may be some limitations. Below is a description of known limitations:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li><strong>Third-party content:</strong> Some third-party content or plugins may not be fully accessible</li>
                            <li><strong>PDF documents:</strong> Some older PDF documents may not be fully accessible. We are working to make all documents accessible</li>
                            <li><strong>Maps:</strong> Interactive maps may present challenges for some assistive technologies</li>
                        </ul>
                        <p>
                            We are actively working to address these limitations and improve accessibility across all our digital properties.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Alternative Formats</h2>
                        <p>
                            If you need information from our website in an alternative format, please contact us. We can provide:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Large print documents</li>
                            <li>Information read over the phone</li>
                            <li>Information in other accessible formats upon request</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Feedback and Contact</h2>
                        <p>
                            We welcome your feedback on the accessibility of our website. If you encounter any accessibility barriers or have suggestions for improvement, please let us know:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-6 mb-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners</p>
                            <p className="text-warm-gray-700">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>
                        <p>
                            We try to respond to accessibility feedback within 2 business days and to propose a solution within 10 business days.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Enforcement Procedures</h2>
                        <p>
                            If you are not satisfied with our response to your accessibility concern, you may contact:
                        </p>
                        <div className="bg-warm-gray-50 p-6 rounded-xl border border-warm-gray-200 mt-4 mb-6">
                            <p className="font-semibold text-warm-gray-900">U.S. Department of Justice</p>
                            <p className="text-warm-gray-700">Civil Rights Division</p>
                            <p className="text-warm-gray-700">950 Pennsylvania Avenue, NW</p>
                            <p className="text-warm-gray-700">Washington, DC 20530</p>
                            <p className="text-warm-gray-700 mt-2">ADA Information Line: 1-800-514-0301 (voice) / 1-800-514-0383 (TTY)</p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Legal Compliance</h2>
                        <p>
                            This accessibility statement is provided in accordance with:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Americans with Disabilities Act (ADA)</li>
                            <li>Section 508 of the Rehabilitation Act</li>
                            <li>Ohio Revised Code accessibility requirements</li>
                        </ul>

                        <div className="mt-12 pt-8 border-t border-warm-gray-200">
                            <p className="text-warm-gray-500 text-sm">
                                This statement was last updated in December 2025.<br />
                                We review and update this statement annually or as needed.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
