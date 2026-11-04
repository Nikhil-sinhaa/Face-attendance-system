import api from './api'

export const authService = {
  async registerTeacher({ username, name, password }) {
    const res = await api.post('/auth/teacher/register', { username, name, password })
    return res.data
  },

  async loginTeacher({ username, password }) {
    const res = await api.post('/auth/teacher/login', { username, password })
    return res.data
  },

  async loginStudentFace(imageBlob) {
    const form = new FormData()
    form.append('file', imageBlob, 'face.jpg')
    const res = await api.post('/auth/student/face-login', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async registerStudent(studentId, name, faceBlob, voiceBlob) {
    const form = new FormData()
    form.append('student_id', studentId)
    form.append('name', name)
    form.append('face_file', faceBlob, 'face.jpg')
    if (voiceBlob) form.append('voice_file', voiceBlob, 'voice.wav')
    const res = await api.post('/auth/student/register', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async logout() {
    const res = await api.post('/auth/logout')
    return res.data
  },
}
