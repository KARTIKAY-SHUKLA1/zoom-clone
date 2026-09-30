'use client'

import { useEffect, useState } from 'react'
import { Search, ChevronDown, Menu, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { User } from '@/types'
import Modal from '@/components/ui/Modal'
import ZoomLogo from './ZoomLogo'

interface Props {
  onMenuClick: () => void
  compact?: boolean
}

export default function Topbar({ onMenuClick, compact = false }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { api.users.me().then(setUser).catch(() => {}) }, [])
  const host = async () => {
    setBusy(true); setError('')
    try { const m = await api.meetings.instant(); router.push(`/room/${m.meeting_id}`) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not start meeting.') }
    finally { setBusy(false) }
  }
  return (
    <div className={`portal-topbar ${compact ? 'compact-topbar' : ''}`}>
      {/* ── Dark utility bar ──────────────────────────────────────────── */}
      <div className="utility-bar">
        {/* Left: Search · Support · Phone */}
        <div className="utility-links">
          <Link href="/meetings" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
            <Search size={11} /> Search
          </Link>
          <a href="https://support.zoom.com" target="_blank" rel="noreferrer" className="text-gray-400">Support</a>
          <span className="text-gray-400">1.888.799.9666</span>
        </div>
        {/* Right: Contact Sales · Request a Demo */}
        <div className="utility-sales">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">Contact Sales</button>
          <button className="text-gray-400 hover:text-gray-200 transition-colors">Request a Demo</button>
        </div>
      </div>

      {/* ── White product nav bar (no search) ────────────────────────── */}
      <div className="product-bar">
        {/* Left: hamburger (mobile) + logo + nav links (desktop) */}
        <div className="product-left">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="select-none flex-shrink-0">
            <ZoomLogo />
          </Link>

          <nav className="product-navigation">
            {['Products', 'Solutions', 'Resources'].map((label) => (
              <button
                disabled
                title="Product navigation placeholder"
                key={label}
                className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <a href="https://zoom.us/pricing" target="_blank" rel="noreferrer" className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
              Plans &amp; Pricing
            </a>
          </nav>
        </div>

        {/* Right: action links + avatar (no search bar) */}
        <div className="product-actions">
          <Link href="/meetings/schedule" className="hidden xl:block text-[13px] text-gray-700 hover:text-gray-900 transition-colors">Schedule</Link>
          <Link href="/join" className="hidden xl:block text-[13px] text-gray-700 hover:text-gray-900 transition-colors">Join</Link>
          <button onClick={host} disabled={busy} className="hidden xl:flex items-center gap-0.5 text-[13px] text-gray-700 hover:text-gray-900 transition-colors">
            Host <ChevronDown size={12} />
          </button>
          <Link href="/" className="hidden xl:flex items-center gap-0.5 text-[13px] text-gray-700 hover:text-gray-900 transition-colors">
            Web App <ChevronDown size={12} />
          </Link>
          <button aria-label="Settings placeholder" title="Settings placeholder" disabled className="text-gray-600 p-2"><Settings size={18} /></button>
          <button aria-label="Profile" onClick={() => setProfile(true)} className="portal-avatar">{user?.avatar_initials ?? 'AM'}</button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-4 py-2">{error}</p>}
      {profile && <Modal title="Profile" onClose={() => setProfile(false)}><p className="font-semibold">{user?.name ?? 'Default user'}</p><p className="text-sm text-gray-600 mt-2">{user?.email}</p><p className="text-sm text-gray-600 mt-2">{user?.plan}</p></Modal>}
    </div>
  )
}
