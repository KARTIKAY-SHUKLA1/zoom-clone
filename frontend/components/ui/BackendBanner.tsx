'use client'

import { useEffect, useState } from 'react'
import Spinner from './Spinner'

type Status = 'checking' | 'slow' | 'error' | 'ok'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function BackendBanner() {
  const [status, setStatus] = useState<Status>('checking')
  const [elapsed, setElapsed] = useState(0)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    const start = Date.now()

    setStatus('checking')
    setElapsed(0)

    // Show "waking up" message after 8 s of silence
    const slowTimer = setTimeout(() => {
      if (!cancelled) setStatus('slow')
    }, 8000)

    // Tick elapsed seconds for the wakeup counter
    const ticker = setInterval(() => {
      if (!cancelled) setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    fetch(`${API}/health`, { signal: ctrl.signal, cache: 'no-store' })
      .then((r) => {
        if (!cancelled) setStatus(r.ok ? 'ok' : 'error')
      })
      .catch((err: unknown) => {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setStatus('error')
        }
      })
      .finally(() => {
        clearTimeout(slowTimer)
        clearInterval(ticker)
      })

    return () => {
      cancelled = true
      ctrl.abort()
      clearTimeout(slowTimer)
      clearInterval(ticker)
    }
  }, [attempt]) // re-runs on each Retry click

  if (status === 'ok') return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm text-amber-900">
      {(status === 'checking' || status === 'slow') && (
        <span className="flex-shrink-0">
          <Spinner size={16} />
        </span>
      )}
      {status === 'error' && (
        <span className="flex-shrink-0 text-base">⚠️</span>
      )}

      <span className="flex-1">
        {status === 'checking' && 'Connecting to server…'}
        {status === 'slow' && (
          <>
            ☕ Backend is waking up — Render free tier takes ~30–60 s on first
            load.{' '}
            <span className="font-mono font-semibold">{elapsed}s</span> elapsed.
          </>
        )}
        {status === 'error' &&
          'Could not reach the server. Make sure the backend is running.'}
      </span>

      {(status === 'slow' || status === 'error') && (
        <button
          onClick={() => setAttempt((a) => a + 1)}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-50 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
