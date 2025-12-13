/** @type {import('tailwindcss').Config} */
/**
 * Serenity Care Partners - Mobile Tailwind Config
 * Unified design system matching web application
 */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Brand Color - Serenity Green (Public Website Brand)
        primary: {
          50: '#E8F4EE',
          100: '#d1e9dd',
          200: '#a3d3bb',
          300: '#75bd99',
          400: '#47a777',
          500: '#0C5A3D', // Main brand color
          600: '#0a4c32',
          700: '#083e28',
          800: '#06301f',
          900: '#042215',
          DEFAULT: '#0C5A3D',
          dark: '#083e28',
          light: '#a3d3bb',
        },

        // Secondary - Sage (Light green backgrounds)
        sage: {
          25: '#F3F6F4',
          50: '#f8fbf9',
          100: '#EAF2ED',
          200: '#d4ebe1',
          300: '#c0e2d4',
          DEFAULT: '#EAF2ED',
        },

        // Accent - Champagne Gold
        'champagne-gold': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#e3c580',
          500: '#D6B56C',
          600: '#c29e54',
          DEFAULT: '#D6B56C',
        },

        // Interactive Blue (for buttons, links in app contexts)
        interactive: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          DEFAULT: '#2563EB',
        },

        // Semantic Colors - MATCHING WEB
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          DEFAULT: '#10B981',
        },

        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          DEFAULT: '#F59E0B',
        },

        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          DEFAULT: '#EF4444',
        },

        info: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          500: '#06B6D4',
          600: '#0891B2',
          DEFAULT: '#06B6D4',
        },

        // Domain Entity Colors
        caregiver: {
          500: '#8B5CF6',
          600: '#7C3AED',
          DEFAULT: '#7C3AED',
        },

        patient: {
          500: '#EC4899',
          600: '#DB2777',
          DEFAULT: '#DB2777',
        },

        pod: {
          500: '#14B8A6',
          600: '#0D9488',
          DEFAULT: '#0D9488',
        },

        // UI Colors
        card: '#ffffff',
        background: '#F8FAFC',
        secondary: '#64748b',
      },

      // Border radius matching web
      borderRadius: {
        'sm': '2px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },

      // Shadows matching web
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
