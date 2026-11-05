import React from 'react'
import { Check, UserCheck, X } from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { EmptyState } from '../common/EmptyState'
import { LoadingSpinner } from '../common/LoadingSpinner'

export const JoinRequestsTab = ({ requests, loading, busyKey, onApprove, onReject }) => {
  if (loading) return <LoadingSpinner text="Loading requests" />

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-50">
        Join requests <span className="num ml-1 text-sm font-normal text-slate-500">{requests.length}</span>
      </h2>

      {requests.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No pending requests"
          body="When a student asks to join one of your subjects, they will appear here for you to approve."
        />
      ) : (
        <ul className="divide-y divide-slate-800 border-y border-slate-800">
          {requests.map((r) => {
            const key = `${r.subject_id}-${r.student_id}`
            const busy = busyKey === key
            return (
              <li key={key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-50">{r.name}</p>
                  <p className="num mt-0.5 truncate text-sm text-slate-400">
                    {r.roll_no || `ID ${r.student_id}`}
                    {r.email ? ` · ${r.email}` : ''}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    <Badge variant="pink">{r.subject_code}</Badge>
                    <span>{r.subject_name}</span>
                    {r.section && <span className="eyebrow">Sec {r.section}</span>}
                    {r.account_status === 'pending' && <Badge variant="amber">New student</Badge>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="danger" size="sm" icon={X} disabled={busy} onClick={() => onReject(r)}>
                    Reject
                  </Button>
                  <Button variant="primary" size="sm" icon={Check} loading={busy} onClick={() => onApprove(r)}>
                    Approve
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
