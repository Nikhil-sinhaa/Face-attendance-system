import React from 'react'

export const PageHeader = ({ eyebrow, title, description, children }) => (
  <header className="rise flex flex-col gap-5 border-b border-slate-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-extrabold leading-tight text-slate-50 sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-xl text-slate-400">{description}</p>}
    </div>
    {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
  </header>
)
