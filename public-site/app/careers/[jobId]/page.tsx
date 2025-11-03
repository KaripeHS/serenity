import Link from 'next/link';
import { notFound } from 'next/navigation';

// In production, fetch from API
async function getJob(jobId: string) {
  try {
    const res = await fetch(`http://localhost:3000/api/public/careers/jobs/${jobId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.job;
  } catch (error) {
    // Mock job for testing
    return {
      id: jobId,
      title: 'Home Health Aide (HHA)',
      type: 'Full-Time',
      location: 'Dayton, OH',
      payRange: '$16-19/hr',
      postedAt: new Date().toISOString(),
      description: 'Join our dedicated team of compassionate caregivers providing exceptional home health care to patients across the Dayton area. You\'ll be part of our innovative pod-based care model, working with the same patients and team members consistently.',
      responsibilities: [
        'Assist patients with activities of daily living (ADLs) including bathing, dressing, grooming, and toileting',
        'Provide medication reminders and light housekeeping',
        'Prepare meals according to dietary requirements',
        'Assist with mobility and transfers',
        'Document care provided and report changes in patient condition',
        'Maintain a safe, clean environment for patients',
        'Communicate effectively with pod team and nursing staff',
        'Complete all required EVV (Electronic Visit Verification) documentation'
      ],
      requirements: [
        'Valid Ohio HHA or STNA certification required',
        'Minimum 1 year of home health or long-term care experience preferred',
        'Current CPR certification',
        'Reliable transportation and valid driver\'s license',
        'Smartphone capable of using our EVV mobile app',
        'Ability to lift 50 pounds and assist with patient transfers',
        'Excellent communication and interpersonal skills',
        'Compassionate, patient, and professional demeanor',
        'Pass background check and drug screening'
      ],
      benefits: [
        'Competitive hourly wages ($16-19/hr based on experience)',
        'Performance bonuses through our Serenity Performance Index (SPI)',
        'Overtime opportunities for high-performing caregivers',
        'Health, dental, and vision insurance (full-time)',
        '401(k) with company match',
        'Paid time off and holiday pay',
        'Ongoing training and certification reimbursement',
        'Consistent scheduling with the same patients (pod model)',
        'Supportive team environment with pod leads',
        'Career advancement opportunities'
      ],
      schedule: 'Full-time positions available. Flexible scheduling options including days, evenings, and weekends. Consistent hours with your dedicated pod.'
    };
  }
}

export default async function JobDetailPage({ params }: { params: { jobId: string } }) {
  const job = await getJob(params.jobId);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <Link href="/careers" className="text-blue-100 hover:text-white mb-4 inline-block">
              ← Back to Careers
            </Link>
            <h1 className="text-4xl font-bold mb-4">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-lg">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.type}
              </span>
              <span className="flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.payRange}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">About This Position</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {job.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Responsibilities
                </h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Requirements
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Benefits & Perks
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {job.benefits.map((item: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-8">
              <h3 className="font-bold text-lg mb-2 text-blue-900">Schedule</h3>
              <p className="text-gray-700">{job.schedule}</p>
            </div>

            {/* Apply Button */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Apply?</h2>
              <p className="text-gray-600 mb-6">
                Join our team and make a difference in the lives of patients across Ohio.
              </p>
              <Link
                href={`/careers/apply/${job.id}`}
                className="inline-block bg-blue-600 text-white px-12 py-4 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
              >
                Apply for This Position
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                Application takes approximately 10-15 minutes to complete
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
