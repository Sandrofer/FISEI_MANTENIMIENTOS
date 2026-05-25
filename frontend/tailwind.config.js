/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7b1e2b',
          light: '#a52a3a',
          dark: '#6a1824',
          soft: 'rgba(123, 30, 43, 0.1)'
        },
        surface: '#ffffff',
        muted: '#666666',
        danger: '#b4233a',
      }
    },
  },
  plugins: [],
}
