/**
 * CTASection Component
 * Full-width call-to-action section with solid green background.
 * Use Tailwind v4 custom properties for colors when possible.
 * Fallback to hex values (#0C5A3D for green, #D6B56C for gold) if needed.
 */

'use client';

import Link from 'next/link';

interface CTAButton {
  text: string;
  href: string;
  variant: 'gold' | 'white-outline';
}

interface CTASectionProps {
  headline: string;
  subheadline?: string;
  primaryCTA: CTAButton;
  secondaryCTA?: CTAButton;
  phoneNumber?: string;
  backgroundColor?: string;
}

export default function CTASection({
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  phoneNumber = "(513) 400-5113",
  backgroundColor = '#0C5A3D'
}: CTASectionProps) {
  return (
    <section className="relative py-24 overflow-hidden" style={{ backgroundColor }}>
      <div className="relative container mx-auto px-8 max-w-5xl text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2
            className="text-white"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              lineHeight: '1.2',
              letterSpacing: '-0.01em'
            }}
          >
            {headline}
          </h2>

          {subheadline && (
            <p
              className="text-white/95 max-w-2xl mx-auto"
              style={{ fontSize: '1.0625rem', lineHeight: '1.7' }}
            >
              {subheadline}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href={primaryCTA.href}>
              <button
                className={`px-10 py-4 text-base font-semibold rounded-xl transition-all duration-300 ${
                  primaryCTA.variant === 'gold'
                    ? 'bg-champagne-gold-500 text-warm-gray-900 hover:bg-champagne-gold-600 shadow-2xl hover:shadow-3xl hover:scale-105'
                    : 'text-white border-2 border-white hover:bg-white hover:text-serenity-green-600 shadow-xl'
                }`}
              >
                {primaryCTA.text}
              </button>
            </Link>
            {secondaryCTA && (
              <Link href={secondaryCTA.href}>
                <button className="px-10 py-4 text-base font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-serenity-green-600 transition-all duration-300 shadow-xl">
                  {secondaryCTA.text}
                </button>
              </Link>
            )}
          </div>

          {/* Contact Info */}
          {phoneNumber && (
            <div className="pt-8 border-t border-white/20">
              <p className="text-white/90 mb-2" style={{ fontSize: '1rem' }}>
                Or call us directly at
              </p>
              <Link href={`tel:${phoneNumber.replace(/\D/g, '')}`}>
                <span className="text-2xl font-bold text-white hover:text-champagne-gold-200 transition-colors">
                  {phoneNumber}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
