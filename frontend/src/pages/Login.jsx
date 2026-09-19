import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Lock, Mail, Microscope, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/landing/Hero'
import StatsBar from '../components/landing/StatsBar'
import FeaturesGrid from '../components/landing/FeaturesGrid'
import { stats } from '../data/landingData'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('maya.chen@tufts.edu')
  const [password, setPassword] = useState('••••••••')
  const [error, setError] = useState('')
  const [demoTab, setDemoTab] = useState('student') // 'student' | 'admin'

  const handleInstantStudent = async () => {
    setError('')
    try {
      await login('student@example.com', 'Student@123')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleInstantAdmin = async () => {
    setError('')
    try {
      await login('nikhilpalyal6@gmail.com', 'Nikhil@123')
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      let submitEmail = email.trim()
      let submitPassword = password.trim()

      if (submitEmail.toLowerCase() === 'maya.chen@tufts.edu' && submitPassword === '••••••••') {
        submitEmail = 'student@example.com'
        submitPassword = 'Student@123'
      }

      const loggedUser = await login(submitEmail, submitPassword)
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F8F5EE] overflow-hidden">
      {/* Background landing page (blurred) */}
      <div className="filter blur-md pointer-events-none select-none opacity-40">
        <Navbar />
        <main>
          <Hero />
          <StatsBar stats={stats} />
          <FeaturesGrid />
        </main>
        <Footer />
      </div>

      {/* Modal Backdrop & Centered Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19120F]/60 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#EAE1D3] bg-[#FAF8F5] shadow-2xl">
          {/* Top Header Background */}
          <div className="relative bg-[#241B16] px-6 py-6 text-white">
            <Link
              to="/"
              className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-[#C58A48]">
                <Microscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Log in to LabCollab</h3>
                <p className="text-xs text-stone-300">Enter your institutional credentials</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Login Pill */}
          <div className="px-6 pt-5 pb-1 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 px-1">
              <span>DEMO LOGIN</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDemoTab('student')
                    setEmail('student@example.com')
                    setPassword('Student@123')
                    setError('')
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${demoTab === 'student' ? 'bg-[#C58A48] text-white shadow-xs' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDemoTab('admin')
                    setEmail('nikhilpalyal6@gmail.com')
                    setPassword('Nikhil@123')
                    setError('')
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${demoTab === 'admin' ? 'bg-[#241B16] text-white shadow-xs' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            {demoTab === 'student' ? (
              <div className="rounded-2xl border border-[#E8DFC0] bg-white p-3.5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCF7F0] text-[#C58A48] font-bold text-xs border border-[#EED7B3]">
                    MC
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Maya Chen (Demo User)</p>
                    <p className="text-[11px] text-stone-500">Tufts University • Researcher</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstantStudent}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#C58A48] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B37636] transition cursor-pointer"
                >
                  <span>Instant Access</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E8DFC0] bg-white p-3.5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241B16] text-[#C58A48] font-bold text-xs border border-stone-800">
                    NP
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Nikhil Palyal (Demo Admin)</p>
                    <p className="text-[11px] text-stone-500">System Administrator • LabShare</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstantAdmin}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#241B16] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#382C25] transition cursor-pointer"
                >
                  <span>Admin Access</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Error notification */}
          {error && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#E5DAC6] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                  placeholder="researcher@university.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#E5DAC6] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-stone-300 text-[#C58A48] focus:ring-[#C58A48]" />
                <span>Remember this workstation</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Password recovery will be available soon.')}
                className="text-xs font-semibold text-[#B37636] hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                Forgot password?
              </button>
            </div>

            <Button
              variant="dark"
              type="submit"
              className="w-full py-3 text-sm font-bold bg-[#241B16] hover:bg-[#382C25] shadow-lg text-white cursor-pointer"
            >
              Sign In to Dashboard
            </Button>

            <p className="text-center text-[11px] text-stone-500 pt-2">
              Protected by Institutional Single Sign-On (SSO) & DST Grid Access
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
