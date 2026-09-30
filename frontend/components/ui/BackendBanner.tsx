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
    const timeout = setTimeout(() => ctrl.abort(), 90_000)

    setStatus('checking')
    setElapsed(0)

    // Show progress if the server takes longer than usual.
    const slowTimer = setTimeout(() => {
      if (!cancelled) setStatus('slow')
    }, 8000)

    // Tick elapsed seconds so the user sees progress
    const ticker = setInterval(() => {
      if (!cancelled) setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    // Check the same endpoint needed to load the dashboard.
    fetch(`${API}/api/meetings/?type=upcoming`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
      .then((r) => {
        if (cancelled) return
        if (r.ok) {
          setStatus('ok')
        } else {
          setStatus('error')
        }
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
      .finally(() => {
        clearTimeout(slowTimer)
        clearTimeout(timeout)
        clearInterval(ticker)
      })

    return () => {
      cancelled = true
      ctrl.abort()
      clearTimeout(slowTimer)
      clearTimeout(timeout)
      clearInterval(ticker)
    }
  }, [attempt]) // re-runs whenever the user clicks Retry

  // Nothing to show — server is reachable
  if (status === 'ok') return null

  const handleRetry = () => {
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
      {status === 'error' && (
        <span className="flex-shrink-0 text-base leading-none mt-0.5" aria-hidden>
          ⚠️
        </span>
      )}

      {/* Message */}
      <span className="flex-1 leading-snug">
        {status === 'checking' && 'Connecting to server…'}

        {status === 'slow' && (
          <>
            The server is taking longer than usual to respond.{' '}
            <span className="font-mono font-semibold">{elapsed}s</span> elapsed.
          </>
        )}

        {status === 'error' &&
          'Could not reach the server. Check your connection and retry.'}

      </span>

      {/* Retry button — visible once the first attempt finishes */}
      {(status === 'slow' || status === 'error') && (
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
