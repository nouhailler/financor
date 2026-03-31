/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#c2652a',
        'primary-dim': '#f0a878',
        'primary-container': '#e08850',
        background: '#0c0a09',
        surface: '#111110',
        'surface-card': '#1a1917',
        'surface-high': '#232220',
        border: '#2a2825',
        'border-soft': '#1e1c1a',
        'on-surface': '#faf5ee',
        'on-surface-2': '#a8a29e',
        'on-surface-3': '#6b6662',
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
