/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1a2b4c',
        gold: '#d4af37',
        cream: '#f7f5f0',
      },
    },
  },
  plugins: [],
};
