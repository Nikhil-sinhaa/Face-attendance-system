import React from 'react'

const base =
  'inline-flex items-center justify-center rounded-md font-semibold whitespace-nowrap select-none ' +
  'border transition-[background-color,border-color,color,transform] duration-150 ease-out ' +
  'active:translate-y-px disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:active:translate-y-0 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400'

const variants = {
  primary: 'bg-indigo-400 border-indigo-400 text-slate-950 enabled:hover:bg-indigo-300 enabled:hover:border-indigo-300',
  secondary: 'bg-pink-500 border-pink-500 text-slate-950 enabled:hover:bg-pink-400 enabled:hover:border-pink-400',
  tertiary: 'bg-slate-800 border-slate-700 text-slate-100 enabled:hover:bg-slate-700 enabled:hover:border-slate-600',
  outline: 'bg-transparent border-slate-600 text-slate-200 enabled:hover:bg-slate-800 enabled:hover:border-slate-500',
  danger: 'bg-red-500/10 border-red-500/40 text-red-300 enabled:hover:bg-red-500/20 enabled:hover:border-red-400/60',
  ghost: 'bg-transparent border-transparent text-slate-400 enabled:hover:bg-slate-800 enabled:hover:text-slate-100',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-8',
  md: 'text-sm px-4 py-2 gap-2 min-h-10',
  lg: 'text-[0.9375rem] px-5 py-2.5 gap-2.5 min-h-12',
}

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  className = '',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    onClick={onClick}
    className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    {...props}
  >
    {loading ? (
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
    ) : Icon ? (
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
    ) : null}
    <span className="inline-flex items-center gap-2">{children}</span>
  </button>
)
