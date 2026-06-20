import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface User { id: number; name: string; email: string }
interface AuthState {
  token: string | null
  user: User | null
  role: 'user' | 'admin' | null
  login: (token: string, user: User, role: 'user' | 'admin') => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user')
    try { return u ? JSON.parse(u) : null } catch { return null }
  })
  const [role, setRole] = useState<'user' | 'admin' | null>(() => {
    const r = localStorage.getItem('role')
    return (r === 'user' || r === 'admin') ? r : null
  })

  function login(token: string, user: User, role: 'user' | 'admin') {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('role', role)
    setToken(token)
    setUser(user)
    setRole(role)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    setToken(null)
    setUser(null)
    setRole(null)
  }

  return <AuthContext.Provider value={{ token, user, role, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
