/**
 * Premium Design System Theme
 * Extracted from mobile premium components and adapted for desktop
 * Consistent visual language across all platforms
 */

export const premiumTheme = {
  // Glassmorphism Effects
  glass: {
    base: 'backdrop-blur-2xl backdrop-saturate-200',
    background: {
      subtle: 'bg-[hsl(var(--card)/0.55)]',
      light: 'bg-[hsl(var(--card)/0.62)]',
      medium: 'bg-[hsl(var(--card)/0.68)]',
      elevated: 'bg-[linear-gradient(135deg,hsl(var(--card)/0.78)_0%,hsl(var(--card)/0.58)_55%,hsl(var(--primary)/0.16)_100%)]',
    },
    border: {
      subtle: 'border-[hsl(var(--primary)/0.18)]',
      light: 'border-[hsl(var(--primary)/0.24)]',
      medium: 'border-[hsl(var(--primary)/0.32)]',
      strong: 'border-[hsl(var(--primary)/0.42)]',
    },
  },

  // Premium Shadows
  shadows: {
    sm: 'shadow-[0_6px_18px_hsl(var(--background)/0.45),inset_0_1px_0_hsl(var(--primary)/0.18)]',
    md: 'shadow-[0_12px_32px_hsl(var(--background)/0.52),0_0_0_1px_hsl(var(--primary)/0.14),inset_0_1px_0_hsl(var(--primary)/0.2)]',
    lg: 'shadow-[0_18px_44px_hsl(var(--background)/0.58),0_0_28px_hsl(var(--primary)/0.18),inset_0_1px_0_hsl(var(--primary)/0.24)]',
    xl: 'shadow-[0_24px_58px_hsl(var(--background)/0.65),0_0_36px_hsl(var(--primary)/0.22),inset_0_1px_0_hsl(var(--primary)/0.28)]',
    inset: 'shadow-[inset_0_1px_0_hsl(var(--primary)/0.2)]',
    elevated: 'shadow-[0_20px_52px_hsl(var(--background)/0.62),0_0_34px_hsl(var(--primary)/0.2),inset_0_1px_0_hsl(var(--primary)/0.3)]',
    primary: 'shadow-[0_12px_34px_hsl(var(--primary)/0.45),0_0_24px_hsl(var(--primary)/0.32)]',
    primaryHover: 'shadow-[0_16px_44px_hsl(var(--primary)/0.5),0_0_32px_hsl(var(--primary)/0.38)]',
    primaryActive: 'shadow-[0_6px_20px_hsl(var(--primary)/0.38),0_0_16px_hsl(var(--primary)/0.28)]',
    primaryFocus: 'shadow-[0_0_0_3px_hsl(var(--primary)/0.28),0_14px_38px_hsl(var(--background)/0.58),0_0_26px_hsl(var(--primary)/0.26)]',
    danger: 'shadow-[0_8px_32px_rgba(239,68,68,0.3)]',
    dangerHover: 'shadow-[0_12px_40px_rgba(239,68,68,0.4)]',
  },

  // Gradients
  gradients: {
    primary: 'bg-gradient-to-r from-primary via-primary/90 to-primary',
    elevated: 'bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
    danger: 'bg-gradient-to-r from-red-500 via-red-600 to-red-500',
    success: 'bg-gradient-to-br from-emerald-400 to-emerald-500',
    neutral: 'bg-gradient-to-br from-gray-400 to-gray-500',
  },

  // Border Radius
  radius: {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-[18px]',
    full: 'rounded-full',
  },

  // Spacing (Mobile-first, Desktop overrides in components with lg: prefix)
  spacing: {
    card: {
      sm: 'p-4 lg:p-3',
      md: 'p-5 lg:p-4',
      lg: 'p-6 lg:p-5',
      xl: 'p-8 lg:p-6',
    },
    button: {
      sm: 'px-4 py-2.5 lg:px-3 lg:py-2',
      md: 'px-6 py-3.5 lg:px-5 lg:py-2.5',
      lg: 'px-8 py-4 lg:px-7 lg:py-3',
    },
  },

  // Interactions
  interactions: {
    scale: {
      subtle: 'active:scale-[0.99]',
      medium: 'active:scale-[0.98]',
      strong: 'active:scale-[0.95]',
    },
    hover: {
      lift: 'hover:translate-y-[-2px]',
      glow: 'hover:shadow-[0_0_32px_rgba(212,175,55,0.2)]',
    },
    focus: {
      ring: 'focus:outline-none focus:ring-4',
      primary: 'focus:ring-primary/20',
      white: 'focus:ring-white/10',
      danger: 'focus:ring-red-500/20',
    },
  },

  // Typography (Mobile-first, Desktop overrides with lg: prefix)
  typography: {
    heading: {
      h1: 'text-3xl lg:text-xl font-bold tracking-tight',
      h2: 'text-2xl lg:text-lg font-bold tracking-tight',
      h3: 'text-xl lg:text-base font-semibold',
      h4: 'text-lg lg:text-sm font-semibold',
    },
    body: {
      lg: 'text-base lg:text-sm',
      md: 'text-sm lg:text-xs',
      sm: 'text-xs lg:text-[10px]',
    },
  },

  // Transitions
  transitions: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
    colors: 'transition-colors duration-200',
  },

  // Minimum Touch Targets (Mobile-first, Desktop overrides with lg: prefix)
  minHeight: {
    button: 'min-h-[44px] lg:min-h-[38px]',
    input: 'min-h-[44px] lg:min-h-[38px]',
    touch: 'min-h-[44px] lg:min-h-[38px]',
  },

  // Animation Variants
  animations: {
    fadeIn: 'animate-fadeIn',
    slideUp: 'animate-slideUp',
    shake: 'animate-shake',
    pulse: 'animate-pulse',
  },

  // States
  states: {
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    loading: 'opacity-50 cursor-wait',
    error: 'border-red-500/40 bg-red-500/[0.02]',
    success: 'border-emerald-500/40 bg-emerald-500/[0.02]',
  },

  // Desktop-specific adjustments (mouse/keyboard instead of touch)
  desktop: {
    cursor: 'cursor-pointer',
    select: 'select-none',
    userSelect: 'user-select-none',
  },
};

// Helper function to combine theme tokens
export const combineTheme = (...tokens: string[]) => tokens.join(' ');

// Accessibility - reduced motion support
export const withReducedMotion = (className: string) => 
  `${className} @media (prefers-reduced-motion: reduce) { transition-none hover:translate-y-0 active:scale-100 }`;
