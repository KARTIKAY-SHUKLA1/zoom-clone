'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mic, MicOff, Video, VideoOff, Users, Shield, OctagonX, X, CheckCheck, MessageSquare, Heart, ScreenShare, CircleEllipsis, Info, Camera } from 'lucide-react'
import { api } from '@/lib/api'
import { buildInvitationText, copyText, formatMeetingId, getJoinUrl } from '@/lib/utils'
import type { Meeting, Participant } from '@/types'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import WorkplaceFrame from '@/components/layout/WorkplaceFrame'

type Phase = 'loading' | 'preview' | 'room' | 'ended' | 'error'

function Control({ icon, label, onClick, active = false, disabled = false }: {
  icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean; disabled?: boolean
}) {
  return <button disabled={disabled} title={disabled ? 'Visual placeholder outside the core assignment' : undefined} onClick={onClick} aria-pressed={active}
    className={`room-control flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-800 min-w-[58px] ${active ? 'text-blue-400' : 'text-white'}`}>
    {icon}<span className="text-[10px] whitespace-nowrap">{label}</span>
  </button>
}

export default function RoomPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const router = useRouter()
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const selfRef = useRef<Participant | null>(null)
  const mountedRef = useRef(true)
  const mutedRef = useRef(false)
  const videoOffRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('loading')
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [displayName, setDisplayName] = useState('')
  const [hostId, setHostId] = useState<number | undefined>()
  const [isHost, setIsHost] = useState(false)
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showEndMenu, setShowEndMenu] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mediaNotice, setMediaNotice] = useState('')

  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
    if (element) element.srcObject = streamRef.current
  }, [])

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    async function load() {
      try {
        const m = await api.meetings.validate(meetingId)
        if (cancelled) return
        if (m.status === 'ended') { setPhase('ended'); return }
        const guest = new URLSearchParams(window.location.search).get('guest') === '1'
        if (guest) {
          const name = sessionStorage.getItem(`meeting-name:${meetingId}`)
          if (!name) { router.replace(getJoinUrl(meetingId)); return }
          setDisplayName(name)
        } else {
          const user = await api.users.me()
          if (cancelled) return
          setDisplayName(user.name)
          setHostId(user.id)
          setIsHost(user.id === m.host_id)
        }
        setMeeting(m)
        setPhase('preview')

      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Could not load meeting.'); setPhase('error') }
      }
    }
    load()
    return () => {
      cancelled = true; mountedRef.current = false; stopMedia()
      if (selfRef.current) {
        api.participants.leaveOnExit(selfRef.current.meeting_id, selfRef.current.id)
        selfRef.current = null
      }
    }
  }, [meetingId, router, stopMedia])

  useEffect(() => {
    if (phase !== 'room' || !meeting) return
    const leaveOnExit = () => {
      if (selfRef.current) {
        api.participants.leaveOnExit(meeting.id, selfRef.current.id)
        selfRef.current = null
      }
    }
    window.addEventListener('pagehide', leaveOnExit)
    return () => { window.removeEventListener('pagehide', leaveOnExit); leaveOnExit() }
  }, [phase, meeting])

  useEffect(() => {
    if (phase !== 'room' || !meeting) return
    let cancelled = false
    let polling = false
    const refresh = async () => {
      if (polling) return
      polling = true
      try {
        const [m, ps] = await Promise.all([api.meetings.get(meeting.id), api.participants.list(meeting.id)])
        if (cancelled) return
        if (m.status === 'ended') { stopMedia(); setPhase('ended'); return }
        const self = ps.find((p) => p.id === selfRef.current?.id)
        if (!self) { stopMedia(); setError('You have been removed from this meeting.'); setPhase('error'); return }
        if (self.is_muted !== mutedRef.current) {
          mutedRef.current = self.is_muted
          setMuted(self.is_muted)
          streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !self.is_muted })
        }
        setParticipants(ps)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not refresh participants.')
      } finally { polling = false }
    }
    const timer = setInterval(refresh, 3000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [phase, meeting, stopMedia])

  const start = async (withMedia = true) => {
    if (!meeting || busy) return
    setBusy(true); setError('')
    try {
      if (withMedia && !streamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          if (!mountedRef.current) { stream.getTracks().forEach(track => track.stop()); return }
          streamRef.current = stream
          mutedRef.current = false; videoOffRef.current = false
          setMuted(false); setVideoOff(false)
          if (videoRef.current) videoRef.current.srcObject = stream
        } catch {
          mutedRef.current = true; videoOffRef.current = true; setMuted(true); setVideoOff(true)
          setMediaNotice('Camera or microphone access was denied or no device is available. You joined without them.')
        }
      } else if (!withMedia) {
        stopMedia()
        mutedRef.current = true; videoOffRef.current = true; setMuted(true); setVideoOff(true)
      }
      if (isHost) setMeeting(await api.meetings.setStatus(meeting.id, 'active'))
      const participant = selfRef.current ?? await api.participants.join(meeting.id, displayName, hostId)
      if (!mountedRef.current) { api.participants.leaveOnExit(meeting.id, participant.id); return }
      selfRef.current = participant
      if (participant.is_muted !== mutedRef.current) await api.participants.mute(meeting.id, participant.id, mutedRef.current)
      setParticipants(await api.participants.list(meeting.id))
      setPhase('room')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not join meeting.') }
    finally { setBusy(false) }
  }

  const toggleMic = async () => {
    if (!streamRef.current?.getAudioTracks().length) { setError('No microphone is available. Check device permissions and reload.'); return }
    const next = !mutedRef.current
    if (meeting && selfRef.current) {
      try { await api.participants.mute(meeting.id, selfRef.current.id, next) }
      catch (err) { setError(err instanceof Error ? err.message : 'Could not update microphone.'); return }
    }
    mutedRef.current = next; setMuted(next)
    streamRef.current.getAudioTracks().forEach((track) => { track.enabled = !next })
  }

  const toggleVideo = () => {
    if (!streamRef.current?.getVideoTracks().length) { setError('No camera is available. Check device permissions and reload.'); return }
    videoOffRef.current = !videoOffRef.current; setVideoOff(videoOffRef.current)
    streamRef.current.getVideoTracks().forEach((track) => { track.enabled = !videoOffRef.current })
  }

  const exit = async (endForAll: boolean) => {
    if (!meeting || busy) return
    setBusy(true); setError('')
    try {
      if (endForAll) await api.meetings.setStatus(meeting.id, 'ended')
      else if (selfRef.current) await api.participants.remove(meeting.id, selfRef.current.id)
      selfRef.current = null; stopMedia()
      router.push(endForAll ? '/meetings' : '/')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not leave meeting.'); setBusy(false) }
  }

  const hostAction = async (pid?: number) => {
    if (!meeting || !isHost || busy) return
    setBusy(true); setError('')
    try {
      if (pid === undefined) await api.participants.muteAll(meeting.id)
      else await api.participants.remove(meeting.id, pid)
      setParticipants(await api.participants.list(meeting.id))
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update participants.') }
    finally { setBusy(false) }
  }

  const copyInvite = async (urlOnly = false) => {
    if (!meeting) return
    try {
      await copyText(urlOnly ? getJoinUrl(meeting.meeting_id) : buildInvitationText(meeting))
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { setError('Could not copy. Select the invitation text and copy it manually.') }
  }

  const initials = displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  if (phase === 'loading') return <div className="room-loading"><Spinner size={64} /><p>Joining Meeting...</p></div>
  if (phase === 'ended' || phase === 'error') return <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4 text-white p-4 text-center">
    <p className="text-lg">{phase === 'ended' ? 'This meeting has ended.' : error}</p>
    <Link href="/" className="text-blue-400 hover:underline text-sm">Return home</Link>
  </div>

  const video = <div className="room-video relative flex-1 min-h-0" style={phase === 'preview' ? { aspectRatio: '16/9' } : undefined}>
    <video ref={attachVideo} autoPlay muted playsInline className={`w-full h-full object-contain ${videoOff ? 'hidden' : ''}`} />
    {videoOff && <div className="absolute inset-0 flex items-center justify-center">
      <div className="room-avatar">{initials}</div>
    </div>}
    <div className="room-name absolute bottom-3 left-3 flex items-center gap-1.5 text-white bg-black/50 px-2 py-1 rounded">
      {muted && <MicOff size={13} className="text-red-400" />}{displayName} ({isHost ? 'Host, me' : 'me'})
    </div>
  </div>

  if (phase === 'preview') return <WorkplaceFrame initials={initials}>
    <div className="room-permission-stage"><section className="room-permission" aria-label="Meeting preview">
      <Link href="/" aria-label="Cancel preview" className="room-permission-close"><X size={20} /></Link>
      <div className="room-permission-art"><div><Camera size={58} /><Mic size={44} /></div><span /><span /></div>
      <h1>Do you want people to see you in the meeting?</h1><p>You can turn off your microphone and camera anytime.</p>
      <button disabled={busy} onClick={() => start(true)} className="room-permission-primary">{busy ? 'Joining...' : 'Use microphone and camera'}</button>
      <button disabled={busy} onClick={() => start(false)} className="room-permission-secondary">Continue without microphone and camera</button>
      {error && <p role="alert" className="room-permission-error">{error}</p>}
    </section></div>
  </WorkplaceFrame>

  return <WorkplaceFrame initials={initials} inMeeting><div className="room-content">
    <header className="room-titlebar"><h1 className="text-sm font-medium truncate">{meeting?.title}</h1><button onClick={() => setShowInvite(true)} aria-label="Meeting information"><Info size={17} /></button><Shield size={18} className="text-green-400 shrink-0" /></header>
    {error && <div role="alert" className="text-sm text-red-200 bg-red-950 px-4 py-2 flex justify-between gap-2">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
    {mediaNotice && <p role="status" className="room-media-notice">{mediaNotice}</p>}
    <div className="room-stage relative flex flex-1 min-h-0">
      {video}
      {showParticipants && <aside className="room-participants absolute inset-y-0 right-0 sm:relative flex flex-col z-10 shrink-0">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 text-white"><h2 className="text-sm font-semibold">Participants ({participants.length})</h2><button onClick={() => setShowParticipants(false)} aria-label="Close participants"><X size={18} /></button></div>
        <div className="flex-1 overflow-auto py-2">{participants.map((p) => <div key={p.id} className="flex justify-between items-center gap-2 px-4 py-3 text-white text-xs">
          <span className="participant-avatar">{p.display_name[0]?.toUpperCase()}</span><span className="truncate flex-1">{p.display_name}{p.role === 'host' ? ' (Host)' : ''}{p.id === selfRef.current?.id ? ' (me)' : ''}</span>
          <div className="flex items-center gap-2">{p.is_muted && <MicOff size={13} />}{isHost && p.role !== 'host' && <button disabled={busy} onClick={() => hostAction(p.id)} aria-label={`Remove ${p.display_name}`} className="hover:text-red-400"><X size={15} /></button>}</div>
        </div>)}</div>
        <div className="flex gap-2 p-3 border-t border-gray-700"><button onClick={() => setShowInvite(true)} className="flex-1 rounded bg-gray-600 text-white text-xs py-2">Invite</button>{isHost && <button disabled={busy} onClick={() => hostAction()} className="flex-1 rounded bg-gray-600 text-white text-xs py-2 disabled:opacity-50">Mute All</button>}</div>
      </aside>}
    </div>
    <footer className="room-toolbar">
      <div className="room-toolbar-controls">
        <Control icon={muted ? <MicOff size={20} /> : <Mic size={20} />} label={muted ? 'Unmute' : 'Mute'} onClick={toggleMic} active={muted} />
        <Control icon={videoOff ? <VideoOff size={20} /> : <Video size={20} />} label={videoOff ? 'Start Video' : 'Stop Video'} onClick={toggleVideo} active={videoOff} />
        <Control icon={<Users size={20} />} label="Participants" onClick={() => setShowParticipants((v) => !v)} active={showParticipants} />
        <Control icon={<MessageSquare size={20} />} label="Chat" disabled />
        <Control icon={<Heart size={20} />} label="React" disabled />
        <Control icon={<ScreenShare size={20} />} label="Share" disabled />
        {isHost && <Control icon={<Shield size={20} />} label="Host tools" onClick={() => setShowParticipants(true)} />}
        <Control icon={<CircleEllipsis size={20} />} label="More" onClick={() => setShowInvite(true)} />
      </div>
      <div className="relative shrink-0"><button disabled={busy} onClick={() => setShowEndMenu((v) => !v)} className="room-end-control"><OctagonX size={15} />{isHost ? 'End' : 'Leave'}</button>
        {showEndMenu && <div className="room-end-menu">
          {isHost && <button disabled={busy} onClick={() => exit(true)} className="w-full text-left px-4 py-3 bg-red-600 hover:bg-red-700">End Meeting for All</button>}
          <button disabled={busy} onClick={() => exit(false)} className="w-full text-left px-4 py-3 hover:bg-gray-700">Leave Meeting</button>
          <button onClick={() => setShowEndMenu(false)} className="w-full text-right px-4 py-2 text-xs text-gray-300">Cancel</button>
        </div>}
      </div>
    </footer>
    {showInvite && meeting && <Modal title="Invite People" onClose={() => setShowInvite(false)}>
      <p className="text-sm text-gray-600 mb-3">Meeting ID: <span className="font-mono">{formatMeetingId(meeting.meeting_id)}</span></p>
      <pre className="whitespace-pre-wrap break-all select-text text-xs bg-gray-50 border rounded-lg p-3 mb-4">{buildInvitationText(meeting)}</pre>
      <div className="flex flex-wrap gap-2"><button onClick={() => copyInvite(true)} className="border rounded-lg px-3 py-2 text-sm">Copy URL</button><button onClick={() => copyInvite()} className="bg-[#0B5CFF] text-white rounded-lg px-3 py-2 text-sm flex items-center gap-1">{copied && <CheckCheck size={14} />}{copied ? 'Copied!' : 'Copy Invitation'}</button></div>
    </Modal>}
  </div></WorkplaceFrame>
}
