/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{html,js,ejs}"],
  theme: {
    extend: {
      colors: {
        main:
        {
          "dark": "#2BC8B3",
          "light": "#2BC8B326",
          "inactive": "#92e1d7"
        }

      }
    },
  },
  plugins: [],
}
