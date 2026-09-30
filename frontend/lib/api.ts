import type { Meeting, MeetingCreate, Participant, User } from '@/types'

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store',
      signal: init?.signal ?? AbortSignal.timeout(90_000),
    })
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({ detail: 'Unknown error' }))
  if (!res.ok) {
    const detail = body.detail
    const message = Array.isArray(detail)
      ? detail.map((item: { msg?: string }) => item.msg ?? 'Invalid input').join('; ')
      : typeof detail === 'string' ? detail : `Request failed (HTTP ${res.status})`
    throw new Error(message)
  }
  return body as T
}

export const api = {
  users: {
    me: (): Promise<User> => req('/api/users/me'),
  },

  meetings: {
    list: (type: 'upcoming' | 'previous'): Promise<Meeting[]> =>
      req(`/api/meetings/?type=${type}`),
    get: (id: number): Promise<Meeting> => req(`/api/meetings/${id}`),
    instant: (): Promise<Meeting> =>
      req('/api/meetings/instant', { method: 'POST' }),
    schedule: (data: MeetingCreate): Promise<Meeting> =>
      req('/api/meetings/', { method: 'POST', body: JSON.stringify(data) }),
    validate: (input: string): Promise<Meeting> =>
      req('/api/meetings/validate', {
        method: 'POST',
        body: JSON.stringify({ meeting_input: input }),
      }),
    update: (id: number, data: Partial<MeetingCreate>): Promise<Meeting> =>
      req(`/api/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      req(`/api/meetings/${id}`, { method: 'DELETE' }),
    setStatus: (
      id: number,
      status: 'scheduled' | 'active' | 'ended',
    ): Promise<Meeting> =>
      req(`/api/meetings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  participants: {
    list: (pk: number): Promise<Participant[]> =>
      req(`/api/meetings/${pk}/participants/`),
    join: (pk: number, display_name: string, user_id?: number): Promise<Participant> =>
      req(`/api/meetings/${pk}/participants/`, {
        method: 'POST',
        body: JSON.stringify({ display_name, user_id }),
      }),
    remove: (pk: number, pid: number): Promise<void> =>
      req(`/api/meetings/${pk}/participants/${pid}`, { method: 'DELETE' }),
    leaveOnExit: (pk: number, pid: number): void => {
      const url = `${BASE}/api/meetings/${pk}/participants/${pid}/leave`
      if (!navigator.sendBeacon(url)) void fetch(url, { method: 'POST', keepalive: true }).catch(() => {})
    },
    mute: (pk: number, pid: number, is_muted?: boolean): Promise<Participant> =>
      req(`/api/meetings/${pk}/participants/${pid}/mute`, {
        method: 'PATCH', body: is_muted === undefined ? undefined : JSON.stringify({ is_muted }),
      }),
    muteAll: (pk: number): Promise<{ message: string }> =>
      req(`/api/meetings/${pk}/participants/mute-all`, { method: 'POST' }),
  },
}
