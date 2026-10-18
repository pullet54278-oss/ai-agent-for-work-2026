// ข้อมูลทั้งหมดของครอบครัว: โหลดจาก Google Sheet ครั้งเดียว เก็บสำเนาไว้ในเครื่อง (เปิดดูได้แม้ออฟไลน์)
// และบันทึกแบบแสดงผลทันที (optimistic) แล้วค่อยส่งขึ้น Sheet
import { useEffect, useState } from 'react'
import { AuthError, call } from './api'
import { getUser } from './auth'
import { BOOL_FIELDS, NUMBER_FIELDS, emptyData, type Data, type Row, type Table } from './types'

const CACHE = 'fh-cache-v1'

interface State {
  data: Data
  loading: boolean
  saving: number
  error: string
  syncedAt: number | null
}

let state: State = { data: readCache(), loading: false, saving: 0, error: '', syncedAt: null }
const listeners = new Set<(s: State) => void>()

function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l(state))
}

function readCache(): Data {
  try {
    return { ...emptyData, ...(JSON.parse(localStorage.getItem(CACHE) ?? '{}') as Partial<Data>) }
  } catch {
    return emptyData
  }
}

function writeCache(data: Data) {
  try {
    localStorage.setItem(CACHE, JSON.stringify(data))
  } catch {
    // เต็มหรือใช้ไม่ได้: ไม่กระทบการใช้งานออนไลน์
  }
}

export function clearCache() {
  localStorage.removeItem(CACHE)
  setState({ data: emptyData, syncedAt: null })
}

/** ข้อความจาก Sheet → ชนิดที่แอปใช้ */
export function normalize<T extends Table>(table: T, raw: Record<string, unknown>): Row<T> {
  const out: Record<string, unknown> = { ...raw }
  for (const k of NUMBER_FIELDS[table] ?? []) {
    const v = raw[k]
    out[k] = v === '' || v === undefined || v === null ? null : Number(v)
  }
  for (const k of BOOL_FIELDS[table] ?? []) out[k] = raw[k] === true || String(raw[k]).toLowerCase() === 'true'
  return out as unknown as Row<T>
}

async function guarded<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const r = await fn()
    setState({ error: '' })
    return r
  } catch (e) {
    if (e instanceof AuthError) {
      setState({ error: 'กรุณาเข้าสู่ระบบอีกครั้ง' })
    } else {
      setState({ error: navigator.onLine ? (e as Error).message : 'ไม่มีอินเทอร์เน็ต — แสดงข้อมูลล่าสุดที่บันทึกในเครื่อง' })
    }
    return undefined
  }
}

export async function refresh() {
  if (!getUser() || state.loading) return
  setState({ loading: true })
  await guarded(async () => {
    const res = await call<{ data: Record<Table, Record<string, unknown>[]> }>({ action: 'getAll' })
    const data = { ...emptyData }
    for (const t of Object.keys(emptyData) as Table[]) {
      ;(data[t] as unknown[]) = (res.data[t] ?? []).map((r) => normalize(t, r))
    }
    writeCache(data)
    setState({ data, syncedAt: Date.now() })
  })
  setState({ loading: false })
}

function replaceRow<T extends Table>(data: Data, table: T, row: Row<T> | null, id: string): Data {
  const list = data[table] as Row<T>[]
  let next: Row<T>[]
  if (!row) next = list.filter((r) => r.id !== id)
  else if (list.some((r) => r.id === id)) next = list.map((r) => (r.id === id ? row : r))
  else next = [...list, row]
  return { ...data, [table]: next }
}

export function newId(): string {
  return crypto.randomUUID()
}

/** บันทึก (เพิ่มหรือแก้ไข) — คืน true เมื่อบันทึกลง Sheet สำเร็จ */
export async function save<T extends Table>(table: T, record: Partial<Row<T>> & { id: string }): Promise<boolean> {
  const before = state.data
  const old = (before[table] as Row<T>[]).find((r) => r.id === record.id)
  const optimistic = { ...(old ?? {}), ...record } as Row<T>
  setState({ data: replaceRow(before, table, optimistic, record.id), saving: state.saving + 1 })
  const res = await guarded(() => call<{ record: Record<string, unknown> }>({ action: 'upsert', table, record }))
  setState({ saving: state.saving - 1 })
  if (!res) {
    setState({ data: before })
    return false
  }
  const data = replaceRow(state.data, table, normalize(table, res.record), record.id)
  writeCache(data)
  setState({ data })
  return true
}

export async function remove(table: Table, id: string): Promise<boolean> {
  const before = state.data
  setState({ data: replaceRow(before, table, null, id), saving: state.saving + 1 })
  const res = await guarded(() => call({ action: 'delete', table, id }))
  setState({ saving: state.saving - 1 })
  if (res === undefined) {
    setState({ data: before })
    return false
  }
  writeCache(state.data)
  return true
}

export function useStore(): State {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    return () => void listeners.delete(setS)
  }, [])
  return s
}
