import { 
  LayoutDashboard, 
  Search, 
  Sparkles, 
  Globe2, 
  QrCode, 
  Radio, 
  Sliders, 
  ArrowLeftRight, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  ExternalLink,
  Building2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function UserSidebar() {
  const { user, logout, activeTab, setActiveTab, navigateTo } = useAuth()

  const mainNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore equipment', icon: Search },
    { id: 'ai-search', label: 'AI search', icon: Sparkles },
    { id: 'network', label: 'Lab network', icon: Globe2 },
  ]

  const operationsNav = [
    { id: 'checkin', label: 'Check-in', icon: QrCode },
    { id: 'active-session', label: 'Active session', icon: Radio },
    { id: 'command-center', label: 'Command center', icon: Sliders },
  ]

  return (
    <aside className="w-64 shrink-0 bg-[#0F172A] text-stone-300 flex flex-col justify-between min-h-screen border-r border-slate-800">
      <div>
        {/* User Profile Card at Top */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C58A48] to-[#B37636] text-white font-bold text-sm shadow-md">
              {user?.avatar || 'MC'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Maya Chen'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.institution || 'Tufts University'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6">
          {/* Main Section */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Workspace
            </p>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#C58A48]/20 text-[#F7ECD9] border border-[#C58A48]/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#C58A48]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Operations Section */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Operations
            </p>
            <nav className="space-y-1">
              {operationsNav.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#C58A48]/20 text-[#F7ECD9] border border-[#C58A48]/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#C58A48]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Account / Footer Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Account
        </p>

        <button
          onClick={() => alert('Switched to Pan-India Grid Hub')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
        >
          <ArrowLeftRight className="h-4 w-4 text-slate-400" />
          <span>Network switch</span>
        </button>

        <button
          onClick={() => alert('Support available at support@labcollab.in')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
        >
          <HelpCircle className="h-4 w-4 text-slate-400" />
          <span>Help & support</span>
        </button>

        <button
          onClick={logout}
          className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
