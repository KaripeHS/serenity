/**
 * EmptyState Component
 * Friendly messages and illustrations for empty data states
 *
 * Features:
 * - Customizable icon/illustration
 * - Title and description
 * - Primary and secondary actions
 * - Multiple size variants
 * - Pre-built empty states for common scenarios
 *
 * @module components/ui/EmptyState
 */

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  /**
   * Icon or illustration to display
   */
  icon?: React.ReactNode;

  /**
   * Title text
   */
  title: string;

  /**
   * Description text
   */
  description?: string;

  /**
   * Primary action button
   */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Default Empty Icon
 */
const DefaultIcon = () => (
  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

/**
 * EmptyState Component
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'mb-3',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'mb-4',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'mb-6',
      title: 'text-xl',
      description: 'text-lg',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container} ${className}`}>
      {/* Icon */}
      <div className={classes.icon}>{icon || <DefaultIcon />}</div>

      {/* Title */}
      <h3 className={`font-semibold text-gray-900 ${classes.title}`}>{title}</h3>

      {/* Description */}
      {description && <p className={`mt-2 text-gray-500 max-w-md ${classes.description}`}>{description}</p>}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {primaryAction && (
            <Button variant="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * No Search Results
 */
export function EmptySearchResults({ searchTerm, onClear }: { searchTerm: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`}
      primaryAction={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

/**
 * No Visits
 */
export function EmptyVisits({ onCreateVisit }: { onCreateVisit?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      }
      title="No visits scheduled"
      description="There are no visits scheduled for today. Schedule a new visit to get started."
      primaryAction={onCreateVisit ? { label: 'Schedule Visit', onClick: onCreateVisit } : undefined}
    />
  );
}

/**
 * No Caregivers
 */
export function EmptyCaregivers({ onAddCaregiver }: { onAddCaregiver?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      title="No caregivers yet"
      description="Start building your team by adding caregivers. They'll be able to clock in and out of visits using the mobile app."
      primaryAction={onAddCaregiver ? { label: 'Add Caregiver', onClick: onAddCaregiver } : undefined}
    />
  );
}

/**
 * No Patients
 */
export function EmptyPatients({ onAddPatient }: { onAddPatient?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      }
      title="No patients yet"
      description="Add your first patient to start scheduling visits and providing care."
      primaryAction={onAddPatient ? { label: 'Add Patient', onClick: onAddPatient } : undefined}
    />
  );
}

/**
 * No Coverage Gaps
 */
export function EmptyGaps() {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="All clear!"
      description="No coverage gaps detected. All scheduled visits are covered."
      size="sm"
    />
  );
}

/**
 * No Claims
 */
export function EmptyClaims({ onCreateClaim }: { onCreateClaim?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      title="No claims yet"
      description="Claims will appear here once visits are completed and ready for billing."
      primaryAction={onCreateClaim ? { label: 'Create Claim', onClick: onCreateClaim } : undefined}
    />
  );
}

/**
 * No Notifications
 */
export function EmptyNotifications() {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      }
      title="No notifications"
      description="You're all caught up! Notifications will appear here when there are updates."
      size="sm"
    />
  );
}

/**
 * Error State
 */
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="Something went wrong"
      description="We couldn't load this data. Please try again."
      primaryAction={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
}

/**
 * Example Usage:
 *
 * // Generic empty state
 * {data.length === 0 && (
 *   <EmptyState
 *     title="No data available"
 *     description="Start by adding your first item"
 *     primaryAction={{ label: 'Add Item', onClick: handleAdd }}
 *   />
 * )}
 *
 * // Specific empty state
 * {caregivers.length === 0 && <EmptyCaregivers onAddCaregiver={handleAdd} />}
 *
 * // No search results
 * {searchResults.length === 0 && (
 *   <EmptySearchResults searchTerm={query} onClear={() => setQuery('')} />
 * )}
 */
