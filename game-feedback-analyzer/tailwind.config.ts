import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F5F0E8',
        card: '#FFFDF7',
        border: '#E8E0D0',
        text: '#2C2418',
        'text-mid': '#6B5E4A',
        'text-lt': '#9B8E7A',
        accent1: '#E8734A',
        accent2: '#4A90D9',
        accent3: '#6B8E5A',
        accent4: '#C4A35A',
        purple: '#8B6BB5',
        danger: '#D45B5B',
        success: '#5A9B6B',
        warn: '#D4A03C',
        'dark-bg': '#1E1E2A',
        'dark-text': '#E8E0D0',
        'dark-sub': '#C8BCA8',
        'dark-grid': '#333333',
        'd-red': '#FF8A80',
        'd-yellow': '#FFD54F',
        'd-blue': '#82B1FF',
        'd-purple': '#CE93D8',
        'd-green': '#A5D6A7',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
export default config;
