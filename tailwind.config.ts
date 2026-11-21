import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d1a16',
        sand: { 50: '#fbf8f3', 100: '#f5efe4', 200: '#e9dfcd', 300: '#d8c8ac' },
        brand: { DEFAULT: 'var(--brand)', dark: 'var(--brand-dark)', soft: 'var(--brand-soft)' },
        gold: { DEFAULT: 'var(--accent)' },
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      maxWidth: { page: '1200px' },
      boxShadow: { card: '0 1px 2px rgba(29,26,22,.06), 0 8px 24px -12px rgba(29,26,22,.18)' },
    },
  },
  plugins: [],
};
export default config;
