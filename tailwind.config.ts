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
                // Nueva Paleta Importadora Fernández (I.F.)
                'neon': {
                    400: '#D9FF3A', // Apoyo
                    500: '#C7F000', // Principal
                    600: '#A4C600', // Hover
                },
                'camo': {
                    100: '#E0E0E0', // Claro
                    300: '#B7B7B7', // Base (Fondo)
                    800: '#8F8F8F', // Oscuro
                },
                'brand': {
                    black: '#1A1A1A', // Principal Texto
                    dark: '#000000',
                }
            },
        },
    },
    plugins: [],
};
export default config;
