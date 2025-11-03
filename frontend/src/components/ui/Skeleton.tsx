/**
 * Skeleton Component
 * Loading placeholders that mimic content structure
 *
 * Features:
 * - Multiple shape variants (text, circle, rect)
 * - Animated pulse effect
 * - Composable for complex layouts
 * - Pre-built skeletons for common patterns
 *
 * @module components/ui/Skeleton
 */

import React from 'react';

export interface SkeletonProps {
  /**
   * Shape variant
   */
  variant?: 'text' | 'circle' | 'rect';

  /**
   * Width (CSS value or preset)
   */
  width?: string | number;

  /**
   * Height (CSS value or preset)
   */
  height?: string | number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Disable animation
   */
  animate?: boolean;
}

/**
 * Base Skeleton Component
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  const animationClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  const variantDefaults = {
    text: { width: '100%', height: '1rem' },
    circle: { width: '3rem', height: '3rem' },
    rect: { width: '100%', height: '10rem' },
  };

  const defaults = variantDefaults[variant];

  const style = {
    width: width ?? defaults.width,
    height: height ?? defaults.height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Text Skeleton
 * Mimics a line of text
 */
export interface SkeletonTextProps {
  /**
   * Number of lines
   */
  lines?: number;

  /**
   * Width of each line (can be array for different widths)
   */
  width?: string | string[];

  /**
   * Gap between lines
   */
  gap?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonText({ lines = 1, width, gap = '0.5rem', className = '' }: SkeletonTextProps) {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width || '100%');

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {widths.map((w, index) => (
        <Skeleton key={index} variant="text" width={w} />
      ))}
    </div>
  );
}

/**
 * Card Skeleton
 * Mimics a card with image, title, and description
 */
export interface SkeletonCardProps {
  /**
   * Show image skeleton
   */
  image?: boolean;

  /**
   * Image height
   */
  imageHeight?: string;

  /**
   * Show title skeleton
   */
  title?: boolean;

  /**
   * Show description skeleton
   */
  description?: boolean;

  /**
   * Number of description lines
   */
  descriptionLines?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonCard({
  image = true,
  imageHeight = '12rem',
  title = true,
  description = true,
  descriptionLines = 3,
  className = '',
}: SkeletonCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {image && <Skeleton variant="rect" height={imageHeight} className="rounded-none" />}
      <div className="p-6 space-y-4">
        {title && <Skeleton variant="text" width="60%" height="1.5rem" />}
        {description && (
          <SkeletonText
            lines={descriptionLines}
            width={Array(descriptionLines)
              .fill('')
              .map((_, i) => (i === descriptionLines - 1 ? '80%' : '100%'))}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 * Mimics a table row with multiple columns
 */
export interface SkeletonTableRowProps {
  /**
   * Number of columns
   */
  columns?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonTableRow({ columns = 4, className = '' }: SkeletonTableRowProps) {
  return (
    <tr className={className}>
      {Array(columns)
        .fill(null)
        .map((_, index) => (
          <td key={index} className="px-6 py-4">
            <Skeleton variant="text" width="80%" />
          </td>
        ))}
    </tr>
  );
}

/**
 * Table Skeleton
 * Mimics a full table
 */
export interface SkeletonTableProps {
  /**
   * Number of rows
   */
  rows?: number;

  /**
   * Number of columns
   */
  columns?: number;

  /**
   * Show header
   */
  header?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, header = true, className = '' }: SkeletonTableProps) {
  return (
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {header && (
        <thead className="bg-gray-50">
          <tr>
            {Array(columns)
              .fill(null)
              .map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <Skeleton variant="text" width="60%" />
                </th>
              ))}
          </tr>
        </thead>
      )}
      <tbody className="bg-white divide-y divide-gray-200">
        {Array(rows)
          .fill(null)
          .map((_, index) => (
            <SkeletonTableRow key={index} columns={columns} />
          ))}
      </tbody>
    </table>
  );
}

/**
 * Avatar Skeleton
 * Mimics an avatar (circular or square)
 */
export interface SkeletonAvatarProps {
  /**
   * Size (small, medium, large, or custom px value)
   */
  size?: 'sm' | 'md' | 'lg' | number;

  /**
   * Shape (circle or square)
   */
  shape?: 'circle' | 'square';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonAvatar({ size = 'md', shape = 'circle', className = '' }: SkeletonAvatarProps) {
  const sizeMap = {
    sm: '2rem',
    md: '3rem',
    lg: '4rem',
  };

  const dimension = typeof size === 'number' ? `${size}px` : sizeMap[size];

  return (
    <Skeleton
      variant={shape === 'circle' ? 'circle' : 'rect'}
      width={dimension}
      height={dimension}
      className={className}
    />
  );
}

/**
 * List Skeleton
 * Mimics a list of items with avatar and text
 */
export interface SkeletonListProps {
  /**
   * Number of items
   */
  items?: number;

  /**
   * Show avatar
   */
  avatar?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonList({ items = 5, avatar = true, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array(items)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            {avatar && <SkeletonAvatar size="md" />}
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="40%" height="1.25rem" />
              <Skeleton variant="text" width="80%" />
            </div>
          </div>
        ))}
    </div>
  );
}

/**
 * Dashboard Metric Skeleton
 * Mimics a metric card
 */
export function SkeletonMetric({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <Skeleton variant="text" width="50%" height="0.875rem" />
      <Skeleton variant="text" width="40%" height="2.25rem" className="mt-2" />
      <Skeleton variant="text" width="35%" height="0.875rem" className="mt-2" />
    </div>
  );
}

/**
 * Example Usage:
 *
 * // Loading state for a card
 * {isLoading ? (
 *   <SkeletonCard />
 * ) : (
 *   <Card>...</Card>
 * )}
 *
 * // Loading state for a table
 * {isLoading ? (
 *   <SkeletonTable rows={10} columns={5} />
 * ) : (
 *   <table>...</table>
 * )}
 *
 * // Custom skeleton layout
 * <div className="flex items-center gap-4">
 *   <SkeletonAvatar size="lg" />
 *   <div className="flex-1">
 *     <SkeletonText lines={2} width={['60%', '90%']} />
 *   </div>
 * </div>
 */
