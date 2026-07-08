import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

/** Chrome's install event — not yet in the TS DOM lib. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'install_prompt_dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true // iOS Safari
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * Floating "Install app" affordance.
 * - Android/desktop Chrome: appears when the browser fires beforeinstallprompt
 *   and triggers the native install dialog.
 * - iOS Safari: shows a one-time hint (Share → Add to Home Screen).
 * - Hidden entirely when already running as an installed app.
 */
export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    if (isIos()) setShowIosHint(true)

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setInstallEvent(null)
    setShowIosHint(false)
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setInstallEvent(null)
  }

  if (installEvent) {
    return (
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-1 animate-fade-in">
        <button
          type="button"
          onClick={install}
          className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full bg-sea-600 hover:bg-sea-500
                     text-white text-sm font-semibold shadow-xl shadow-sea-900/40 transition"
        >
          <Download className="w-4 h-4" />
          Install app — free
        </button>
        <button type="button" onClick={dismiss} aria-label="Dismiss install prompt"
          className="p-2 rounded-full bg-navy-800/90 text-steel-400 hover:text-white transition">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  if (showIosHint) {
    return (
      <div className="fixed bottom-5 left-5 right-5 sm:right-auto sm:max-w-xs z-40 animate-fade-in">
        <div className="flex items-start gap-3 bg-navy-800/95 border border-white/10 rounded-2xl p-4 shadow-xl">
          <Share className="w-5 h-5 text-sea-400 flex-shrink-0 mt-0.5" />
          <p className="text-steel-300 text-xs leading-relaxed">
            <span className="text-white font-semibold">Get the free app:</span> tap{' '}
            <span className="text-white">Share</span> then{' '}
            <span className="text-white">Add to Home Screen</span>.
          </p>
          <button type="button" onClick={dismiss} aria-label="Dismiss"
            className="text-steel-500 hover:text-white transition flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
