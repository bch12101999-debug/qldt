import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png']

function decodeOriginalName(originalName: string): string {
  return Buffer.from(originalName, 'latin1').toString('utf8')
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),

  filename: (_req, file, cb) => {
    const decodedName = decodeOriginalName(file.originalname)
    const ext = path.extname(decodedName).toLowerCase()

    // Sửa lại originalname để các route lưu đúng tên tiếng Việt vào database
    file.originalname = decodedName

    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const decodedName = decodeOriginalName(file.originalname)
    const ext = path.extname(decodedName).toLowerCase()

    if (!ALLOWED_EXT.includes(ext)) {
      cb(new Error('Chỉ chấp nhận file PDF, JPG hoặc PNG'))
      return
    }

    cb(null, true)
  },
})

export { uploadDir }
