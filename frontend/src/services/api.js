import axios from 'axios'

import { API_BASE_URL } from "./config";

// Storage key constants — defined once to avoid magic strings throughout the app
const TOKEN_STORAGE_KEY = 'facevplus_token'
const USER_STORAGE_KEY = 'facevplus_user'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const clearStoredAuth = (notify = true) => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  if (notify) window.dispatchEvent(new Event('facevplus:unauthorized'))
}

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — clear auth state on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearStoredAuth()
    }
    return Promise.reject(error)
  }
)

export default api
