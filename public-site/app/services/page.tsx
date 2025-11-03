import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Comprehensive home health care services delivered with compassion,
            professionalism, and a commitment to your loved one's independence.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Personal Care */}
            <div className="bg-gray-50 rounded-lg p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Personal Care Services</h3>
                  <p className="text-gray-700 mb-4 text-lg">
                    Assistance with activities of daily living (ADLs) to help your loved one maintain
                    dignity and independence at home.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Bathing and grooming
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Dressing assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Meal preparation
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Medication reminders
                      </li>
                    </ul>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Mobility assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Toileting and incontinence care
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Light housekeeping
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Transportation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Skilled Nursing */}
            <div className="bg-gray-50 rounded-lg p-8 border-l-4 border-green-600">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Skilled Nursing Care</h3>
                  <p className="text-gray-700 mb-4 text-lg">
                    Professional medical care provided by licensed nurses (RN/LPN) for patients
                    with complex health needs.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Wound care and dressing changes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Medication administration
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        IV therapy
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Pain management
                      </li>
                    </ul>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Vital signs monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Catheter care
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Ostomy care
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Patient/family education
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Companionship */}
            <div className="bg-gray-50 rounded-lg p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Companionship Services</h3>
                  <p className="text-gray-700 mb-4 text-lg">
                    Social engagement and emotional support to combat loneliness and improve
                    quality of life for seniors.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Conversation and social interaction
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Activity planning
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Escort to appointments
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Recreational activities
                      </li>
                    </ul>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Letter writing/reading
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Shopping assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Pet care assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Technology support
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Respite Care */}
            <div className="bg-gray-50 rounded-lg p-8 border-l-4 border-orange-600">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Respite Care</h3>
                  <p className="text-gray-700 mb-4 text-lg">
                    Temporary relief for family caregivers who need a break to rest, recharge,
                    or attend to other responsibilities.
                  </p>
                  <div className="space-y-3 text-gray-600">
                    <p>
                      <strong className="text-gray-900">Flexible Scheduling:</strong> Available for
                      a few hours, overnight, or extended periods based on your needs.
                    </p>
                    <p>
                      <strong className="text-gray-900">Professional Care:</strong> Your loved one
                      receives the same high-quality care from our pod team during your absence.
                    </p>
                    <p>
                      <strong className="text-gray-900">Peace of Mind:</strong> Rest assured knowing
                      your family member is in capable, compassionate hands.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Authorization Process */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">How to Get Started</h2>
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Initial Consultation</h3>
                    <p className="text-gray-600">
                      Contact us for a free consultation. We'll discuss your loved one's needs,
                      preferences, and create a personalized care plan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Insurance Verification</h3>
                    <p className="text-gray-600">
                      We work with Medicaid, Medicare, and private insurance. Our team will verify
                      coverage and obtain necessary authorizations.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Meet Your Pod Team</h3>
                    <p className="text-gray-600">
                      We'll introduce you to your dedicated pod team - the same caregivers who will
                      consistently visit your loved one.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Care Begins</h3>
                    <p className="text-gray-600">
                      Services start on your preferred date. We provide 24/7 support and regular
                      updates on your loved one's care.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accepted Insurance */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Accepted Payment Methods</h2>
          <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">🏥</div>
              <h3 className="font-bold text-lg mb-2">Medicaid</h3>
              <p className="text-gray-600 text-sm">
                Ohio Medicaid waiver programs accepted
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">🏛️</div>
              <h3 className="font-bold text-lg mb-2">Medicare</h3>
              <p className="text-gray-600 text-sm">
                Medicare-certified home health services
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="font-bold text-lg mb-2">Private Pay</h3>
              <p className="text-gray-600 text-sm">
                Flexible payment plans available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Contact us today for a free consultation. We'll create a personalized care plan
            for your loved one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Request Care Information
            </Link>
            <a
              href="tel:1-800-555-0100"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Call: 1-800-555-0100
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
