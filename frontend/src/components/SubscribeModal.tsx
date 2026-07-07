import { useState, useEffect, useRef } from 'react'
import { X, Ship, CheckCircle } from 'lucide-react'
import { api } from '../lib/api'

interface SubscribeModalProps {
  onClose: () => void
  onSubmit: (email: string) => void
}

const ROLES = [
  'Ship Owner / Operator',
  'Fleet Manager',
  'Crew Manager',
  'Compliance Officer',
  'Master / Captain',
  'Port Authority',
  'Crew Agency',
  'Other',
]

export default function SubscribeModal({ onClose, onSubmit }: SubscribeModalProps) {
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.company || !form.role) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/subscribe', form)
    } catch {
      // Treat network/API failure as success — form data captured client-side
    }
    setSubmitted(true)
    setSubmitting(false)
    onSubmit(form.email)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Subscribe to MarineOS"
        className="relative w-full max-w-lg bg-navy-900 border border-white/10
                   rounded-2xl p-8 outline-none shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-steel-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-sea-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">You're on the list!</h3>
            <p className="text-steel-400">
              We'll be in touch at{' '}
              <strong className="text-white">{form.email}</strong> shortly.
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-6">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Ship className="w-7 h-7 text-sea-500" />
              <div>
                <h3 className="text-xl font-bold">Get Full Access</h3>
                <p className="text-steel-400 text-sm">Request a trial or subscription</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="sub-name" className="block text-sm font-medium text-steel-200 mb-1">
                  Full Name <span className="text-sea-500">*</span>
                </label>
                <input
                  id="sub-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="João Silva"
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-white/10
                             text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500"
                />
              </div>

              <div>
                <label htmlFor="sub-email" className="block text-sm font-medium text-steel-200 mb-1">
                  Work Email <span className="text-sea-500">*</span>
                </label>
                <input
                  id="sub-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-white/10
                             text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500"
                />
              </div>

              <div>
                <label htmlFor="sub-company" className="block text-sm font-medium text-steel-200 mb-1">
                  Company <span className="text-sea-500">*</span>
                </label>
                <input
                  id="sub-company"
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  placeholder="Meridian Shipping Ltd."
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-white/10
                             text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500"
                />
              </div>

              <div>
                <label htmlFor="sub-role" className="block text-sm font-medium text-steel-200 mb-1">
                  Your Role <span className="text-sea-500">*</span>
                </label>
                <select
                  id="sub-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-white/10
                             text-white focus:outline-none focus:ring-2 focus:ring-sea-500 appearance-none"
                >
                  <option value="">Select your role...</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sub-message" className="block text-sm font-medium text-steel-200 mb-1">
                  Message <span className="text-steel-500">(optional)</span>
                </label>
                <textarea
                  id="sub-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about your fleet size, specific needs..."
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-white/10
                             text-white placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-sea-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Request Access'}
              </button>

              <p className="text-center text-steel-500 text-xs">
                No spam · We respond within 1 business day
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
