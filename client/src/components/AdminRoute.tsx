import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { token, role } = useAuth()
  if (!token || role !== 'admin') return <Navigate to="/admin/login" replace />
  return <Outlet />
}
