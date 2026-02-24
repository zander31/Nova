/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'x-bg': '#000000',
        'x-bg-secondary': '#16181C',
        'x-bg-hover': '#1C1F23',
        'x-border': '#2F3336',
        'x-text': '#E7E9EA',
        'x-text-secondary': '#71767B',
        'x-blue': '#1D9BF0',
        'x-blue-hover': '#1A8CD8',
        'x-green': '#00BA7C',
        'x-red': '#F4212E',
        'x-orange': '#FF7A00',
        'sports-gold': '#FFD700',
        'sports-live': '#FF4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-live': 'pulse 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'score-flash': 'scoreFlash 0.5s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scoreFlash: {
          '0%': { backgroundColor: '#FFD700' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
