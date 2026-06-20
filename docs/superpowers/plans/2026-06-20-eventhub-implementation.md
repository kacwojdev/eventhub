# EventHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack event management web app with public event browsing, user auth, event registration, and an admin panel.

**Architecture:** React SPA (Vite, port 5173) communicates with an Express REST API (port 3001) via fetch + JWT. SQLite database accessed through Prisma ORM. Monorepo with `client/` and `server/` folders, started together via `concurrently`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, React Router v6, Express, Prisma, SQLite, bcrypt, jsonwebtoken, zod, multer, concurrently

---

## File Map

### server/
- `prisma/schema.prisma` — DB schema (User, Event, Registration, Admin)
- `prisma/seed.ts` — seeds admin account
- `src/index.ts` — Express app entry, middleware, route mounts
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/jwt.ts` — sign/verify helpers for user + admin tokens
- `src/middleware/auth.ts` — requireUser, requireAdmin middleware
- `src/routes/auth.ts` — POST /api/auth/register, /api/auth/login
- `src/routes/events.ts` — GET /api/events, GET /api/events/:id
- `src/routes/registrations.ts` — POST/DELETE /api/events/:id/register, GET /api/me/registrations
- `src/routes/admin.ts` — all /api/admin/* routes
- `src/routes/uploads.ts` — static file serving for uploads

### client/
- `src/main.tsx` — React entry
- `src/App.tsx` — router setup
- `src/context/AuthContext.tsx` — auth state (token, user, role, login/logout)
- `src/lib/api.ts` — typed fetch wrapper
- `src/components/Navbar.tsx` — top nav with hamburger on mobile
- `src/components/EventCard.tsx` — reusable event card
- `src/components/PrivateRoute.tsx` — redirect wrapper
- `src/components/AdminRoute.tsx` — admin redirect wrapper
- `src/pages/Home.tsx`
- `src/pages/EventList.tsx`
- `src/pages/EventDetail.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/MyRegistrations.tsx`
- `src/pages/admin/AdminLogin.tsx`
- `src/pages/admin/AdminLayout.tsx` — sidebar layout wrapper
- `src/pages/admin/AdminEvents.tsx`
- `src/pages/admin/AdminEventForm.tsx` — create + edit
- `src/pages/admin/AdminParticipants.tsx`

---

## Task 1: Monorepo scaffold

**Files:**
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/` (Vite scaffold)

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "eventhub",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "build": "npm run build --prefix client",
    "seed": "npm run seed --prefix server"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Install root deps**

```bash
cd /path/to/eventhub
npm install
```

- [ ] **Step 3: Scaffold Vite React+TS client**

```bash
npm create vite@latest client -- --template react-ts
cd client && npm install
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 4: Configure Tailwind in client**

Edit `client/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Edit `client/src/index.css` (replace contents):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Configure Vite proxy**

Edit `client/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 6: Scaffold server**

```bash
mkdir -p server/src/routes server/src/middleware server/src/lib server/prisma server/uploads
cd server
npm init -y
npm install express cors jsonwebtoken bcrypt zod multer
npm install -D typescript ts-node-dev @types/express @types/cors @types/jsonwebtoken @types/bcrypt @types/multer @types/node
npm install @prisma/client
npm install -D prisma
```

- [ ] **Step 7: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src", "prisma"]
}
```

- [ ] **Step 8: Add server scripts to server/package.json**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: monorepo scaffold with client and server"
```

---

## Task 2: Prisma schema + migration + seed

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/prisma/seed.ts`
- Create: `server/src/lib/prisma.ts`

- [ ] **Step 1: Write schema.prisma**

```prisma
// server/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id           Int            @id @default(autoincrement())
  email        String         @unique
  passwordHash String
  name         String
  createdAt    DateTime       @default(now())
  registrations Registration[]
}

model Event {
  id            Int            @id @default(autoincrement())
  title         String
  description   String
  location      String
  date          DateTime
  capacity      Int
  imageUrl      String?
  createdAt     DateTime       @default(now())
  registrations Registration[]
}

model Registration {
  id        Int      @id @default(autoincrement())
  userId    Int
  eventId   Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  event     Event    @relation(fields: [eventId], references: [id])

  @@unique([userId, eventId])
}

model Admin {
  id           Int    @id @default(autoincrement())
  email        String @unique
  passwordHash String
}
```

- [ ] **Step 2: Run migration**

```bash
cd server
npx prisma migrate dev --name init
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Write seed.ts**

```ts
// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@eventhub.pl' },
    update: {},
    create: { email: 'admin@eventhub.pl', passwordHash },
  })

  // Sample events
  const events = [
    {
      title: 'Warsztaty React',
      description: 'Praktyczne warsztaty z React i TypeScript dla początkujących.',
      location: 'Sala 101, Wydział Informatyki',
      date: new Date('2026-07-15T10:00:00'),
      capacity: 30,
    },
    {
      title: 'Hackathon Letni',
      description: '24-godzinny hackathon dla studentów. Wygraj nagrody!',
      location: 'Aula Główna',
      date: new Date('2026-08-01T09:00:00'),
      capacity: 50,
    },
    {
      title: 'Seminarium AI',
      description: 'Wykład o zastosowaniach sztucznej inteligencji w biznesie.',
      location: 'Online (link po rejestracji)',
      date: new Date('2026-07-20T18:00:00'),
      capacity: 100,
    },
  ]

  for (const event of events) {
    await prisma.event.create({ data: event })
  }

  console.log('Seed complete. Admin: admin@eventhub.pl / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 4: Run seed**

```bash
cd server
npm run seed
```

Expected: `Seed complete. Admin: admin@eventhub.pl / admin123`

- [ ] **Step 5: Write Prisma client singleton**

```ts
// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export default prisma
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: prisma schema, migration, and seed"
```

---

## Task 3: Express app entry + JWT helpers + auth middleware

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/lib/jwt.ts`
- Create: `server/src/middleware/auth.ts`

- [ ] **Step 1: Write JWT helpers**

```ts
// server/src/lib/jwt.ts
import jwt from 'jsonwebtoken'

const USER_SECRET = process.env.JWT_USER_SECRET || 'user-secret-dev'
const ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'admin-secret-dev'

export function signUserToken(userId: number): string {
  return jwt.sign({ userId, role: 'user' }, USER_SECRET, { expiresIn: '24h' })
}

export function signAdminToken(adminId: number): string {
  return jwt.sign({ adminId, role: 'admin' }, ADMIN_SECRET, { expiresIn: '24h' })
}

export function verifyUserToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, USER_SECRET) as { userId: number; role: string }
}

export function verifyAdminToken(token: string): { adminId: number; role: string } {
  return jwt.verify(token, ADMIN_SECRET) as { adminId: number; role: string }
}
```

- [ ] **Step 2: Write auth middleware**

```ts
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { verifyUserToken, verifyAdminToken } from '../lib/jwt'

export interface AuthRequest extends Request {
  userId?: number
  adminId?: number
}

export function requireUser(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = verifyUserToken(header.slice(7))
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = verifyAdminToken(header.slice(7))
    req.adminId = payload.adminId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

- [ ] **Step 3: Write Express entry point**

```ts
// server/src/index.ts
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
```

- [ ] **Step 4: Create placeholder route files so server compiles**

```ts
// server/src/routes/auth.ts
import { Router } from 'express'
const router = Router()
export default router
```

Create the same empty router in:
- `server/src/routes/events.ts`
- `server/src/routes/registrations.ts`
- `server/src/routes/admin.ts`

- [ ] **Step 5: Verify server starts**

```bash
cd server && npm run dev
```

Expected: `Server running on http://localhost:3001`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: express app, jwt helpers, auth middleware"
```

---

## Task 4: Auth routes (register + login)

**Files:**
- Modify: `server/src/routes/auth.ts`

- [ ] **Step 1: Implement register + login**

```ts
// server/src/routes/auth.ts
import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { signUserToken } from '../lib/jwt'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const { name, email, password } = result.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, passwordHash } })
  const token = signUserToken(user.id)
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const { email, password } = result.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const token = signUserToken(user.id)
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

export default router
```

- [ ] **Step 2: Test register**

```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' | jq
```

Expected: `{ "token": "...", "user": { "id": 1, ... } }`

- [ ] **Step 3: Test login**

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq
```

Expected: `{ "token": "...", "user": { ... } }`

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/auth.ts
git commit -m "feat: user register and login endpoints"
```

---

## Task 5: Events + Registrations routes

**Files:**
- Modify: `server/src/routes/events.ts`
- Modify: `server/src/routes/registrations.ts`

- [ ] **Step 1: Implement events routes**

```ts
// server/src/routes/events.ts
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'

const router = Router()

router.get('/events', async (req: Request, res: Response) => {
  const { search, date } = req.query
  const events = await prisma.event.findMany({
    where: {
      ...(search ? { title: { contains: String(search) } } : {}),
      ...(date ? { date: { gte: new Date(String(date)) } } : {}),
    },
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: 'asc' },
  })
  res.json(events)
})

router.get('/events/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  })
  if (!event) {
    res.status(404).json({ error: 'Event not found' })
    return
  }
  res.json(event)
})

export default router
```

- [ ] **Step 2: Implement registrations routes**

```ts
// server/src/routes/registrations.ts
import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { requireUser, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/events/:id/register', requireUser, async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id)
  const userId = req.userId!

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } },
  })
  if (!event) {
    res.status(404).json({ error: 'Event not found' })
    return
  }
  if (event._count.registrations >= event.capacity) {
    res.status(409).json({ error: 'Event is full' })
    return
  }

  try {
    const registration = await prisma.registration.create({ data: { userId, eventId } })
    res.status(201).json(registration)
  } catch {
    res.status(409).json({ error: 'Already registered' })
  }
})

router.delete('/events/:id/register', requireUser, async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id)
  const userId = req.userId!

  const registration = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  })
  if (!registration) {
    res.status(404).json({ error: 'Registration not found' })
    return
  }
  await prisma.registration.delete({ where: { userId_eventId: { userId, eventId } } })
  res.status(204).send()
})

router.get('/me/registrations', requireUser, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!
  const registrations = await prisma.registration.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { event: { date: 'asc' } },
  })
  res.json(registrations)
})

export default router
```

- [ ] **Step 3: Test events endpoint**

```bash
curl -s http://localhost:3001/api/events | jq
```

Expected: array of 3 seeded events with `_count.registrations`

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/events.ts server/src/routes/registrations.ts
git commit -m "feat: events and registrations endpoints"
```

---

## Task 6: Admin routes

**Files:**
- Modify: `server/src/routes/admin.ts`

- [ ] **Step 1: Implement admin routes**

```ts
// server/src/routes/admin.ts
import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import prisma from '../lib/prisma'
import { signAdminToken } from '../lib/jwt'
import { requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  },
})

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  date: z.string().datetime(),
  capacity: z.coerce.number().int().positive(),
})

router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const { email, password } = result.data
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  res.json({ token: signAdminToken(admin.id) })
})

router.get('/events', requireAdmin, async (_req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: 'asc' },
  })
  res.json(events)
})

router.post('/events', requireAdmin, async (req: AuthRequest, res: Response) => {
  const result = eventSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const event = await prisma.event.create({ data: { ...result.data, date: new Date(result.data.date) } })
  res.status(201).json(event)
})

router.put('/events/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const result = eventSchema.partial().safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const data = result.data
  const event = await prisma.event.update({
    where: { id },
    data: { ...data, ...(data.date ? { date: new Date(data.date) } : {}) },
  })
  res.json(event)
})

router.delete('/events/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  await prisma.registration.deleteMany({ where: { eventId: id } })
  await prisma.event.delete({ where: { id } })
  res.status(204).send()
})

router.get('/events/:id/participants', requireAdmin, async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id)
  const registrations = await prisma.registration.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  res.json(registrations)
})

router.post('/events/:id/image', requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }
  const imageUrl = `/uploads/${req.file.filename}`
  const event = await prisma.event.update({ where: { id }, data: { imageUrl } })
  res.json(event)
})

export default router
```

- [ ] **Step 2: Test admin login**

```bash
curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eventhub.pl","password":"admin123"}' | jq
```

Expected: `{ "token": "..." }`

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin.ts
git commit -m "feat: admin routes with CRUD, image upload, participants"
```

---

## Task 7: React app shell — AuthContext, routing, Navbar

**Files:**
- Modify: `client/src/main.tsx`
- Modify: `client/src/App.tsx`
- Create: `client/src/context/AuthContext.tsx`
- Create: `client/src/lib/api.ts`
- Create: `client/src/components/Navbar.tsx`
- Create: `client/src/components/PrivateRoute.tsx`
- Create: `client/src/components/AdminRoute.tsx`

- [ ] **Step 1: Write AuthContext**

```tsx
// client/src/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

interface User { id: number; name: string; email: string }
interface AuthState {
  token: string | null
  user: User | null
  role: 'user' | 'admin' | null
  login: (token: string, user: User, role: 'user' | 'admin') => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })
  const [role, setRole] = useState<'user' | 'admin' | null>(() =>
    localStorage.getItem('role') as 'user' | 'admin' | null
  )

  function login(token: string, user: User, role: 'user' | 'admin') {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('role', role)
    setToken(token)
    setUser(user)
    setRole(role)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    setToken(null)
    setUser(null)
    setRole(null)
  }

  return <AuthContext.Provider value={{ token, user, role, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Write api.ts**

```ts
// client/src/lib/api.ts
export async function apiFetch<T>(
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
```

- [ ] **Step 3: Write PrivateRoute and AdminRoute**

```tsx
// client/src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReactNode } from 'react'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, role } = useAuth()
  if (!token || role !== 'user') return <Navigate to="/login" replace />
  return <>{children}</>
}
```

```tsx
// client/src/components/AdminRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReactNode } from 'react'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { token, role } = useAuth()
  if (!token || role !== 'admin') return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 4: Write Navbar**

```tsx
// client/src/components/Navbar.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">EventHub</Link>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <span className="text-2xl">☰</span>
        </button>
        <ul className={`${open ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:static top-14 left-0 w-full md:w-auto bg-indigo-700 md:bg-transparent z-10 md:items-center gap-2 md:gap-4 px-4 md:px-0 py-4 md:py-0`}>
          <li><Link to="/events" className="hover:underline" onClick={() => setOpen(false)}>Wydarzenia</Link></li>
          {user && role === 'user' && (
            <li><Link to="/my-registrations" className="hover:underline" onClick={() => setOpen(false)}>Moje zapisy</Link></li>
          )}
          {!user && (
            <>
              <li><Link to="/login" className="hover:underline" onClick={() => setOpen(false)}>Logowanie</Link></li>
              <li><Link to="/register" className="hover:underline" onClick={() => setOpen(false)}>Rejestracja</Link></li>
            </>
          )}
          {user && (
            <li><button onClick={handleLogout} className="hover:underline">Wyloguj ({user.name})</button></li>
          )}
        </ul>
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: Write App.tsx with all routes**

```tsx
// client/src/App.tsx
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
          <Route path="*" element={
            <>
              <Navbar />
              <main className="max-w-6xl mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/events" element={<EventList />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/my-registrations" element={<PrivateRoute><MyRegistrations /></PrivateRoute>} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Update main.tsx**

```tsx
// client/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 7: Create stub page files so app compiles**

Create each with a minimal placeholder:

`client/src/pages/Home.tsx`:
```tsx
export default function Home() { return <div>Home</div> }
```

Repeat for: `EventList.tsx`, `EventDetail.tsx`, `Login.tsx`, `Register.tsx`, `MyRegistrations.tsx`, `admin/AdminLogin.tsx`, `admin/AdminLayout.tsx`, `admin/AdminEvents.tsx`, `admin/AdminEventForm.tsx`, `admin/AdminParticipants.tsx`

For `admin/AdminLayout.tsx` use:
```tsx
import { Outlet } from 'react-router-dom'
export default function AdminLayout() { return <Outlet /> }
```

- [ ] **Step 8: Verify client compiles**

```bash
cd client && npm run dev
```

Expected: no TypeScript errors, app loads at http://localhost:5173

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: react app shell with auth context, routing, navbar"
```

---

## Task 8: Public pages — Home, EventList, EventDetail

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/pages/EventList.tsx`
- Modify: `client/src/pages/EventDetail.tsx`
- Create: `client/src/components/EventCard.tsx`

- [ ] **Step 1: Write EventCard component**

```tsx
// client/src/components/EventCard.tsx
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
        <div className="w-full h-48 bg-indigo-100 flex items-center justify-center text-indigo-400 text-5xl">📅</div>
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
```

- [ ] **Step 2: Write Home page**

```tsx
// client/src/pages/Home.tsx
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
```

- [ ] **Step 3: Write EventList page**

```tsx
// client/src/pages/EventList.tsx
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

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (date) params.set('date', new Date(date).toISOString())
    apiFetch<Event[]>(`/api/events?${params}`).then(setEvents).catch(console.error)
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
          <button onClick={() => { setSearch(''); setDate('') }} className="text-sm text-gray-500 hover:text-gray-700">
            Wyczyść
          </button>
        )}
      </div>
      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Brak wydarzeń</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write EventDetail page**

```tsx
// client/src/pages/EventDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface Event {
  id: number; title: string; description: string; location: string
  date: string; capacity: number; imageUrl?: string | null
  _count: { registrations: number }
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { token, role } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<Event>(`/api/events/${id}`).then(setEvent).catch(() => navigate('/events'))
    if (token && role === 'user') {
      apiFetch<{ event: Event }[]>('/api/me/registrations', { token })
        .then(regs => setRegistered(regs.some(r => r.event.id === Number(id))))
        .catch(console.error)
    }
  }, [id, token, role, navigate])

  async function handleRegister() {
    if (!token) { navigate('/login'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(`/api/events/${id}/register`, { method: 'POST', token })
      setRegistered(true)
      setEvent(e => e ? { ...e, _count: { registrations: e._count.registrations + 1 } } : e)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd')
    } finally { setLoading(false) }
  }

  async function handleUnregister() {
    setLoading(true); setError('')
    try {
      await apiFetch(`/api/events/${id}/register`, { method: 'DELETE', token: token! })
      setRegistered(false)
      setEvent(e => e ? { ...e, _count: { registrations: e._count.registrations - 1 } } : e)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd')
    } finally { setLoading(false) }
  }

  if (!event) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>

  const spotsLeft = event.capacity - event._count.registrations
  const isFull = spotsLeft <= 0

  return (
    <div className="max-w-2xl mx-auto">
      {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
      <p className="text-gray-500 mb-1">{new Date(event.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <p className="text-gray-500 mb-4">{event.location}</p>
      <p className="text-gray-700 mb-6">{event.description}</p>
      <p className={`font-medium mb-4 ${isFull ? 'text-red-500' : 'text-green-600'}`}>
        {isFull ? 'Brak wolnych miejsc' : `Wolne miejsca: ${spotsLeft} / ${event.capacity}`}
      </p>
      {error && <p className="text-red-500 mb-3">{error}</p>}
      {role === 'user' && (
        registered ? (
          <button onClick={handleUnregister} disabled={loading} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50">
            {loading ? 'Anulowanie...' : 'Wypisz się'}
          </button>
        ) : (
          <button onClick={handleRegister} disabled={loading || isFull} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Zapisywanie...' : 'Zapisz się'}
          </button>
        )
      )}
      {!token && !isFull && (
        <Link to="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Zaloguj się, aby zapisać
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify pages render**

Open http://localhost:5173 — home page shows events. http://localhost:5173/events — list with filters. Click an event — detail page loads.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: home, event list, and event detail pages"
```

---

## Task 9: Auth pages — Login, Register, MyRegistrations

**Files:**
- Modify: `client/src/pages/Login.tsx`
- Modify: `client/src/pages/Register.tsx`
- Modify: `client/src/pages/MyRegistrations.tsx`

- [ ] **Step 1: Write Login page**

```tsx
// client/src/pages/Login.tsx
import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await apiFetch<{ token: string; user: { id: number; name: string; email: string } }>(
        '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
      )
      login(data.token, data.user, 'user')
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd logowania')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Logowanie</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
        <p className="text-sm text-gray-500 text-center">Nie masz konta? <Link to="/register" className="text-indigo-600 hover:underline">Zarejestruj się</Link></p>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Write Register page**

```tsx
// client/src/pages/Register.tsx
import { useState, FormEvent } from 'react'
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
```

- [ ] **Step 3: Write MyRegistrations page**

```tsx
// client/src/pages/MyRegistrations.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface Registration {
  id: number
  event: { id: number; title: string; date: string; location: string }
}

export default function MyRegistrations() {
  const { token } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Registration[]>('/api/me/registrations', { token: token! })
      .then(setRegistrations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  async function handleUnregister(eventId: number) {
    await apiFetch(`/api/events/${eventId}/register`, { method: 'DELETE', token: token! })
    setRegistrations(r => r.filter(reg => reg.event.id !== eventId))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Moje zapisy</h1>
      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nie jesteś zapisany na żadne wydarzenie.</p>
          <Link to="/events" className="text-indigo-600 hover:underline">Przeglądaj wydarzenia</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {registrations.map(reg => (
            <li key={reg.id} className="bg-white shadow rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <Link to={`/events/${reg.event.id}`} className="font-semibold text-gray-800 hover:text-indigo-600">{reg.event.title}</Link>
                <p className="text-sm text-gray-500">{new Date(reg.event.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-sm text-gray-500">{reg.event.location}</p>
              </div>
              <button onClick={() => handleUnregister(reg.event.id)} className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0">
                Wypisz się
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify register and login flows**

1. Go to http://localhost:5173/register — fill form, submit → redirected to home, navbar shows name
2. Click logout → navbar shows login/register
3. Go to http://localhost:5173/login — log back in → success

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: login, register, and my-registrations pages"
```

---

## Task 10: Admin panel pages

**Files:**
- Modify: `client/src/pages/admin/AdminLogin.tsx`
- Modify: `client/src/pages/admin/AdminLayout.tsx`
- Modify: `client/src/pages/admin/AdminEvents.tsx`
- Modify: `client/src/pages/admin/AdminEventForm.tsx`
- Modify: `client/src/pages/admin/AdminParticipants.tsx`

- [ ] **Step 1: Write AdminLogin**

```tsx
// client/src/pages/admin/AdminLogin.tsx
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await apiFetch<{ token: string }>('/api/admin/login', {
        method: 'POST', body: JSON.stringify({ email, password })
      })
      login(data.token, { id: 0, name: 'Admin', email }, 'admin')
      navigate('/admin/events')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd logowania')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Panel Administratora</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write AdminLayout**

```tsx
// client/src/pages/admin/AdminLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/admin/login') }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-indigo-800 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 font-bold text-xl border-b border-indigo-700">EventHub Admin</div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/admin/events" className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-indigo-700'}`}>
            Wydarzenia
          </NavLink>
        </nav>
        <div className="px-3 py-4 border-t border-indigo-700">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-700 rounded-lg">
            Wyloguj
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Write AdminEvents**

```tsx
// client/src/pages/admin/AdminEvents.tsx
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

  useEffect(() => {
    apiFetch<Event[]>('/api/admin/events', { token: token! }).then(setEvents).catch(console.error)
  }, [token])

  async function handleDelete(id: number) {
    if (!confirm('Usunąć wydarzenie?')) return
    await apiFetch(`/api/admin/events/${id}`, { method: 'DELETE', token: token! })
    setEvents(e => e.filter(ev => ev.id !== id))
  }

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
                  <button onClick={() => navigate(`/admin/events/${ev.id}/participants`)} className="text-indigo-600 hover:underline">Uczestnicy</button>
                  <button onClick={() => navigate(`/admin/events/${ev.id}/edit`)} className="text-yellow-600 hover:underline">Edytuj</button>
                  <button onClick={() => handleDelete(ev.id)} className="text-red-500 hover:underline">Usuń</button>
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
```

- [ ] **Step 4: Write AdminEventForm (create + edit)**

```tsx
// client/src/pages/admin/AdminEventForm.tsx
import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
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
      setCurrentImage(ev.imageUrl || null)
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
      setError(e instanceof Error ? e.message : 'Błąd')
    } finally { setLoading(false) }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setImageFile(e.target.files?.[0] || null)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {['title', 'location'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field === 'title' ? 'Tytuł' : 'Lokalizacja'}</label>
            <input type="text" value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        ))}
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
```

- [ ] **Step 5: Write AdminParticipants**

```tsx
// client/src/pages/admin/AdminParticipants.tsx
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

  useEffect(() => {
    apiFetch<Participant[]>(`/api/admin/events/${id}/participants`, { token: token! })
      .then(setParticipants)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, token])

  if (loading) return <div className="text-center py-20 text-gray-400">Ładowanie...</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/events" className="text-indigo-600 hover:underline text-sm">← Powrót</Link>
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
```

- [ ] **Step 6: Verify admin panel**

1. Go to http://localhost:5173/admin/login — log in with `admin@eventhub.pl` / `admin123`
2. See events table at `/admin/events`
3. Create a new event via `/admin/events/new`
4. Edit the event, upload an image
5. View participants list

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: admin panel pages (events CRUD, image upload, participants)"
```

---

## Task 11: Final polish + README update

**Files:**
- Modify: `README.md`
- Create: `client/src/pages/NotFound.tsx`

- [ ] **Step 1: Add 404 page**

```tsx
// client/src/pages/NotFound.tsx
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
```

Add `<Route path="*" element={<NotFound />} />` inside the inner Routes in `App.tsx` (after the `/my-registrations` route, inside the wildcard route's inner Routes).

- [ ] **Step 2: Add .gitignore entries**

Ensure `server/.gitignore` contains:
```
node_modules/
dist/
prisma/dev.db
prisma/dev.db-journal
uploads/*
!uploads/.gitkeep
```

Create `server/uploads/.gitkeep` (empty file).

- [ ] **Step 3: Update README.md**

Replace the full README with:

```markdown
# EventHub

Aplikacja webowa do tworzenia wydarzeń i zarządzania zapisami uczestników.

## Technologie

**Frontend:** React 18, TypeScript, Tailwind CSS, Vite, React Router v6  
**Backend:** Node.js, Express, TypeScript, Prisma ORM  
**Baza danych:** SQLite (plik lokalny, bez dodatkowej instalacji)

## Uruchomienie lokalne

### Wymagania

- Node.js >= 18
- npm >= 9

### Kroki

```bash
# 1. Sklonuj repozytorium
git clone <url-repozytorium>
cd eventhub

# 2. Zainstaluj zależności root
npm install

# 3. Zainstaluj zależności klienta
cd client && npm install && cd ..

# 4. Zainstaluj zależności serwera i przygotuj bazę
cd server && npm install
npx prisma migrate dev --name init
npm run seed
cd ..

# 5. Uruchom aplikację
npm run dev
```

Aplikacja dostępna pod:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Dane logowania

| Rola | Email | Hasło |
|------|-------|-------|
| Administrator | admin@eventhub.pl | admin123 |

Konto uczestnika należy zarejestrować przez formularz rejestracji.

## Struktura projektu

```
eventhub/
├── client/          # React + TypeScript + Tailwind (Vite)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
├── server/          # Express + TypeScript + Prisma
│   ├── prisma/      # schema.prisma, seed.ts, dev.db
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   └── routes/
│   └── uploads/     # przesłane obrazki
├── docs/            # dokumentacja i specyfikacje
└── README.md
```
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: 404 page, gitignore, updated README"
```

---

## Self-Review

**Spec coverage check:**
- Public event browsing (GET /api/events, EventList, Home) — covered in Tasks 5, 8
- User registration/login (POST /api/auth/register+login) — covered in Tasks 4, 9
- Event registration/unregistration — covered in Tasks 5, 8 (EventDetail), 9 (MyRegistrations)
- Admin panel with auth — covered in Tasks 6, 10
- Full event CRUD — covered in Tasks 6, 10
- Image upload — covered in Task 6 (route), Task 10 (AdminEventForm)
- Participant list — covered in Tasks 6, 10
- Filtering events — covered in Tasks 5, 8 (EventList)
- Responsive design (Tailwind RWD) — covered throughout Tasks 7–10
- Auth middleware (requireUser, requireAdmin) — Task 3
- JWT with separate secrets — Task 3
- Zod validation — Tasks 4, 6
- bcrypt hashing — Tasks 4, 6
- Seed admin account — Task 2

All spec requirements covered. No gaps found.
