'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  formatMeetingId,
  getMeetingTimeRange,
  buildInvitationText,
  getJoinUrl,
  isToday,
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
  Flag,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Tab =
  | 'upcoming'
  | 'previous'
  | 'attachments'
  | 'personal-room'
  | 'templates'
  | 'agendas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming',      label: 'Upcoming' },
  { id: 'previous',      label: 'Previous' },
  { id: 'attachments',   label: 'Attachments' },
  { id: 'personal-room', label: 'Personal Room' },
  { id: 'templates',     label: 'Meeting Templates' },
  { id: 'agendas',       label: 'Meeting Agendas' },
]

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function groupByDate(meetings: Meeting[]): [string, Meeting[]][] {
  const map: Record<string, Meeting[]> = {}
  for (const m of meetings) {
    const key = getDateGroupLabel(m.start_time)
    if (!map[key]) map[key] = []
    map[key].push(m)
  }
  return Object.entries(map)
}

/** Shows "Today" for today's date, otherwise "Day, Mon D" */
function getDateGroupLabel(isoStr: string): string {
  if (isToday(isoStr)) return 'Today'
  return new Date(isoStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Format date as MM-DD-YYYY (matching real Zoom date range display) */
function fmtRange(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${d.getFullYear()}`
}

/* ── Component ─────────────────────────────────────────────────────────────── */
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
      const [m, u] = await Promise.all([api.meetings.list(t), api.users.me()])
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

  /* Date range strings */
  const today = new Date()
  const upcomingEnd = new Date(today); upcomingEnd.setMonth(today.getMonth() + 3)
  const prevStart  = new Date(today); prevStart.setMonth(today.getMonth() - 3)
  const yesterday  = new Date(today); yesterday.setDate(today.getDate() - 1)
  const dateRange =
    tab === 'upcoming'
      ? `${fmtRange(today)} to ${fmtRange(upcomingEnd)}`
      : `${fmtRange(prevStart)} to ${fmtRange(yesterday)}`

  const groups = groupByDate(meetings)

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Meetings</h1>
        <button
          onClick={() => router.push('/meetings/schedule')}
          className="flex items-center gap-1 bg-[#0B5CFF] hover:bg-[#0a50e0] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          + Schedule a Meeting <ChevronDown size={13} />
        </button>
      </div>

      {/* ── Promo banner ─────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5 text-[13px] text-gray-700 leading-relaxed">
        Your current Basic plan allows{' '}
        <span className="text-orange-500">you</span> to{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">schedule meetings</span>{' '}
        for up to 40 minutes each.{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">Upgrade</span>{' '}
        to Zoom Workplace Pro to schedule meetings for up to 30 hours with advanced meeting
        features.{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">Discover Zoom Workplace Pro</span>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto scrollbar-none">
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

      {/* ── Date range filter (both Upcoming and Previous) ────────────── */}
      {(tab === 'upcoming' || tab === 'previous') && !loading && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white cursor-pointer hover:border-gray-400 transition-colors">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-gray-500">
              <rect x="1" y="2" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 6h14" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {dateRange}
          </div>
        </div>
      )}

      {/* ── Soft error ───────────────────────────────────────────────── */}
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
        </div>

      ) : tab !== 'upcoming' && tab !== 'previous' ? (
        /* Other tabs placeholder */
        <div className="flex flex-col items-center py-16 text-center gap-2">
          <p className="text-gray-400 text-sm">This section is not available in the demo.</p>
        </div>

      ) : !error ? (
        /* ── Meeting list ───────────────────────────────────────────── */
        <div>
          {groups.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <p className="text-gray-400 text-sm">No meetings found for this period.</p>
            </div>
          )}

          {groups.map(([dateLabel, dayMeetings]) => (
            <div key={dateLabel}>
              {/* Date group header — gray band */}
              <div className="bg-gray-50 px-3 py-1.5 border-y border-gray-100 mb-0">
                <p className="text-sm font-medium text-gray-700">{dateLabel}</p>
              </div>

              {dayMeetings.map((m) => {
                const isNow =
                  m.status === 'active' ||
                  (m.status !== 'ended' && new Date(m.start_time) <= new Date())
                const isExp = expanded === m.id

                return (
                  <div key={m.id} className="border-b border-gray-100 last:border-b-0">
                    {/* ── Meeting row ── */}
                    <div
                      onClick={() => setExpanded(isExp ? null : m.id)}
                      className={`flex flex-col sm:flex-row sm:items-start py-4 px-3 cursor-pointer transition-colors ${
                        isExp ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Time + upgrade promo */}
                      <div className="sm:w-52 flex-shrink-0 mb-1 sm:mb-0">
                        <p className="text-sm font-medium text-[#0B5CFF]">
                          {getMeetingTimeRange(m)}
                          {isNow && (
                            <span className="ml-1.5 text-red-500 text-xs font-bold">| NOW</span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          Need more meeting time?{' '}
                          <span className="text-[#0B5CFF] hover:underline cursor-pointer">
                            Upgrade to Zoom Workplace Pro
                          </span>
                        </p>
                      </div>

                      {/* Meeting title + ID */}
                      <div className="flex-1 min-w-0 sm:px-4 mb-2 sm:mb-0">
                        <p className="text-sm font-semibold text-[#0B5CFF] hover:underline">
                          {m.title}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          Meeting ID:{' '}
                          <span className="font-mono">{formatMeetingId(m.meeting_id)}</span>
                        </p>
                      </div>

                      {/* Inline action buttons — stop row expand propagation */}
                      <div
                        className="flex flex-wrap items-center gap-0.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleStart(m)}
                          className="bg-[#0B5CFF] hover:bg-[#0a50e0] text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors"
                        >
                          Start
                        </button>
                        <button className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5">
                          Chat
                        </button>
                        <button
                          onClick={() => setEditMeeting(m)}
                          className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-xs text-gray-600 hover:text-red-600 px-3 py-1.5"
                        >
                          Delete
                        </button>
                        {tab === 'previous' && (
                          <button className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 flex items-center gap-1">
                            <Flag size={10} /> Report to Zoom
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Expanded detail panel ── */}
                    {isExp && (
                      <div className="bg-white border border-gray-200 rounded-xl mx-2 mb-3 mt-1 px-4 md:px-6 py-4 shadow-sm">
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">
                          {m.title}
                        </h3>
                        <p className="text-[13px] text-gray-500 mb-4 flex flex-wrap gap-x-1.5">
                          <span>{getMeetingTimeRange(m)}</span>
                          <span>·</span>
                          <span>Host: {user?.name ?? '—'}</span>
                          <span>·</span>
                          <span>
                            ID: <span className="font-mono">{formatMeetingId(m.meeting_id)}</span>
                          </span>
                        </p>

                        {/* Detail action buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tab === 'upcoming' && (
                            <button
                              onClick={() => handleStart(m)}
                              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
                            >
                              <Play size={11} fill="white" strokeWidth={0} /> Start
                            </button>
                          )}
                          <button
                            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            <Users size={12} /> Message Invitees
                          </button>
                          <button
                            onClick={() => handleCopyInvitation(m)}
                            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            {copiedId === m.id
                              ? <CheckCheck size={12} className="text-green-500" />
                              : <Copy size={12} />}
                            {copiedId === m.id ? 'Copied!' : 'Copy Invitation'}
                          </button>
                          {tab === 'upcoming' && (
                            <button
                              onClick={() => setEditMeeting(m)}
                              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>

                        {/* Security */}
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
                            Security
                          </p>
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
