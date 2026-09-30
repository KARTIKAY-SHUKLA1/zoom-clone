'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import PortalFooter from '@/components/layout/PortalFooter'
import BackendBanner from '@/components/ui/BackendBanner'

export default function MainShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="portal-shell">
      <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />

      <div className="portal-body">
        {/* Mobile backdrop — tap to close */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="portal-main">
          <BackendBanner />
          <div className="flex-1">{children}</div>
        </main>
      </div>
      <PortalFooter />
    </div>
  )
}
