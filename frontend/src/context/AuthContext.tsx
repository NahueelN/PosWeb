import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api, clearStoredSession, expireSession, isSessionExpired } from '../api/client'
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
    if (stored) {
      if (!isSessionExpired() && localStorage.getItem('jwt_token')) {
        return JSON.parse(stored)
      }
      clearStoredSession()
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

  useEffect(() => {
    if (!user) return

    const expiresAt = localStorage.getItem('jwt_expires')
    const delay = expiresAt ? Date.parse(expiresAt) - Date.now() : Number.NaN
    if (!Number.isFinite(delay) || delay <= 0) {
      expireSession()
      return
    }

    const timeoutId = window.setTimeout(expireSession, delay)
    return () => window.clearTimeout(timeoutId)
  }, [user])

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
