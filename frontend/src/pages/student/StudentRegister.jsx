import React, { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Notice } from '../../components/common/Notice'
import { AuthShell } from '../../components/common/AuthShell'
import { CollegeGoogleButton } from '../../components/common/CollegeGoogleButton'
import { Camera, Mic, Square, RefreshCw } from 'lucide-react'

export const StudentRegister = () => {
  const [name, setName] = useState('')
  const [googleIdentity, setGoogleIdentity] = useState(null)
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null)
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [voiceBlob, setVoiceBlob] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const webcamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const audioChunksRef = useRef([])

  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnPath = searchParams.get('return')?.startsWith('/') ? searchParams.get('return') : '/student/dashboard'

  // Snap photo from webcam
  const handleCapturePhoto = useCallback(async () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return

    setCapturedPhotoUrl(imageSrc)
    const res = await fetch(imageSrc)
    const blob = await res.blob()
    setCapturedPhotoBlob(blob)
  }, [])

  // Start voice recording
  const startRecording = async () => {
    setVoiceBlob(null)
    audioChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Use best supported codec for recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : ''

      mediaRecorderRef.current = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const recordedMime = mediaRecorderRef.current.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: recordedMime })
        setVoiceBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (_err) {
      setError('Microphone access denied. You can proceed without voice enrollment.')
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const handleGoogleChange = (identity) => {
    setGoogleIdentity(identity)
    setError('')
    // Pre-fill the name from the Google profile unless the student already typed one.
    if (identity && !name.trim()) setName(identity.name)
  }

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!googleIdentity) {
      setError('Please sign in with your college Google account first.')
      return
    }
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!capturedPhotoBlob) {
      setError('Please capture your facial snapshot for registration.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const data = await authService.registerStudent(googleIdentity.credential, name.trim(), capturedPhotoBlob, voiceBlob)
      setSuccess(`Profile created, ${data.user.name}. Join a subject and wait for your teacher to approve you.`)
      login(data.access_token, data.user)
      setTimeout(() => navigate(returnPath, { replace: true }), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      side="student"
      title="Register your face once."
      intro="After this you sign in by looking at the camera, and the teacher’s photo or voice roll call can recognise you."
      points={['Sign in with your college Google account', 'One clear face photo', 'Your teacher approves you when you join their subject']}
      wide
      footer={
        <>
          Already registered?{' '}
          <Link
            to={`/student/login?return=${encodeURIComponent(returnPath)}`}
            className="font-semibold text-emerald-300 underline-offset-4 hover:underline"
          >
            Sign in with face
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        {error && <Notice>{error}</Notice>}
        {success && <Notice tone="success">{success}</Notice>}

        <fieldset className="space-y-4">
          <legend className="eyebrow mb-4 flex items-center gap-2 text-slate-300"><span className="num text-indigo-400">01</span> Your details</legend>
          <CollegeGoogleButton identity={googleIdentity} onChange={handleGoogleChange} disabled={loading || Boolean(success)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              id="student_name"
              placeholder="e.g. Raman Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Roll no. (from your email)"
              id="student_roll"
              value={googleIdentity?.rollNo || ''}
              placeholder="Sign in with Google first"
              readOnly
            />
          </div>
        </fieldset>

        <section aria-labelledby="face-step">
          <h2 id="face-step" className="eyebrow mb-1 flex items-center gap-2 text-slate-300">
            <span className="num text-indigo-400">02</span> Face photo <span className="text-red-300">required</span>
          </h2>
          <p className="mb-3 text-sm text-slate-400">Good light, and only your face in the frame.</p>
          <div className="aspect-video overflow-hidden rounded-md border border-slate-600 bg-black [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_video]:h-full [&_video]:w-full [&_video]:object-cover">
            {capturedPhotoUrl ? (
              <img src={capturedPhotoUrl} alt="Your captured face" />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
              />
            )}
          </div>
          <div className="mt-3">
            {!capturedPhotoUrl ? (
              <Button variant="tertiary" icon={Camera} onClick={handleCapturePhoto} className="w-full">
                Take photo
              </Button>
            ) : (
              <Button
                variant="tertiary"
                icon={RefreshCw}
                onClick={() => {
                  setCapturedPhotoUrl(null)
                  setCapturedPhotoBlob(null)
                }}
                className="w-full"
              >
                Retake photo
              </Button>
            )}
          </div>
        </section>

        <details className="group rounded-md border border-slate-700 open:border-slate-500" open={isRecording || Boolean(voiceBlob)}>
          <summary className="eyebrow flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-slate-300 marker:hidden">
            <span><span className="num text-indigo-400">03</span>&nbsp; Voice sample <span className="text-slate-500">optional</span></span>
            <span className="num text-slate-500 group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
          </summary>
          <div className="space-y-3 border-t border-slate-700 px-4 py-4">
            <p className="text-sm text-slate-300">
              Say: <em className="text-slate-50">“I am present, my name is {name || '…'}”</em>
            </p>
            {voiceBlob && <p className="text-sm font-medium text-emerald-300">Voice sample recorded.</p>}
            {!isRecording ? (
              <Button variant="tertiary" icon={Mic} onClick={startRecording}>
                {voiceBlob ? 'Record again' : 'Record voice'}
              </Button>
            ) : (
              <Button variant="danger" icon={Square} onClick={stopRecording}>
                Stop · {recordingSeconds}s
              </Button>
            )}
          </div>
        </details>

        <Button type="submit" size="lg" loading={loading} disabled={Boolean(success)} className="w-full">
          Create student profile
        </Button>
      </form>
    </AuthShell>
  )
}
