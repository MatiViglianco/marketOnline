/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'border-width': 'border-width 3s infinite alternate',
      },
      keyframes: {
        'border-width': {
          from: { width: '10px', opacity: '0' },
          to: { width: '100px', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
