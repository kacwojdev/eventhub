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
