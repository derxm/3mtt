import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosInstance'

const AuthContext = createContext(null)

const TOKEN_KEY = 'st_token'
const USER_KEY  = 'st_user'

// Build a useful error message from an axios error, because the API may be
// unreachable, misconfigured (HTML instead of JSON), or genuinely return a
// JSON error body like "Invalid email or password."
function apiErrorMessage(err, fallback) {
  const data = err.response?.data
  if (data && typeof data === 'object' && data.message) return data.message
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Cannot reach the server. Check your connection or the API URL.'
  }
  if (typeof data === 'string' && data.toLowerCase().includes('<html')) {
    return 'Server returned a web page instead of JSON. The API URL is not pointing at the backend.'
  }
  if (err.response.status >= 500) return 'Server error. Please try again later.'
  return fallback
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate session from localStorage on first load
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const stored = localStorage.getItem(USER_KEY)
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TOKEN_KEY)
      }
    }
    setLoading(false)
  }, [])

  const saveSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }

  const register = async ({ name, email, password }) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      saveSession(data.token, data.user)
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Registration failed.'))
    }
  }

  const login = async ({ email, password }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      saveSession(data.token, data.user)
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Login failed.'))
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
