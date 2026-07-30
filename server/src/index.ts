import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'

import { authRouter } from './routes/auth.routes'
import { complaintsRouter } from './routes/complaints.routes'
import { usersRouter } from './routes/users.routes'
import { notificationsRouter } from './routes/notifications.routes'
import { configRouter } from './routes/config.routes'
import { uploadDir } from './middlewares/upload'
import { ensureAdmin } from './lib/ensureAdmin'

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }),
)

app.use(express.json())

// Phục vụ file upload
app.use('/api/uploads', express.static(uploadDir))

// Kiểm tra backend
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Tạm thời dùng để kiểm tra thư mục upload trên container
app.get('/api/debug/uploads', (_req, res) => {
  const exists = fs.existsSync(uploadDir)
  const files = exists ? fs.readdirSync(uploadDir) : []

  res.json({
    uploadDir,
    exists,
    fileCount: files.length,
    files,
  })
})

// Trả file rõ ràng và báo lỗi cụ thể nếu file không tồn tại
app.get('/api/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename)
  const filePath = path.join(uploadDir, filename)
  const exists = fs.existsSync(filePath)

  console.log('[uploads]', {
    uploadDir,
    filename,
    filePath,
    exists,
  })

  if (!exists) {
    return res.status(404).json({
      message: 'File không tồn tại trên máy chủ',
      filename,
      uploadDir,
    })
  }

  return res.sendFile(filePath)
})

app.use('/api/auth', authRouter)
app.use('/api/complaints', complaintsRouter)
app.use('/api/users', usersRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/config', configRouter)

app.use((req, res) => {
  res.status(404).json({
    message: `Không tìm thấy route ${req.method} ${req.path}`,
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)

    res.status(500).json({
      message: err.message || 'Lỗi máy chủ nội bộ',
    })
  },
)

const PORT = Number(process.env.PORT) || 4000
const HOST = '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`Server đang chạy tại http://${HOST}:${PORT}`)
  console.log(`UPLOAD_DIR = ${uploadDir}`)
})

ensureAdmin().catch((err) => {
  console.error(
    '[ensure-admin] Bỏ qua do lỗi (DB có thể chưa sẵn sàng):',
    err.message,
  )
})
