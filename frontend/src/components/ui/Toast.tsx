/**
 * Toast Notification System
 * Non-intrusive notifications that appear briefly at the edge of the screen
 *
 * Features:
 * - 4 semantic variants: success, warning, danger, info
 * - Auto-dismiss with configurable duration
 * - Manual dismiss
 * - Icons for each variant
 * - ARIA live regions for accessibility
 * - Stack multiple toasts
 *
 * @module components/ui/Toast
 */

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface ToastOptions {
  /**
   * Semantic variant
   */
  variant?: 'success' | 'warning' | 'danger' | 'info';

  /**
   * Toast message
   */
  message: string;

  /**
   * Optional title
   */
  title?: string;

  /**
   * Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
   */
  duration?: number;

  /**
   * Show icon
   */
  icon?: boolean;
}

export interface Toast extends ToastOptions {
  id: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  danger: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider Component
 * Wrap your app with this to enable toasts
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      variant: options.variant || 'info',
      message: options.message,
      title: options.title,
      duration: options.duration ?? 5000,
      icon: options.icon ?? true,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, toast.duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Convenience methods
  const success = (message: string, title?: string) => {
    showToast({ variant: 'success', message, title });
  };

  const warning = (message: string, title?: string) => {
    showToast({ variant: 'warning', message, title });
  };

  const danger = (message: string, title?: string) => {
    showToast({ variant: 'danger', message, title });
  };

  const info = (message: string, title?: string) => {
    showToast({ variant: 'info', message, title });
  };

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, dismissToast, success, warning, danger, info }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * useToast Hook
 * Access toast functions from any component
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast Container
 * Renders all active toasts
 */
function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Item
 */
function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      dismissToast(toast.id);
    }, 300); // Match animation duration
  };

  const variantClasses = {
    success: 'bg-success-50 border-success-600 text-success-800',
    warning: 'bg-warning-50 border-warning-600 text-warning-800',
    danger: 'bg-danger-50 border-danger-600 text-danger-800',
    info: 'bg-info-50 border-info-600 text-info-800',
  };

  const iconComponents = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4 shadow-lg
        flex items-start gap-3
        transition-all duration-300
        ${variantClasses[toast.variant!]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      {/* Icon */}
      {toast.icon && <div className="flex-shrink-0">{iconComponents[toast.variant!]}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
        <div className="text-sm">{toast.message}</div>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Dismiss notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Example Usage:
 *
 * // In your root App component:
 * import { ToastProvider } from './components/ui/Toast';
 *
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourApp />
 *     </ToastProvider>
 *   );
 * }
 *
 * // In any component:
 * import { useToast } from './components/ui/Toast';
 *
 * function SomeComponent() {
 *   const toast = useToast();
 *
 *   const handleSuccess = () => {
 *     toast.success('Visit completed successfully!', 'Success');
 *   };
 *
 *   const handleError = () => {
 *     toast.danger('Failed to submit to Sandata', 'Error');
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>Show Success</button>
 *       <button onClick={handleError}>Show Error</button>
 *     </div>
 *   );
 * }
 */
