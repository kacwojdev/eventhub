import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import MyRegistrations from './pages/MyRegistrations'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminEvents from './pages/admin/AdminEvents'
import AdminEventForm from './pages/admin/AdminEventForm'
import AdminParticipants from './pages/admin/AdminParticipants'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/new" element={<AdminEventForm />} />
            <Route path="events/:id/edit" element={<AdminEventForm />} />
            <Route path="events/:id/participants" element={<AdminParticipants />} />
          </Route>
          <Route path="/" element={<><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><Home /></main></>} />
          <Route path="/events" element={<><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><EventList /></main></>} />
          <Route path="/events/:id" element={<><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><EventDetail /></main></>} />
          <Route path="/login" element={<><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><Login /></main></>} />
          <Route path="/register" element={<><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><Register /></main></>} />
          <Route path="/my-registrations" element={<><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><PrivateRoute><MyRegistrations /></PrivateRoute></main></>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
