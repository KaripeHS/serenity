/**
 * ContactStrip Component
 * Horizontal contact information strip with phone, email, and location.
 * Use Tailwind v4 custom properties for colors when possible.
 * Fallback to hex values if needed.
 */

'use client';

import Link from 'next/link';

interface ContactStripProps {
  phone?: string;
  email?: string;
  locations?: string[];
  backgroundColor?: 'sage' | 'white' | 'green';
}

export default function ContactStrip({
  phone = "(513) 400-5113",
  email = "Hello@serenitycarepartners.com",
  locations = ["Columbus", "Dayton", "Cincinnati"],
  backgroundColor = 'sage'
}: ContactStripProps) {
  const bgClasses = {
    sage: 'bg-sage-25',
    white: 'bg-white',
    green: 'bg-serenity-green-500'
  };

  const textClasses = {
    sage: 'text-warm-gray-700',
    white: 'text-warm-gray-700',
    green: 'text-white'
  };

  return (
    <section className={`py-12 ${bgClasses[backgroundColor]}`}>
      <div className="container mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Phone */}
          <Link href={`tel:${phone.replace(/\D/g, '')}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <svg className={`w-6 h-6 ${textClasses[backgroundColor]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <p className={`text-xs uppercase tracking-wide ${backgroundColor === 'green' ? 'text-white/80' : 'text-warm-gray-400'}`}>Call Us</p>
              <p className={`font-semibold ${textClasses[backgroundColor]}`}>{phone}</p>
            </div>
          </Link>

          {/* Email */}
          <Link href={`mailto:${email}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <svg className={`w-6 h-6 ${textClasses[backgroundColor]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className={`text-xs uppercase tracking-wide ${backgroundColor === 'green' ? 'text-white/80' : 'text-warm-gray-400'}`}>Email Us</p>
              <p className={`font-semibold ${textClasses[backgroundColor]}`}>{email}</p>
            </div>
          </Link>

          {/* Locations */}
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 ${textClasses[backgroundColor]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className={`text-xs uppercase tracking-wide ${backgroundColor === 'green' ? 'text-white/80' : 'text-warm-gray-400'}`}>Serving</p>
              <p className={`font-semibold ${textClasses[backgroundColor]}`}>{locations.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
