/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // override with standard colors to avoid oklch
          primary: {
            DEFAULT: '#2563eb',
            foreground: '#ffffff',
          },
          secondary: {
            DEFAULT: '#f3f4f6',
            foreground: '#111827',
          },
          muted: {
            DEFAULT: '#f9fafb',
            foreground: '#6b7280',
          },
          accent: {
            DEFAULT: '#f3f4f6',
            foreground: '#111827',
          },
          destructive: {
            DEFAULT: '#ef4444',
            foreground: '#ffffff',
          },
          border: '#e5e7eb',
          input: '#e5e7eb',
          ring: '#2563eb',
          background: '#ffffff',
          foreground: '#111827',
        },
      },
    },
    plugins: [],
  }