import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Notice } from '../../components/common/Notice'
import { AlertCircle, BookOpen, GraduationCap } from 'lucide-react'

export const StudentAutoEnroll = () => {
  const { inviteCode: pathCode } = useParams()
  const [searchParams] = useSearchParams()
  const inviteCode = pathCode || searchParams.get('code') || searchParams.get('join-code') || ''
  const { isAuthenticated, isStudent, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    if (!inviteCode) {
      setLoading(false)
      setError('This invitation link is missing a subject code.')
      return () => { active = false }
    }
    setLoading(true)
    subjectService.getInvitation(inviteCode)
      .then((data) => active && setInvitation(data))
      .catch((err) => active && setError(err.response?.data?.detail || 'This invitation is invalid or expired.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [inviteCode])

  if (authLoading || loading) return <LoadingSpinner text="Checking invitation..." />

  const returnPath = `/join/${encodeURIComponent(inviteCode)}`
  if (error && !invitation) {
    return <JoinCard title="Invalid invitation" icon={AlertCircle}>
      <Message tone="error">{error}</Message>
    </JoinCard>
  }
  if (!isAuthenticated) {
    return <JoinCard title="Subject invitation" icon={BookOpen}>
      <p className="text-sm text-slate-300">Sign in or register as a student to join this subject.</p>
      <div className="flex gap-3 pt-2">
        <Link className="flex-1 rounded-md bg-indigo-400 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-indigo-300" to={`/student/login?return=${encodeURIComponent(returnPath)}`}>Student login</Link>
        <Link className="flex-1 rounded-md border border-slate-600 py-2.5 text-center text-sm font-semibold text-slate-200 hover:bg-slate-800" to={`/student/register?return=${encodeURIComponent(returnPath)}`}>Register</Link>
      </div>
    </JoinCard>
  }

  if (!isStudent) {
    return <JoinCard title="Student account required" icon={AlertCircle}>
      <p className="text-sm text-slate-300">Teacher accounts cannot enroll in subjects. Log out and scan the invitation with a student account.</p>
    </JoinCard>
  }

  const handleJoin = async () => {
    if (joining || success) return
    setJoining(true)
    setError('')
    try {
      const result = await subjectService.joinSubject(inviteCode)
      setSuccess(result.message || 'You joined the subject successfully.')
      setTimeout(() => navigate('/student/dashboard', { replace: true }), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to join this subject.')
    } finally {
      setJoining(false)
    }
  }

  return <JoinCard title="Join subject" icon={GraduationCap}>
    {error ? <Message tone="error">{error}</Message> : null}
    {success ? <Message tone="success">{success}</Message> : null}
    {invitation ? <div className="rounded-md border border-slate-700 bg-slate-950 p-5 text-left">
      <h2 className="text-xl font-bold text-white">{invitation.subject_name}</h2>
      <p className="mt-1 text-sm text-slate-300">Section {invitation.section} · Teacher: {invitation.teacher_name}</p>
      <p className="num mt-3 text-xs text-indigo-300">Code: {invitation.subject_code}</p>
    </div> : null}
    <Button variant="primary" loading={joining} disabled={!invitation || Boolean(success)} onClick={handleJoin} className="w-full">Join Subject</Button>
  </JoinCard>
}

function JoinCard({ title, icon: Icon, children }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center py-12">
      <div className="sheet rise w-full space-y-6 p-7 sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <Icon className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <h1 className="text-xl font-bold text-slate-50">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

function Message({ tone, children }) {
  return <Notice tone={tone}>{children}</Notice>
}
