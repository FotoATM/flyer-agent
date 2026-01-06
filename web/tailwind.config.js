/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'imagit-navy': '#090E20',
        'imagit-ink': '#004EA8',
        'imagit-teal': '#00A4C4',
        'imagit-light-teal': '#77E5E0',
        'imagit-bright-teal': '#01FFD7',
      },
    },
  },
  plugins: [],
}
