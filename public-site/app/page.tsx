import Link from 'next/link';
import { Button } from './components/Button';
import { TrustBadge } from './components/TrustBadge';

// API Base URL - configure based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch page content from CMS
async function getPageContent(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/content/pages/${slug}`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching page content:', error);
    return null;
  }
}

// Fetch organization settings from CMS
async function getSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/content/settings`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

// Fetch testimonials from CMS
async function getTestimonials() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/content/testimonials?featured=true&limit=3`, {
      next: { revalidate: 120 } // Revalidate every 2 minutes
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch content from CMS
  const pageContent = await getPageContent('home');
  const settings = await getSettings();
  const testimonials = await getTestimonials();

  // Fallback values if CMS data not available
  const heroTitle = pageContent?.hero_title || 'Compassionate Care. Consistent Caregivers.';
  const heroSubtitle = pageContent?.hero_subtitle || 'Experience the Serenity difference with our innovative pod-based model. Dedicated caregivers, personalized attention, and exceptional outcomes for your loved ones.';
  const heroCTAText = pageContent?.hero_cta_text || 'Request Care Information';
  const heroCTAUrl = pageContent?.hero_cta_url || '/contact';
  const heroImageUrl = pageContent?.hero_image_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1200&auto=format&fit=crop';

  const primaryPhone = settings?.primary_phone || '1-800-555-0100';
  const satisfactionRate = settings?.patient_satisfaction_rate || 95;
  const totalPods = settings?.total_pods || 3;

  return (
    <div className="min-h-screen">
      {/* Hero Section - CMS Powered */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Message (CMS Content) */}
            <div className="space-y-8 fade-in">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Trusted by 100+ Families Across Ohio</span>
              </div>

              {/* Headline - CMS Powered */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-none">
                {heroTitle.split('.').map((part, idx) => {
                  if (!part.trim()) return null;
                  return idx === 0 ? (
                    <span key={idx} className="text-gray-900">{part}.</span>
                  ) : (
                    <>
                      <br />
                      <span key={idx} className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                        {part}.
                      </span>
                    </>
                  );
                })}
              </h1>

              {/* Subheadline - CMS Powered */}
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                {heroSubtitle}
              </p>

              {/* CTA Buttons - CMS Powered */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={heroCTAUrl}>
                  <Button size="lg" variant="primary">
                    {heroCTAText}
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call: {primaryPhone}
                </Button>
              </div>

              {/* Social Proof - CMS Powered */}
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
                    <span className="font-bold text-gray-900">{satisfactionRate}%</span> Patient Satisfaction
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{totalPods}</p>
                  <p className="text-sm text-gray-600">Active Pods Across Ohio</p>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image (CMS Powered) */}
            <div className="relative lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              {/* Hero Image */}
              <div className="absolute inset-0 rounded-3xl shadow-2xl hover-lift overflow-hidden">
                <img
                  src={heroImageUrl}
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
                color: 'from-blue-50 to-blue-100',
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
                color: 'from-purple-50 to-purple-100',
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

      {/* Testimonials Section - CMS Powered */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                What Families Are Saying
              </h2>
              <p className="text-xl text-gray-600">
                Real stories from families who trust us with their loved ones
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial: any, index: number) => (
                <div
                  key={testimonial.id}
                  className="bg-white p-8 rounded-2xl shadow-lg hover-lift fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Star Rating */}
                  {testimonial.rating && (
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}

                  {/* Quote */}
                  <blockquote className="text-gray-700 italic mb-6">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    {testimonial.author_photo_url && (
                      <img
                        src={testimonial.author_photo_url}
                        alt={testimonial.author_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author_name}</p>
                      {testimonial.author_title && (
                        <p className="text-sm text-gray-600">{testimonial.author_title}</p>
                      )}
                      {testimonial.author_location && (
                        <p className="text-xs text-gray-500">{testimonial.author_location}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call-to-Action Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Experience the Serenity Difference?
          </h2>
          <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
            Let us show you how our pod-based care model provides better outcomes for your loved ones
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={heroCTAUrl}>
              <Button size="lg" variant="primary" className="bg-white text-green-600 hover:bg-green-50">
                {heroCTAText}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Call {primaryPhone}
            </Button>
          </div>
        </div>
      </section>

      {/* CMS Integration Notice (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          ✨ Content powered by CMS
        </div>
      )}
    </div>
  );
}
