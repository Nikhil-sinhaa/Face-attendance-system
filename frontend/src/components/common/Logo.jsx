import React from 'react'

// Scan-frame corners around a tick: "a face, checked off the register".
export const LogoMark = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 10V5a2 2 0 0 1 2-2h5M22 3h5a2 2 0 0 1 2 2v5M29 22v5a2 2 0 0 1-2 2h-5M10 29H5a2 2 0 0 1-2-2v-5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="m10.5 16.5 4 4 7.5-9" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Wordmark = ({ className = '' }) => (
  <span className={`font-display text-lg font-extrabold tracking-tight text-slate-50 ${className}`}>
    FaceV<span className="text-indigo-400">Plus</span>
  </span>
)
