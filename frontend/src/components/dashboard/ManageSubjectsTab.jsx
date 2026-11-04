import React from 'react'
import { BookOpen, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'
import { SubjectCard } from '../subjects/SubjectCard'

export const ManageSubjectsTab = ({ subjects, loadingSubjects, onOpenCreateModal, onShareSubject, onDeleteSubject }) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-50">
          Your subjects <span className="num ml-1 text-sm font-normal text-slate-500">{subjects.length}</span>
        </h2>
        <Button variant="primary" size="sm" onClick={onOpenCreateModal} icon={PlusCircle}>
          New subject
        </Button>
      </div>

      {loadingSubjects ? (
        <LoadingSpinner text="Loading subjects" />
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" body="Create your first subject to start recording attendance.">
          <Button onClick={onOpenCreateModal} icon={PlusCircle}>Create subject</Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((sub, i) => (
            <li key={sub.subject_id} className="rise" style={{ '--i': i }}>
              <SubjectCard
                subject={sub}
                isTeacher={true}
                onShare={onShareSubject}
                onOpenRegister={(s) => navigate(`/teacher/subjects/${s.subject_id}/register`)}
                onDelete={onDeleteSubject}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
