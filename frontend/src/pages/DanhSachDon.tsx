import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { listComplaints } from '@/api/client'
import { Reveal } from '@/components/Reveal'
import { StatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { getResponsibleUserId } from '@/lib/workflow'
import { useUsers } from '@/hooks/useUsers'
import type { Complaint } from '@/types/domain'

const PAGE_SIZE = 8

export function DanhSachDon() {
  const { currentUser } = useAuth()
  const { findUser } = useUsers()
  const [kenh, setKenh] = useState<'ALL' | Complaint['kenh']>('ALL')
  const [trangThai, setTrangThai] = useState<'ALL' | Complaint['trangThai']>('ALL')
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isFetching } = useQuery({
    queryKey: ['complaints', currentUser?.id, kenh, trangThai, tuNgay, denNgay, appliedSearch, page],
    queryFn: () =>
      listComplaints({
        currentUser: currentUser!,
        kenh,
        trangThai,
        tuNgay: tuNgay || undefined,
        denNgay: denNgay || undefined,
        search: appliedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!currentUser,
  })

  function handleFilter() {
    setAppliedSearch(search)
    setPage(1)
  }

  function handleClear() {
    setKenh('ALL')
    setTrangThai('ALL')
    setTuNgay('')
    setDenNgay('')
    setSearch('')
    setAppliedSearch('')
    setPage(1)
  }

  function handleExportExcel() {
    const items = data?.items ?? []
    const header = ['Mã số', 'Ngày tiếp nhận', 'Người khiếu nại', 'Kênh', 'Trạng thái']
    const rows = items.map((c) => [c.maSo, c.ngayTiepNhan, c.hoTenNguoiKhieuNai, c.kenh === 'TRUC_TIEP' ? 'Trực tiếp' : 'Bưu điện', c.trangThai])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'danh-sach-don.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-800">Danh sách đơn thư</h1>
          <Link to="/don-thu/tao-moi" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
            + Tạo đơn mới
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Kênh tiếp nhận</label>
              <select value={kenh} onChange={(e) => setKenh(e.target.value as typeof kenh)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                <option value="ALL">Tất cả</option>
                <option value="TRUC_TIEP">Trực tiếp</option>
                <option value="BUU_DIEN">Bưu điện</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Trạng thái</label>
              <select value={trangThai} onChange={(e) => setTrangThai(e.target.value as typeof trangThai)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                <option value="ALL">Tất cả</option>
                <option value="CHO_TIEP_NHAN_TU_PHAP">Chờ Tư pháp tiếp nhận</option>
                <option value="CHO_LANH_DAO_PHAN_CONG">Chờ lãnh đạo phân công</option>
                <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
                <option value="DA_PHAN_CONG">Đã phân công</option>
                <option value="DA_XU_LY_CHUYEN_MON">Đã xử lý chuyên môn</option>
                <option value="CHO_DOI_THOAI">Chờ đối thoại</option>
                <option value="DA_DOI_THOAI">Đã đối thoại</option>
                <option value="HOAN_THANH">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Từ ngày</label>
              <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Đến ngày</label>
              <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tìm kiếm</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                placeholder="Mã số, tên người khiếu nại"
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={handleFilter} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
              Lọc
            </button>
            <button onClick={handleClear} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Xóa lọc
            </button>
            <button
              onClick={handleExportExcel}
              className="ml-auto rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green/5"
            >
              Xuất Excel
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="overflow-hidden rounded-lg bg-bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Mã số</th>
                  <th className="px-4 py-3">Ngày tiếp nhận</th>
                  <th className="px-4 py-3">Người khiếu nại</th>
                  <th className="px-4 py-3">Kênh</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Người phụ trách</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isFetching && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!isFetching && (data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Không có đơn nào phù hợp.
                    </td>
                  </tr>
                )}
                {!isFetching &&
                  data?.items.map((c) => {
                    const nguoiPhuTrach = findUser(getResponsibleUserId(c))
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-primary">{c.maSo}</td>
                        <td className="px-4 py-3">{c.ngayTiepNhan.split('-').reverse().join('/')}</td>
                        <td className="px-4 py-3">{c.hoTenNguoiKhieuNai}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                            {c.kenh === 'TRUC_TIEP' ? 'Trực tiếp' : 'Bưu điện'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge complaint={c} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">{nguoiPhuTrach?.hoTen ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/don-thu/${encodeURIComponent(c.id)}`}
                            className="inline-flex min-h-9 items-center rounded-md border border-primary px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
                          >
                            Xem
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
          </div>
        </div>
      </Reveal>
    </div>
  )
}
