import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await apiFetch<{ token: string; user: { id: number; name: string; email: string } }>(
        '/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }
      )
      login(data.token, data.user, 'user')
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd rejestracji')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Rejestracja</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło (min. 6 znaków)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Rejestracja...' : 'Zarejestruj się'}
        </button>
        <p className="text-sm text-gray-500 text-center">Masz już konto? <Link to="/login" className="text-indigo-600 hover:underline">Zaloguj się</Link></p>
      </form>
    </div>
  )
}
