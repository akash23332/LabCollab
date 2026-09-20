import { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Check,
  X,
  Sparkles,
  Download,
  Clock,
  Wrench,
  UserPlus,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Building2,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function CommandCenter() {
  const { setActiveTab } = useAuth()
  
  // Date range picker state
  const [dateRange, setDateRange] = useState('Oct 1, 2026 – Oct 31, 2026')
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  // Booking Requests State (interactive approve / reject)
  const [bookingRequests, setBookingRequests] = useState([
    {
      id: 'req-1',
      avatar: 'MC',
      name: 'Maya Chen',
      institution: 'Tufts University',
      instrument: 'Tektronix MSO54B',
      subCategory: 'Oscilloscope',
      dateTime: 'Oct 23, 2026 14:00',
      duration: '2 hours',
      status: 'pending' // 'pending' | 'approved' | 'rejected'
    },
    {
      id: 'req-2',
      avatar: 'JB',
      name: 'Jon Bell',
      institution: 'Boston University',
      instrument: 'Agilent 8890 GC',
      subCategory: 'Gas Chromatograph',
      dateTime: 'Oct 24, 2026 09:00',
      duration: '3 hours',
      status: 'pending'
    },
    {
      id: 'req-3',
      avatar: 'AS',
      name: 'Ari Singh',
      institution: 'MIT.nano',
      instrument: 'Bruker D8 Advance',
      subCategory: 'X-ray Diffractometer',
      dateTime: 'Oct 25, 2026 10:00',
      duration: '2 hours',
      status: 'approved'
    }
  ])

  // AI Insight Index
  const [aiInsightIndex, setAiInsightIndex] = useState(0)
  const [aiInsightDismissed, setAiInsightDismissed] = useState(false)

  const aiInsights = [
    {
      id: 1,
      title: 'Keysight B2902A has 31% unbooked capacity next week.',
      subtext: 'Open two evening windows to capture an estimated $182 in additional revenue.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80',
      actionText: 'Open Suggested Slots'
    },
    {
      id: 2,
      title: 'Zeiss LSM 980 Airyscan filter cube inspection due.',
      subtext: 'Session count reached 150 hours. Recommended optical calibration window: Friday 6 PM.',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=200&q=80',
      actionText: 'Schedule Calibration'
    }
  ]

  // Approve / Reject handler
  const handleApprove = (id) => {
    setBookingRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'approved' } : req))
    )
  }

  const handleReject = (id) => {
    setBookingRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'rejected' } : req))
    )
  }

  // Pending count
  const pendingCount = bookingRequests.filter((r) => r.status === 'pending').length

  // Monthly Usage Data (Jan to Oct)
  const monthlyData = [
    { month: 'Jan', internal: 22, external: 12 },
    { month: 'Feb', internal: 26, external: 15 },
    { month: 'Mar', internal: 31, external: 18 },
    { month: 'Apr', internal: 29, external: 16 },
    { month: 'May', internal: 35, external: 20 },
    { month: 'Jun', internal: 38, external: 22 },
    { month: 'Jul', internal: 42, external: 26 },
    { month: 'Aug', internal: 46, external: 28 },
    { month: 'Sep', internal: 52, external: 32 },
    { month: 'Oct', internal: 58, external: 36 }
  ]

  // Equipment Utilization List
  const equipmentUtilization = [
    {
      name: 'Tektronix MSO54B',
      utilization: 92,
      sessions: 142,
      rate: '$18/hr',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=160&q=80'
    },
    {
      name: 'Zeiss LSM 980 Airyscan',
      utilization: 86,
      sessions: 88,
      rate: '$42/hr',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=160&q=80'
    },
    {
      name: 'Agilent 8890 GC System',
      utilization: 74,
      sessions: 64,
      rate: '$36/hr',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=160&q=80'
    },
    {
      name: 'Bruker D8 Advance',
      utilization: 61,
      sessions: 51,
      rate: '$29/hr',
      image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=160&q=80'
    }
  ]

  // Recent Activity Feed
  const recentActivities = [
    {
      id: 1,
      icon: Calendar,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'New booking request',
      subtitle: 'Maya Chen · Tektronix MSO54B',
      time: '10:24 AM'
    },
    {
      id: 2,
      icon: Wrench,
      iconBg: 'bg-amber-50 text-amber-800 border-amber-200',
      title: 'Equipment marked for maintenance',
      subtitle: 'Zeiss LSM 980 Airyscan',
      time: 'Yesterday'
    },
    {
      id: 3,
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Session completed',
      subtitle: 'Jon Bell · Agilent 8890 GC',
      time: 'Oct 20'
    },
    {
      id: 4,
      icon: UserPlus,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'New researcher joined',
      subtitle: 'Priya Sharma · Stanford University',
      time: 'Oct 19'
    }
  ]

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* ── 1. Top Header: Title & Actions ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8C7B70]">Welcome back,</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#241B16] tracking-tight">
            Command <span className="text-emerald-700">Center</span>
          </h1>
          <p className="text-xs md:text-sm text-[#7A6D64] mt-0.5">
            Manage your lab. Track usage. Enable discovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#EDE8E0] text-xs font-bold text-[#241B16] hover:bg-[#FAF8F5] transition shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#C58A48]" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C7B70]" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#EDE8E0] shadow-xl p-2 z-30 space-y-1 text-xs font-semibold">
                {['This Month (Oct 2026)', 'Last Month (Sep 2026)', 'Last Quarter (Q3)', 'Year to Date (2026)'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDateRange(opt)
                      setShowDateDropdown(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#241B16] transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={() => alert('Generating Lab Operations & Utilization Report (PDF/CSV)...')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── 2. Metric Row: 4 Stat Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Equipment Utilization */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE8E0] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8C7B70]">Equipment Utilization</p>
            <p className="text-2xl md:text-3xl font-black text-[#241B16]">78.4%</p>
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+6.8% from last month</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Metric 2: Revenue This Month */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE8E0] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8C7B70]">Revenue This Month</p>
            <p className="text-2xl md:text-3xl font-black text-[#241B16]">$31,904</p>
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+12.4% from last month</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#F7ECD9] text-[#965D25] border border-[#C58A48]/30 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-[#C58A48]" />
          </div>
        </div>

        {/* Metric 3: Sessions This Month */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE8E0] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8C7B70]">Sessions This Month</p>
            <p className="text-2xl md:text-3xl font-black text-[#241B16]">338</p>
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+47 sessions</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Metric 4: Active Researchers */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE8E0] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8C7B70]">Active Researchers</p>
            <p className="text-2xl md:text-3xl font-black text-[#241B16]">126</p>
            <p className="text-[11px] font-bold text-[#8C7B70] flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#C58A48]" />
              <span>across 9 institutions</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </div>

      </div>

      {/* ── 3. Middle Section: Booking Requests (Table) + Equipment Utilization ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Booking Requests (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black text-[#241B16]">Booking Requests</h2>
              {pendingCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ● {pendingCount} Pending
                </span>
              )}
            </div>
            <button
              onClick={() => {}}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-[#A5998E]">
                  <th className="pb-3 font-bold">Researcher</th>
                  <th className="pb-3 font-bold">Instrument</th>
                  <th className="pb-3 font-bold">Date &amp; Time</th>
                  <th className="pb-3 font-bold">Duration</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2ED]">
                {bookingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF8F5] transition-colors">
                    {/* Researcher */}
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#241B16] text-[#F7ECD9] text-xs font-black flex items-center justify-center shrink-0">
                          {req.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#241B16] truncate">{req.name}</p>
                          <p className="text-[10px] text-[#8C7B70] truncate">{req.institution}</p>
                        </div>
                      </div>
                    </td>

                    {/* Instrument */}
                    <td className="py-3.5 pr-2">
                      <div>
                        <p className="font-bold text-[#241B16] truncate max-w-[130px]">{req.instrument}</p>
                        <p className="text-[10px] text-[#8C7B70]">{req.subCategory}</p>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 pr-2 text-[#6B5E52] whitespace-nowrap text-[11px]">
                      {req.dateTime}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 pr-2 text-[#6B5E52] whitespace-nowrap">
                      {req.duration}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 pr-2">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          ● Pending
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ● Approved
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          ● Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-center">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="w-7 h-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition shadow-xs"
                            title="Approve Request"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center transition"
                            title="Reject Request"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 opacity-40">
                          <div className="w-7 h-7 rounded-lg border border-[#EDE8E0] flex items-center justify-center text-[#8C7B70]">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-7 h-7 rounded-lg border border-[#EDE8E0] flex items-center justify-center text-[#8C7B70]">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Equipment Utilization (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#241B16]">Equipment Utilization</h2>
            <button
              onClick={() => setActiveTab('explore')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {equipmentUtilization.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EDE8E0] shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-[#241B16] truncate">{item.name}</span>
                  </div>
                  <span className="font-black text-[#241B16] shrink-0 ml-2">{item.utilization}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#EDE8E0]">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${item.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 4. Bottom Section: Usage Overview + AI Insights + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card 1: Usage Overview (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#241B16]">Usage Overview</h2>
            <div className="flex items-center gap-3 text-[11px] font-bold text-[#7A6D64]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Internal</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>External</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end justify-between gap-1.5 pt-4 px-1 border-b border-[#EDE8E0]">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#241B16] text-white text-[9px] font-bold py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                  {d.internal}h int / {d.external}h ext
                </div>

                {/* Stacked bar */}
                <div className="w-full max-w-[18px] flex flex-col rounded-t-sm overflow-hidden h-32 justify-end">
                  <div
                    className="bg-emerald-300 transition-all duration-300"
                    style={{ height: `${d.internal}%` }}
                  />
                  <div
                    className="bg-emerald-600 transition-all duration-300"
                    style={{ height: `${d.external}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#8C7B70] mt-1">{d.month}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#8C7B70]">
            * 62% of research throughput driven by external inter-university partner slots.
          </p>
        </div>

        {/* Card 2: AI Insights (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-black text-[#241B16]">AI Insights</h2>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-[#8C7B70]">
              <span>{aiInsightIndex + 1} of {aiInsights.length}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setAiInsightIndex((i) => (i > 0 ? i - 1 : aiInsights.length - 1))}
                  className="p-1 rounded-md hover:bg-[#FAF8F5] text-[#8C7B70]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAiInsightIndex((i) => (i < aiInsights.length - 1 ? i + 1 : 0))}
                  className="p-1 rounded-md hover:bg-[#FAF8F5] text-[#8C7B70]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card Content */}
          {!aiInsightDismissed ? (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-[#EDE8E0] shrink-0">
                  <img
                    src={aiInsights[aiInsightIndex].image}
                    alt="Insight hardware"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-bold text-[#241B16] leading-snug">
                    {aiInsights[aiInsightIndex].title}
                  </p>
                  <p className="text-[11px] text-[#7A6D64] leading-relaxed">
                    {aiInsights[aiInsightIndex].subtext}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => alert(`Applied slot recommendation: ${aiInsights[aiInsightIndex].actionText}`)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition text-center"
                >
                  {aiInsights[aiInsightIndex].actionText}
                </button>
                <button
                  type="button"
                  onClick={() => setAiInsightDismissed(true)}
                  className="py-2.5 px-4 rounded-xl border border-[#EDE8E0] text-xs font-bold text-[#6B5E52] hover:bg-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#EDE8E0] text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-[#241B16]">Insight marked as reviewed</p>
              <button
                onClick={() => setAiInsightDismissed(false)}
                className="text-[11px] font-bold text-[#C58A48] hover:underline"
              >
                Undo dismiss
              </button>
            </div>
          )}

          <p className="text-[11px] text-[#8C7B70]">
            Insights dynamically computed from regional equipment utilization velocity.
          </p>
        </div>

        {/* Card 3: Recent Activity (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#241B16]">Recent Activity</h2>
            <button
              onClick={() => {}}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {recentActivities.map((act) => {
              const Icon = act.icon
              return (
                <div key={act.id} className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${act.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#241B16] leading-tight truncate">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-[#7A6D64] leading-tight truncate mt-0.5">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#A5998E] shrink-0">
                    {act.time}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="pt-2 border-t border-[#F5F2ED] flex justify-end">
            <span className="text-[10px] font-semibold text-[#8C7B70]">Real-time operational audit trail</span>
          </div>
        </div>

      </div>

    </div>
  )
}
