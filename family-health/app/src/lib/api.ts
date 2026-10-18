import { freshToken, getUser, isMock } from './auth'

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
export async function call<T = Record<string, unknown>>(req: ApiRequest, retried = false): Promise<T> {
  const user = getUser()
  if (!user) throw new AuthError('unauthenticated')
  const token = await freshToken()
  if (!token) throw new AuthError('unauthenticated')
  let json: { ok: boolean; error?: string } & Record<string, unknown>
  if (isMock) {
    const mock = await import('./mock')
    json = mock.handle(req, user.email)
  } else {
    // text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง preflight (Apps Script ไม่ตอบ OPTIONS)
    const url = import.meta.env.VITE_API_URL as string | undefined
    if (!url?.endsWith('/exec')) throw new Error('VITE_API_URL ใน Netlify ต้องเป็น Web app URL ที่ลงท้ายด้วย /exec')
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...req, idToken: token }),
      })
    } catch {
      throw new Error(navigator.onLine
        ? 'เชื่อมต่อ Apps Script ไม่ได้ — ตรวจว่า Deploy แบบ Execute as: Me และ Who has access: Anyone'
        : 'ไม่มีอินเทอร์เน็ต')
    }
    try {
      json = await res.json()
    } catch {
      throw new Error('Apps Script ตอบกลับผิดรูปแบบ — ตรวจว่ารัน setup แล้ว และ Deploy เวอร์ชันล่าสุดของ Code.gs')
    }
  }
  if (!json.ok) {
    const err = json.error ?? 'unknown error'
    if (AUTH_ERRORS.includes(err)) {
      // token ถูกปฏิเสธ (เช่น เครื่องตั้งเวลาไม่ตรง): ขอใหม่แล้วลองอีกครั้งเดียว
      if (!retried && (await freshToken(true))) return call<T>(req, true)
      throw new AuthError(err)
    }
    throw new Error(MESSAGES[err] ?? err)
  }
  return json as T
}
