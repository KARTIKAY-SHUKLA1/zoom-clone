'use client'

import { useEffect, useRef, useState } from 'react'
import Spinner from './Spinner'

type Status = 'checking' | 'slow' | 'error' | 'blocked' | 'ok'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function BackendBanner() {
  const [status, setStatus] = useState<Status>('checking')
  const [elapsed, setElapsed] = useState(0)
  const [attempt, setAttempt] = useState(0)

  // Persists across re-renders but doesn't trigger re-renders itself
  const failCount = useRef(0)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    const start = Date.now()

    setStatus('checking')
    setElapsed(0)

    // After 8 s of silence, tell the user Render is waking up
    const slowTimer = setTimeout(() => {
      if (!cancelled) setStatus('slow')
    }, 8000)

    // Tick elapsed seconds so the user sees progress
    const ticker = setInterval(() => {
      if (!cancelled) setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    // Use a real API endpoint — ad blockers / Edge Tracking Prevention
    // routinely block requests to /health, /ping, /status, etc.
    fetch(`${API}/api/meetings/?type=upcoming`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
      .then((r) => {
        if (cancelled) return
        if (r.ok) {
          failCount.current = 0
          setStatus('ok')
        } else {
          failCount.current += 1
          setStatus(failCount.current >= 3 ? 'blocked' : 'error')
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        // AbortError just means we cleaned up — not a real failure
        if ((err as Error).name === 'AbortError') return
        failCount.current += 1
        setStatus(failCount.current >= 3 ? 'blocked' : 'error')
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
  }, [attempt]) // re-runs whenever the user clicks Retry

  // Nothing to show — server is reachable
  if (status === 'ok') return null

  const handleRetry = () => {
    // Give the user a clean slate when retrying after the blocked message
    // (they may have just disabled their extension)
    if (status === 'blocked') failCount.current = 0
    setAttempt((a) => a + 1)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm text-amber-900"
    >
      {/* Icon */}
      {(status === 'checking' || status === 'slow') && (
        <span className="flex-shrink-0 mt-0.5">
          <Spinner size={15} />
        </span>
      )}
      {(status === 'error' || status === 'blocked') && (
        <span className="flex-shrink-0 text-base leading-none mt-0.5" aria-hidden>
          ⚠️
        </span>
      )}

      {/* Message */}
      <span className="flex-1 leading-snug">
        {status === 'checking' && 'Connecting to server…'}

        {status === 'slow' && (
          <>
            ☕ Backend is waking up — Render free tier takes ~30–60 s on first
            load.{' '}
            <span className="font-mono font-semibold">{elapsed}s</span> elapsed.
          </>
        )}

        {status === 'error' &&
          'Could not reach the server. Check your connection and retry.'}

        {status === 'blocked' && (
          <>
            Can&apos;t reach the server. If you use an{' '}
            <strong>ad blocker or privacy extension</strong>, disable it for
            this site and retry.
          </>
        )}
      </span>

      {/* Retry button — visible once the first attempt finishes */}
      {(status === 'slow' || status === 'error' || status === 'blocked') && (
        <button
          onClick={handleRetry}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-50 active:scale-95 transition-all mt-0.5"
        >
          Retry
        </button>
      )}
    </div>
  )
}
