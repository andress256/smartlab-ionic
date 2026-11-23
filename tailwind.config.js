/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Tipografía brutalista: grotesca pesada + monoespaciada
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      // Sombras duras sin difuminado (seña de identidad del brutalismo)
      boxShadow: {
        'brutal-sm': '3px 3px 0 0 #000',
        brutal: '6px 6px 0 0 #000',
        'brutal-lg': '10px 10px 0 0 #000',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
        'pop-in': 'pop-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
