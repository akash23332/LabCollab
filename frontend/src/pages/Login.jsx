import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { X, Lock, Mail, Microscope, ArrowRight, AlertCircle, ShieldAlert, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/landing/Hero'
import StatsBar from '../components/landing/StatsBar'
import FeaturesGrid from '../components/landing/FeaturesGrid'
import { stats } from '../data/landingData'

export default function Login({ defaultRole }) {
  const { login, logout, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Determine initial role: prop, URL query param, route path, or default to student
  const initialRole =
    defaultRole ||
    searchParams.get('role') ||
    (location.pathname === '/admin/login' ? 'admin' : 'student')

  const [roleTab, setRoleTab] = useState(initialRole)
  const [email, setEmail] = useState(initialRole === 'admin' ? 'nikhilpalyal6@gmail.com' : 'maya.chen@tufts.edu')
  const [password, setPassword] = useState('••••••••')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect already authenticated users away from /login with replace: true
  // This ensures pressing Back from /dashboard or /admin/dashboard will NEVER display the login page
  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Sync roleTab if route or query param changes
  useEffect(() => {
    if (defaultRole) {
      setRoleTab(defaultRole)
    } else if (searchParams.get('role') === 'admin' || location.pathname === '/admin/login') {
      setRoleTab('admin')
    }
  }, [defaultRole, searchParams, location])

  const handleTabSwitch = (tab) => {
    setRoleTab(tab)
    setError('')
    if (tab === 'student') {
      setEmail('student@example.com')
      setPassword('Student@123')
    } else {
      setEmail('nikhilpalyal6@gmail.com')
      setPassword('Nikhil@123')
    }
  }

  const handleInstantStudent = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await login('student@example.com', 'Student@123')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInstantAdmin = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await login('nikhilpalyal6@gmail.com', 'Nikhil@123')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      let submitEmail = email.trim()
      let submitPassword = password.trim()

      if (submitEmail.toLowerCase() === 'maya.chen@tufts.edu' && submitPassword === '••••••••') {
        submitEmail = 'student@example.com'
        submitPassword = 'Student@123'
      } else if (submitEmail.toLowerCase() === 'nikhilpalyal6@gmail.com' && submitPassword === '••••••••') {
        submitEmail = 'nikhilpalyal6@gmail.com'
        submitPassword = 'Nikhil@123'
      }

      const loggedUser = await login(submitEmail, submitPassword)

      // Strict role enforcement matching the active login tab
      if (roleTab === 'admin') {
        if (loggedUser.role !== 'admin') {
          logout()
          setError('Access Denied: This account is registered as a Student/Researcher. You cannot sign in through the Admin Console. Please select the "Researcher / Student" tab.')
          setIsSubmitting(false)
          return
        }
        navigate('/admin/dashboard', { replace: true })
      } else {
        // student tab
        if (loggedUser.role === 'admin') {
          logout()
          setError('Administrator Account Detected: Please switch to the "Admin Console" tab to access your administrative dashboard.')
          setIsSubmitting(false)
          return
        }
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setIsSubmitting(false)
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
                {roleTab === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <Microscope className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {roleTab === 'admin' ? 'Admin Console Login' : 'Log in to LabCollab'}
                </h3>
                <p className="text-xs text-stone-300">
                  {roleTab === 'admin' ? 'System administration & lab manager access' : 'Enter your institutional researcher credentials'}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Role Selector Tabs */}
          <div className="px-6 pt-5 pb-2">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-200/80 border border-stone-300/80 gap-1">
              <button
                type="button"
                onClick={() => handleTabSwitch('student')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  roleTab === 'student'
                    ? 'bg-[#C58A48] text-white shadow-sm'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Researcher / Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  roleTab === 'admin'
                    ? 'bg-[#241B16] text-white shadow-sm'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Console</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Login Preset Card */}
          <div className="px-6 py-2">
            {roleTab === 'student' ? (
              <div className="rounded-2xl border border-[#E8DFC0] bg-white p-3.5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCF7F0] text-[#C58A48] font-bold text-xs border border-[#EED7B3]">
                    MC
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Maya Chen (Student Demo)</p>
                    <p className="text-[11px] text-stone-500">Tufts University • Researcher</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstantStudent}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#C58A48] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B37636] transition cursor-pointer"
                >
                  <span>Demo Login</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-300 bg-white p-3.5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241B16] text-[#C58A48] font-bold text-xs border border-stone-800">
                    NP
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Nikhil Palyal (Admin Demo)</p>
                    <p className="text-[11px] text-stone-500">System Administrator • LabShare</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstantAdmin}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#241B16] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#382C25] transition cursor-pointer"
                >
                  <span>Demo Login</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Error notification */}
          {error && (
            <div className="mx-6 mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-rose-900">Login Failed</p>
                <p className="leading-snug">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {roleTab === 'admin' ? 'Administrator Email' : 'Institutional Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  required
                  className="w-full rounded-xl border border-[#E5DAC6] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                  placeholder={roleTab === 'admin' ? 'admin@university.edu' : 'researcher@university.edu'}
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
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  required
                  className="w-full rounded-xl border border-[#E5DAC6] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-stone-300 text-[#C58A48] focus:ring-[#C58A48]" />
                <span>Remember workstation</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Password recovery is available through institutional SSO helpdesk.')}
                className="text-xs font-semibold text-[#B37636] hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                Forgot password?
              </button>
            </div>

            <Button
              variant="dark"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-sm font-bold text-white shadow-lg cursor-pointer transition ${
                roleTab === 'admin' ? 'bg-[#241B16] hover:bg-[#382C25]' : 'bg-[#C58A48] hover:bg-[#B37636]'
              }`}
            >
              {isSubmitting
                ? 'Authenticating...'
                : roleTab === 'admin'
                ? 'Sign In to Admin Console'
                : 'Sign In to Research Portal'}
            </Button>

            <p className="text-center text-[11px] text-stone-500 pt-1">
              Protected by Institutional SSO & Pan-India Research Grid Security
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
