import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'

export interface JwtPayload {
  userId: string
  role: Role
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
