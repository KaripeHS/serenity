'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    referralType: 'patient',
    patientFirstName: '',
    patientLastName: '',
    patientPhone: '',
    patientAddress: '',
    contactFirstName: '',
    contactLastName: '',
    contactPhone: '',
    contactEmail: '',
    relationship: '',
    insuranceType: 'medicaid',
    careNeeds: '',
    urgency: 'routine',
    preferredContact: 'phone',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would POST to backend API
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-6">
            We've received your request for care information. A member of our team will contact you
            within 24 hours to discuss your needs and answer any questions.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 font-semibold mb-2">What happens next?</p>
            <ul className="text-left text-blue-800 space-y-2 text-sm">
              <li>✓ We'll review your request and verify insurance coverage</li>
              <li>✓ A care coordinator will call you to discuss your loved one's needs</li>
              <li>✓ We'll schedule a free in-home assessment if appropriate</li>
              <li>✓ You'll meet your dedicated pod team before care begins</li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-gray-600">
              <strong>Need immediate assistance?</strong>
            </p>
            <a
              href="tel:1-800-555-0100"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Call: 1-800-555-0100
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Request Care Information</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Complete the form below and we'll contact you within 24 hours to discuss your care needs
            and answer any questions.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <a href="tel:1-800-555-0100" className="text-blue-600 hover:underline">
                1-800-555-0100
              </a>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Email</h3>
              <a href="mailto:info@serenitycarepartners.com" className="text-blue-600 hover:underline">
                info@serenitycarepartners.com
              </a>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Office Hours</h3>
              <p className="text-gray-600 text-sm">Monday-Friday<br />8:00 AM - 6:00 PM EST</p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Patient Referral Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Referral Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  I am a:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="referralType"
                      value="patient"
                      checked={formData.referralType === 'patient'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Patient
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="referralType"
                      value="family"
                      checked={formData.referralType === 'family'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Family Member
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="referralType"
                      value="provider"
                      checked={formData.referralType === 'provider'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Healthcare Provider
                  </label>
                </div>
              </div>

              {/* Patient Information */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">Patient Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="patientFirstName"
                      required
                      value={formData.patientFirstName}
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
                      name="patientLastName"
                      required
                      value={formData.patientLastName}
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
                      name="patientPhone"
                      required
                      value={formData.patientPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Type *
                    </label>
                    <select
                      name="insuranceType"
                      required
                      value={formData.insuranceType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="medicaid">Medicaid</option>
                      <option value="medicare">Medicare</option>
                      <option value="private">Private Insurance</option>
                      <option value="private-pay">Private Pay</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="patientAddress"
                    required
                    value={formData.patientAddress}
                    onChange={handleChange}
                    placeholder="Street, City, State, ZIP"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Person (if not patient) */}
              {formData.referralType !== 'patient' && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">Your Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="contactFirstName"
                        required
                        value={formData.contactFirstName}
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
                        name="contactLastName"
                        required
                        value={formData.contactLastName}
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
                        name="contactPhone"
                        required
                        value={formData.contactPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        required
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship to Patient *
                    </label>
                    <input
                      type="text"
                      name="relationship"
                      required
                      value={formData.relationship}
                      onChange={handleChange}
                      placeholder="e.g., Daughter, Son, Spouse, Physician"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Care Needs */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">Care Needs</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Please describe the care needs: *
                    </label>
                    <textarea
                      name="careNeeds"
                      required
                      value={formData.careNeeds}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe the type of care needed, medical conditions, mobility limitations, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency *
                      </label>
                      <select
                        name="urgency"
                        required
                        value={formData.urgency}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="routine">Routine (within 2 weeks)</option>
                        <option value="soon">Soon (within 1 week)</option>
                        <option value="urgent">Urgent (within 48 hours)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Contact Method *
                      </label>
                      <select
                        name="preferredContact"
                        required
                        value={formData.preferredContact}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="either">Either</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-6">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
                >
                  Submit Request
                </button>
                <p className="text-sm text-gray-500 text-center mt-3">
                  By submitting this form, you consent to be contacted by Serenity Care Partners
                  regarding your care needs.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
