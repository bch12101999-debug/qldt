-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TRUONG_PHONG';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "chucVu" TEXT,
ADD COLUMN     "soDienThoai" TEXT,
ADD COLUMN     "tenDangNhap" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_tenDangNhap_key" ON "users"("tenDangNhap");

