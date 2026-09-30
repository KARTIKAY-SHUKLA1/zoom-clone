'use client'

import Link from 'next/link'
import { Bell, ChevronDown, Home, MessageSquare, CalendarDays, ContactRound, Settings, Search } from 'lucide-react'
import ZoomLogo from './ZoomLogo'

export default function WorkplaceFrame({ children, initials, inMeeting = false }: { children: React.ReactNode; initials: string; inMeeting?: boolean }) {
  return <div className={`workplace-frame ${inMeeting ? 'in-meeting' : ''}`}><header className="workplace-header"><Link href="/" aria-label="Zoom home"><ZoomLogo /></Link><span className="workplace-brand">Workplace</span><div className="workplace-links"><button disabled>Discover Products <ChevronDown size={14} /></button><a href="https://zoom.us/pricing" target="_blank" rel="noreferrer">Pricing</a></div>{inMeeting && <div className="workplace-search"><Search size={18} /><span>Search</span><span>Ctrl+K</span></div>}<div className="workplace-header-right"><button disabled>Admin Center</button><button disabled>Download</button><a href="https://zoom.us/pricing" target="_blank" rel="noreferrer">Upgrade</a><Bell size={20} /><span className="portal-avatar">{initials}</span></div></header><div className="workplace-body"><nav className="workplace-rail"><Link href="/"><Home /><span>Home</span></Link><button disabled><MessageSquare /><span>Chat</span></button><Link href="/meetings"><CalendarDays /><span>Meetings</span></Link><button disabled><ContactRound /><span>Contacts</span></button><button disabled className="workplace-settings" title="Settings placeholder"><Settings /><span>Settings</span></button></nav><div className="workplace-meeting">{children}</div></div></div>
}
