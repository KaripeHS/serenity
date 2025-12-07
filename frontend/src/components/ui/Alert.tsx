
/**
 * Alert Component
 * Contextual feedback messages with semantic variants
 *
 * Features:
 * - 4 semantic variants: success, warning, danger, info
 * - Icons for each variant
 * - Dismissible alerts
 * - Composable title and description
 * - ARIA live regions for accessibility
 *
 * @module components/ui/Alert
 */

import React from 'react';
import { Link } from 'react-router-dom';

export interface AlertAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface AlertProps {
  /**
   * Semantic variant
   */
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'error';

  /**
   * Alert content
   */
  children: React.ReactNode;

  /**
   * Alert title (displayed above content)
   */
  title?: string;

  /**
   * Show icon
   */
  icon?: boolean;

  /**
   * Dismissible alert (alias for onDismiss)
   */
  onClose?: () => void;

  /**
   * Dismissible alert
   */
  onDismiss?: () => void;

  /**
   * Action button/link for drill-down
   */
  action?: AlertAction;

  /**
   * Additional CSS classes
   */
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Success Icon
 */
const SuccessIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Warning Icon
 */
const WarningIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

/**
 * Danger Icon
 */
const DangerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Info Icon
 */
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Main Alert Component
 */
export function Alert({
  variant = 'info',
  children,
  title,
  icon = true,
  onDismiss,
  onClose,
  action,
  className = '',
}: AlertProps) {
  const baseClasses = 'p-4 rounded-lg border-l-4 flex items-start gap-3';

  // Map 'error' to 'danger' for compatibility
  const normalizedVariant = variant === 'error' ? 'danger' : variant;

  const variantClasses = {
    success: 'bg-success-50 border-success-600 text-success-800',
    warning: 'bg-warning-50 border-warning-600 text-warning-800',
    danger: 'bg-danger-50 border-danger-600 text-danger-800',
    info: 'bg-info-50 border-info-600 text-info-800',
  };

  const actionButtonClasses = {
    success: 'bg-success-600 hover:bg-success-700 text-white',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white',
    info: 'bg-info-600 hover:bg-info-700 text-white',
  };

  // Support both onDismiss and onClose
  const dismissHandler = onDismiss || onClose;

  const iconComponents = {
    success: <SuccessIcon />,
    warning: <WarningIcon />,
    danger: <DangerIcon />,
    info: <InfoIcon />,
  };

  // ARIA live region for screen readers
  const ariaLive = normalizedVariant === 'danger' ? 'assertive' : 'polite';

  const ActionButton = () => {
    if (!action) return null;

    const buttonClasses = `inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${actionButtonClasses[normalizedVariant]}`;

    if (action.href) {
      // Use Link for internal navigation (React Router)
      return (
        <Link to={action.href} className={buttonClasses}>
          {action.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      );
    }

    return (
      <button type="button" onClick={action.onClick} className={buttonClasses}>
        {action.label}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[normalizedVariant]} ${className}`}
      role="alert"
      aria-live={ariaLive}
    >
      {/* Icon */}
      {icon && <div className="flex-shrink-0">{iconComponents[normalizedVariant]}</div>}

      {/* Content */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <div className="text-sm">{children}</div>
          </div>
          <ActionButton />
        </div>
      </div>

      {/* Dismiss button */}
      {dismissHandler && (
        <button
          type="button"
          onClick={dismissHandler}
          className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Alert Title
 */
export function AlertTitle({ children, className = '' }: AlertTitleProps) {
  return (
    <h4 className={`font-semibold ${className}`}>
      {children}
    </h4>
  );
}

/**
 * Alert Description
 */
export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm mt-1 ${className}`}>
      {children}
    </div>
  );
}