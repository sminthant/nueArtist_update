import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        edm: {
          main: '#0d0000',
          gradient: '#2d0000',
          accent: '#C40000',
          overlay: '#000000',
          text: '#FFFFFF',
          'text-secondary': '#D1D5DB',
          'text-muted': '#9CA3AF',
          'neon-purple': '#7C3AED',
          'neon-pink': '#EC4899',
        },
      },
      backgroundImage: {
        'edm-black-red':
          'linear-gradient(135deg, #0d0000 0%, #1a0000 40%, #2d0000 70%, #4a0000 100%)',
        'edm-black-red-b': 'linear-gradient(180deg, #0d0000 0%, #2d0000 100%)',
      },
      boxShadow: {
        'edm-glow': '0 0 20px rgba(196, 0, 0, 0.4)',
        'edm-glow-purple': '0 0 20px rgba(124, 58, 237, 0.4)',
        'edm-glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
      },
      keyframes: {
        'admin-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'admin-shimmer': 'admin-shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [forms],
};

export default config;
