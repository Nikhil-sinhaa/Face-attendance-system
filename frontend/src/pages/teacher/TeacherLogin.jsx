import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { AuthShell } from '../../components/common/AuthShell'
import { Notice } from '../../components/common/Notice'
import { CollegeGoogleButton } from '../../components/common/CollegeGoogleButton'
import { User, Lock, ArrowRight } from 'lucide-react'

export const TeacherLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await authService.loginTeacher(formData)
      login(data.access_token, data.user)
      navigate('/teacher/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (identity) => {
    if (!identity || loading) return
    setLoading(true)
    setError('')
    try {
      const data = await authService.loginTeacherGoogle(identity.credential)
      login(data.access_token, data.user)
      navigate('/teacher/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      side="teacher"
      title="Sign in to your register."
      intro="Your subjects, enrolment codes and every session you have recorded are one login away."
      points={['Create subjects and share enrolment QR codes', 'Take attendance by classroom photo or voice', 'Review and correct before anything is saved']}
      footer={
        <>
          New here?{' '}
          <Link to="/teacher/register" className="font-semibold text-pink-300 underline-offset-4 hover:underline">
            Create a teacher account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Notice>{error}</Notice>}
        <CollegeGoogleButton identity={null} onChange={handleGoogle} disabled={loading} />
        <p className="text-center text-xs text-slate-400">or sign in with username</p>
        <Input
          label="Username"
          id="username"
          placeholder="e.g. vikashkumar"
          icon={User}
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          autoComplete="username"
        />
        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Enter password"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          autoComplete="current-password"
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  )
}
