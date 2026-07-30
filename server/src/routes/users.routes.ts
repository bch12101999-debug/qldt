import { Router } from 'express'
import type { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole } from '../middlewares/auth'
import { hashPassword } from '../lib/auth'

export const usersRouter = Router()

const USER_SELECT = {
  id: true,
  hoTen: true,
  email: true,
  tenDangNhap: true,
  soDienThoai: true,
  chucVu: true,
  role: true,
  daKhoa: true,
  departmentId: true,
  department: { select: { ten: true } },
} as const

usersRouter.get('/', requireAuth, async (req, res) => {
  const { role, daKhoa, search } = req.query as Record<string, string | undefined>
  const users = await prisma.user.findMany({
    where: {
      role: role && role !== 'ALL' ? (role as Role) : undefined,
      daKhoa: daKhoa === 'ALL' || daKhoa === undefined ? undefined : daKhoa === 'true',
      ...(search?.trim()
        ? {
            OR: [
              { hoTen: { contains: search.trim(), mode: 'insensitive' } },
              { email: { contains: search.trim(), mode: 'insensitive' } },
              { tenDangNhap: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: USER_SELECT,
    orderBy: { hoTen: 'asc' },
  })
  res.json(users)
})

usersRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { hoTen, email, matKhau, role, departmentId, soDienThoai, chucVu } = req.body ?? {}
  let { tenDangNhap } = req.body ?? {}
  if (!hoTen || !email || !matKhau || !role) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' })
  }
  tenDangNhap = tenDangNhap?.trim() || email.split('@')[0]

  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(400).json({ message: 'Email đã tồn tại' })
  }
  if (await prisma.user.findUnique({ where: { tenDangNhap } })) {
    return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' })
  }

  const passwordHash = await hashPassword(matKhau)
  const user = await prisma.user.create({
    data: { hoTen, email, tenDangNhap, soDienThoai, chucVu, passwordHash, role, departmentId: departmentId || undefined },
    select: USER_SELECT,
  })
  res.status(201).json(user)
})

usersRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { hoTen, email, soDienThoai, role, departmentId, chucVu } = req.body ?? {}
  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { hoTen, email, soDienThoai, role, departmentId: departmentId || undefined, chucVu },
    select: USER_SELECT,
  })
  res.json(user)
})

usersRouter.patch('/:id/lock', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { daKhoa } = req.body ?? {}
  const user = await prisma.user.update({ where: { id: String(req.params.id) }, data: { daKhoa: !!daKhoa }, select: USER_SELECT })
  res.json(user)
})

usersRouter.post('/:id/reset-password', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const newPassword = Math.random().toString(36).slice(-10)
  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: String(req.params.id) }, data: { passwordHash } })
  res.json({ newPassword })
})
