'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import type { MeetingCreate } from '@/types'

const DURATIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '40 minutes', value: 40 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
]

interface Props {
  onSaved: () => void
  onCancel: () => void
  initial?: Partial<MeetingCreate> & { id?: number }
}

export default function ScheduleForm({ onSaved, onCancel, initial }: Props) {
  const defaultStart = new Date(Date.now() + 30 * 60_000)
  const defaultDate = defaultStart.toISOString().slice(0, 10)
  const defaultTime = defaultStart.toTimeString().slice(0, 5)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime)
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 40)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Topic is required'); return }
    setSaving(true)
    setError('')
    try {
      const data: MeetingCreate = {
        title: title.trim(),
        description: desc.trim() || undefined,
        start_time: `${date}T${time}:00`,
        duration_minutes: duration,
      }
      if (initial?.id) {
        await api.meetings.update(initial.id, data)
      } else {
        await api.meetings.schedule(data)
      }
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CFF] focus:border-transparent transition-shadow'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="text-red-500">* </span>Topic
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder="Meeting topic"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
          placeholder="Add a meeting description"
        />
      </div>

      {/* When */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">When</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputCls} flex-1`}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`${inputCls} flex-1`}
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className={inputCls}
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#0B5CFF] hover:bg-[#0a50e0] disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
