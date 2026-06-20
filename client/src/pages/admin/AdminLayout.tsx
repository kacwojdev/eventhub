import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/admin/login') }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-indigo-800 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 font-bold text-xl border-b border-indigo-700">EventHub Admin</div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/admin/events" className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-indigo-700'}`}>
            Wydarzenia
          </NavLink>
        </nav>
        <div className="px-3 py-4 border-t border-indigo-700">
          <button type="button" onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-700 rounded-lg">
            Wyloguj
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
