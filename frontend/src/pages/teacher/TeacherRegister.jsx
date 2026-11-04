import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { AuthShell } from '../../components/common/AuthShell'
import { Notice } from '../../components/common/Notice'
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

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      })
      login(data.access_token, data.user)
      navigate('/teacher/dashboard')
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
      points={['Create a subject in under a minute', 'Share its code or QR with the class', 'Start taking attendance the same day']}
      footer={
        <>
          Already registered?{' '}
          <Link to="/teacher/login" className="font-semibold text-pink-300 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Notice>{error}</Notice>}
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
          <span>Create account</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  )
}
