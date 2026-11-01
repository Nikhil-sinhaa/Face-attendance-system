import api from './api'

export const attendanceService = {
  async recognizeFaceAttendance(subjectId, imageFiles) {
    const formData = new FormData()
    formData.append('subject_id', subjectId)
    imageFiles.forEach((file, index) => {
      formData.append('files', file, file.name || `photo_${index}.jpg`)
    })
    const res = await api.post('/attendance/face/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

    async processVoiceAttendance(subjectId, audioBlob) {
    const formData = new FormData()
    formData.append('subject_id', subjectId)
    // Derive a sensible extension from the blob MIME type so the backend can decode it
    const ext =
      audioBlob.type.includes('ogg') ? 'ogg'
      : audioBlob.type.includes('webm') ? 'webm'
      : audioBlob.type.includes('mp4') ? 'mp4'
      : 'wav'
    const filename = `classroom_audio.${ext}`
    const audioFile = audioBlob instanceof File ? audioBlob : new File([audioBlob], filename, { type: audioBlob.type || 'audio/webm' })
    formData.append('audio_file', audioFile, audioFile.name)
    const res = await api.post('/attendance/voice/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  