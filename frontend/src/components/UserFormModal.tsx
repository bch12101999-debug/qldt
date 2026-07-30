import { useState } from 'react'
import { X, Shuffle } from 'lucide-react'
import { ROLE_LABELS, type Role, type User } from '@/types/domain'

function suggestPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export interface UserFormValues {
  hoTen: string
  email: string
  soDienThoai: string
  tenDangNhap: string
  matKhau: string
  role: Role
  phongBan: string
  chucVu: string
  daKhoa: boolean
}

interface UserFormModalProps {
  mode: 'create' | 'edit'
  initialValues?: User
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
  submitting?: boolean
  error?: string | null
}

export function UserFormModal({ mode, initialValues, onClose, onSubmit, submitting, error }: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>({
    hoTen: initialValues?.hoTen ?? '',
    email: initialValues?.email ?? '',
    soDienThoai: initialValues?.soDienThoai ?? '',
    tenDangNhap: initialValues?.tenDangNhap ?? '',
    matKhau: '',
    role: initialValues?.role ?? 'CHUYEN_VIEN',
    phongBan: initialValues?.phongBan ?? '',
    chucVu: initialValues?.chucVu ?? '',
    daKhoa: initialValues?.daKhoa ?? false,
  })

  function set<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">{mode === 'create' ? 'Tạo tài khoản mới' : 'Sửa thông tin tài khoản'}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100" aria-label="Đóng">
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(values)
          }}
          className="flex max-h-[75vh] flex-col gap-3 overflow-y-auto px-5 py-4"
        >
          {error && <p className="rounded-md bg-accent-red/10 px-3 py-2 text-sm text-accent-red">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-gray-600">Họ và tên *</label>
            <input required value={values.hoTen} onChange={(e) => set('hoTen', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Email *</label>
              <input type="email" required value={values.email} onChange={(e) => set('email', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Số điện thoại</label>
              <input value={values.soDienThoai} onChange={(e) => set('soDienThoai', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Tên đăng nhập {mode === 'create' && '*'}</label>
            <input
              required={mode === 'create'}
              value={values.tenDangNhap}
              onChange={(e) => set('tenDangNhap', e.target.value)}
              placeholder="Mặc định theo email"
              disabled={mode === 'edit'}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          {mode === 'create' && (
            <div>
              <label className="mb-1 block text-sm text-gray-600">Mật khẩu *</label>
              <div className="flex gap-2">
                <input
                  required
                  value={values.matKhau}
                  onChange={(e) => set('matKhau', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => set('matKhau', suggestPassword())}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Shuffle className="size-3.5" /> Gợi ý
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Vai trò / Phân quyền *</label>
              <select value={values.role} onChange={(e) => set('role', e.target.value as Role)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Phòng ban</label>
              <input value={values.phongBan} onChange={(e) => set('phongBan', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Chức vụ</label>
            <input value={values.chucVu} onChange={(e) => set('chucVu', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          {mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={!values.daKhoa} onChange={(e) => set('daKhoa', !e.target.checked)} className="accent-primary" />
              Tài khoản đang hoạt động (bỏ chọn để khóa)
            </label>
          )}

          <div className="mt-2 flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
              {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
