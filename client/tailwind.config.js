/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          bg: '#080D18',
          secondary: '#0B1220',
          surface: '#101827',
          elevated: '#141E30',
          hover: '#19243A',
        },
        primary: {
          DEFAULT: '#4F7CFF',
          light: '#6E96FF',
          soft: 'rgba(79, 124, 255, 0.14)',
        },
        violet: {
          DEFAULT: '#8B7CFF',
          soft: 'rgba(139, 124, 255, 0.12)',
        },
        typo: {
          primary: '#F5F7FA',
          secondary: '#AAB4C5',
          muted: '#697589',
        },
        signal: {
          positive: '#35D49A',
          negative: '#FF5D73',
          warning: '#F4B860',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '12px',
        lg: '16px',
        pill: '999px',
      },
      boxShadow: {
        elevated: '0 20px 60px rgba(0, 0, 0, 0.35)',
        glow: '0 0 40px rgba(79, 124, 255, 0.12)',
        'glow-sm': '0 0 20px rgba(79, 124, 255, 0.18)',
      }
    },
  },
  plugins: [],
}
