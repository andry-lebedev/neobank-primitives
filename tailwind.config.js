/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#111827',
        card: '#1F2937',
        'card-hover': '#374151',
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA6C0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-in-top': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-top': 'slide-in-top 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
