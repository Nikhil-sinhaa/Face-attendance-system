import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { SubjectCard } from '../../components/subjects/SubjectCard'
import { EnrollModal } from '../../components/dialogs/EnrollModal'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { Notice } from '../../components/common/Notice'
import { GraduationCap, PlusCircle } from 'lucide-react'

export const StudentDashboard = () => {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fetchEnrolledSubjects = async () => {
    try {
      const data = await subjectService.getMyEnrolledSubjects()
      setSubjects(data)
    } catch (err) {
      console.error('Failed to fetch student courses', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrolledSubjects()
  }, [])

  const handleUnenroll = async (subjectId, subjectName) => {
    if (window.confirm(`Are you sure you want to unenroll from ${subjectName}?`)) {
      try {
        await subjectService.unenrollStudent(subjectId)
        setToastMessage(`Unenrolled from ${subjectName} successfully.`)
        setTimeout(() => setToastMessage(''), 3000)
        fetchEnrolledSubjects()
      } catch (_err) {
        alert('Failed to unenroll from course.')
      }
    }
  }

  // Summary statistics
  const totalClasses = subjects.reduce((acc, s) => acc + (s.total_classes || 0), 0)
  const totalAttended = subjects.reduce((acc, s) => acc + (s.attended_classes || 0), 0)
  const overallRate = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0

  return (
    <div className="space-y-10 py-6">
      <PageHeader eyebrow="Student dashboard" title={`Hello, ${user?.name ?? ''}`} description="Your subjects and how often you have been marked present.">
        <Button variant="primary" onClick={() => setIsEnrollModalOpen(true)} icon={PlusCircle}>
          Enrol in subject
        </Button>
      </PageHeader>

      {toastMessage && <Notice tone="success">{toastMessage}</Notice>}

      {/* Overall figures: one ruled strip, not three cards */}
      <dl className="rise grid grid-cols-3 divide-x divide-slate-800 border-y border-slate-800" style={{ '--i': 1 }}>
        {[
          ['Subjects', subjects.length, 'text-slate-50'],
          ['Sessions held', totalClasses, 'text-slate-50'],
          ['Overall attendance', `${overallRate}%`, overallRate >= 75 || totalClasses === 0 ? 'text-emerald-300' : 'text-amber-300'],
        ].map(([label, value, tone]) => (
          <div key={label} className="px-3 py-5 sm:px-6">
            <dd className={`num text-3xl font-semibold sm:text-5xl ${tone}`}>{value}</dd>
            <dt className="eyebrow mt-2">{label}</dt>
          </div>
        ))}
      </dl>

      <section className="space-y-4" aria-labelledby="my-subjects">
        <h2 id="my-subjects" className="text-xl font-bold text-slate-50">Your subjects</h2>

        {loading ? (
          <LoadingSpinner text="Loading subjects" />
        ) : subjects.length === 0 ? (
          <EmptyState icon={GraduationCap} title="You haven’t joined a subject" body="Ask your teacher for the subject code, or scan their QR code.">
            <Button onClick={() => setIsEnrollModalOpen(true)} icon={PlusCircle}>Enrol in subject</Button>
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub, i) => (
              <li key={sub.subject_id} className="rise" style={{ '--i': i + 2 }}>
                <SubjectCard subject={sub} isTeacher={false} onUnenroll={handleUnenroll} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <EnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={fetchEnrolledSubjects}
      />
    </div>
  )
}
