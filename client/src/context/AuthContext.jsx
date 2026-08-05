import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosInstance'

const AuthContext = createContext(null)

const TOKEN_KEY = 'st_token'
const USER_KEY  = 'st_user'

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
      throw new Error(err.response?.data?.message || 'Registration failed.')
    }
  }

  const login = async ({ email, password }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      saveSession(data.token, data.user)
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed.')
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
