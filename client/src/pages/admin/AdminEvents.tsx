import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface Event {
  id: number; title: string; date: string; location: string
  capacity: number; _count: { registrations: number }
}

export default function AdminEvents() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    apiFetch<Event[]>('/api/admin/events', { token: token! })
      .then(setEvents)
      .catch(() => setFetchError('Nie udało się załadować wydarzeń.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleDelete(id: number) {
    if (!confirm('Usunąć wydarzenie? Spowoduje to również usunięcie wszystkich zapisów.')) return
    try {
      await apiFetch(`/api/admin/events/${id}`, { method: 'DELETE', token: token! })
      setEvents(e => e.filter(ev => ev.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Błąd usuwania')
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>
  if (fetchError) return <div className="text-center py-20 text-red-500">{fetchError}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Wydarzenia</h1>
        <Link to="/admin/events/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
          + Nowe wydarzenie
        </Link>
      </div>
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Tytuł</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Data</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Lokalizacja</th>
              <th className="px-4 py-3 text-center">Zapisy</th>
              <th className="px-4 py-3 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map(ev => (
              <tr key={ev.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{ev.title}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(ev.date).toLocaleDateString('pl-PL')}</td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{ev.location}</td>
                <td className="px-4 py-3 text-center text-gray-500">{ev._count.registrations} / {ev.capacity}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button type="button" onClick={() => navigate(`/admin/events/${ev.id}/participants`)} className="text-indigo-600 hover:underline">Uczestnicy</button>
                  <button type="button" onClick={() => navigate(`/admin/events/${ev.id}/edit`)} className="text-yellow-600 hover:underline">Edytuj</button>
                  <button type="button" onClick={() => handleDelete(ev.id)} className="text-red-500 hover:underline">Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p className="text-center py-10 text-gray-400">Brak wydarzeń</p>}
      </div>
    </div>
  )
}
