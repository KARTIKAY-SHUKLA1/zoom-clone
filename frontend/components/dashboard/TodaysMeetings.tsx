import type { Meeting } from '@/types'
import { formatMeetingId, getMeetingTimeRange, isToday } from '@/lib/utils'
import { Clock, Video } from 'lucide-react'
import Link from 'next/link'
import Spinner from '@/components/ui/Spinner'

interface Props {
  meetings: Meeting[]
  loading: boolean
  error: string
}

export default function TodaysMeetings({ meetings, loading, error }: Props) {
  const today = meetings.filter((m) => isToday(m.start_time))

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Today&apos;s Meetings
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400 text-center py-4">{error}</p>
      ) : today.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <Clock size={28} className="text-gray-200" />
          <p className="text-sm text-gray-400">No meetings scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {today.map((m) => (
            <Link
              key={m.id}
              href={`/meetings?selected=${m.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Video size={15} className="text-[#0B5CFF]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                <p className="text-xs text-gray-400">{getMeetingTimeRange(m)}</p>
              </div>
              <span className="text-xs text-gray-300 flex-shrink-0 font-mono">
                {formatMeetingId(m.meeting_id)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
