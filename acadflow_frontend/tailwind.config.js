// tailwind.config.js - Configuration optimisée pour Tailwind CSS 3.4.0 - AcadFlow
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Couleurs primaires pour l'éducation avec support de l'opacité
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#eff6ff",
          100: "#dbeafe", 
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        // Couleurs pour les notes et mentions avec nuances étendues
        grade: {
          excellent: {
            DEFAULT: "#10b981", 
            light: "#34d399",
            dark: "#059669",
            50: "#ecfdf5",
            100: "#d1fae5",
            500: "#10b981",
            600: "#059669",
            900: "#064e3b",
          },
          good: {
            DEFAULT: "#3b82f6",
            light: "#60a5fa", 
            dark: "#2563eb",
            50: "#eff6ff",
            100: "#dbeafe",
            500: "#3b82f6",
            600: "#2563eb",
            900: "#1e3a8a",
          },
          average: {
            DEFAULT: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706", 
            50: "#fffbeb",
            100: "#fef3c7",
            500: "#f59e0b",
            600: "#d97706",
            900: "#78350f",
          },
          passing: {
            DEFAULT: "#6b7280",
            light: "#9ca3af",
            dark: "#4b5563",
            50: "#f9fafb",
            100: "#f3f4f6", 
            500: "#6b7280",
            600: "#4b5563",
            900: "#111827",
          },
          failing: {
            DEFAULT: "#ef4444",
            light: "#f87171",
            dark: "#dc2626",
            50: "#fef2f2",
            100: "#fee2e2",
            500: "#ef4444", 
            600: "#dc2626",
            900: "#7f1d1d",
          },
        },
        
        // Couleurs pour les statuts avec support moderne
        status: {
          active: {
            DEFAULT: "#10b981",
            bg: "#ecfdf5",
            border: "#a7f3d0",
          },
          inactive: {
            DEFAULT: "#6b7280", 
            bg: "#f9fafb",
            border: "#d1d5db",
          },
          pending: {
            DEFAULT: "#f59e0b",
            bg: "#fffbeb", 
            border: "#fed7aa",
          },
          error: {
            DEFAULT: "#ef4444",
            bg: "#fef2f2",
            border: "#fecaca",
          },
          warning: {
            DEFAULT: "#f59e0b",
            bg: "#fffbeb",
            border: "#fed7aa", 
          },
        },
        
        // Couleurs académiques spécialisées étendues
        academic: {
          present: {
            DEFAULT: "#10b981",
            bg: "#ecfdf5",
          },
          absent: {
            DEFAULT: "#ef4444", 
            bg: "#fef2f2",
          },
          justified: {
            DEFAULT: "#f59e0b",
            bg: "#fffbeb",
          },
          evaluation: {
            DEFAULT: "#8b5cf6",
            bg: "#f3f4f6",
          },
          course: {
            DEFAULT: "#3b82f6",
            bg: "#eff6ff", 
          },
          student: {
            DEFAULT: "#06b6d4",
            bg: "#f0f9ff",
          },
          teacher: {
            DEFAULT: "#8b5cf6",
            bg: "#faf5ff",
          },
          admin: {
            DEFAULT: "#f59e0b",
            bg: "#fffbeb",
          },
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // Espacements spécialisés pour l'interface académique
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'sidebar': '16rem',
        'sidebar-collapsed': '4rem',
      },
      
      // Tailles de police adaptées avec line-height améliorée (Tailwind 3.4)
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        'grade': ['1.5rem', { lineHeight: '2rem', fontWeight: '700', letterSpacing: '-0.025em' }],
        'note': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600', letterSpacing: '0' }],
      },
      
      // Animations améliorées avec les nouvelles fonctionnalités 3.4
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "grade-highlight": {
          "0%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgb(59 130 246 / 0.1)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "grade-highlight": "grade-highlight 1s ease-in-out",
      },
      
      // Ombres modernisées avec les nouvelles capacités 3.4
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'sidebar': '4px 0 6px -1px rgb(0 0 0 / 0.1)',
        'grade': '0 0 0 3px rgb(59 130 246 / 0.1)',
        'grade-focus': '0 0 0 3px rgb(59 130 246 / 0.2), 0 0 0 1px rgb(59 130 246 / 0.3)',
        'academic': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      
      // Grilles améliorées pour la responsive design
      gridTemplateColumns: {
        'grades': 'minmax(200px, 1fr) repeat(auto-fit, minmax(80px, 1fr)) 100px',
        'grades-mobile': '1fr 80px 60px',
        'students': '40px 1fr 120px 100px 80px 120px',
        'students-tablet': '1fr 100px 80px',
        'evaluations': '1fr 120px 100px 80px 100px 120px',
        'evaluations-mobile': '1fr 80px 60px',
        'dashboard': 'repeat(auto-fit, minmax(280px, 1fr))',
        'dashboard-large': 'repeat(auto-fit, minmax(320px, 1fr))',
      },
      
      // Breakpoints étendus pour une meilleure responsivité
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px', 
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        'tablet': { 'min': '768px', 'max': '1023px' },
        'laptop': { 'min': '1024px', 'max': '1279px' },
        'desktop': { 'min': '1280px' },
        'mobile-only': { 'max': '767px' },
      },
      
      // Typographie améliorée
      fontFamily: {
        'academic': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // Support des transitions améliorées 3.4
      transitionTimingFunction: {
        'academic': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-subtle': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Backdrop blur pour les modales modernes
      backdropBlur: {
        'academic': '8px',
      },
    },
  },
  
  plugins: [
    require("tailwindcss-animate"),
    
    // Plugin personnalisé optimisé pour Tailwind 3.4
    function({ addUtilities, addComponents, theme }) {
      // Composants réutilisables
      addComponents({
        '.card-academic': {
          '@apply bg-white dark:bg-gray-900 rounded-lg shadow-card border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5': {},
        },
        '.badge-academic': {
          '@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': {},
        },
        '.btn-academic': {
          '@apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50': {},
        },
      });
      
      // Utilitaires spécialisés
      addUtilities({
        // Classes pour les notes avec variants modernes
        '.grade-excellent': {
          color: theme('colors.grade.excellent.DEFAULT'),
          fontWeight: theme('fontWeight.bold'),
          '&.badge': {
            backgroundColor: theme('colors.grade.excellent.50'),
            color: theme('colors.grade.excellent.600'),
          }
        },
        '.grade-good': {
          color: theme('colors.grade.good.DEFAULT'),
          fontWeight: theme('fontWeight.semibold'),
          '&.badge': {
            backgroundColor: theme('colors.grade.good.50'),
            color: theme('colors.grade.good.600'),
          }
        },
        '.grade-average': {
          color: theme('colors.grade.average.DEFAULT'),
          fontWeight: theme('fontWeight.medium'),
          '&.badge': {
            backgroundColor: theme('colors.grade.average.50'),
            color: theme('colors.grade.average.600'),
          }
        },
        '.grade-passing': {
          color: theme('colors.grade.passing.DEFAULT'),
          fontWeight: theme('fontWeight.medium'),
          '&.badge': {
            backgroundColor: theme('colors.grade.passing.50'),
            color: theme('colors.grade.passing.600'),
          }
        },
        '.grade-failing': {
          color: theme('colors.grade.failing.DEFAULT'),
          fontWeight: theme('fontWeight.bold'),
          '&.badge': {
            backgroundColor: theme('colors.grade.failing.50'),
            color: theme('colors.grade.failing.600'),
          }
        },
        
        // Classes pour les statuts modernisées
        '.status-active': {
          color: theme('colors.status.active.DEFAULT'),
          backgroundColor: theme('colors.status.active.bg'),
          borderColor: theme('colors.status.active.border'),
          '@apply px-2 py-1 rounded-md text-sm border': {},
        },
        '.status-inactive': {
          color: theme('colors.status.inactive.DEFAULT'),
          backgroundColor: theme('colors.status.inactive.bg'),
          borderColor: theme('colors.status.inactive.border'),
          '@apply px-2 py-1 rounded-md text-sm border': {},
        },
        
        // Tableaux académiques responsifs
        '.table-grades': {
          '@apply w-full border-collapse': {},
          '& th': {
            '@apply bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100': {},
          },
          '& td': {
            '@apply border-b border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300': {},
          },
          '& tr:hover': {
            '@apply bg-gray-50 dark:bg-gray-800/50': {},
          }
        },
        
        // Barres de progression modernes
        '.progress-grade': {
          '@apply h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden': {},
          '& .progress-bar': {
            '@apply h-full transition-all duration-300 ease-academic rounded-full': {},
          }
        },
        
        // Animations de chargement
        '.loading-shimmer': {
          '@apply relative overflow-hidden bg-gray-200 dark:bg-gray-700': {},
          '&::after': {
            content: '""',
            '@apply absolute inset-0 bg-gradient-to-r from-transparent via-white/60 dark:via-gray-600/60 to-transparent animate-shimmer': {},
          }
        },
        
        // Focus académique amélioré
        '.focus-academic': {
          '@apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900': {},
        },
      });
    }
  ],
}