import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

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
                // Override Slate to be Neutral (Pure Gray, no Blue)
                slate: colors.neutral,
                // Activa Sport Brand Palette
                'brand': {
                    orange: '#F65703', // Primary Brand Color
                    black: '#271d06ff',
                    gray: '#ABABAB',
                    light: '#F5F5F5',
                    'dark-soft': '#171717', // Neutral 900
                    'dark-medium': '#262626', // Neutral 800
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
