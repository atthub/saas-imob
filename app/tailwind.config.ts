import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Cores padrão (tema "Delta Imóveis Pinda"). Cada imobiliária pode
        // sobrescrever via variáveis CSS definidas em runtime (ver theme.css).
        brand: {
          dark: "var(--brand-dark, #0D0D0D)",
          gold: "var(--brand-gold, #C5A059)",
          goldVivid: "var(--brand-gold-vivid, #DD8500)",
          light: "var(--brand-light, #F5F7FA)"
        }
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
