/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark gradient theme with Zerodha-style accents
        bg: {
          primary: '#020617',
          secondary: '#0f172a',
          tertiary: '#111827',
          card: '#1e293b',
        },
        brand: {
          blue: '#387ed1',
          'blue-dark': '#2563eb',
          green: '#10b981',
          'green-dark': '#059669',
        },
        accent: {
          red: '#ef4444',
          blue: '#3b82f6',
          gold: '#f59e0b',
          purple: '#8b5cf6',
        },
        border: {
          DEFAULT: '#1f2937',
          strong: '#374151',
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'ticker': 'ticker 30s linear infinite',
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.3s ease',
      },
      keyframes: {
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
};
