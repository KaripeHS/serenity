import React from 'react';
import { Link } from 'react-router-dom';

export default function NonDiscriminationPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100 border-b border-warm-gray-200">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif text-warm-gray-900 mb-4 tracking-tight">
                        Non-Discrimination Policy
                    </h1>
                    <p className="text-warm-gray-600 text-lg">
                        Equal Access to Care for All
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="prose prose-lg prose-warm-gray mx-auto">

                        {/* Notice of Non-Discrimination */}
                        <div className="bg-serenity-green-50 border-l-4 border-serenity-green-500 p-6 rounded-r-xl mb-8">
                            <h2 className="text-xl font-bold text-serenity-green-800 mb-3 mt-0">Notice of Non-Discrimination</h2>
                            <p className="text-serenity-green-900 mb-0">
                                Serenity Care Partners complies with applicable Federal civil rights laws and does not discriminate on the basis of race, color, national origin, age, disability, or sex.
                            </p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Our Commitment</h2>
                        <p>
                            Serenity Care Partners is committed to providing equal access to quality home care services to all individuals. We do not exclude people or treat them differently because of:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Race</li>
                            <li>Color</li>
                            <li>National origin</li>
                            <li>Age</li>
                            <li>Disability</li>
                            <li>Sex</li>
                            <li>Sexual orientation</li>
                            <li>Gender identity</li>
                            <li>Religion</li>
                            <li>Marital status</li>
                            <li>Genetic information</li>
                            <li>Veteran status</li>
                            <li>Source of payment (Medicaid, private pay, insurance)</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Accessibility Services</h2>
                        <p>
                            Serenity Care Partners provides free aids and services to people with disabilities to communicate effectively with us, such as:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Qualified sign language interpreters</li>
                            <li>Written information in other formats (large print, audio, accessible electronic formats, other formats)</li>
                        </ul>
                        <p>
                            We also provide free language services to people whose primary language is not English, such as:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Qualified interpreters</li>
                            <li>Information written in other languages</li>
                        </ul>
                        <p>
                            If you need these services, please contact us at (513) 400-5113.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Filing a Grievance</h2>
                        <p>
                            If you believe that Serenity Care Partners has failed to provide these services or discriminated in another way on the basis of race, color, national origin, age, disability, or sex, you can file a grievance with:
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 mt-4 mb-6">
                            <p className="font-semibold text-warm-gray-900">Serenity Care Partners - Compliance Officer</p>
                            <p className="text-warm-gray-700">Email: <a href="mailto:Hello@serenitycarepartners.com" className="text-serenity-green-600 hover:underline">Hello@serenitycarepartners.com</a></p>
                            <p className="text-warm-gray-700">Phone: <a href="tel:+15134005113" className="text-serenity-green-600 hover:underline">(513) 400-5113</a></p>
                        </div>
                        <p>
                            You can file a grievance in person, by mail, fax, or email. If you need help filing a grievance, our Compliance Officer is available to help you.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Filing a Complaint with OCR</h2>
                        <p>
                            You can also file a civil rights complaint with the U.S. Department of Health and Human Services, Office for Civil Rights, electronically through the Office for Civil Rights Complaint Portal, available at <a href="https://ocrportal.hhs.gov/ocr/portal/lobby.jsf" target="_blank" rel="noopener noreferrer" className="text-serenity-green-600 hover:underline">https://ocrportal.hhs.gov/ocr/portal/lobby.jsf</a>, or by mail or phone at:
                        </p>
                        <div className="bg-warm-gray-50 p-6 rounded-xl border border-warm-gray-200 mt-4 mb-6">
                            <p className="font-semibold text-warm-gray-900">U.S. Department of Health and Human Services</p>
                            <p className="text-warm-gray-700">200 Independence Avenue, SW</p>
                            <p className="text-warm-gray-700">Room 509F, HHH Building</p>
                            <p className="text-warm-gray-700">Washington, D.C. 20201</p>
                            <p className="text-warm-gray-700 mt-2">Phone: 1-800-368-1019, 800-537-7697 (TDD)</p>
                        </div>
                        <p>
                            Complaint forms are available at <a href="http://www.hhs.gov/ocr/office/file/index.html" target="_blank" rel="noopener noreferrer" className="text-serenity-green-600 hover:underline">http://www.hhs.gov/ocr/office/file/index.html</a>.
                        </p>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Ohio Civil Rights Commission</h2>
                        <p>
                            You may also file a complaint with the Ohio Civil Rights Commission:
                        </p>
                        <div className="bg-warm-gray-50 p-6 rounded-xl border border-warm-gray-200 mt-4 mb-6">
                            <p className="font-semibold text-warm-gray-900">Ohio Civil Rights Commission</p>
                            <p className="text-warm-gray-700">30 East Broad Street, 5th Floor</p>
                            <p className="text-warm-gray-700">Columbus, Ohio 43215</p>
                            <p className="text-warm-gray-700 mt-2">Phone: 1-888-278-7101</p>
                            <p className="text-warm-gray-700">Website: <a href="https://crc.ohio.gov" target="_blank" rel="noopener noreferrer" className="text-serenity-green-600 hover:underline">crc.ohio.gov</a></p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Language Assistance</h2>
                        <p className="mb-4">
                            <strong>ATTENTION:</strong> If you speak a language other than English, language assistance services, free of charge, are available to you. Call (513) 400-5113.
                        </p>
                        <div className="bg-sage-50 p-6 rounded-xl border border-serenity-green-100 space-y-2 text-sm text-warm-gray-700">
                            <p><strong>Spanish:</strong> ATENCI&Oacute;N: si habla espa&ntilde;ol, tiene a su disposici&oacute;n servicios gratuitos de asistencia ling&uuml;&iacute;stica. Llame al (513) 400-5113.</p>
                            <p><strong>Chinese:</strong> &#27880;&#24847;&#65306;&#22914;&#26524;&#24744;&#20351;&#29992;&#32321;&#39636;&#20013;&#25991;&#65292;&#24744;&#21487;&#20197;&#20813;&#36027;&#29554;&#24471;&#35486;&#35328;&#25588;&#21161;&#26381;&#21209;&#12290;&#35531;&#33268;&#38651; (513) 400-5113.</p>
                            <p><strong>Arabic:</strong> &#1605;&#1604;&#1581;&#1608;&#1592;&#1577;: &#1573;&#1584;&#1575; &#1603;&#1606;&#1578; &#1578;&#1578;&#1581;&#1583;&#1579; &#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;&#1548; &#1601;&#1573;&#1606; &#1582;&#1583;&#1605;&#1575;&#1578; &#1575;&#1604;&#1605;&#1587;&#1575;&#1593;&#1583;&#1577; &#1575;&#1604;&#1604;&#1594;&#1608;&#1610;&#1577; &#1578;&#1578;&#1608;&#1601;&#1585; &#1604;&#1603; &#1576;&#1575;&#1604;&#1605;&#1580;&#1575;&#1606;. &#1575;&#1578;&#1589;&#1604; &#1576;&#1585;&#1602;&#1605; (513) 400-5113.</p>
                            <p><strong>Somali:</strong> DIGNIIN: Haddii aad ku hadasho Soomaali, adeegyada caawimada luqadda, oo bilaash ah, ayaad heli kartaa. Wac (513) 400-5113.</p>
                        </div>

                        <h2 className="text-2xl font-serif text-warm-gray-900 mt-12 mb-6">Legal References</h2>
                        <p>
                            This policy is in accordance with:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-warm-gray-700">
                            <li>Title VI of the Civil Rights Act of 1964</li>
                            <li>Section 504 of the Rehabilitation Act of 1973</li>
                            <li>The Age Discrimination Act of 1975</li>
                            <li>The Americans with Disabilities Act (ADA)</li>
                            <li>Section 1557 of the Affordable Care Act</li>
                            <li>Ohio Revised Code Chapter 4112</li>
                        </ul>

                        <div className="mt-12 pt-8 border-t border-warm-gray-200">
                            <p className="text-warm-gray-500 text-sm">
                                Effective Date: December 2025<br />
                                Last Reviewed: December 2025
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
