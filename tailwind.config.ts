import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#202820',
        sand: { 50: '#FAF8F1', 100: '#F3EFE3', 200: '#E6DFCC', 300: '#D3C8AC' },
        brand: { DEFAULT: 'var(--brand)', dark: 'var(--brand-dark)', 2: 'var(--brand-2)', soft: 'var(--brand-soft)' },
        gold: { DEFAULT: 'var(--accent)', soft: '#F6EBD2', dark: '#A9822F' },
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      maxWidth: { page: '1200px' },
      boxShadow: { card: '0 1px 2px rgba(7,63,46,.05), 0 10px 30px -14px rgba(7,63,46,.22)' },
    },
  },
  plugins: [],
};
export default config;
