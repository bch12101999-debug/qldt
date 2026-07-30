import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Paperclip } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getComplaint, performAction, ApiError, type ComplaintAction } from '@/api/client'
import { useUsers } from '@/hooks/useUsers'
import { Reveal } from '@/components/Reveal'
import { StatusBadge } from '@/components/StatusBadge'
import { FileUpload } from '@/components/FileUpload'
import { canAct, getResponsibleRole, predictOptimisticUpdate } from '@/lib/workflow'
import { ROLE_LABELS, STATUS_LABELS, type Complaint } from '@/types/domain'

const ATTACHMENT_LABELS: Record<string, string> = {
  DON_GOC: 'Đơn gốc',
  THONG_BAO_TIEP_NHAN: 'Thông báo tiếp nhận',
  BUT_PHE: 'Bút phê / chỉ đạo',
  KET_QUA_XU_LY: 'Kết quả xử lý chuyên môn',
  BIEN_BAN_DOI_THOAI: 'Biên bản đối thoại',
  QUYET_DINH_GIAI_QUYET: 'Quyết định giải quyết',
}

export function ChiTietDon() {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => getComplaint(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (action: ComplaintAction) => performAction(id!, action, currentUser!),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: ['complaint', id] })
      const previous = queryClient.getQueryData<Complaint>(['complaint', id])
      if (previous && currentUser) {
        const patch = predictOptimisticUpdate(previous, action, currentUser.id)
        queryClient.setQueryData<Complaint>(['complaint', id], { ...previous, ...patch })
      }
      return { previous }
    },
    onError: (e, _action, context) => {
      if (context?.previous) queryClient.setQueryData(['complaint', id], context.previous)
      toast.error(e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái đơn thành công.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['cho-xu-ly-complaints'] })
    },
  })

  function submit(action: ComplaintAction) {
    mutation.mutate(action)
  }

  if (isLoading) return <p className="py-10 text-center text-gray-400">Đang tải...</p>
  if (!complaint) return <p className="py-10 text-center text-gray-400">Không tìm thấy đơn.</p>

  const responsibleRole = getResponsibleRole(complaint)
  const userCanAct = currentUser ? canAct(complaint, currentUser.id, currentUser.role) : false

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Reveal>
        <Link to="/don-thu" className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-primary">
          <ArrowLeft className="size-4" /> Quay lại Danh sách đơn
        </Link>
      </Reveal>

      {/* A. Thông tin đơn */}
      <Reveal delay={0.05}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-bold text-primary">{complaint.maSo}</h1>
            <StatusBadge complaint={complaint} />
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <p><span className="text-gray-500">Kênh tiếp nhận:</span> {complaint.kenh === 'TRUC_TIEP' ? 'Trực tiếp' : 'Bưu điện'}</p>
            <p><span className="text-gray-500">Ngày tiếp nhận:</span> {complaint.ngayTiepNhan.split('-').reverse().join('/')}</p>
            <p><span className="text-gray-500">Người khiếu nại:</span> {complaint.hoTenNguoiKhieuNai}</p>
            <p><span className="text-gray-500">Số CCCD:</span> {complaint.soCCCD}</p>
            <p><span className="text-gray-500">Địa chỉ:</span> {complaint.diaChi}</p>
            <p><span className="text-gray-500">Số điện thoại:</span> {complaint.soDienThoai}</p>
          </div>
          <p className="mt-2 text-sm"><span className="text-gray-500">Nội dung khiếu nại:</span> {complaint.noiDungKhieuNai}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {complaint.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:underline"
                >
                  <Paperclip className="size-3" />
                  {ATTACHMENT_LABELS[a.loai]}: {a.tenFile}
                </a>
              ))}
          </div>
        </div>
      </Reveal>

      {/* B. Timeline xử lý */}
      <Reveal delay={0.1}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Lịch sử xử lý</h2>
          <ol className="flex flex-col gap-4">
            {complaint.lichSu.map((h, idx) => (
              <li key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`size-2.5 rounded-full ${idx === complaint.lichSu.length - 1 ? 'bg-primary' : 'bg-gray-300'}`} />
                  {idx < complaint.lichSu.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium text-gray-800">
                    {h.nguoiThucHien} <span className="font-normal text-gray-400">({ROLE_LABELS[h.role]})</span>
                  </p>
                  <p className="text-xs text-gray-400">{new Date(h.thoiDiem).toLocaleString('vi-VN')}</p>
                  {h.ghiChu && <p className="mt-0.5 text-sm text-gray-600">{h.ghiChu}</p>}
                  <p className="mt-0.5 text-xs text-gray-400">→ {STATUS_LABELS[h.trangThaiSau]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {/* C. Form hành động */}
      <Reveal delay={0.15}>
        <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Hành động tiếp theo</h2>

          {complaint.trangThai === 'HOAN_THANH' && (
            <p className="rounded-md bg-brand-green/10 px-3 py-2 text-sm text-brand-green">Đơn đã hoàn thành, không còn hành động tiếp theo.</p>
          )}

          {complaint.trangThai !== 'HOAN_THANH' && !userCanAct && (
            <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-500">
              Đang chờ <strong>{responsibleRole ? ROLE_LABELS[responsibleRole] : '—'}</strong> thực hiện bước tiếp theo. Bạn không có quyền thao
              tác ở bước này.
            </p>
          )}

          {userCanAct && complaint.trangThai === 'CHO_TIEP_NHAN_TU_PHAP' && (
            <TiepNhanForm onSubmit={submit} submitting={mutation.isPending} />
          )}
          {userCanAct && complaint.trangThai === 'CHO_LANH_DAO_PHAN_CONG' && (
            <ButPheForm onSubmit={submit} submitting={mutation.isPending} />
          )}
          {userCanAct && complaint.trangThai === 'DA_XU_LY_CHUYEN_MON' && !complaint.daSubmitKetQua && (
            <SubmitKetQuaForm onSubmit={submit} submitting={mutation.isPending} />
          )}
          {userCanAct && complaint.trangThai === 'DA_XU_LY_CHUYEN_MON' && complaint.daSubmitKetQua && (
            <LenLichDoiThoaiForm onSubmit={submit} submitting={mutation.isPending} />
          )}
          {userCanAct && complaint.trangThai === 'CHO_DOI_THOAI' && <UploadBienBanForm onSubmit={submit} submitting={mutation.isPending} />}
          {userCanAct && complaint.trangThai === 'DA_DOI_THOAI' && <BanHanhQuyetDinhForm onSubmit={submit} submitting={mutation.isPending} />}
        </div>
      </Reveal>
    </div>
  )
}

function ChuyenVienSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { users } = useUsers()
  const chuyenViens = users.filter((u) => u.role === 'CHUYEN_VIEN')
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600">Chọn chuyên viên xử lý *</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
        <option value="">-- Chọn chuyên viên --</option>
        {chuyenViens.map((u) => (
          <option key={u.id} value={u.id}>
            {u.hoTen} ({u.phongBan})
          </option>
        ))}
      </select>
    </div>
  )
}

function TiepNhanForm({ onSubmit, submitting }: { onSubmit: (a: ComplaintAction) => void; submitting: boolean }) {
  const [soThongBao, setSoThongBao] = useState('')
  const [ngayBanHanh, setNgayBanHanh] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [chuyenVienId, setChuyenVienId] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ type: 'TIEP_NHAN', soThongBao, ngayBanHanh, ghiChu, chuyenVienId, fileNames: files.map((f) => f.name), files })
      }}
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Số thông báo *</label>
          <input value={soThongBao} onChange={(e) => setSoThongBao(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Ngày ban hành *</label>
          <input type="date" value={ngayBanHanh} onChange={(e) => setNgayBanHanh(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600">Ghi chú</label>
        <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <ChuyenVienSelect value={chuyenVienId} onChange={setChuyenVienId} />
      <FileUpload label="Thông báo tiếp nhận" required files={files} onChange={setFiles} />
      <button type="submit" disabled={submitting || !chuyenVienId} className="mt-2 w-fit rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {submitting ? 'Đang xử lý...' : 'Tiếp nhận & chuyển chuyên viên'}
      </button>
    </form>
  )
}

function ButPheForm({ onSubmit, submitting }: { onSubmit: (a: ComplaintAction) => void; submitting: boolean }) {
  const [noiDungChiDao, setNoiDungChiDao] = useState('')
  const [chuyenVienId, setChuyenVienId] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ type: 'BUT_PHE', noiDungChiDao, chuyenVienId, fileNames: files.map((f) => f.name), files })
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <label className="mb-1 block text-sm text-gray-600">Nội dung chỉ đạo *</label>
        <textarea value={noiDungChiDao} onChange={(e) => setNoiDungChiDao(e.target.value)} required rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <ChuyenVienSelect value={chuyenVienId} onChange={setChuyenVienId} />
      <FileUpload label="Văn bản bút phê (không bắt buộc)" files={files} onChange={setFiles} />
      <button type="submit" disabled={submitting || !chuyenVienId} className="mt-2 w-fit rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {submitting ? 'Đang xử lý...' : 'Bút phê & phân công chuyên viên'}
      </button>
    </form>
  )
}

function SubmitKetQuaForm({ onSubmit, submitting }: { onSubmit: (a: ComplaintAction) => void; submitting: boolean }) {
  const [noiDungXacMinh, setNoiDungXacMinh] = useState('')
  const [ketQuaXuLy, setKetQuaXuLy] = useState('')
  const [deXuat, setDeXuat] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ type: 'SUBMIT_KET_QUA', noiDungXacMinh, ketQuaXuLy, deXuat, fileNames: files.map((f) => f.name), files })
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <label className="mb-1 block text-sm text-gray-600">Nội dung xác minh *</label>
        <textarea value={noiDungXacMinh} onChange={(e) => setNoiDungXacMinh(e.target.value)} required rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600">Kết quả xử lý *</label>
        <textarea value={ketQuaXuLy} onChange={(e) => setKetQuaXuLy(e.target.value)} required rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600">Đề xuất hướng giải quyết</label>
        <textarea value={deXuat} onChange={(e) => setDeXuat(e.target.value)} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <FileUpload label="Kết quả xử lý chuyên môn" required files={files} onChange={setFiles} />
      <button type="submit" disabled={submitting} className="mt-2 w-fit rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {submitting ? 'Đang xử lý...' : 'Nộp kết quả xử lý'}
      </button>
    </form>
  )
}

function LenLichDoiThoaiForm({ onSubmit, submitting }: { onSubmit: (a: ComplaintAction) => void; submitting: boolean }) {
  const [ngayDoiThoai, setNgayDoiThoai] = useState('')
  const [diaDiem, setDiaDiem] = useState('')
  const [thanhPhan, setThanhPhan] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ type: 'LEN_LICH_DOI_THOAI', ngayDoiThoai, diaDiem, thanhPhan })
      }}
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Ngày đối thoại *</label>
          <input type="date" value={ngayDoiThoai} onChange={(e) => setNgayDoiThoai(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Địa điểm *</label>
          <input value={diaDiem} onChange={(e) => setDiaDiem(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600">Thành phần tham dự</label>
        <textarea value={thanhPhan} onChange={(e) => setThanhPhan(e.target.value)} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={submitting} className="mt-2 w-fit rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {submitting ? 'Đang xử lý...' : 'Lên lịch đối thoại'}
      </button>
    </form>
  )
}

function UploadBienBanForm({ onSubmit, submitting }: { onSubmit: (a: ComplaintAction) => void; submitting: boolean }) {
  const [files, setFiles] = useState<File[]>([])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ type: 'UPLOAD_BIEN_BAN', fileNames: files.map((f) => f.name), files })
      }}
      className="flex flex-col gap-3"
    >
      <FileUpload label="Biên bản đối thoại" required files={files} onChange={setFiles} />
      <button type="submit" disabled={submitting} className="mt-2 w-fit rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {submitting ? 'Đang xử lý...' : 'Xác nhận đã đối thoại'}
      </button>
    </form>
  )
}

function BanHanhQuyetDinhForm({ onSubmit, submitting }: { onSubmit: (a: ComplaintAction) => void; submitting: boolean }) {
  const [soQuyetDinh, setSoQuyetDinh] = useState('')
  const [ngayKy, setNgayKy] = useState('')
  const [noiDungTomTat, setNoiDungTomTat] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ type: 'BAN_HANH_QUYET_DINH', soQuyetDinh, ngayKy, noiDungTomTat, fileNames: files.map((f) => f.name), files })
      }}
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Số quyết định *</label>
          <input value={soQuyetDinh} onChange={(e) => setSoQuyetDinh(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Ngày ký *</label>
          <input type="date" value={ngayKy} onChange={(e) => setNgayKy(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600">Nội dung tóm tắt *</label>
        <textarea value={noiDungTomTat} onChange={(e) => setNoiDungTomTat(e.target.value)} required rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <FileUpload label="Quyết định giải quyết" required files={files} onChange={setFiles} />
      <button type="submit" disabled={submitting} className="mt-2 w-fit rounded-md bg-brand-green px-5 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60">
        {submitting ? 'Đang xử lý...' : 'Ban hành Quyết định & Hoàn thành'}
      </button>
    </form>
  )
}
