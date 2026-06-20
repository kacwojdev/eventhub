import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface EventData {
  title: string; description: string; location: string
  date: string; capacity: number; imageUrl?: string | null
}

export default function AdminEventForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', location: '', date: '', capacity: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    apiFetch<EventData>(`/api/events/${id}`).then(ev => {
      setForm({
        title: ev.title, description: ev.description, location: ev.location,
        date: new Date(ev.date).toISOString().slice(0, 16),
        capacity: String(ev.capacity),
      })
      setCurrentImage(ev.imageUrl ?? null)
    }).catch(console.error)
  }, [id, isEdit])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const body = { ...form, date: new Date(form.date).toISOString(), capacity: Number(form.capacity) }
      const ev = await apiFetch<{ id: number }>(
        isEdit ? `/api/admin/events/${id}` : '/api/admin/events',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body), token: token! }
      )
      const eventId = isEdit ? Number(id) : ev.id
      if (imageFile) {
        const fd = new FormData()
        fd.append('image', imageFile)
        await fetch(`/api/admin/events/${eventId}/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
      }
      navigate('/admin/events')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally { setLoading(false) }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setImageFile(e.target.files?.[0] ?? null)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
          <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data i godzina</label>
          <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pojemność</label>
          <input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zdjęcie</label>
          {currentImage && <img src={currentImage} alt="" className="w-32 h-20 object-cover rounded mb-2" />}
          <input type="file" accept="image/*" onChange={handleFileChange}
            className="w-full text-sm text-gray-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button type="button" onClick={() => navigate('/admin/events')} className="text-gray-500 hover:text-gray-700 px-4 py-2">
            Anuluj
          </button>
        </div>
      </form>
    </div>
  )
}
