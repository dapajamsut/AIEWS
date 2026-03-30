import type { Config } from "tailwindcss";

const config: Config = {
  // 1. INI KUNCINYA BIAR DARK MODE JALAN
  darkMode: "class", 
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Lu bisa tambahin warna custom di sini nanti
    },
  },
  plugins: [],
};
export default config;