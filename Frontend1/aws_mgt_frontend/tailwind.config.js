/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F8FAFC',
        card: '#FFFFFF',
        'primary-text': '#0F172A',
        'secondary-text': '#64748B',
        'primary-blue': '#2563EB',
        'primary-blue-hover': '#1D4ED8',
        'primary-blue-light': '#DBEAFE',
        border: '#E2E8F0',
        success: '#16A34A',
        'success-light': '#DCFCE7',
        warning: '#D97706',
        'warning-light': '#FEF3C7',
        error: '#DC2626',
        'error-light': '#FEE2E2',
        info: '#2563EB',
        'info-light': '#DBEAFE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
