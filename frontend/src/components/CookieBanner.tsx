import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'marineos_cookie_consent'

interface Props {
  onShowPrivacy: () => void
}

export default function CookieBanner({ onShowPrivacy }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] p-4 sm:p-6">
      <div
        className="max-w-4xl mx-auto rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.08)',
        }}
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-sea-600/20 border border-sea-500/30 flex items-center justify-center shrink-0">
          <Cookie className="w-4 h-4 text-sea-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium mb-0.5">We use essential cookies only</p>
          <p className="text-steel-400 text-xs leading-relaxed">
            We use localStorage to save your theme and login session. No tracking or advertising cookies.{' '}
            <button
              onClick={onShowPrivacy}
              className="text-sea-400 hover:text-sea-300 underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </button>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium text-steel-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-150"
          >
            Essential only
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium text-white bg-sea-600 hover:bg-sea-500 transition-all duration-150"
          >
            Accept
          </button>
          <button
            onClick={decline}
            aria-label="Dismiss"
            className="p-2 rounded-xl text-steel-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
