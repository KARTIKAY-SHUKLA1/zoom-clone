'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

const PRODUCTS: {
  label: string
  href: string
  badge?: string
  external?: boolean
}[] = [
  { label: 'AI',          href: '#',         badge: 'New', external: true },
  { label: 'Meetings',    href: '/meetings' },
  { label: 'Recordings',  href: '#' },
  { label: 'Summaries',   href: '#' },
  { label: 'Hub',         href: '#',         badge: 'New', external: true },
  { label: 'Whiteboards', href: '#',         external: true },
  { label: 'Notes',       href: '#' },
  { label: 'Clips',       href: '#',         external: true },
  { label: 'Canvas',      href: '#',         external: true },
  { label: 'Paper',       href: '#',         external: true },
  { label: 'Sheets',      href: '#',         external: true },
  { label: 'Slides',      href: '#',         external: true },
  { label: 'Tasks',       href: '#',         external: true },
  { label: 'Scheduler',   href: '#',         external: true },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-y-auto">
      {/* Home */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/"
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-blue-50 text-[#0B5CFF]'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Home
        </Link>
      </div>

      {/* My Products */}
      <div className="px-3 pt-3 flex-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
          My Products
        </p>
        <div className="space-y-0.5">
          {PRODUCTS.map(({ label, href, badge, external }) => {
            const active = href !== '#' && pathname.startsWith(href)
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] transition-colors group ${
                  active
                    ? 'text-[#0B5CFF] bg-blue-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{label}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {badge && (
                    <span className="text-[10px] bg-blue-100 text-[#0B5CFF] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                      {badge}
                    </span>
                  )}
                  {external && (
                    <ExternalLink
                      size={11}
                      className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Discover More Products */}
      <div className="px-6 py-3 border-t border-gray-100 mt-2">
        <button className="text-[13px] text-[#0B5CFF] hover:underline">
          Discover More Products
        </button>
      </div>
    </aside>
  )
}
