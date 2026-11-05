import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { AuthShell } from '../../components/common/AuthShell'
import { Notice } from '../../components/common/Notice'
import { CollegeGoogleButton } from '../../components/common/CollegeGoogleButton'
import { User, Lock, UserCheck, ArrowRight } from 'lucide-react'

export const TeacherRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleIdentity, setGoogleIdentity] = useState(null)
  const [submittedMessage, setSubmittedMessage] = useState('')

  const handleGoogleChange = (identity) => {
    setGoogleIdentity(identity)
    setError('')
    if (identity && !formData.name.trim()) setFormData((prev) => ({ ...prev, name: identity.name }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!googleIdentity) {
      setError('Please sign in with your college Google account first.')
      return
    }
    if (!formData.username || !formData.name || !formData.password || !formData.confirm_password) {
      setError('All fields are required.')
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await authService.registerTeacher({
        username: formData.username,
        name: formData.name,
        password: formData.password,
        googleIdToken: googleIdentity.credential,
      })
      setSubmittedMessage(data.message || 'Registration submitted. You can sign in once the admin approves your account.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      side="teacher"
      title="Set up your teaching profile."
      intro="One account for all your subjects. Students join with a code you share — no spreadsheets to import."
      points={['Sign in with your college Google account', 'The admin approves your account', 'Then create subjects and take attendance']}
      footer={
        <>
          Already registered?{' '}
          <Link to="/teacher/login" className="font-semibold text-pink-300 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {submittedMessage ? (
        <div className="space-y-5">
          <Notice tone="success">{submittedMessage}</Notice>
          <p className="text-sm text-slate-400">
            We will let the admin know. Until then you will not be able to sign in.
          </p>
          <Link to="/teacher/login" className="inline-block text-sm font-semibold text-pink-300 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Notice>{error}</Notice>}
          <CollegeGoogleButton identity={googleIdentity} onChange={handleGoogleChange} disabled={loading} />

          <Input
            label="Full Name"
            id="name"
            placeholder="e.g. Prof. Vikash Kumar"
            icon={UserCheck}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Username"
            id="username"
            placeholder="Choose username"
            icon={User}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            autoComplete="username"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="Create password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            id="confirm_password"
            type="password"
            placeholder="Confirm password"
            icon={Lock}
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          <span>Request account</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      )}
    </AuthShell>
  )
}
