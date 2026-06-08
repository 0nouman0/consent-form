import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-inter)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // ─── Semantic design tokens ───
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",

        // ─── NQ aliases (keep backward compatibility) ───
        nq: {
          bg: "hsl(var(--background))",
          "bg-2": "hsl(220 14% 96%)",
          card: "hsl(220 14% 96%)",
          "card-light": "hsl(var(--background))",
          dark: "#0d0d0f",
          "dark-2": "#1a1a2e",
          purple: "hsl(var(--primary))",
          "purple-light": "hsl(270 80% 62%)",
          "purple-soft": "hsl(252 87% 57% / 0.08)",
          text: "hsl(var(--foreground))",
          "text-muted": "hsl(var(--muted-foreground))",
          "text-light": "hsl(220 9% 70%)",
          border: "hsl(var(--border))",
          "border-dark": "hsl(220 13% 84%)",
        },

        // ─── Teal (kept for consent type badges) ───
        teal: {
          50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4",
          300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6",
          600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a",
        },
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        dashboard: "var(--shadow-dashboard)",
        btn: "var(--shadow-btn)",
        // legacy
        "nq-card": "var(--shadow-card)",
        "nq-card-hover": "var(--shadow-card-hover)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out",
        float: "float 4s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;