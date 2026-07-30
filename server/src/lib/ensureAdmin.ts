import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@hiepbinh.gov.vn'
  const password = process.env.ADMIN_PASSWORD || '123456'
  const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true'

  const existing = await prisma.user.findUnique({ where: { email } })
  const passwordHash = await bcrypt.hash(password, 10)

  if (!existing) {
    const tenDangNhap = email.split('@')[0]
    await prisma.user.create({
      data: {
        hoTen: 'Quản trị viên hệ thống',
        email,
        tenDangNhap,
        chucVu: 'Quản trị hệ thống',
        role: 'ADMIN',
        passwordHash,
      },
    })
    console.log(`[ensure-admin] Đã tạo tài khoản admin: ${email}`)
    return
  }

  if (existing.role !== 'ADMIN' || existing.daKhoa || resetPassword) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        daKhoa: false,
        ...(resetPassword ? { passwordHash } : {}),
      },
    })
    console.log(`[ensure-admin] Đã cập nhật tài khoản "${email}" thành ADMIN, mở khóa${resetPassword ? ', đặt lại mật khẩu' : ''}.`)
  } else {
    console.log(`[ensure-admin] Tài khoản admin "${email}" đã sẵn sàng.`)
  }
}
