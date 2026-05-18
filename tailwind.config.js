/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your Exact Purple Theme
        brand: {
          light: '#d1c4e9',   // Sidebar borders, scrollbars
          DEFAULT: '#9575cd', // Main Icons, Active Menu, Highlights
          medium: '#7e57c2',  // Inactive Icons, Lab Logo
          dark: '#5e35b1',    // Active Borders, Lab Name text
        },
        // Your Exact Accents
        accent: {
          cyan: '#4dd0e1',    // Search input border
          pink: '#f06292',    // Notification badge
          fuchsia: '#d946ef', // Super Admin menus
          amber: '#d97706',   // Speed boost
        },
        // Your Exact Text
        slate: {
          main: '#455a64'     // Search text
        }
      }
    },
  },
  plugins: [],
}