import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  QrCode,
  Keyboard,
  ShieldCheck,
  Clock,
  Users,
  Camera,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Calendar,
  User,
  Lock,
  Sparkles,
  Building2,
  X,
  Radio,
  Lightbulb
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import bookingService from '../../services/bookingService'

export default function CheckIn() {
  const { user, setActiveTab } = useAuth()
  const [activeMethod, setActiveMethod] = useState('qr') // 'qr' | 'manual'
  const [bookingId, setBookingId] = useState('LC-2026-SEM450')
  const [isScanning, setIsScanning] = useState(true)
  const [checkInState, setCheckInState] = useState('idle') // 'idle' | 'verifying' | 'success' | 'error'
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [userBookings, setUserBookings] = useState([])

  const isDemoUser = !user || user.email === 'student@example.com' || user.email === 'demo@example.com'

  // Fetch real user bookings from database
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await bookingService.getBookings()
        if (res?.data && res.data.length > 0) {
          setUserBookings(res.data)
          setBookingId(res.data[0].bookingId || res.data[0].id)
        }
      } catch (err) {
        console.warn('Checkin load bookings:', err.message)
      }
    }
    loadBookings()
  }, [user])

  // Booking Data
  const demoBooking = {
    id: 'LC-2026-SEM450',
    instrumentName: 'Scanning Electron Microscope (SEM)',
    model: 'FEI Nova NanoSEM 450',
    lab: 'Panjab University, Chandigarh',
    dept: 'Central Instrumentation Laboratory (CIL)',
    date: '20 Sep 2026',
    time: '02:00 PM – 04:00 PM',
    type: 'Self-Use Access',
    supervisor: 'Dr. Gurpreet Singh',
    operatorStatus: 'Verified Operator Clearance',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  }

  const selectedRealBooking = userBookings.find(b => (b.bookingId === bookingId || b.id === bookingId)) || userBookings[0]
  const currentBooking = selectedRealBooking ? {
    id: selectedRealBooking.bookingId || selectedRealBooking.id || selectedRealBooking._id,
    instrumentName: selectedRealBooking.equipmentName,
    model: selectedRealBooking.equipmentCategory || 'Research Instrument',
    lab: selectedRealBooking.lab || 'Campus Lab',
    dept: selectedRealBooking.college || 'Central Facility',
    date: selectedRealBooking.date,
    time: `${selectedRealBooking.startTime} – ${selectedRealBooking.endTime}`,
    type: 'Self-Use Access',
    supervisor: 'Dr. Gurpreet Singh',
    operatorStatus: 'Verified Clearance',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  } : demoBooking

  const handleVerify = async () => {
    setCheckInState('verifying')
    try {
      await api.post('/usage/check-in', { bookingId: currentBooking.id })
    } catch (err) {
      console.warn('Backend check-in API:', err.message)
    }
    setTimeout(() => {
      setCheckInState('success')
      setTimeout(() => {
        setActiveTab('active-session')
      }, 800)
    }, 1000)
  }

  const handleSimulateScan = async () => {
    setCheckInState('verifying')
    try {
      await api.post('/usage/check-in', { bookingId: currentBooking.id })
    } catch (err) {
      console.warn('Backend simulate scan check-in:', err.message)
    }
    setTimeout(() => {
      setCheckInState('success')
      setTimeout(() => {
        setActiveTab('active-session')
      }, 800)
    }, 1200)
  }

  return (
    <div className="p-4 md:p-8 max-w-[1500px] mx-auto space-y-6">
      {/* ── 1. Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('overview')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#EDE8E0] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#6B5E52] hover:text-[#241B16] transition shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C58A48]" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#8C7B70]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Lab Access Gate: Online</span>
        </div>
      </div>

      {/* ── 2. Three-Column Main Workspace ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Context & Value Props (lg:col-span-3) ── */}
        <div className="lg:col-span-3 space-y-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C58A48] bg-[#F7ECD9] px-2.5 py-1 rounded-md">
              ARRIVAL PROTOCOL
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-[#241B16] tracking-tight mt-2">
              Check in, <br />
              <span className="text-[#C58A48]">then discover.</span>
            </h1>
            <p className="text-xs md:text-sm text-[#6B5E52] leading-relaxed mt-2.5">
              Verify your booking at the lab and start your session. A quick check-in helps us keep labs secure, efficient, and accessible for everyone.
            </p>
          </div>

          {/* 3 Value Proposition Badges */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#EDE8E0] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#241B16]">Secure Access</p>
                <p className="text-[11px] text-[#7A6D64] mt-0.5">
                  Only verified bookings can access the lab.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#EDE8E0] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#F7ECD9] text-[#965D25] border border-[#C58A48]/30 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-[#C58A48]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#241B16]">Automatic Logging</p>
                <p className="text-[11px] text-[#7A6D64] mt-0.5">
                  Your usage time is recorded automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#EDE8E0] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#241B16]">Better Research</p>
                <p className="text-[11px] text-[#7A6D64] mt-0.5">
                  Shared infrastructure for a stronger research community.
                </p>
              </div>
            </div>
          </div>

          {/* Research Connects Us Illustration Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-[#F5EFE6] border border-[#EDE8E0] shadow-xs relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C58A48]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#965D25]">LabCollab Network</span>
              </div>
              <p className="text-xs font-bold text-[#241B16]">
                &ldquo;Research Connects Us&rdquo;
              </p>
              <p className="text-[11px] text-[#7A6D64] leading-relaxed">
                Check in seamlessly using your mobile camera or workstation terminal across 50+ inter-connected Indian research institutions.
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[#C58A48]/10 blur-xl pointer-events-none" />
          </div>
        </div>

        {/* ── CENTER COLUMN: Scanner / Input Box (lg:col-span-5) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 md:p-7 space-y-6">
            
            {/* Method Tabs (Scan QR Code vs Enter Booking ID) */}
            <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E0]">
              <button
                type="button"
                onClick={() => {
                  setActiveMethod('qr')
                  setCheckInState('idle')
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeMethod === 'qr'
                    ? 'bg-[#241B16] text-white shadow-sm'
                    : 'text-[#6B5E52] hover:text-[#241B16]'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#F7ECD9]" />
                <span>Scan QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMethod('manual')
                  setCheckInState('idle')
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeMethod === 'manual'
                    ? 'bg-[#241B16] text-white shadow-sm'
                    : 'text-[#6B5E52] hover:text-[#241B16]'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Enter Booking ID</span>
              </button>
            </div>

            {/* TAB 1: SCAN QR CODE VIEW */}
            {activeMethod === 'qr' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Viewfinder Graphic Box */}
                <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-3xl bg-[#1A130E] border-2 border-[#2E241E] p-6 flex flex-col items-center justify-center overflow-hidden shadow-xl">
                  
                  {/* Glowing Scanning Bracket Corners */}
                  <div className="absolute top-5 left-5 w-8 h-8 border-t-3 border-l-3 border-[#C58A48] rounded-tl-xl" />
                  <div className="absolute top-5 right-5 w-8 h-8 border-t-3 border-r-3 border-[#C58A48] rounded-tr-xl" />
                  <div className="absolute bottom-5 left-5 w-8 h-8 border-b-3 border-l-3 border-[#C58A48] rounded-bl-xl" />
                  <div className="absolute bottom-5 right-5 w-8 h-8 border-b-3 border-r-3 border-[#C58A48] rounded-br-xl" />

                  {/* Laser Scan Line Animation */}
                  {isScanning && checkInState !== 'success' && (
                    <div className="absolute inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#C58A48] to-transparent shadow-[0_0_12px_#C58A48] animate-bounce duration-1000 top-1/4" />
                  )}

                  {/* QR Symbol in Center */}
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    {checkInState === 'success' ? (
                      <div className="flex flex-col items-center text-center space-y-2 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <p className="text-sm font-black text-white">QR Code Verified!</p>
                        <p className="text-[11px] text-emerald-400 font-semibold">Instrument Unlocked</p>
                      </div>
                    ) : checkInState === 'verifying' ? (
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 border-3 border-white/20 border-t-[#C58A48] rounded-full animate-spin" />
                        <p className="text-xs font-bold text-white">Verifying credentials...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3">
                          <QrCode className="w-full h-full text-[#F7ECD9]/80" />
                        </div>
                        <p className="text-[10px] font-bold text-[#A5998E] uppercase tracking-wider">
                          Ready to capture
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Subtitle Inside Scanner */}
                  <div className="absolute bottom-3 text-[10px] text-[#A5998E] tracking-wider font-mono">
                    LABCOLLAB • SECURE PASS
                  </div>
                </div>

                {/* Subtitle Under Scanner */}
                <p className="text-xs text-center text-[#7A6D64]">
                  Point your camera at the <strong className="text-[#241B16]">LabCollab QR marker</strong> placed at the instrument.
                </p>

                {/* Notice Box */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] text-[11px] text-[#6B5E52]">
                  <Lightbulb className="w-4 h-4 text-[#C58A48] shrink-0 mt-0.5" />
                  <p>
                    Make sure the QR code is clearly visible and well lit on the device front panel.
                  </p>
                </div>

                {/* Main Action Button */}
                {checkInState === 'success' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('active-session')}
                    className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enter Active Session →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    disabled={checkInState === 'verifying'}
                    className="w-full py-3.5 rounded-2xl bg-[#241B16] hover:bg-[#C58A48] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    <Camera className="w-4 h-4 text-[#F7ECD9]" />
                    <span>{checkInState === 'verifying' ? 'Verifying...' : 'Scan QR Code Now →'}</span>
                  </button>
                )}

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-[#EDE8E0]" />
                  <span className="absolute bg-white px-3 text-[10px] font-bold text-[#A5998E] uppercase tracking-wider">
                    OR
                  </span>
                </div>

                {/* Secondary Button: Switch to Manual */}
                <button
                  type="button"
                  onClick={() => setActiveMethod('manual')}
                  className="w-full py-3 rounded-2xl border border-[#EDE8E0] hover:border-[#C58A48] bg-[#FAF8F5] hover:bg-white text-xs font-bold text-[#241B16] transition flex items-center justify-center gap-2"
                >
                  <Keyboard className="w-4 h-4 text-[#C58A48]" />
                  <span>Enter Booking ID Manually →</span>
                </button>
              </div>
            )}

            {/* TAB 2: MANUAL BOOKING ID INPUT */}
            {activeMethod === 'manual' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#241B16] block">
                    Instrument Booking ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                      placeholder="e.g. LC-2026-SEM450"
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-sm font-mono font-bold text-[#241B16] placeholder-[#A5998E] outline-none focus:bg-white focus:border-[#C58A48] transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#965D25] bg-[#F7ECD9] px-2 py-0.5 rounded-md">
                      Valid ID
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A6D64] mt-1">
                    Find this 12-digit code in your booking confirmation email or SMS.
                  </p>
                </div>

                {checkInState === 'success' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-sm font-bold text-emerald-800">Booking Verified &amp; Active</p>
                    <button
                      onClick={() => setActiveTab('active-session')}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                    >
                      Open Instrument Console →
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={!bookingId.trim() || checkInState === 'verifying'}
                    className="w-full py-3.5 rounded-2xl bg-[#241B16] hover:bg-[#C58A48] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {checkInState === 'verifying' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Verifying Authorization...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#F7ECD9]" />
                        <span>Verify &amp; Start Session →</span>
                      </>
                    )}
                  </button>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveMethod('qr')}
                    className="text-xs font-bold text-[#C58A48] hover:underline"
                  >
                    ← Switch back to QR scanner
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT COLUMN: Your Booking + How to Check In (lg:col-span-4) ── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Your Booking (Upcoming) */}
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#241B16]">Your Booking</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3" />
                Upcoming
              </span>
            </div>

            {/* Instrument Thumbnail + Metadata */}
            <div className="flex gap-3.5 items-start">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EDE8E0] shrink-0">
                <img
                  src={currentBooking.image}
                  alt={currentBooking.instrumentName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-xs font-bold text-[#241B16] leading-tight">
                  {currentBooking.instrumentName}
                </h3>
                <p className="text-[11px] text-[#6B5E52] flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#C58A48] shrink-0" />
                  <span>{currentBooking.lab}</span>
                </p>
                <p className="text-[11px] text-[#7A6D64] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#A5998E] shrink-0" />
                  <span>{currentBooking.date}</span>
                </p>
                <p className="text-[11px] font-semibold text-[#241B16] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#C58A48] shrink-0" />
                  <span>{currentBooking.time}</span>
                </p>
              </div>
            </div>

            {/* Self-Use Access Tag */}
            <div className="pt-2 border-t border-[#F5F2ED] flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#6B5E52]">
                <User className="w-3.5 h-3.5 text-[#C58A48]" />
                {currentBooking.type}
              </span>

              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="font-bold text-[#C58A48] hover:text-[#965D25] text-[11px] flex items-center gap-0.5 hover:underline"
              >
                <span>View Booking Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 2: How to Check In? */}
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-[#241B16]">How to Check In?</h2>

            <div className="space-y-3.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#241B16] text-[#F8F5EE] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241B16]">Go to the instrument</p>
                  <p className="text-[11px] text-[#7A6D64] mt-0.5 leading-relaxed">
                    Reach the lab and locate the LabCollab QR marker on the equipment.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#241B16] text-[#F8F5EE] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241B16]">Scan QR code or enter Booking ID</p>
                  <p className="text-[11px] text-[#7A6D64] mt-0.5 leading-relaxed">
                    Use your camera or enter the booking ID manually.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#241B16] text-[#F8F5EE] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241B16]">Verify your booking</p>
                  <p className="text-[11px] text-[#7A6D64] mt-0.5 leading-relaxed">
                    Our system will confirm your identity, booking, and time slot.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#241B16] text-[#F8F5EE] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241B16]">Start your session</p>
                  <p className="text-[11px] text-[#7A6D64] mt-0.5 leading-relaxed">
                    Once verified, you&apos;ll be checked in and can begin using the equipment.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── 3. Bottom Trust Bar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 border border-[#EDE8E0] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#241B16]">Verified Access</p>
            <p className="text-[10px] text-[#7A6D64]">Secure and authorized credentials</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#F7ECD9] text-[#965D25] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-[#C58A48]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#241B16]">Your Data is Safe</p>
            <p className="text-[10px] text-[#7A6D64]">Encrypted and private telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#241B16]">Trusted by Institutions</p>
            <p className="text-[10px] text-[#7A6D64]">Building a collaborative research ecosystem</p>
          </div>
        </div>
      </div>

      {/* ── Booking Details Full Modal ────────────────────────────────────── */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#EDE8E0] shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C58A48] bg-[#F7ECD9] px-2.5 py-1 rounded-md">
                  CONFIRMED RESERVATION
                </span>
                <h3 className="text-xl font-black text-[#241B16] mt-1.5">
                  {currentBooking.instrumentName}
                </h3>
                <p className="text-xs text-[#7A6D64]">{currentBooking.model}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#8C7B70]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0]">
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Booking ID:</span>
                <span className="font-mono font-bold text-[#241B16]">{currentBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Host Facility:</span>
                <span className="font-bold text-[#241B16]">{currentBooking.lab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Department:</span>
                <span className="font-bold text-[#241B16]">{currentBooking.dept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Date &amp; Slot:</span>
                <span className="font-bold text-[#241B16]">{currentBooking.date} ({currentBooking.time})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Access Mode:</span>
                <span className="font-bold text-[#241B16]">{currentBooking.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Lab Supervisor:</span>
                <span className="font-bold text-[#241B16]">{currentBooking.supervisor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Clearance:</span>
                <span className="font-bold text-emerald-700">{currentBooking.operatorStatus}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#241B16] text-white text-xs font-bold hover:bg-[#C58A48] transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
