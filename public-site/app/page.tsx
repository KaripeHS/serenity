'use client';

import Hero from '@/components/Hero';
import ThreeUpFeatures from '@/components/ThreeUpFeatures';
import ImageTextSection from '@/components/ImageTextSection';
import TestimonialRow from '@/components/TestimonialRow';
import CTASection from '@/components/CTASection';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        badge="Trusted by 100+ Ohio families"
        headline={
          <>
            Compassionate Care <br />
            That Feels Like Family
          </>
        }
        subheadline="Our pod-based care model ensures your loved ones receive consistent, personalized attention from caregivers who truly know them—bringing warmth, dignity, and peace of mind to every day."
        primaryCTA={{
          text: "Request Care Information",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Call: (513) 400-5113",
          href: "tel:+15134005113",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )
        }}
        backgroundImage="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?q=80&w=2400&auto=format&fit=crop"
        trustIndicators={[
          {
            icon: (
              <svg className="w-5 h-5 text-serenity-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ),
            text: "Licensed & Insured"
          },
          {
            icon: (
              <svg className="w-5 h-5 text-serenity-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ),
            text: "HIPAA Compliant"
          },
          {
            icon: (
              <svg className="w-5 h-5 text-champagne-gold-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ),
            text: "4.9★ Rating"
          }
        ]}
      />

      {/* Why Serenity is Different - 3 Features */}
      <ThreeUpFeatures
        eyebrow="Why Serenity is Different"
        headline="Care Built on Relationships, Not Transactions"
        subheadline="We've reimagined home care with a pod-based model that puts consistency and connection first."
        backgroundColor="sage"
        features={[
          {
            icon: (
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
            title: "Pod-Based Care Teams",
            description: "Small teams of 35-40 clients mean your caregiver truly knows your loved one's preferences, routines, and personality."
          },
          {
            icon: (
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
            title: "Caregiver Excellence",
            description: "Industry-leading pay and support attract the best talent. Our caregivers stay because they're valued."
          },
          {
            icon: (
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            title: "Real-Time Quality",
            description: "Our Serenity Performance Index tracks outcomes in real-time, ensuring consistent excellence across all pods."
          }
        ]}
      />

      {/* Caregivers Who Truly Care */}
      <ImageTextSection
        eyebrow="Our Caregivers"
        headline="Caregivers Who Truly Care"
        description="Every caregiver on our team is carefully selected, thoroughly trained, and deeply committed to providing compassionate, person-centered care. They're not just professionals—they become trusted companions."
        image="https://images.unsplash.com/photo-1516733968668-dbdce39c4651?q=80&w=1200&auto=format&fit=crop"
        imageAlt="Caregiver with senior in warm home environment"
        imagePosition="left"
        backgroundColor="white"
        stats={[
          { value: "95%", label: "Family Satisfaction" },
          { value: "10+", label: "Years Experience" }
        ]}
        checklist={[
          "Certified and background-checked professionals",
          "Ongoing training in compassionate care techniques",
          "Consistent assignments for relationship building",
          "24/7 coordinator support and supervision"
        ]}
        cta={{
          text: "Join Our Team →",
          href: "/careers"
        }}
      />

      {/* Testimonials */}
      <TestimonialRow
        eyebrow="What Families Say"
        headline="Stories from Our Community"
        backgroundColor="sage"
        testimonials={[
          {
            quote: "The consistency is incredible. Mom knows her caregivers by name and genuinely looks forward to their visits. It's like having extended family.",
            author: "Jennifer M.",
            role: "Daughter",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
          },
          {
            quote: "I was skeptical about the pod model, but it works beautifully. Dad's caregivers understand his needs without us having to constantly explain things.",
            author: "Michael R.",
            role: "Son",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
          },
          {
            quote: "As a nurse, I've worked for several agencies. Serenity's support, competitive pay, and manageable caseload make this the best environment I've experienced.",
            author: "Sarah K., RN",
            role: "Caregiver",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
          }
        ]}
      />

      {/* Serving Communities */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="font-medium text-xs tracking-widest uppercase mb-6 text-warm-gray-400" style={{ letterSpacing: '0.15em' }}>Where We Serve</p>
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
              Serving Ohio Communities
            </h2>
            <p className="text-warm-gray-600" style={{ fontSize: '1.0625rem', lineHeight: '1.7', maxWidth: '65ch', margin: '0 auto' }}>
              Three active care pods across Ohio's major metropolitan areas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                city: 'Columbus',
                county: 'Franklin County',
                image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800&auto=format&fit=crop'
              },
              {
                city: 'Dayton',
                county: 'Montgomery County',
                image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop'
              },
              {
                city: 'Cincinnati',
                county: 'Hamilton County',
                image: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=800&auto=format&fit=crop'
              }
            ].map((location, i) => (
              <Link key={i} href="/contact">
                <div className="group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl" style={{ border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={location.image}
                      alt={`${location.city} care setting`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        {location.city}
                      </h3>
                      <p className="text-white/90 mb-4 text-sm">
                        {location.county}
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-serenity-green-500/90">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold">Active Pod</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <CTASection
        headline="Ready to Experience Serenity?"
        subheadline="Whether you're seeking compassionate care for a loved one or looking to join our exceptional team, we're here to help."
        primaryCTA={{
          text: "Get Started Today",
          href: "/contact",
          variant: "gold"
        }}
        secondaryCTA={{
          text: "Join Our Team",
          href: "/careers",
          variant: "white-outline"
        }}
        phoneNumber="(513) 400-5113"
      />
    </div>
  );
}
