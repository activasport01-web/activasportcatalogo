import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Activa Sport Brand Palette
                'brand': {
                    orange: '#F65703', // Primary Brand Color
                    black: '#271d06ff',
                    gray: '#ABABAB',
                    light: '#F5F5F5',
                    'dark-soft': '#0f172a', // Slate 900
                    'dark-medium': '#1e293b', // Slate 800
                },
            },
            fontFamily: {
                sans: ['Helvetica', 'Arial', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
export default config;
