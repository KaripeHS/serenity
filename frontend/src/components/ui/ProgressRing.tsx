import { useMemo } from 'react';

export interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  label,
  animate = true,
  className = ''
}: ProgressRingProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={animate ? 'transition-all duration-1000 ease-out' : ''}
          />
        </svg>

        {/* Center content */}
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900">
                {Math.round(normalizedPercentage)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {label && (
        <span className="text-sm font-medium text-gray-600 mt-2 text-center">
          {label}
        </span>
      )}
    </div>
  );
}

// Multi-ring progress for comparing multiple metrics
export interface MultiProgressRingProps {
  rings: Array<{
    percentage: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  showLegend?: boolean;
  className?: string;
}

export function MultiProgressRing({
  rings,
  size = 150,
  strokeWidth = 6,
  backgroundColor = '#e5e7eb',
  showLegend = true,
  className = ''
}: MultiProgressRingProps) {
  const center = size / 2;
  const spacing = strokeWidth + 4;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {rings.map((ring, index) => {
            const radius = (size / 2) - (strokeWidth / 2) - (index * spacing);
            const circumference = radius * 2 * Math.PI;
            const normalizedPercentage = Math.min(Math.max(ring.percentage, 0), 100);
            const offset = circumference - (normalizedPercentage / 100) * circumference;

            return (
              <g key={index}>
                {/* Background */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={backgroundColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {showLegend && (
        <div className="mt-4 space-y-2">
          {rings.map((ring, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ring.color }}
              />
              <span className="text-gray-600">
                {ring.label}: <span className="font-semibold text-gray-900">{Math.round(ring.percentage)}%</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Progress ring with icon
export interface IconProgressRingProps {
  percentage: number;
  icon: React.ComponentType<any>;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  className?: string;
}

export function IconProgressRing({
  percentage,
  icon: Icon,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  label,
  className = ''
}: IconProgressRingProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="h-8 w-8 text-gray-700 mb-1" />
          <span className="text-lg font-bold text-gray-900">
            {Math.round(normalizedPercentage)}%
          </span>
        </div>
      </div>

      {label && (
        <span className="text-sm font-medium text-gray-600 mt-2 text-center">
          {label}
        </span>
      )}
    </div>
  );
}

// Segmented progress ring (like activity rings on Apple Watch)
export interface SegmentedProgressRingProps {
  segments: Array<{
    percentage: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  strokeWidth?: number;
  gap?: number;
  backgroundColor?: string;
  className?: string;
}

export function SegmentedProgressRing({
  segments,
  size = 120,
  strokeWidth = 8,
  gap = 2,
  backgroundColor = '#e5e7eb',
  className = ''
}: SegmentedProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const segmentAngle = 360 / segments.length;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {segments.map((segment, index) => {
            const normalizedPercentage = Math.min(Math.max(segment.percentage, 0), 100);
            const segmentCircumference = (circumference / segments.length) - gap;
            const offset = segmentCircumference - (normalizedPercentage / 100) * segmentCircumference;
            const rotation = index * segmentAngle;

            return (
              <g key={index} transform={`rotate(${rotation} ${size / 2} ${size / 2})`}>
                {/* Background */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={backgroundColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${segmentCircumference} ${circumference - segmentCircumference}`}
                  strokeLinecap="round"
                  className="transform -rotate-90"
                  style={{ transformOrigin: 'center' }}
                />
                {/* Progress */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${segmentCircumference} ${circumference - segmentCircumference}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transform -rotate-90 transition-all duration-1000 ease-out"
                  style={{ transformOrigin: 'center' }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Mini progress ring for compact displays
export interface MiniProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function MiniProgressRing({
  percentage,
  size = 40,
  strokeWidth = 4,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  className = ''
}: MiniProgressRingProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 ${className}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}
