/**
 * PublicLayout Component
 * Main layout wrapper for all public marketing pages.
 * Includes Header and Footer from public-site design.
 */

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// Hook to scroll to hash anchors on navigation
function useHashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Scroll to top on page change without hash
      window.scrollTo(0, 0);
    }
  }, [location]);
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-warm-gray-200">
      <nav className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-serenity-green-500 to-serenity-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-warm-gray-900 tracking-tight">Serenity</span>
              <span className="text-xs text-warm-gray-600 font-medium -mt-1">Care Partners</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              to="/about"
              className="text-warm-gray-700 hover:text-serenity-green-600 font-medium transition-colors relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-serenity-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/services"
              className="text-warm-gray-700 hover:text-serenity-green-600 font-medium transition-colors relative group"
            >
              Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-serenity-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/careers"
              className="text-warm-gray-700 hover:text-serenity-green-600 font-medium transition-colors relative group"
            >
              Careers
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-serenity-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/referral"
              className="text-warm-gray-700 hover:text-serenity-green-600 font-medium transition-colors relative group"
            >
              Refer a Patient
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-serenity-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/contact"
              className="text-warm-gray-700 hover:text-serenity-green-600 font-medium transition-colors relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-serenity-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 ml-4">
              <Link
                to="/family"
                className="flex items-center gap-2 px-4 py-2 text-warm-gray-700 hover:text-serenity-green-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden xl:inline">Family Portal</span>
              </Link>
              <a
                href="tel:+15134005113"
                className="flex items-center gap-2 px-4 py-2 text-warm-gray-700 hover:text-serenity-green-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hidden xl:inline">(513) 400-5113</span>
              </a>
              <Link
                to="/referral"
                className="px-6 py-2.5 bg-gradient-to-r from-serenity-green-500 to-serenity-green-600 text-white font-semibold rounded-xl hover:from-serenity-green-600 hover:to-serenity-green-700 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-warm-gray-700 hover:text-serenity-green-600"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-6 border-t border-warm-gray-200">
            <div className="flex flex-col gap-4 pt-4">
              <Link
                to="/about"
                className="text-warm-gray-700 hover:text-serenity-green-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/services"
                className="text-warm-gray-700 hover:text-serenity-green-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/careers"
                className="text-warm-gray-700 hover:text-serenity-green-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Careers
              </Link>
              <Link
                to="/referral"
                className="text-warm-gray-700 hover:text-serenity-green-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Refer a Patient
              </Link>
              <Link
                to="/contact"
                className="text-warm-gray-700 hover:text-serenity-green-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/family"
                className="flex items-center gap-2 text-warm-gray-700 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Family Portal
              </Link>
              <a
                href="tel:+15134005113"
                className="flex items-center gap-2 text-warm-gray-700 font-medium py-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (513) 400-5113
              </a>
              <Link
                to="/referral"
                className="mt-2 px-6 py-3 bg-gradient-to-r from-serenity-green-500 to-serenity-green-600 text-white font-semibold rounded-xl text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-white" style={{ backgroundColor: '#0C5A3D' }}>
      <div className="container mx-auto px-8 py-16 max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">Serenity</span>
                <span className="text-xs font-medium -mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Care Partners</span>
              </div>
            </Link>
            <p className="leading-relaxed mb-6" style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.7' }}>
              Compassionate home health care across Ohio. Our innovative pod-based model ensures personalized attention and exceptional outcomes.
            </p>
            {/* Social Media Links - Hidden until valid URLs are available
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
            */}
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-bold text-white mb-4">Services</h4>
            <ul className="space-y-3">
              <li><Link to="/services#personal-care" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Personal Care</Link></li>
              <li><Link to="/services#homemaker" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Homemaker Services</Link></li>
              <li><Link to="/services#companionship" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Companionship</Link></li>
              <li><Link to="/services#respite-care" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Respite Care</Link></li>
              <li><Link to="/about#pod-based-care" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Pod-Based Care</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>About Us</Link></li>
              <li><Link to="/careers" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Careers</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Contact</Link></li>
              <li><Link to="/family" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Family Portal</Link></li>
              <li><Link to="/about#team" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Our Team</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+15134005113" className="text-white hover:text-champagne-gold-200 transition-colors">(513) 400-5113</a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:Hello@serenitycarepartners.com" className="text-white hover:text-champagne-gold-200 transition-colors">Hello@serenitycarepartners.com</a>
              </li>
              <li className="flex items-start gap-2 mt-4">
                <svg className="w-5 h-5 mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-white">Hours</p>
                  <p className="text-sm">Monday-Friday</p>
                  <p className="text-sm">8:00 AM - 6:00 PM EST</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              &copy; 2025 Serenity Care Partners. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 text-sm">
              <Link to="/privacy" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Privacy Policy</Link>
              <Link to="/terms" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Terms of Service</Link>
              <Link to="/hipaa" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>HIPAA</Link>
              <Link to="/non-discrimination" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Non-Discrimination</Link>
              <Link to="/accessibility" className="transition-colors hover:text-champagne-gold-200" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  // Enable smooth scrolling to hash anchors
  useHashScroll();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
