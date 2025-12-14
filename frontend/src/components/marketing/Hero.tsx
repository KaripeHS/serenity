/**
 * Hero Component
 * Premium hero section with image background and radial gradient overlay.
 * Ported from public-site for React frontend.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.2, 0, 0.38, 0.9] }
};

interface HeroProps {
  badge?: string;
  headline: React.ReactNode;
  subheadline: string;
  primaryCTA: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  backgroundImage: string;
  trustIndicators?: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
}

export default function Hero({
  badge = "Trusted by 100+ Ohio families",
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  backgroundImage,
  trustIndicators
}: HeroProps) {
  // Check if href is external (tel:, mailto:, http) or anchor link
  const isExternalOrAnchor = (href: string) => href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http') || href.startsWith('#');

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {/* Enhanced Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-sage-50/70 to-white/85"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <div
          className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in"
        >
          {/* Floating Badge */}
          {badge && (
            <div
              className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-warm-gray-200 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full animate-pulse bg-serenity-green-500"></div>
              <span className="text-sm font-semibold tracking-wide text-warm-gray-700">{badge}</span>
            </div>
          )}

          {/* Hero Headline */}
          <h1
            className="text-warm-gray-900 drop-shadow-sm font-serif"
            style={{
              fontSize: 'clamp(52px, 6vw, 78px)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              fontWeight: '400'
            }}
          >
            {headline}
          </h1>

          {/* Subheadline */}
          <p
            className="max-w-2xl mx-auto drop-shadow-sm text-warm-gray-700"
            style={{
              fontSize: '1.1875rem',
              lineHeight: '1.75'
            }}
          >
            {subheadline}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            {primaryCTA.onClick ? (
              <button
                onClick={primaryCTA.onClick}
                className="px-8 py-4 text-base font-semibold text-white bg-serenity-green-500 rounded-xl hover:bg-serenity-green-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {primaryCTA.text}
              </button>
            ) : isExternalOrAnchor(primaryCTA.href) ? (
              <a href={primaryCTA.href}>
                <button className="px-8 py-4 text-base font-semibold text-white bg-serenity-green-500 rounded-xl hover:bg-serenity-green-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  {primaryCTA.text}
                </button>
              </a>
            ) : (
              <Link to={primaryCTA.href}>
                <button className="px-8 py-4 text-base font-semibold text-white bg-serenity-green-500 rounded-xl hover:bg-serenity-green-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  {primaryCTA.text}
                </button>
              </Link>
            )}
            {secondaryCTA && (
              secondaryCTA.onClick ? (
                <button
                  onClick={secondaryCTA.onClick}
                  className="px-8 py-4 text-base font-semibold text-serenity-green-600 bg-white border-2 border-serenity-green-300 rounded-xl hover:bg-serenity-green-50 transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                >
                  {secondaryCTA.icon}
                  {secondaryCTA.text}
                </button>
              ) : isExternalOrAnchor(secondaryCTA.href) ? (
                <a href={secondaryCTA.href}>
                  <button className="px-8 py-4 text-base font-semibold text-serenity-green-600 bg-white border-2 border-serenity-green-300 rounded-xl hover:bg-serenity-green-50 transition-all duration-300 shadow-md flex items-center justify-center gap-2">
                    {secondaryCTA.icon}
                    {secondaryCTA.text}
                  </button>
                </a>
              ) : (
                <Link to={secondaryCTA.href}>
                  <button className="px-8 py-4 text-base font-semibold text-serenity-green-600 bg-white border-2 border-serenity-green-300 rounded-xl hover:bg-serenity-green-50 transition-all duration-300 shadow-md flex items-center justify-center gap-2">
                    {secondaryCTA.icon}
                    {secondaryCTA.text}
                  </button>
                </Link>
              )
            )}
          </div>

          {/* Trust Indicators */}
          {trustIndicators && (
            <div
              className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-warm-gray-600"
            >
              {trustIndicators.map((indicator, i) => (
                <div key={i} className="flex items-center gap-2">
                  {indicator.icon}
                  <span>{indicator.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
