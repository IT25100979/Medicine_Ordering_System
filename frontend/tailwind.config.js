/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          sky: '#D4E8F4',
          mint: '#D8F0DE',
          butter: '#FCF5CE',
          butterdark: '#EFE298',
          lavender: '#E5E8FD',
          charcoal: '#111315',
          border: '#E8ECEF',
          sand: '#F7F3EB'
        },
        background: '#f9f9ff',
        surface: '#f9f9ff',
        'surface-dim': '#d3daef',
        'surface-bright': '#f9f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f3ff',
        'surface-container': '#e9edff',
        'surface-container-high': '#e1e8fd',
        'surface-container-highest': '#dce2f7',
        'on-surface': '#141b2b',
        'on-surface-variant': '#4c4546',
        'primary-container': '#1b1b1b',
        'on-primary-container': '#848484',
        'secondary-container': '#40c2fd',
        'on-secondary-container': '#004d6a',
        'tertiary-fixed': '#a6f2cf',
        'tertiary-fixed-dim': '#8bd6b4',
        'on-tertiary-container': '#479173',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        outline: '#7e7576',
        'outline-variant': '#cfc4c5',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        'margin-md': '2rem',
        'margin-lg': '4rem',
        'gutter-sm': '1rem',
        'gutter-lg': '2rem',
      }
    },
  },
  plugins: [],
}
