import Link from 'next/link';
import { Button } from './components/Button';
import { TrustBadge } from './components/TrustBadge';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Trust-First Design */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Message */}
            <div className="space-y-8 fade-in">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Trusted by 100+ Families Across Ohio</span>
              </div>

              {/* Headline - Apple-inspired Typography */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-none">
                <span className="text-gray-900">Compassionate Care.</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Consistent Caregivers.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                Experience the Serenity difference with our innovative pod-based model.
                Dedicated caregivers, personalized attention, and exceptional outcomes for your loved ones.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="primary">
                  Request Care Information
                </Button>
                <Button size="lg" variant="outline">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call: 1-800-555-0100
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-bold text-gray-900">95%</span> Patient Satisfaction
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-600">Active Pods Across Ohio</p>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              {/* Hero Image - Caregiver with Senior Patient */}
              <div className="absolute inset-0 rounded-3xl shadow-2xl hover-lift overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1200&auto=format&fit=crop"
                  alt="Compassionate caregiver helping senior patient at home"
                  className="w-full h-full object-cover"
                />
                {/* Subtle overlay for better floating badge visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              </div>

              {/* Floating Trust Cards */}
              <div className="absolute -bottom-6 -left-6 w-64 fade-in" style={{ animationDelay: '400ms' }}>
                <TrustBadge
                  icon="✓"
                  label="HIPAA Compliant"
                  description="Your privacy protected"
                  verified
                />
              </div>
              <div className="absolute -top-6 -right-6 w-64 fade-in" style={{ animationDelay: '600ms' }}>
                <TrustBadge
                  icon="🏥"
                  label="Licensed & Insured"
                  description="Fully certified caregivers"
                  verified
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Pod Model Explanation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Serenity Care Partners?
            </h2>
            <p className="text-xl text-gray-600">
              Our innovative pod-based care model ensures personalized attention and consistent relationships
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '👥',
                title: 'Pod-Based Care Model',
                description: 'Small, dedicated teams of 35-40 patients ensure personalized attention and consistent relationships.',
                color: 'from-green-50 to-green-100',
              },
              {
                icon: '❤️',
                title: 'Exceptional Caregivers',
                description: 'Our caregiver-first culture attracts and retains the best talent with competitive pay and support.',
                color: 'from-green-50 to-green-100',
              },
              {
                icon: '📊',
                title: 'Data-Driven Excellence',
                description: 'Real-time performance tracking and Serenity Performance Index (SPI) ensure quality outcomes.',
                color: 'from-green-50 to-green-100',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-gradient-to-br hover-lift cursor-pointer fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Story Section - Our Caregivers in Action */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image Grid */}
            <div className="grid grid-cols-2 gap-4 fade-in">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-64">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=600&auto=format&fit=crop"
                    alt="Nurse providing professional care to elderly patient"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-48">
                  <img
                    src="https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=600&auto=format&fit=crop"
                    alt="Healthcare professional with patient"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-48">
                  <img
                    src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?q=80&w=600&auto=format&fit=crop"
                    alt="Senior care team meeting"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg hover-lift h-64">
                  <img
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop"
                    alt="Caregiver assisting elderly woman at home"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="space-y-6 fade-in" style={{ animationDelay: '200ms' }}>
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <span className="text-green-700 font-semibold text-sm">Our Commitment to Excellence</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Caregivers Who Truly Care
              </h2>

              <p className="text-xl text-gray-600 leading-relaxed">
                Our team members aren't just employees—they're passionate healthcare professionals dedicated to making a real difference in the lives of those they serve.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Rigorous Screening & Training</h4>
                    <p className="text-gray-600">Every caregiver undergoes comprehensive background checks, skills assessments, and ongoing professional development.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Competitive Compensation</h4>
                    <p className="text-gray-600">We pay above industry standards because we believe exceptional care starts with valuing our team.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Consistent Care Teams</h4>
                    <p className="text-gray-600">Our pod model means your loved one sees familiar faces, building trust and continuity of care.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Learn More About Our Team →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Serving Communities Across Ohio
            </h2>
            <p className="text-xl text-gray-600">
              Our pods provide comprehensive home health services throughout Ohio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { city: 'Dayton Area', county: 'Montgomery County', pods: 1 },
              { city: 'Columbus Area', county: 'Franklin County', pods: 1 },
              { city: 'Cincinnati Area', county: 'Hamilton County', pods: 1 },
            ].map((area, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover-lift text-center fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{area.city}</h3>
                <p className="text-gray-600 mb-4">{area.county}</p>
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-green-700">{area.pods} Active Pod{area.pods > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center mt-12 text-gray-600">
            Expanding to serve more communities across the state.{' '}
            <Link href="/contact" className="text-green-600 font-semibold hover:text-green-700">
              Contact us to learn if we serve your area →
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 mb-6">
              <span className="text-green-700 font-semibold text-sm">Trusted by Families Across Ohio</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Hear From Our Families
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from families who have experienced the Serenity difference
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "The consistent care team has made such a difference for my mother. She knows everyone by name and looks forward to their visits.",
                author: "Jennifer M.",
                location: "Columbus, OH",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
                rating: 5
              },
              {
                quote: "I was skeptical at first, but the pod-based model really works. My father gets personalized attention and his caregivers truly understand his needs.",
                author: "Michael R.",
                location: "Dayton, OH",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
                rating: 5
              },
              {
                quote: "As a caregiver, I've never felt more supported. The training, competitive pay, and manageable caseload make this the best job I've had.",
                author: "Sarah K., RN",
                location: "Cincinnati, OH",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-sm hover-lift fade-in border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges Row */}
          <div className="mt-16 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "🏆", label: "Top Rated", value: "4.9/5.0" },
              { icon: "👨‍⚕️", label: "Certified Caregivers", value: "100%" },
              { icon: "📈", label: "Patient Satisfaction", value: "95%" },
              { icon: "🏥", label: "Years Experience", value: "10+" }
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl fade-in"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Join Our Caring Team or Request Care
          </h2>
          <p className="text-xl mb-10 text-green-50 max-w-2xl mx-auto">
            Whether you're seeking care for a loved one or looking to join our team of compassionate professionals, we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/careers">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-50">
                View Open Positions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-green-800">
                Request Care Information
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
