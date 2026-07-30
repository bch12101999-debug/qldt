import { useUsers } from '@/hooks/useUsers'
import type { Role } from '@/types/domain'

interface RoleUserSelectProps {
  role: Role
  label: string
  value: string
  onChange: (v: string) => void
}

export function RoleUserSelect({ role, label, value, onChange }: RoleUserSelectProps) {
  const { users } = useUsers()
  const options = users.filter((u) => u.role === role && !u.daKhoa)
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600">{label} *</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
        <option value="">-- Chọn --</option>
        {options.map((u) => (
          <option key={u.id} value={u.id}>
            {u.hoTen} ({u.phongBan})
          </option>
        ))}
      </select>
    </div>
  )
}
