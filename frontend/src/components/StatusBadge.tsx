import type { Complaint } from '@/types/domain'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/domain'
import { isQuaHan } from '@/lib/workflow'
import { AlertTriangle } from 'lucide-react'

export function StatusBadge({ complaint }: { complaint: Pick<Complaint, 'trangThai' | 'hanXuLy'> }) {
  const color = STATUS_COLORS[complaint.trangThai]
  const quaHan = isQuaHan(complaint)

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ color, backgroundColor: color + '1a' }}
      >
        {STATUS_LABELS[complaint.trangThai]}
      </span>
      {quaHan && (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-red/10 px-2 py-1 text-xs font-medium text-accent-red">
          <AlertTriangle className="size-3" /> Quá hạn
        </span>
      )}
    </span>
  )
}
