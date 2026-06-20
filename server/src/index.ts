import express from 'express'
import cors from 'cors'
import path from 'path'
import authRoutes from './routes/auth'
import eventsRoutes from './routes/events'
import registrationsRoutes from './routes/registrations'
import adminRoutes from './routes/admin'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api', eventsRoutes)
app.use('/api', registrationsRoutes)
app.use('/api/admin', adminRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
