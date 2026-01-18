export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: { DEFAULT: '#ffffff', dark: '#131314' },
        surface: { DEFAULT: '#f0f4f9', dark: '#1E1F20', hover: '#e3e3e3', darkHover: '#2D2E2F' },
        border: { DEFAULT: '#e5e7eb', dark: '#444746' },
        primary: { DEFAULT: '#0b57d0', light: '#a8c7fa' }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: [],
}