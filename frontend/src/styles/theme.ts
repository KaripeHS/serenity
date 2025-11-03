/**
 * Serenity Care Partners - Design Theme
 * Centralized design tokens for consistent styling
 *
 * Based on design-system.md v1.0.0
 * Usage: Import this file in components instead of hardcoding values
 *
 * @module styles/theme
 */

export const theme = {
  /**
   * Color Palette
   */
  colors: {
    // Primary Brand Color (Serenity Blue)
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB', // Default interactive
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },

    // Semantic Colors
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669', // Default
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },

    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Default
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    danger: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626', // Default
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },

    info: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4',
      600: '#0891B2', // Default
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },

    // Domain Entity Colors
    caregiver: {
      500: '#8B5CF6',
      600: '#7C3AED', // Default
      700: '#6D28D9',
    },

    patient: {
      500: '#EC4899',
      600: '#DB2777', // Default
      700: '#BE185D',
    },

    pod: {
      500: '#14B8A6',
      600: '#0D9488', // Default
      700: '#0F766E',
    },

    // Neutral Scale
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Utility Colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  /**
   * Typography
   */
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
    },

    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },

    lineHeight: {
      xs: '1rem',
      sm: '1.25rem',
      base: '1.5rem',
      lg: '1.75rem',
      xl: '1.75rem',
      '2xl': '2rem',
      '3xl': '2.25rem',
      '4xl': '2.5rem',
      '5xl': '1',
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    textColor: {
      primary: '#111827',    // gray-900
      secondary: '#4B5563',  // gray-600
      tertiary: '#6B7280',   // gray-500
      disabled: '#9CA3AF',   // gray-400
      inverse: '#FFFFFF',
    },
  },

  /**
   * Spacing System (based on 4px = 0.25rem)
   */
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    7: '1.75rem',  // 28px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },

  /**
   * Border Radius
   */
  borderRadius: {
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',   // Circular
  },

  /**
   * Shadows
   */
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    none: 'none',
  },

  /**
   * Transitions
   */
  transitions: {
    fast: '150ms',
    medium: '300ms',
    slow: '500ms',
  },

  /**
   * Easing Functions
   */
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  /**
   * Breakpoints (min-width)
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /**
   * Z-Index Scale
   */
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

/**
 * Status Color Mapping
 * Maps business logic statuses to semantic colors
 */
export const statusColors = {
  // Visit Status
  visit: {
    scheduled: theme.colors.gray[600],
    on_time: theme.colors.success[600],
    late: theme.colors.warning[600],
    no_show: theme.colors.danger[600],
    in_progress: theme.colors.primary[600],
    completed: theme.colors.success[600],
  },

  // Sandata Status
  sandata: {
    not_submitted: theme.colors.gray[600],
    pending: theme.colors.info[600],
    accepted: theme.colors.success[600],
    rejected: theme.colors.danger[600],
  },

  // Claims Status
  claims: {
    draft: theme.colors.gray[600],
    ready: theme.colors.info[600],
    submitted: theme.colors.primary[600],
    paid: theme.colors.success[600],
    denied: theme.colors.danger[600],
  },

  // Credential Status
  credential: {
    valid: theme.colors.success[600],
    expiring_soon: theme.colors.warning[600],
    expired: theme.colors.danger[600],
  },

  // Gap Severity
  gap: {
    low: theme.colors.info[600],
    medium: theme.colors.warning[600],
    high: theme.colors.danger[600],
    critical: theme.colors.danger[700],
  },
};

/**
 * Component Presets
 * Pre-configured styles for common component variants
 */
export const componentPresets = {
  // Button Variants
  button: {
    primary: {
      backgroundColor: theme.colors.primary[600],
      color: theme.colors.white,
      borderColor: theme.colors.primary[600],
      hover: {
        backgroundColor: theme.colors.primary[700],
      },
      active: {
        backgroundColor: theme.colors.primary[800],
      },
    },
    secondary: {
      backgroundColor: theme.colors.transparent,
      color: theme.colors.gray[700],
      borderColor: theme.colors.gray[300],
      hover: {
        backgroundColor: theme.colors.gray[50],
      },
      active: {
        backgroundColor: theme.colors.gray[100],
      },
    },
    danger: {
      backgroundColor: theme.colors.danger[600],
      color: theme.colors.white,
      borderColor: theme.colors.danger[600],
      hover: {
        backgroundColor: theme.colors.danger[700],
      },
      active: {
        backgroundColor: theme.colors.danger[800],
      },
    },
    ghost: {
      backgroundColor: theme.colors.transparent,
      color: theme.colors.primary[600],
      borderColor: theme.colors.transparent,
      hover: {
        backgroundColor: theme.colors.primary[50],
      },
      active: {
        backgroundColor: theme.colors.primary[100],
      },
    },
  },

  // Card Variants
  card: {
    default: {
      backgroundColor: theme.colors.white,
      borderColor: theme.colors.gray[200],
      borderWidth: '1px',
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.none,
    },
    elevated: {
      backgroundColor: theme.colors.white,
      borderColor: theme.colors.gray[200],
      borderWidth: '1px',
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.md,
      hover: {
        boxShadow: theme.shadows.lg,
        borderColor: theme.colors.primary[300],
      },
    },
    bordered: {
      backgroundColor: theme.colors.white,
      borderColor: theme.colors.primary[600],
      borderWidth: '2px',
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.sm,
    },
  },

  // Badge Sizes
  badge: {
    sm: {
      paddingX: theme.spacing[2],
      paddingY: theme.spacing[1],
      fontSize: theme.typography.fontSize.xs,
      borderRadius: theme.borderRadius.sm,
    },
    md: {
      paddingX: theme.spacing[3],
      paddingY: theme.spacing[1],
      fontSize: theme.typography.fontSize.sm,
      borderRadius: theme.borderRadius.md,
    },
  },
};

/**
 * Accessibility Presets
 */
export const a11y = {
  // Focus Ring
  focusRing: {
    outline: `2px solid ${theme.colors.primary[500]}`,
    outlineOffset: '2px',
  },

  // Minimum Touch Target (Mobile)
  minTouchTarget: {
    minWidth: '44px',
    minHeight: '44px',
  },

  // Screen Reader Only
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  },
};

/**
 * Data Visualization Presets
 */
export const dataViz = {
  // Sequential (single metric shades)
  sequential: [
    theme.colors.primary[100],
    theme.colors.primary[300],
    theme.colors.primary[500],
    theme.colors.primary[700],
    theme.colors.primary[900],
  ],

  // Categorical (multiple distinct metrics)
  categorical: [
    theme.colors.primary[600],   // Blue
    theme.colors.success[600],   // Green
    theme.colors.warning[600],   // Amber
    theme.colors.caregiver[600], // Purple
    theme.colors.patient[600],   // Pink
    theme.colors.pod[600],       // Teal
  ],

  // Diverging (positive/negative)
  diverging: {
    negative: theme.colors.danger[600],
    neutral: theme.colors.gray[300],
    positive: theme.colors.success[600],
  },
};

/**
 * Helper Functions
 */
export const helpers = {
  /**
   * Get status color by entity and status
   */
  getStatusColor(entity: keyof typeof statusColors, status: string): string {
    return (statusColors[entity] as any)[status] || theme.colors.gray[600];
  },

  /**
   * Get responsive font size
   */
  getResponsiveFontSize(size: keyof typeof theme.typography.fontSize): string {
    return theme.typography.fontSize[size];
  },

  /**
   * Create box shadow string
   */
  getShadow(size: keyof typeof theme.shadows): string {
    return theme.shadows[size];
  },

  /**
   * Create transition string
   */
  createTransition(
    property: string,
    duration: keyof typeof theme.transitions = 'medium',
    easing: keyof typeof theme.easing = 'ease-in-out'
  ): string {
    return `${property} ${theme.transitions[duration]} ${theme.easing[easing]}`;
  },
};

export default theme;
