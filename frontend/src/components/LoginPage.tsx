import { useState } from 'react'
import { Ship, AlertCircle, Eye, EyeOff, ArrowLeft, LockKeyhole } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LoginPageProps {
  onEnterDashboard: () => void
  onBackToHome: () => void
}

export default function LoginPage({ onEnterDashboard, onBackToHome }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      onEnterDashboard()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Sign-in failed. Check your owner credentials and try again.')
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

        <div className="flex items-start gap-3 rounded-xl bg-navy-800/70 border border-white/10 p-4 mb-6">
          <LockKeyhole className="w-5 h-5 text-sea-400 flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-white font-semibold text-sm">Owner sign-in</h1>
            <p className="text-steel-400 text-xs mt-1 leading-relaxed">
              Dashboard access is private. Use the owner credentials configured for this deployment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-steel-300 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="owner@marineos.app"
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
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-steel-500 mt-6">
          MarineOS v1.0 · Maritime Document Management
        </p>
      </div>
    </div>
  )
}
