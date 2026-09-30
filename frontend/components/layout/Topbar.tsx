import { Search, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function Topbar() {
  return (
    <div className="flex-shrink-0 z-10">
      {/* ── Dark utility bar ─────────────────────────────────────────── */}
      <div className="bg-[#1C1C1E] h-8 flex items-center px-6 gap-6 text-xs">
        <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors">
          <Search size={11} /> Search
        </button>
        <span className="text-gray-500">Support</span>
        <span className="text-gray-500">0008000503335</span>
        <div className="ml-auto flex items-center gap-5">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">Contact Sales</button>
          <button className="text-gray-400 hover:text-gray-200 transition-colors">Request a Demo</button>
        </div>
      </div>

      {/* ── White product nav bar ─────────────────────────────────────── */}
      <div className="bg-white h-[52px] border-b border-gray-200 flex items-center px-6 justify-between">
        {/* Left: logo + product links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="select-none">
            <span className="text-[#0B5CFF] font-bold text-[30px] leading-none tracking-tight">zoom</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {['Products', 'Solutions', 'Resources'].map((l) => (
              <button
                key={l}
                className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                {l}
              </button>
            ))}
            <button className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
              Plans &amp; Pricing
            </button>
          </nav>
        </div>

        {/* Right: action links + avatar */}
        <div className="flex items-center gap-4">
          <button className="text-[13px] text-gray-700 hover:text-gray-900 transition-colors">Schedule</button>
          <button className="text-[13px] text-gray-700 hover:text-gray-900 transition-colors">Join</button>
          <button className="flex items-center gap-0.5 text-[13px] text-gray-700 hover:text-gray-900 transition-colors">
            Host <ChevronDown size={12} />
          </button>
          <button className="flex items-center gap-0.5 text-[13px] text-gray-700 hover:text-gray-900 transition-colors">
            Web App <ChevronDown size={12} />
          </button>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold select-none">
            K
          </div>
        </div>
      </div>
    </div>
  )
}
