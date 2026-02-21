/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'brand-pink': 'var(--brand-pink)',
        'brand-teal': 'var(--brand-teal)',
        'brand-orange': 'var(--brand-orange)',
      },
    },
  },
  plugins: [],
}
