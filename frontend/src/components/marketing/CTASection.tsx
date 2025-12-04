/**
 * CTASection Component
 * Full-width call-to-action section with solid green background.
 * Ported from public-site for React frontend.
 */

import React from 'react';
import { Link } from 'react-router-dom';

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
  // Check if href is external (tel:, mailto:, http)
  const isExternal = (href: string) => href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http');

  const renderButton = (cta: CTAButton, isPrimary: boolean) => {
    const buttonContent = (
      <button
        className={`px-10 py-4 text-base font-semibold rounded-xl transition-all duration-300 ${
          cta.variant === 'gold'
            ? 'bg-champagne-gold-500 text-warm-gray-900 hover:bg-champagne-gold-600 shadow-2xl hover:shadow-3xl hover:scale-105'
            : 'text-white border-2 border-white hover:bg-white hover:text-serenity-green-600 shadow-xl'
        }`}
      >
        {cta.text}
      </button>
    );

    if (isExternal(cta.href)) {
      return <a href={cta.href}>{buttonContent}</a>;
    }
    return <Link to={cta.href}>{buttonContent}</Link>;
  };

  return (
    <section className="relative py-24 overflow-hidden" style={{ backgroundColor }}>
      <div className="relative container mx-auto px-8 max-w-5xl text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2
            className="text-white font-serif"
            style={{
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
            {renderButton(primaryCTA, true)}
            {secondaryCTA && renderButton(secondaryCTA, false)}
          </div>

          {/* Contact Info */}
          {phoneNumber && (
            <div className="pt-8 border-t border-white/20">
              <p className="text-white/90 mb-2" style={{ fontSize: '1rem' }}>
                Or call us directly at
              </p>
              <a href={`tel:${phoneNumber.replace(/\D/g, '')}`}>
                <span className="text-2xl font-bold text-white hover:text-champagne-gold-200 transition-colors">
                  {phoneNumber}
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
