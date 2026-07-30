import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-svh flex-col bg-bg-page">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 lg:items-start">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="w-full min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
