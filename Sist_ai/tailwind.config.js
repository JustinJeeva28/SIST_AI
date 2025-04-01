// tailwind.config.js
module.exports = {
    // ... your existing configuration
    theme: {
      extend: {
        // ... your existing extensions
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' }
          }
        },
        animation: {
          'fadeIn': 'fadeIn 0.3s ease-out forwards',
        },
        typography: {
          DEFAULT: {
            css: {
              maxWidth: 'none',
              code: {
                backgroundColor: '#f3f4f6',
                padding: '0.2rem 0.4rem',
                borderRadius: '0.25rem',
                fontWeight: '400',
              },
              'code::before': {
                content: '""',
              },
              'code::after': {
                content: '""',
              },
            },
          },
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
      require('tailwind-scrollbar'),
      // ... your existing plugins
    ],
  }