'use client';

import { useState } from 'react';
import Link from 'next/link';
import Hero from '@/components/Hero';
import SectionHeading from '@/components/SectionHeading';

// Always-open positions for continuous pipeline
const CORE_POSITIONS = [
  {
    id: 'rn',
    role: 'Registered Nurse (RN)',
    badge: 'Ongoing Hiring',
    description: 'Provide skilled nursing care and clinical oversight in client homes. Flexible scheduling, strong support, and mileage reimbursement.',
    requirements: ['Active Ohio RN license', 'Minimum 1 year experience', 'Reliable transportation'],
    benefits: ['$32-$42/hour', 'Flexible schedules', 'Mileage reimbursement', 'Clinical support']
  },
  {
    id: 'lpn',
    role: 'Licensed Practical Nurse (LPN)',
    badge: 'Ongoing Hiring',
    description: 'Deliver compassionate one-on-one care with our pod-based team model. Build lasting client relationships.',
    requirements: ['Active Ohio LPN license', 'Experience preferred', 'Reliable transportation'],
    benefits: ['$24-$32/hour', 'Pod-based care', 'Weekly direct deposit', 'Paid training']
  },
  {
    id: 'hha',
    role: 'Home Health Aide (HHA)',
    badge: 'Ongoing Hiring',
    description: 'Support seniors with daily living, companionship, and personal care. Paid training opportunities available. No prior experience required!',
    requirements: ['HHA certification (or willingness to obtain)', 'Compassionate nature', 'Reliable transportation'],
    benefits: ['$15-$18/hour', 'Paid training', 'Flexible hours', 'Career growth path']
  }
];

// Other opportunities (currently filled but accepting future applications)
const OTHER_ROLES = [
  {
    id: 'pod-lead',
    role: 'Pod Lead',
    location: 'Columbus, Dayton, Cincinnati',
    description: 'Oversee pod operations, mentor caregivers, and ensure quality care delivery across your assigned team. Lead daily coordination and provide frontline clinical support.',
    status: 'Currently Filled'
  },
  {
    id: 'director-operations',
    role: 'Director of Operations',
    location: 'Columbus Office',
    description: 'Oversee all operational activities across Ohio markets, manage pod performance, drive continuous improvement, and ensure compliance with healthcare regulations.',
    status: 'Currently Filled'
  },
  {
    id: 'finance-accounting-manager',
    role: 'Finance and Accounting Manager',
    location: 'Columbus Office',
    description: 'Manage financial planning, budgeting, reporting, and accounting operations. Oversee billing, payroll, and financial compliance for the organization.',
    status: 'Currently Filled'
  },
  {
    id: 'hr-manager',
    role: 'HR Manager',
    location: 'Columbus Office',
    description: 'Lead talent acquisition, employee relations, benefits administration, and training programs. Drive culture and retention initiatives across all locations.',
    status: 'Currently Filled'
  }
];

const BENEFITS = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Competitive Pay',
    description: 'Weekly direct deposit with market-leading wages and performance bonuses'
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Flexible Scheduling',
    description: 'Full-time, part-time, and PRN positions to fit your lifestyle'
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Health Benefits',
    description: 'Comprehensive health, dental, and vision coverage for eligible employees'
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: 'Paid Training',
    description: 'Continuing education and certification opportunities to advance your career'
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Supportive Leadership',
    description: '24/7 coordinator support and clinical guidance from experienced team leads'
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Career Growth',
    description: 'Clear pathways from HHA → LPN → RN with tuition assistance'
  }
];

export default function CareersPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    licenseType: '',
    availability: '',
    preferredCity: '',
    desiredPayRange: '',
    shiftPreference: '',
    overtimeAvailable: '',
    willingToTravel: '',
    priorExperience: '',
    resume: null as File | null
  });
  const [showForm, setShowForm] = useState(false);

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to ERP API endpoint
    alert('Thank you! Our HR team will contact you within 48 hours.');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        badge="Now Hiring - Join Our Team"
        headline={
          <>
            Join a Team <br />
            That Feels Like Family
          </>
        }
        subheadline="We're always hiring compassionate RNs, LPNs, and Home Health Aides who want to make a real difference in the lives of Ohio families."
        primaryCTA={{
          text: "Apply Now",
          href: "#application-form"
        }}
        secondaryCTA={{
          text: "Why Work at Serenity",
          href: "#benefits"
        }}
        backgroundImage="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=2400&auto=format&fit=crop"
      />

      {/* Always-Open Positions */}
      <section id="positions" className="py-24 bg-white">
        <div className="container mx-auto px-8 max-w-7xl">
          <SectionHeading
            eyebrow="Continuous Pipeline"
            headline="Always-Open Positions"
            subheadline="These roles are always accepting applications. You can apply anytime — even if there isn't a specific posting for your area."
          />

          <div className="grid gap-8 max-w-6xl mx-auto">
            {CORE_POSITIONS.map((position) => (
              <div
                key={position.id}
                className="bg-white border border-warm-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-warm-gray-900">{position.role}</h3>
                      <span className="inline-flex items-center gap-2 bg-serenity-green-50 text-serenity-green-700 px-3 py-1 rounded-full text-sm font-semibold border border-serenity-green-200">
                        <div className="w-2 h-2 bg-serenity-green-500 rounded-full animate-pulse"></div>
                        {position.badge}
                      </span>
                    </div>

                    <p className="text-warm-gray-600 mb-6 text-lg leading-relaxed">
                      {position.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-warm-gray-900 mb-3">Requirements:</h4>
                        <ul className="space-y-2">
                          {position.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-warm-gray-600">
                              <svg className="w-5 h-5 text-serenity-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-warm-gray-900 mb-3">Benefits:</h4>
                        <ul className="space-y-2">
                          {position.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-warm-gray-600">
                              <svg className="w-5 h-5 text-champagne-gold-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center lg:min-w-[200px]">
                    <button
                      onClick={() => {
                        setFormData({ ...formData, position: position.role });
                        scrollToForm();
                      }}
                      className="px-8 py-4 text-base font-semibold text-white bg-serenity-green-500 rounded-xl hover:bg-serenity-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Apply Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Opportunities */}
      <section className="py-24 bg-sage-50">
        <div className="container mx-auto px-8 max-w-7xl">
          <SectionHeading
            eyebrow="Future Opportunities"
            headline="Other Roles at Serenity"
            subheadline="These positions are currently filled, but we're always looking for exceptional talent. Submit your application to be considered when openings become available."
          />

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {OTHER_ROLES.map((role) => (
              <div
                key={role.id}
                className="bg-white rounded-xl p-6 border border-warm-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-warm-gray-900">{role.role}</h3>
                  <span className="inline-flex items-center gap-2 bg-warm-gray-100 text-warm-gray-600 px-3 py-1 rounded-full text-sm font-medium border border-warm-gray-200">
                    {role.status}
                  </span>
                </div>
                <p className="text-sm text-warm-gray-500 mb-3 font-medium">{role.location}</p>
                <p className="text-warm-gray-600 leading-relaxed">{role.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => {
                setFormData({ ...formData, position: 'Other' });
                scrollToForm();
              }}
              className="px-8 py-3 text-base font-semibold text-serenity-green-600 bg-white border-2 border-serenity-green-500 rounded-xl hover:bg-serenity-green-50 transition-all duration-300"
            >
              Express Interest in Future Openings
            </button>
          </div>
        </div>
      </section>

      {/* Why Work With Serenity */}
      <section id="benefits" className="py-24 bg-sage-25">
        <div className="container mx-auto px-8 max-w-7xl">
          <SectionHeading
            eyebrow="Why Serenity"
            headline="Exceptional Benefits for Exceptional Caregivers"
            subheadline="At Serenity Care Partners, we invest in our caregivers — because great care starts with great people."
          />

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {BENEFITS.map((benefit, i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300"
                style={{ border: '1px solid rgba(0, 0, 0, 0.06)' }}
              >
                <div className="w-20 h-20 bg-serenity-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-serenity-green-600">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-xl mb-3 text-warm-gray-900">{benefit.title}</h3>
                <p className="text-warm-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Life at Serenity */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=800&auto=format&fit=crop"
                alt="Team collaboration"
                className="rounded-2xl shadow-lg h-64 object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?q=80&w=800&auto=format&fit=crop"
                alt="Caregiver with client"
                className="rounded-2xl shadow-lg h-64 object-cover mt-8"
              />
              <img
                src="https://images.unsplash.com/photo-1516733968668-dbdce39c4651?q=80&w=800&auto=format&fit=crop"
                alt="Compassionate care"
                className="rounded-2xl shadow-lg h-64 object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?q=80&w=800&auto=format&fit=crop"
                alt="Senior care"
                className="rounded-2xl shadow-lg h-64 object-cover mt-8"
              />
            </div>

            {/* Testimonials */}
            <div className="space-y-8">
              <div>
                <p className="font-medium text-xs tracking-widest uppercase mb-4 text-warm-gray-400" style={{ letterSpacing: '0.15em' }}>
                  Life at Serenity
                </p>
                <h2
                  className="mb-6 text-warm-gray-900"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(32px, 4vw, 44px)',
                    lineHeight: '1.2',
                    letterSpacing: '-0.01em',
                    fontWeight: '400'
                  }}
                >
                  What Our Team Says
                </h2>
              </div>

              <div className="space-y-6">
                <div className="bg-sage-50 rounded-xl p-6 border border-warm-gray-200">
                  <p className="text-warm-gray-700 italic mb-4 leading-relaxed">
                    "Working with Serenity has been the most supportive experience of my career. The pod model means I truly get to know my clients, and leadership is always just a phone call away."
                  </p>
                  <p className="font-semibold text-warm-gray-900">— Sarah K., RN</p>
                </div>

                <div className="bg-sage-50 rounded-xl p-6 border border-warm-gray-200">
                  <p className="text-warm-gray-700 italic mb-4 leading-relaxed">
                    "I started as an HHA and Serenity supported me through my LPN certification. Now I'm working toward my RN. They truly invest in their people."
                  </p>
                  <p className="font-semibold text-warm-gray-900">— Marcus T., LPN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple 3-Step Process */}
      <section className="py-24 bg-sage-25">
        <div className="container mx-auto px-8 max-w-7xl">
          <SectionHeading
            eyebrow="Simple Process"
            headline="Your Journey Starts Here"
            subheadline="From application to orientation, we make joining our team easy and transparent."
          />

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Submit Application',
                description: 'Complete our online form or upload your resume. Takes less than 5 minutes.'
              },
              {
                step: '2',
                title: 'Quick Interview',
                description: 'Phone screen or video chat to discuss your experience and answer questions.'
              },
              {
                step: '3',
                title: 'Start Your Journey',
                description: 'Background check, orientation, and comprehensive training to set you up for success.'
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-serenity-green-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-xl mb-3 text-warm-gray-900">{item.title}</h3>
                <p className="text-warm-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded Application Form */}
      {showForm && (
        <section id="application-form" className="py-24 bg-white scroll-mt-20">
          <div className="container mx-auto px-8 max-w-4xl">
            <div className="text-center mb-8">
              <h2
                className="mb-4 text-warm-gray-900"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(32px, 4vw, 44px)',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em',
                  fontWeight: '400'
                }}
              >
                Apply Now
              </h2>
              <p className="text-xl text-warm-gray-600 mb-6">
                Take the first step toward a rewarding career with Serenity Care Partners
              </p>

              {/* Training Notice */}
              <div className="bg-serenity-green-50 border-2 border-serenity-green-200 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex items-start gap-4">
                  <svg className="w-8 h-8 text-serenity-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-serenity-green-900 mb-2">No Experience Required!</h3>
                    <p className="text-serenity-green-800 leading-relaxed">
                      We provide comprehensive paid training and ongoing support for all new caregivers. Whether you're starting your healthcare career or transitioning from another field, we'll equip you with everything you need to succeed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-sage-25 rounded-2xl p-8 lg:p-12 border border-warm-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Position *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  >
                    <option value="">Select a position...</option>
                    <option value="Registered Nurse (RN)">Registered Nurse (RN)</option>
                    <option value="Licensed Practical Nurse (LPN)">Licensed Practical Nurse (LPN)</option>
                    <option value="Home Health Aide (HHA)">Home Health Aide (HHA)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    License Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., RN, LPN, HHA, or N/A"
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.licenseType}
                    onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Availability *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  >
                    <option value="">Select availability...</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="PRN">PRN (As Needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Preferred City *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.preferredCity}
                    onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                  >
                    <option value="">Select a city...</option>
                    <option value="Columbus">Columbus</option>
                    <option value="Dayton">Dayton</option>
                    <option value="Cincinnati">Cincinnati</option>
                  </select>
                </div>

                {/* Optional Fields Section */}
                <div className="md:col-span-2 mt-6 mb-4">
                  <div className="border-t border-warm-gray-300 pt-6">
                    <h3 className="font-semibold text-lg text-warm-gray-900 mb-2">
                      Additional Information <span className="text-sm font-normal text-warm-gray-500">(Optional - helps us find the best fit)</span>
                    </h3>
                    <p className="text-sm text-warm-gray-600 mb-6">
                      The following fields are completely optional but help us match you with the right opportunity.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Desired Pay Range <span className="text-warm-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.desiredPayRange}
                    onChange={(e) => setFormData({ ...formData, desiredPayRange: e.target.value })}
                  >
                    <option value="">Select a range...</option>
                    <option value="$15-$18/hour">$15-$18/hour</option>
                    <option value="$18-$22/hour">$18-$22/hour</option>
                    <option value="$22-$28/hour">$22-$28/hour</option>
                    <option value="$28-$35/hour">$28-$35/hour</option>
                    <option value="$35-$42/hour">$35-$42/hour</option>
                    <option value="$42+/hour">$42+/hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Shift Preference <span className="text-warm-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.shiftPreference}
                    onChange={(e) => setFormData({ ...formData, shiftPreference: e.target.value })}
                  >
                    <option value="">Select preference...</option>
                    <option value="Morning (6am-2pm)">Morning (6am-2pm)</option>
                    <option value="Afternoon (2pm-10pm)">Afternoon (2pm-10pm)</option>
                    <option value="Nights (10pm-6am)">Nights (10pm-6am)</option>
                    <option value="Flexible / Any">Flexible / Any</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Available for Overtime? <span className="text-warm-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.overtimeAvailable}
                    onChange={(e) => setFormData({ ...formData, overtimeAvailable: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="Yes, regularly">Yes, regularly</option>
                    <option value="Yes, occasionally">Yes, occasionally</option>
                    <option value="No, prefer standard hours">No, prefer standard hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Willing to Travel Around Metro Area? <span className="text-warm-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all"
                    value={formData.willingToTravel}
                    onChange={(e) => setFormData({ ...formData, willingToTravel: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="Yes, up to 30 miles">Yes, up to 30 miles</option>
                    <option value="Yes, up to 15 miles">Yes, up to 15 miles</option>
                    <option value="Prefer to stay local (within 5 miles)">Prefer to stay local (within 5 miles)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Prior Healthcare Experience <span className="text-warm-gray-400 font-normal">(Optional - No experience is totally OK!)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe any healthcare, caregiving, or related experience. If none, just leave blank or write 'No prior experience'."
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all resize-none"
                    value={formData.priorExperience}
                    onChange={(e) => setFormData({ ...formData, priorExperience: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                    Upload Resume
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="w-full px-4 py-3 rounded-xl border border-warm-gray-300 focus:border-serenity-green-500 focus:ring-2 focus:ring-serenity-green-200 outline-none transition-all bg-white"
                    onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                  />
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  type="submit"
                  className="px-12 py-4 text-lg font-semibold text-white bg-serenity-green-500 rounded-xl hover:bg-serenity-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Submit Application
                </button>
                <p className="mt-4 text-sm text-warm-gray-600">
                  Our HR team will contact you within 48 hours
                </p>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="py-24 bg-serenity-green-500 text-white">
        <div className="container mx-auto px-8 text-center">
          <h2
            className="mb-4 text-white"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              lineHeight: '1.2',
              letterSpacing: '-0.01em'
            }}
          >
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/95">
            Whether you're an experienced nurse or just beginning your healthcare journey, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={scrollToForm}
              className="px-10 py-4 text-base font-semibold bg-champagne-gold-500 text-warm-gray-900 rounded-xl hover:bg-champagne-gold-600 transition-all duration-300 shadow-2xl hover:scale-105"
            >
              Get Started Today
            </button>
            <a
              href="mailto:careers@serenitycarepartners.com"
              className="px-10 py-4 text-base font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-serenity-green-600 transition-all duration-300"
            >
              Contact HR Team
            </a>
          </div>
        </div>
      </section>

      {/* Sticky Floating Button */}
      <button
        onClick={scrollToForm}
        className="fixed bottom-8 right-8 px-6 py-3 bg-serenity-green-500 text-white rounded-full shadow-2xl hover:bg-serenity-green-600 transition-all duration-300 hover:scale-110 z-50 font-semibold flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Apply Now
      </button>
    </div>
  );
}
