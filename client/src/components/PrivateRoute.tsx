import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, role } = useAuth()
  if (!token || role !== 'user') return <Navigate to="/login" replace />
  return <>{children}</>
}
