/** @type {import('tailwindcss').Config} */
// Tokens mirror docs/DESIGN-SYSTEM.md (dark navy + single violet accent).
// NativeWind 4 stays on Tailwind 3.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0E0E16',
        surface: { 1: '#14141F', 2: '#1C1C2A', 3: '#252536' },
        border: { DEFAULT: '#2E2E40', strong: '#3A3A50' },
        violet: { 300: '#C4B5FD', 400: '#A78BFA', 500: '#8B5CF6' },
        lavender: '#A6A7CE',
        text: { primary: '#F5F4FB', secondary: '#B9B9CC', muted: '#6E6E85' },
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171',
        streak: '#FB923C',
      },
      borderRadius: { sm: '12px', md: '16px', lg: '24px', pill: '999px' },
      fontFamily: {
        display: ['ClashDisplay-Semibold'],
        'display-bold': ['ClashDisplay-Bold'],
        'display-medium': ['ClashDisplay-Medium'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
