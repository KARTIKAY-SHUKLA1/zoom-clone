'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatMeetingId, buildInvitationText } from '@/lib/utils'
import type { Meeting, Participant } from '@/types'
import {
  Mic, MicOff, Video, VideoOff, Users, MessageSquare,
  Share2, Shield, MoreHorizontal, PhoneOff, X, CheckCheck,
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'

type Phase = 'loading' | 'preview' | 'room' | 'ended' | 'error'

// ── Small control-bar button ───────────────────────────────────────────────
function Btn({
  icon, label, onClick, danger, active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[62px] ${
        danger
          ? 'text-red-400 hover:bg-gray-800'
          : active
          ? 'text-[#0B5CFF] hover:bg-gray-800'
          : 'text-white hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="text-[10px] leading-none font-medium">{label}</span>
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function RoomPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>('loading')
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showEndMenu, setShowEndMenu] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)

  // ── Load meeting + camera ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const m = await api.meetings.validate(meetingId)
        if (cancelled) return
        if (m.status === 'ended') { setPhase('ended'); return }
        setMeeting(m)
        setPhase('preview')
        // Start camera (silently ignore if unavailable)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
          streamRef.current = stream
          if (videoRef.current) videoRef.current.srcObject = stream
        } catch { /* camera/mic unavailable */ }
      } catch {
        if (!cancelled) setPhase('error')
      }
    }

    load()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [meetingId])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // ── Start ────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!meeting) return
    try {
      await api.meetings.setStatus(meeting.id, 'active')
      await api.participants.join(meeting.id, 'Alex Morgan')
      const ps = await api.participants.list(meeting.id)
      setParticipants(ps)
    } catch { /* continue anyway */ }
    setPhase('room')
  }

  // ── Mic / Video ──────────────────────────────────────────────────────────
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = muted })
    setMuted((v) => !v)
  }
  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = videoOff })
    setVideoOff((v) => !v)
  }

  // ── End ──────────────────────────────────────────────────────────────────
  const endForAll = async () => {
    if (meeting) await api.meetings.setStatus(meeting.id, 'ended').catch(() => {})
    stopCamera()
    router.push('/meetings')
  }
  const leaveMeeting = () => { stopCamera(); router.push('/') }

  // ── Host controls ────────────────────────────────────────────────────────
  const muteAll = async () => {
    if (!meeting) return
    await api.participants.muteAll(meeting.id)
    const ps = await api.participants.list(meeting.id)
    setParticipants(ps)
  }
  const removeParticipant = async (pid: number) => {
    if (!meeting) return
    await api.participants.remove(meeting.id, pid)
    setParticipants((ps) => ps.filter((p) => p.id !== pid))
  }

  const copyInvite = async () => {
    if (!meeting) return
    await navigator.clipboard.writeText(buildInvitationText(meeting))
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  // ── Phases ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-lg">Meeting not found or no longer available.</p>
        <Link href="/" className="text-[#0B5CFF] hover:underline text-sm">
          Return home
        </Link>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-lg">This meeting has ended.</p>
        <Link href="/" className="text-[#0B5CFF] hover:underline text-sm">
          Return home
        </Link>
      </div>
    )
  }

  // ── Pre-join preview ────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <div className="w-5 h-5 rounded-full bg-[#0B5CFF] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">Z</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {meeting?.title ?? 'Meeting'}
            </span>
          </div>

          {/* Camera preview */}
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${videoOff ? 'hidden' : ''}`}
            />
            {videoOff && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-white text-3xl font-bold">
                  AM
                </div>
              </div>
            )}
            {/* Overlay controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-colors ${
                  muted ? 'bg-red-600' : 'bg-gray-700/80 hover:bg-gray-600'
                }`}
              >
                {muted ? <MicOff size={13} /> : <Mic size={13} />} Audio
              </button>
              <button
                onClick={toggleVideo}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-colors ${
                  videoOff ? 'bg-red-600' : 'bg-gray-700/80 hover:bg-gray-600'
                }`}
              >
                {videoOff ? <VideoOff size={13} /> : <Video size={13} />} Video
              </button>
            </div>
          </div>

          {/* Bottom */}
          <div className="px-4 py-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              Always show this preview when joining
            </label>
            <button
              onClick={handleStart}
              className="bg-[#0B5CFF] hover:bg-[#0a50e0] text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Full meeting room ───────────────────────────────────────────────────
  const displayId = meeting ? formatMeetingId(meeting.meeting_id) : ''

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden select-none">
      {/* Meeting top bar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">ⓘ</span>
          <span className="text-white text-sm font-medium">{meeting?.title}</span>
        </div>
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <Shield size={10} className="text-white" />
        </div>
      </div>

      {/* Content area: video + optional participants panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative bg-black">
          {!videoOff ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-lg bg-gray-600 flex items-center justify-center text-white text-5xl font-bold">
                AM
              </div>
            </div>
          )}
          {/* Name tag */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
            {muted && <MicOff size={13} className="text-red-400" />}
            <span className="text-white text-xs font-medium drop-shadow-md">
              Alex Morgan (Host, me)
            </span>
          </div>
        </div>

        {/* Participants panel */}
        {showParticipants && (
          <div className="w-72 bg-[#242424] flex flex-col flex-shrink-0 border-l border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-white text-sm font-semibold">
                Participants ({participants.length})
              </span>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-1">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6">
                  No participants yet
                </p>
              ) : (
                participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-700/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-gray-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {p.display_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-white text-xs truncate">
                        {p.display_name}
                        {p.role === 'host' && (
                          <span className="text-gray-500 ml-1">(Host, me)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {p.is_muted && <MicOff size={11} className="text-gray-500" />}
                      {p.role !== 'host' && (
                        <button
                          onClick={() => removeParticipant(p.id)}
                          title="Remove participant"
                          className="text-gray-600 hover:text-red-400 transition-colors ml-1"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Host controls */}
            <div className="flex gap-1.5 p-3 border-t border-gray-700">
              <button
                onClick={() => setShowInvite(true)}
                className="flex-1 text-xs text-white bg-gray-600 hover:bg-gray-500 py-2 rounded-md transition-colors"
              >
                Invite
              </button>
              <button
                onClick={muteAll}
                className="flex-1 text-xs text-white bg-gray-600 hover:bg-gray-500 py-2 rounded-md transition-colors"
              >
                Mute All
              </button>
              <button className="flex-1 text-xs text-white bg-gray-600 hover:bg-gray-500 py-2 rounded-md transition-colors">
                More
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 bg-[#1a1a1a]">
        <div className="flex items-center gap-0.5">
          <Btn
            icon={muted ? <MicOff size={20} /> : <Mic size={20} />}
            label={muted ? 'Unmute' : 'Mute'}
            onClick={toggleMic}
            danger={muted}
          />
          <Btn
            icon={videoOff ? <VideoOff size={20} /> : <Video size={20} />}
            label={videoOff ? 'Start Video' : 'Stop Video'}
            onClick={toggleVideo}
            danger={videoOff}
          />
          <div className="w-px h-7 bg-gray-700 mx-1" />
          <Btn
            icon={<Users size={20} />}
            label="Participants"
            onClick={() => setShowParticipants((v) => !v)}
            active={showParticipants}
          />
          <Btn icon={<MessageSquare size={20} />} label="Chat" onClick={() => {}} />
          <Btn icon={<Share2 size={20} />} label="Share" onClick={() => {}} />
          <Btn icon={<Shield size={20} />} label="Host tools" onClick={() => {}} />
          <Btn icon={<MoreHorizontal size={20} />} label="More" onClick={() => {}} />
        </div>

        {/* End button + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowEndMenu((v) => !v)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <PhoneOff size={15} /> End
          </button>
          {showEndMenu && (
            <div className="absolute bottom-12 right-0 bg-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden w-52 border border-gray-700">
              <button
                onClick={endForAll}
                className="w-full text-left px-4 py-3 text-sm text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                End Meeting for All
              </button>
              <button
                onClick={leaveMeeting}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                Leave Meeting
              </button>
              <div className="px-4 py-2 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowEndMenu(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite modal (dark) */}
      {showInvite && meeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowInvite(false)}
          />
          <div className="relative bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md mx-4 z-10 shadow-2xl">
            <h3 className="text-white font-semibold text-base mb-4">
              Invite People &mdash; Meeting ID:{' '}
              <span className="font-mono">{displayId}</span>
            </h3>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-700 mb-4">
              {['Contacts', 'Zoom Rooms', 'Email'].map((t, i) => (
                <button
                  key={t}
                  className={`text-xs pb-2 font-medium ${
                    i === 0
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2 mb-4">
              <span className="text-gray-500 text-xs">🔍</span>
              <input
                className="bg-transparent text-gray-300 text-xs flex-1 outline-none placeholder-gray-600"
                placeholder="Choose from the list or type to search"
              />
            </div>

            <div className="h-16" />

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={copyInvite}
                  className="text-[#0B5CFF] text-xs hover:underline flex items-center gap-1"
                >
                  {copiedInvite && <CheckCheck size={11} />}
                  {copiedInvite ? 'Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={copyInvite}
                  className="text-[#0B5CFF] text-xs hover:underline"
                >
                  Copy Invitation
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">
                  Passcode:{' '}
                  <span className="text-white font-mono font-medium">
                    {meeting.passcode}
                  </span>
                </span>
                <button className="bg-[#0B5CFF] text-white text-xs px-3 py-1.5 rounded-md">
                  Invite
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  className="text-gray-400 text-xs px-3 py-1.5 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
