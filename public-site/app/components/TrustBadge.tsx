'use client';

interface TrustBadgeProps {
  icon: string;
  label: string;
  description: string;
  verified?: boolean;
}

export function TrustBadge({ icon, label, description, verified = false }: TrustBadgeProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover-lift">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
        verified ? 'bg-green-50' : 'bg-blue-50'
      }`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900">{label}</h4>
          {verified && (
            <svg className="w-4 h-4 text-green-600 trust-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}
