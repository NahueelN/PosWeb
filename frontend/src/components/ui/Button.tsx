import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'confirm' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant — defaults to 'primary' */
  variant?: ButtonVariant
  /** Size preset — defaults to 'md' */
  size?: ButtonSize
  /** Optional leading icon (Lucide component) */
  icon?: ReactNode
  /** Show a loading spinner and disable the button */
  loading?: boolean
  /** Make the button full-width */
  fullWidth?: boolean
  children?: ReactNode
}

// ── Style maps ─────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[oklch(0.52_0.255_278)] text-white border-transparent',
    'hover:bg-[oklch(0.47_0.230_278)]',
    'active:scale-[0.985] active:brightness-95',
    'shadow-[0_2px_8px_-2px_oklch(0.52_0.255_278_/_0.40)]',
    'focus-visible:ring-[oklch(0.52_0.255_278_/_0.50)]',
  ].join(' '),

  secondary: [
    'bg-white text-gray-700 border-gray-200',
    'hover:border-[oklch(0.52_0.255_278_/_0.35)] hover:bg-[oklch(0.52_0.255_278_/_0.04)] hover:text-[oklch(0.52_0.255_278)]',
    'active:scale-[0.985]',
    'shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]',
    'focus-visible:ring-[oklch(0.52_0.255_278_/_0.30)]',
  ].join(' '),

  confirm: [
    'bg-[oklch(0.595_0.172_152)] text-white border-transparent',
    'hover:bg-[oklch(0.52_0.182_152)]',
    'active:scale-[0.985] active:brightness-95',
    'shadow-[0_2px_14px_0_oklch(0.595_0.172_152_/_0.38)]',
    'focus-visible:ring-[oklch(0.595_0.172_152_/_0.50)]',
  ].join(' '),

  destructive: [
    'bg-white text-red-600 border-red-200',
    'hover:bg-red-50 hover:border-red-300 hover:text-red-700',
    'active:scale-[0.985]',
    'focus-visible:ring-red-400/40',
  ].join(' '),

  ghost: [
    'bg-transparent text-gray-500 border-transparent',
    'hover:bg-gray-100 hover:text-gray-700',
    'active:scale-[0.985]',
    'focus-visible:ring-gray-300/50',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[14px] gap-2.5 rounded-xl',
}

const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none'

// ── Component ──────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          // Base
          'inline-flex items-center justify-center font-semibold border transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Width
          fullWidth ? 'w-full' : '',
          // Disabled
          isDisabled ? disabledStyles : '',
          // Custom
          className,
        ].join(' ')}
        {...rest}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span className="truncate">{children}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
