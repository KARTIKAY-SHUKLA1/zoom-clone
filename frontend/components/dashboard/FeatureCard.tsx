import { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  description: string
  iconBg: string
}

export default function FeatureCard({ icon, title, description, iconBg }: Props) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div
        className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center text-white mb-3`}
      >
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold text-gray-800">{title}</h3>
      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{description}</p>
    </div>
  )
}
