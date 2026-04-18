/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'spark-ember': '#FF6B35',
        'spark-warmth': '#FFA62B',
        'spark-flame': '#E63946',
        'bg-primary': '#FFFDF7',
        'bg-secondary': '#FFF8ED',
        'bg-dark': '#1A1A2E',
        'bg-dark-card': '#16213E',
        'text-primary': '#2C2C2C',
        'text-secondary': '#6B6B5E',
        'text-muted': '#A3A393',
        'tree-bg': '#F5F0E6',
        domain: {
          math: '#2B59C3',
          science: '#2D936C',
          cs: '#5B5EA6',
          art: '#E07A5F',
          music: '#7B2D8B',
          history: '#8B6914',
          literature: '#C1666B',
          philosophy: '#4A6FA5',
          engineering: '#D4A373',
          languages: '#3A7D44',
          cooking: '#D35400',
          sports: '#27AE60',
          dance: '#E74C8B',
          film: '#2C3E50',
          architecture: '#8E6F47',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        'display-kids': ['Baloo 2', 'cursive'],
        'body-kids': ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(42, 42, 42, 0.08)',
        'card-hover': '0 4px 24px rgba(42, 42, 42, 0.14)',
        ember: '0 0 20px rgba(255, 107, 53, 0.4)',
      },
    },
  },
  plugins: [],
}

