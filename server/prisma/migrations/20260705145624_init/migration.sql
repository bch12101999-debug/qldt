-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VAN_THU', 'LANH_DAO', 'TU_PHAP', 'CHUYEN_VIEN');

-- CreateEnum
CREATE TYPE "Kenh" AS ENUM ('TRUC_TIEP', 'BUU_DIEN');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('CHO_TIEP_NHAN_TU_PHAP', 'CHO_LANH_DAO_PHAN_CONG', 'DA_TIEP_NHAN', 'DA_PHAN_CONG', 'DA_XU_LY_CHUYEN_MON', 'CHO_DOI_THOAI', 'DA_DOI_THOAI', 'HOAN_THANH');

-- CreateEnum
CREATE TYPE "AttachmentLoai" AS ENUM ('DON_GOC', 'THONG_BAO_TIEP_NHAN', 'BUT_PHE', 'KET_QUA_XU_LY', 'BIEN_BAN_DOI_THOAI', 'QUYET_DINH_GIAI_QUYET');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "daKhoa" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "maSo" TEXT NOT NULL,
    "kenh" "Kenh" NOT NULL,
    "hoTenNguoiKhieuNai" TEXT NOT NULL,
    "soCCCD" TEXT NOT NULL,
    "diaChi" TEXT NOT NULL,
    "soDienThoai" TEXT NOT NULL,
    "noiDungKhieuNai" TEXT NOT NULL,
    "ngayTiepNhan" TIMESTAMP(3) NOT NULL,
    "hanXuLy" TIMESTAMP(3) NOT NULL,
    "trangThai" "ComplaintStatus" NOT NULL,
    "daSubmitKetQua" BOOLEAN NOT NULL DEFAULT false,
    "nguoiTaoId" TEXT NOT NULL,
    "tuPhapId" TEXT,
    "lanhDaoId" TEXT,
    "chuyenVienId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_step_data" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "buoc" TEXT NOT NULL,
    "duLieu" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_step_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_attachments" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "loai" "AttachmentLoai" NOT NULL,
    "tenFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_status_history" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "trangThaiTruoc" "ComplaintStatus",
    "trangThaiSau" "ComplaintStatus" NOT NULL,
    "ghiChu" TEXT,
    "thoiDiem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "daDoc" BOOLEAN NOT NULL DEFAULT false,
    "thoiDiem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "hanXuLyMacDinh" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_maSo_key" ON "complaints"("maSo");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_nguoiTaoId_fkey" FOREIGN KEY ("nguoiTaoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_tuPhapId_fkey" FOREIGN KEY ("tuPhapId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_lanhDaoId_fkey" FOREIGN KEY ("lanhDaoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_chuyenVienId_fkey" FOREIGN KEY ("chuyenVienId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_step_data" ADD CONSTRAINT "complaint_step_data_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_attachments" ADD CONSTRAINT "complaint_attachments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_nguoiThucHienId_fkey" FOREIGN KEY ("nguoiThucHienId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
