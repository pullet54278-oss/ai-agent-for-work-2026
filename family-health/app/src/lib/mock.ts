// หลังบ้านจำลองสำหรับทดสอบ (VITE_API_URL=mock) ทำงานเหมือน apps-script/Code.gs แบบย่อ
import type { ApiRequest } from './api'

const KEY = 'fh-mock-db'
const ALLOWED = ['dad@example.com', 'mom@example.com']
const TABLES = ['people', 'vaccines', 'appointments', 'measurements', 'illnesses', 'expenses', 'school', 'medicines']
type Db = Record<string, Record<string, string>[]>

function load(): Db {
  const db = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Db
  TABLES.forEach((t) => (db[t] ??= []))
  return db
}

export function handle(req: ApiRequest, email: string) {
  if (!ALLOWED.includes(email)) return { ok: false, error: 'forbidden' }
  const db = load()
  if (req.action === 'getAll') return { ok: true, data: db, email }
  if (!req.table || !TABLES.includes(req.table)) return { ok: false, error: 'unknown table' }
  const rows = db[req.table]
  if (req.action === 'delete') {
    db[req.table] = rows.filter((r) => r.id !== req.id)
  } else {
    const rec = req.record ?? {}
    if (!rec.id) return { ok: false, error: 'missing id' }
    const i = rows.findIndex((r) => r.id === rec.id)
    const now = new Date().toISOString()
    const next: Record<string, string> = { ...(i >= 0 ? rows[i] : { createdAt: now }) }
    Object.entries(rec).forEach(([k, v]) => (next[k] = v === null || v === undefined ? '' : String(v)))
    Object.assign(next, { updatedAt: now, updatedBy: email })
    if (i >= 0) rows[i] = next
    else rows.push(next)
    localStorage.setItem(KEY, JSON.stringify(db))
    return { ok: true, record: next }
  }
  localStorage.setItem(KEY, JSON.stringify(db))
  return { ok: true }
}
