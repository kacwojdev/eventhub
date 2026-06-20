import { useEffect, useState } from 'react'
import EventCard from '../components/EventCard'
import { apiFetch } from '../lib/api'

interface Event {
  id: number; title: string; description: string; location: string
  date: string; capacity: number; imageUrl?: string | null
  _count: { registrations: number }
}

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (date) params.set('date', new Date(date).toISOString())
    apiFetch<Event[]>(`/api/events?${params}`)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [search, date])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Wszystkie wydarzenia</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text" placeholder="Szukaj po tytule..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {(search || date) && (
          <button type="button" onClick={() => { setSearch(''); setDate('') }} className="text-sm text-gray-500 hover:text-gray-700">
            Wyczyść
          </button>
        )}
      </div>
      {isLoading ? (
        <p className="text-gray-400 text-center py-12">Ładowanie...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Brak wydarzeń</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  )
}
