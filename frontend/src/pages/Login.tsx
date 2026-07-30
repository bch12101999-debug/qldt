import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/api/client'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-bg-page lg:flex-row">
      {/* Cột trái: banner thương hiệu */}
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-primary px-6 py-10 lg:min-h-svh lg:w-1/2 lg:px-12">
        <svg className="pointer-events-none absolute inset-0 size-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="motif" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="1.5" />
              <circle cx="60" cy="60" r="38" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="60" cy="60" r="24" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="60" cy="60" r="3" fill="white" />
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * Math.PI) / 6
                const x = 60 + 52 * Math.cos(angle)
                const y = 60 + 52 * Math.sin(angle)
                return <circle key={i} cx={x} cy={y} r="2" fill="white" />
              })}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#motif)" />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex max-w-sm flex-col items-center text-center text-white"
        >
          <div className="mb-4 flex size-24 items-center justify-center rounded-2xl bg-white shadow-lg">
            <img src="/assets/logo-phuong-hiep-binh.png" alt="Logo phường Hiệp Bình" className="size-16 rounded-full" />
          </div>
          <h1 className="text-lg font-bold uppercase tracking-wide text-amber-300 sm:text-xl">Hệ thống Quản lý &amp; Giải quyết Khiếu nại, Tố cáo</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-white">Ủy ban nhân dân phường Hiệp Bình</p>
        </motion.div>
      </div>

      {/* Cột phải: form đăng nhập */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm rounded-xl bg-bg-card p-6 shadow-lg sm:p-8"
        >
          <h2 className="mb-1 border-b-2 border-accent-red pb-3 text-lg font-bold text-accent-red">Đăng nhập hệ thống</h2>
          <p className="mb-6 mt-3 text-sm text-gray-500">Nhập tài khoản được cấp để truy cập hệ thống.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <Mail className="size-4 shrink-0 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@hiepbinh.gov.vn"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <Lock className="size-4 shrink-0 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-md bg-accent-red/10 px-3 py-2 text-sm text-accent-red">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
