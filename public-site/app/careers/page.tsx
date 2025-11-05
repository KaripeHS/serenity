import Link from 'next/link';
import { Button } from '../components/Button';

// Types matching backend API
interface Job {
  id: string;
  title: string;
  type: string;
  description: string;
  payRange: string;
  requirements: string[];
  postedAt: string;
  location: string;
}

async function getJobs(): Promise<Job[]> {
  // In production, this would fetch from the backend API
  // For now, return empty array (will work once database is set up)
  try {
    const res = await fetch('http://localhost:3000/api/public/careers/jobs', {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.jobs || [];
  } catch (error) {
    return [];
  }
}

export default async function CareersPage() {
  const jobs = await getJobs();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 fade-in">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Join Our Team</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
                <span className="text-gray-900">Build a Career</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Making a Difference
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                Join our caregiver-first culture where compassion meets competitive compensation. Help others while being part of a supportive team.
              </p>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative h-[500px] lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 rounded-3xl shadow-2xl hover-lift overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1590650153855-d9e808231d41?q=80&w=1200&auto=format&fit=crop"
                  alt="Happy healthcare team collaborating and smiling"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-4">
              <span className="text-green-700 font-semibold text-sm">Why Work With Us</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Exceptional Benefits for Exceptional People
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We invest in our team because we believe exceptional care starts with valued caregivers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift fade-in border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Competitive Pay</h3>
              <p className="text-gray-600 leading-relaxed">
                Market-leading wages with performance bonuses and overtime opportunities
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift fade-in border border-gray-100" style={{ animationDelay: '100ms' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Flexible Schedules</h3>
              <p className="text-gray-600 leading-relaxed">
                Full-time, part-time, and PRN positions available to fit your lifestyle
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift fade-in border border-gray-100" style={{ animationDelay: '200ms' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Career Growth</h3>
              <p className="text-gray-600 leading-relaxed">
                Training, certifications, and advancement opportunities to grow your skills
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift fade-in border border-gray-100" style={{ animationDelay: '300ms' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Pod-Based Model</h3>
              <p className="text-gray-600 leading-relaxed">
                Work with the same team and patients for consistent, meaningful relationships
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift fade-in border border-gray-100" style={{ animationDelay: '400ms' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Supportive Culture</h3>
              <p className="text-gray-600 leading-relaxed">
                Join a team that values compassion, collaboration, and continuous support
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover-lift fade-in border border-gray-100" style={{ animationDelay: '500ms' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Health Benefits</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive health, dental, and vision coverage for eligible employees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">
              Find your next opportunity to make a difference
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 lg:p-16 text-center max-w-3xl mx-auto border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">No positions currently available</h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Check back soon or submit your information to be notified when positions open.
              </p>
              <a href="mailto:careers@serenitycarepartners.com">
                <Button size="lg" variant="primary">
                  Contact HR Team
                </Button>
              </a>
            </div>
          ) : (
            <div className="grid gap-8 max-w-5xl mx-auto">
              {jobs.map((job, index) => (
                <Link
                  key={job.id}
                  href={`/careers/${job.id}`}
                  className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all border border-gray-100 hover-lift fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.type}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{job.description}</p>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <span className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-200">
                        {job.payRange}
                      </span>
                      <span className="text-green-600 font-bold flex items-center gap-2">
                        View Details
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Culture Images */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Life at Serenity Care Partners</h2>
              <p className="text-xl text-gray-600">
                Join a team that values compassion, collaboration, and professional growth
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-96 fade-in">
                <img
                  src="https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=1000&auto=format&fit=crop"
                  alt="Healthcare team collaborating in modern office environment"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-96 fade-in" style={{ animationDelay: '100ms' }}>
                <img
                  src="https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?q=80&w=1000&auto=format&fit=crop"
                  alt="Happy caregiver with patient showing positive workplace culture"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-4">
              <span className="text-green-700 font-semibold text-sm">Simple Process</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Hiring Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From application to your first day, we make joining our team easy and transparent
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: 1,
                  title: 'Apply Online',
                  description: 'Submit your application through our careers portal or send your resume directly'
                },
                {
                  step: 2,
                  title: 'Phone Screen',
                  description: 'Brief conversation with our HR team to discuss your experience and interests'
                },
                {
                  step: 3,
                  title: 'Interview',
                  description: 'Meet with hiring manager and team lead to learn more about the role'
                },
                {
                  step: 4,
                  title: 'Start',
                  description: 'Background check, onboarding, and comprehensive training to prepare you for success'
                }
              ].map((item, index) => (
                <div key={index} className="text-center fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-10 text-green-50 max-w-2xl mx-auto leading-relaxed">
            Join a team that values compassion, excellence, and your professional growth. Start your rewarding career with Serenity Care Partners today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:careers@serenitycarepartners.com">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-50">
                Contact HR Team
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-green-800">
                Learn More About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
