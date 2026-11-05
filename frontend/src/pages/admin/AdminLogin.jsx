import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/adminService'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { AuthShell } from '../../components/common/AuthShell'
import { Notice } from '../../components/common/Notice'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await adminService.login({ email: formData.email.trim(), password: formData.password })
      login(data.access_token, data.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      side="admin"
      title="Approve new teachers."
      intro="Teachers cannot sign in until you approve their registration. This keeps spam accounts out."
      points={['Review each teacher’s college email', 'Approve or reject in one click', 'Rejected teachers can no longer sign in']}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Notice>{error}</Notice>}
        <Input
          label="Admin email"
          id="admin_email"
          type="email"
          placeholder="admin@iiitdwd.ac.in"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          autoComplete="username"
        />
        <Input
          label="Password"
          id="admin_password"
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
