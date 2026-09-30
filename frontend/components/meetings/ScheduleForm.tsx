'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import type { MeetingCreate } from '@/types'

interface Props {
  onSaved: () => void
  onCancel: () => void
  initial?: Partial<MeetingCreate> & { id?: number }
}

export default function ScheduleForm({ onSaved, onCancel, initial }: Props) {
  const defaultStart = initial?.start_time ? new Date(initial.start_time) : new Date(Date.now() + 30 * 60_000)
  const defaultDate = `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}-${String(defaultStart.getDate()).padStart(2, '0')}`
  const defaultTime = `${String(defaultStart.getHours() % 12 || 12).padStart(2, '0')}:${String(defaultStart.getMinutes()).padStart(2, '0')}`

  const [title, setTitle] = useState(initial?.title ?? 'My Meeting')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime)
  const [period, setPeriod] = useState(defaultStart.getHours() >= 12 ? 'PM' : 'AM')
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 40)
  const [showDescription, setShowDescription] = useState(Boolean(initial?.description) || Boolean(initial?.id))
  const [recurring, setRecurring] = useState(initial?.is_recurring ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (duration < 1 || duration > 1800) { setError('Duration must be between 1 minute and 30 hours.'); return }
    if (!title.trim()) { setError('Topic is required'); return }
    const [hours, minutes] = time.split(':').map(Number)
    if (!/^\d{1,2}:\d{2}$/.test(time) || hours < 1 || hours > 12 || minutes > 59) { setError('Enter a valid time, such as 02:30 PM.'); return }
    const clock = `${String(hours % 12 + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    const start = new Date(`${date}T${clock}:00`)
    if (!date || !time || Number.isNaN(start.getTime())) { setError('Choose a valid date and time.'); return }
    const original = initial?.start_time ? new Date(initial.start_time) : null
    // Compare the minutes shown by the form, while preserving unchanged seconds.
    const timeChanged = !original || Math.floor(start.getTime() / 60_000) !== Math.floor(original.getTime() / 60_000)
    if (timeChanged && start.getTime() <= Date.now()) { setError('Choose a start time in the future.'); return }
    setSaving(true)
    setError('')
    try {
      const data: MeetingCreate = {
        title: title.trim(),
        description: desc.trim(),
        start_time: !timeChanged && initial?.start_time ? initial.start_time : start.toISOString(),
        duration_minutes: duration,
        time_zone: initial?.time_zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_recurring: recurring,
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

  return (
    <form onSubmit={handleSubmit} className={`schedule-form ${initial?.id ? 'schedule-form-edit' : ''}`}>
      <div className="schedule-field"><label htmlFor="meeting-topic"><span className="text-red-500">* </span>Topic</label><input id="meeting-topic" aria-label="Topic" maxLength={200} required value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
      <div className="schedule-field"><span />{showDescription ? <textarea aria-label="Description" maxLength={5000} value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Add a meeting description" /> : <button type="button" className="schedule-description-toggle" onClick={() => setShowDescription(true)}>Add Description</button>}</div>
      <div className="schedule-field"><label htmlFor="meeting-date">When</label><div className="schedule-when"><input id="meeting-date" type="date" aria-label="Meeting date" required value={date} onChange={e => setDate(e.target.value)} /><input type="text" inputMode="numeric" aria-label="Meeting time" required value={time} placeholder="HH:MM" onChange={e => setTime(e.target.value)} /><select aria-label="AM or PM" value={period} onChange={e => setPeriod(e.target.value)}><option>AM</option><option>PM</option></select></div></div>
      <div className="schedule-field"><label htmlFor="duration-hours">Duration</label><div className="schedule-duration"><select id="duration-hours" aria-label="Duration hours" value={Math.floor(duration / 60)} onChange={e => setDuration(Number(e.target.value) * 60 + duration % 60)}>{Array.from({length:31}, (_, h) => <option key={h} value={h}>{h}</option>)}</select><span>hr</span><select aria-label="Duration minutes" value={duration % 60} onChange={e => setDuration(Math.floor(duration / 60) * 60 + Number(e.target.value))}>{Array.from({length:60}, (_, m) => <option key={m} value={m}>{m}</option>)}</select><span>min</span></div></div>
      <div className="schedule-field"><span /><div className="schedule-plan-notice"><span aria-hidden="true">&#9888;</span><p>Your Zoom Workplace Basic plan has a 40-minute time limit on meetings with 3 or more participants.<br /><a href="https://zoom.us/pricing" target="_blank" rel="noreferrer">Upgrade</a> to enjoy longer meetings.</p></div></div>
      <div className="schedule-field"><label htmlFor="meeting-zone">Time Zone</label><div><input id="meeting-zone" aria-label="Time Zone" value={new Intl.DateTimeFormat('en-US', {timeZoneName:'longOffset'}).formatToParts(defaultStart).find(part => part.type === 'timeZoneName')?.value + ' ' + Intl.DateTimeFormat().resolvedOptions().timeZone} readOnly title="Dates and times use your browser's local time zone" /><label className="schedule-check"><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />Recurring meeting</label></div></div>
      {!initial?.id && <>
        <div className="schedule-field"><span>Meeting ID</span><div><label className="schedule-check"><input type="radio" checked readOnly />Generate Automatically</label><p className="schedule-help">A unique meeting ID and invitation link will be generated when you save.</p></div></div>
        <div className="schedule-field"><span>Security</span><div><label className="schedule-check"><input type="checkbox" checked readOnly />Passcode</label><p className="schedule-help">A passcode is generated automatically with the meeting invitation.</p></div></div>
      </>}
      {error && <p role="alert" className="schedule-error">{error}</p>}
      <div className="schedule-save"><button type="submit" disabled={saving}>{saving ? 'Saving...' : initial?.id ? 'Update' : 'Save'}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}
