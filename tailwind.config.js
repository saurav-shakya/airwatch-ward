/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aqi: {
          good: '#00b050',
          satisfactory: '#92d050',
          moderate: '#ffff00',
          poor: '#ff9900',
          veryPoor: '#ff0000',
          severe: '#c00000',
        }
      }
    },
  },
  plugins: [],
}
