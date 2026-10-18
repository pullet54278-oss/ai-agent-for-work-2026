// ปุ่มติดตั้งแอปลงเครื่อง (PWA): เก็บเหตุการณ์ beforeinstallprompt ไว้ตั้งแต่เปิดหน้า แล้วเรียกเมื่อผู้ใช้กดปุ่ม
import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallState = 'installed' | 'ready' | 'ios' | 'unavailable'

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

let installed = typeof window !== 'undefined' && isStandalone()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // ไม่ให้ Chrome แสดงแถบของตัวเอง ใช้ปุ่มในแอปแทน
    deferred = e as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
}

export function installState(): InstallState {
  if (installed) return 'installed'
  if (deferred) return 'ready'
  if (isIos()) return 'ios'
  return 'unavailable'
}

/** เปิดหน้าต่างติดตั้งของเบราว์เซอร์ คืน true ถ้าผู้ใช้กดติดตั้ง */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const e = deferred
  deferred = null
  await e.prompt()
  const { outcome } = await e.userChoice
  notify()
  return outcome === 'accepted'
}

export function useInstall(): InstallState {
  const [s, setS] = useState(installState)
  useEffect(() => {
    const l = () => setS(installState())
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])
  return s
}
