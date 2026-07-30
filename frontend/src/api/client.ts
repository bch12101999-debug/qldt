import type { AppNotification, Complaint, ComplaintHistoryEntry, Kenh, Role, User } from '@/types/domain'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const TOKEN_KEY = 'hiepbinh_token'

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getToken(): string |null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Lỗi ${res.status}`

    try {
      const body = await res.json()
      message = body.message ?? message
    } catch {
      // Phản hồi không phải JSON
    }

    if (res.status === 401 && path !== '/api/auth/login') {
      setToken(null)
      window.location.replace('/dang-nhap')
    }

    throw new ApiError(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function toDateOnly(value: unknown): string {
  return String(value).slice(0, 10)
}

// ---- Chuẩn hóa dữ liệu từ backend (Prisma) sang domain type của frontend ----
function mapUser(raw: any): User {
  return {
    id: raw.id,
    hoTen: raw.hoTen,
    role: raw.role,
    phongBan: raw.department?.ten ?? raw.phongBan ?? undefined,
    email: raw.email,
    tenDangNhap: raw.tenDangNhap,
    soDienThoai: raw.soDienThoai ?? undefined,
    chucVu: raw.chucVu ?? undefined,
    daKhoa: raw.daKhoa,
  }
}

function mapHistory(raw: any): ComplaintHistoryEntry {
  return {
    id: raw.id,
    thoiDiem: raw.thoiDiem,
    nguoiThucHien: raw.nguoiThucHien?.hoTen ?? '',
    role: raw.role,
    trangThaiTruoc: raw.trangThaiTruoc,
    trangThaiSau: raw.trangThaiSau,
    ghiChu: raw.ghiChu ?? undefined,
  }
}

function mapComplaint(raw: any): Complaint {
  return {
    id: raw.id,
    maSo: raw.maSo,
    kenh: raw.kenh,
    hoTenNguoiKhieuNai: raw.hoTenNguoiKhieuNai,
    soCCCD: raw.soCCCD,
    diaChi: raw.diaChi,
    soDienThoai: raw.soDienThoai,
    noiDungKhieuNai: raw.noiDungKhieuNai,
    ngayTiepNhan: toDateOnly(raw.ngayTiepNhan),
    hanXuLy: toDateOnly(raw.hanXuLy),
    trangThai: raw.trangThai,
    daSubmitKetQua: raw.daSubmitKetQua,
    nguoiTaoId: raw.nguoiTaoId,
    tuPhapId: raw.tuPhapId ?? null,
    lanhDaoId: raw.lanhDaoId ?? null,
    chuyenVienId: raw.chuyenVienId ?? null,
    attachments: (raw.attachments ?? []).map((a: any) => ({
      id: a.id,
      loai: a.loai,
      tenFile: a.tenFile,
      url: a.url,
      uploadedAt: a.uploadedAt,
    })),
    lichSu: (raw.lichSu ?? []).map(mapHistory),
    stepData: Object.fromEntries((raw.stepData ?? []).map((s: any) => [s.buoc, s.duLieu])),
  }
}

// ---- Auth ----
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const { token, user } = await request<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return { token, user: mapUser(user) }
}

export async function getMe(): Promise<User> {
  const user = await request<any>('/api/auth/me')
  return mapUser(user)
}

export async function getUsers(role?: Role): Promise<User[]> {
  const qs = role ? `?role=${role}` : ''
  const users = await request<any[]>(`/api/users${qs}`)
  return users.map(mapUser)
}

// ---- Quản lý người dùng (ADMIN) ----
export interface ListUsersParams {
  currentUser: User
  role?: Role | 'ALL'
  daKhoa?: boolean | 'ALL'
  search?: string
}

export async function listUsers(params: ListUsersParams): Promise<User[]> {
  const qs = new URLSearchParams()
  if (params.role && params.role !== 'ALL') qs.set('role', params.role)
  if (params.daKhoa !== undefined && params.daKhoa !== 'ALL') qs.set('daKhoa', String(params.daKhoa))
  if (params.search?.trim()) qs.set('search', params.search.trim())
  const users = await request<any[]>(`/api/users?${qs.toString()}`)
  return users.map(mapUser)
}

export interface CreateUserInput {
  hoTen: string
  email: string
  tenDangNhap?: string
  soDienThoai?: string
  role: Role
  phongBan?: string
  chucVu?: string
  matKhau: string
}

export async function createUser(input: CreateUserInput, _currentUser: User): Promise<User> {
  const user = await request<any>('/api/users', { method: 'POST', body: JSON.stringify(input) })
  return mapUser(user)
}

export interface UpdateUserInput {
  hoTen?: string
  email?: string
  soDienThoai?: string
  role?: Role
  phongBan?: string
  chucVu?: string
}

export async function updateUser(id: string, input: UpdateUserInput, _currentUser: User): Promise<User> {
  const user = await request<any>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  return mapUser(user)
}

export async function resetUserPassword(id: string, _currentUser: User): Promise<{ newPassword: string }> {
  return request<{ newPassword: string }>(`/api/users/${id}/reset-password`, { method: 'POST' })
}

export async function toggleUserLock(id: string, daKhoa: boolean, _currentUser: User): Promise<User> {
  const user = await request<any>(`/api/users/${id}/lock`, { method: 'PATCH', body: JSON.stringify({ daKhoa }) })
  return mapUser(user)
}

// ---- Cấu hình hệ thống ----
export async function getConfig(): Promise<{ hanXuLyMacDinh: number }> {
  return request<{ hanXuLyMacDinh: number }>('/api/config')
}

export async function updateConfig(hanXuLyMacDinh: number): Promise<{ hanXuLyMacDinh: number }> {
  return request<{ hanXuLyMacDinh: number }>('/api/config', { method: 'PUT', body: JSON.stringify({ hanXuLyMacDinh }) })
}

// ---- Danh sách / tra cứu đơn ----
export interface ListComplaintsParams {
  currentUser: User
  kenh?: Kenh | 'ALL'
  trangThai?: Complaint['trangThai'] | 'ALL'
  tuNgay?: string
  denNgay?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function listComplaints(params: ListComplaintsParams): Promise<{ items: Complaint[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.kenh && params.kenh !== 'ALL') qs.set('kenh', params.kenh)
  if (params.trangThai && params.trangThai !== 'ALL') qs.set('trangThai', params.trangThai)
  if (params.tuNgay) qs.set('tuNgay', params.tuNgay)
  if (params.denNgay) qs.set('denNgay', params.denNgay)
  if (params.search) qs.set('search', params.search)
  qs.set('page', String(params.page ?? 1))
  qs.set('pageSize', String(params.pageSize ?? 8))

  const { items, total } = await request<{ items: any[]; total: number }>(`/api/complaints?${qs.toString()}`)
  return { items: items.map(mapComplaint), total }
}

export async function getComplaint(id: string): Promise<Complaint | undefined> {
  try {
    const raw = await request<any>(`/api/complaints/${id}`)
    return mapComplaint(raw)
  } catch {
    return undefined
  }
}

// ---- Tạo đơn (Văn thư) ----
export interface CreateComplaintInput {
  kenh: Kenh
  hoTenNguoiKhieuNai: string
  soCCCD: string
  diaChi: string
  soDienThoai: string
  noiDungKhieuNai: string
  fileNames: string[]
  tuPhapId?: string
  lanhDaoId?: string
  files?: File[]
}

export async function createComplaint(input: CreateComplaintInput, _currentUser: User): Promise<Complaint> {
  const form = new FormData()
  form.set('kenh', input.kenh)
  form.set('hoTenNguoiKhieuNai', input.hoTenNguoiKhieuNai)
  form.set('soCCCD', input.soCCCD)
  form.set('diaChi', input.diaChi)
  form.set('soDienThoai', input.soDienThoai)
  form.set('noiDungKhieuNai', input.noiDungKhieuNai)
  if (input.tuPhapId) form.set('tuPhapId', input.tuPhapId)
  if (input.lanhDaoId) form.set('lanhDaoId', input.lanhDaoId)
  ;(input.files ?? []).forEach((f) => form.append('files', f))

  const raw = await request<any>('/api/complaints', { method: 'POST', body: form })
  return mapComplaint(raw)
}

// ---- Hành động chuyển trạng thái ----
export type ComplaintAction =
  | { type: 'TIEP_NHAN'; soThongBao: string; ngayBanHanh: string; ghiChu?: string; fileNames: string[]; chuyenVienId: string; files?: File[] }
  | { type: 'BUT_PHE'; noiDungChiDao: string; fileNames?: string[]; chuyenVienId: string; files?: File[] }
  | { type: 'CHUYEN_CHUYEN_VIEN'; chuyenVienId: string }
  | { type: 'SUBMIT_KET_QUA'; noiDungXacMinh: string; ketQuaXuLy: string; deXuat: string; fileNames: string[]; files?: File[] }
  | { type: 'LEN_LICH_DOI_THOAI'; ngayDoiThoai: string; diaDiem: string; thanhPhan: string }
  | { type: 'UPLOAD_BIEN_BAN'; fileNames: string[]; files?: File[] }
  | { type: 'BAN_HANH_QUYET_DINH'; soQuyetDinh: string; ngayKy: string; noiDungTomTat: string; fileNames: string[]; files?: File[] }

export async function performAction(complaintId: string, action: ComplaintAction, _currentUser: User): Promise<Complaint> {
  const form = new FormData()
  form.set('type', action.type)
  for (const [key, value] of Object.entries(action)) {
    if (key === 'type' || key === 'fileNames' || key === 'files') continue
    if (value !== undefined) form.set(key, String(value))
  }
  const files = 'files' in action ? (action.files ?? []) : []
  files.forEach((f) => form.append('files', f))

  const raw = await request<any>(`/api/complaints/${complaintId}/actions`, { method: 'POST', body: form })
  return mapComplaint(raw)
}

// ---- Thông báo ----
export async function listNotifications(_userId: string, page = 1, pageSize = 20): Promise<{ items: AppNotification[]; total: number }> {
  return request<{ items: AppNotification[]; total: number }>(`/api/notifications?page=${page}&pageSize=${pageSize}`)
}

export async function markAllNotificationsRead(_userId: string): Promise<void> {
  await request('/api/notifications/mark-all-read', { method: 'POST' })
}

export async function markNotificationRead(id: string): Promise<void> {
  await request(`/api/notifications/${id}/mark-read`, { method: 'POST' })
}
