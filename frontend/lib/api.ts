import type { Meeting, MeetingCreate, Participant, User } from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({ detail: 'Unknown error' }))
  if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`)
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
    join: (pk: number, display_name: string): Promise<Participant> =>
      req(`/api/meetings/${pk}/participants/`, {
        method: 'POST',
        body: JSON.stringify({ display_name }),
      }),
    remove: (pk: number, pid: number): Promise<void> =>
      req(`/api/meetings/${pk}/participants/${pid}`, { method: 'DELETE' }),
    mute: (pk: number, pid: number): Promise<Participant> =>
      req(`/api/meetings/${pk}/participants/${pid}/mute`, { method: 'PATCH' }),
    muteAll: (pk: number): Promise<{ message: string }> =>
      req(`/api/meetings/${pk}/participants/mute-all`, { method: 'POST' }),
  },
}
