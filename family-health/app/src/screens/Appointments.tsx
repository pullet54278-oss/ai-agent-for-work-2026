import { useState } from 'react'
import type { Appointment, Data, Person } from '../lib/types'
import { daysUntil, thaiDate, todayIso } from '../lib/date'
import { newId, remove, save } from '../lib/store'

const TYPE_ICON: Record<Appointment['type'], string> = { vaccine: '💉', doctor: '🩺', school: '🎓', other: '📌' }

export function upcoming(data: Data, personId?: string): Appointment[] {
  const today = todayIso()
  return data.appointments
    .filter((a) => a.status === 'pending' && (!personId || a.personId === personId) && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

export function overdue(data: Data, personId?: string): Appointment[] {
  const today = todayIso()
  return data.appointments.filter((a) => a.status === 'pending' && (!personId || a.personId === personId) && a.date < today)
}

export function AppointmentList({ items, people }: { items: Appointment[]; people: Person[] }) {
  const [edit, setEdit] = useState<Partial<Appointment> | null>(null)
  if (edit) return <AppointmentForm initial={edit} onDone={() => setEdit(null)} />
  if (items.length === 0) return <p className="mute">ยังไม่มีนัด</p>
  return (
    <>
      {items.map((a) => {
        const n = daysUntil(a.date)
        const who = people.length > 1 ? people.find((p) => p.id === a.personId)?.nickname : ''
        return (
          <div key={a.id} className="row" style={{ cursor: 'pointer' }} onClick={() => setEdit(a)}>
            <div className={`count ${n < 0 ? 'late' : ''}`}>
              {n === 0 ? 'วันนี้' : Math.abs(n)}
              {n !== 0 && <small>{n < 0 ? 'วันที่แล้ว' : 'วัน'}</small>}
            </div>
            <div className="grow">
              <b>{TYPE_ICON[a.type] ?? '📌'} {a.title}</b>
              <div className="mute">{thaiDate(a.date)}{a.time && ` · ${a.time} น.`}{a.place && ` · ${a.place}`}{who && ` · ${who}`}</div>
            </div>
          </div>
        )
      })}
    </>
  )
}

export function AppointmentForm({ initial, onDone }: { initial: Partial<Appointment>; onDone: () => void }) {
  const [a, setA] = useState<Partial<Appointment>>({ type: 'doctor', status: 'pending', time: '', place: '', notes: '', ...initial })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Appointment>(k: K, v: Appointment[K]) => setA((o) => ({ ...o, [k]: v }))

  async function submit(status?: Appointment['status']) {
    setBusy(true)
    const ok = await save('appointments', { ...a, status: status ?? a.status, id: a.id ?? newId() })
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div>
      <h3>{a.id ? 'แก้ไขนัด' : 'เพิ่มนัด'}</h3>
      <label className="f"><span>ประเภท</span>
        <select className="in" value={a.type} onChange={(e) => set('type', e.target.value as Appointment['type'])}>
          <option value="vaccine">💉 วัคซีน</option><option value="doctor">🩺 หาหมอ</option>
          <option value="school">🎓 โรงเรียน / ค่าเทอม</option><option value="other">📌 อื่น ๆ</option>
        </select>
      </label>
      <label className="f"><span>เรื่อง</span>
        <input className="in" value={a.title ?? ''} onChange={(e) => set('title', e.target.value)} /></label>
      <div className="grid2">
        <label className="f"><span>วันที่</span>
          <input className="in" type="date" value={a.date ?? ''} onChange={(e) => set('date', e.target.value)} /></label>
        <label className="f"><span>เวลา (ไม่บังคับ)</span>
          <input className="in" type="time" value={a.time ?? ''} onChange={(e) => set('time', e.target.value)} /></label>
      </div>
      <label className="f"><span>สถานที่</span>
        <input className="in" value={a.place ?? ''} onChange={(e) => set('place', e.target.value)} /></label>
      <label className="f"><span>หมายเหตุ</span>
        <input className="in" value={a.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></label>
      <p className="mute">บันทึกแล้วจะขึ้นใน Google Calendar "สมุดสุขภาพครอบครัว" และเตือนล่วงหน้า 7 วันกับ 1 วัน</p>
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !a.title || !a.date} onClick={() => submit()}>บันทึก</button>
      </div>
      {a.id && (
        <div className="row">
          <button className="btn ghost grow" disabled={busy} onClick={() => submit('done')}>✓ ไปตามนัดแล้ว</button>
          <button className="btn ghost grow" disabled={busy} style={{ color: 'var(--bad)' }}
            onClick={async () => { if (confirm('ลบนัดนี้?')) { await remove('appointments', a.id!); onDone() } }}>ลบนัด</button>
        </div>
      )}
    </div>
  )
}
