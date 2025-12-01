
/**
 * Button Component
 * Enhanced button with variants, sizes, and full accessibility
 *
 * Features:
 * - 4 variants: primary, secondary, danger, ghost
 * - 3 sizes: sm, md, lg
 * - Loading state with spinner
 * - Disabled state
 * - Full keyboard navigation
 * - ARIA labels
 * - Icon support
 *
 * @module components/ui/Button
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show loading spinner
   */
  loading?: boolean;

  /**
   * Icon to show before text
   */
  icon?: React.ReactNode;

  /**
   * Icon to show after text
   */
  iconRight?: React.ReactNode;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Button children (text/content)
   */
  children: React.ReactNode;
}

/**
 * Loading spinner component
 */
const Spinner: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeMap[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button Component
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  // Base classes (always applied)
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-semibold',
    'rounded-lg',
    'transition-all',
    'duration-150',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ];

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-primary-600',
      'text-white',
      'border',
      'border-primary-600',
      'hover:bg-primary-700',
      'hover:border-primary-700',
      'active:bg-primary-800',
      'focus:ring-primary-500',
      'shadow-sm',
      'hover:shadow-md',
    ],
    secondary: [
      'bg-white',
      'text-gray-700',
      'border',
      'border-gray-300',
      'hover:bg-gray-50',
      'hover:border-gray-400',
      'active:bg-gray-100',
      'focus:ring-gray-500',
      'shadow-sm',
    ],
    outline: [
      'bg-transparent',
      'text-primary-600',
      'border',
      'border-primary-600',
      'hover:bg-primary-50',
      'active:bg-primary-100',
      'focus:ring-primary-500',
    ],
    danger: [
      'bg-danger-600',
      'text-white',
      'border',
      'border-danger-600',
      'hover:bg-danger-700',
      'hover:border-danger-700',
      'active:bg-danger-800',
      'focus:ring-danger-500',
      'shadow-sm',
      'hover:shadow-md',
    ],
    ghost: [
      'bg-transparent',
      'text-primary-600',
      'border',
      'border-transparent',
      'hover:bg-primary-50',
      'active:bg-primary-100',
      'focus:ring-primary-500',
    ],
  };

  // Size classes
  const sizeClasses = {
    sm: ['px-3', 'py-2', 'text-sm', 'gap-1.5'],
    md: ['px-4', 'py-2.5', 'text-base', 'gap-2'],
    lg: ['px-6', 'py-3', 'text-lg', 'gap-2.5'],
  };

  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';

  // Combine all classes
  const combinedClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && <Spinner size={size} />}

      {/* Left icon */}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Button text */}
      <span>{children}</span>

      {/* Right icon */}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}

/**
 * Icon Button (button with only an icon, no text)
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /**
   * Icon to display
   */
  icon: React.ReactNode;

  /**
   * Accessible label for screen readers (required)
   */
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  ...rest
}) => {
  // Square padding for icon buttons
  const iconSizeClasses = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${iconSizeClasses[size]} !px-0`}
      {...rest}
    >
      {icon}
    </Button>
  );
};

/**
 * Button Group (for grouped buttons)
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-lg shadow-sm ${className}`} role="group">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        // Add classes to make buttons connect
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        const groupClasses = [
          !isFirst && '-ml-px',
          !isFirst && !isLast && 'rounded-none',
          isFirst && 'rounded-r-none',
          isLast && 'rounded-l-none',
        ]
          .filter(Boolean)
          .join(' ');

        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${groupClasses}`,
        } as any);
      })}
    </div>
  );
};

export default Button;