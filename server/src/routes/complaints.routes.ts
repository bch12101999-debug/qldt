import { Router } from 'express'
import type { ComplaintStatus, Kenh } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole } from '../middlewares/auth'
import { upload } from '../middlewares/upload'
import { canAct, getHanXuLyMacDinh, getResponsibleUserId, isRelated, tinhHanXuLy } from '../services/workflow'

export const complaintsRouter = Router()

function attachmentUrl(filename: string): string {
  return `/api/uploads/${filename}`
}

async function sinhMaSo(kenh: Kenh): Promise<string> {
  const nam = new Date().getFullYear()
  const count = await prisma.complaint.count({ where: { maSo: { contains: `/${nam}/` } } })
  const so = String(count + 1).padStart(3, '0')
  return `${so}/${nam}/KN-${kenh === 'TRUC_TIEP' ? 'TT' : 'BD'}`
}

async function notify(userId: string | null | undefined, complaintId: string, noiDung: string) {
  if (!userId) return
  await prisma.notification.create({ data: { userId, complaintId, noiDung } })
}

complaintsRouter.get('/', requireAuth, async (req, res) => {
  const { kenh, trangThai, tuNgay, denNgay, search, page = '1', pageSize = '8' } = req.query as Record<string, string>

  const all = await prisma.complaint.findMany({
    orderBy: { ngayTiepNhan: 'desc' },
    include: {
      attachments: { orderBy: { uploadedAt: 'asc' } },
      lichSu: { include: { nguoiThucHien: { select: { hoTen: true } } }, orderBy: { thoiDiem: 'asc' } },
      stepData: true,
    },
  })
  let items = all.filter((c) => isRelated(c, req.user!.userId, req.user!.role))

  if (kenh && kenh !== 'ALL') items = items.filter((c) => c.kenh === kenh)
  if (trangThai && trangThai !== 'ALL') items = items.filter((c) => c.trangThai === (trangThai as ComplaintStatus))
  if (tuNgay) items = items.filter((c) => c.ngayTiepNhan >= new Date(tuNgay))
  if (denNgay) items = items.filter((c) => c.ngayTiepNhan <= new Date(denNgay))
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((c) => c.maSo.toLowerCase().includes(q) || c.hoTenNguoiKhieuNai.toLowerCase().includes(q))
  }

  const total = items.length
  const p = Number(page) || 1
  const ps = Number(pageSize) || 8
  const paged = items.slice((p - 1) * ps, (p - 1) * ps + ps)

  res.json({
    items: paged.map((c) => ({ ...c, nguoiPhuTrachId: getResponsibleUserId(c) })),
    total,
  })
})

complaintsRouter.get('/:id', requireAuth, async (req, res) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: String(req.params.id) },
    include: {
      attachments: { orderBy: { uploadedAt: 'asc' } },
      lichSu: { include: { nguoiThucHien: { select: { hoTen: true } } }, orderBy: { thoiDiem: 'asc' } },
      stepData: true,
    },
  })
  if (!complaint) return res.status(404).json({ message: 'Không tìm thấy đơn' })
  res.json({ ...complaint, nguoiPhuTrachId: getResponsibleUserId(complaint) })
})

complaintsRouter.post('/', requireAuth, requireRole('VAN_THU'), upload.array('files', 10), async (req, res) => {
  const { kenh, hoTenNguoiKhieuNai, soCCCD, diaChi, soDienThoai, noiDungKhieuNai, tuPhapId, lanhDaoId } = req.body ?? {}
  if (!kenh || !hoTenNguoiKhieuNai || !soCCCD || !diaChi || !soDienThoai || !noiDungKhieuNai) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' })
  }
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (files.length === 0) {
    return res.status(400).json({ message: 'Bắt buộc đính kèm file đơn gốc (PDF/JPG/PNG)' })
  }
  if (kenh === 'TRUC_TIEP' && !tuPhapId) {
    return res.status(400).json({ message: 'Bắt buộc chọn chuyên viên Tư pháp tiếp nhận' })
  }
  if (kenh === 'BUU_DIEN' && !lanhDaoId) {
    return res.status(400).json({ message: 'Bắt buộc chọn Lãnh đạo bút phê' })
  }

  const ngayTiepNhan = new Date()
  const hanXuLyMacDinh = await getHanXuLyMacDinh()
  const trangThaiKhoiDau: ComplaintStatus = kenh === 'TRUC_TIEP' ? 'CHO_TIEP_NHAN_TU_PHAP' : 'CHO_LANH_DAO_PHAN_CONG'
  const maSo = await sinhMaSo(kenh as Kenh)

  const complaint = await prisma.complaint.create({
    data: {
      maSo,
      kenh: kenh as Kenh,
      hoTenNguoiKhieuNai,
      soCCCD,
      diaChi,
      soDienThoai,
      noiDungKhieuNai,
      ngayTiepNhan,
      hanXuLy: tinhHanXuLy(ngayTiepNhan, hanXuLyMacDinh),
      trangThai: trangThaiKhoiDau,
      nguoiTaoId: req.user!.userId,
      tuPhapId: kenh === 'TRUC_TIEP' ? tuPhapId : undefined,
      lanhDaoId: kenh === 'BUU_DIEN' ? lanhDaoId : undefined,
      attachments: { create: files.map((f) => ({ loai: 'DON_GOC' as const, tenFile: f.originalname, url: attachmentUrl(f.filename) })) },
      lichSu: {
        create: {
          nguoiThucHienId: req.user!.userId,
          role: 'VAN_THU',
          trangThaiTruoc: null,
          trangThaiSau: trangThaiKhoiDau,
          ghiChu: 'Tạo đơn, đính kèm đơn gốc.',
        },
      },
    },
  })

  if (kenh === 'TRUC_TIEP') {
    await notify(tuPhapId, complaint.id, `Đơn ${maSo} vừa được tiếp nhận, chờ bạn xử lý.`)
  } else {
    await notify(lanhDaoId, complaint.id, `Đơn ${maSo} (bưu điện) chờ bạn bút phê.`)
  }

  res.status(201).json(complaint)
})

complaintsRouter.post('/:id/actions', requireAuth, upload.array('files', 10), async (req, res) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: String(req.params.id) } })
  if (!complaint) return res.status(404).json({ message: 'Không tìm thấy đơn' })

  if (!canAct(complaint, req.user!.userId, req.user!.role)) {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này ở bước hiện tại' })
  }

  const { type } = req.body
  const truoc = complaint.trangThai
  const files = (req.files as Express.Multer.File[] | undefined) ?? []

  try {
    switch (type) {
      case 'TIEP_NHAN': {
        const { soThongBao, ngayBanHanh, ghiChu, chuyenVienId } = req.body
        if (complaint.trangThai !== 'CHO_TIEP_NHAN_TU_PHAP') throw new Error('Sai trạng thái để tiếp nhận')
        if (!soThongBao || !ngayBanHanh || !chuyenVienId) throw new Error('Thiếu Số thông báo/Ngày ban hành/Chuyên viên')
        if (files.length === 0) throw new Error('Bắt buộc đính kèm file Thông báo tiếp nhận (PDF/JPG/PNG)')

        await prisma.$transaction([
          prisma.complaint.update({
            where: { id: complaint.id },
            data: { tuPhapId: req.user!.userId, chuyenVienId, trangThai: 'DA_XU_LY_CHUYEN_MON', daSubmitKetQua: false },
          }),
          ...files.map((f) =>
            prisma.complaintAttachment.create({
              data: { complaintId: complaint.id, loai: 'THONG_BAO_TIEP_NHAN', tenFile: f.originalname, url: attachmentUrl(f.filename) },
            }),
          ),
          prisma.complaintStepData.create({ data: { complaintId: complaint.id, buoc: 'tiepNhan', duLieu: { soThongBao, ngayBanHanh, ghiChu } } }),
          prisma.complaintStatusHistory.create({
            data: { complaintId: complaint.id, nguoiThucHienId: req.user!.userId, role: req.user!.role, trangThaiTruoc: truoc, trangThaiSau: 'DA_XU_LY_CHUYEN_MON', ghiChu: `Tiếp nhận đơn (Thông báo số ${soThongBao}) và chuyển hồ sơ cho chuyên viên.` },
          }),
        ])
        await notify(chuyenVienId, complaint.id, `Bạn được phân công xử lý đơn ${complaint.maSo}.`)
        break
      }
      case 'BUT_PHE': {
        const { noiDungChiDao, chuyenVienId } = req.body
        if (complaint.trangThai !== 'CHO_LANH_DAO_PHAN_CONG') throw new Error('Sai trạng thái để bút phê')
        if (!noiDungChiDao || !chuyenVienId) throw new Error('Thiếu Nội dung chỉ đạo/Chuyên viên')

        await prisma.$transaction([
          prisma.complaint.update({
            where: { id: complaint.id },
            data: { lanhDaoId: req.user!.userId, chuyenVienId, trangThai: 'DA_XU_LY_CHUYEN_MON', daSubmitKetQua: false },
          }),
          ...files.map((f) =>
            prisma.complaintAttachment.create({ data: { complaintId: complaint.id, loai: 'BUT_PHE' as const, tenFile: f.originalname, url: attachmentUrl(f.filename) } }),
          ),
          prisma.complaintStepData.create({ data: { complaintId: complaint.id, buoc: 'butPhe', duLieu: { noiDungChiDao } } }),
          prisma.complaintStatusHistory.create({
            data: { complaintId: complaint.id, nguoiThucHienId: req.user!.userId, role: req.user!.role, trangThaiTruoc: truoc, trangThaiSau: 'DA_XU_LY_CHUYEN_MON', ghiChu: 'Bút phê, chỉ đạo và phân công chuyên viên xử lý.' },
          }),
        ])
        await notify(chuyenVienId, complaint.id, `Bạn được phân công xử lý đơn ${complaint.maSo}.`)
        break
      }
      case 'SUBMIT_KET_QUA': {
        const { noiDungXacMinh, ketQuaXuLy, deXuat } = req.body
        if (complaint.trangThai !== 'DA_XU_LY_CHUYEN_MON' || complaint.daSubmitKetQua) throw new Error('Sai trạng thái để nộp kết quả')
        if (!noiDungXacMinh || !ketQuaXuLy) throw new Error('Thiếu Nội dung xác minh/Kết quả xử lý')
        if (files.length === 0) throw new Error('Bắt buộc đính kèm file kết quả xử lý (PDF/JPG/PNG)')

        await prisma.$transaction([
          prisma.complaint.update({ where: { id: complaint.id }, data: { daSubmitKetQua: true } }),
          ...files.map((f) =>
            prisma.complaintAttachment.create({ data: { complaintId: complaint.id, loai: 'KET_QUA_XU_LY', tenFile: f.originalname, url: attachmentUrl(f.filename) } }),
          ),
          prisma.complaintStepData.create({ data: { complaintId: complaint.id, buoc: 'xuLyChuyenMon', duLieu: { noiDungXacMinh, ketQuaXuLy, deXuat } } }),
          prisma.complaintStatusHistory.create({
            data: { complaintId: complaint.id, nguoiThucHienId: req.user!.userId, role: req.user!.role, trangThaiTruoc: truoc, trangThaiSau: 'DA_XU_LY_CHUYEN_MON', ghiChu: 'Chuyên viên đã nộp kết quả xử lý chuyên môn.' },
          }),
        ])
        if (complaint.tuPhapId) await notify(complaint.tuPhapId, complaint.id, `Chuyên viên đã nộp kết quả xử lý đơn ${complaint.maSo}, chờ Tư pháp lên lịch đối thoại.`)
        break
      }
      case 'LEN_LICH_DOI_THOAI': {
        const { ngayDoiThoai, diaDiem, thanhPhan } = req.body
        if (complaint.trangThai !== 'DA_XU_LY_CHUYEN_MON' || !complaint.daSubmitKetQua) throw new Error('Sai trạng thái để lên lịch đối thoại')
        if (!ngayDoiThoai || !diaDiem) throw new Error('Thiếu Ngày đối thoại/Địa điểm')

        await prisma.$transaction([
          prisma.complaint.update({ where: { id: complaint.id }, data: { trangThai: 'CHO_DOI_THOAI' } }),
          prisma.complaintStepData.create({ data: { complaintId: complaint.id, buoc: 'lenLichDoiThoai', duLieu: { ngayDoiThoai, diaDiem, thanhPhan } } }),
          prisma.complaintStatusHistory.create({
            data: { complaintId: complaint.id, nguoiThucHienId: req.user!.userId, role: req.user!.role, trangThaiTruoc: truoc, trangThaiSau: 'CHO_DOI_THOAI', ghiChu: `Lên lịch đối thoại ngày ${ngayDoiThoai} tại ${diaDiem}.` },
          }),
        ])
        break
      }
      case 'UPLOAD_BIEN_BAN': {
        if (complaint.trangThai !== 'CHO_DOI_THOAI') throw new Error('Sai trạng thái để upload biên bản đối thoại')
        if (files.length === 0) throw new Error('Bắt buộc đính kèm file Biên bản đối thoại (PDF/JPG/PNG)')

        await prisma.$transaction([
          prisma.complaint.update({ where: { id: complaint.id }, data: { trangThai: 'DA_DOI_THOAI' } }),
          ...files.map((f) =>
            prisma.complaintAttachment.create({ data: { complaintId: complaint.id, loai: 'BIEN_BAN_DOI_THOAI', tenFile: f.originalname, url: attachmentUrl(f.filename) } }),
          ),
          prisma.complaintStatusHistory.create({
            data: { complaintId: complaint.id, nguoiThucHienId: req.user!.userId, role: req.user!.role, trangThaiTruoc: truoc, trangThaiSau: 'DA_DOI_THOAI', ghiChu: 'Đã hoàn tất đối thoại, đính kèm biên bản.' },
          }),
        ])
        break
      }
      case 'BAN_HANH_QUYET_DINH': {
        const { soQuyetDinh, ngayKy, noiDungTomTat } = req.body
        if (complaint.trangThai !== 'DA_DOI_THOAI') throw new Error('Sai trạng thái để ban hành quyết định')
        if (!soQuyetDinh || !ngayKy || !noiDungTomTat) throw new Error('Thiếu Số quyết định/Ngày ký/Nội dung tóm tắt')
        if (files.length === 0) throw new Error('Bắt buộc đính kèm file Quyết định giải quyết (PDF/JPG/PNG)')

        await prisma.$transaction([
          prisma.complaint.update({ where: { id: complaint.id }, data: { trangThai: 'HOAN_THANH' } }),
          ...files.map((f) =>
            prisma.complaintAttachment.create({ data: { complaintId: complaint.id, loai: 'QUYET_DINH_GIAI_QUYET', tenFile: f.originalname, url: attachmentUrl(f.filename) } }),
          ),
          prisma.complaintStepData.create({ data: { complaintId: complaint.id, buoc: 'quyetDinh', duLieu: { soQuyetDinh, ngayKy, noiDungTomTat } } }),
          prisma.complaintStatusHistory.create({
            data: { complaintId: complaint.id, nguoiThucHienId: req.user!.userId, role: req.user!.role, trangThaiTruoc: truoc, trangThaiSau: 'HOAN_THANH', ghiChu: `Ban hành Quyết định số ${soQuyetDinh}.` },
          }),
        ])
        await notify(complaint.nguoiTaoId, complaint.id, `Đơn ${complaint.maSo} đã hoàn thành.`)
        if (complaint.lanhDaoId) await notify(complaint.lanhDaoId, complaint.id, `Đơn ${complaint.maSo} đã hoàn thành.`)
        break
      }
      default:
        throw new Error('Hành động không hợp lệ')
    }
  } catch (err) {
    return res.status(400).json({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra' })
  }

  const updated = await prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: {
      attachments: { orderBy: { uploadedAt: 'asc' } },
      lichSu: { include: { nguoiThucHien: { select: { hoTen: true } } }, orderBy: { thoiDiem: 'asc' } },
      stepData: true,
    },
  })
  res.json(updated)
})
