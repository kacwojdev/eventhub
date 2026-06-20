import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { token, role } = useAuth()
  if (!token || role !== 'admin') return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
