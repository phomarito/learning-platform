/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6457b5',
                    hover: '#504494',
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    500: '#6457b5',
                    600: '#504494',
                    700: '#3d2f7a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'fade-in-up': 'fadeInUp 0.3s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [
        // Добавляем кастомные утилиты через плагин
        function ({ addComponents, addBase, addUtilities, theme }) {
            // Base styles
            addBase({
                body: {
                    fontFamily: theme('fontFamily.sans'),
                    color: theme('colors.gray.800'),
                    backgroundColor: theme('colors.white'),
                    MozOsxFontSmoothing: 'grayscale',
                    WebkitFontSmoothing: 'antialiased',
                },
                'h1, h2, h3, h4, h5, h6': {
                    fontWeight: theme('fontWeight.bold'),
                    letterSpacing: theme('letterSpacing.tight'),
                },
            });

            // Component styles
            addComponents({
                '.btn': {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: theme('spacing.6'),
                    paddingRight: theme('spacing.6'),
                    paddingTop: theme('spacing.3'),
                    paddingBottom: theme('spacing.3'),
                    borderRadius: theme('borderRadius.lg'),
                    fontWeight: theme('fontWeight.medium'),
                    transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
                    transitionDuration: '200ms',
                    outline: 'none',
                    '&:focus': {
                        outline: 'none',
                        ringWidth: '2px',
                        ringOffsetWidth: '2px',
                    },
                    '&:disabled': {
                        opacity: '0.5',
                        cursor: 'not-allowed',
                    },
                },
                '.btn-primary': {
                    backgroundColor: theme('colors.primary.DEFAULT'),
                    color: theme('colors.white'),
                    '&:hover': {
                        backgroundColor: theme('colors.primary.hover'),
                    },
                    '&:focus': {
                        ringColor: theme('colors.primary.DEFAULT'),
                    },
                },
                '.btn-outline': {
                    borderWidth: '1px',
                    borderColor: theme('colors.gray.300'),
                    color: theme('colors.gray.700'),
                    '&:hover': {
                        backgroundColor: theme('colors.gray.50'),
                    },
                    '&:focus': {
                        ringColor: theme('colors.gray.300'),
                    },
                },
                '.btn-ghost': {
                    color: theme('colors.gray.600'),
                    '&:hover': {
                        color: theme('colors.primary.DEFAULT'),
                        backgroundColor: theme('colors.primary.50'),
                    },
                    paddingLeft: theme('spacing.4'),
                    paddingRight: theme('spacing.4'),
                    paddingTop: theme('spacing.2'),
                    paddingBottom: theme('spacing.2'),
                },
                '.card': {
                    backgroundColor: theme('colors.white'),
                    borderRadius: theme('borderRadius.xl'),
                    borderWidth: '1px',
                    borderColor: theme('colors.gray.200'),
                    boxShadow: theme('boxShadow.sm'),
                },
                '.card-hover': {
                    transition: 'all 300ms',
                    '&:hover': {
                        boxShadow: theme('boxShadow.lg'),
                        transform: 'translateY(-4px)',
                    },
                },
                '.input': {
                    width: '100%',
                    paddingLeft: theme('spacing.4'),
                    paddingRight: theme('spacing.4'),
                    paddingTop: theme('spacing.3'),
                    paddingBottom: theme('spacing.3'),
                    borderWidth: '1px',
                    borderColor: theme('colors.gray.300'),
                    borderRadius: theme('borderRadius.lg'),
                    outline: 'none',
                    '&:focus': {
                        outline: 'none',
                        ringWidth: '2px',
                        ringColor: theme('colors.primary.DEFAULT'),
                        borderColor: 'transparent',
                    },
                    transition: 'all',
                },
                '.label': {
                    display: 'block',
                    fontSize: theme('fontSize.sm'),
                    fontWeight: theme('fontWeight.medium'),
                    color: theme('colors.gray.700'),
                    marginBottom: theme('spacing.1'),
                },
            });

            // Custom utilities
            addUtilities({
                '.scrollbar-thin': {
                    '&::-webkit-scrollbar': {
                        width: '6px',
                        height: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: theme('colors.gray.100'),
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme('colors.gray.300'),
                        borderRadius: '9999px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: theme('colors.gray.400'),
                    },
                },
            });
        },
    ],
};