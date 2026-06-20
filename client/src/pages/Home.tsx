import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import { apiFetch } from '../lib/api'

interface Event {
  id: number; title: string; description: string; location: string
  date: string; capacity: number; imageUrl?: string | null
  _count: { registrations: number }
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    apiFetch<Event[]>('/api/events').then(setEvents).catch(console.error)
  }, [])

  return (
    <div>
      <section className="text-center py-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white mb-10 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Witaj w EventHub</h1>
        <p className="text-lg md:text-xl opacity-90 mb-6">Odkryj i zapisuj się na wydarzenia studenckie</p>
        <Link to="/events" className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-full hover:bg-indigo-50 transition">
          Przeglądaj wydarzenia
        </Link>
      </section>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nadchodzące wydarzenia</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.slice(0, 3).map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </div>
  )
}
