import { useState } from 'react'
import { Ship, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LoginPageProps {
  onEnterDashboard: () => void
  onBackToHome: () => void
}

type Tab = 'login' | 'register'

export default function LoginPage({ onEnterDashboard, onBackToHome }: LoginPageProps) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('crew_manager')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, fullName || undefined, role)
      }
      onEnterDashboard()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <button type="button" onClick={onBackToHome}
          className="flex items-center gap-1.5 text-steel-400 hover:text-white transition text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Ship className="w-8 h-8 text-sea-500" />
          <span className="text-2xl font-bold text-white">MarineOS</span>
        </div>

        <div className="flex rounded-xl bg-navy-800 p-1 mb-6">
          {(['login', 'register'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-sea-600 text-white' : 'text-steel-400 hover:text-white'}`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-steel-300 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-2.5 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-steel-300 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-navy-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sea-500 text-sm">
                  <option value="super_admin">Super Admin</option>
                  <option value="crew_manager">Crew Manager</option>
                  <option value="compliance_officer">Compliance Officer</option>
                  <option value="master">Master</option>
                  <option value="seafarer">Seafarer</option>
                  <option value="fleet_ops">Fleet Ops</option>
                  <option value="port_authority">Port Authority</option>
                  <option value="crew_agency">Crew Agency</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-steel-300 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-steel-300 mb-1">Password</label>
            <div className="relative">
              <input required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500 text-sm pr-10" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-white transition">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-sea-600 hover:bg-sea-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">
            {loading ? (tab === 'login' ? 'Signing in…' : 'Creating account…') : (tab === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-xs text-steel-500 mt-6">
          MarineOS v1.0 · Maritime Document Management
        </p>
      </div>
    </div>
  )
}
