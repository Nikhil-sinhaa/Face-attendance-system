import React from 'react'
import { BookOpen, PlusCircle, Image as ImageIcon, Trash2, ScanFace, Mic } from 'lucide-react'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'
import { Notice } from '../common/Notice'

const StepHead = ({ n, title, hint }) => (
  <div className="mb-4 flex items-baseline gap-3">
    <span className="num text-sm text-indigo-400">{n}</span>
    <div>
      <h2 className="text-lg font-bold text-slate-50">{title}</h2>
      {hint && <p className="text-sm text-slate-400">{hint}</p>}
    </div>
  </div>
)

export const TakeAttendanceTab = ({
  subjects,
  loadingSubjects,
  selectedSubjectId,
  onSubjectChange,
  attendancePhotos,
  onClearPhotos,
  onOpenAddPhotos,
  faceError,
  analyzingFaces,
  onRunFaceAnalysis,
  onOpenVoiceModal,
  onOpenCreateModal,
}) => {
  if (loadingSubjects) return <LoadingSpinner text="Loading subjects" />

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Create a subject first"
        body="Attendance is recorded against a subject and its enrolled students."
      >
        <Button onClick={onOpenCreateModal} icon={PlusCircle}>Create subject</Button>
      </EmptyState>
    )
  }

  const hasPhotos = attendancePhotos.length > 0

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {/* Inputs */}
      <div className="space-y-10 lg:col-span-7">
        <section>
          <StepHead n="01" title="Choose the class" />
          <label htmlFor="subject-select" className="eyebrow mb-2 block">Subject</label>
          <select
            id="subject-select"
            value={selectedSubjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="field-select"
          >
            {subjects.map((sub) => (
              <option key={sub.subject_id} value={sub.subject_id}>
                {sub.name} — {sub.subject_code} (Section {sub.section})
              </option>
            ))}
          </select>
        </section>

        <section>
          <StepHead n="02" title="Add classroom photos" hint="Every face in every photo is matched to the class." />
          {faceError && <Notice className="mb-4">{faceError}</Notice>}

          {hasPhotos ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">{attendancePhotos.length} photo{attendancePhotos.length === 1 ? '' : 's'}</span>
                <button
                  onClick={onClearPhotos}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear all
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attendancePhotos.map((photo, idx) => (
                  <li key={idx} className="relative aspect-video overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                    <img src={photo.previewUrl} alt={`Classroom ${idx + 1}`} className="h-full w-full object-cover" />
                    <span className="num absolute bottom-1.5 left-1.5 rounded-sm bg-slate-950/90 px-1.5 py-0.5 text-[0.6875rem] text-slate-200">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" icon={ImageIcon} onClick={onOpenAddPhotos} className="mt-3">
                Add or replace photos
              </Button>
            </>
          ) : (
            <button
              onClick={onOpenAddPhotos}
              className="group flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-slate-600 px-6 py-10 text-center transition-colors hover:border-indigo-400 hover:bg-slate-900"
            >
              <ImageIcon className="h-6 w-6 text-slate-500 transition-colors group-hover:text-indigo-400" aria-hidden="true" />
              <span className="font-semibold text-slate-100">Add photos</span>
              <span className="text-sm text-slate-400">Upload or capture the class</span>
            </button>
          )}
        </section>
      </div>

      {/* Run */}
      <aside className="lg:col-span-5">
        <div className="sheet space-y-6 p-6 lg:sticky lg:top-24">
          <StepHead n="03" title="Run it" hint="You review the result before anything is saved." />
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!hasPhotos}
              loading={analyzingFaces}
              onClick={onRunFaceAnalysis}
              icon={ScanFace}
            >
              Run face analysis
            </Button>
            {!hasPhotos && <p className="text-xs text-slate-500">Add at least one photo to run face analysis.</p>}
            <div className="flex items-center gap-3 py-1 text-slate-500" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-800" /><span className="eyebrow">or</span><span className="h-px flex-1 bg-slate-800" />
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              disabled={!selectedSubjectId}
              onClick={onOpenVoiceModal}
              icon={Mic}
            >
              Use voice roll call
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
