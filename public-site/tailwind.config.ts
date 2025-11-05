import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'serenity-green': {
          50: '#E8F4EE',
          100: '#d1e9dd',
          200: '#a3d3bb',
          300: '#75bd99',
          400: '#47a777',
          500: '#0C5A3D',
          600: '#0a4c32',
          700: '#083e28',
          800: '#06301f',
          900: '#042215',
        },
        'sage': {
          25: '#F3F6F4',
          50: '#f8fbf9',
          100: '#EAF2ED',
          200: '#d4ebe1',
          300: '#c0e2d4',
        },
        'champagne-gold': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#e3c580',
          500: '#D6B56C',
          600: '#c29e54',
          700: '#a6863e',
          800: '#8a6f2a',
          900: '#6e5716',
        },
        'warm-gray': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#666666',
          700: '#2B2B2B',
          800: '#1c1917',
          900: '#0f0e0d',
        },
        'mist-white': '#FAFAFA',
        'graphite-gray': '#292524',
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        body: ['var(--font-manrope)'],
        heading: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
}

export default config
