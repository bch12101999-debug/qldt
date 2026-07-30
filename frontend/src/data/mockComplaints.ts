import type { Complaint } from '@/types/domain'
import { tinhHanXuLy } from '@/lib/workflow'

function seed(
  partial: Pick<
    Complaint,
    | 'maSo'
    | 'kenh'
    | 'hoTenNguoiKhieuNai'
    | 'ngayTiepNhan'
    | 'trangThai'
    | 'tuPhapId'
    | 'lanhDaoId'
    | 'chuyenVienId'
  > & { daSubmitKetQua?: boolean },
): Complaint {
  return {
    id: partial.maSo,
    maSo: partial.maSo,
    kenh: partial.kenh,
    hoTenNguoiKhieuNai: partial.hoTenNguoiKhieuNai,
    soCCCD: '079' + Math.floor(100000000 + Math.random() * 899999999),
    diaChi: 'Phường Hiệp Bình, Thành phố Hồ Chí Minh',
    soDienThoai: '09' + Math.floor(10000000 + Math.random() * 89999999),
    noiDungKhieuNai:
      'Khiếu nại liên quan đến tranh chấp ranh giới đất đai và đề nghị xem xét lại quyết định hành chính đã ban hành.',
    ngayTiepNhan: partial.ngayTiepNhan,
    hanXuLy: tinhHanXuLy(partial.ngayTiepNhan),
    trangThai: partial.trangThai,
    daSubmitKetQua: partial.daSubmitKetQua ?? false,
    nguoiTaoId: 'u-vanthu',
    tuPhapId: partial.tuPhapId,
    lanhDaoId: partial.lanhDaoId,
    chuyenVienId: partial.chuyenVienId,
    attachments: [
      { id: partial.maSo + '-don-goc', loai: 'DON_GOC', tenFile: 'don-khieu-nai-goc.pdf', url: '#', uploadedAt: partial.ngayTiepNhan },
    ],
    lichSu: [
      {
        id: partial.maSo + '-h1',
        thoiDiem: partial.ngayTiepNhan,
        nguoiThucHien: 'Trần Thị Vân',
        role: 'VAN_THU',
        trangThaiTruoc: null,
        trangThaiSau: partial.kenh === 'TRUC_TIEP' ? 'CHO_TIEP_NHAN_TU_PHAP' : 'CHO_LANH_DAO_PHAN_CONG',
        ghiChu: 'Tạo đơn, đính kèm đơn gốc.',
      },
    ],
    stepData: {},
  }
}

export const mockComplaints: Complaint[] = [
  seed({
    maSo: '009/2026/KN-TT',
    kenh: 'TRUC_TIEP',
    hoTenNguoiKhieuNai: 'Bùi Chí Hiếu',
    ngayTiepNhan: '2026-07-05',
    trangThai: 'CHO_TIEP_NHAN_TU_PHAP',
    tuPhapId: null,
    lanhDaoId: null,
    chuyenVienId: null,
  }),
  seed({
    maSo: '001/2026/KN-TT',
    kenh: 'TRUC_TIEP',
    hoTenNguoiKhieuNai: 'Nguyễn Thị Hoa',
    ngayTiepNhan: '2026-06-21',
    trangThai: 'DA_TIEP_NHAN',
    tuPhapId: 'u-tuphap',
    lanhDaoId: null,
    chuyenVienId: null,
  }),
  seed({
    maSo: '002/2026/KN-BD',
    kenh: 'BUU_DIEN',
    hoTenNguoiKhieuNai: 'Trần Văn Minh',
    ngayTiepNhan: '2026-06-10',
    trangThai: 'DA_PHAN_CONG',
    tuPhapId: null,
    lanhDaoId: 'u-lanhdao',
    chuyenVienId: 'u-chuyenvien',
  }),
  seed({
    maSo: '003/2026/KN-TT',
    kenh: 'TRUC_TIEP',
    hoTenNguoiKhieuNai: 'Lê Thị Bích',
    ngayTiepNhan: '2026-06-05',
    trangThai: 'CHO_DOI_THOAI',
    tuPhapId: 'u-tuphap',
    lanhDaoId: null,
    chuyenVienId: 'u-chuyenvien2',
    daSubmitKetQua: true,
  }),
  seed({
    maSo: '004/2026/KN-BD',
    kenh: 'BUU_DIEN',
    hoTenNguoiKhieuNai: 'Phạm Quốc Tuấn',
    ngayTiepNhan: '2026-06-01',
    trangThai: 'CHO_LANH_DAO_PHAN_CONG',
    tuPhapId: null,
    lanhDaoId: null,
    chuyenVienId: null,
  }),
  seed({
    maSo: '005/2026/KN-TT',
    kenh: 'TRUC_TIEP',
    hoTenNguoiKhieuNai: 'Võ Thị Lan',
    ngayTiepNhan: '2026-05-28',
    trangThai: 'DA_DOI_THOAI',
    tuPhapId: 'u-tuphap',
    lanhDaoId: null,
    chuyenVienId: 'u-chuyenvien',
    daSubmitKetQua: true,
  }),
  seed({
    maSo: '006/2026/KN-TT',
    kenh: 'TRUC_TIEP',
    hoTenNguoiKhieuNai: 'Đinh Văn Hùng',
    ngayTiepNhan: '2026-05-20',
    trangThai: 'HOAN_THANH',
    tuPhapId: 'u-tuphap',
    lanhDaoId: null,
    chuyenVienId: 'u-chuyenvien2',
    daSubmitKetQua: true,
  }),
  seed({
    maSo: '007/2026/KN-BD',
    kenh: 'BUU_DIEN',
    hoTenNguoiKhieuNai: 'Ngô Thị Thu',
    ngayTiepNhan: '2026-05-18',
    trangThai: 'DA_PHAN_CONG',
    tuPhapId: null,
    lanhDaoId: 'u-lanhdao',
    chuyenVienId: 'u-chuyenvien',
  }),
  seed({
    maSo: '008/2026/KN-BD',
    kenh: 'BUU_DIEN',
    hoTenNguoiKhieuNai: 'Trương Thị Kim',
    ngayTiepNhan: '2026-05-10',
    trangThai: 'DA_XU_LY_CHUYEN_MON',
    tuPhapId: 'u-tuphap',
    lanhDaoId: 'u-lanhdao',
    chuyenVienId: 'u-chuyenvien2',
    daSubmitKetQua: true,
  }),
]
