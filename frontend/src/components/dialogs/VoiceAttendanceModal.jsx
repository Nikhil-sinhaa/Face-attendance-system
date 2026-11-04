import React, { useState, useRef } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { attendanceService } from '../../services/attendanceService'
import { Notice } from '../common/Notice'
import { Mic, Square, Upload, Volume2, CheckCircle } from 'lucide-react'

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voice roll call"
      subtitle="Record students calling out “present”, or upload an existing recording."
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {error && <Notice>{error}</Notice>}

        <div className="rounded-lg border border-slate-700 bg-slate-950 p-6 text-center">
          <div
            className={`mx-auto grid h-20 w-20 place-items-center rounded-full border-2 transition-colors ${
              isRecording ? 'border-red-400 text-red-300' : 'border-slate-600 text-indigo-400'
            }`}
          >
            <Mic className="h-8 w-8" aria-hidden="true" />
          </div>

          <div className="mt-5 min-h-16" aria-live="polite">
            {isRecording ? (
              <>
                <p className="num flex items-center justify-center gap-2 text-3xl font-semibold text-red-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
                  {formatTime(recordingTime)}
                </p>
                <p className="mt-1 text-sm text-slate-400">Recording…</p>
              </>
            ) : audioBlob ? (
              <>
                <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-300">
                  <CheckCircle className="h-4 w-4" aria-hidden="true" /> Audio ready to analyse
                </p>
                {audioUrl && <audio controls src={audioUrl} className="mx-auto mt-3 h-10 w-full max-w-xs" />}
              </>
            ) : (
              <p className="text-sm text-slate-400">Press start, then call the roll.</p>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            {!isRecording ? (
              <Button variant="primary" onClick={startRecording} icon={Mic}>
                {audioBlob ? 'Record again' : 'Start recording'}
              </Button>
            ) : (
              <Button variant="danger" onClick={stopRecording} icon={Square}>
                Stop recording
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-800" />
          <span className="eyebrow">or upload</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-600 px-3 py-3.5 text-sm font-medium text-slate-200 transition-colors focus-within:outline-2 focus-within:outline-indigo-400 hover:border-indigo-400 hover:bg-slate-800">
          <Upload className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <span>Select audio file (.wav, .mp3, .webm)</span>
          <input type="file" accept="audio/*" className="sr-only" onChange={handleFileUpload} />
        </label>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleAnalyze} disabled={!audioBlob} loading={loading} icon={Volume2}>
            Analyse audio
          </Button>
        </div>
      </div>
    </Modal>
  )
}
