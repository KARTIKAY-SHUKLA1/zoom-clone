'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'

type Step = 'id' | 'name'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('id')
  const [input, setInput] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pending, setPending] = useState<{ id: number; meeting_id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      setStep('name')
    } catch {
      setError('Invalid meeting ID or meeting not found.')
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
      await api.participants.join(pending.id, displayName.trim())
      router.push(`/room/${pending.meeting_id}`)
    } catch {
      setError('Failed to join. Please try again.')
      setLoading(false)
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CFF] focus:border-transparent'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header — no sidebar */}
      <header className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="text-[#0B5CFF] font-bold text-xl select-none">
          zoom
        </Link>
        <span className="text-xs text-gray-400">
          Support &nbsp;·&nbsp;
          <span className="text-[#0B5CFF] cursor-pointer hover:underline">English</span>
        </span>
      </header>

      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <div className="w-full max-w-[380px]">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Join Meeting
          </h1>

          {step === 'id' ? (
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Meeting ID or Personal Link Name
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter Meeting ID or Personal Link Name"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-gray-300" />
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

              <p className="text-center text-xs text-[#0B5CFF] hover:underline cursor-pointer mt-2">
                Join a meeting from an H.323/SIP room system
              </p>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
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

      <footer className="py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Zoom Communications, Inc.{' '}
        <span className="text-[#0B5CFF] cursor-pointer hover:underline">
          Privacy &amp; Legal Policies
        </span>
      </footer>
    </div>
  )
}
