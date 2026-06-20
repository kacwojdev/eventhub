import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface Participant {
  id: number
  createdAt: string
  user: { id: number; name: string; email: string }
}

export default function AdminParticipants() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<Participant[]>(`/api/admin/events/${id}/participants`, { token: token! })
      .then(setParticipants)
      .catch(() => setError('Nie udało się załadować uczestników.'))
      .finally(() => setLoading(false))
  }, [id, token])

  if (loading) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/events" className="text-indigo-600 hover:underline text-sm">&#8592; Powrót</Link>
        <h1 className="text-2xl font-bold text-gray-800">Uczestnicy ({participants.length})</h1>
      </div>
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Imię i nazwisko</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Data zapisu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participants.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.user.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.user.email}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(p.createdAt).toLocaleDateString('pl-PL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {participants.length === 0 && <p className="text-center py-10 text-gray-400">Brak uczestników</p>}
      </div>
    </div>
  )
}
