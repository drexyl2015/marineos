import { useEffect, useState } from 'react'
import { Ship, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft, MailCheck, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

interface LoginPageProps {
  onEnterDashboard: () => void
  onBackToHome: () => void
}

type Mode = 'signin' | 'signup' | 'code-request' | 'code-entry'

export default function LoginPage({ onEnterDashboard, onBackToHome }: LoginPageProps) {
  const { login, register, loginWithCode } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Result of clicking the email verification link (?verified=1 / ?verified=0)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')
    if (verified === '1') {
      setInfo('Email verified! You can sign in now.')
    } else if (verified === '0') {
      setError('That verification link is invalid or has expired. Sign up again or request a new link.')
    }
    if (verified !== null) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setInfo(null)
    setCode('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signin') {
        await login(email, password)
        onEnterDashboard()
      } else if (mode === 'signup') {
        const needsVerification = await register(email, password, fullName)
        if (needsVerification) {
          switchMode('signin')
          setInfo('Account created! Check your email for the verification link, then sign in here.')
        } else {
          onEnterDashboard()
        }
      } else if (mode === 'code-request') {
        await api.post('/api/auth/request-login-code', { email })
        switchMode('code-entry')
        setInfo(`We sent a 6-digit code to ${email}. Enter it below — it expires in 10 minutes.`)
      } else if (mode === 'code-entry') {
        await loginWithCode(email, code)
        onEnterDashboard()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500 text-sm'

  const titles: Record<Mode, { heading: string; button: string }> = {
    signin: { heading: 'Sign in to your account', button: 'Sign In' },
    signup: { heading: 'Create your free account', button: 'Create Account' },
    'code-request': { heading: 'Sign in with an email code', button: 'Send Code' },
    'code-entry': { heading: 'Enter your sign-in code', button: 'Verify & Sign In' },
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <button type="button" onClick={onBackToHome}
          className="flex items-center gap-1.5 text-steel-400 hover:text-white transition text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center justify-center gap-3 mb-6">
          <Ship className="w-8 h-8 text-sea-500" />
          <span className="text-2xl font-bold text-white">MarineOS</span>
        </div>

        <h1 className="text-white font-semibold text-center mb-6">{titles[mode].heading}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-steel-300 mb-1">Full name</label>
              <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Jane Mariner" className={inputClass} />
            </div>
          )}

          {mode !== 'code-entry' && (
            <div>
              <label className="block text-sm font-medium text-steel-300 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass} />
            </div>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <label className="block text-sm font-medium text-steel-300 mb-1">Password</label>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  minLength={mode === 'signup' ? 8 : undefined}
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-white transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'code-entry' && (
            <div>
              <label className="block text-sm font-medium text-steel-300 mb-1">6-digit code</label>
              <input required inputMode="numeric" pattern="\d{6}" maxLength={6} value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className={`${inputClass} text-center text-lg tracking-[0.5em] font-mono`} />
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {info}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-sea-600 hover:bg-sea-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">
            {loading ? 'Please wait…' : titles[mode].button}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          {mode === 'signin' && (
            <>
              <p className="text-steel-400">
                New to MarineOS?{' '}
                <button type="button" onClick={() => switchMode('signup')}
                  className="text-sea-400 hover:text-sea-300 font-semibold">Create a free account</button>
              </p>
              <p className="text-steel-400">
                Forgot your password?{' '}
                <button type="button" onClick={() => switchMode('code-request')}
                  className="text-sea-400 hover:text-sea-300 font-semibold inline-flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" /> Sign in with an email code
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-steel-400">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('signin')}
                className="text-sea-400 hover:text-sea-300 font-semibold">Sign in</button>
            </p>
          )}
          {(mode === 'code-request' || mode === 'code-entry') && (
            <>
              {mode === 'code-entry' && (
                <p className="text-steel-400">
                  Didn't get it?{' '}
                  <button type="button" onClick={() => switchMode('code-request')}
                    className="text-sea-400 hover:text-sea-300 font-semibold inline-flex items-center gap-1">
                    <MailCheck className="w-3.5 h-3.5" /> Send a new code
                  </button>
                </p>
              )}
              <p className="text-steel-400">
                <button type="button" onClick={() => switchMode('signin')}
                  className="text-sea-400 hover:text-sea-300 font-semibold">Back to password sign-in</button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-steel-500 mt-6">
          MarineOS v1.0 · Free for maritime professionals
        </p>
      </div>
    </div>
  )
}
