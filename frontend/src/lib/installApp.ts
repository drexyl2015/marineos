/**
 * Shared PWA install state. Imported for side effects in main.tsx so the
 * one-shot `beforeinstallprompt` event is captured before React mounts.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as BeforeInstallPromptEvent
  listeners.forEach((l) => l())
})

export function subscribeInstallAvailable(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function installAvailable(): boolean {
  return deferred !== null
}

/** Trigger the browser's native install dialog if it's available. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  try {
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') deferred = null
    return choice.outcome
  } catch {
    // The event can only be used once — treat a re-use as unavailable.
    deferred = null
    return 'unavailable'
  }
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true // iOS Safari
  )
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent)
}
