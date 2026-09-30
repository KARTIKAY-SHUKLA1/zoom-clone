export interface User {
  id: number
  name: string
  email: string
  /** 11 plain digits — no spaces. Format with formatMeetingId() for display. */
  personal_meeting_id: string
  avatar_initials: string
  plan: string
  created_at: string
}

export interface Meeting {
  id: number
  title: string
  description: string | null
  host_id: number
  /** 11 plain digits — display as "XXX XXXX XXXX" (3-4-4) on frontend only. */
  meeting_id: string
  passcode: string
  invite_link: string
  status: 'scheduled' | 'active' | 'ended'
  is_instant: boolean
  /** ISO UTC datetime string */
  start_time: string
  duration_minutes: number
  time_zone: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

export interface MeetingCreate {
  title: string
  description?: string
  /** ISO datetime string */
  start_time: string
  duration_minutes?: number
  time_zone?: string
  is_recurring?: boolean
}

export interface Participant {
  id: number
  meeting_id: number
  user_id: number | null
  display_name: string
  role: 'host' | 'participant'
  is_muted: boolean
  is_video_off: boolean
  joined_at: string
  left_at: string | null
}
