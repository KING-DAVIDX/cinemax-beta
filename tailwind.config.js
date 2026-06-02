/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        white: '#EDE8DC',
        black: '#111009',
        'cx-black': '#111009',
        'cx-dark': '#1A1814',
        'cx-navy': '#211E19',
        'cx-blue': '#4B4032',
        'cx-bright': '#D7BC68',
        'cx-accent': '#C9A84C',
        'cx-glow': '#E3C86A',
        'cx-ice': '#EDE8DC',
        'cx-muted': '#4A4034',
        'cx-stone': '#A89F90',
        'cx-taupe': '#6F6252',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 18px rgba(201, 168, 76, 0.16)' },
          '50%': { boxShadow: '0 0 30px rgba(201, 168, 76, 0.28)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
