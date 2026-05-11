import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#a855f7",
        layout: "#3b82f6",
        "node-text": "#84cc16",
        "node-image": "#9ca3af",
      },
    },
  },
  plugins: [],
};

export default config;
