/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shelf: {
          wood: '#1a120a',
          woodLight: '#2a1c10',
          woodDark: '#0f0a05',
          rim: '#3a2818',
        },
        gold: {
          dim: '#8b6914',
          DEFAULT: '#d4a055',
          bright: '#f0c966',
          glow: 'rgba(212, 160, 85, 0.45)',
        },
        ambient: {
          deep: '#030408',
          mid: '#0a0d14',
          warm: '#12100c',
        }
      },
      fontFamily: {
        display: ['"SF Pro Display"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        body: ['"SF Pro Text"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
