'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import BackendBanner from '@/components/ui/BackendBanner'

export default function MainShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop — tap to close */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-auto flex flex-col">
          <BackendBanner />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  )
}
