'use client'

import { useRouter } from 'next/navigation'
import ScheduleForm from '@/components/meetings/ScheduleForm'
import { ChevronLeft } from 'lucide-react'

export default function SchedulePage() {
  const router = useRouter()

  return (
    <div className="max-w-xl mx-auto px-6 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Meetings
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Schedule Meeting
      </h1>

      <ScheduleForm
        onSaved={() => router.push('/meetings')}
        onCancel={() => router.back()}
      />
    </div>
  )
}
