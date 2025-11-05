import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Compassionate Home Care Across Ohio
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Experience the Serenity difference with our innovative pod-based care model.
              Dedicated caregivers, consistent relationships, and exceptional outcomes for your loved ones.
            </p>
            <div className="flex gap-4">
              <Link
                href="/careers"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Join Our Team
              </Link>
              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Request Care
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Serenity Care Partners?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Pod-Based Care Model</h3>
              <p className="text-gray-600">
                Small, dedicated teams of 35-40 patients ensure personalized attention and consistent relationships.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Exceptional Caregivers</h3>
              <p className="text-gray-600">
                Our caregiver-first culture attracts and retains the best talent with competitive pay and support.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Data-Driven Excellence</h3>
              <p className="text-gray-600">
                Real-time performance tracking and Serenity Performance Index (SPI) ensure quality outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Serving Communities Across Ohio</h2>
            <p className="text-gray-600 mb-8">
              Our pods provide comprehensive home health services throughout Ohio, with dedicated teams in:
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-lg">
              <div className="p-4 bg-blue-50 rounded-lg font-semibold text-blue-900">
                Dayton Area
              </div>
              <div className="p-4 bg-blue-50 rounded-lg font-semibold text-blue-900">
                Columbus Area
              </div>
              <div className="p-4 bg-blue-50 rounded-lg font-semibold text-blue-900">
                Cincinnati Area
              </div>
            </div>
            <p className="mt-6 text-gray-600">
              Expanding to serve more communities across the state
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Caring Team</h2>
          <p className="text-xl mb-8 text-blue-100">
            We are hiring compassionate caregivers, nurses, and healthcare professionals across Ohio
          </p>
          <Link
            href="/careers"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            View Open Positions
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Get Started Today</h2>
            <p className="text-gray-600 mb-8">
              Whether you are seeking care for a loved one or looking to join our team,
              we are here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Request Care Information
              </Link>
              <a
                href="tel:1-800-555-0100"
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Call: 1-800-555-0100
              </a>
            </div>
            <p className="mt-6 text-gray-500 text-sm">
              Office Hours: Monday-Friday, 8:00 AM - 6:00 PM EST
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
