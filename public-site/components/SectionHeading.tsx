/**
 * SectionHeading Component
 * Reusable section heading with eyebrow, headline, and optional subheadline.
 * Use Tailwind v4 custom properties for colors when possible.
 * Fallback to hex values if needed.
 */

interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  headline,
  subheadline,
  alignment = 'center',
  className = ''
}: SectionHeadingProps) {
  const alignClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';
  const maxWidthClass = alignment === 'center' ? 'max-w-3xl' : 'max-w-4xl';

  return (
    <div className={`${alignClass} ${maxWidthClass} ${className}`}>
      {eyebrow && (
        <p
          className="font-medium text-xs tracking-widest uppercase mb-6 text-warm-gray-400"
          style={{ letterSpacing: '0.15em' }}
        >
          {eyebrow}
        </p>
      )}
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
        <p className="text-warm-gray-600" style={{ fontSize: '1.0625rem', lineHeight: '1.7', maxWidth: '65ch', margin: alignment === 'center' ? '0 auto' : '0' }}>
          {subheadline}
        </p>
      )}
    </div>
  );
}
