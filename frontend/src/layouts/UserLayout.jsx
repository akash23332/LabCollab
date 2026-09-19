import UserSidebar from '../components/dashboard/UserSidebar'
import { useAuth } from '../context/AuthContext'
import { Search, Bell, Sparkles, ExternalLink, Microscope } from 'lucide-react'

export default function UserLayout({ children }) {
  const { user, navigateTo } = useAuth()

  return (
    <div className="flex min-h-screen bg-[#F8F5EE] text-[#4A3E37] antialiased">
      {/* Fixed Left Sidebar */}
      <UserSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Floating Dashboard Bar */}
        <header className="sticky top-0 z-40 border-b border-[#EAE1D3] bg-[#FAF8F5]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-[#C58A48] transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#241B16] text-[#C58A48]">
                <Microscope className="h-4 w-4" />
              </div>
              <span className="font-sans font-extrabold text-sm tracking-tight text-[#241B16]">LabCollab</span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-500">Researcher Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search shortcut */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search tools, sessions..."
                className="w-56 rounded-xl border border-[#E5DAC6] bg-white py-1.5 pl-8 pr-3 text-xs text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => alert('No new alerts. 3 upcoming bookings are confirmed.')}
              className="relative rounded-xl border border-[#EAE1D3] bg-white p-2 text-stone-600 hover:text-[#C58A48] hover:bg-[#FAF7F2] transition"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C58A48]" />
            </button>

            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-white border border-[#EAE1D3] px-3 py-1.5 text-xs font-semibold text-stone-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Network Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
