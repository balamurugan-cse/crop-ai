/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f2fbf4',
          100: '#e1f7e6',
          200: '#c3eed1',
          300: '#94dfaf',
          400: '#5cc784',
          500: '#32ab63',
          600: '#238a4d',
          700: '#1e6d3f',
          800: '#1c5734',
          900: '#18472d',
          950: '#0b2718',
        },
        earth: {
          50: '#fbf9f5',
          100: '#f5f0e8',
          200: '#ebdccb',
          300: '#dec2a8',
          400: '#cca282',
          500: '#be8764',
          600: '#b17457',
          700: '#945d47',
          800: '#774c3d',
          900: '#614035',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
