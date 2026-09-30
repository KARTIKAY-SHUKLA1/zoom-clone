import type { Meeting } from '@/types'

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

export function buildInvitationText(m: Meeting): string {
  const displayId = formatMeetingId(m.meeting_id)
  return (
    `${m.title} is inviting you to a scheduled Zoom meeting.\n\n` +
    `Meeting ID: ${displayId}\n` +
    `Passcode: ${m.passcode}\n` +
    `Join link: ${m.invite_link}`
  )
}
