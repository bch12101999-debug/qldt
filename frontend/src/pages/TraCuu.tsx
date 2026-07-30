import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { listComplaints } from '@/api/client'
import { Reveal } from '@/components/Reveal'
import { StatusBadge } from '@/components/StatusBadge'
import { useUsers } from '@/hooks/useUsers'
import type { Complaint } from '@/types/domain'

export function TraCuu() {
  const { currentUser } = useAuth()
  const { users } = useUsers()
  const [maSo, setMaSo] = useState('')
  const [kenh, setKenh] = useState<'ALL' | Complaint['kenh']>('ALL')
  const [trangThai, setTrangThai] = useState<'ALL' | Complaint['trangThai']>('ALL')
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')
  const [tenNguoiKhieuNai, setTenNguoiKhieuNai] = useState('')
  const [chuyenVienId, setChuyenVienId] = useState('')
  const [searched, setSearched] = useState(false)

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['tra-cuu', currentUser?.id],
    queryFn: () =>
      listComplaints({
        currentUser: currentUser!,
        kenh,
        trangThai,
        tuNgay: tuNgay || undefined,
        denNgay: denNgay || undefined,
        search: maSo || tenNguoiKhieuNai || undefined,
        page: 1,
        pageSize: 200,
      }),
    enabled: false,
  })

  const results = (data?.items ?? []).filter((c) => !chuyenVienId || c.chuyenVienId === chuyenVienId)

  function handleSearch() {
    setSearched(true)
    refetch()
  }

  function handleExportExcel() {
    const header = ['Mã số', 'Ngày tiếp nhận', 'Người khiếu nại', 'Kênh', 'Trạng thái']
    const rows = results.map((c) => [c.maSo, c.ngayTiepNhan, c.hoTenNguoiKhieuNai, c.kenh, c.trangThai])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tra-cuu-don.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Reveal>
        <h1 className="text-xl font-bold text-gray-800">Tra cứu đơn khiếu nại</h1>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">Tìm nhanh theo mã số đơn</label>
            <div className="flex gap-2">
              <input value={maSo} onChange={(e) => setMaSo(e.target.value)} placeholder="VD: 001/2026/KN-TT" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <button onClick={handleSearch} className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                <Search className="size-4" /> Tìm
              </button>
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Tìm nâng cao</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Kênh tiếp nhận</label>
              <select value={kenh} onChange={(e) => setKenh(e.target.value as typeof kenh)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm">
                <option value="ALL">Tất cả</option>
                <option value="TRUC_TIEP">Trực tiếp</option>
                <option value="BUU_DIEN">Bưu điện</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Trạng thái</label>
              <select value={trangThai} onChange={(e) => setTrangThai(e.target.value as typeof trangThai)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm">
                <option value="ALL">Tất cả</option>
                <option value="HOAN_THANH">Hoàn thành</option>
                <option value="CHO_TIEP_NHAN_TU_PHAP">Chờ Tư pháp tiếp nhận</option>
                <option value="CHO_LANH_DAO_PHAN_CONG">Chờ lãnh đạo phân công</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Chuyên viên phụ trách</label>
              <select value={chuyenVienId} onChange={(e) => setChuyenVienId(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm">
                <option value="">Tất cả</option>
                {users.filter((u) => u.role === 'CHUYEN_VIEN').map((u) => (
                  <option key={u.id} value={u.id}>{u.hoTen}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Từ ngày</label>
              <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Đến ngày</label>
              <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tên người khiếu nại</label>
              <input value={tenNguoiKhieuNai} onChange={(e) => setTenNguoiKhieuNai(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm" />
            </div>
          </div>
          <button onClick={handleSearch} className="mt-3 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
            Tìm nâng cao
          </button>
        </div>
      </Reveal>

      {searched && (
        <Reveal delay={0.1}>
          <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Kết quả ({results.length})</h2>
              <button onClick={handleExportExcel} className="rounded-md border border-brand-green px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-brand-green/5">
                Xuất Excel
              </button>
            </div>
            {isFetching ? (
              <p className="py-6 text-center text-sm text-gray-400">Đang tìm kiếm...</p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Không tìm thấy đơn phù hợp.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {results.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1 rounded-md px-2 py-2.5 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link to={`/don-thu/${encodeURIComponent(c.id)}`} className="font-medium text-primary hover:underline">{c.maSo}</Link>
                      <span className="ml-2 text-sm text-gray-500">{c.hoTenNguoiKhieuNai}</span>
                    </div>
                    <StatusBadge complaint={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      )}
    </div>
  )
}
