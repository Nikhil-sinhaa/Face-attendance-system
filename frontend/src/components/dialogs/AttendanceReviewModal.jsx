import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { attendanceService } from '../../services/attendanceService'
import { Notice } from '../common/Notice'
import { Check, X, Save } from 'lucide-react'

export const AttendanceReviewModal = ({
  isOpen,
  onClose,
  subjectId,
  candidates = [],
  onConfirmed,
}) => {
  const [reviewList, setReviewList] = useState(candidates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync if candidates prop changes
  React.useEffect(() => {
    setReviewList(candidates)
  }, [candidates])

  const toggleStatus = (studentId) => {
    setReviewList((prev) =>
      prev.map((c) => {
        if (c.student_id === studentId) {
          const newPresent = !c.is_present
          return {
            ...c,
            is_present: newPresent,
            status: newPresent ? 'Present' : 'Absent',
          }
        }
        return c
      })
    )
  }

  const markAll = (status) => {
    setReviewList((prev) =>
      prev.map((c) => ({
        ...c,
        is_present: status,
        status: status ? 'Present' : 'Absent',
      }))
    )
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const logs = reviewList.map((c) => ({
        student_id: c.student_id,
        is_present: c.is_present,
      }))
      const res = await attendanceService.confirmAttendanceSession(subjectId, logs)
      onConfirmed(res)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save attendance.')
    } finally {
      setLoading(false)
    }
  }

  const presentCount = reviewList.filter((c) => c.is_present).length
  const totalCount = reviewList.length
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & confirm attendance"
      subtitle="Select a status to toggle Present / Absent before saving."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {error && <Notice>{error}</Notice>}

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="num text-3xl font-semibold text-slate-50">
              <span className="text-emerald-300">{presentCount}</span>
              <span className="text-slate-500"> / {totalCount}</span>
            </p>
            <p className="eyebrow mt-1.5 flex items-center gap-2">
              Detected present
              <Badge variant={percentage >= 75 ? 'emerald' : percentage >= 50 ? 'amber' : 'red'}>{percentage}%</Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll(true)}>Mark all present</Button>
            <Button variant="outline" size="sm" onClick={() => markAll(false)}>Mark all absent</Button>
          </div>
        </div>

        <div className="max-h-80 overflow-auto rounded-md border border-slate-700" role="region" aria-label="Attendance candidates" tabIndex={0}>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0">
              <tr className="eyebrow border-b border-slate-700 bg-slate-800">
                <th scope="col" className="px-4 py-3 font-medium">Student</th>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Source</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {reviewList.map((student) => (
                <tr
                  key={student.student_id}
                  className="cursor-pointer transition-colors hover:bg-slate-800"
                  onClick={() => toggleStatus(student.student_id)}
                >
                  <td className="px-4 py-3 font-medium text-slate-50">{student.name}</td>
                  <td className="num px-4 py-3 text-slate-400">{student.student_id}</td>
                  <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{student.source || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-pressed={student.is_present}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStatus(student.student_id)
                      }}
                      className={`inline-flex min-w-24 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        student.is_present
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
                          : 'border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20'
                      }`}
                    >
                      {student.is_present ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                      {student.is_present ? 'Present' : 'Absent'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Discard</Button>
          <Button variant="primary" onClick={handleConfirm} loading={loading} icon={Save}>Confirm &amp; save</Button>
        </div>
      </div>
    </Modal>
  )
}
