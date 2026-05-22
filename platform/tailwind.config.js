/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        ink:          '#0D0D0D',
        node:         '#0D1A2E',
        signal:       '#1A3AFF',
        'signal-dark':'#6A80FF',
        'signal-tint':'#EEF1FF',
        paper:        '#F7F5F0',
        rule:         '#E0DED8',
        amber:        '#B45309',
        'amber-tint': '#FEF3C7',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['DM Serif Display', 'serif'],
      },
      spacing: {
        xs:  '4px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '40px',
        '2xl': '56px',
        section: '80px',
      },
      borderRadius: {
        DEFAULT: '4px',
        none: '0',
      },
      boxShadow: {
        none: 'none',
      },
      transitionTimingFunction: {
        thalium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        micro:  '150ms',
        layout: '280ms',
        page:   '400ms',
      },
      maxWidth: {
        content: '1200px',
        reading: '680px',
      },
    },
    fontFamily: {
      syne:  ['Syne', 'sans-serif'],
      mono:  ['DM Mono', 'monospace'],
      serif: ['DM Serif Display', 'serif'],
      sans:  ['Syne', 'sans-serif'],
    },
  },
  plugins: [],
}
