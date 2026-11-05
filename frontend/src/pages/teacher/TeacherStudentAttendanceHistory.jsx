import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { subjectService } from '../../services/subjectService'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Badge } from '../../components/common/Badge'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/common/Notice'

export const TeacherStudentAttendanceHistory = () => {
  const { subjectId, studentId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    subjectService.getStudentAttendanceHistory(subjectId, studentId)
      .then(setData)
      .catch((requestError) => setError(requestError.response?.data?.detail || 'Unable to load student attendance history.'))
  }, [subjectId, studentId])

  if (error) return <div className="py-10"><Notice>{error}</Notice></div>
  if (!data) return <LoadingSpinner text="Loading attendance history" />
  const displayDate = (timestamp) => new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const { summary } = data
  const figures = [
    ['Total classes', summary.total_classes, 'text-slate-50'],
    ['Attended', summary.attended_classes, 'text-emerald-300'],
    ['Absent', summary.absent_classes, 'text-red-300'],
    ['Attendance', `${summary.attendance_percentage}%`, 'text-indigo-300'],
  ]
  return (
    <div className="space-y-8 py-6">
      <Link
        to={`/teacher/subjects/${subjectId}/register`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-50"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to register
      </Link>

      <PageHeader
        eyebrow="Student attendance history"
        title={data.student.name}
        description={`Roll no. ${data.student.roll_no || data.student.student_id} · ${data.subject.name} (${data.subject.subject_code})`}
      />

      <dl className="grid grid-cols-2 divide-slate-800 border-y border-slate-800 sm:grid-cols-4 sm:divide-x">
        {figures.map(([label, value, tone]) => (
          <div key={label} className="px-4 py-5 sm:px-6">
            <dd className={`num text-3xl font-semibold sm:text-4xl ${tone}`}>{value}</dd>
            <dt className="eyebrow mt-2">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900" role="region" aria-label="Session history" tabIndex={0}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="eyebrow border-b border-slate-700 bg-slate-800">
              <th scope="col" className="px-4 py-3 font-medium">Session</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.history.map((entry) => (
              <tr key={entry.timestamp} className="transition-colors hover:bg-slate-800">
                <td className="num px-4 py-3.5 text-slate-300">{displayDate(entry.timestamp)}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={entry.status === 'Present' ? 'emerald' : entry.status === 'Absent' ? 'red' : 'slate'}>{entry.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.history.length === 0 && (
          <p className="p-10 text-center text-slate-400">No sessions have been recorded for this subject.</p>
        )}
      </div>
    </div>
  )
}
