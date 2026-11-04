import React from 'react'

const variants = {
  indigo: 'border-indigo-400/40 text-indigo-300',
  emerald: 'border-emerald-400/40 text-emerald-300',
  pink: 'border-pink-400/40 text-pink-300',
  amber: 'border-amber-400/40 text-amber-300',
  red: 'border-red-400/40 text-red-300',
  slate: 'border-slate-600 text-slate-300',
}

export const Badge = ({ children, variant = 'indigo', className = '' }) => (
  <span
    className={`num inline-flex items-center gap-1 rounded-sm border bg-transparent px-1.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wider ${
      variants[variant] || variants.indigo
    } ${className}`}
  >
    {children}
  </span>
)
