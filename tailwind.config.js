/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0b0e14',
        surface: '#111520',
        'surface-elevated': '#171c2a',
        card: '#111520',
        'card-hover': '#171c2a',
        border: '#1e293b',
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        accent: {
          purple: '#a855f7',
          cyan: '#06b6d4',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
        'bounce-short': 'bounceShort 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'tactixFadeIn 0.2s ease-out',
        'slide-up': 'tactixSlideUp 0.25s ease-out',
        'slide-down': 'tactixSlideDown 0.2s ease-out',
        'scale-in': 'tactixScaleIn 0.15s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.8)' },
        },
        bounceShort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        tactixFadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        tactixSlideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        tactixSlideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        tactixScaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
