'use client';

interface TrustBadgeProps {
  icon: string;
  label: string;
  description: string;
  verified?: boolean;
  variant?: 'default' | 'gold';
}

export function TrustBadge({
  icon,
  label,
  description,
  verified = false,
  variant = 'default'
}: TrustBadgeProps) {
  const bgColor = variant === 'gold'
    ? 'bg-gradient-to-br from-champagne-gold-50 to-champagne-gold-100'
    : verified
      ? 'bg-gradient-to-br from-serenity-green-50 to-sage-100'
      : 'bg-gradient-to-br from-warm-gray-50 to-warm-gray-100';

  const iconBg = variant === 'gold'
    ? 'bg-champagne-gold-100'
    : verified
      ? 'bg-serenity-green-100'
      : 'bg-warm-gray-100';

  const checkColor = variant === 'gold'
    ? 'text-champagne-gold-600'
    : 'text-serenity-green-600';

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-xl
      ${bgColor}
      border border-white/50
      hover-lift
      shadow-sm hover:shadow-md
      transition-all duration-300
    `}>
      <div className={`
        flex-shrink-0 w-12 h-12 rounded-full
        flex items-center justify-center
        ${iconBg}
      `}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-warm-gray-900">{label}</h4>
          {verified && (
            <svg
              className={`w-4 h-4 ${checkColor} pulse-subtle`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p className="text-sm text-warm-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}
