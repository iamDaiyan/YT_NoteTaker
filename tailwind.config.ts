import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#fdf8f8",
        "background-cream": "#f7f4ed",
        "border-passive": "#eceae4",
        "border-interactive": "rgba(28, 28, 28, 0.4)",
        "surface-container-low": "#f7f3f2",
        "surface-dim": "#ddd9d8",
        primary: "#010101",
        "off-white": "#fcfbf8",
        "text-muted": "#5f5f5d",
        "text-charcoal": "#1c1c1c",
        "inverse-surface": "#313030",
        "ring-blue": "rgba(59, 130, 246, 0.5)",
        "charcoal-4": "rgba(28, 28, 28, 0.04)",
        "charcoal-3": "rgba(28, 28, 28, 0.03)",
        "secondary-container": "#e5e2db",
        error: "#ba1a1a",
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      spacing: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "section-sm": "80px",
        "section-md": "128px",
        "section-lg": "192px",
        "max-width": "1200px",
      },
      fontFamily: {
        body: ["var(--font-fira-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        "card-title": ["var(--font-fira-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        caption: ["var(--font-fira-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        body: ["16px", { lineHeight: "1.5", letterSpacing: "normal", fontWeight: "400" }],
        "body-large": ["18px", { lineHeight: "1.38", letterSpacing: "normal", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "1.5", letterSpacing: "normal", fontWeight: "400" }],
        "card-title": ["20px", { lineHeight: "1.25", letterSpacing: "normal", fontWeight: "400" }],
      },
      boxShadow: {
        insetBtn:
          "inset rgba(255,255,255,0.2) 0px 0.5px 0px 0px, inset rgba(0,0,0,0.2) 0px 0px 0px 0.5px, rgba(0,0,0,0.05) 0px 1px 2px 0px",
      },
    },
  },
  plugins: [],
};

export default config;
