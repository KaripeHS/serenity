
/**
 * Card Component
 * Enhanced card with variants, hover effects, and composable sections
 *
 * Features:
 * - 3 variants: default, elevated, bordered
 * - Hover effects for interactive cards
 * - Clickable cards with proper accessibility
 * - Composable sections (Header, Content, Footer)
 * - Loading state support
 *
 * @module components/ui/Card
 */

import React from 'react';

export interface CardProps {
  /**
   * Visual variant
   */
  variant?: 'default' | 'elevated' | 'bordered';

  /**
   * Enable hover effect (lift and shadow)
   */
  hoverable?: boolean;

  /**
   * Alias for onClick presence - indicates card is clickable
   */
  clickable?: boolean;

  /**
   * Make card clickable
   */
  onClick?: () => void;

  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * ARIA role (use 'button' if clickable)
   */
  role?: string;

  /**
   * Tab index for keyboard navigation
   */
  tabIndex?: number;

  /**
   * Add default padding to card content (default: true)
   */
  padding?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Action buttons/elements to display in header
   */
  action?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main Card Component
 */
export function Card({
  variant = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  children,
  className = '',
  role,
  tabIndex,
  padding = true,
}: CardProps) {
  const isClickable = !!onClick || clickable;

  // Base classes - add padding by default
  const baseClasses = [
    'bg-white',
    'rounded-lg',
    'transition-all',
    'duration-150',
    padding ? 'p-5' : '',
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'border',
      'border-gray-200',
    ],
    elevated: [
      'border',
      'border-gray-200',
      'shadow-md',
    ],
    bordered: [
      'border-2',
      'border-primary-600',
      'shadow-sm',
    ],
  };

  // Hover classes (if hoverable or clickable)
  const hoverClasses = (hoverable || isClickable) ? [
    'hover:shadow-lg',
    'hover:border-primary-300',
    'hover:-translate-y-0.5',
  ] : [];

  // Clickable classes
  const clickableClasses = isClickable ? [
    'cursor-pointer',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:ring-offset-2',
  ] : [];

  // Combine all classes
  const combinedClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...hoverClasses,
    ...clickableClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const cardProps = {
    className: combinedClasses,
    onClick: isClickable ? onClick : undefined,
    role: isClickable ? (role || 'button') : role,
    tabIndex: isClickable ? (tabIndex ?? 0) : tabIndex,
    onKeyDown: isClickable ? (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    } : undefined,
  };

  return <div {...cardProps}>{children}</div>;
}

/**
 * Card Header Section
 */
export function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${action ? 'flex items-center justify-between' : ''} ${className}`}>
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

/**
 * Card Content Section
 */
export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

/**
 * Card Footer Section
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Title
 */
export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

/**
 * Card Description
 */
export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>
      {children}
    </p>
  );
}

/**
 * Metric Card (specialized card for displaying metrics)
 */
export interface MetricCardProps {
  /**
   * Metric label
   */
  label: string;

  /**
   * Metric value
   */
  value: string | number;

  /**
   * Change indicator (e.g., "+2.3%")
   */
  change?: string;

  /**
   * Change type (positive or negative)
   */
  changeType?: 'positive' | 'negative' | 'neutral';

  /**
   * Icon to display
   */
  icon?: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  onClick,
  className = '',
}: MetricCardProps) {
  const changeColors = {
    positive: 'text-success-600',
    negative: 'text-danger-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card
      variant="elevated"
      hoverable
      onClick={onClick}
      className={className}
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-500">{label}</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
            {change && (
              <div className={`mt-2 flex items-center text-sm ${changeColors[changeType]}`}>
                {changeType === 'positive' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {changeType === 'negative' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span>{change}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-4 flex-shrink-0">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}