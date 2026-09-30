import { Search, ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'

interface Props {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: Props) {
  return (
    <div className="flex-shrink-0 z-10">
      {/* ── Dark utility bar ──────────────────────────────────────────── */}
      <div className="hidden md:flex bg-[#1C1C1E] h-8 items-center px-6 text-xs">
        {/* Left: Search · Support · Phone */}
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
            <Search size={11} /> Search
          </button>
          <span className="text-gray-400">Support</span>
          <span className="text-gray-400">1.888.799.9666</span>
        </div>
        {/* Right: Contact Sales · Request a Demo */}
        <div className="ml-auto flex items-center gap-5">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">Contact Sales</button>
          <button className="text-gray-400 hover:text-gray-200 transition-colors">Request a Demo</button>
        </div>
      </div>

      {/* ── White product nav bar (no search) ────────────────────────── */}
      <div className="bg-white border-b border-gray-200 h-12 flex items-center px-3 md:px-6 justify-between">
        {/* Left: hamburger (mobile) + logo + nav links (desktop) */}
        <div className="flex items-center gap-2 md:gap-8">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="select-none flex-shrink-0">
            <span className="text-[#0B5CFF] font-bold text-2xl md:text-[30px] leading-none tracking-tight">
              zoom
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {['Products', 'Solutions', 'Resources'].map((label) => (
              <button
                key={label}
                className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <button className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
              Plans &amp; Pricing
            </button>
          </nav>
        </div>

        {/* Right: action links + avatar (no search bar) */}
        <div className="flex items-center gap-1.5 xl:gap-4">
          <button className="hidden xl:block text-[13px] text-gray-700 hover:text-gray-900 transition-colors">Schedule</button>
          <button className="hidden xl:block text-[13px] text-gray-700 hover:text-gray-900 transition-colors">Join</button>
          <button className="hidden xl:flex items-center gap-0.5 text-[13px] text-gray-700 hover:text-gray-900 transition-colors">
            Host <ChevronDown size={12} />
          </button>
          <button className="hidden xl:flex items-center gap-0.5 text-[13px] text-gray-700 hover:text-gray-900 transition-colors">
            Web App <ChevronDown size={12} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-semibold select-none flex-shrink-0">
            K
          </div>
        </div>
      </div>
    </div>
  )
}
