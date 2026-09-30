'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  formatMeetingId,
  getMeetingTimeRange,
  formatShortDate,
  buildInvitationText,
  getJoinUrl,
} from '@/lib/utils'
import type { Meeting, User } from '@/types'
import EditModal from '@/components/meetings/EditModal'
import Spinner from '@/components/ui/Spinner'
import {
  ChevronDown,
  Play,
  Copy,
  Edit2,
  Trash2,
  Users,
  CheckCheck,
} from 'lucide-react'

type Tab =
  | 'upcoming'
  | 'previous'
  | 'attachments'
  | 'personal-room'
  | 'templates'
  | 'agendas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'previous', label: 'Previous' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'personal-room', label: 'Personal Room' },
  { id: 'templates', label: 'Meeting Templates' },
  { id: 'agendas', label: 'Meeting Agendas' },
]

function groupByDate(meetings: Meeting[]): [string, Meeting[]][] {
  const map: Record<string, Meeting[]> = {}
  for (const m of meetings) {
    const key = formatShortDate(m.start_time)
    if (!map[key]) map[key] = []
    map[key].push(m)
  }
  return Object.entries(map)
}

export default function MeetingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = useCallback(async (t: 'upcoming' | 'previous') => {
    setLoading(true)
    setError('')
    try {
      const [m, u] = await Promise.all([
        api.meetings.list(t),
        api.users.me(),
      ])
      setMeetings(m)
      setUser(u)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'upcoming' || tab === 'previous') {
      load(tab)
    } else {
      setMeetings([])
      setLoading(false)
      setError('')
    }
  }, [tab, load])

  const handleStart = async (m: Meeting) => {
    await api.meetings.setStatus(m.id, 'active').catch(() => {})
    router.push(`/room/${m.meeting_id}`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this meeting? This cannot be undone.')) return
    try {
      await api.meetings.delete(id)
      load(tab === 'upcoming' ? 'upcoming' : 'previous')
      setExpanded(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleCopyInvitation = async (m: Meeting) => {
    await navigator.clipboard.writeText(buildInvitationText(m))
    setCopiedId(m.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleEditSaved = () => {
    setEditMeeting(null)
    load(tab === 'upcoming' ? 'upcoming' : 'previous')
  }

  const today = new Date()
  const rangeStart = new Date(today)
  rangeStart.setMonth(rangeStart.getMonth() - 3)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  const groups = groupByDate(meetings)

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-4xl">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Meetings</h1>
        <button
          onClick={() => router.push('/meetings/schedule')}
          className="flex items-center gap-1 bg-[#0B5CFF] hover:bg-[#0a50e0] text-white text-xs md:text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          + Schedule <span className="hidden sm:inline">a Meeting</span>
          <ChevronDown size={13} />
        </button>
      </div>

      {/* ── Promo banner ─────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5 text-[13px] text-gray-700 leading-relaxed">
        Your current Basic plan allows you to{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">schedule meetings</span>{' '}
        for up to 40 minutes each.{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">Upgrade</span>{' '}
        to Zoom Workplace Pro for up to 30 hours.{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">Discover Zoom Workplace Pro</span>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setExpanded(null) }}
            className={`flex-shrink-0 px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === id
                ? 'border-[#0B5CFF] text-[#0B5CFF]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Soft error — BackendBanner above already signals connectivity issues */}
      {error && !loading && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm text-gray-500">
          <span>{error}</span>
          <button
            onClick={() => load(tab === 'upcoming' ? 'upcoming' : 'previous')}
            className="text-xs font-medium text-[#0B5CFF] hover:underline ml-4 flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>

      ) : tab === 'upcoming' && !error && meetings.length === 0 ? (
        /* Upcoming empty state */
        <div className="flex flex-col items-center py-12 md:py-16 gap-4 text-center px-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Welcome to Zoom Meetings!</h2>
          <p className="text-sm text-gray-600 max-w-md leading-relaxed">
            Schedule new and manage existing meetings all in one place. You are currently
            limited to 40 minutes per meeting.{' '}
            <span className="text-[#0B5CFF] hover:underline cursor-pointer">Upgrade now</span>{' '}
            if you need more time.{' '}
            <span className="text-[#0B5CFF] hover:underline cursor-pointer">Learn More</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <button
              onClick={() => router.push('/meetings/schedule')}
              className="bg-[#0B5CFF] hover:bg-[#0a50e0] text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Schedule a Meeting
            </button>
            <button className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Upgrade Now
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Save time by scheduling meetings directly from your calendar.
          </p>
        </div>

      ) : tab !== 'upcoming' && tab !== 'previous' ? (
        /* Other tabs placeholder */
        <div className="flex flex-col items-center py-16 text-center gap-2">
          <p className="text-gray-400 text-sm">This section is not available in the demo.</p>
        </div>

      ) : !error ? (
        /* Meeting list */
        <div>
          {/* Date range filter (Previous only) */}
          {tab === 'previous' && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-700 bg-white select-none">
                📅 {fmt(rangeStart)} &nbsp;to&nbsp; {fmt(today)}
              </div>
            </div>
          )}

          {groups.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <p className="text-gray-400 text-sm">No meetings found for this period.</p>
            </div>
          )}

          {groups.map(([dateLabel, dayMeetings]) => (
            <div key={dateLabel} className="mb-2">
              <p className="text-sm font-semibold text-gray-700 py-1.5 border-b border-gray-200 mb-1 px-1">
                {dateLabel}
              </p>

              {dayMeetings.map((m) => {
                const isExp = expanded === m.id
                const isNow =
                  m.status === 'active' ||
                  (m.status !== 'ended' && new Date(m.start_time) <= new Date())

                return (
                  <div key={m.id}>
                    {/* Meeting row — responsive: stacked on mobile, side-by-side on sm+ */}
                    <div
                      onClick={() => setExpanded(isExp ? null : m.id)}
                      className={`flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-0.5 py-3 px-3 border-b border-gray-50 cursor-pointer rounded-lg transition-colors ${
                        isExp ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Time */}
                      <div className="sm:w-48 flex-shrink-0">
                        <p className={`text-sm font-medium ${isNow ? 'text-[#0B5CFF]' : 'text-gray-800'}`}>
                          {getMeetingTimeRange(m)}
                          {isNow && (
                            <span className="ml-1.5 text-orange-500 text-xs font-bold">| NOW</span>
                          )}
                        </p>
                        {tab === 'previous' && (
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug hidden sm:block">
                            Need more meeting time?{' '}
                            <span className="text-[#0B5CFF] hover:underline cursor-pointer">
                              Upgrade to Zoom Workplace Pro
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Title + ID */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          Meeting ID:{' '}
                          <span className="font-mono">{formatMeetingId(m.meeting_id)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExp && (
                      <div className="bg-white border border-gray-200 rounded-xl mx-0 sm:mx-2 mb-3 mt-1 px-4 md:px-6 py-4 shadow-sm">
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">{m.title}</h3>
                        <p className="text-[13px] text-gray-500 mb-4 flex flex-wrap gap-x-2">
                          <span>{getMeetingTimeRange(m)}</span>
                          <span>·</span>
                          <span>Host: {user?.name ?? '—'}</span>
                          <span>·</span>
                          <span>ID: <span className="font-mono">{formatMeetingId(m.meeting_id)}</span></span>
                        </p>

                        {/* Action buttons — wrap on mobile */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {m.status !== 'ended' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStart(m) }}
                              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
                            >
                              <Play size={11} fill="white" strokeWidth={0} /> Start
                            </button>
                          )}
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            <Users size={12} /> Message Invitees
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyInvitation(m) }}
                            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            {copiedId === m.id
                              ? <CheckCheck size={12} className="text-green-500" />
                              : <Copy size={12} />}
                            {copiedId === m.id ? 'Copied!' : 'Copy Invitation'}
                          </button>
                          {m.status !== 'ended' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditMeeting(m) }}
                              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>

                        {/* Security */}
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Security</p>
                          <p className="text-[13px] text-gray-700">
                            Passcode: <span className="font-mono font-medium">{m.passcode}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1 break-all">
                            Invite link:{' '}
                            <span className="text-[#0B5CFF]">{getJoinUrl(m.meeting_id)}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : null}

      {/* Edit modal */}
      {editMeeting && (
        <EditModal
          meeting={editMeeting}
          onClose={() => setEditMeeting(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}
