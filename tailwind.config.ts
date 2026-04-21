import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        "bg-card": "var(--bg-card)",
        "bg-elevated": "var(--bg-elevated)",
        paper: "var(--paper)",
        bone: "var(--bone)",
        "bone-faint": "var(--bone-faint)",
        copper: {
          DEFAULT: "var(--copper)",
          deep: "var(--copper-deep)",
          glow: "var(--copper-glow)",
          subtle: "var(--copper-subtle)",
        },
        gold: "var(--gold)",
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
          hover: "var(--line-hover)",
        },
        border: "var(--line)",
        input: "var(--line-strong)",
        ring: "var(--copper)",
        background: "var(--bg)",
        foreground: "var(--paper)",
        primary: {
          DEFAULT: "var(--copper)",
          foreground: "var(--paper)",
        },
        secondary: {
          DEFAULT: "var(--bone)",
          foreground: "var(--bg)",
        },
        destructive: {
          DEFAULT: "#b33a3a",
          foreground: "var(--paper)",
        },
        muted: {
          DEFAULT: "var(--bg-soft)",
          foreground: "var(--bone-faint)",
        },
        accent: {
          DEFAULT: "var(--copper-subtle)",
          foreground: "var(--paper)",
        },
        popover: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--paper)",
        },
        card: {
          DEFAULT: "var(--bg-card)",
          foreground: "var(--paper)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter-tight)", "Inter Tight", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius-md)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      letterSpacing: {
        display: "-0.045em",
        "display-tight": "-0.05em",
        eyebrow: "0.22em",
        "eyebrow-wide": "0.32em",
        body: "-0.01em",
        "body-tight": "-0.02em",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
