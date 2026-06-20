// client/src/pages/MyRegistrations.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface Registration {
  id: number
  event: { id: number; title: string; date: string; location: string }
}

export default function MyRegistrations() {
  const { token } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [unregisterError, setUnregisterError] = useState('')

  useEffect(() => {
    setFetchError('')
    apiFetch<Registration[]>('/api/me/registrations', { token: token! })
      .then(setRegistrations)
      .catch(() => setFetchError('Nie udało się załadować zapisów.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleUnregister(eventId: number) {
    if (pendingIds.has(eventId)) return
    setUnregisterError('')
    // Optimistic remove
    const previous = registrations
    setRegistrations(r => r.filter(reg => reg.event.id !== eventId))
    setPendingIds(s => new Set(s).add(eventId))
    try {
      await apiFetch(`/api/events/${eventId}/register`, { method: 'DELETE', token: token! })
    } catch {
      // Revert on failure
      setRegistrations(previous)
      setUnregisterError('Nie udało się wypisać. Spróbuj ponownie.')
    } finally {
      setPendingIds(s => { const n = new Set(s); n.delete(eventId); return n })
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>
  if (fetchError) return <div className="text-center py-20 text-red-500">{fetchError}</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Moje zapisy</h1>
      {unregisterError && <p className="text-red-500 text-sm mb-4">{unregisterError}</p>}
      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nie jesteś zapisany na żadne wydarzenie.</p>
          <Link to="/events" className="text-indigo-600 hover:underline">Przeglądaj wydarzenia</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {registrations.map(reg => (
            <li key={reg.id} className="bg-white shadow rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <Link to={`/events/${reg.event.id}`} className="font-semibold text-gray-800 hover:text-indigo-600">{reg.event.title}</Link>
                <p className="text-sm text-gray-500">{new Date(reg.event.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-sm text-gray-500">{reg.event.location}</p>
              </div>
              <button
                type="button"
                onClick={() => handleUnregister(reg.event.id)}
                disabled={pendingIds.has(reg.event.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 disabled:opacity-50"
              >
                {pendingIds.has(reg.event.id) ? 'Wypisywanie...' : 'Wypisz się'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
