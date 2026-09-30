'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export default function Modal({
  title,
  onClose,
  children,
  width = 'max-w-lg',
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusables = () => Array.from(cardRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') ?? [])
    if (!cardRef.current?.contains(document.activeElement)) focusables()[0]?.focus()
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const elements = focusables()
        const first = elements[0], last = elements[elements.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', h)
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = overflow; previous?.focus() }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Card */}
      <div ref={cardRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} z-10 max-h-[90dvh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-0.5 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
