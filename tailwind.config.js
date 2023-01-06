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
        // Neutral text ramp — semantic emphasis levels (Seam 1).
        // Components use these, never raw `*-gray-*` or `text-white`.
        'fg-strong': '#FFFFFF',
        fg: '#E5E7EB',
        'fg-muted': '#D1D5DB',
        muted: '#9CA3AF',
        subtle: '#6B7280',
        faint: '#4B5563',
        success: '#22C55E',
        danger: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B',
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
