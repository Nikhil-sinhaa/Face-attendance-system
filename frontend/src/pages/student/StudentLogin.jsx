import React, { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Button } from '../../components/common/Button'
import { AuthShell } from '../../components/common/AuthShell'
import { Notice } from '../../components/common/Notice'
import { ScanFace } from 'lucide-react'

export const StudentLogin = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const webcamRef = useRef(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnPath = searchParams.get('return')?.startsWith('/') ? searchParams.get('return') : '/student/dashboard'

  const handleFaceLogin = useCallback(async () => {
    if (loading) return
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      setError('Camera frame unavailable. Please check camera permissions.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(imageSrc)
      const blob = await res.blob()
      const data = await authService.loginStudentFace(blob)

      setSuccess(`Welcome back, ${data.user.name}!`)
      login(data.access_token, data.user)
      setTimeout(() => navigate(returnPath, { replace: true }), 1200)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Face not recognized. If you are a new student, please register first.'
      )
    } finally {
      setLoading(false)
    }
  }, [login, navigate])

  return (
    <AuthShell
      side="student"
      title="Your face is your login."
      intro="Look at the camera and you are in. No password, no student card."
      points={['Face the camera in good light', 'Remove anything covering your face', 'New? Register your face once, first']}
      wide
      footer={
        <>
          Not recognised, or new here?{' '}
          <Link to="/student/register" className="font-semibold text-emerald-300 underline-offset-4 hover:underline">
            Register your face &amp; voice
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Notice>{error}</Notice>}
        {success && <Notice tone="success">{success}</Notice>}

        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-slate-600 bg-black">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
            className="h-full w-full object-cover"
          />
          {/* Scan-frame corners */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
            <div className="relative h-[72%] aspect-[3/4] max-w-[48%]">
              <i className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-indigo-400" />
              <i className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-indigo-400" />
              <i className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-indigo-400" />
              <i className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-indigo-400" />
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleFaceLogin}
          loading={loading}
          disabled={Boolean(success)}
          className="w-full"
          icon={ScanFace}
        >
          {loading ? 'Matching your face…' : 'Sign in with face'}
        </Button>
      </div>
    </AuthShell>
  )
}
