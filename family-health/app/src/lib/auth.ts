// เข้าสู่ระบบด้วย Google Identity Services: ได้ ID token ไปแนบทุกคำขอถึง Apps Script
import { useEffect, useState } from 'react'

export interface User {
  email: string
  name: string
  picture?: string
  token: string
  exp: number // ms
}

interface GoogleId {
  initialize(o: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean; use_fedcm_for_prompt?: boolean }): void
  renderButton(el: HTMLElement, o: Record<string, unknown>): void
  prompt(): void
  disableAutoSelect(): void
}
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

const KEY = 'fh-user'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
export const isMock = import.meta.env.VITE_API_URL === 'mock'
export const authConfigured = isMock || Boolean(CLIENT_ID && import.meta.env.VITE_API_URL)

let current: User | null = load()
const listeners = new Set<(u: User | null) => void>()

function load(): User | null {
  try {
    const u = JSON.parse(localStorage.getItem(KEY) ?? 'null') as User | null
    return u && u.exp > Date.now() + 60_000 ? u : null
  } catch {
    return null
  }
}

function set(u: User | null) {
  current = u
  try {
    if (u) localStorage.setItem(KEY, JSON.stringify(u))
    else localStorage.removeItem(KEY)
  } catch {
    // ที่เก็บในเครื่องใช้ไม่ได้ (โหมดไม่ระบุตัวตน) ก็ยังใช้งานต่อได้ในหน้านี้
  }
  listeners.forEach((l) => l(u))
}

function decode(token: string): User {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
  const p = JSON.parse(json) as { email: string; name?: string; picture?: string; exp: number }
  return { email: p.email, name: p.name ?? p.email, picture: p.picture, token, exp: p.exp * 1000 }
}

function waitForGis(): Promise<GoogleId> {
  return new Promise((resolve) => {
    const tick = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : setTimeout(tick, 100))
    tick()
  })
}

let initialized = false
async function gis(): Promise<GoogleId> {
  const id = await waitForGis()
  if (!initialized) {
    id.initialize({
      client_id: CLIENT_ID!,
      callback: (r) => set(decode(r.credential)),
      auto_select: true,
      use_fedcm_for_prompt: true,
    })
    initialized = true
  }
  return id
}

export async function renderSignInButton(el: HTMLElement) {
  const id = await gis()
  id.renderButton(el, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'signin_with', locale: 'th', width: 280 })
  id.prompt()
}

/** token หมดอายุทุก 1 ชม.: ขอใหม่แบบเงียบ ถ้าไม่ได้จะกลับไปหน้าเข้าสู่ระบบ */
export async function refreshToken(): Promise<void> {
  if (isMock) return
  set(null)
  const id = await gis()
  id.prompt()
}

export function signOut() {
  window.google?.accounts?.id.disableAutoSelect()
  set(null)
}

export function getUser() {
  return current
}

/** ใช้ในโหมดทดสอบเท่านั้น (VITE_API_URL=mock) */
export function mockSignIn(email: string, name: string) {
  if (!isMock) return
  set({ email, name, token: `mock:${email}`, exp: Date.now() + 3600_000 })
}

export function useUser(): User | null {
  const [u, setU] = useState(current)
  useEffect(() => {
    listeners.add(setU)
    return () => void listeners.delete(setU)
  }, [])
  return u
}
