import React, { useCallback, useEffect, useState } from 'react'
import { Check, UserCheck, X } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Notice } from '../../components/common/Notice'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const statusVariant = { pending: 'amber', approved: 'emerald', rejected: 'red' }

export const AdminDashboard = () => {
  const [filter, setFilter] = useState('pending')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const fetchTeachers = useCallback(async (status) => {
    setLoading(true)
    setError('')
    try {
      setTeachers(await adminService.getTeachers(status))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load teachers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeachers(filter)
  }, [filter, fetchTeachers])

  const decide = async (teacher, approve) => {
    setBusyId(teacher.teacher_id)
    setError('')
    setToast('')
    try {
      if (approve) await adminService.approveTeacher(teacher.teacher_id)
      else await adminService.rejectTeacher(teacher.teacher_id)
      setToast(`${teacher.name} ${approve ? 'approved' : 'rejected'}.`)
      await fetchTeachers(filter)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update this teacher. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Teacher approvals"
        description="Teachers can sign in only after you approve their registration."
      />

      <div role="group" aria-label="Filter teachers by status" className="flex gap-1 border-b border-slate-800">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              filter === id
                ? 'border-indigo-400 text-slate-50'
                : 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Notice>{error}</Notice>}
      {toast && <Notice tone="success">{toast}</Notice>}

      {loading ? (
        <LoadingSpinner text="Loading teachers" />
      ) : teachers.length === 0 ? (
        <EmptyState icon={UserCheck} title={`No ${filter} teachers`} body="Nothing to review here right now." />
      ) : (
        <ul className="divide-y divide-slate-800 border-y border-slate-800">
          {teachers.map((t) => (
            <li key={t.teacher_id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-50">
                  <span className="truncate">{t.name}</span>
                  <Badge variant={statusVariant[t.status] || 'slate'}>{t.status}</Badge>
                </p>
                <p className="num mt-0.5 truncate text-sm text-slate-400">
                  @{t.username} · {t.email || 'no college email on file'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {t.status !== 'rejected' && (
                  <Button variant="danger" size="sm" icon={X} disabled={busyId === t.teacher_id} onClick={() => decide(t, false)}>
                    Reject
                  </Button>
                )}
                {t.status !== 'approved' && (
                  <Button variant="primary" size="sm" icon={Check} loading={busyId === t.teacher_id} onClick={() => decide(t, true)}>
                    Approve
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
