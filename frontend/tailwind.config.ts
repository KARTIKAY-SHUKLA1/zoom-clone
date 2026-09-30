import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zoom: {
          blue: '#0B5CFF',
          'blue-hover': '#0a50e0',
          orange: '#FF6B00',
          dark: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}

export default config
