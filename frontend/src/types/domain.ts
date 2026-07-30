export type Role = 'ADMIN' | 'VAN_THU' | 'LANH_DAO' | 'TU_PHAP' | 'CHUYEN_VIEN' | 'TRUONG_PHONG'

export type Kenh = 'TRUC_TIEP' | 'BUU_DIEN'

export type ComplaintStatus =
  | 'CHO_TIEP_NHAN_TU_PHAP'
  | 'CHO_LANH_DAO_PHAN_CONG'
  | 'DA_TIEP_NHAN'
  | 'DA_PHAN_CONG'
  | 'DA_XU_LY_CHUYEN_MON'
  | 'CHO_DOI_THOAI'
  | 'DA_DOI_THOAI'
  | 'HOAN_THANH'

export interface User {
  id: string
  hoTen: string
  role: Role
  phongBan?: string
  email: string
  tenDangNhap: string
  soDienThoai?: string
  chucVu?: string
  daKhoa: boolean
}

export interface ComplaintAttachment {
  id: string
  loai:
    | 'DON_GOC'
    | 'THONG_BAO_TIEP_NHAN'
    | 'BUT_PHE'
    | 'KET_QUA_XU_LY'
    | 'BIEN_BAN_DOI_THOAI'
    | 'QUYET_DINH_GIAI_QUYET'
  tenFile: string
  url: string
  uploadedAt: string
}

export interface ComplaintHistoryEntry {
  id: string
  thoiDiem: string
  nguoiThucHien: string
  role: Role
  trangThaiTruoc: ComplaintStatus | null
  trangThaiSau: ComplaintStatus
  ghiChu?: string
}

export interface Complaint {
  id: string
  maSo: string
  kenh: Kenh
  hoTenNguoiKhieuNai: string
  soCCCD: string
  diaChi: string
  soDienThoai: string
  noiDungKhieuNai: string
  ngayTiepNhan: string
  hanXuLy: string
  trangThai: ComplaintStatus
  daSubmitKetQua: boolean
  /** Văn thư đã tạo đơn */
  nguoiTaoId: string
  /** Tư pháp theo dõi/xử lý đơn (gán khi tiếp nhận hoặc khi được giao đối thoại/quyết định) */
  tuPhapId: string | null
  /** Lãnh đạo bút phê (chỉ đơn bưu điện) */
  lanhDaoId: string | null
  /** Chuyên viên chuyên môn được phân công xử lý */
  chuyenVienId: string | null
  attachments: ComplaintAttachment[]
  lichSu: ComplaintHistoryEntry[]
  stepData: Record<string, Record<string, string>>
}

export interface AppNotification {
  id: string
  userId: string
  complaintId: string
  noiDung: string
  daDoc: boolean
  thoiDiem: string
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  CHO_TIEP_NHAN_TU_PHAP: 'Chờ Tư pháp tiếp nhận',
  CHO_LANH_DAO_PHAN_CONG: 'Chờ lãnh đạo phân công',
  DA_TIEP_NHAN: 'Đã tiếp nhận',
  DA_PHAN_CONG: 'Đã phân công',
  DA_XU_LY_CHUYEN_MON: 'Đã xử lý chuyên môn',
  CHO_DOI_THOAI: 'Chờ đối thoại',
  DA_DOI_THOAI: 'Đã đối thoại',
  HOAN_THANH: 'Hoàn thành',
}

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  CHO_TIEP_NHAN_TU_PHAP: '#78909C',
  CHO_LANH_DAO_PHAN_CONG: '#78909C',
  DA_TIEP_NHAN: '#1976D2',
  DA_PHAN_CONG: '#1976D2',
  DA_XU_LY_CHUYEN_MON: '#E65100',
  CHO_DOI_THOAI: '#F9A825',
  DA_DOI_THOAI: '#7B1FA2',
  HOAN_THANH: '#00A84F',
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  VAN_THU: 'Văn thư',
  LANH_DAO: 'Lãnh đạo',
  TU_PHAP: 'Tư pháp',
  CHUYEN_VIEN: 'Chuyên viên',
  TRUONG_PHONG: 'Trưởng phòng',
}

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  ADMIN: '#D32F2F',
  VAN_THU: '#78909C',
  LANH_DAO: '#7B1FA2',
  TU_PHAP: '#E65100',
  CHUYEN_VIEN: '#1976D2',
  TRUONG_PHONG: '#F9A825',
}
