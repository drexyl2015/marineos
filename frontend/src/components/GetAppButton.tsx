import { useState } from 'react'
import { Smartphone, X, Share, MoreVertical, Monitor } from 'lucide-react'
import { promptInstall, isStandalone, isIos, isAndroid } from '../lib/installApp'

/**
 * Always-visible "Get the Free App" button. One click either triggers the
 * browser's native install dialog (Android/desktop Chrome) or shows clear
 * per-device instructions (iPhone, other browsers). Hidden once installed.
 */
export default function GetAppButton({ variant = 'primary' }: { variant?: 'primary' | 'nav' }) {
  const [showHelp, setShowHelp] = useState(false)

  if (isStandalone()) return null // already running as the installed app

  const handleClick = async () => {
    const result = await promptInstall()
    if (result === 'unavailable') setShowHelp(true)
    // 'accepted' → installed; 'dismissed' → user said no; nothing more to do
  }

  const buttonClass =
    variant === 'nav'
      ? 'btn-secondary py-2 px-4 text-sm'
      : 'btn-secondary text-base px-8 py-4'

  return (
    <>
      <button type="button" onClick={handleClick} className={buttonClass}>
        <Smartphone className={variant === 'nav' ? 'w-4 h-4' : 'w-5 h-5'} />
        Get the Free App
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setShowHelp(false)}>
          <div className="bg-navy-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 text-left"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Install the MarineOS app</h3>
              <button type="button" onClick={() => setShowHelp(false)} aria-label="Close"
                className="text-steel-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-steel-400 text-sm mb-5">
              Free, takes 10 seconds, no app store needed. The app appears on your
              home screen with the MarineOS anchor icon.
            </p>

            {isIos() ? (
              <ol className="space-y-3 text-sm text-steel-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sea-500/20 text-sea-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  Open <span className="text-white font-semibold mx-1">marineos.app</span> in <span className="text-white font-semibold ml-1">Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sea-500/20 text-sea-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap the <Share className="w-4 h-4 inline text-sea-400 mx-1" /><span className="text-white font-semibold">Share</span> button at the bottom</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sea-500/20 text-sea-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Scroll down and tap <span className="text-white font-semibold">"Add to Home Screen"</span>, then <span className="text-white font-semibold">Add</span></span>
                </li>
              </ol>
            ) : isAndroid() ? (
              <ol className="space-y-3 text-sm text-steel-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sea-500/20 text-sea-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  Open <span className="text-white font-semibold mx-1">marineos.app</span> in <span className="text-white font-semibold ml-1">Chrome</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sea-500/20 text-sea-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap the <MoreVertical className="w-4 h-4 inline text-sea-400 mx-1" /><span className="text-white font-semibold">menu</span> (top right)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sea-500/20 text-sea-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Tap <span className="text-white font-semibold">"Add to Home screen"</span> (or <span className="text-white font-semibold">"Install app"</span>), then confirm</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-steel-300">
                <li className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-sea-400 flex-shrink-0" />
                  <span>In Chrome or Edge, click the <span className="text-white font-semibold">install icon</span> at the right end of the address bar (a screen with a down arrow), then <span className="text-white font-semibold">Install</span>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-sea-400 flex-shrink-0" />
                  <span>On your phone, open <span className="text-white font-semibold">marineos.app</span> and tap "Get the Free App" again for phone steps.</span>
                </li>
              </ol>
            )}

            <button type="button" onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 bg-sea-600 hover:bg-sea-500 text-white font-semibold rounded-xl transition text-sm">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
