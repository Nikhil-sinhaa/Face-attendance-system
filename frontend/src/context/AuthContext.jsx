import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { clearStoredAuth } from '../services/api'

const TOKEN_KEY = 'facevplus_token'
const USER_KEY = 'facevplus_user'

const AuthContext = createContext(null)

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return localStorage.getItem(TOKEN_KEY) && raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser)
  const [loading] = useState(false)

  const login = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Token may already be invalid; clear local state regardless.
    }
    clearStoredAuth(false)
    setUser(null)
  }, [])

  // api.js dispatches this event on any 401 response
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('facevplus:unauthorized', onUnauthorized)
    return () => window.removeEventListener('facevplus:unauthorized', onUnauthorized)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isTeacher: user?.role === 'teacher',
      isStudent: user?.role === 'student',
    }),
    [user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
