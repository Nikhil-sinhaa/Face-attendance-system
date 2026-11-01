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


  