'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react'

function key(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function display(value: string) { const [y, m, d] = value.split('-'); return `${m}-${d}-${y}` }

export default function DateRangePicker({ from, to, previous, onChange }: {
  from: string; to: string; previous: boolean; onChange: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selection, setSelection] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const today = new Date(), end = new Date(), start = new Date()
  if (previous) { start.setMonth(start.getMonth() - 3); end.setDate(end.getDate() - 1) }
  else end.setMonth(end.getMonth() + 3)
  const shownFrom = from || key(start), shownTo = to || key(end)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) { setOpen(false); setSelection(null) } }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); setSelection(null); root.current?.querySelector('button')?.focus() } }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [open])
  const choose = (value: string) => {
    if (!selection) { setSelection(value); return }
    onChange(value < selection ? value : selection, value < selection ? selection : value)
    setSelection(null); setOpen(false)
  }
  return <div className="date-range" ref={root}>
    <button className="date-range-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Choose meeting date range"><CalendarDays /><span>{display(shownFrom)} to {display(shownTo)}</span></button>
    <span className="date-range-help" tabIndex={0}><CircleHelp /><span role="tooltip">Only meetings in the selected time range will appear. You can see more meetings by updating the time range.</span></span>
    {open && <div className="date-range-popover" role="dialog" aria-label="Meeting date range">
      <div className="range-inputs"><label>From date<input type="date" aria-label="From date" value={shownFrom} max={shownTo} onChange={e => onChange(e.target.value, shownTo)} /></label><label>To date<input type="date" aria-label="To date" value={shownTo} min={shownFrom} onChange={e => onChange(shownFrom, e.target.value)} /></label></div>
      <div className="range-calendars">{[0, 1].map(offset => {
        const current = new Date(month.getFullYear(), month.getMonth() + offset, 1)
        const first = new Date(current); first.setDate(1 - current.getDay())
        return <div key={offset} className="range-month"><div className="range-month-heading">{offset === 0 ? <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button> : <span />}<strong>{current.toLocaleDateString('en-US', {month:'long',year:'numeric'})}</strong>{offset === 1 ? <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button> : <span />}</div><div className="range-grid">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => <span key={day}>{day}</span>)}{Array.from({length:42}, (_, index) => {
          const date = new Date(first); date.setDate(first.getDate() + index); const value = key(date)
          return <button key={value} aria-label={date.toLocaleDateString('en-US', {dateStyle:'full'})} aria-pressed={value === (selection || shownFrom) || value === shownTo} className={`${date.getMonth() !== current.getMonth() ? 'outside-month' : ''} ${!selection && value >= shownFrom && value <= shownTo ? 'within-range' : ''} ${value === key(today) ? 'current-day' : ''}`} onClick={() => choose(value)}>{date.getDate()}</button>
        })}</div></div>
      })}</div><p>{selection ? 'Choose the end date.' : 'Choose a start date and an end date.'}</p>
    </div>}
  </div>
}
