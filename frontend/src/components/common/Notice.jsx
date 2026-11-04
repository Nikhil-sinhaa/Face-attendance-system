import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const tones = {
  error: { cls: 'border-red-400/40 bg-red-400/10 text-red-200', Icon: AlertCircle, role: 'alert' },
  success: { cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200', Icon: CheckCircle2, role: 'status' },
}

export const Notice = ({ tone = 'error', children, className = '' }) => {
  const { cls, Icon, role } = tones[tone] || tones.error
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm ${cls} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
