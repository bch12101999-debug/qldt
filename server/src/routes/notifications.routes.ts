import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'

export const notificationsRouter = Router()

notificationsRouter.get('/', requireAuth, async (req, res) => {
  const { page = '1', pageSize = '20' } = req.query as Record<string, string>
  const p = Number(page) || 1
  const ps = Number(pageSize) || 20

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { thoiDiem: 'desc' },
      skip: (p - 1) * ps,
      take: ps,
    }),
    prisma.notification.count({ where: { userId: req.user!.userId } }),
  ])

  res.json({ items, total })
})

notificationsRouter.post('/mark-all-read', requireAuth, async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId, daDoc: false }, data: { daDoc: true } })
  res.json({ ok: true })
})

notificationsRouter.post('/:id/mark-read', requireAuth, async (req, res) => {
  await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: req.user!.userId }, data: { daDoc: true } })
  res.json({ ok: true })
})
