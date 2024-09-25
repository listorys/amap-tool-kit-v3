/** @type {import('tailwindcss').Config} */
export default {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  content: [],
  theme: {
    extend: {
      colors: {
        // - 文字 Text
        'text-5': '#1D2129', // 强调/正文标题
        'text-4': '#4E5969', // 次强调/正文标题
        'text-3': '#86909C', // 次要信息
        'text-2': '#C9CDD4', // 置灰信息
        'text-1': '#FFFFFF', // 纯白文字
      }
    },
  },
  plugins: [],
}

