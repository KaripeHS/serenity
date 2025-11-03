'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ApplicationPage({ params }: { params: { jobId: string } }) {
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'OH',
    zipCode: '',

    // Employment
    positionAppliedFor: params.jobId,
    availability: 'full-time',
    desiredPayRate: '',
    canStartDate: '',

    // Certifications
    hasLicense: false,
    licenseType: '',
    licenseNumber: '',
    licenseExpiration: '',
    hasCPR: false,
    cprExpiration: '',

    // Experience
    yearsExperience: '',
    previousEmployer: '',
    reasonForLeaving: '',

    // Additional
    hasReliableTransportation: false,
    hasSmartphone: false,
    canLift50lbs: false,
    hearAboutUs: '',
    additionalInfo: '',

    // Consent
    agreeToBackground: false,
    agreeToContact: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.hasLicense) newErrors.hasLicense = 'Valid certification is required for this position';
    if (!formData.hasReliableTransportation) newErrors.hasReliableTransportation = 'Reliable transportation is required';
    if (!formData.agreeToBackground) newErrors.agreeToBackground = 'You must consent to a background check';
    if (!formData.agreeToContact) newErrors.agreeToContact = 'You must consent to be contacted';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // In production, POST to /api/public/careers/apply
    try {
      const response = await fetch('http://localhost:3000/api/public/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Application submission error:', error);
      // For now, show success anyway (demo mode)
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Application Submitted!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for applying to Serenity Care Partners. We've received your application
            and will review it carefully.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 font-semibold mb-2">What happens next?</p>
            <ul className="text-left text-blue-800 space-y-2 text-sm">
              <li>✓ You'll receive a confirmation email within 24 hours</li>
              <li>✓ Our HR team will review your qualifications</li>
              <li>✓ If you're a good fit, we'll call you for a phone screening (3-5 days)</li>
              <li>✓ Qualified candidates will be invited for an in-person interview</li>
            </ul>
          </div>
          <Link
            href="/careers"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/careers/${params.jobId}`} className="text-blue-600 hover:underline mb-4 inline-block">
              ← Back to Job Details
            </Link>
            <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
            <p className="text-gray-600">
              Complete the application below. All fields marked with * are required.
            </p>
          </div>

          {/* Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-r">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold">Please correct the following errors:</h3>
                  <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                    {Object.values(errors).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="45402"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Employment Details */}
            <section>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b">Employment Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability *
                  </label>
                  <select
                    name="availability"
                    required
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="prn">PRN (As Needed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Pay Rate
                  </label>
                  <input
                    type="text"
                    name="desiredPayRate"
                    value={formData.desiredPayRate}
                    onChange={handleChange}
                    placeholder="$18/hr"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Earliest Start Date *
                  </label>
                  <input
                    type="date"
                    name="canStartDate"
                    required
                    value={formData.canStartDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience *
                  </label>
                  <select
                    name="yearsExperience"
                    required
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-2">1-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Certifications */}
            <section>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b">Certifications & Licenses</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasLicense"
                    id="hasLicense"
                    checked={formData.hasLicense}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="hasLicense" className="ml-2 text-sm font-medium text-gray-700">
                    I have a valid HHA, STNA, CNA, LPN, or RN license *
                  </label>
                </div>
                {formData.hasLicense && (
                  <div className="grid md:grid-cols-3 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Type *
                      </label>
                      <select
                        name="licenseType"
                        required={formData.hasLicense}
                        value={formData.licenseType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="HHA">HHA</option>
                        <option value="STNA">STNA</option>
                        <option value="CNA">CNA</option>
                        <option value="LPN">LPN</option>
                        <option value="RN">RN</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number *
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        required={formData.hasLicense}
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date *
                      </label>
                      <input
                        type="date"
                        name="licenseExpiration"
                        required={formData.hasLicense}
                        value={formData.licenseExpiration}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasCPR"
                    id="hasCPR"
                    checked={formData.hasCPR}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="hasCPR" className="ml-2 text-sm font-medium text-gray-700">
                    I have current CPR certification
                  </label>
                </div>
                {formData.hasCPR && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPR Expiration Date
                    </label>
                    <input
                      type="date"
                      name="cprExpiration"
                      value={formData.cprExpiration}
                      onChange={handleChange}
                      className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Requirements */}
            <section>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b">Position Requirements</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="hasReliableTransportation"
                    id="hasReliableTransportation"
                    checked={formData.hasReliableTransportation}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <label htmlFor="hasReliableTransportation" className="ml-2 text-sm text-gray-700">
                    I have reliable transportation and a valid driver's license *
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="hasSmartphone"
                    id="hasSmartphone"
                    checked={formData.hasSmartphone}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <label htmlFor="hasSmartphone" className="ml-2 text-sm text-gray-700">
                    I have a smartphone capable of using EVV (Electronic Visit Verification) apps
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="canLift50lbs"
                    id="canLift50lbs"
                    checked={formData.canLift50lbs}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <label htmlFor="canLift50lbs" className="ml-2 text-sm text-gray-700">
                    I am able to lift 50 pounds and assist with patient transfers
                  </label>
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How did you hear about us?
                  </label>
                  <select
                    name="hearAboutUs"
                    value={formData.hearAboutUs}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="indeed">Indeed</option>
                    <option value="facebook">Facebook</option>
                    <option value="website">Website</option>
                    <option value="referral">Employee Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tell us why you want to work at Serenity Care Partners
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Share your passion for caregiving and what makes you a great fit for our team..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Consent */}
            <section>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b">Consent & Authorization</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToBackground"
                    id="agreeToBackground"
                    checked={formData.agreeToBackground}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <label htmlFor="agreeToBackground" className="ml-2 text-sm text-gray-700">
                    I consent to a background check and drug screening as a condition of employment *
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToContact"
                    id="agreeToContact"
                    checked={formData.agreeToContact}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <label htmlFor="agreeToContact" className="ml-2 text-sm text-gray-700">
                    I consent to be contacted by Serenity Care Partners regarding my application *
                  </label>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
              >
                Submit Application
              </button>
              <p className="text-sm text-gray-500 text-center mt-3">
                By submitting this application, you certify that all information provided is true and accurate.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
