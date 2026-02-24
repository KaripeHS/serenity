/**
 * Contact Page
 * Simple contact form for general inquiries.
 * For client referrals, users are directed to /referral
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingButton } from '../../components/marketing';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Submit to contact API
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }

      setSubmitted(true);

    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-serenity-green-50 via-white to-serenity-green-50 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 lg:p-12 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-warm-gray-900">Message Sent!</h1>
          <p className="text-lg text-warm-gray-600 mb-8 leading-relaxed">
            Thank you for reaching out. We'll get back to you within 1 business day.
          </p>
          <div className="space-y-4">
            <Link to="/">
              <MarketingButton size="lg" variant="primary">
                Back to Home
              </MarketingButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Contact Info */}
      <section className="relative overflow-hidden py-12 lg:py-20 bg-gradient-to-br from-sage-50 via-white to-sage-100">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column - Content & Contact Info */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-serenity-green-100 shadow-sm">
                <svg className="w-5 h-5 text-serenity-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-warm-gray-700">We're Here to Help</span>
              </div>

              <h1
                className="text-4xl lg:text-5xl leading-tight font-serif"
                style={{ letterSpacing: '-0.02em' }}
              >
                <span className="text-warm-gray-900">Get in Touch</span>
              </h1>

              <p className="text-lg lg:text-xl text-warm-gray-600 leading-relaxed">
                Have a question about our services? We'd love to hear from you.
              </p>

              {/* Contact Info Cards - Inline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <a href="tel:+15134005113" className="flex flex-col items-center p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-warm-gray-100 hover:border-serenity-green-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-warm-gray-900">Phone</h3>
                  <span className="text-serenity-green-600 font-semibold text-sm">(513) 400-5113</span>
                </a>

                <a href="mailto:Hello@serenitycarepartners.com" className="flex flex-col items-center p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-warm-gray-100 hover:border-serenity-green-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-warm-gray-900">Email</h3>
                  <span className="text-serenity-green-600 font-semibold text-xs">Hello@serenitycarepartners.com</span>
                </a>

                <div className="flex flex-col items-center p-5 bg-white rounded-xl shadow-sm border border-warm-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-warm-gray-900">Office Hours</h3>
                  <span className="text-warm-gray-600 text-xs text-center">Mon-Fri 8AM - 5PM ET</span>
                </div>
              </div>

              {/* Referral CTA */}
              <div className="bg-champagne-gold-50 border border-champagne-gold-200 rounded-xl p-6 mt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-champagne-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-champagne-gold-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-gray-900 mb-1">Need to Refer a Client?</h3>
                    <p className="text-warm-gray-600 text-sm mb-3">
                      Healthcare providers and family members can submit client referrals through our dedicated form.
                    </p>
                    <Link to="/referral" className="text-serenity-green-600 font-semibold hover:text-serenity-green-700 transition-colors text-sm">
                      Submit a Client Referral →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-warm-gray-100 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 text-warm-gray-900">Send Us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Display */}
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-500 focus:border-transparent transition-all"
                    placeholder="John Smith"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-500 focus:border-transparent transition-all"
                      placeholder="(513) 555-0123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    What can we help you with? *
                  </label>
                  <select
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-500 focus:border-transparent transition-all"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="care-inquiry">I Need Care for a Loved One</option>
                    <option value="client-referral">I Want to Refer a Client</option>
                    <option value="services">Questions About Services</option>
                    <option value="pricing">Pricing & Payment Options</option>
                    <option value="employment">Employment Opportunities</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-serenity-green-500 focus:border-transparent transition-all"
                    placeholder="How can we help you?"
                  />
                </div>

                <MarketingButton
                  type="submit"
                  size="lg"
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </MarketingButton>

                <p className="text-xs text-warm-gray-500 text-center">
                  We typically respond within 1 business day.
                </p>
                <p className="text-xs text-warm-gray-400 text-center mt-2">
                  Please do not include personal health information in this form. For care-related inquiries, call us at (513) 400-5113.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-warm-gray-900 mb-4 font-serif">Service Area</h2>
            <p className="text-warm-gray-600 mb-8">
              We provide non-medical home care services across Greater Cincinnati, Ohio from our headquarters in Blue Ash.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Hamilton', 'Butler', 'Warren', 'Clermont'].map((county) => (
                <span
                  key={county}
                  className="px-4 py-2 bg-sage-50 text-warm-gray-700 rounded-full text-sm font-medium border border-sage-200"
                >
                  {county} County
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
