/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'space-deep': '#0B1929',
        'space-dark': '#0F2338',
        'space-blue': '#132F4C',
        'medical': {
          cyan: '#00D4AA',
          'cyan-light': '#33DDBB',
          'cyan-dark': '#00A885',
        },
        'alert': {
          orange: '#FF7A45',
          red: '#FF4D6A',
          yellow: '#FFB547',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 170, 0.35)',
        'glow-orange': '0 0 20px rgba(255, 122, 69, 0.35)',
        'glow-red': '0 0 20px rgba(255, 77, 106, 0.35)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px)",
        'radial-glow': 'radial-gradient(ellipse at top, rgba(0,212,170,0.08), transparent 60%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s linear infinite',
      },
      keyframes: {
        flow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        }
      }
    },
  },
  plugins: [],
};
