import React, { useId } from 'react'

export const Input = ({ label, id, type = 'text', error, hint, icon: Icon, className = '', ...props }) => {
  const auto = useId()
  const fieldId = id || auto
  const describedBy = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="eyebrow mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        )}
        <input
          id={fieldId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block min-h-11 w-full rounded-md border bg-slate-950 py-2.5 pr-3.5 text-sm text-slate-50 placeholder-slate-500 transition-colors hover:border-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${error ? 'border-red-400' : 'border-slate-600'} ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-err`} className="mt-1.5 text-xs font-medium text-red-300">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
