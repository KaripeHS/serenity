import { Link } from 'react-router-dom';
import { MarketingButton } from '../../components/marketing';
import { useContentAssets } from '../../hooks/useContentAssets';

const ABOUT_IMAGE_DEFAULTS: Record<string, { url: string; alt_text: string }> = {
  'about.hero.image': { url: 'https://plus.unsplash.com/premium_photo-1661311814560-8270b2427088?q=80&w=1200&auto=format&fit=crop', alt_text: 'Caregiver walking with senior in a park' },
  'about.team.gloria': { url: 'https://ui-avatars.com/api/?name=Gloria&background=7c9a72&color=fff&size=400&rounded=true&bold=true&font-size=0.4', alt_text: 'Gloria, CEO of Serenity Care Partners' },
  'about.team.bignon': { url: 'https://ui-avatars.com/api/?name=Bignon&background=5b7a52&color=fff&size=400&rounded=true&bold=true&font-size=0.4', alt_text: 'Bignon, COO and CFO of Serenity Care Partners' },
  'about.podmodel.image': { url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1400&auto=format&fit=crop', alt_text: 'Care team collaborating in pod-based care model' },
  'about.action.image1': { url: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1000&auto=format&fit=crop', alt_text: 'Caregiver assisting elderly client at home' },
  'about.action.image2': { url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000&auto=format&fit=crop', alt_text: 'Care coordination team in a planning meeting' },
};

export default function AboutPage() {
  const { getUrl, getAlt } = useContentAssets('about', ABOUT_IMAGE_DEFAULTS);
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-gradient-to-br from-sage-50 via-white to-sage-100">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 fade-in">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-serenity-green-100">
                <span className="text-sm font-semibold text-warm-gray-700">Our Story</span>
              </div>

              <h1 className="text-5xl lg:text-6xl leading-tight font-serif tracking-tighter">
                <span className="text-warm-gray-900">Redefining Home Health Care</span>
                <br />
                <span className="bg-gradient-to-r from-serenity-green-600 to-serenity-green-700 bg-clip-text text-transparent">
                  One Pod at a Time
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-warm-gray-600 leading-relaxed">
                We believe exceptional care starts with exceptional caregivers. Our innovative pod-based model transforms how home health care is delivered in Greater Cincinnati, Ohio.
              </p>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative h-[500px] lg:h-[600px] fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 rounded-xl shadow-lg hover-lift overflow-hidden">
                <img
                  src={getUrl('about.hero.image')}
                  alt={getAlt('about.hero.image')}
                  className="w-full h-full object-cover ken-burns"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section id="mission" className="py-24 bg-mist-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="p-8 bg-white rounded-xl shadow-sm border border-warm-gray-100 hover-lift fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl mb-4 text-warm-gray-900 font-serif tracking-tight">Our Mission</h2>
              <p className="text-warm-gray-700 leading-relaxed text-lg">
                To provide all clients with professional, compassionate care while demonstrating caring through love, gentleness, patience, and kindness. We achieve this through our innovative pod-based care model, investment in our caregivers, and relentless focus on quality outcomes.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-sm border border-warm-gray-100 hover-lift fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-champagne-gold-50 to-champagne-gold-100 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8 text-champagne-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-3xl mb-4 text-warm-gray-900 font-serif tracking-tight">Our Vision</h2>
              <p className="text-warm-gray-700 leading-relaxed text-lg">
                To be Greater Cincinnati's most trusted home health care provider, setting the standard for quality, reliability, and caregiver satisfaction. We envision a future where every client receives consistent, personalized care from dedicated professionals who know them and their needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section id="team" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <div className="inline-flex items-center gap-2 bg-champagne-gold-50 px-4 py-2.5 rounded-full border border-champagne-gold-200 mb-4">
              <span className="text-champagne-gold-700 font-semibold text-sm">Meet Our Leaders</span>
            </div>
            <h2 className="text-4xl lg:text-5xl text-warm-gray-900 mb-4 font-serif tracking-tighter">Leadership Team</h2>
            <p className="text-xl text-warm-gray-600 max-w-3xl mx-auto">
              Experienced healthcare professionals dedicated to transforming home health care
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 p-8 text-center fade-in-up">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
                <img
                  src={getUrl('about.team.gloria')}
                  alt={getAlt('about.team.gloria')}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl mb-2 text-warm-gray-900 font-heading">Gloria</h3>
              <p className="text-serenity-green-600 font-semibold mb-6 text-lg">Chief Executive Officer</p>
              <p className="text-warm-gray-600 leading-relaxed">
                With decades of experience in home health care, Gloria founded Serenity Care Partners with a vision to transform the industry through innovation and compassion. Her leadership has established our reputation for excellence in Greater Cincinnati.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 p-8 text-center fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
                <img
                  src={getUrl('about.team.bignon')}
                  alt={getAlt('about.team.bignon')}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl mb-2 text-warm-gray-900 font-heading">Bignon</h3>
              <p className="text-serenity-green-600 font-semibold mb-6 text-lg">Chief Operating Officer & CFO</p>
              <p className="text-warm-gray-600 leading-relaxed">
                Bignon brings expertise in healthcare operations and financial management, ensuring operational excellence and sustainable growth. His strategic vision drives our expansion and continuous improvement initiatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pod Model Explanation */}
      <section id="pod-based-care" className="py-24 bg-sage-50 scroll-mt-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 fade-in-up">
              <div className="inline-flex items-center gap-2 bg-serenity-green-50 px-4 py-2.5 rounded-full border border-serenity-green-200 mb-4">
                <span className="text-serenity-green-700 font-semibold text-sm">Our Innovation</span>
              </div>
              <h2 className="text-4xl lg:text-5xl text-warm-gray-900 mb-4 font-serif tracking-tighter">The Pod Model: Our Competitive Advantage</h2>
              <p className="text-xl text-warm-gray-600 max-w-3xl mx-auto">
                Unlike traditional home health agencies that assign caregivers randomly, our pod-based model ensures your loved one sees the same familiar faces—caregivers who truly know them.
              </p>
            </div>

            {/* Pod Model Image */}
            <div className="mb-16 rounded-xl overflow-hidden shadow-lg hover-lift fade-in">
              <img
                src={getUrl('about.podmodel.image')}
                alt={getAlt('about.podmodel.image')}
                className="w-full h-[500px] object-cover"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up">
                <div className="w-20 h-20 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl mb-3 text-warm-gray-900 font-heading">Small Teams</h3>
                <p className="text-warm-gray-600 leading-relaxed">
                  Intentionally small pods mean caregivers have time to truly know each client
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl mb-3 text-warm-gray-900 font-heading">Familiar Faces</h3>
                <p className="text-warm-gray-600 leading-relaxed">
                  Clients see the same caregivers consistently, building trust and comfort
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-champagne-gold-50 to-champagne-gold-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-champagne-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl mb-3 text-warm-gray-900 font-heading">Better Outcomes</h3>
                <p className="text-warm-gray-600 leading-relaxed">
                  Continuity of care leads to improved health outcomes and satisfaction
                </p>
              </div>
            </div>

            <div className="bg-white border-l-4 border-serenity-green-600 p-8 lg:p-10 rounded-r-xl shadow-sm">
              <h3 className="text-2xl mb-6 text-warm-gray-900 font-heading">How Pods Work:</h3>
              <ul className="space-y-5 text-warm-gray-700">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-serenity-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-serenity-green-700 font-bold">1</span>
                  </div>
                  <div>
                    <strong className="text-warm-gray-900 text-lg">Dedicated Team:</strong>
                    <p className="mt-1">A small group of caregivers is assigned exclusively to your neighborhood, so you always see familiar faces</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-serenity-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-serenity-green-700 font-bold">2</span>
                  </div>
                  <div>
                    <strong className="text-warm-gray-900 text-lg">Pod Lead:</strong>
                    <p className="mt-1">An experienced caregiver serves as Pod Lead, coordinating care and supporting team members</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-serenity-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-serenity-green-700 font-bold">3</span>
                  </div>
                  <div>
                    <strong className="text-warm-gray-900 text-lg">Geographic Focus:</strong>
                    <p className="mt-1">Pods serve clients within a 10-mile radius, reducing travel time and improving efficiency</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-serenity-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-serenity-green-700 font-bold">4</span>
                  </div>
                  <div>
                    <strong className="text-warm-gray-900 text-lg">Team Accountability:</strong>
                    <p className="mt-1">Pod performance is tracked through our Serenity Performance Index (SPI), promoting excellence</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team in Action - Image Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 fade-in-up">
              <h2 className="text-4xl text-warm-gray-900 mb-4 font-serif tracking-tighter">Our Team in Action</h2>
              <p className="text-xl text-warm-gray-600">
                See the dedication and compassion that defines Serenity Care Partners
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl overflow-hidden shadow-lg hover-lift h-80 fade-in">
                <img
                  src={getUrl('about.action.image1')}
                  alt={getAlt('about.action.image1')}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg hover-lift h-80 fade-in" style={{ animationDelay: '100ms' }}>
                <img
                  src={getUrl('about.action.image2')}
                  alt={getAlt('about.action.image2')}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-24 bg-sage-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <div className="inline-flex items-center gap-2 bg-serenity-green-50 px-4 py-2.5 rounded-full border border-serenity-green-200 mb-4">
              <span className="text-serenity-green-700 font-semibold text-sm">Where We Serve</span>
            </div>
            <h2 className="text-4xl lg:text-5xl text-warm-gray-900 mb-4 font-serif tracking-tighter">Greater Cincinnati Service Area</h2>
            <p className="text-xl text-warm-gray-600 max-w-3xl mx-auto">
              Proudly serving families across four counties in Greater Cincinnati, Ohio from our headquarters in Blue Ash
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Counties Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {[
                { name: 'Hamilton County', city: 'Cincinnati area' },
                { name: 'Butler County', city: 'Hamilton area' },
                { name: 'Warren County', city: 'Lebanon area' },
                { name: 'Clermont County', city: 'Batavia area' },
              ].map((county, index) => (
                <div
                  key={county.name}
                  className="bg-white p-6 rounded-xl shadow-sm text-center hover-lift border border-warm-gray-100 fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-serenity-green-50 to-serenity-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-serenity-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-lg text-warm-gray-900 font-semibold mb-1">{county.name}</div>
                  <p className="text-warm-gray-500 text-sm">{county.city}</p>
                </div>
              ))}
            </div>

            {/* Headquarters */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-warm-gray-100 text-center fade-in-up">
              <div className="inline-flex items-center gap-2 bg-champagne-gold-50 px-4 py-2 rounded-full border border-champagne-gold-200 mb-4">
                <span className="text-champagne-gold-700 font-semibold text-sm">Headquarters</span>
              </div>
              <h3 className="text-2xl text-warm-gray-900 font-heading mb-2">Blue Ash, Ohio</h3>
              <p className="text-warm-gray-600 mb-6">
                Centrally located to serve all of Greater Cincinnati
              </p>
              <Link to="/contact" className="text-serenity-green-600 font-semibold hover:text-serenity-green-700 transition-colors">
                Contact us to learn more about our services in your area →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-mist-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up">
              <div className="text-5xl bg-gradient-to-r from-serenity-green-600 to-serenity-green-700 bg-clip-text text-transparent mb-3 count-up font-heading">3</div>
              <div className="text-warm-gray-600 font-semibold">Active Pods</div>
            </div>
            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="text-5xl bg-gradient-to-r from-serenity-green-600 to-serenity-green-700 bg-clip-text text-transparent mb-3 count-up font-heading">100+</div>
              <div className="text-warm-gray-600 font-semibold">Clients Served</div>
            </div>
            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="text-5xl bg-gradient-to-r from-serenity-green-600 to-serenity-green-700 bg-clip-text text-transparent mb-3 count-up font-heading">30+</div>
              <div className="text-warm-gray-600 font-semibold">Professional Caregivers</div>
            </div>
            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover-lift border border-warm-gray-100 fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="text-5xl bg-gradient-to-r from-serenity-green-600 to-serenity-green-700 bg-clip-text text-transparent mb-3 count-up font-heading">95%</div>
              <div className="text-warm-gray-600 font-semibold">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-white bg-serenity-green-500">
        <div className="container mx-auto px-6 text-center fade-in-up">
          <h2 className="text-4xl lg:text-5xl mb-6 text-white font-serif tracking-tighter">Join Our Team or Request Care</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed opacity-95 text-sage-50">
            Experience the Serenity difference. We're hiring compassionate caregivers and accepting new clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/careers">
              <MarketingButton size="lg" variant="gold">
                View Open Positions
              </MarketingButton>
            </Link>
            <Link to="/contact">
              <MarketingButton size="lg" variant="outline" className="border-white text-white hover:bg-serenity-green-700">
                Request Care Information
              </MarketingButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
