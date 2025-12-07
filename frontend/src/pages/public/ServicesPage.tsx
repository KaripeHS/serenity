import { Link } from 'react-router-dom';
import { MarketingButton } from '../../components/marketing';

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-sage-50 via-white to-sage-100">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 fade-in">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-serenity-green-100 shadow-sm">
                <svg className="w-5 h-5 text-serenity-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-warm-gray-700">Non-Medical Home Care Services</span>
              </div>

              <h1 className="text-5xl lg:text-6xl leading-tight font-serif tracking-tighter">
                <span className="text-warm-gray-900">Personalized Care.</span>
                <br />
                <span className="bg-gradient-to-r from-serenity-green-600 to-serenity-green-700 bg-clip-text text-transparent">
                  Delivered with Compassion.
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-warm-gray-600 leading-relaxed font-body">
                Non-medical home care services delivered with professionalism, compassion, and a commitment to your loved one's independence and dignity.
              </p>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative h-[500px] lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 rounded-xl hover-lift overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop"
                  alt="Caregiver helping senior prepare a meal together in kitchen"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Personal Care */}
            <div id="personal-care" className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-l-4 border-green-600 shadow-sm hover-lift fade-in scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Personal Care Assistance</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Assistance with activities of daily living (ADLs) to help your loved one maintain dignity and independence at home.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Bathing assistance
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Dressing assistance
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Grooming and hygiene
                      </li>
                    </ul>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Toileting assistance
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Ambulation support
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Mobility assistance
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Homemaker Services */}
            <div id="homemaker" className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-l-4 border-green-600 shadow-sm hover-lift fade-in scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Homemaker Services</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Help with household tasks to maintain a clean, safe, and comfortable home environment.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Meal preparation
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Light housekeeping
                      </li>
                    </ul>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Laundry assistance
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Home organization
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Companionship */}
            <div id="companionship" className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-l-4 border-green-600 shadow-sm hover-lift fade-in scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Companionship & Social Support</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Meaningful social engagement and emotional support to combat loneliness and improve quality of life.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Conversation and social interaction
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Recreational activities
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Emotional support
                      </li>
                    </ul>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Letter writing and reading
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Hobbies and games
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Technology assistance
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Respite Care */}
            <div id="respite-care" className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-l-4 border-green-600 shadow-sm hover-lift fade-in scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Respite Care for Family Caregivers</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Temporary relief for family caregivers who need a break to rest, recharge, or attend to other responsibilities.
                  </p>
                  <div className="space-y-4 text-gray-600">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p>
                        <strong className="text-gray-900">Flexible Scheduling:</strong> Available for a few hours, overnight, or extended periods based on your needs.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p>
                        <strong className="text-gray-900">Professional Care:</strong> Your loved one receives the same high-quality care from our pod team during your absence.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p>
                        <strong className="text-gray-900">Peace of Mind:</strong> Rest assured knowing your family member is in capable, compassionate hands.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Errands & Transportation */}
            <div id="errands-transportation" className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-l-4 border-green-600 shadow-sm hover-lift fade-in scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Errands & Transportation Assistance</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Help with getting around and completing daily tasks outside the home.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Escort to appointments
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Grocery shopping
                      </li>
                    </ul>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Prescription pickup
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Other errands
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Medication Reminders */}
            <div id="medication-reminders" className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-l-4 border-green-600 shadow-sm hover-lift fade-in scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Medication Reminders</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Verbal reminders to help your loved one stay on track with their medication schedule.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Note:</strong> Our caregivers provide verbal reminders only. We do not administer, dispense, or handle medications. This is a non-clinical support service.
                    </p>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Timely verbal reminders for scheduled medications
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Helping clients remember to take their medications as prescribed
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Communication with family about reminder compliance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Images Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-80 fade-in">
                <img
                  src="https://images.unsplash.com/photo-1542884748-2b87b36c6b90?q=80&w=800&auto=format&fit=crop"
                  alt="Caregiver and senior enjoying conversation together"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-80 fade-in" style={{ animationDelay: '100ms' }}>
                <img
                  src="https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?q=80&w=800&auto=format&fit=crop"
                  alt="Senior woman smiling warmly at home"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-80 fade-in" style={{ animationDelay: '200ms' }}>
                <img
                  src="https://images.unsplash.com/photo-1573497019236-17f8177b81e8?q=80&w=800&auto=format&fit=crop"
                  alt="Happy senior couple at home receiving care"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Authorization Process */}
      <section className="py-20 bg-sage-25">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-4">
                <span className="text-green-700 font-semibold text-sm">Simple Process</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How to Get Started</h2>
              <p className="text-xl text-gray-600">
                Begin your journey to exceptional care in four simple steps
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-lg">
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: 'Contact Us',
                    description: 'Reach out by phone or through our website. We\'ll answer your questions and learn about your loved one\'s situation to see if we\'re the right fit.'
                  },
                  {
                    step: 2,
                    title: 'In-Home Assessment',
                    description: 'Our care coordinator meets with you and your loved one at home to understand their needs, preferences, and daily routines—creating a personalized care plan.'
                  },
                  {
                    step: 3,
                    title: 'Meet Your Caregiver',
                    description: 'We\'ll introduce you to your dedicated caregiver—carefully matched to your loved one—along with your care coordinator who oversees all services.'
                  },
                  {
                    step: 4,
                    title: 'Compassionate Care Begins',
                    description: 'Care starts when you\'re ready. We handle all the paperwork, Medicaid authorizations, or private pay setup seamlessly behind the scenes.'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-6 fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-2 text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-10 text-center">
                <Link to="/contact">
                  <MarketingButton size="lg" variant="primary">
                    Get Started Today
                  </MarketingButton>
                </Link>
                <p className="mt-4 text-gray-500 text-sm">Contact us to learn more about how we can help your family.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accepted Payment */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Accepted Payment Methods</h2>
            <p className="text-xl text-gray-600">
              Flexible options to fit your needs
            </p>
          </div>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl text-center shadow-sm hover-lift fade-in border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
                🏥
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Medicaid Waiver</h3>
              <p className="text-gray-600">
                Ohio Medicaid waiver programs accepted
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl text-center shadow-sm hover-lift fade-in border border-gray-100" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
                💳
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Private Pay</h3>
              <p className="text-gray-600">
                Flexible payment plans available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-white bg-serenity-green-500">
        <div className="container mx-auto px-6 text-center fade-in-up">
          <h2 className="text-4xl lg:text-5xl mb-6 text-white font-serif tracking-tighter">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-95 font-body text-sage-50">
            Contact us today for a free consultation. We'll create a personalized care plan for your loved one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <MarketingButton size="lg" variant="gold">
                Request Care Information
              </MarketingButton>
            </Link>
            <a href="tel:+15134005113">
              <MarketingButton size="lg" variant="outline" className="border-white text-white hover:bg-serenity-green-700">
                Call: (513) 400-5113
              </MarketingButton>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
