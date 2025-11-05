'use client';

import { useState } from 'react';
import { Button } from '../components/Button';

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 lg:p-12 text-center fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We've received your request for care information. A member of our team will contact you within 24 hours to discuss your needs and answer any questions.
          </p>
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-6 mb-8 text-left">
            <p className="text-green-900 font-semibold mb-4 text-lg">What happens next?</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>We'll review your request and verify insurance coverage</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>A care coordinator will call you to discuss your loved one's needs</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>We'll schedule a free in-home assessment if appropriate</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>You'll meet your dedicated pod team before care begins</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-gray-700 font-semibold text-lg">
              Need immediate assistance?
            </p>
            <a href="tel:1-800-555-0100">
              <Button size="lg" variant="primary">
                Call: 1-800-555-0100
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 fade-in">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">We're Here to Help</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
                <span className="text-gray-900">Request Care</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Information
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                Complete the form below and we'll contact you within 24 hours to discuss your care needs and answer any questions.
              </p>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative h-[500px] lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 rounded-3xl shadow-2xl hover-lift overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop"
                  alt="Friendly healthcare professional ready to help patients"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Phone</h3>
              <a href="tel:1-800-555-0100" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                1-800-555-0100
              </a>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Email</h3>
              <a href="mailto:info@serenitycarepartners.com" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                info@serenitycarepartners.com
              </a>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Office Hours</h3>
              <p className="text-gray-600">Monday-Friday<br />8:00 AM - 6:00 PM EST</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Credentials Section with Images */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Families Trust Us</h2>
              <p className="text-xl text-gray-600">
                Licensed, insured, and dedicated to exceptional patient care
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-72 fade-in">
                <img
                  src="https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?q=80&w=1000&auto=format&fit=crop"
                  alt="Professional healthcare team meeting with family"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-72 fade-in" style={{ animationDelay: '100ms' }}>
                <img
                  src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1000&auto=format&fit=crop"
                  alt="Caregiver providing compassionate support"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Patient Referral Form</h2>
              <p className="text-gray-600">All fields marked with * are required</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Referral Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  I am a: *
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="referralType"
                      value="patient"
                      checked={formData.referralType === 'patient'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Patient</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="referralType"
                      value="family"
                      checked={formData.referralType === 'family'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Family Member</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="referralType"
                      value="provider"
                      checked={formData.referralType === 'provider'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Healthcare Provider</span>
                  </label>
                </div>
              </div>

              {/* Patient Information */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="font-bold text-xl mb-6 text-gray-900">Patient Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="patientFirstName"
                      required
                      value={formData.patientFirstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="patientLastName"
                      required
                      value={formData.patientLastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="patientPhone"
                      required
                      value={formData.patientPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Insurance Type *
                    </label>
                    <select
                      name="insuranceType"
                      required
                      value={formData.insuranceType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="medicaid">Medicaid</option>
                      <option value="medicare">Medicare</option>
                      <option value="private">Private Insurance</option>
                      <option value="private-pay">Private Pay</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="patientAddress"
                    required
                    value={formData.patientAddress}
                    onChange={handleChange}
                    placeholder="Street, City, State, ZIP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Contact Person (if not patient) */}
              {formData.referralType !== 'patient' && (
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="font-bold text-xl mb-6 text-gray-900">Your Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="contactFirstName"
                        required
                        value={formData.contactFirstName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="contactLastName"
                        required
                        value={formData.contactLastName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="contactPhone"
                        required
                        value={formData.contactPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        required
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Relationship to Patient *
                    </label>
                    <input
                      type="text"
                      name="relationship"
                      required
                      value={formData.relationship}
                      onChange={handleChange}
                      placeholder="e.g., Daughter, Son, Spouse, Physician"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Care Needs */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="font-bold text-xl mb-6 text-gray-900">Care Needs</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Please describe the care needs: *
                    </label>
                    <textarea
                      name="careNeeds"
                      required
                      value={formData.careNeeds}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe the type of care needed, medical conditions, mobility limitations, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Urgency *
                      </label>
                      <select
                        name="urgency"
                        required
                        value={formData.urgency}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        <option value="routine">Routine (within 2 weeks)</option>
                        <option value="soon">Soon (within 1 week)</option>
                        <option value="urgent">Urgent (within 48 hours)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Contact Method *
                      </label>
                      <select
                        name="preferredContact"
                        required
                        value={formData.preferredContact}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
              <div className="border-t border-gray-200 pt-8">
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  fullWidth
                  className="text-lg"
                >
                  Submit Request
                </Button>
                <p className="text-sm text-gray-500 text-center mt-4">
                  By submitting this form, you consent to be contacted by Serenity Care Partners regarding your care needs.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
