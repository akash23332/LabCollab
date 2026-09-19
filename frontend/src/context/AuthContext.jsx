import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const defaultUser = {
  name: 'Maya Chen',
  role: 'Researcher',
  institution: 'Tufts University',
  department: 'Biomedical Engineering',
  email: 'maya.chen@tufts.edu',
  avatar: 'MC',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState('landing') // 'landing' | 'dashboard'
  const [activeTab, setActiveTab] = useState('overview')

  const login = (customUser = defaultUser) => {
    setUser(customUser)
    setCurrentView('dashboard')
    setIsLoginModalOpen(false)
  }

  const logout = () => {
    setUser(null)
    setCurrentView('landing')
  }

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)

  const navigateTo = (view) => {
    setCurrentView(view)
    if (view === 'dashboard' && !user) {
      setUser(defaultUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        currentView,
        activeTab,
        setActiveTab,
        isLoginModalOpen,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
        navigateTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext