'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Video, Copy, CheckCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { formatMeetingId, copyText, formatShortDate, formatTime, buildInvitationText, isToday } from '@/lib/utils'
import Link from 'next/link'
import type { Meeting, User } from '@/types'
import Spinner from '@/components/ui/Spinner'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [upcoming, setUpcoming] = useState<Meeting[]>([])
  const [recent, setRecent] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [inviteCopied, setInviteCopied] = useState<number | null>(null)
  const [pmiCopied, setPmiCopied] = useState(false)

  useEffect(() => {
    Promise.all([api.users.me(), api.meetings.list('upcoming'), api.meetings.list('previous')])
      .then(([u, m, r]) => { const today = new Date(); today.setHours(0, 0, 0, 0); setUser(u); setUpcoming(m.filter(meeting => new Date(meeting.start_time) >= today)); setRecent(r) })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const handleHost = async () => {
    setStarting(true)
    try {
      const m = await api.meetings.instant()
      router.push(`/room/${m.meeting_id}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create meeting.'); setStarting(false) }
  }

  const copyPmi = async () => {
    if (!user) return
    try { await copyText(user.personal_meeting_id) }
    catch { setError('Could not copy the personal meeting ID.'); return }
    setPmiCopied(true)
    setTimeout(() => setPmiCopied(false), 2000)
  }

  const pmiDisplay = user ? formatMeetingId(user.personal_meeting_id) : '─── ──── ────'

  return (
    /* White background — matches real app.zoom.us */
    <div className="dashboard-page">

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="dashboard-primary">

        {/* Soft error */}
        {error && !loading && (
          <p className="text-xs text-gray-400 text-center py-2">
            {error} — check the banner above.
          </p>
        )}

        {/* User card */}
        <div className="dashboard-profile">
          {loading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Square-ish avatar matching original */}
                <div className="dashboard-avatar">
                  {user?.avatar_initials ?? 'K'}
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-gray-900 leading-snug">
                    {user?.name ?? '—'}
                  </h2>
                  <p className="text-[13px] text-[#0B5CFF] mt-0.5">
                    Plan: {user?.plan ?? 'Workplace Basic'}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <a href="https://zoom.us/pricing" target="_blank" rel="noreferrer" className="border border-gray-300 text-gray-700 text-xs px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
                  Manage Plan
                </a>
                <a href="https://zoom.us/pricing" target="_blank" rel="noreferrer" className="text-[#0B5CFF] text-xs hover:underline">
                  View Plan Details
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="dashboard-recent">
          <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900" aria-label="Recent meetings">Recent activity</h3>
          </div>
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> : recent.length > 0 ? <div className="divide-y divide-gray-100">
            {recent.slice(0, 5).map((m) => <Link key={m.id} href={`/meetings?tab=previous&selected=${m.id}`} className="block px-5 py-4 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-800">{m.title}</p>
              <p className="text-xs text-gray-500 mt-1">{formatShortDate(m.start_time)} · {formatTime(m.start_time)} · {m.duration_minutes} minutes</p>
            </Link>)}
          </div> : (
          <div className="flex flex-col items-center justify-center py-10 md:py-12 gap-3">
            {/* Open box illustration — matches Zoom */}
            <svg width="80" height="76" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Box body */}
              <path d="M15 45 L50 62 L85 45 L85 78 L50 95 L15 78 Z" fill="#5B9BD5"/>
              <path d="M15 45 L50 62 L85 45 L85 78 L50 95 L15 78 Z" fill="url(#bodyGrad)"/>
              {/* Box left face */}
              <path d="M15 45 L50 62 L50 95 L15 78 Z" fill="#4A8AC4"/>
              {/* Box right face */}
              <path d="M85 45 L50 62 L50 95 L85 78 Z" fill="#7AB3E0"/>
              {/* Left lid flap (open, angled back-left) */}
              <path d="M15 45 L50 28 L50 45 L15 45 Z" fill="#6EB0E8" opacity="0.9"/>
              {/* Right lid flap (open, angled back-right) */}
              <path d="M85 45 L50 28 L50 45 L85 45 Z" fill="#93C9F5" opacity="0.9"/>
              {/* Left outer flap angled up */}
              <path d="M15 45 L50 28 L42 10 L8 26 Z" fill="#5B9BD5" opacity="0.7"/>
              {/* Right outer flap angled up */}
              <path d="M85 45 L50 28 L58 10 L92 26 Z" fill="#93C9F5" opacity="0.7"/>
              {/* Highlight line at top */}
              <line x1="15" y1="45" x2="85" y2="45" stroke="#3A78B5" strokeWidth="0.8" opacity="0.5"/>
              <defs>
                <linearGradient id="bodyGrad" x1="15" y1="45" x2="85" y2="95" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="black" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
            </svg>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
          )}
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────── */}
      <div className="dashboard-secondary">
        <div className="dashboard-widgets">

          <div className="dashboard-quickcard">
          {/* Schedule / Join / Host */}
          <div className="dashboard-actions">
            <button aria-label="Schedule Meeting" onClick={() => router.push('/meetings/schedule')} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#0B5CFF] flex items-center justify-center text-white group-hover:bg-[#0a50e0] transition-colors shadow-sm">
                <Calendar size={22} />
              </div>
              <span className="text-xs text-gray-700 font-medium">Schedule</span>
            </button>

            <button aria-label="Join Meeting" onClick={() => router.push('/join')} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#0B5CFF] flex items-center justify-center text-white group-hover:bg-[#0a50e0] transition-colors shadow-sm">
                <Plus size={24} />
              </div>
              <span className="text-xs text-gray-700 font-medium">Join</span>
            </button>

            <button aria-label="New Meeting" onClick={handleHost} disabled={starting} className="flex flex-col items-center gap-2 group disabled:opacity-50">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#FF6B00] flex items-center justify-center text-white group-hover:bg-[#e55e00] transition-colors shadow-sm">
                {starting ? <Spinner size={20} /> : <Video size={22} />}
              </div>
              <span className="text-xs text-gray-700 font-medium">New Meeting</span>
            </button>
          </div>

          {/* Personal Meeting ID */}
          <div className="dashboard-pmi">
            <p className="text-[12px] font-semibold text-gray-800 mb-1.5">Personal Meeting ID</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-800 font-mono tracking-wider">{pmiDisplay}</span>
              <button onClick={copyPmi} className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors" title="Copy PMI">
                {pmiCopied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          </div>
          {/* Meetings widget */}
          <div className="dashboard-upcoming">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900" aria-label="Upcoming meetings">Meetings</span>
              <button onClick={() => router.push('/meetings')} className="text-[#0B5CFF] text-xs hover:underline font-medium">
                Visit Meetings
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4"><Spinner size={18} /></div>
            ) : upcoming.length === 0 ? (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-3">
                <p className="text-xs text-gray-500">No Upcoming Meetings</p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {upcoming.slice(0, 3).map((m) => (
                  <div key={m.id} className="dashboard-meeting-entry">
                    <div className="dashboard-meeting-date">{isToday(m.start_time) ? 'Today' : formatShortDate(m.start_time)}</div>
                    <div className="dashboard-meeting-card"><Link href={`/meetings?selected=${m.id}`}><p>{m.title}</p><p>{formatTime(m.start_time)}</p><p>Meeting ID: {formatMeetingId(m.meeting_id)}</p></Link>
                    <button onClick={async () => { try { await copyText(buildInvitationText(m)); setInviteCopied(m.id); setTimeout(() => setInviteCopied(null), 2000) } catch { setError('Could not copy the invitation.') } }}>{inviteCopied === m.id ? 'Copied!' : 'Copy Invitation'}</button></div>
                  </div>
                ))}
              </div>
            )}

            <button disabled title="Audio and video test placeholder" className="text-[#0B5CFF] text-xs hover:underline">
              Test Audio and Video
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
