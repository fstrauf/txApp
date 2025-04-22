/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      'test-blue': '#0000FF', // Simple blue definition
       // Keep these essential ones
       transparent: 'transparent',
       current: 'currentColor',
       black: '#000',
       white: '#fff',
    }
    // No extend, no other theme sections for this test
  },
  plugins: [], // No plugins for this test
  // variants: {
  //   extend: {
  //     opacity: ["disabled"],
  //   },
  // },
};
