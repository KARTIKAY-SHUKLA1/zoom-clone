'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Video, Copy, CheckCheck, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatMeetingId, getJoinUrl } from '@/lib/utils'
import type { Meeting, User } from '@/types'
import Spinner from '@/components/ui/Spinner'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [upcoming, setUpcoming] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [pmiCopied, setPmiCopied] = useState(false)

  useEffect(() => {
    Promise.all([api.users.me(), api.meetings.list('upcoming')])
      .then(([u, m]) => {
        setUser(u)
        setUpcoming(m)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleHost = async () => {
    setStarting(true)
    try {
      const m = await api.meetings.instant()
      router.push(`/room/${m.meeting_id}`)
    } catch {
      setStarting(false)
    }
  }

  const copyPmi = async () => {
    if (!user) return
    await navigator.clipboard.writeText(user.personal_meeting_id)
    setPmiCopied(true)
    setTimeout(() => setPmiCopied(false), 2000)
  }

  const pmiDisplay = user ? formatMeetingId(user.personal_meeting_id) : '─── ──── ────'

  return (
    /* Stack on mobile, side-by-side on lg+ */
    <div className="flex flex-col lg:flex-row min-h-full bg-[#f7f7f7]">

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 p-4 md:p-5 space-y-4 overflow-auto">

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => { setError(''); setLoading(true); window.location.reload() }}
              className="ml-auto text-red-600 underline text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* User card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm">
          {loading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-300 flex items-center justify-center text-gray-600 text-xl md:text-2xl font-bold flex-shrink-0 select-none">
                  {user?.avatar_initials ?? 'A'}
                </div>
                <div>
                  <h2 className="text-[15px] md:text-[17px] font-semibold text-gray-900 leading-snug">
                    {user?.name ?? '—'}
                  </h2>
                  <p className="text-sm text-[#0B5CFF] mt-0.5">
                    Plan: {user?.plan ?? 'Workplace Basic'}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <button className="border border-gray-300 text-gray-700 text-xs px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
                  Manage Plan
                </button>
                <button className="text-[#0B5CFF] text-xs hover:underline">
                  View Plan Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Recent activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-10 md:py-12 gap-3">
            <svg width="72" height="62" viewBox="0 0 80 68" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 2L72 18V50L40 66L8 50V18L40 2Z" fill="#E8F0FE" stroke="#C7D8FB" strokeWidth="2"/>
              <path d="M40 2L72 18L40 34L8 18L40 2Z" fill="#C7D8FB" stroke="#A8C0F9" strokeWidth="1.5"/>
              <path d="M40 34V66" stroke="#A8C0F9" strokeWidth="1.5"/>
            </svg>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────── */}
      <div className="w-full lg:w-[260px] lg:flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200">
        <div className="p-4 space-y-4">

          {/* Schedule / Join / Host */}
          <div className="flex justify-around pt-2">
            <button onClick={() => router.push('/meetings/schedule')} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#0B5CFF] flex items-center justify-center text-white group-hover:bg-[#0a50e0] transition-colors shadow-sm">
                <Calendar size={22} />
              </div>
              <span className="text-xs text-gray-600 font-medium">Schedule</span>
            </button>

            <button onClick={() => router.push('/join')} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#0B5CFF] flex items-center justify-center text-white group-hover:bg-[#0a50e0] transition-colors shadow-sm">
                <Plus size={24} />
              </div>
              <span className="text-xs text-gray-600 font-medium">Join</span>
            </button>

            <button onClick={handleHost} disabled={starting} className="flex flex-col items-center gap-2 group disabled:opacity-50">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#FF6B00] flex items-center justify-center text-white group-hover:bg-[#e55e00] transition-colors shadow-sm">
                {starting ? <Spinner size={20} /> : <Video size={22} />}
              </div>
              <span className="text-xs text-gray-600 font-medium">Host</span>
            </button>
          </div>

          {/* PMI */}
          <div className="border border-gray-200 rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Personal Meeting ID
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-800 font-mono tracking-wider">{pmiDisplay}</span>
              <button onClick={copyPmi} className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors" title="Copy PMI">
                {pmiCopied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={13} />}
              </button>
            </div>
            {pmiCopied && <p className="text-[11px] text-green-500 mt-1">Copied!</p>}
          </div>

          {/* Meetings widget */}
          <div className="border border-gray-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Meetings</span>
              <button onClick={() => router.push('/meetings')} className="text-[#0B5CFF] text-xs hover:underline font-medium">
                Visit Meetings
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4"><Spinner size={18} /></div>
            ) : error ? (
              <div className="bg-red-50 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-red-500">Failed to load meetings</p>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-3">
                <p className="text-xs text-gray-500">No Upcoming Meetings</p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {upcoming.slice(0, 3).map((m) => (
                  <div key={m.id} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{m.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(m.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button className="text-[#0B5CFF] text-xs hover:underline">
              Test Audio and Video
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
