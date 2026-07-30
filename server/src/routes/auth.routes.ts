import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { comparePassword, signToken } from '../lib/auth'
import { requireAuth } from '../middlewares/auth'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không hợp lệ' })
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { department: true } })
  if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' })
  if (user.daKhoa) return res.status(403).json({ message: 'Tài khoản đã bị khóa' })

  const ok = await comparePassword(parsed.data.password, user.passwordHash)
  if (!ok) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' })

  const token = signToken({ userId: user.id, role: user.role })
  const { passwordHash: _passwordHash, ...safeUser } = user
  res.json({ token, user: safeUser })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { department: true } })
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' })
  const { passwordHash: _passwordHash, ...safeUser } = user
  res.json(safeUser)
})
