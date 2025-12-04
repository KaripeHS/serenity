/**
 * ImageTextSection Component
 * Side-by-side image and text layout with optional stats overlay and checklist.
 * Ported from public-site for React frontend.
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface Stat {
  value: string;
  label: string;
}

interface ImageTextSectionProps {
  eyebrow?: string;
  headline: string;
  description: string;
  image: string;
  imageAlt: string;
  checklist?: string[];
  stats?: [Stat, Stat];
  cta?: {
    text: string;
    href: string;
  };
  imagePosition?: 'left' | 'right';
  backgroundColor?: 'white' | 'sage';
}

export default function ImageTextSection({
  eyebrow,
  headline,
  description,
  image,
  imageAlt,
  checklist,
  stats,
  cta,
  imagePosition = 'left',
  backgroundColor = 'white'
}: ImageTextSectionProps) {
  const bgClass = backgroundColor === 'sage' ? 'bg-sage-25' : 'bg-white';

  // Check if href is external (tel:, mailto:, http)
  const isExternal = (href: string) => href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http');

  return (
    <section className={`py-24 ${bgClass}`}>
      <div className="container mx-auto px-8 max-w-7xl">
        <div className={`grid lg:grid-cols-2 gap-16 items-center ${imagePosition === 'right' ? 'lg:grid-flow-dense' : ''}`}>
          {/* Image Side */}
          <div className={`relative ${imagePosition === 'right' ? 'lg:col-start-2' : ''}`}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={image}
                alt={imageAlt}
                className="w-full h-[480px] object-cover"
              />
              {/* Floating Stats Badge */}
              {stats && (
                <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl">
                  <div className="grid grid-cols-2 gap-8">
                    {stats.map((stat, i) => (
                      <div key={i}>
                        <p className="text-4xl font-bold text-serenity-green-600 mb-2">{stat.value}</p>
                        <p className="text-sm text-warm-gray-600 leading-tight">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Side */}
          <div className={`space-y-6 ${imagePosition === 'right' ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
            <div>
              {eyebrow && (
                <p className="font-medium text-xs tracking-widest uppercase mb-4 text-warm-gray-400" style={{ letterSpacing: '0.15em' }}>
                  {eyebrow}
                </p>
              )}
              <h2
                className="mb-5 text-warm-gray-900 font-serif"
                style={{
                  fontSize: 'clamp(32px, 4vw, 44px)',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em',
                  fontWeight: '400'
                }}
              >
                {headline}
              </h2>
            </div>

            <p className="text-warm-gray-600" style={{ fontSize: '1.0625rem', lineHeight: '1.7' }}>
              {description}
            </p>

            {checklist && checklist.length > 0 && (
              <div className="space-y-3 pt-4">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-serenity-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <p className="text-warm-gray-600" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {cta && (
              isExternal(cta.href) ? (
                <a href={cta.href}>
                  <button className="mt-8 px-8 py-3.5 text-base font-semibold text-serenity-green-600 border-2 border-serenity-green-400 rounded-xl hover:bg-serenity-green-50 transition-all duration-300 shadow-sm">
                    {cta.text}
                  </button>
                </a>
              ) : (
                <Link to={cta.href}>
                  <button className="mt-8 px-8 py-3.5 text-base font-semibold text-serenity-green-600 border-2 border-serenity-green-400 rounded-xl hover:bg-serenity-green-50 transition-all duration-300 shadow-sm">
                    {cta.text}
                  </button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
