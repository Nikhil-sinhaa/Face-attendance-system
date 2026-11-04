import React from 'react'

export const EmptyState = ({ icon: Icon, title, body, children }) => (
  <div className="rounded-lg border border-dashed border-slate-700 px-6 py-12 text-center">
    {Icon && <Icon className="mx-auto mb-4 h-7 w-7 text-slate-500" aria-hidden="true" />}
    <h3 className="text-lg font-bold text-slate-50">{title}</h3>
    {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-400">{body}</p>}
    {children && <div className="mt-6 flex justify-center">{children}</div>}
  </div>
)
