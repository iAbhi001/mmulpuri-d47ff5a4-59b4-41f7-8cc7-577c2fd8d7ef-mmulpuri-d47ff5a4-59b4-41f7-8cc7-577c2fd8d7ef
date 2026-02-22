/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/dashboard/src/**/*.{html,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
