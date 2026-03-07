import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { premiumTheme } from './theme';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md',
    isLoading = false, 
    className, 
    disabled, 
    children, 
    ...props 
  }, ref) => {
    const variantStyles = {
      primary: cn(
        premiumTheme.gradients.primary,
        'text-primary-foreground',
        premiumTheme.shadows.primary,
        'hover:' + premiumTheme.shadows.primaryHover,
        'active:' + premiumTheme.shadows.primaryActive,
        premiumTheme.interactions.focus.primary,
        'border border-primary/30'
      ),
      secondary: cn(
        'luxury-glass luxury-card',
        'text-foreground',
        premiumTheme.shadows.md,
        'hover:bg-[hsl(var(--card)/0.72)] hover:border-[hsl(var(--primary)/0.28)]',
        premiumTheme.shadows.lg.replace('shadow-', 'hover:shadow-'),
        'active:bg-white/[0.04]',
        premiumTheme.interactions.focus.white
      ),
      danger: cn(
        premiumTheme.gradients.danger,
        'text-white',
        premiumTheme.shadows.danger,
        'hover:shadow-[0_12px_40px_rgba(239,68,68,0.4)]',
        'active:shadow-[0_4px_16px_rgba(239,68,68,0.3)]',
        premiumTheme.interactions.focus.danger,
        'border border-red-500/30'
      ),
    };

    const sizeStyles = {
      sm: cn(premiumTheme.spacing.button.sm, 'text-sm lg:text-xs min-h-[40px] lg:min-h-[36px]'),
      md: cn(premiumTheme.spacing.button.md, 'text-base lg:text-sm', premiumTheme.minHeight.button),
      lg: cn(premiumTheme.spacing.button.lg, 'text-lg lg:text-base min-h-[52px] lg:min-h-[42px]'),
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative w-full',
          premiumTheme.radius.md,
          'font-semibold',
          premiumTheme.transitions.normal,
          premiumTheme.interactions.scale.medium,
          premiumTheme.states.disabled,
          premiumTheme.interactions.focus.ring,
          premiumTheme.desktop.cursor,
          premiumTheme.desktop.select,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className={cn(
          'flex items-center justify-center gap-2',
          isLoading && 'opacity-0'
        )}>
          {children}
        </span>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export type { PremiumButtonProps };
