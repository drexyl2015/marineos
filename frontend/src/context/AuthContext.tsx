import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setAuthToken } from '../lib/api'

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
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setAuthToken(token)
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('auth_token')
          setToken(null)
          setUser(null)
          setAuthToken(null)
        })
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const newToken = res.data.access_token
    localStorage.setItem('auth_token', newToken)
    setAuthToken(newToken)
    setToken(newToken)
    const meRes = await api.get('/api/auth/me')
    setUser(meRes.data)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
