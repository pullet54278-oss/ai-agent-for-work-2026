import { getUser, isMock } from './auth'

export class AuthError extends Error {}

const AUTH_ERRORS = ['unauthenticated', 'invalid token', 'token expired']
const MESSAGES: Record<string, string> = {
  forbidden: 'อีเมลนี้ไม่มีสิทธิ์ใช้แอป ให้ผู้ดูแลเพิ่มอีเมลใน ALLOWED_EMAILS',
  'server not configured': 'ยังไม่ได้ตั้งค่า CLIENT_ID / ALLOWED_EMAILS ใน Apps Script',
}

export interface ApiRequest {
  action: 'getAll' | 'upsert' | 'delete'
  table?: string
  record?: Record<string, unknown>
  id?: string
}

/** เรียก Apps Script Web App (หรือหลังบ้านจำลองในโหมดทดสอบ) */
export async function call<T = Record<string, unknown>>(req: ApiRequest): Promise<T> {
  const user = getUser()
  if (!user) throw new AuthError('unauthenticated')
  let json: { ok: boolean; error?: string } & Record<string, unknown>
  if (isMock) {
    const mock = await import('./mock')
    json = mock.handle(req, user.email)
  } else {
    // text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง preflight (Apps Script ไม่ตอบ OPTIONS)
    const res = await fetch(import.meta.env.VITE_API_URL as string, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...req, idToken: user.token }),
    })
    json = await res.json()
  }
  if (!json.ok) {
    const err = json.error ?? 'unknown error'
    if (AUTH_ERRORS.includes(err)) throw new AuthError(err)
    throw new Error(MESSAGES[err] ?? err)
  }
  return json as T
}
