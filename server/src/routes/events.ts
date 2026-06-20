import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/events', async (req: Request, res: Response) => {
  const { search, date } = req.query
  try {
    const events = await prisma.event.findMany({
      where: {
        ...(search ? { title: { contains: String(search) } } : {}),
        ...(date ? { date: { gte: new Date(String(date)) } } : {}),
      },
      include: { _count: { select: { registrations: true } } },
      orderBy: { date: 'asc' },
    })
    res.json(events)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/events/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    })
    if (!event) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.json(event)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
