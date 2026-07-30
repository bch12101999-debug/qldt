import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole } from '../middlewares/auth'

export const configRouter = Router()

configRouter.get('/', requireAuth, async (_req, res) => {
  const config = await prisma.systemConfig.findFirst()
  res.json(config ?? { hanXuLyMacDinh: 30 })
})

configRouter.put('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { hanXuLyMacDinh } = req.body ?? {}
  if (typeof hanXuLyMacDinh !== 'number' || hanXuLyMacDinh < 1) {
    return res.status(400).json({ message: 'Số ngày xử lý mặc định không hợp lệ' })
  }
  const existing = await prisma.systemConfig.findFirst()
  const config = existing
    ? await prisma.systemConfig.update({ where: { id: existing.id }, data: { hanXuLyMacDinh } })
    : await prisma.systemConfig.create({ data: { hanXuLyMacDinh } })
  res.json(config)
})
