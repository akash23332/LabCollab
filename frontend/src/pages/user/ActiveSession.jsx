import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Radio,
  Clock,
  Square,
  Headphones,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  Download,
  Building2,
  FlaskConical,
  Activity,
  Zap
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ActiveSession() {
  const { setActiveTab } = useAuth()
  
  // Timer state (starts at 34 mins 16 secs for demo realism, counts up each second)
  const [secondsElapsed, setSecondsElapsed] = useState(34 * 60 + 16)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [helpMessage, setHelpMessage] = useState('')
  const [helpSent, setHelpSent] = useState(false)

  // Live seconds ticker
  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Format seconds into HH, MM, SS
  const hours = Math.floor(secondsElapsed / 3600)
  const minutes = Math.floor((secondsElapsed % 3600) / 60)
  const seconds = secondsElapsed % 60

  const pad = (num) => String(num).padStart(2, '0')

  // Cost calculation (e.g. ₹1,200/hr or $18/hr)
  const hourlyRate = 18
  const currentCost = ((secondsElapsed / 3600) * hourlyRate).toFixed(2)

  const handleFinishCheckout = () => {
    setIsTimerRunning(false)
    setShowCheckoutModal(true)
  }

  const handleSendHelp = (e) => {
    e.preventDefault()
    setHelpSent(true)
    setTimeout(() => {
      setHelpSent(false)
      setShowHelpModal(false)
      setHelpMessage('')
    }, 1500)
  }

  // Waveform bars simulation
  const waveformHeights = [
    25, 40, 65, 80, 50, 35, 70, 95, 45, 60, 30, 85, 75, 55, 90, 100, 
    60, 45, 80, 70, 35, 95, 50, 65, 85, 40, 75, 60, 45, 30, 55, 40
  ]

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* ── 1. Top Bar: Back Link + Status ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('overview')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B5E52] hover:text-[#241B16] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C58A48]" />
          <span>Back to My Bookings</span>
        </button>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Instrument Online</span>
        </div>
      </div>

      {/* ── 2. Title Section ─────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-4xl md:text-5xl font-black text-[#241B16] tracking-tight">
          Your run is <span className="text-emerald-700">live.</span>
        </h1>
        <p className="text-sm font-semibold text-[#7A6D64]">
          Tektronix MSO54B · Panjab University
        </p>
      </div>

      {/* ── 3. Main Split View: Left Timer (8 cols) + Right Cards (4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Big Session Clock Card (lg:col-span-8) ── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-8 min-h-[460px]">
            
            {/* Status Header Pill */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#241B16]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Recording session time</span>
            </div>

            {/* Giant Digital Monospace Clock */}
            <div className="space-y-3">
              <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono text-[#241B16] tracking-tight flex items-center justify-center gap-2 select-none">
                <span>{pad(hours)}</span>
                <span className="text-[#C58A48] animate-pulse">:</span>
                <span>{pad(minutes)}</span>
                <span className="text-[#C58A48] animate-pulse">:</span>
                <span>{pad(seconds)}</span>
              </div>

              {/* Sublabels under hours, minutes, seconds */}
              <div className="grid grid-cols-3 text-xs font-bold text-[#8C7B70] tracking-wider uppercase max-w-[420px] mx-auto">
                <span>Hours</span>
                <span>Minutes</span>
                <span>Seconds</span>
              </div>
            </div>

            {/* Dynamic Signal Waveform Visualizer */}
            <div className="w-full max-w-lg h-14 flex items-end justify-center gap-1.5 px-4 pt-2">
              {waveformHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-emerald-400/80 transition-all duration-300"
                  style={{
                    height: `${isTimerRunning ? Math.max(15, (h + (seconds % 5) * 6) % 100) : 20}%`,
                    opacity: 0.6 + (i % 3) * 0.15
                  }}
                />
              ))}
            </div>

            {/* Finish and Check Out Button */}
            <div className="pt-2 w-full max-w-sm">
              <button
                type="button"
                onClick={handleFinishCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white text-white" />
                <span>Finish and Check Out</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── RIGHT COLUMN: Instrument Card + Need Help Card (lg:col-span-4) ── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Instrument Info */}
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EDE8E0] shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"
                  alt="Tektronix MSO54B"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name & Facility */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-[#241B16] leading-tight">
                  Tektronix MSO54B
                </h3>
                <p className="text-xs text-[#7A6D64] mt-0.5">
                  Panjab University
                </p>
              </div>
            </div>

            {/* Details List */}
            <div className="pt-3 border-t border-[#F5F2ED] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#8C7B70]">
                  <Clock className="w-3.5 h-3.5 text-[#C58A48]" />
                  <span>Started</span>
                </span>
                <span className="font-bold text-[#241B16]">14:02</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#8C7B70]">
                  <FileText className="w-3.5 h-3.5 text-[#C58A48]" />
                  <span>Booking ID</span>
                </span>
                <span className="font-mono font-bold text-[#241B16]">LC-24091</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#8C7B70]">
                  <Activity className="w-3.5 h-3.5 text-[#C58A48]" />
                  <span>Accrued Cost</span>
                </span>
                <span className="font-bold text-[#241B16]">${currentCost}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Need help? */}
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#241B16]">Need help?</h3>
                <p className="text-xs text-[#7A6D64] mt-0.5 leading-relaxed">
                  Contact the host lab if you face any issue.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-full py-2.5 px-4 rounded-2xl border border-[#EDE8E0] hover:border-[#C58A48] bg-[#FAF8F5] hover:bg-white text-xs font-bold text-[#241B16] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C58A48]" />
              <span>Contact Host Lab</span>
            </button>
          </div>

        </div>

      </div>

      {/* ── 4. Bottom Footer: Happy Experimenting ─────────────────────────── */}
      <div className="pt-8 pb-4 text-center space-y-2">
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#EDE8E0] max-w-xl" />
          <span className="absolute bg-[#F8F5EE] px-4 text-xs font-semibold text-[#8C7B70]">
            Happy experimenting!
          </span>
        </div>
        <div className="flex justify-center pt-1">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EDE8E0] flex items-center justify-center text-emerald-600">
            <FlaskConical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── MODAL: Session Checkout Summary ───────────────────────────────── */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#EDE8E0] shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-[#241B16]">Session Completed</h3>
              <p className="text-xs text-[#7A6D64]">
                Your checkout from <strong className="text-[#241B16]">Tektronix MSO54B</strong> is recorded.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Total Duration:</span>
                <span className="font-mono font-bold text-[#241B16]">
                  {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7B70]">Hourly Rate:</span>
                <span className="font-bold text-[#241B16]">${hourlyRate}/hr</span>
              </div>
              <div className="flex justify-between border-t border-[#EDE8E0] pt-2 text-sm">
                <span className="font-bold text-[#241B16]">Total Billed:</span>
                <span className="font-black text-emerald-700">${currentCost}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => alert('Downloading session telemetry and raw run logs...')}
                className="w-full py-2.5 rounded-xl border border-[#EDE8E0] text-xs font-bold text-[#241B16] hover:bg-[#FAF8F5] transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>Download Run Telemetry &amp; Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="w-full py-3 rounded-xl bg-[#241B16] hover:bg-[#C58A48] text-white text-xs font-bold transition"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Contact Host Lab ────────────────────────────────────────── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EDE8E0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#C58A48]" />
                <h3 className="text-base font-bold text-[#241B16]">Contact Lab Operator</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full hover:bg-[#FAF8F5] text-[#8C7B70]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A6D64]">
              Connected to <strong>Panjab University CIL Lab Desk</strong>. The duty technician will respond on your terminal.
            </p>

            <form onSubmit={handleSendHelp} className="space-y-3">
              <textarea
                required
                rows={4}
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                placeholder="Describe your query or hardware issue (e.g. calibration error on Channel 2)..."
                className="w-full p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#241B16] outline-none focus:border-[#C58A48] resize-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EDE8E0] text-xs font-bold text-[#6B5E52]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={helpSent}
                  className="flex-2 py-2.5 rounded-xl bg-[#241B16] hover:bg-[#C58A48] text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  {helpSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Message Dispatched!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Technician</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
