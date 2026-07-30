import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { listComplaints } from '@/api/client'
import { Reveal } from '@/components/Reveal'
import { Pagination } from '@/components/Pagination'
import { canAct, isQuaHan, getActionLabel } from '@/lib/workflow'
import { ROLE_LABELS, type Kenh } from '@/types/domain'

const PAGE_SIZE = 20

export function ChoXuLy() {
  const { currentUser } = useAuth()
  const [kenh, setKenh] = useState<Kenh | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['cho-xu-ly-complaints', currentUser?.id],
    queryFn: () => listComplaints({ currentUser: currentUser!, page: 1, pageSize: 1000 }),
    enabled: !!currentUser,
  })

  const filtered = useMemo(() => {
    if (!currentUser) return []
    let items = (data?.items ?? []).filter((c) => canAct(c, currentUser.id, currentUser.role))
    if (kenh !== 'ALL') items = items.filter((c) => c.kenh === kenh)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter((c) => c.maSo.toLowerCase().includes(q) || c.hoTenNguoiKhieuNai.toLowerCase().includes(q))
    }
    return items.sort((a, b) => {
      const rank = (c: (typeof items)[number]) => (isQuaHan(c) ? 0 : 1)
      const r = rank(a) - rank(b)
      if (r !== 0) return r
      return a.hanXuLy < b.hanXuLy ? -1 : 1
    })
  }, [data, currentUser, kenh, search])

  const total = filtered.length
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <ClipboardList className="size-5 text-primary" /> Đơn chờ xử lý
          </h1>
          {currentUser && (
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              Vai trò: {ROLE_LABELS[currentUser.role]}
            </span>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-bg-card p-3 shadow-sm">
          <select
            value={kenh}
            onChange={(e) => {
              setKenh(e.target.value as Kenh | 'ALL')
              setPage(1)
            }}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="ALL">Tất cả kênh</option>
            <option value="TRUC_TIEP">Trực tiếp</option>
            <option value="BUU_DIEN">Bưu điện</option>
          </select>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo mã số hoặc tên người khiếu nại..."
            className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-400">Đang tải...</p>
          ) : total === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Không có đơn nào cần bạn xử lý ngay bây giờ.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-3">Mã số</th>
                      <th className="px-3 py-3">Người khiếu nại</th>
                      <th className="px-3 py-3">Kênh</th>
                      <th className="px-3 py-3">Hành động cần làm</th>
                      <th className="px-3 py-3">Hạn xử lý</th>
                      <th className="px-3 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paged.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 font-medium text-primary">{c.maSo}</td>
                        <td className="px-3 py-3">{c.hoTenNguoiKhieuNai}</td>
                        <td className="px-3 py-3 text-gray-500">{c.kenh === 'TRUC_TIEP' ? 'Trực tiếp' : 'Bưu điện'}</td>
                        <td className="px-3 py-3">{getActionLabel(c)}</td>
                        <td className="px-3 py-3">
                          <span className={isQuaHan(c) ? 'text-accent-red' : 'text-gray-600'}>
                            {c.hanXuLy.split('-').reverse().join('/')}
                          </span>
                          {isQuaHan(c) && (
                            <span className="ml-1.5 rounded-full bg-accent-red/10 px-2 py-0.5 text-xs font-medium text-accent-red">
                              Quá hạn
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            to={`/don-thu/${encodeURIComponent(c.id)}`}
                            className="inline-flex min-h-9 items-center rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                          >
                            Xử lý
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
