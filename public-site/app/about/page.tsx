import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">About Serenity Care Partners</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Revolutionizing home health care with our innovative pod-based model,
            caregiver-first culture, and commitment to excellence.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-blue-600">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To deliver exceptional, compassionate home health care that enables our patients
                to live with dignity and independence in the comfort of their own homes. We achieve
                this through our innovative pod-based care model, investment in our caregivers,
                and relentless focus on quality outcomes.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4 text-blue-600">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To be Ohio's most trusted home health care provider, setting the standard for
                quality, reliability, and caregiver satisfaction. We envision a future where
                every patient receives consistent, personalized care from dedicated professionals
                who know them and their needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Leadership Team</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-4 mx-auto">
                G
              </div>
              <h3 className="text-2xl font-bold text-center mb-2">Gloria</h3>
              <p className="text-blue-600 text-center font-semibold mb-4">Chief Executive Officer</p>
              <p className="text-gray-600 text-center">
                With decades of experience in home health care, Gloria founded Serenity Care Partners
                with a vision to transform the industry through innovation and compassion. Her
                leadership has established our reputation for excellence across Ohio.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-4 mx-auto">
                B
              </div>
              <h3 className="text-2xl font-bold text-center mb-2">Bignon</h3>
              <p className="text-blue-600 text-center font-semibold mb-4">Chief Operating Officer & CFO</p>
              <p className="text-gray-600 text-center">
                Bignon brings expertise in healthcare operations and financial management, ensuring
                operational excellence and sustainable growth. His strategic vision drives our
                expansion and continuous improvement initiatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pod Model Explanation */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">The Pod Model: Our Competitive Advantage</h2>
            <p className="text-gray-700 text-lg text-center mb-12">
              Unlike traditional home health agencies that assign caregivers randomly, our pod-based
              model creates small, dedicated teams that work together to serve 35-40 patients.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Small Teams</h3>
                <p className="text-gray-600">
                  35-40 patients per pod ensures personalized attention and consistent care
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Familiar Faces</h3>
                <p className="text-gray-600">
                  Patients see the same caregivers consistently, building trust and comfort
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Better Outcomes</h3>
                <p className="text-gray-600">
                  Continuity of care leads to improved health outcomes and satisfaction
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <h3 className="font-bold text-xl mb-3 text-blue-900">How Pods Work:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">1.</span>
                  <span><strong>Dedicated Team:</strong> Each pod has 8-12 caregivers assigned to serve 35-40 patients in a specific geographic area</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">2.</span>
                  <span><strong>Pod Lead:</strong> An experienced caregiver serves as Pod Lead, coordinating care and supporting team members</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">3.</span>
                  <span><strong>Geographic Focus:</strong> Pods serve patients within a 10-mile radius, reducing travel time and improving efficiency</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">4.</span>
                  <span><strong>Team Accountability:</strong> Pod performance is tracked through our Serenity Performance Index (SPI), promoting excellence</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Map */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Service Areas Across Ohio</h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Dayton</div>
                <p className="text-gray-600">Montgomery County and surrounding areas</p>
                <p className="text-sm text-gray-500 mt-2">Active Pods: 1</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Columbus</div>
                <p className="text-gray-600">Franklin County and surrounding areas</p>
                <p className="text-sm text-gray-500 mt-2">Active Pods: 1</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Cincinnati</div>
                <p className="text-gray-600">Hamilton County and surrounding areas</p>
                <p className="text-sm text-gray-500 mt-2">Active Pods: 1</p>
              </div>
            </div>
            <p className="text-center text-gray-600 text-lg">
              Expanding to serve more communities across Ohio. Contact us to learn if we serve your area.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">3</div>
              <div className="text-gray-600">Active Pods</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600">Patients Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">30+</div>
              <div className="text-gray-600">Professional Caregivers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Patient Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Team or Request Care</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Experience the Serenity difference. We're hiring compassionate caregivers and accepting new patients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/careers"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              View Open Positions
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Request Care Information
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
