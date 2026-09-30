'use client'

import { useEffect, useState } from 'react'

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // SSR placeholder — same height to avoid layout shift
  if (!now) return <div className="h-28" />

  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="text-center select-none">
      <div className="text-[88px] leading-none font-extralight tracking-tighter text-gray-900 tabular-nums">
        {hh}:{mm}
      </div>
      <p className="text-base text-gray-400 mt-2 font-light">{dateStr}</p>
    </div>
  )
}
