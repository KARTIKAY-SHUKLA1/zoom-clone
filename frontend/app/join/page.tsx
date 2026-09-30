'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Topbar from '@/components/layout/Topbar'

type Step = 'id' | 'launch' | 'name'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('id')
  const [input, setInput] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pending, setPending] = useState<{ id: number; meeting_id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alwaysBrowser, setAlwaysBrowser] = useState(false)

  useEffect(() => {
    setInput(new URLSearchParams(window.location.search).get('mid') ?? '')
    setAlwaysBrowser(localStorage.getItem('zoom-join-from-browser') === 'true')
  }, [])

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const m = await api.meetings.validate(input.trim())
      if (m.status === 'ended') {
        setError('This meeting has already ended.')
        return
      }
      setPending({ id: m.id, meeting_id: m.meeting_id })
      setStep(alwaysBrowser ? 'name' : 'launch')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid meeting ID or meeting not found.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim() || !pending) return
    setLoading(true)
    setError('')
    try {
      sessionStorage.setItem(`meeting-name:${pending.meeting_id}`, displayName.trim())
      router.push(`/room/${pending.meeting_id}?guest=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join. Please try again.')
      setLoading(false)
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CFF] focus:border-transparent'

  return (
    <div className={`join-page ${step === 'launch' ? 'join-launch-page' : ''}`}>
      {/* Minimal header — no sidebar */}
      <Topbar compact onMenuClick={() => {}} />

      <div className="join-content">
        <div className="join-form">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            {step === 'launch' ? 'Join meeting' : 'Join Meeting'}
          </h1>

          {step === 'id' ? (
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Meeting ID or invite link
                </label>
                <input
                  type="text"
                  aria-label="Meeting ID or invite link"
                  required
                  maxLength={2048}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter Meeting ID or invite link"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" checked={alwaysBrowser} onChange={event => { setAlwaysBrowser(event.target.checked); localStorage.setItem('zoom-join-from-browser', String(event.target.checked)) }} className="rounded border-gray-300" />
                Always join from browser
              </label>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-full bg-[#0B5CFF] hover:bg-[#0a50e0] disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Spinner size={14} />}
                Join
              </button>

              <p className="join-room-system">
                Join a meeting from an H.323/SIP room system
              </p>
            </form>
          ) : step === 'launch' ? (
            <div className="join-launch-options">
              <p>How would you like to join this meeting?</p>
              <button disabled className="join-app-button" title="Native Zoom app launch is outside this browser assignment">Join from Zoom Workplace app</button>
              <button onClick={() => setStep('name')} className="join-browser-button">Join from your browser</button>
              <p>This meeting runs in your browser. No download is required.</p>
              <p>By joining, you agree to our <a href="https://explore.zoom.us/en/terms/" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="https://explore.zoom.us/en/privacy/" target="_blank" rel="noreferrer">Privacy Statement</a>.</p>
              <button className="join-launch-back" onClick={() => setStep('id')}>Back</button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  aria-label="Your Name"
                  required
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className={inputCls}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep('id'); setError('') }}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!displayName.trim() || loading}
                  className="flex-1 bg-[#0B5CFF] hover:bg-[#0a50e0] disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size={14} />}
                  Join Meeting
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="join-footer">
        &copy; {new Date().getFullYear()} Zoom Communications, Inc.{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">
          Privacy &amp; Legal Policies
        </span>
      </footer>
    </div>
  )
}
