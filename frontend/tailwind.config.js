/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
      },
      colors: {
        primary: {
          DEFAULT: '#FFCD3C',
          dark: '#E6B800',
        },
        secondary: {
          DEFAULT: '#1A1A1A',
          light: '#2D2D2D',
        },
      },
    },
  },
  plugins: [],
}
