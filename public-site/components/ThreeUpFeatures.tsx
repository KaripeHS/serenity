/**
 * ThreeUpFeatures Component
 * Displays 3 feature cards in a grid layout with icons and descriptions.
 * Use Tailwind v4 custom properties for colors when possible.
 * Fallback to hex values (#0C5A3D, #F3F6F4, etc.) if CSS variables fail.
 */

'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.2, 0, 0.38, 0.9] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ThreeUpFeaturesProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  features: [Feature, Feature, Feature];
  backgroundColor?: 'sage' | 'white';
}

export default function ThreeUpFeatures({
  eyebrow = "Why Choose Us",
  headline,
  subheadline,
  features,
  backgroundColor = 'sage'
}: ThreeUpFeaturesProps) {
  const bgClass = backgroundColor === 'sage' ? 'bg-sage-25' : 'bg-white';

  return (
    <section className={`py-24 ${bgClass}`}>
      <div className="container mx-auto px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="font-medium text-xs tracking-widest uppercase mb-6 text-warm-gray-400" style={{ letterSpacing: '0.15em' }}>
            {eyebrow}
          </p>
          <h2
            className="mb-6 text-warm-gray-900"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 4vw, 44px)',
              lineHeight: '1.2',
              letterSpacing: '-0.01em',
              fontWeight: '400'
            }}
          >
            {headline}
          </h2>
          {subheadline && (
            <p className="text-warm-gray-600" style={{ fontSize: '1.0625rem', lineHeight: '1.7' }}>
              {subheadline}
            </p>
          )}
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-10 text-center transition-all duration-300 hover:shadow-lg"
              variants={fadeInUp}
              style={{ border: '1px solid rgba(0, 0, 0, 0.06)' }}
            >
              <div className="mb-6 text-serenity-green-500 flex justify-center">
                {feature.icon}
              </div>
              <h3
                className="mb-4 text-warm-gray-900"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  lineHeight: '1.4'
                }}
              >
                {feature.title}
              </h3>
              <p className="text-warm-gray-600 mx-auto" style={{ fontSize: '1rem', lineHeight: '1.7', maxWidth: '32ch' }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
