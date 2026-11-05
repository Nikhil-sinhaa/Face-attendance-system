import api from './api'

export const adminService = {
  async login({ email, password }) {
    const res = await api.post('/admin/login', { email, password })
    return res.data
  },

  async getTeachers(status = 'pending') {
    const res = await api.get('/admin/teachers', { params: { status } })
    return res.data
  },

  async approveTeacher(teacherId) {
    const res = await api.post(`/admin/teachers/${teacherId}/approve`)
    return res.data
  },

  async rejectTeacher(teacherId) {
    const res = await api.post(`/admin/teachers/${teacherId}/reject`)
    return res.data
  },
}
