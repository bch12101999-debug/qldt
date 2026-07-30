import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/client'
import { Reveal } from '@/components/Reveal'
import { Pagination } from '@/components/Pagination'

const PAGE_SIZE = 20

export function TrungTamThongBao() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-center', currentUser?.id, page],
    queryFn: () => listNotifications(currentUser!.id, page, PAGE_SIZE),
    enabled: !!currentUser,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const queryKey = ['notifications-center', currentUser?.id, page] as const

  function optimisticMarkRead(predicate: (n: { id: string }) => boolean) {
    queryClient.setQueryData(queryKey, (old: typeof data) =>
      old ? { ...old, items: old.items.map((n) => (predicate(n) ? { ...n, daDoc: true } : n)) } : old,
    )
  }

  async function handleMarkAllRead() {
    if (!currentUser) return
    const previous = queryClient.getQueryData(queryKey)
    optimisticMarkRead(() => true)
    try {
      await markAllNotificationsRead(currentUser.id)
    } catch {
      queryClient.setQueryData(queryKey, previous)
    } finally {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }

  async function handleClickItem(id: string, complaintId: string, daDoc: boolean) {
    if (!daDoc) {
      const previous = queryClient.getQueryData(queryKey)
      optimisticMarkRead((n) => n.id === id)
      try {
        await markNotificationRead(id)
      } catch {
        queryClient.setQueryData(queryKey, previous)
      } finally {
        queryClient.invalidateQueries({ queryKey: ['notifications-center'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    }
    navigate(`/don-thu/${encodeURIComponent(complaintId)}`)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Bell className="size-5 text-primary" /> Trung tâm thông báo
          </h1>
          <button onClick={handleMarkAllRead} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-400">Đang tải...</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <BellOff className="size-8" />
              <p className="text-sm">Không có thông báo nào.</p>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClickItem(n.id, n.complaintId, n.daDoc)}
                      className={`flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                        n.daDoc ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-primary-light text-gray-800 hover:bg-primary-light/70'
                      }`}
                    >
                      {!n.daDoc && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                      <div className="flex-1">
                        <p className={n.daDoc ? 'font-normal' : 'font-semibold'}>{n.noiDung}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{new Date(n.thoiDiem).toLocaleString('vi-VN')}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </Reveal>
    </div>
  )
}
