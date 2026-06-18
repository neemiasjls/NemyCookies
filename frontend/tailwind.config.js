/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cookie: {
          dark: '#2C1A0E',
          brown: '#7B3F00',
          medium: '#A0522D',
          light: '#D4843A',
          cream: '#FFF8F0',
          gold: '#E8A020',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(44, 26, 14, 0.06), 0 4px 12px rgba(44, 26, 14, 0.05)',
        'card-hover': '0 2px 6px rgba(44, 26, 14, 0.08), 0 8px 24px rgba(44, 26, 14, 0.10)',
      }
    }
  },
  plugins: []
}
