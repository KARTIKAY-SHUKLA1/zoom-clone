'use client'

import { useState } from 'react'
import type { Meeting, User } from '@/types'
import { formatMeetingId, getMeetingTimeRange, buildInvitationText } from '@/lib/utils'
import { Play, Users, Copy, Edit2, Trash2, CheckCheck } from 'lucide-react'

interface Props {
  meeting: Meeting
  user: User | null
  onStart: (m: Meeting) => void
  onEdit: () => void
  onDelete: () => void
}

export default function MeetingDetail({
  meeting: m,
  user,
  onStart,
  onEdit,
  onDelete,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [showInvitation, setShowInvitation] = useState(false)

  const displayId = formatMeetingId(m.meeting_id)
  const isActive =
    m.status === 'active' ||
    (m.status !== 'ended' && new Date(m.start_time) <= new Date())

  const copyInvitation = async () => {
    await navigator.clipboard.writeText(buildInvitationText(m))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-6 py-6 max-w-3xl">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{m.title}</h2>

      {/* Time + NOW badge */}
      <div className="flex items-center gap-3 mb-1">
        <span className="text-sm text-gray-600">{getMeetingTimeRange(m)}</span>
        {isActive && (
          <span className="text-orange-500 text-xs font-bold tracking-wide">| NOW</span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-0.5">Host: {user?.name ?? '—'}</p>
      <p className="text-sm text-gray-500 mb-5">
        Meeting ID: <span className="font-mono">{displayId}</span>
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {m.status !== 'ended' && (
          <button
            onClick={() => onStart(m)}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
          >
            <Play size={12} fill="white" strokeWidth={0} />
            Start
          </button>
        )}

        <button className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
          <Users size={12} /> Message Invitees
        </button>

        <button
          onClick={copyInvitation}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <CheckCheck size={12} className="text-green-500" />
          ) : (
            <Copy size={12} />
          )}
          {copied ? 'Copied!' : 'Copy Invitation'}
        </button>

        {m.status !== 'ended' && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={12} /> Edit
          </button>
        )}

        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      {/* Show/hide invitation */}
      <button
        onClick={() => setShowInvitation((v) => !v)}
        className="text-sm text-[#0B5CFF] hover:underline mb-4 block"
      >
        {showInvitation ? 'Hide' : 'Show'} Meeting Invitation
      </button>

      {showInvitation && (
        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap font-sans mb-5">
          {buildInvitationText(m)}
        </pre>
      )}

      {/* Detail cards */}
      <div className="space-y-3">
        {m.description && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-medium">
              Description
            </p>
            <p className="text-sm text-gray-700">{m.description}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">
            Security
          </p>
          <p className="text-sm text-gray-700">
            Passcode:{' '}
            <span className="font-mono font-medium">{m.passcode}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1 break-all">
            Invite link:{' '}
            <span className="text-[#0B5CFF]">{m.invite_link}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
