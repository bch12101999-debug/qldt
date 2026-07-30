import type { Complaint, ComplaintStatus, Role } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function getHanXuLyMacDinh(): Promise<number> {
  const config = await prisma.systemConfig.findFirst()
  return config?.hanXuLyMacDinh ?? 30
}

export function tinhHanXuLy(ngayTiepNhan: Date, soNgay: number): Date {
  const d = new Date(ngayTiepNhan)
  d.setDate(d.getDate() + soNgay)
  return d
}

export function isQuaHan(complaint: Pick<Complaint, 'hanXuLy' | 'trangThai'>, now = new Date()): boolean {
  if (complaint.trangThai === 'HOAN_THANH') return false
  return now.getTime() > new Date(complaint.hanXuLy).getTime()
}

/** Role chịu trách nhiệm hành động tiếp theo, theo Ma trận quyền theo bước xử lý trong CLAUDE.md. */
export function getResponsibleRole(complaint: Pick<Complaint, 'trangThai' | 'daSubmitKetQua'>): Role | null {
  switch (complaint.trangThai) {
    case 'CHO_TIEP_NHAN_TU_PHAP':
      return 'TU_PHAP'
    case 'CHO_LANH_DAO_PHAN_CONG':
      return 'LANH_DAO'
    case 'DA_TIEP_NHAN':
      return 'TU_PHAP'
    case 'DA_PHAN_CONG':
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

export function getResponsibleUserId(
  complaint: Pick<Complaint, 'trangThai' | 'daSubmitKetQua' | 'tuPhapId' | 'lanhDaoId' | 'chuyenVienId'>,
): string | null {
  const role = getResponsibleRole(complaint)
  if (role === 'TU_PHAP') return complaint.tuPhapId
  if (role === 'LANH_DAO') return complaint.lanhDaoId
  if (role === 'CHUYEN_VIEN') return complaint.chuyenVienId
  return null
}

export function isRelated(
  complaint: Pick<Complaint, 'kenh' | 'nguoiTaoId' | 'tuPhapId' | 'chuyenVienId'>,
  userId: string,
  role: Role,
): boolean {
  if (role === 'ADMIN' || role === 'LANH_DAO' || role === 'TRUONG_PHONG') return true
  if (role === 'VAN_THU') return complaint.nguoiTaoId === userId
  if (role === 'TU_PHAP') return complaint.tuPhapId === userId || complaint.kenh === 'TRUC_TIEP'
  if (role === 'CHUYEN_VIEN') return complaint.chuyenVienId === userId
  return false
}

export function canAct(
  complaint: Pick<Complaint, 'trangThai' | 'daSubmitKetQua' | 'tuPhapId' | 'lanhDaoId' | 'chuyenVienId'>,
  userId: string,
  role: Role,
): boolean {
  const requiredRole = getResponsibleRole(complaint)
  if (!requiredRole) return false
  // TRUONG_PHONG có quyền workflow tương đương LANH_DAO (chỉ khác thứ bậc hiển thị/tổ chức)
  const roleMatches = requiredRole === role || (requiredRole === 'LANH_DAO' && role === 'TRUONG_PHONG')
  if (!roleMatches) return false
  const responsibleId = getResponsibleUserId(complaint)
  return responsibleId === null || responsibleId === userId
}

export const ALL_STATUSES: ComplaintStatus[] = [
  'CHO_TIEP_NHAN_TU_PHAP',
  'CHO_LANH_DAO_PHAN_CONG',
  'DA_TIEP_NHAN',
  'DA_PHAN_CONG',
  'DA_XU_LY_CHUYEN_MON',
  'CHO_DOI_THOAI',
  'DA_DOI_THOAI',
  'HOAN_THANH',
]
