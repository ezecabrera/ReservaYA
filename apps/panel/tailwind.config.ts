import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        c1: 'var(--c1)',
        c2: 'var(--c2)',
        c3: 'var(--c3)',
        c4: 'var(--c4)',
        c5: 'var(--c5)',
        'c1l': 'var(--c1l)',
        'c2l': 'var(--c2l)',
        'c3l': 'var(--c3l)',
        'c4l': 'var(--c4l)',
        'c5l': 'var(--c5l)',
        wa: 'var(--wa)',
        wal: 'var(--wal)',
        bg: 'var(--bg)',
        sf: 'var(--sf)',
        sf2: 'var(--sf2)',
        tx: 'var(--tx)',
        tx2: 'var(--tx2)',
        tx3: 'var(--tx3)',
        // Panel-specific: fondo oscuro del header
        panel: {
          dark: '#1A1A2E',
          mid: '#16213E',
          accent: '#0F3460',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        full: 'var(--r-full)',
      },
      boxShadow: {
        sm: 'var(--sh-sm)',
        md: 'var(--sh-md)',
        lg: 'var(--sh-lg)',
        'c1': '0 6px 20px rgba(255, 71, 87, 0.38)',
        'c2': '0 6px 20px rgba(46, 216, 168, 0.35)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        shimmer: 'shimmer 1.8s infinite linear',
      },
    },
  },
  plugins: [],
}

export default config
