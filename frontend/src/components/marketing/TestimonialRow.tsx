/**
 * TestimonialRow Component
 * Displays testimonials in a 3-column grid with star ratings and author info.
 * Ported from public-site for React frontend.
 */

import React from 'react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  image?: string;
}

interface TestimonialRowProps {
  eyebrow?: string;
  headline: string;
  testimonials: Testimonial[];
  backgroundColor?: 'sage' | 'white';
}

export default function TestimonialRow({
  eyebrow = "What Families Say",
  headline,
  testimonials,
  backgroundColor = 'sage'
}: TestimonialRowProps) {
  const bgClass = backgroundColor === 'sage' ? 'bg-sage-25' : 'bg-white';

  return (
    <section className={`py-24 ${bgClass}`}>
      <div className="container mx-auto px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="font-medium text-xs tracking-widest uppercase mb-6 text-warm-gray-400" style={{ letterSpacing: '0.15em' }}>
            {eyebrow}
          </p>
          <h2
            className="mb-6 text-warm-gray-900 font-serif"
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

        <div className="grid md:grid-cols-3 gap-10">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-10 transition-all duration-300 hover:shadow-lg"
              style={{ border: '1px solid rgba(0, 0, 0, 0.06)' }}
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, starIndex) => (
                  <svg key={starIndex} className="w-4 h-4 text-champagne-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p
                className="mb-8 italic text-warm-gray-600"
                style={{ fontSize: '1rem', lineHeight: '1.7' }}
              >
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                {testimonial.image && (
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-warm-gray-900" style={{ fontSize: '0.9375rem' }}>
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-warm-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
