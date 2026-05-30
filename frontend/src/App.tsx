import { useState, useEffect } from 'react'
import DashboardRouter from './components/DashboardRouter'
import Navigation from './components/Navigation'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import ImpressumPage from './components/ImpressumPage'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import AIAssistantWidget from './components/AIAssistantWidget'
import { AuthProvider, useAuth } from './context/AuthContext'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type AppView = 'landing' | 'login' | 'dashboard' | 'impressum' | 'privacy'
export type Theme = 'light' | 'dark'

function AppInner() {
  const { isAuthenticated, logout } = useAuth()
  const [view, setView] = useState<AppView>('landing')
  const [selectedRole, setSelectedRole] = useState<string>('super_admin')
  const [apiHealth, setApiHealth] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'light'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 })
      setApiHealth(response.status === 200)
    } catch {
      setApiHealth(false)
    } finally {
      setLoading(false)
    }
  }

  const handleEnterDashboard = () => {
    if (!isAuthenticated) {
      setView('login')
    } else {
      setView('dashboard')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  const handleLoginSuccess = () => {
    setView('dashboard')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleSubscribe = (email: string) => {
    console.info('Subscription initiated for:', email)
  }

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sea-500 mx-auto mb-4" />
          <p className="text-steel-400 font-semibold">Loading MarineOS...</p>
        </div>
      </div>
    )
  }

  if (view === 'impressum') {
    return <ImpressumPage onBack={() => setView('landing')} />
  }

  if (view === 'privacy') {
    return <PrivacyPolicyPage onBack={() => setView('landing')} />
  }

  if (view === 'landing') {
    return (
      <>
        <LandingPage
          onEnterDashboard={handleEnterDashboard}
          onSubscribe={handleSubscribe}
          onShowImpressum={() => setView('impressum')}
          onShowPrivacy={() => setView('privacy')}
        />
        <AIAssistantWidget selectedRole={selectedRole} />
      </>
    )
  }

  if (view === 'login') {
    return <LoginPage onEnterDashboard={handleLoginSuccess} onBackToHome={() => setView('landing')} />
  }

  if (!apiHealth) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-navy-950">
          <div className="bg-navy-900 border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md text-center text-white">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
            <p className="text-steel-400 mb-4">
              Cannot connect to backend API at{' '}
              <code className="bg-navy-800 px-2 py-1 rounded text-sea-400 text-sm">{API_URL}</code>
            </p>
            <p className="text-sm text-steel-500 mb-6">
              Make sure the backend is running:{' '}
              <code className="bg-navy-800 px-2 py-1 rounded text-xs">uvicorn main:app --reload</code>
            </p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={checkApiHealth} className="btn-primary">
                Retry Connection
              </button>
              <button type="button" onClick={() => setView('landing')} className="btn-secondary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
        <AIAssistantWidget selectedRole={selectedRole} />
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-navy-900">
        <Navigation
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onBackToLanding={() => setView('landing')}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={setTheme}
        />
        <main className="pt-16">
          <DashboardRouter selectedRole={selectedRole} />
        </main>
      </div>
      <AIAssistantWidget selectedRole={selectedRole} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
