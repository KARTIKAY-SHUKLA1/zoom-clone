import { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  label: string
  color: 'orange' | 'blue'
  onClick: () => void
  disabled?: boolean
}

export default function ActionButton({
  icon,
  label,
  color,
  onClick,
  disabled,
}: Props) {
  const bg =
    color === 'orange'
      ? 'bg-[#FF6B00] hover:bg-[#e55e00] active:scale-95'
      : 'bg-[#0B5CFF] hover:bg-[#0a50e0] active:scale-95'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div
        className={`w-[72px] h-[72px] rounded-full ${bg} flex items-center justify-center text-white transition-all duration-150 shadow-md`}
      >
        {icon}
      </div>
      <span className="text-[13px] text-gray-700 font-medium">{label}</span>
    </button>
  )
}
