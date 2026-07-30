import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, FilePlus2, ListChecks, ClipboardList, Search, Bell, ShieldCheck, X, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { listComplaints, listNotifications } from '@/api/client'
import { canAct } from '@/lib/workflow'
import type { Role } from '@/types/domain'
import clsx from 'clsx'

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] | null; badge?: 'cho-xu-ly' | 'thong-bao' }[] = [
  { to: '/', label: 'Trang chủ', icon: LayoutDashboard, roles: null },
  { to: '/don-thu/tao-moi', label: 'Tạo đơn mới', icon: FilePlus2, roles: ['VAN_THU', 'ADMIN'] },
  { to: '/don-thu', label: 'Danh sách đơn', icon: ListChecks, roles: null },
  { to: '/don-thu/cho-xu-ly', label: 'Đơn chờ xử lý', icon: ClipboardList, roles: null, badge: 'cho-xu-ly' },
  { to: '/tra-cuu', label: 'Tra cứu', icon: Search, roles: null },
  { to: '/thong-bao', label: 'Thông báo', icon: Bell, roles: null, badge: 'thong-bao' },
  { to: '/quan-tri', label: 'Quản trị hệ thống', icon: ShieldCheck, roles: ['ADMIN'] },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const COLLAPSE_KEY = 'hiepbinh_sidebar_collapsed'

export function Sidebar({ open, onClose }: SidebarProps) {
  const { currentUser } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  const { data } = useQuery({
    queryKey: ['cho-xu-ly-complaints', currentUser?.id],
    queryFn: () => listComplaints({ currentUser: currentUser!, page: 1, pageSize: 1000 }),
    enabled: !!currentUser,
  })
  const choXuLyCount = currentUser ? (data?.items ?? []).filter((c) => canAct(c, currentUser.id, currentUser.role)).length : 0

  const { data: notifData } = useQuery({
    queryKey: ['notifications', currentUser?.id, 1, 20],
    queryFn: () => listNotifications(currentUser!.id, 1, 20),
    enabled: !!currentUser,
    refetchInterval: 30000,
  })
  const unreadCount = (notifData?.items ?? []).filter((n) => !n.daDoc).length

  const items = navItems.filter((item) => !item.roles || (currentUser && item.roles.includes(currentUser.role)))

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-bg-sidebar-border bg-bg-sidebar text-gray-700 transition-[width,transform] duration-200 lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100svh-56px)] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-16' : 'lg:w-56',
        )}
      >
        <div className="flex items-center justify-between border-b border-bg-sidebar-border px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-gray-700">Menu</span>
          <button onClick={onClose} aria-label="Đóng menu" className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/don-thu'}
              onClick={onClose}
              title={label}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className={clsx('flex-1', collapsed && 'lg:hidden')}>{label}</span>
              {badge === 'cho-xu-ly' && choXuLyCount > 0 && (
                <span className={clsx('rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary', collapsed && 'lg:hidden')}>
                  {choXuLyCount}
                </span>
              )}
              {badge === 'thong-bao' && unreadCount > 0 && (
                <span className={clsx('rounded-full bg-accent-red px-1.5 py-0.5 text-xs font-semibold text-white', collapsed && 'lg:hidden')}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleCollapsed}
          className="hidden items-center justify-center gap-2 border-t border-bg-sidebar-border py-3 text-xs font-medium text-gray-500 hover:bg-gray-100 lg:flex"
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : (
            <>
              <ChevronsLeft className="size-4" /> Thu gọn
            </>
          )}
        </button>
      </aside>
    </>
  )
}
