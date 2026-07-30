import { PrismaClient, type Kenh, type ComplaintStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_PASSWORD = '123456'

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const vanPhong = await prisma.department.upsert({
    where: { id: 'dept-van-phong' },
    update: {},
    create: { id: 'dept-van-phong', ten: 'Văn phòng' },
  })
  const banLanhDao = await prisma.department.upsert({
    where: { id: 'dept-lanh-dao' },
    update: {},
    create: { id: 'dept-lanh-dao', ten: 'Ban lãnh đạo' },
  })
  const tuPhapHoTich = await prisma.department.upsert({
    where: { id: 'dept-tu-phap' },
    update: {},
    create: { id: 'dept-tu-phap', ten: 'Tư pháp - Hộ tịch' },
  })
  const kinhTeDoThi = await prisma.department.upsert({
    where: { id: 'dept-kinh-te' },
    update: {},
    create: { id: 'dept-kinh-te', ten: 'Kinh tế - Đô thị' },
  })
  const diaChinh = await prisma.department.upsert({
    where: { id: 'dept-dia-chinh' },
    update: {},
    create: { id: 'dept-dia-chinh', ten: 'Địa chính - Xây dựng' },
  })

  async function upsertUser(
    id: string,
    hoTen: string,
    email: string,
    role: 'ADMIN' | 'VAN_THU' | 'LANH_DAO' | 'TU_PHAP' | 'CHUYEN_VIEN' | 'TRUONG_PHONG',
    departmentId: string,
    chucVu: string,
    soDienThoai: string,
  ) {
    const tenDangNhap = email.split('@')[0]
    return prisma.user.upsert({
      where: { id },
      update: {},
      create: { id, hoTen, email, tenDangNhap, soDienThoai, chucVu, passwordHash, role, departmentId },
    })
  }

  const admin = await upsertUser('u-admin', 'Nguyễn Văn A', 'admin@hiepbinh.gov.vn', 'ADMIN', vanPhong.id, 'Quản trị hệ thống', '0900000001')
  const vanThu = await upsertUser('u-vanthu', 'Trần Thị Vân', 'vanthu@hiepbinh.gov.vn', 'VAN_THU', vanPhong.id, 'Nhân viên Văn thư', '0900000002')
  const lanhDao = await upsertUser('u-lanhdao', 'Hoàng Văn Lãnh', 'lanhdao@hiepbinh.gov.vn', 'LANH_DAO', banLanhDao.id, 'Chủ tịch UBND phường', '0900000003')
  const truongPhong = await upsertUser('u-truongphong', 'Lê Văn Trưởng', 'truongphong@hiepbinh.gov.vn', 'TRUONG_PHONG', kinhTeDoThi.id, 'Trưởng phòng Kinh tế - Đô thị', '0900000004')
  const tuPhap = await upsertUser('u-tuphap', 'Phạm Thị D', 'tuphap@hiepbinh.gov.vn', 'TU_PHAP', tuPhapHoTich.id, 'Chuyên viên Tư pháp', '0900000005')
  const chuyenVien1 = await upsertUser('u-chuyenvien', 'Võ E', 'chuyenvien1@hiepbinh.gov.vn', 'CHUYEN_VIEN', kinhTeDoThi.id, 'Chuyên viên', '0900000006')
  const chuyenVien2 = await upsertUser('u-chuyenvien2', 'Đặng Thị Hoa', 'chuyenvien2@hiepbinh.gov.vn', 'CHUYEN_VIEN', diaChinh.id, 'Chuyên viên', '0900000007')

  await prisma.systemConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', hanXuLyMacDinh: 30 },
  })

  function hanXuLy(ngayTiepNhan: Date, soNgay = 30): Date {
    const d = new Date(ngayTiepNhan)
    d.setDate(d.getDate() + soNgay)
    return d
  }

  interface Seed {
    maSo: string
    kenh: Kenh
    hoTen: string
    ngay: string
    trangThai: ComplaintStatus
    tuPhapId?: string
    lanhDaoId?: string
    chuyenVienId?: string
    daSubmitKetQua?: boolean
  }

  const seeds: Seed[] = [
    { maSo: '009/2026/KN-TT', kenh: 'TRUC_TIEP', hoTen: 'Bùi Chí Hiếu', ngay: '2026-07-05', trangThai: 'CHO_TIEP_NHAN_TU_PHAP' },
    { maSo: '001/2026/KN-TT', kenh: 'TRUC_TIEP', hoTen: 'Nguyễn Thị Hoa', ngay: '2026-06-21', trangThai: 'DA_TIEP_NHAN', tuPhapId: tuPhap.id },
    { maSo: '002/2026/KN-BD', kenh: 'BUU_DIEN', hoTen: 'Trần Văn Minh', ngay: '2026-06-10', trangThai: 'DA_PHAN_CONG', lanhDaoId: lanhDao.id, chuyenVienId: chuyenVien1.id },
    { maSo: '003/2026/KN-TT', kenh: 'TRUC_TIEP', hoTen: 'Lê Thị Bích', ngay: '2026-06-05', trangThai: 'CHO_DOI_THOAI', tuPhapId: tuPhap.id, chuyenVienId: chuyenVien2.id, daSubmitKetQua: true },
    { maSo: '004/2026/KN-BD', kenh: 'BUU_DIEN', hoTen: 'Phạm Quốc Tuấn', ngay: '2026-06-01', trangThai: 'CHO_LANH_DAO_PHAN_CONG' },
    { maSo: '005/2026/KN-TT', kenh: 'TRUC_TIEP', hoTen: 'Võ Thị Lan', ngay: '2026-05-28', trangThai: 'DA_DOI_THOAI', tuPhapId: tuPhap.id, chuyenVienId: chuyenVien1.id, daSubmitKetQua: true },
    { maSo: '006/2026/KN-TT', kenh: 'TRUC_TIEP', hoTen: 'Đinh Văn Hùng', ngay: '2026-05-20', trangThai: 'HOAN_THANH', tuPhapId: tuPhap.id, chuyenVienId: chuyenVien2.id, daSubmitKetQua: true },
    { maSo: '007/2026/KN-BD', kenh: 'BUU_DIEN', hoTen: 'Ngô Thị Thu', ngay: '2026-05-18', trangThai: 'DA_PHAN_CONG', lanhDaoId: lanhDao.id, chuyenVienId: chuyenVien1.id },
    { maSo: '008/2026/KN-BD', kenh: 'BUU_DIEN', hoTen: 'Trương Thị Kim', ngay: '2026-05-10', trangThai: 'DA_XU_LY_CHUYEN_MON', tuPhapId: tuPhap.id, lanhDaoId: lanhDao.id, chuyenVienId: chuyenVien2.id, daSubmitKetQua: true },
  ]

  for (const s of seeds) {
    const ngayTiepNhan = new Date(s.ngay)
    await prisma.complaint.upsert({
      where: { maSo: s.maSo },
      update: {},
      create: {
        maSo: s.maSo,
        kenh: s.kenh,
        hoTenNguoiKhieuNai: s.hoTen,
        soCCCD: '079' + Math.floor(100000000 + Math.random() * 899999999),
        diaChi: 'Phường Hiệp Bình, Thành phố Hồ Chí Minh',
        soDienThoai: '09' + Math.floor(10000000 + Math.random() * 89999999),
        noiDungKhieuNai: 'Khiếu nại liên quan đến tranh chấp ranh giới đất đai và đề nghị xem xét lại quyết định hành chính đã ban hành.',
        ngayTiepNhan,
        hanXuLy: hanXuLy(ngayTiepNhan),
        trangThai: s.trangThai,
        daSubmitKetQua: s.daSubmitKetQua ?? false,
        nguoiTaoId: vanThu.id,
        tuPhapId: s.tuPhapId,
        lanhDaoId: s.lanhDaoId,
        chuyenVienId: s.chuyenVienId,
        attachments: { create: { loai: 'DON_GOC', tenFile: 'don-khieu-nai-goc.pdf', url: '#' } },
        lichSu: {
          create: {
            nguoiThucHienId: vanThu.id,
            role: 'VAN_THU',
            trangThaiTruoc: null,
            trangThaiSau: s.kenh === 'TRUC_TIEP' ? 'CHO_TIEP_NHAN_TU_PHAP' : 'CHO_LANH_DAO_PHAN_CONG',
            ghiChu: 'Tạo đơn, đính kèm đơn gốc.',
          },
        },
      },
    })
  }

  console.log('Đã seed xong dữ liệu mẫu.')
  console.log(`Tài khoản demo (mật khẩu chung: "${DEMO_PASSWORD}"):`)
  ;[admin, vanThu, lanhDao, truongPhong, tuPhap, chuyenVien1, chuyenVien2].forEach((u) => console.log(`  - ${u.email} (${u.role})`))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
