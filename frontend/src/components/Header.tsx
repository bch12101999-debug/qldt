import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, LogOut, Menu, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLE_LABELS } from '@/types/domain'
import { listNotifications, markAllNotificationsRead } from '@/api/client'

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const queryClient = useQueryClient()
  const seenIds = useRef<Set<string> | null>(null)

  const { data } = useQuery({
    queryKey: ['notifications', currentUser?.id, 1, 20],
    queryFn: () => listNotifications(currentUser!.id, 1, 20),
    enabled: !!currentUser,
    refetchInterval: 30000,
  })
  const notifications = data?.items ?? []
  const unreadCount = notifications.filter((n) => !n.daDoc).length

  useEffect(() => {
    if (!notifications.length) return
    if (seenIds.current === null) {
      // Lần fetch đầu tiên trong phiên: ghi nhận nhưng không bắn notification (tránh spam khi mới đăng nhập)
      seenIds.current = new Set(notifications.map((n) => n.id))
      return
    }
    const unseen = notifications.filter((n) => !n.daDoc && !seenIds.current!.has(n.id))
    unseen.forEach((n) => {
      seenIds.current!.add(n.id)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const browserNotif = new Notification('Hệ thống Quản lý Khiếu nại, Tố cáo', {
          body: n.noiDung,
          icon: '/assets/logo-phuong-hiep-binh.png',
        })
        browserNotif.onclick = () => {
          window.focus()
          navigate(`/don-thu/${encodeURIComponent(n.complaintId)}`)
        }
      }
    })
    notifications.forEach((n) => seenIds.current!.add(n.id))
  }, [notifications, navigate])

  async function handleOpenNotif() {
    setShowNotif((v) => !v)
    if (!showNotif && unreadCount > 0 && currentUser) {
      await markAllNotificationsRead(currentUser.id)
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser.id] })
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-primary px-3 text-white shadow-sm sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="flex size-10 items-center justify-center rounded hover:bg-white/10 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </button>
        <img src="/assets/logo-phuong-hiep-binh.png" alt="Logo phường Hiệp Bình" className="size-8 rounded-full sm:size-9" />
        <div className="leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white sm:text-xs">
            Hệ thống Quản lý &amp; Giải quyết Khiếu nại, Tố cáo
          </p>
          <p className="hidden text-sm font-bold sm:block">Ủy ban nhân dân phường Hiệp Bình</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {currentUser && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
              <User className="size-4" />
            </span>
            <span className="text-sm">
              {currentUser.hoTen} <span className="text-white/70">({ROLE_LABELS[currentUser.role]})</span>
            </span>
          </div>
        )}
        <div className="relative">
          <button onClick={handleOpenNotif} className="relative flex size-10 items-center justify-center rounded hover:bg-white/10" aria-label="Thông báo">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent-red text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-black/5 bg-white text-gray-800 shadow-lg">
              <div className="border-b px-3 py-2 text-sm font-semibold">Thông báo</div>
              <ul className="max-h-72 overflow-y-auto">
                {notifications.length === 0 && <li className="px-3 py-4 text-center text-sm text-gray-400">Không có thông báo</li>}
                {notifications.map((n) => (
                  <li key={n.id} className="border-b px-3 py-2 text-sm last:border-0 hover:bg-gray-50">
                    {n.noiDung}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setShowNotif(false)
                  navigate('/thong-bao')
                }}
                className="block w-full border-t px-3 py-2 text-center text-sm font-medium text-primary hover:bg-gray-50"
              >
                Xem tất cả trong Trung tâm thông báo
              </button>
            </div>
          )}
        </div>
        <button onClick={logout} className="flex h-10 items-center gap-1 rounded bg-white/10 px-2.5 text-sm hover:bg-white/20" aria-label="Đăng xuất">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
