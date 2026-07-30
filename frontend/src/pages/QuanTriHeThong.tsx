import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock, UserPlus, Pencil, KeyRound } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import {
  listComplaints,
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserLock,
  getConfig,
  updateConfig,
  ApiError,
} from '@/api/client'
import { UserFormModal, type UserFormValues } from '@/components/UserFormModal'
import { Reveal } from '@/components/Reveal'
import { ROLE_LABELS, ROLE_BADGE_COLORS, STATUS_LABELS, type Role, type User } from '@/types/domain'

export function QuanTriHeThong() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const queryClient = useQueryClient()

  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'locked'>('ALL')
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: configData } = useQuery({ queryKey: ['system-config'], queryFn: getConfig })
  const [hanXuLy, setHanXuLyState] = useState(30)
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    if (configData) setHanXuLyState(configData.hanXuLyMacDinh)
  }, [configData])

  const usersQueryKey = ['users', currentUser?.id, roleFilter, statusFilter, search] as const

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: usersQueryKey,
    queryFn: () =>
      listUsers({
        currentUser: currentUser!,
        role: roleFilter,
        daKhoa: statusFilter === 'ALL' ? 'ALL' : statusFilter === 'locked',
        search,
      }),
    enabled: !!currentUser,
  })

  const lockMutation = useMutation({
    mutationFn: ({ id, daKhoa }: { id: string; daKhoa: boolean }) => toggleUserLock(id, daKhoa, currentUser!),
    onMutate: async ({ id, daKhoa }) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKey })
      const previous = queryClient.getQueryData<User[]>(usersQueryKey)
      queryClient.setQueryData<User[]>(usersQueryKey, (old) => old?.map((u) => (u.id === id ? { ...u, daKhoa } : u)) ?? old)
      return { previous }
    },
    onError: (e, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(usersQueryKey, context.previous)
      toast.error(e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    },
    onSuccess: (_data, { daKhoa }) => {
      toast.success(daKhoa ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const { data } = useQuery({
    queryKey: ['audit-log', currentUser?.id],
    queryFn: () => listComplaints({ currentUser: currentUser!, page: 1, pageSize: 500 }),
    enabled: !!currentUser,
  })

  const auditLog = useMemo(() => {
    const all = (data?.items ?? []).flatMap((c) => c.lichSu.map((h) => ({ ...h, maSo: c.maSo })))
    return all.sort((a, b) => (a.thoiDiem < b.thoiDiem ? 1 : -1)).slice(0, 30)
  }, [data])

  async function handleFormSubmit(values: UserFormValues) {
    if (!currentUser) return
    setSubmitting(true)
    setFormError(null)
    try {
      if (modalMode === 'create') {
        await createUser(
          {
            hoTen: values.hoTen,
            email: values.email,
            tenDangNhap: values.tenDangNhap,
            soDienThoai: values.soDienThoai,
            role: values.role,
            phongBan: values.phongBan,
            chucVu: values.chucVu,
            matKhau: values.matKhau,
          },
          currentUser,
        )
        toast.success('Đã tạo tài khoản mới.')
      } else if (editingUser) {
        await updateUser(
          editingUser.id,
          {
            hoTen: values.hoTen,
            email: values.email,
            soDienThoai: values.soDienThoai,
            role: values.role,
            phongBan: values.phongBan,
            chucVu: values.chucVu,
          },
          currentUser,
        )
        if (values.daKhoa !== editingUser.daKhoa) {
          await toggleUserLock(editingUser.id, values.daKhoa, currentUser)
        }
        toast.success('Đã cập nhật tài khoản.')
      }
      setModalMode(null)
      setEditingUser(null)
      refetchUsers()
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleLock(u: User) {
    if (!currentUser) return
    const willLock = !u.daKhoa
    const ok = await confirm({
      title: willLock ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: willLock
        ? `Xác nhận khóa tài khoản "${u.hoTen}"? Người dùng sẽ không thể đăng nhập cho tới khi được mở khóa lại.`
        : `Xác nhận mở khóa tài khoản "${u.hoTen}"?`,
      confirmLabel: willLock ? 'Khóa' : 'Mở khóa',
      danger: willLock,
    })
    if (!ok) return
    lockMutation.mutate({ id: u.id, daKhoa: willLock })
  }

  async function handleResetPassword(u: User) {
    if (!currentUser) return
    const ok = await confirm({
      title: 'Reset mật khẩu',
      message: `Xác nhận đặt lại mật khẩu cho tài khoản "${u.hoTen}"? Mật khẩu mới sẽ được hiển thị 1 lần duy nhất.`,
      confirmLabel: 'Reset mật khẩu',
      danger: true,
    })
    if (!ok) return
    try {
      const { newPassword } = await resetUserPassword(u.id, currentUser)
      toast.success(`Mật khẩu mới của "${u.hoTen}": ${newPassword}`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    }
  }

  async function handleSaveHanXuLy(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updateConfig(hanXuLy)
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast.success('Đã lưu cấu hình.')
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Reveal>
        <h1 className="text-xl font-bold text-gray-800">Quản trị hệ thống</h1>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700">Quản lý người dùng</h2>
            <button
              onClick={() => {
                setModalMode('create')
                setEditingUser(null)
                setFormError(null)
              }}
              className="flex min-h-9 items-center gap-1 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-dark"
            >
              <UserPlus className="size-4" /> Thêm người dùng
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
              <option value="ALL">Tất cả vai trò</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên/email/tên đăng nhập..."
              className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Họ và tên</th>
                  <th className="px-3 py-3">Email / Tên đăng nhập</th>
                  <th className="px-3 py-3">Số điện thoại</th>
                  <th className="px-3 py-3">Vai trò</th>
                  <th className="px-3 py-3">Phòng ban / Chức vụ</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">{u.hoTen}</td>
                    <td className="px-3 py-3">
                      <p className="text-gray-700">{u.email}</p>
                      <p className="text-xs text-gray-400">@{u.tenDangNhap}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{u.soDienThoai || '—'}</td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ color: ROLE_BADGE_COLORS[u.role], backgroundColor: ROLE_BADGE_COLORS[u.role] + '1a' }}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      <p>{u.phongBan || '—'}</p>
                      <p className="text-xs text-gray-400">{u.chucVu || ''}</p>
                    </td>
                    <td className="px-3 py-3">
                      {u.daKhoa ? (
                        <span className="rounded-full bg-accent-red/10 px-2 py-0.5 text-xs text-accent-red">Bị khóa</span>
                      ) : (
                        <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs text-brand-green">Hoạt động</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-nowrap gap-2">
                        <button
                          onClick={() => {
                            setModalMode('edit')
                            setEditingUser(u)
                            setFormError(null)
                          }}
                          className="flex min-h-9 items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
                        >
                          <Pencil className="size-3.5" /> Sửa
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="flex min-h-9 items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
                        >
                          <KeyRound className="size-3.5" /> Reset MK
                        </button>
                        <button
                          onClick={() => handleToggleLock(u)}
                          className="flex min-h-9 items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
                        >
                          {u.daKhoa ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                          {u.daKhoa ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Cấu hình hạn xử lý mặc định</h2>
          <form onSubmit={handleSaveHanXuLy} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Số ngày xử lý mặc định cho đơn mới</label>
              <input
                type="number"
                min={1}
                value={hanXuLy}
                onChange={(e) => setHanXuLyState(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
            <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
              Lưu cấu hình
            </button>
            {savedMsg && <span className="text-sm text-brand-green">Đã lưu.</span>}
          </form>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Nhật ký hành động</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Thời điểm</th>
                  <th className="px-3 py-3">Mã đơn</th>
                  <th className="px-3 py-3">Người thực hiện</th>
                  <th className="px-3 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLog.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-500">{new Date(h.thoiDiem).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-3 font-medium text-primary">{h.maSo}</td>
                    <td className="px-3 py-3">
                      {h.nguoiThucHien} ({ROLE_LABELS[h.role]})
                    </td>
                    <td className="px-3 py-3 text-gray-600">→ {STATUS_LABELS[h.trangThaiSau]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {modalMode && (
        <UserFormModal
          mode={modalMode}
          initialValues={editingUser ?? undefined}
          onClose={() => {
            setModalMode(null)
            setEditingUser(null)
          }}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          error={formError}
        />
      )}
    </div>
  )
}
