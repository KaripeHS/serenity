
/**
 * Badge Component
 * Status badges with semantic colors aligned to business logic
 *
 * Features:
 * - Semantic status variants (success, warning, danger, info, etc.)
 * - Business status variants (visit statuses, Sandata statuses, etc.)
 * - 2 sizes: sm, md
 * - Optional dot indicator
 * - Optional remove button
 *
 * @module components/ui/Badge
 */

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;

  /**
   * Semantic variant
   */
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

  /**
   * Badge size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show dot indicator
   */
  dot?: boolean;

  /**
   * Removable badge (show X button)
   */
  onRemove?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Generic Badge Component
 */
export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  onRemove,
  className = '',
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const variantClasses = {
    default: 'bg-primary-100 text-primary-800',
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'bg-transparent border border-gray-300 text-gray-700',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    info: 'bg-info-100 text-info-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const dotColors = {
    default: 'bg-primary-600',
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    outline: 'bg-gray-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
    info: 'bg-info-600',
    gray: 'bg-gray-600',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {/* Dot indicator */}
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} aria-hidden="true" />}

      {/* Badge text */}
      <span>{children}</span>

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Visit Status Badge
 * Maps visit statuses to appropriate badge variants
 */
export interface VisitStatusBadgeProps {
  status: 'scheduled' | 'on_time' | 'late' | 'no_show' | 'in_progress' | 'completed';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function VisitStatusBadge({ status, size = 'sm', dot = false, className = '' }: VisitStatusBadgeProps) {
  const statusConfig = {
    scheduled: { variant: 'gray' as const, label: 'Scheduled' },
    on_time: { variant: 'success' as const, label: 'On Time' },
    late: { variant: 'warning' as const, label: 'Late' },
    no_show: { variant: 'danger' as const, label: 'No Show' },
    in_progress: { variant: 'info' as const, label: 'In Progress' },
    completed: { variant: 'success' as const, label: 'Completed' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Sandata Status Badge
 * Maps Sandata statuses to appropriate badge variants
 */
export interface SandataStatusBadgeProps {
  status: 'not_submitted' | 'pending' | 'accepted' | 'rejected';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function SandataStatusBadge({ status, size = 'sm', dot = false, className = '' }: SandataStatusBadgeProps) {
  const statusConfig = {
    not_submitted: { variant: 'gray' as const, label: 'Not Submitted' },
    pending: { variant: 'info' as const, label: 'Pending' },
    accepted: { variant: 'success' as const, label: 'Accepted' },
    rejected: { variant: 'danger' as const, label: 'Rejected' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Claims Status Badge
 * Maps claims statuses to appropriate badge variants
 */
export interface ClaimsStatusBadgeProps {
  status: 'draft' | 'ready' | 'submitted' | 'paid' | 'denied';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function ClaimsStatusBadge({ status, size = 'sm', dot = false, className = '' }: ClaimsStatusBadgeProps) {
  const statusConfig = {
    draft: { variant: 'gray' as const, label: 'Draft' },
    ready: { variant: 'info' as const, label: 'Ready' },
    submitted: { variant: 'default' as const, label: 'Submitted' },
    paid: { variant: 'success' as const, label: 'Paid' },
    denied: { variant: 'danger' as const, label: 'Denied' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Credential Status Badge
 * Maps credential statuses to appropriate badge variants
 */
export interface CredentialStatusBadgeProps {
  status: 'valid' | 'expiring_soon' | 'expired';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function CredentialStatusBadge({ status, size = 'sm', dot = false, className = '' }: CredentialStatusBadgeProps) {
  const statusConfig = {
    valid: { variant: 'success' as const, label: 'Valid' },
    expiring_soon: { variant: 'warning' as const, label: 'Expiring Soon' },
    expired: { variant: 'danger' as const, label: 'Expired' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Gap Severity Badge
 * Maps gap severities to appropriate badge variants
 */
export interface GapSeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function GapSeverityBadge({ severity, size = 'sm', dot = false, className = '' }: GapSeverityBadgeProps) {
  const severityConfig = {
    low: { variant: 'info' as const, label: 'Low' },
    medium: { variant: 'warning' as const, label: 'Medium' },
    high: { variant: 'danger' as const, label: 'High' },
    critical: { variant: 'danger' as const, label: 'CRITICAL' },
  };

  const config = severityConfig[severity];

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}