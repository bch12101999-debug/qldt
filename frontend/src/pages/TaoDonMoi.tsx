import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { createComplaint, ApiError } from '@/api/client'
import { Reveal } from '@/components/Reveal'
import { FileUpload } from '@/components/FileUpload'
import { RoleUserSelect } from '@/components/RoleUserSelect'
import type { Kenh } from '@/types/domain'

const schema = z
  .object({
    kenh: z.enum(['TRUC_TIEP', 'BUU_DIEN']),
    hoTenNguoiKhieuNai: z.string().min(1, 'Bắt buộc nhập họ tên'),
    soCCCD: z.string().min(9, 'Số CCCD không hợp lệ').max(12, 'Số CCCD không hợp lệ'),
    diaChi: z.string().min(1, 'Bắt buộc nhập địa chỉ'),
    soDienThoai: z.string().min(9, 'Số điện thoại không hợp lệ'),
    noiDungKhieuNai: z.string().min(10, 'Nội dung khiếu nại cần chi tiết hơn'),
    tuPhapId: z.string().optional(),
    lanhDaoId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kenh === 'TRUC_TIEP' && !data.tuPhapId) {
      ctx.addIssue({ code: 'custom', path: ['tuPhapId'], message: 'Bắt buộc chọn chuyên viên Tư pháp tiếp nhận' })
    }
    if (data.kenh === 'BUU_DIEN' && !data.lanhDaoId) {
      ctx.addIssue({ code: 'custom', path: ['lanhDaoId'], message: 'Bắt buộc chọn Lãnh đạo bút phê' })
    }
  })

type FormValues = z.infer<typeof schema>

export function TaoDonMoi() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [successMaSo, setSuccessMaSo] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kenh: 'TRUC_TIEP' },
  })

  const kenh = watch('kenh')

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (files.length === 0) {
        setFileError('Bắt buộc đính kèm file đơn gốc')
        throw new ApiError('Thiếu file đính kèm')
      }
      setFileError(null)
      return createComplaint({ ...values, fileNames: files.map((f) => f.name), files }, currentUser!)
    },
    onSuccess: (complaint) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['cho-xu-ly-complaints'] })
      toast.success(`Đã tạo đơn ${complaint.maSo} thành công.`)
      setSuccessMaSo(complaint.maSo)
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
    },
  })

  if (successMaSo) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg bg-bg-card p-8 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-green/10 text-2xl text-brand-green">✓</div>
        <h1 className="text-lg font-bold text-gray-800">Tạo đơn thành công</h1>
        <p className="text-sm text-gray-500">
          Đơn đã được sinh mã số <span className="font-semibold text-primary">{successMaSo}</span> và chuyển đến người phụ trách bước tiếp
          theo.
        </p>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            In Phiếu tiếp nhận
          </button>
          <button onClick={() => navigate(`/don-thu/${encodeURIComponent(successMaSo)}`)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            Xem chi tiết đơn
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <h1 className="mb-4 text-xl font-bold text-gray-800">Tạo đơn khiếu nại mới</h1>
      </Reveal>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
        <Reveal delay={0.05}>
          <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-sm font-semibold text-primary">Kênh tiếp nhận</h2>
            <Controller
              control={control}
              name="kenh"
              render={({ field }) => (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      { value: 'TRUC_TIEP', label: 'Trực tiếp', desc: 'Công dân đến UBND phường' },
                      { value: 'BUU_DIEN', label: 'Bưu điện', desc: 'Gửi qua đường bưu điện' },
                    ] as { value: Kenh; label: string; desc: string }[]
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col rounded-lg border-2 px-4 py-3 transition-colors ${
                        field.value === opt.value ? 'border-primary bg-primary-light' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input type="radio" checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} className="accent-primary" />
                        {opt.label}
                      </span>
                      <span className="ml-6 text-xs text-gray-500">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              )}
            />

            <div className="mt-4">
              {kenh === 'TRUC_TIEP' ? (
                <Controller
                  control={control}
                  name="tuPhapId"
                  render={({ field }) => (
                    <RoleUserSelect role="TU_PHAP" label="Chọn chuyên viên Tư pháp tiếp nhận" value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
              ) : (
                <Controller
                  control={control}
                  name="lanhDaoId"
                  render={({ field }) => (
                    <RoleUserSelect role="LANH_DAO" label="Chọn Lãnh đạo bút phê" value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
              )}
              {errors.tuPhapId && <p className="mt-1 text-xs text-accent-red">{errors.tuPhapId.message}</p>}
              {errors.lanhDaoId && <p className="mt-1 text-xs text-accent-red">{errors.lanhDaoId.message}</p>}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-sm font-semibold text-primary">Thông tin người khiếu nại</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Họ tên người khiếu nại *</label>
                <input {...register('hoTenNguoiKhieuNai')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Nhập họ tên đầy đủ" />
                {errors.hoTenNguoiKhieuNai && <p className="mt-1 text-xs text-accent-red">{errors.hoTenNguoiKhieuNai.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Số CCCD *</label>
                <input {...register('soCCCD')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Nhập số CCCD (12 chữ số)" />
                {errors.soCCCD && <p className="mt-1 text-xs text-accent-red">{errors.soCCCD.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Địa chỉ *</label>
                <input {...register('diaChi')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Số nhà, đường, phường/xã" />
                {errors.diaChi && <p className="mt-1 text-xs text-accent-red">{errors.diaChi.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Số điện thoại *</label>
                <input {...register('soDienThoai')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Nhập số điện thoại liên hệ" />
                {errors.soDienThoai && <p className="mt-1 text-xs text-accent-red">{errors.soDienThoai.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-600">Nội dung khiếu nại *</label>
                <textarea {...register('noiDungKhieuNai')} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Mô tả chi tiết nội dung khiếu nại, tố cáo..." />
                {errors.noiDungKhieuNai && <p className="mt-1 text-xs text-accent-red">{errors.noiDungKhieuNai.message}</p>}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-lg bg-bg-card p-4 shadow-sm sm:p-6">
            <FileUpload label="Tài liệu đính kèm — đơn gốc" required files={files} onChange={setFiles} error={fileError ?? undefined} />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/don-thu')} className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
              {mutation.isPending ? 'Đang lưu...' : 'Lưu và tạo đơn'}
            </button>
          </div>
        </Reveal>
      </form>
    </div>
  )
}
