import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { authService } from '../../services/authService'
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
  const [accountStatus, setAccountStatus] = useState(user?.status || '')

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

  const fetchAccountStatus = async () => {
    try {
      const me = await authService.getMe()
      setAccountStatus(me.status || '')
    } catch (err) {
      console.error('Failed to fetch account status', err)
    }
  }

  useEffect(() => {
    fetchEnrolledSubjects()
    fetchAccountStatus()
  }, [])

  const handleUnenroll = async (subjectId, subjectName) => {
    if (window.confirm(`Remove ${subjectName} from your subjects?`)) {
      try {
        await subjectService.unenrollStudent(subjectId)
        setToastMessage(`Removed ${subjectName}.`)
        setTimeout(() => setToastMessage(''), 3000)
        fetchEnrolledSubjects()
      } catch (_err) {
        alert('Failed to remove this subject.')
      }
    }
  }

  // Summary statistics (only approved subjects count)
  const approvedSubjects = subjects.filter((s) => (s.enrollment_status || 'approved') === 'approved')
  const totalClasses = approvedSubjects.reduce((acc, s) => acc + (s.total_classes || 0), 0)
  const totalAttended = approvedSubjects.reduce((acc, s) => acc + (s.attended_classes || 0), 0)
  const overallRate = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0

  return (
    <div className="space-y-10 py-6">
      <PageHeader eyebrow="Student dashboard" title={`Hello, ${user?.name ?? ''}`} description="Your subjects and how often you have been marked present.">
        <Button variant="primary" onClick={() => setIsEnrollModalOpen(true)} icon={PlusCircle}>
          Request to join
        </Button>
      </PageHeader>

      {accountStatus === 'pending' && (
        <Notice tone="warning">
          Your account is not verified yet. Request to join a subject. Once your teacher approves you, your account is verified.
        </Notice>
      )}

      {toastMessage && <Notice tone="success">{toastMessage}</Notice>}

      {/* Overall figures: one ruled strip, not three cards */}
      <dl className="rise grid grid-cols-3 divide-x divide-slate-800 border-y border-slate-800" style={{ '--i': 1 }}>
        {[
          ['Subjects', approvedSubjects.length, 'text-slate-50'],
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
          <EmptyState icon={GraduationCap} title="You haven’t joined a subject" body="Ask your teacher for the subject code, or scan their QR code. They will approve your request.">
            <Button onClick={() => setIsEnrollModalOpen(true)} icon={PlusCircle}>Request to join</Button>
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
