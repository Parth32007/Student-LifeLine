/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        brand: {
          bg: "hsl(var(--brand-bg) / <alpha-value>)",
          card: "hsl(var(--brand-card) / <alpha-value>)",
          primary: "hsl(var(--brand-primary) / <alpha-value>)",
          dark: "hsl(var(--brand-dark) / <alpha-value>)",
          light: "hsl(var(--brand-light) / <alpha-value>)",
          text: "hsl(var(--brand-text) / <alpha-value>)",
          muted: "hsl(var(--brand-muted) / <alpha-value>)",
          border: "hsl(var(--brand-border) / <alpha-value>)",
        },
        indigo: {
          50: "hsl(var(--indigo-50) / <alpha-value>)",
          100: "hsl(var(--indigo-100) / <alpha-value>)",
          200: "hsl(var(--indigo-200) / <alpha-value>)",
          300: "hsl(var(--indigo-300) / <alpha-value>)",
          400: "hsl(var(--indigo-400) / <alpha-value>)",
          500: "hsl(var(--indigo-500) / <alpha-value>)",
          600: "hsl(var(--indigo-600) / <alpha-value>)",
          700: "hsl(var(--indigo-700) / <alpha-value>)",
          800: "hsl(var(--indigo-800) / <alpha-value>)",
          900: "hsl(var(--indigo-900) / <alpha-value>)",
        },
        purple: {
          400: "hsl(var(--purple-400) / <alpha-value>)",
          500: "hsl(var(--purple-500) / <alpha-value>)",
          600: "hsl(var(--purple-600) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(36, 53, 42, 0.05), 0 1px 2px -1px rgba(36, 53, 42, 0.05)',
        'soft-md': '0 4px 6px -1px rgba(36, 53, 42, 0.07), 0 2px 4px -2px rgba(36, 53, 42, 0.05)',
        'soft-lg': '0 10px 15px -3px rgba(36, 53, 42, 0.08), 0 4px 6px -4px rgba(36, 53, 42, 0.04)',
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
