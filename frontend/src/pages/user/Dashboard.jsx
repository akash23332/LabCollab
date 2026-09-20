import { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, 
  Clock, 
  Bookmark, 
  MapPin, 
  Search, 
  QrCode, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  Clock3, 
  Heart, 
  Sparkles, 
  Microscope,
  Cpu,
  Layers,
  Star,
  Zap,
  Radio,
  Share2,
  Filter,
  Check
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import bookingService from '../../services/bookingService'

export default function UserDashboard() {
  const { user, setActiveTab } = useAuth()
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [userBookings, setUserBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  const isDemoUser = !user || user.email === 'student@example.com' || user.email === 'demo@example.com'

  useEffect(() => {
    const fetchLiveBookings = async () => {
      try {
        setLoadingBookings(true)
        const res = await bookingService.getBookings()
        if (res?.data && Array.isArray(res.data)) {
          setUserBookings(res.data)
        }
      } catch (err) {
        console.warn('Live bookings fetch failed:', err.message)
      } finally {
        setLoadingBookings(false)
      }
    }
    fetchLiveBookings()
  }, [user])

  const demoUpcomingBookings = useMemo(() => [
    {
      id: 'b1',
      title: 'Tektronix MSO54B',
      type: 'Oscilloscope 2GHz',
      status: 'CONFIRMED',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      institution: 'Northeastern University',
      date: 'Wed, Oct 23',
      time: '14:00 - 16:00',
      duration: '2.0 hrs',
      icon: Cpu,
    },
    {
      id: 'b2',
      title: 'Bruker D8 Advance',
      type: 'X-ray Diffractometer (XRD)',
      status: 'CONFIRMED',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      institution: 'Tufts University',
      date: 'Fri, Oct 25',
      time: '12:00 - 13:30',
      duration: '1.5 hrs',
      icon: Layers,
    },
    {
      id: 'b3',
      title: 'Zeiss LSM 880 Airyscan',
      type: 'Confocal Microscope',
      status: 'PENDING',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      institution: 'Harvard Medical School',
      date: 'Mon, Oct 28',
      time: '09:30 - 11:30',
      duration: '2.0 hrs',
      icon: Microscope,
    },
  ], [])

  const upcomingBookings = useMemo(() => {
    if (userBookings.length > 0) {
      return userBookings.map((b) => {
        let Icon = Cpu
        const cat = (b.equipmentCategory || '').toLowerCase()
        if (cat.includes('micro') || cat.includes('bio') || cat.includes('life')) Icon = Microscope
        else if (cat.includes('xrd') || cat.includes('analytical')) Icon = Layers

        const isApproved = ['Approved', 'approved', 'CONFIRMED'].includes(b.status)
        return {
          id: b.bookingId || b.id || b._id,
          title: b.equipmentName,
          type: b.equipmentCategory || 'Lab Instrument',
          status: isApproved ? 'CONFIRMED' : (b.status?.toUpperCase() || 'PENDING'),
          statusColor: isApproved
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200',
          institution: b.college || b.institution || 'Partner University',
          date: b.date,
          time: `${b.startTime} - ${b.endTime}`,
          duration: `${b.duration || 2.0} hrs`,
          icon: Icon,
          raw: b,
        }
      })
    }

    if (isDemoUser) {
      return demoUpcomingBookings
    }

    return []
  }, [userBookings, isDemoUser, demoUpcomingBookings])

  const stats = useMemo(() => {
    const count = upcomingBookings.length
    const totalHours = upcomingBookings.reduce((sum, b) => {
      const dur = parseFloat(b.duration) || 2.0
      return sum + dur
    }, 0)

    return [
      {
        id: 'bookings',
        label: 'UPCOMING BOOKINGS',
        value: String(count),
        subtext: count > 0 ? `↗ ${count} scheduled` : 'No bookings',
        icon: Calendar,
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      },
      {
        id: 'hours',
        label: 'HOURS THIS MONTH',
        value: totalHours.toFixed(1),
        subtext: `${totalHours.toFixed(1)} total`,
        badge: totalHours > 0 ? 'Active' : undefined,
        icon: Clock,
        iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
      },
      {
        id: 'saved',
        label: 'SAVED EQUIPMENT',
        value: isDemoUser ? '8' : '2',
        subtext: 'in wishlist',
        icon: Bookmark,
        iconBg: 'bg-amber-50 text-[#C58A48] border-amber-100',
      },
      {
        id: 'proximity',
        label: 'NETWORK PROXIMITY',
        value: '14',
        subtext: 'instruments online',
        icon: MapPin,
        iconBg: 'bg-orange-50 text-orange-600 border-orange-100',
      },
    ]
  }, [upcomingBookings, isDemoUser])

  const trailActivities = useMemo(() => {
    if (upcomingBookings.length > 0) {
      return upcomingBookings.slice(0, 4).map((b, idx) => ({
        id: `act-${idx}`,
        title: `Booking ${b.status.toLowerCase()}`,
        detail: `${b.title} • ${b.institution}`,
        time: b.date || 'Recent',
        icon: CheckCircle2,
        iconColor: b.status === 'CONFIRMED' ? 'text-emerald-500' : 'text-amber-500',
      }))
    }

    if (isDemoUser) {
      return [
        {
          id: 'a1',
          title: 'Booking confirmed',
          detail: 'Tektronix MSO54B • Northeastern',
          time: '1h ago',
          icon: CheckCircle2,
          iconColor: 'text-emerald-500',
        },
        {
          id: 'a2',
          title: 'Session completed',
          detail: 'Keysight N5182B • Tufts • 1h 35m',
          time: 'Yesterday',
          icon: Clock3,
          iconColor: 'text-stone-400',
        },
      ]
    }

  }, [upcomingBookings, isDemoUser])

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            WEDNESDAY, OCTOBER 20, 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-1 font-sans">
            Good morning, <span className="text-[#C58A48]">{user?.name?.split(' ')[0] || 'Researcher'}.</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            The network has <span className="font-bold text-stone-800">14 instruments</span> available across partner universities
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5DAC6] bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs hover:border-[#C58A48] hover:bg-[#FAF8F5] transition active:scale-95"
          >
            <QrCode className="h-4 w-4 text-stone-600" />
            <span>Check in</span>
          </button>

          <Button
            variant="primary"
            onClick={() => setActiveTab('explore')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C58A48] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#B37636] transition active:scale-95"
          >
            <Search className="h-4 w-4" />
            <span>Find equipment</span>
          </Button>
        </div>
      </div>

      {/* Main 4 Metric / KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.id}
              className="rounded-2xl border border-[#EAE1D3] bg-white p-5 shadow-xs transition hover:border-[#C58A48] hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  {stat.label}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${stat.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-stone-900 tracking-tight font-sans">
                  {stat.value}
                </span>
                {stat.badge && (
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {stat.badge}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs font-semibold text-stone-500">{stat.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Left Column (65%) and Right Column (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upcoming Bookings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  YOUR SCHEDULE
                </p>
                <h2 className="text-lg font-bold text-stone-900">Upcoming bookings</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="text-xs font-bold text-[#C58A48] hover:text-[#B37636] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#EAE1D3] bg-[#FCF7F0]/40 p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FCF7F0] border border-[#EED7B3] flex items-center justify-center text-[#C58A48]">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900">No bookings yet</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    You haven't reserved any laboratory equipment yet. Discover instruments across partner labs and schedule your session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C58A48] hover:bg-[#B37636] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explore Equipment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const Icon = booking.icon
                  return (
                    <div
                      key={booking.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#EAE1D3] bg-white p-4 shadow-xs transition hover:border-[#C58A48] hover:shadow-md"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FCF7F0] border border-[#EED7B3] text-[#C58A48]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-stone-900">{booking.title}</h3>
                            <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold ${booking.statusColor}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {booking.institution} • <span className="font-semibold text-stone-700">{booking.date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-bold text-stone-800">{booking.time}</p>
                          <p className="text-[10px] text-stone-400">{booking.duration}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-600 transition group-hover:bg-[#C58A48] group-hover:border-[#C58A48] group-hover:text-white"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Your Trail / Activity Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  RECENT ACTIVITY
                </p>
                <h2 className="text-lg font-bold text-stone-900">Your trail</h2>
              </div>
              <button
                type="button"
                onClick={() => alert('Exporting research activity log (PDF/CSV)...')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                <Download className="h-3.5 w-3.5 text-stone-400" />
                <span>Export</span>
              </button>
            </div>

            <div className="rounded-2xl border border-[#EAE1D3] bg-white divide-y divide-stone-100 shadow-xs">
              {trailActivities.map((act) => {
                const Icon = act.icon
                return (
                  <div key={act.id} className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-50 border border-stone-200/80">
                        <Icon className={`h-4 w-4 ${act.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{act.title}</p>
                        <p className="text-[11px] text-stone-500">{act.detail}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-stone-400 font-medium">{act.time}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* In the Lab / Active Session Card */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              ACTIVE SESSION
            </p>
            <h2 className="text-lg font-bold text-stone-900">In the lab</h2>

            <div className="relative overflow-hidden rounded-3xl border border-[#EAE1D3] bg-white p-6 shadow-sm text-center">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800 mb-6">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>NO ACTIVE SESSION</span>
              </div>

              {/* Radar / Circular Graphic */}
              <div className="mx-auto relative h-28 w-28 flex items-center justify-center mb-4">
                <div className="absolute inset-0 rounded-full border border-dashed border-stone-200 animate-spin" style={{ animationDuration: '20s' }} />
                <div className="h-20 w-20 rounded-full border border-stone-200 bg-[#FAF8F5] flex items-center justify-center">
                  <Radio className="h-8 w-8 text-[#C58A48]" />
                </div>
              </div>

              <h3 className="text-base font-bold text-stone-900">Ready when you are.</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Your checked-in equipment session will appear here with live timing and checkout.
              </p>

              <button
                type="button"
                onClick={() => setActiveTab('checkin')}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5DAC6] bg-white px-4 py-2.5 text-xs font-bold text-stone-800 shadow-xs hover:border-[#C58A48] hover:bg-[#FAF8F5] transition active:scale-95"
              >
                <QrCode className="h-4 w-4 text-[#C58A48]" />
                <span>Scan to check-in</span>
              </button>
            </div>
          </div>

          {/* AI Match Recommendation Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                AI MATCH
              </p>
              <Sparkles className="h-4 w-4 text-[#C58A48]" />
            </div>

            <div className="rounded-3xl border border-[#E8DFC0] bg-gradient-to-br from-[#FCF7F0] via-white to-[#F7ECD9]/40 p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#EED7B3] text-[#C58A48] shadow-xs">
                  <Microscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">JEOL JEM-2100F TEM</span>
                    <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2">98% Match</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">IIT Delhi Nanocenter • Available Tomorrow</p>
                </div>
              </div>
              <p className="text-xs text-stone-500 leading-snug">
                Based on your recent biomedical imaging sessions, this instrument has an open morning slot.
              </p>
              <div className="pt-2 border-t border-[#EAE1D3] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#965D25]">₹850 / hour</span>
                <a
                  href="#explore"
                  onClick={(e) => { e.preventDefault(); setActiveTab('explore') }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#C58A48] hover:underline"
                >
                  <span>View matches</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Check-in QR Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19120F]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#EAE1D3] bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[#FCF7F0] border border-[#EED7B3] text-[#C58A48]">
              <QrCode className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Laboratory Pass & Scanner</h3>
              <p className="text-xs text-stone-500 mt-1">Scan the instrument QR code at the lab bench to start session</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700">
              LABPASS-TU-2026-9942
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCheckinModal(false)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Session checked-in successfully! Timer running.')
                  setShowCheckinModal(false)
                }}
                className="flex-1 rounded-xl bg-[#C58A48] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#B37636]"
              >
                Simulate Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19120F]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-[#EAE1D3] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Booking Pass</h3>
              <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold ${selectedBooking.statusColor}`}>
                {selectedBooking.status}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-stone-900">{selectedBooking.title}</h4>
              <p className="text-xs text-stone-500">{selectedBooking.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE1D3] text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Institution</span>
                <span className="font-semibold text-stone-800">{selectedBooking.institution}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Date & Time</span>
                <span className="font-semibold text-stone-800">{selectedBooking.date}, {selectedBooking.time}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Directions & Pass downloaded.')
                  setSelectedBooking(null)
                }}
                className="flex-1 rounded-xl bg-[#241B16] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#382C25]"
              >
                Download Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
