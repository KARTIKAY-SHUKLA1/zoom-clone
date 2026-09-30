import type { Meeting } from '@/types'

/** Clipboard API needs HTTPS; use a selectable textarea on older browsers. */
export async function copyText(value: string): Promise<void> {
  try {
    if (navigator.clipboard) { await navigator.clipboard.writeText(value); return }
  } catch { /* Try the legacy clipboard operation below. */ }
  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  try {
    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable')
  } finally { input.remove() }
}

export function isMeetingNow(m: Meeting): boolean {
  const start = new Date(m.start_time).getTime()
  return m.status === 'active' || (m.status === 'scheduled' && start <= Date.now() && Date.now() < start + m.duration_minutes * 60_000)
}

/**
 * Format 11-digit plain ID as "XXX XXXX XXXX" (3-4-4 grouping).
 * Only used for display — the backend always stores/receives plain digits.
 */
export function formatMeetingId(id: string): string {
  if (/^\d{11}$/.test(id)) {
    return `${id.slice(0, 3)} ${id.slice(3, 7)} ${id.slice(7)}`
  }
  return id
}

/** "10:28 PM" */
export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** "Mon, Sep 29" */
export function formatShortDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** "10:28 PM – 11:08 PM" */
export function getMeetingTimeRange(m: Meeting): string {
  const start = new Date(m.start_time)
  const end = new Date(start.getTime() + m.duration_minutes * 60_000)
  return `${formatTime(start.toISOString())} - ${formatTime(end.toISOString())}`
}

export function isToday(isoStr: string): boolean {
  const d = new Date(isoStr)
  const t = new Date()
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  )
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Build a shareable join URL using window.location.origin so deployed
 * links always point to the actual domain, never hardcoded localhost.
 */
export function getJoinUrl(meetingId: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_FRONTEND_URL ?? ''
  return `${origin}/join?mid=${meetingId}`
}

/**
 * Full invitation text for clipboard copy.
 * Uses window.location.origin — works correctly on Vercel deployment.
 */
export function buildInvitationText(m: Meeting): string {
  const displayId = formatMeetingId(m.meeting_id)
  const joinUrl = getJoinUrl(m.meeting_id)
  return (
    `${m.title} is inviting you to a scheduled Zoom meeting.\n\n` +
    `Meeting ID: ${displayId}\n` +
    `Passcode: ${m.passcode}\n` +
    `Join link: ${joinUrl}`
  )
}
