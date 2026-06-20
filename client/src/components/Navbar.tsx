import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">EventHub</Link>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <span className="text-2xl">&#9776;</span>
        </button>
        <ul className={`${open ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:static top-14 left-0 w-full md:w-auto bg-indigo-700 md:bg-transparent z-10 md:items-center gap-2 md:gap-4 px-4 md:px-0 py-4 md:py-0`}>
          <li><Link to="/events" className="hover:underline" onClick={() => setOpen(false)}>Wydarzenia</Link></li>
          {user && role === 'user' && (
            <li><Link to="/my-registrations" className="hover:underline" onClick={() => setOpen(false)}>Moje zapisy</Link></li>
          )}
          {!user && (
            <>
              <li><Link to="/login" className="hover:underline" onClick={() => setOpen(false)}>Logowanie</Link></li>
              <li><Link to="/register" className="hover:underline" onClick={() => setOpen(false)}>Rejestracja</Link></li>
            </>
          )}
          {user && (
            <li><button onClick={handleLogout} className="hover:underline">Wyloguj ({user.name})</button></li>
          )}
        </ul>
      </div>
    </nav>
  )
}
