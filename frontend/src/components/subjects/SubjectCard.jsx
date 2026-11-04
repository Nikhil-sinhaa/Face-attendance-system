import React from 'react'
import { Share2, Trash2, ClipboardList, LogOut } from 'lucide-react'
import { Badge } from '../common/Badge'

const rateTone = (rate) => (rate >= 75 ? 'bg-emerald-400' : rate >= 60 ? 'bg-amber-400' : 'bg-red-400')

const Stat = ({ value, label }) => (
  <div>
    <dd className="num text-2xl font-semibold text-slate-50">{value}</dd>
    <dt className="eyebrow mt-1">{label}</dt>
  </div>
)

const actionBtn =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:bg-slate-800'

export const SubjectCard = ({ subject, isTeacher = false, onShare, onDelete, onOpenRegister, onUnenroll }) => {
  const { name, subject_code, section, total_students, total_classes, attended_classes, attendance_rate } = subject
  const rate = Number(attendance_rate) || 0

  return (
    <article className="sheet flex h-full flex-col transition-colors hover:border-slate-600">
      <div className="flex-1 p-5">
        <div className="flex items-center gap-2">
          <Badge variant={isTeacher ? 'pink' : 'indigo'}>{subject_code}</Badge>
          {section && <span className="eyebrow">Sec {section}</span>}
        </div>
        <h3 className="mt-3 text-xl font-bold leading-snug text-slate-50">{name}</h3>

        <dl className="mt-6 grid grid-cols-2 gap-4">
          {isTeacher ? (
            <>
              <Stat value={total_students ?? 0} label="Students" />
              <Stat value={total_classes ?? 0} label="Sessions" />
            </>
          ) : (
            <>
              <Stat value={`${attended_classes ?? 0}/${total_classes ?? 0}`} label="Attended" />
              <Stat value={total_classes > 0 ? `${rate}%` : '—'} label="Rate" />
            </>
          )}
        </dl>

        {!isTeacher && total_classes > 0 && (
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={rate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Attendance rate for ${name}`}
          >
            <div className={`h-full ${rateTone(rate)}`} style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-800 px-5 py-3">
        {isTeacher ? (
          <>
            <div className="flex flex-wrap gap-2">
              {onOpenRegister && (
                <button onClick={() => onOpenRegister(subject)} className={actionBtn}>
                  <ClipboardList className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Register
                </button>
              )}
              <button onClick={() => onShare(subject)} className={actionBtn}>
                <Share2 className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Share
              </button>
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(subject.subject_id)}
                aria-label={`Delete ${name}`}
                className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => onUnenroll(subject.subject_id, subject.name)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Unenroll
          </button>
        )}
      </div>
    </article>
  )
}
