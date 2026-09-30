'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const PRODUCTS: {
  label: string
  href: string
  badge?: string
  external?: boolean
}[] = [
  { label: 'AI',          href: '#',         badge: 'New', external: true },
  { label: 'Meetings',    href: '/meetings' },
  { label: 'Recordings',  href: '#',         external: true },
  { label: 'Summaries',   href: '#',         external: true },
  { label: 'Hub',         href: '#',         badge: 'New', external: true },
  { label: 'Whiteboards', href: '#',         external: true },
  { label: 'Notes',       href: '#',         external: true },
  { label: 'Clips',       href: '#',         external: true },
  { label: 'Canvas',      href: '#',         external: true },
  { label: 'Paper',       href: '#',         external: true },
  { label: 'Sheets',      href: '#',         external: true },
  { label: 'Slides',      href: '#',         external: true },
  { label: 'Tasks',       href: '#',         external: true },
  { label: 'Scheduler',   href: '#',         external: true },
]

export default function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className={[
        'portal-sidebar flex flex-col',
        // Mobile: fixed full-height drawer
        'fixed inset-y-0 left-0 z-40 w-[220px]',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: inline, always visible
        'md:relative md:inset-auto md:z-auto md:translate-x-0',
        'md:flex-shrink-0',
      ].join(' ')}
    >
      {/* Mobile close button */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[#0B5CFF] font-bold text-xl">zoom</span>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Home */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/"
          onClick={onClose}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'text-[#0B5CFF]'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Home
        </Link>
      </div>

      {/* My Products */}
      <div className="px-3 pt-2 flex-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
          My Products
        </p>
        <div className="space-y-0.5">
          {PRODUCTS.map(({ label, href, badge, external }) => {
            const active = href !== '#' && pathname.startsWith(href)
            return (
              <Link
                aria-disabled={href === '#' || undefined}
                tabIndex={href === '#' ? -1 : undefined}
                key={label}
                href={href}
                onClick={(event) => { if (href === '#') event.preventDefault(); else onClose() }}
                className={`flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                  active
                    ? 'sidebar-selected text-[#0B5CFF] font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{label}</span>
                {/* Icons always visible (not hover-only) — matching real Zoom */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {badge && (
                    <span className="text-[10px] bg-blue-100 text-[#0B5CFF] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                      {badge}
                    </span>
                  )}
                  {external && (
                    <ExternalLink size={11} className="text-gray-400" />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Discover More */}
      <div className="sidebar-discover">
        <button className="text-[13px] text-[#0B5CFF] hover:underline">
          Discover More Products
        </button>
      </div>
    <div className="sidebar-account">{['My Account', 'Admin', 'Support'].map(label => <details key={label}><summary>{label}</summary><p>Available as a placeholder in this assignment.</p></details>)}<a href="https://zoom.us/pricing" target="_blank" rel="noreferrer">Upgrade to Pro</a></div></aside>
  )
}
