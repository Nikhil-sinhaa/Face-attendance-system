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

  