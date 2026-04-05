// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Memastikan semua file di src diproses
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;