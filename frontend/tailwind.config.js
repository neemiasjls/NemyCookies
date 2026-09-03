/** @type {import('tailwindcss').Config} */

/* Cada cor aponta para uma variavel CSS definida em src/index.css.
   Trocar o tema (claro/escuro) troca so as variaveis - as classes ficam iguais. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Superficies */
        canvas:  token('canvas'),
        surface: { DEFAULT: token('surface'), 2: token('surface-2') },
        line:    { DEFAULT: token('line'), soft: token('line-soft') },

        /* Texto: do mais forte para o mais apagado */
        ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3'), 4: token('ink-4') },

        /* Marca */
        brand: {
          DEFAULT: token('brand'),
          strong:  token('brand-strong'),
          soft:    token('brand-soft'),
          line:    token('brand-line'),
          ink:     token('brand-ink'),
        },
        gold: token('gold'),

        /* Barras escuras (topo do painel, rodape) - nao mudam de papel no tema escuro */
        shell: { DEFAULT: token('shell'), ink: token('shell-ink'), 2: token('shell-ink-2'), line: token('shell-line') },

        /* Estados */
        success: { DEFAULT: token('success'), bg: token('success-bg'), line: token('success-line'), solid: token('success-solid') },
        warn:    { DEFAULT: token('warn'),    bg: token('warn-bg'),    line: token('warn-line'),    solid: token('warn-solid') },
        danger:  { DEFAULT: token('danger'),  bg: token('danger-bg'),  line: token('danger-line'),  solid: token('danger-solid') },
        info:    { DEFAULT: token('info'),    bg: token('info-bg'),    line: token('info-line'),    solid: token('info-solid') },
        accent:  { DEFAULT: token('accent'),  bg: token('accent-bg'),  line: token('accent-line') },
        // teal da logo da Orvalho, usado no selo das vendas que vem de la
        orvalho: { DEFAULT: token('orvalho'), bg: token('orvalho-bg'), line: token('orvalho-line') },

        /* Paleta original, mantida para o que e sempre marrom (logo, favicon, etc.) */
        cookie: {
          dark: '#2C1A0E',
          brown: '#7B3F00',
          medium: '#A0522D',
          light: '#D4843A',
          cream: '#FFF8F0',
          gold: '#E8A020',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card:         '0 1px 2px rgb(var(--shadow) / 0.05), 0 4px 14px -4px rgb(var(--shadow) / 0.10)',
        'card-hover': '0 2px 4px rgb(var(--shadow) / 0.06), 0 10px 28px -6px rgb(var(--shadow) / 0.16)',
        pop:          '0 8px 30px -8px rgb(var(--shadow) / 0.28)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        confirma: {
          from: { opacity: '0', transform: 'scale(0.86)' },
          to:   { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        confirma: 'confirma 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
