import React, { useState, useRef } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { attendanceService } from '../../services/attendanceService'
import { Mic, Square, Upload, AlertCircle, Volume2, CheckCircle } from 'lucide-react'

export const VoiceAttendanceModal = ({
  isOpen,
  onClose,
  subjectId,
  onAnalysisComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const audioChunksRef = useRef([])


    const startRecording = async () => {
    setError('')
    setAudioBlob(null)
    setAudioUrl(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Determine best supported MIME type for recording
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const recordedMime = mediaRecorderRef.current.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: recordedMime })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (_err) {
      setError('Microphone permission denied or device not found.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }


    const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioBlob(file)
      setAudioUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleAnalyze = async () => {
    if (!audioBlob) {
      setError('Please record or upload classroom audio first.')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Use a consistent filename; librosa handles webm/ogg/wav on the backend
      const filename =
        audioBlob.type.includes('ogg') ? 'classroom_audio.ogg'
        : audioBlob.type.includes('webm') ? 'classroom_audio.webm'
        : 'classroom_audio.wav'
      const audioFile = new File([audioBlob], filename, { type: audioBlob.type })
      const result = await attendanceService.processVoiceAttendance(subjectId, audioFile)
      onAnalysisComplete(result)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process voice recognition.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  