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
