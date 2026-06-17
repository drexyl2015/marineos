import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AuthUser {
  id: number
  email: string
  full_name: string | null
  role: string
  is_active: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get(`${API_URL}/api/auth/me`)
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('auth_token')
          setToken(null)
          setUser(null)
          delete axios.defaults.headers.common['Authorization']
        })
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password })
    const newToken = res.data.access_token
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    const meRes = await axios.get(`${API_URL}/api/auth/me`)
    setUser(meRes.data)
  }

  const register = async (email: string, password: string, fullName?: string) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, {
      email, password, full_name: fullName || null,
    })
    const newToken = res.data.access_token
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    const meRes = await axios.get(`${API_URL}/api/auth/me`)
    setUser(meRes.data)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
