module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      tableLayout: ['hover', 'focus'],
      filter: ['hover'],
      brightness: ['hover'],
    },
  },
  plugins: [],
}
