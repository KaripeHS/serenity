import Link from 'next/link';
import { Button } from '../components/Button';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 fade-in">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
                <span className="text-sm font-semibold text-gray-700">Our Story</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
                <span className="text-gray-900">Redefining Home Health Care</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  One Pod at a Time
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                We believe exceptional care starts with exceptional caregivers. Our innovative pod-based model transforms how home health care is delivered across Ohio.
              </p>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative h-[500px] lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 rounded-3xl shadow-2xl hover-lift overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop"
                  alt="Professional healthcare team collaborating together"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 hover-lift fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To deliver exceptional, compassionate home health care that enables our patients to live with dignity and independence in the comfort of their own homes. We achieve this through our innovative pod-based care model, investment in our caregivers, and relentless focus on quality outcomes.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 hover-lift fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To be Ohio's most trusted home health care provider, setting the standard for quality, reliability, and caregiver satisfaction. We envision a future where every patient receives consistent, personalized care from dedicated professionals who know them and their needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-4">
              <span className="text-green-700 font-semibold text-sm">Meet Our Leaders</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Leadership Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experienced healthcare professionals dedicated to transforming home health care
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg hover-lift border border-gray-100 overflow-hidden fade-in">
              <div className="h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
                  alt="Professional healthcare executive Gloria"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-10">
                <h3 className="text-2xl font-bold text-center mb-2 text-gray-900">Gloria</h3>
                <p className="text-green-600 text-center font-semibold mb-6 text-lg">Chief Executive Officer</p>
                <p className="text-gray-600 text-center leading-relaxed">
                  With decades of experience in home health care, Gloria founded Serenity Care Partners with a vision to transform the industry through innovation and compassion. Her leadership has established our reputation for excellence across Ohio.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg hover-lift border border-gray-100 overflow-hidden fade-in" style={{ animationDelay: '100ms' }}>
              <div className="h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop"
                  alt="Professional healthcare executive Bignon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-10">
                <h3 className="text-2xl font-bold text-center mb-2 text-gray-900">Bignon</h3>
                <p className="text-green-600 text-center font-semibold mb-6 text-lg">Chief Operating Officer & CFO</p>
                <p className="text-gray-600 text-center leading-relaxed">
                  Bignon brings expertise in healthcare operations and financial management, ensuring operational excellence and sustainable growth. His strategic vision drives our expansion and continuous improvement initiatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pod Model Explanation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-4">
                <span className="text-green-700 font-semibold text-sm">Our Innovation</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">The Pod Model: Our Competitive Advantage</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unlike traditional home health agencies that assign caregivers randomly, our pod-based model creates small, dedicated teams that work together to serve 35-40 patients.
              </p>
            </div>

            {/* Pod Model Image */}
            <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl hover-lift fade-in">
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1400&auto=format&fit=crop"
                alt="Healthcare team collaborating in pod-based care model"
                className="w-full h-[500px] object-cover"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">Small Teams</h3>
                <p className="text-gray-600 leading-relaxed">
                  35-40 patients per pod ensures personalized attention and consistent care
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '100ms' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">Familiar Faces</h3>
                <p className="text-gray-600 leading-relaxed">
                  Patients see the same caregivers consistently, building trust and comfort
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '200ms' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">Better Outcomes</h3>
                <p className="text-gray-600 leading-relaxed">
                  Continuity of care leads to improved health outcomes and satisfaction
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white border-l-4 border-green-600 p-8 lg:p-10 rounded-r-2xl shadow-md">
              <h3 className="font-bold text-2xl mb-6 text-gray-900">How Pods Work:</h3>
              <ul className="space-y-5 text-gray-700">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-700 font-bold">1</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 text-lg">Dedicated Team:</strong>
                    <p className="mt-1">Each pod has 8-12 caregivers assigned to serve 35-40 patients in a specific geographic area</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-700 font-bold">2</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 text-lg">Pod Lead:</strong>
                    <p className="mt-1">An experienced caregiver serves as Pod Lead, coordinating care and supporting team members</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-700 font-bold">3</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 text-lg">Geographic Focus:</strong>
                    <p className="mt-1">Pods serve patients within a 10-mile radius, reducing travel time and improving efficiency</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-700 font-bold">4</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 text-lg">Team Accountability:</strong>
                    <p className="mt-1">Pod performance is tracked through our Serenity Performance Index (SPI), promoting excellence</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team in Action - Image Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team in Action</h2>
              <p className="text-xl text-gray-600">
                See the dedication and compassion that defines Serenity Care Partners
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-80 fade-in">
                <img
                  src="https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1000&auto=format&fit=crop"
                  alt="Caregiver assisting elderly patient with warmth and care"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-80 fade-in" style={{ animationDelay: '100ms' }}>
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop"
                  alt="Healthcare team meeting discussing patient care"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Map */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-4">
              <span className="text-green-700 font-semibold text-sm">Where We Serve</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Service Areas Across Ohio</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bringing exceptional care to communities throughout the state
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-2xl shadow-md text-center hover-lift border border-gray-100 fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">Dayton</div>
                <p className="text-gray-600 mb-4">Montgomery County and surrounding areas</p>
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-green-700">1 Active Pod</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-md text-center hover-lift border border-gray-100 fade-in" style={{ animationDelay: '100ms' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">Columbus</div>
                <p className="text-gray-600 mb-4">Franklin County and surrounding areas</p>
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-green-700">1 Active Pod</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-md text-center hover-lift border border-gray-100 fade-in" style={{ animationDelay: '200ms' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">Cincinnati</div>
                <p className="text-gray-600 mb-4">Hamilton County and surrounding areas</p>
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-green-700">1 Active Pod</span>
                </div>
              </div>
            </div>

            <p className="text-center text-gray-600 text-lg">
              Expanding to serve more communities across Ohio.{' '}
              <Link href="/contact" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                Contact us to learn if we serve your area
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">3</div>
              <div className="text-gray-600 font-semibold">Active Pods</div>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '100ms' }}>
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">100+</div>
              <div className="text-gray-600 font-semibold">Patients Served</div>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">30+</div>
              <div className="text-gray-600 font-semibold">Professional Caregivers</div>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift border border-gray-100 fade-in" style={{ animationDelay: '300ms' }}>
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">95%</div>
              <div className="text-gray-600 font-semibold">Patient Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Join Our Team or Request Care</h2>
          <p className="text-xl mb-10 text-green-50 max-w-2xl mx-auto leading-relaxed">
            Experience the Serenity difference. We're hiring compassionate caregivers and accepting new patients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/careers">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-50">
                View Open Positions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-green-800">
                Request Care Information
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
