import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { DanhSachDon } from '@/pages/DanhSachDon'
import { TaoDonMoi } from '@/pages/TaoDonMoi'
import { ChiTietDon } from '@/pages/ChiTietDon'
import { ChoXuLy } from '@/pages/ChoXuLy'
import { TrungTamThongBao } from '@/pages/TrungTamThongBao'
import { TraCuu } from '@/pages/TraCuu'
import { QuanTriHeThong } from '@/pages/QuanTriHeThong'

function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser, isLoading } = useAuth()
  if (isLoading) return <div className="flex min-h-svh items-center justify-center text-gray-400">Đang tải...</div>
  if (!currentUser) return <Navigate to="/dang-nhap" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  if (currentUser?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/don-thu" element={<DanhSachDon />} />
        <Route path="/don-thu/tao-moi" element={<TaoDonMoi />} />
        <Route path="/don-thu/cho-xu-ly" element={<ChoXuLy />} />
        <Route path="/don-thu/:id" element={<ChiTietDon />} />
        <Route path="/tra-cuu" element={<TraCuu />} />
        <Route path="/thong-bao" element={<TrungTamThongBao />} />
        <Route
          path="/quan-tri"
          element={
            <RequireAdmin>
              <QuanTriHeThong />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
