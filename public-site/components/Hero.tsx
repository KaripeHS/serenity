/**
 * Hero Component
 * Premium hero section with image background and radial gradient overlay.
 * Use Tailwind v4 custom properties for colors when possible.
 * Fallback to hex values (#0C5A3D, #2B2B2B, etc.) if CSS variables fail in production.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.2, 0, 0.38, 0.9] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface HeroProps {
  badge?: string;
  headline: string;
  subheadline: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
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
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Floating Badge */}
          {badge && (
            <motion.div
              className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-warm-gray-200 shadow-sm"
              variants={fadeInUp}
            >
              <div className="w-2 h-2 rounded-full animate-pulse bg-serenity-green-500"></div>
              <span className="text-sm font-semibold tracking-wide text-warm-gray-700">{badge}</span>
            </motion.div>
          )}

          {/* Hero Headline */}
          <motion.h1
            className="text-warm-gray-900 drop-shadow-sm"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(52px, 6vw, 78px)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              fontWeight: '400'
            }}
            variants={fadeInUp}
          >
            {headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="max-w-2xl mx-auto drop-shadow-sm text-warm-gray-700"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.1875rem',
              lineHeight: '1.75'
            }}
            variants={fadeInUp}
          >
            {subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            variants={fadeInUp}
          >
            <Link href={primaryCTA.href}>
              <button className="px-8 py-4 text-base font-semibold text-white bg-serenity-green-500 rounded-xl hover:bg-serenity-green-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                {primaryCTA.text}
              </button>
            </Link>
            {secondaryCTA && (
              <Link href={secondaryCTA.href}>
                <button className="px-8 py-4 text-base font-semibold text-serenity-green-600 bg-white border-2 border-serenity-green-300 rounded-xl hover:bg-serenity-green-50 transition-all duration-300 shadow-md flex items-center justify-center gap-2">
                  {secondaryCTA.icon}
                  {secondaryCTA.text}
                </button>
              </Link>
            )}
          </motion.div>

          {/* Trust Indicators */}
          {trustIndicators && (
            <motion.div
              className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-warm-gray-600"
              variants={fadeInUp}
            >
              {trustIndicators.map((indicator, i) => (
                <div key={i} className="flex items-center gap-2">
                  {indicator.icon}
                  <span>{indicator.text}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
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
