import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface Event {
  id: number; title: string; description: string; location: string
  date: string; capacity: number; imageUrl?: string | null
  _count: { registrations: number }
}

interface Registration {
  id: number
  event: Event
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { token, role } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<Event>(`/api/events/${id}`).then(setEvent).catch(() => navigate('/events'))
    if (token && role === 'user') {
      apiFetch<Registration[]>('/api/me/registrations', { token })
        .then(regs => setRegistered(regs.some(r => r.event.id === Number(id))))
        .catch(console.error)
    }
  }, [id, token, role, navigate])

  async function handleRegister() {
    if (!token) { navigate('/login'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(`/api/events/${id}/register`, { method: 'POST', token })
      setRegistered(true)
      setEvent(e => e ? { ...e, _count: { registrations: e._count.registrations + 1 } } : e)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd')
    } finally { setLoading(false) }
  }

  async function handleUnregister() {
    setLoading(true); setError('')
    try {
      await apiFetch(`/api/events/${id}/register`, { method: 'DELETE', token: token! })
      setRegistered(false)
      setEvent(e => e ? { ...e, _count: { registrations: e._count.registrations - 1 } } : e)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd')
    } finally { setLoading(false) }
  }

  if (!event) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>

  const spotsLeft = event.capacity - event._count.registrations
  const isFull = spotsLeft <= 0

  return (
    <div className="max-w-2xl mx-auto">
      {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
      <p className="text-gray-500 mb-1">{new Date(event.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <p className="text-gray-500 mb-4">{event.location}</p>
      <p className="text-gray-700 mb-6">{event.description}</p>
      <p className={`font-medium mb-4 ${isFull ? 'text-red-500' : 'text-green-600'}`}>
        {isFull ? 'Brak wolnych miejsc' : `Wolne miejsca: ${spotsLeft} / ${event.capacity}`}
      </p>
      {error && <p className="text-red-500 mb-3">{error}</p>}
      {role === 'user' && (
        registered ? (
          <button type="button" onClick={handleUnregister} disabled={loading} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50">
            {loading ? 'Anulowanie...' : 'Wypisz się'}
          </button>
        ) : (
          <button type="button" onClick={handleRegister} disabled={loading || isFull} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Zapisywanie...' : 'Zapisz się'}
          </button>
        )
      )}
      {!token && !isFull && (
        <Link to="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Zaloguj się, aby zapisać
        </Link>
      )}
    </div>
  )
}
