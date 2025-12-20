/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 프리미엄 골프 테마 - 다크 베이스 + 골드 액센트
        'gp': {
          'black': '#0A0A0A',
          'dark': '#141414',
          'card': '#1C1C1E',
          'border': '#2C2C2E',
          'text': '#F5F5F7',
          'text-secondary': '#8E8E93',
          'gold': '#D4AF37',
          'gold-light': '#F4E4BA',
          'green': '#34C759',
          'green-dark': '#1B5E20',
          'red': '#FF3B30',
        }
      },
      fontFamily: {
        'sans': ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'display': ['Outfit', 'Pretendard', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'card-swipe-left': 'cardSwipeLeft 0.3s ease-out forwards',
        'card-swipe-right': 'cardSwipeRight 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cardSwipeLeft: {
          '0%': { transform: 'translateX(0) rotate(0)' },
          '100%': { transform: 'translateX(-150%) rotate(-20deg)', opacity: '0' },
        },
        cardSwipeRight: {
          '0%': { transform: 'translateX(0) rotate(0)' },
          '100%': { transform: 'translateX(150%) rotate(20deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}


