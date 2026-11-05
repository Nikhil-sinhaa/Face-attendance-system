import React from 'react'

const sides = {
  teacher: { label: 'Teacher portal', dot: 'bg-pink-400', text: 'text-pink-300' },
  student: { label: 'Student portal', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  admin: { label: 'Admin portal', dot: 'bg-indigo-400', text: 'text-indigo-300' },
}

/**
 * Two-column entry layout: a context column on the left (what this screen is
 * and why), the working form on the right. Collapses to one column on mobile.
 */
export const AuthShell = ({ side = 'teacher', title, intro, points = [], wide = false, children, footer }) => {
  const s = sides[side]
  return (
    <div className="grid items-start gap-10 py-8 sm:py-14 lg:grid-cols-12 lg:gap-16">
      <div className="rise lg:col-span-5 lg:sticky lg:top-24">
        <p className={`eyebrow mb-5 flex items-center gap-2.5 ${s.text}`}>
          <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
          {s.label}
        </p>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-slate-50 sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">{intro}</p>}
        {points.length > 0 && (
          <ul className="mt-8 hidden max-w-md divide-y divide-slate-800 border-y border-slate-800 text-sm text-slate-300 lg:block">
            {points.map((p, i) => (
              <li key={p} className="flex gap-4 py-3">
                <span className="num text-slate-500">0{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`rise lg:col-span-7 ${wide ? '' : 'lg:max-w-lg'}`} style={{ '--i': 2 }}>
        <div className="sheet p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-5 text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  )
}
