import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud, FileCheck2, X } from 'lucide-react'

interface FileUploadProps {
  label?: string
  required?: boolean
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  maxSizeMb?: number
  error?: string
}

export function FileUpload({
  label = 'Tài liệu đính kèm',
  required,
  files,
  onChange,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMb = 10,
  error,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function validateAndAdd(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList)
    const valid: File[] = []
    let error: string | null = null

    for (const f of incoming) {
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext ?? '')) {
        error = `File "${f.name}" không đúng định dạng PDF/JPG/PNG, đã bị bỏ qua.`
        continue
      }
      if (f.size > maxSizeMb * 1024 * 1024) {
        error = `File "${f.name}" vượt quá ${maxSizeMb}MB, đã bị bỏ qua.`
        continue
      }
      valid.push(f)
    }

    setLocalError(error)
    if (valid.length > 0) onChange([...files, ...valid])
  }

  function removeAt(idx: number) {
    onChange(files.filter((_, i) => i !== idx))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    validateAndAdd(e.dataTransfer.files)
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-primary">
        {label} {required && <span className="text-accent-red">(Bắt buộc đính kèm)</span>}
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary-light' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <UploadCloud className="mb-2 size-8 text-gray-400" />
        <p className="text-sm text-gray-600">
          Kéo thả file vào đây hoặc <span className="font-medium text-primary">nhấn để chọn</span> (có thể chọn nhiều file)
        </p>
        <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG — Tối đa {maxSizeMb}MB/file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            validateAndAdd(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((f, idx) => (
            <li key={`${f.name}-${idx}`} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
              <FileCheck2 className="size-4 shrink-0 text-accent-green" />
              <span className="flex-1 truncate">{f.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(idx)
                }}
                className="shrink-0 rounded p-0.5 hover:bg-gray-200"
                aria-label={`Xóa file ${f.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(localError || error) && <p className="mt-1 text-xs text-accent-red">{localError ?? error}</p>}
    </div>
  )
}
