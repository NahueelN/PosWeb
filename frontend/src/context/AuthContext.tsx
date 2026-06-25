import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api } from '../api/client'
import type { LoginRequest, LoginResponse, UsuarioInfo } from '../types'

interface AuthContextType {
  user: UsuarioInfo | null
  isAuthenticated: boolean
  login: (dto: LoginRequest) => Promise<void>
  pinLogin: (dto: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioInfo | null>(() => {
    const stored = localStorage.getItem('user_info')
    const expires = localStorage.getItem('jwt_expires')
    if (stored && expires) {
      if (new Date(expires) > new Date()) {
        return JSON.parse(stored)
      }
      // Token expired, clean up
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_expires')
      localStorage.removeItem('user_info')
    }
    return null
  })

  const isAuthenticated = user !== null

  const handleLoginResponse = useCallback((res: LoginResponse) => {
    localStorage.setItem('jwt_token', res.token)
    localStorage.setItem('jwt_expires', res.expiresAt)
    localStorage.setItem('user_info', JSON.stringify(res.usuario))
    setUser(res.usuario)
  }, [])

  const login = useCallback(async (dto: LoginRequest) => {
    const res = await api.auth.login(dto)
    handleLoginResponse(res)
  }, [handleLoginResponse])

  const pinLogin = useCallback(async (dto: LoginRequest) => {
    const res = await api.auth.pinLogin(dto)
    handleLoginResponse(res)
  }, [handleLoginResponse])

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_expires')
    localStorage.removeItem('user_info')
    setUser(null)
  }, [])

  // Listen for forced logout from API 401 responses
  useEffect(() => {
    const handler = () => {
      setUser(null)
    }
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, pinLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
