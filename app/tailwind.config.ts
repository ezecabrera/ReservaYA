import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Colores del design system ───────────────────────────────────────
      colors: {
        // Colores principales
        c1: 'var(--c1)',        // Coral Red — CTA, ocupado, urgencia
        c2: 'var(--c2)',        // Mint Green — disponible, éxito, confirmado
        c3: 'var(--c3)',        // Gold — lock, timer, promo
        c4: 'var(--c4)',        // Electric Blue — reservado vía plataforma
        c5: 'var(--c5)',        // Purple — modo grupo, especial
        // Variantes claras
        'c1l': 'var(--c1l)',
        'c2l': 'var(--c2l)',
        'c3l': 'var(--c3l)',
        'c4l': 'var(--c4l)',
        'c5l': 'var(--c5l)',
        // WhatsApp
        wa: 'var(--wa)',
        wal: 'var(--wal)',
        // Fondos
        bg: 'var(--bg)',
        sf: 'var(--sf)',
        sf2: 'var(--sf2)',
        // Texto
        tx: 'var(--tx)',
        tx2: 'var(--tx2)',
        tx3: 'var(--tx3)',
        // Sistema editorial ink — compartido con panel para pages oscuras
        ink:         'var(--ink)',
        'ink-2':     'var(--ink-2)',
        'ink-3':     'var(--ink-3)',
        wine:        'var(--wine)',
        'wine-soft': 'var(--wine-soft)',
        olive:       'var(--olive)',
        gold:        'var(--gold)',
        terracotta:  'var(--terracotta)',
        'ink-text':   'var(--ink-text)',
        'ink-text-2': 'var(--ink-text-2)',
        'ink-text-3': 'var(--ink-text-3)',
        'ink-line':   'var(--ink-line)',
        'ink-line-2': 'var(--ink-line-2)',
      },
      // ── Tipografía del design system ────────────────────────────────────
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // ── Border radius del design system ─────────────────────────────────
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        full: 'var(--r-full)',
      },
      // ── Box shadows ──────────────────────────────────────────────────────
      boxShadow: {
        sm: 'var(--sh-sm)',
        md: 'var(--sh-md)',
        lg: 'var(--sh-lg)',
        'c1': '0 6px 20px rgba(255, 71, 87, 0.38)',
        'c2': '0 6px 20px rgba(46, 216, 168, 0.35)',
      },
      // ── Animaciones del design system ────────────────────────────────────
      transitionTimingFunction: {
        snap: 'cubic-bezier(0.32, 0.72, 0, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        ui: 'ease',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { transform: 'scale(0.6)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'slide-down': 'slideDown 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        shimmer: 'shimmer 1.8s infinite linear',
      },
    },
  },
  plugins: [],
}

export default config
