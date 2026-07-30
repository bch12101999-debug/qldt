import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileStack,
  FileText,
  Loader2,
  Printer,
  type LucideIcon,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { listComplaints } from '@/api/client'
import { Reveal } from '@/components/Reveal'
import { StatusBadge } from '@/components/StatusBadge'
import { isQuaHan, canAct } from '@/lib/workflow'

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string
  value: number
  icon: LucideIcon
  colorClass: string
  bgClass: string
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg bg-bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${bgClass}`}>
        <Icon className={`size-5 ${colorClass}`} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight text-gray-500">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold ${colorClass}`}>{value}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { currentUser } = useAuth()
  const [thang, setThang] = useState(new Date().getMonth() + 1)
  const [nam, setNam] = useState(new Date().getFullYear())

  const { data } = useQuery({
    queryKey: ['dashboard-complaints', currentUser?.id],
    queryFn: () => listComplaints({ currentUser: currentUser!, page: 1, pageSize: 1000 }),
    enabled: !!currentUser,
  })

  const items = data?.items ?? []
  const today = new Date().toISOString().slice(0, 10)

  const stats = useMemo(() => {
    const moiHomNay = items.filter((c) => c.ngayTiepNhan === today).length
    const hoanThanh = items.filter((c) => c.trangThai === 'HOAN_THANH').length
    const quaHan = items.filter((c) => isQuaHan(c)).length
    const dangXuLy = items.filter((c) => c.trangThai !== 'HOAN_THANH' && !isQuaHan(c)).length
    return { tong: items.length, moiHomNay, dangXuLy, quaHan, hoanThanh }
  }, [items, today])

  const choTraXuLy = useMemo(() => {
    if (!currentUser) return []
    return items
      .filter((c) => canAct(c, currentUser.id, currentUser.role))
      .sort((a, b) => {
        const rank = (c: (typeof items)[number]) => (isQuaHan(c) ? 0 : c.trangThai === 'HOAN_THANH' ? 2 : 1)
        return rank(a) - rank(b)
      })
      .slice(0, 6)
  }, [items, currentUser])

  const lineData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      return d.toISOString().slice(0, 10)
    })
    return days.map((day) => ({
      ngay: day.slice(5),
      soDon: items.filter((c) => c.ngayTiepNhan === day).length,
    }))
  }, [items])

  const donutData = useMemo(
    () => [
      { name: 'Quá hạn', value: stats.quaHan, color: '#D32F2F' },
      { name: 'Đang xử lý', value: stats.dangXuLy, color: '#F57C00' },
      { name: 'Hoàn thành', value: stats.hoanThanh, color: '#00A84F' },
    ],
    [stats],
  )

  const baoCao = useMemo(() => {
    const inKy = items.filter((c) => {
      const d = new Date(c.ngayTiepNhan)
      return d.getFullYear() === nam && d.getMonth() + 1 === thang
    })
    const truc = inKy.filter((c) => c.kenh === 'TRUC_TIEP').length
    const buu = inKy.filter((c) => c.kenh === 'BUU_DIEN').length
    const hoanThanh = inKy.filter((c) => c.trangThai === 'HOAN_THANH')
    const thoiGianTB =
      hoanThanh.length === 0
        ? 0
        : Math.round(
            hoanThanh.reduce((sum, c) => {
              const last = c.lichSu[c.lichSu.length - 1]
              const soNgay = last
                ? (new Date(last.thoiDiem).getTime() - new Date(c.ngayTiepNhan).getTime()) / 86400000
                : 0
              return sum + soNgay
            }, 0) / hoanThanh.length,
          )
    return { tong: inKy.length, truc, buu, hoanThanh: hoanThanh.length, thoiGianTB }
  }, [items, thang, nam])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Reveal>
        <h1 className="text-xl font-bold text-gray-800">Trang chủ</h1>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Tổng đơn" value={stats.tong} icon={FileStack} colorClass="text-primary" bgClass="bg-primary/10" />
          <StatCard label="Mới hôm nay" value={stats.moiHomNay} icon={CalendarClock} colorClass="text-status-blue" bgClass="bg-status-blue/10" />
          <StatCard label="Đang xử lý" value={stats.dangXuLy} icon={Loader2} colorClass="text-accent-orange" bgClass="bg-accent-orange/10" />
          <StatCard label="Quá hạn" value={stats.quaHan} icon={AlertTriangle} colorClass="text-accent-red" bgClass="bg-accent-red/10" />
          <StatCard label="Đã hoàn thành" value={stats.hoanThanh} icon={CheckCircle2} colorClass="text-brand-green" bgClass="bg-brand-green/10" />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal delay={0.1} className="lg:col-span-2">
          <div className="h-full rounded-lg bg-bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Số đơn tiếp nhận theo ngày (14 ngày gần nhất)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="ngay" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="soDon" stroke="#1A5BA8" strokeWidth={2} dot={false} name="Số đơn" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="h-full rounded-lg bg-bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Phân loại theo trạng thái</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlertTriangle className="size-4 text-accent-orange" /> Đơn đang chờ tôi xử lý
            </h2>
            <Link to="/don-thu/cho-xu-ly" className="text-sm font-medium text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          {choTraXuLy.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Không có đơn nào đang chờ bạn xử lý.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {choTraXuLy.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 rounded-md px-2 py-2.5 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link to={`/don-thu/${encodeURIComponent(c.id)}`} className="font-medium text-primary hover:underline">
                      {c.maSo}
                    </Link>
                    <span className="ml-2 text-sm text-gray-500">{c.hoTenNguoiKhieuNai}</span>
                  </div>
                  <StatusBadge complaint={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.25} className="print-area">
        <div className="rounded-lg bg-bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="size-4 text-primary" /> Báo cáo thống kê
            </h2>
            <div className="flex items-center gap-2">
              <select value={thang} onChange={(e) => setThang(Number(e.target.value))} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select value={nam} onChange={(e) => setNam(Number(e.target.value))} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                {[nam - 1, nam, nam + 1].map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                <Printer className="size-4" /> Xuất PDF
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Tổng đơn trong kỳ" value={baoCao.tong} icon={FileStack} colorClass="text-primary" bgClass="bg-primary/10" />
            <StatCard label="Trực tiếp / Bưu điện" value={baoCao.truc} icon={FileText} colorClass="text-status-blue" bgClass="bg-status-blue/10" />
            <StatCard label="Đã giải quyết" value={baoCao.hoanThanh} icon={CheckCircle2} colorClass="text-brand-green" bgClass="bg-brand-green/10" />
            <StatCard label="TG xử lý TB (ngày)" value={baoCao.thoiGianTB} icon={CalendarClock} colorClass="text-accent-orange" bgClass="bg-accent-orange/10" />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Kênh trực tiếp: {baoCao.truc} đơn · Kênh bưu điện: {baoCao.buu} đơn — tổng hợp tháng {thang}/{nam}.
          </p>
        </div>
      </Reveal>
    </div>
  )
}
