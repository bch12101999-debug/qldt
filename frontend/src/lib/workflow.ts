import type { Complaint, Role } from '@/types/domain'
import { getHanXuLyMacDinh } from './config'

export function tinhHanXuLy(ngayTiepNhan: string, soNgay?: number): string {
  const d = new Date(ngayTiepNhan)
  d.setDate(d.getDate() + (soNgay ?? getHanXuLyMacDinh()))
  return d.toISOString().slice(0, 10)
}

export function isQuaHan(complaint: Pick<Complaint, 'hanXuLy' | 'trangThai'>, today = new Date()): boolean {
  if (complaint.trangThai === 'HOAN_THANH') return false
  return today > new Date(complaint.hanXuLy + 'T23:59:59')
}

/** Role chịu trách nhiệm hành động tiếp theo cho 1 trạng thái (theo Ma trận quyền theo bước xử lý). */
export function getResponsibleRole(complaint: Pick<Complaint, 'trangThai' | 'kenh' | 'daSubmitKetQua'>): Role | null {
  switch (complaint.trangThai) {
    case 'CHO_TIEP_NHAN_TU_PHAP':
      return 'TU_PHAP'
    case 'CHO_LANH_DAO_PHAN_CONG':
      return 'LANH_DAO'
    case 'DA_TIEP_NHAN':
      // Tư pháp (đã tiếp nhận đơn trực tiếp) chọn và chuyển cho chuyên viên
      return 'TU_PHAP'
    case 'DA_PHAN_CONG':
      // Lãnh đạo (đã bút phê đơn bưu điện) chọn và chuyển cho chuyên viên
      return 'LANH_DAO'
    case 'DA_XU_LY_CHUYEN_MON':
      return complaint.daSubmitKetQua ? 'TU_PHAP' : 'CHUYEN_VIEN'
    case 'CHO_DOI_THOAI':
      return 'TU_PHAP'
    case 'DA_DOI_THOAI':
      return 'TU_PHAP'
    case 'HOAN_THANH':
      return null
    default:
      return null
  }
}

/** userId của người cần hành động tiếp theo, dùng để hiển thị cột "Người phụ trách". */
export function getResponsibleUserId(complaint: Complaint): string | null {
  const role = getResponsibleRole(complaint)
  if (role === 'TU_PHAP') return complaint.tuPhapId
  if (role === 'LANH_DAO') return complaint.lanhDaoId
  if (role === 'CHUYEN_VIEN') return complaint.chuyenVienId
  return null
}

/** Kiểm tra 1 user (role + id) có phải người liên quan tới đơn để hiển thị trong Danh sách đơn hay không. */
export function isRelated(complaint: Complaint, userId: string, role: Role): boolean {
  if (role === 'ADMIN' || role === 'LANH_DAO' || role === 'TRUONG_PHONG') return true
  if (role === 'VAN_THU') return complaint.nguoiTaoId === userId
  if (role === 'TU_PHAP') return complaint.tuPhapId === userId || complaint.kenh === 'TRUC_TIEP'
  if (role === 'CHUYEN_VIEN') return complaint.chuyenVienId === userId
  return false
}

export function canAct(complaint: Complaint, userId: string, role: Role): boolean {
  const requiredRole = getResponsibleRole(complaint)
  if (!requiredRole) return false
  // TRUONG_PHONG có quyền workflow tương đương LANH_DAO (chỉ khác thứ bậc hiển thị/tổ chức)
  const roleMatches = requiredRole === role || (requiredRole === 'LANH_DAO' && role === 'TRUONG_PHONG')
  if (!roleMatches) return false
  const responsibleId = getResponsibleUserId(complaint)
  // Nếu đơn chưa có ai được gán ở bước này (VD chưa phân công chuyên viên), bất kỳ ai đúng role đều thao tác được
  return responsibleId === null || responsibleId === userId
}

/**
 * Dự đoán trạng thái mới của đơn ngay sau khi 1 hành động được gửi đi, dùng cho Optimistic UI
 * (cập nhật UI ngay trước khi server phản hồi). Chỉ dự đoán các field chính (trangThai/daSubmitKetQua/
 * người phụ trách) — dữ liệu chính xác đầy đủ (lịch sử, id file thật...) vẫn lấy từ response thật sau khi
 * server xử lý xong (invalidateQueries), đây chỉ là bản đoán tạm để UI phản hồi tức thì.
 */
export function predictOptimisticUpdate(
  _complaint: Complaint,
  action: { type: string; chuyenVienId?: string },
  currentUserId: string,
): Partial<Complaint> {
  switch (action.type) {
    case 'TIEP_NHAN':
      return { trangThai: 'DA_XU_LY_CHUYEN_MON', daSubmitKetQua: false, tuPhapId: currentUserId, chuyenVienId: action.chuyenVienId ?? null }
    case 'BUT_PHE':
      return { trangThai: 'DA_XU_LY_CHUYEN_MON', daSubmitKetQua: false, lanhDaoId: currentUserId, chuyenVienId: action.chuyenVienId ?? null }
    case 'SUBMIT_KET_QUA':
      return { daSubmitKetQua: true }
    case 'LEN_LICH_DOI_THOAI':
      return { trangThai: 'CHO_DOI_THOAI' }
    case 'UPLOAD_BIEN_BAN':
      return { trangThai: 'DA_DOI_THOAI' }
    case 'BAN_HANH_QUYET_DINH':
      return { trangThai: 'HOAN_THANH' }
    default:
      return {}
  }
}

/** Nhãn hành động cụ thể mà người xem hiện tại (đã qua canAct) cần thực hiện tiếp theo. */
export function getActionLabel(complaint: Pick<Complaint, 'trangThai' | 'daSubmitKetQua'>): string {
  switch (complaint.trangThai) {
    case 'CHO_TIEP_NHAN_TU_PHAP':
      return 'Tiếp nhận + Upload thông báo'
    case 'CHO_LANH_DAO_PHAN_CONG':
      return 'Bút phê + Phân công'
    case 'DA_TIEP_NHAN':
    case 'DA_PHAN_CONG':
      return 'Chuyển chuyên viên'
    case 'DA_XU_LY_CHUYEN_MON':
      return complaint.daSubmitKetQua ? 'Lên lịch đối thoại' : 'Xử lý chuyên môn'
    case 'CHO_DOI_THOAI':
      return 'Upload biên bản đối thoại'
    case 'DA_DOI_THOAI':
      return 'Ban hành quyết định'
    default:
      return ''
  }
}
