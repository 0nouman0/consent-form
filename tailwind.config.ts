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
        sans: ["var(--font-inter)", "var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-crimson)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Original clay design system (used by internal app pages)
        clay: {
          base: "#eef3f7",
          card: "#ffffff",
          primary: "#6DB3A6",
          "primary-light": "#8ECFC5",
          secondary: "#9DB5C9",
          accent: "#D4A5A5",
          text: "#3D4F5F",
          "text-muted": "#7A8B99",
          border: "#dce4ec",
          success: "#a8d5ba",
          warning: "#e8d5a8",
          error: "#e8a4a4",
        },
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // NotiQ-inspired design system (landing page)
        nq: {
          bg: "#eef1f6",
          "bg-2": "#f5f5f7",
          card: "#f0f0f5",
          "card-light": "#fafafa",
          dark: "#0d0d0f",
          "dark-2": "#1a1a2e",
          purple: "#7C3AED",
          "purple-light": "#A855F7",
          "purple-soft": "#ede9fe",
          text: "#0d0d0f",
          "text-muted": "#6b7280",
          "text-light": "#9ca3af",
          border: "#e2e5ea",
          "border-dark": "#d1d5db",
        },
      },
      boxShadow: {
        clay:
          "8px 8px 16px rgba(163,177,198,0.25), -8px -8px 16px rgba(255,255,255,0.85)",
        "clay-lg":
          "12px 12px 24px rgba(163,177,198,0.3), -12px -12px 24px rgba(255,255,255,0.9)",
        "clay-sm":
          "4px 4px 8px rgba(163,177,198,0.2), -4px -4px 8px rgba(255,255,255,0.8)",
        "clay-inset":
          "inset 6px 6px 12px rgba(163,177,198,0.15), inset -6px -6px 12px rgba(255,255,255,0.95)",
        "clay-pressed":
          "inset 4px 4px 8px rgba(163,177,198,0.25), inset -4px -4px 8px rgba(255,255,255,1)",
        "clay-inner":
          "inset 2px 2px 5px rgba(163,177,198,0.18), inset -2px -2px 5px rgba(255,255,255,0.9)",
        "nq-card": "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        "nq-card-hover": "0 2px 8px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;