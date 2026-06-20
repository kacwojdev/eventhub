import { Link } from 'react-router-dom'

interface Event {
  id: number
  title: string
  description: string
  location: string
  date: string
  capacity: number
  imageUrl?: string | null
  _count: { registrations: number }
}

export default function EventCard({ event }: { event: Event }) {
  const spotsLeft = event.capacity - event._count.registrations
  return (
    <Link to={`/events/${event.id}`} className="block rounded-xl overflow-hidden shadow hover:shadow-lg transition bg-white">
      {event.imageUrl ? (
        <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-indigo-100 flex items-center justify-center text-indigo-400 text-5xl">&#128197;</div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{new Date(event.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p className="text-sm text-gray-500">{event.location}</p>
        <p className={`text-sm mt-2 font-medium ${spotsLeft === 0 ? 'text-red-500' : 'text-green-600'}`}>
          {spotsLeft === 0 ? 'Brak miejsc' : `Wolne miejsca: ${spotsLeft}`}
        </p>
      </div>
    </Link>
  )
}
