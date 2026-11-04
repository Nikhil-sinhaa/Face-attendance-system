import React from 'react'

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' }

export const LoadingSpinner = ({ size = 'md', text = null }) => (
  <div role="status" aria-live="polite" className="flex min-h-[65vh] flex-col items-center justify-center gap-3 p-10">
    <div
      className={`${sizes[size] || sizes.md} animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400`}
      aria-hidden="true"
    />
    {text ? <p className="eyebrow">{text}</p> : <span className="sr-only">Loading</span>}
  </div>
)
