/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    fontSize: {
      xs: ['11px', { lineHeight: '1.5', letterSpacing: '0.08em' }],
      sm: ['13px', { lineHeight: '1.5' }],
      base: ['15px', { lineHeight: '1.5' }],
      lg: ['18px', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '700' }],
      xl: ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
      '2xl': ['32px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
      '3xl': ['48px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      background: '#FFFFFF',
      surface: {
        DEFAULT: '#F8F9FA',
        raised: '#F1F3F4'
      },
      border: {
        DEFAULT: '#E8EAED',
        strong: '#DADCE0'
      },
      foreground: {
        DEFAULT: '#1A1A2E',
        secondary: '#5F6368',
        muted: '#9AA0A6'
      },
      primary: {
        DEFAULT: '#1E8A4A',
        light: '#E8F5EE',
        glow: '#1E8A4A18'
      },
      orange: {
        DEFAULT: '#F29900',
        light: '#FEF7E0'
      },
      red: {
        DEFAULT: '#D93025',
        light: '#FCE8E6'
      },
      blue: {
        DEFAULT: '#1967D2',
        light: '#E8F0FE'
      }
    },
    boxShadow: {
      soft: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      medium: '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.08)',
      strong: '0 8px 32px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.10)',
    },
    borderRadius: {
      sm: '6px',
      md: '10px',
      lg: '16px',
      xl: '20px',
      full: '999px'
    },
    extend: {},
  },
  plugins: [],
}
