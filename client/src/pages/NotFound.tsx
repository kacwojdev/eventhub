import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-gray-500 mb-6">Nie znaleziono strony</p>
      <Link to="/" className="text-indigo-600 hover:underline">Wróć na stronę główną</Link>
    </div>
  )
}
