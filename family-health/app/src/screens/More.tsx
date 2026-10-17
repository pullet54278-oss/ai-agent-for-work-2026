import { useState } from 'react'
import { signOut, type User } from '../lib/auth'
import { clearCache, newId, save, useStore } from '../lib/store'
import { emptyPerson, relationLabel, type Person, type Relation } from '../lib/types'
import { ageText } from '../lib/date'

const SHEET_URL = import.meta.env.VITE_SHEET_URL as string | undefined

export default function More({ user, people }: { user: User; people: Person[] }) {
  const [editing, setEditing] = useState<Partial<Person> | null>(null)
  const { syncedAt } = useStore()

  if (editing) return <PersonForm initial={editing} onDone={() => setEditing(null)} />

  return (
    <>
      <div className="card">
        <h3>โปรไฟล์ในครอบครัว</h3>
        {people.map((p) => (
          <div key={p.id} className="list-item" onClick={() => setEditing(p)}>
            <span className="grow">
              <b>{p.nickname || p.fullName}</b> <span className="mute">({relationLabel[p.relation]})</span>
              <br /><span className="mute">{p.fullName} {ageText(p.birthDate) && `· ${ageText(p.birthDate)}`}</span>
            </span>
            {p.g6pd && <span className="pill bad">G6PD</span>}
            <span className="mute">แก้ไข ›</span>
          </div>
        ))}
        <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setEditing({ ...emptyPerson })}>
          + เพิ่มโปรไฟล์
        </button>
      </div>

      <div className="card">
        <h3>ข้อมูลเก็บใน Google Sheet</h3>
        <p className="mute" style={{ marginTop: 0 }}>
          {syncedAt ? `ดึงข้อมูลล่าสุดเมื่อ ${new Date(syncedAt).toLocaleTimeString('th-TH')} น.` : 'ยังไม่ได้ดึงข้อมูล'}
          {' · '}ข้อมูลที่อีกฝ่ายบันทึกจะเห็นเมื่อกด 🔄 ด้านบน
        </p>
        {SHEET_URL && <a className="btn ghost block" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }} href={SHEET_URL} target="_blank" rel="noreferrer">เปิด Google Sheet</a>}
      </div>

      <div className="card">
        <div className="row"><span className="grow">เข้าสู่ระบบเป็น <b>{user.name}</b><br /><span className="mute">{user.email}</span></span></div>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { clearCache(); signOut() }}>
          ออกจากระบบ (ลบข้อมูลที่เก็บในเครื่องนี้)
        </button>
      </div>
    </>
  )
}

function PersonForm({ initial, onDone }: { initial: Partial<Person>; onDone: () => void }) {
  const [p, setP] = useState<Partial<Person>>(initial)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Person>(k: K, v: Person[K]) => setP((o) => ({ ...o, [k]: v }))
  const text = (k: keyof Person, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="f"><span>{label}</span>
      <input className="in" value={(p[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} {...props} />
    </label>
  )

  async function submit() {
    setBusy(true)
    const ok = await save('people', { ...p, id: p.id ?? newId() })
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div className="card">
      <h3>{p.id ? 'แก้ไขโปรไฟล์' : 'เพิ่มโปรไฟล์'}</h3>
      <label className="f"><span>ความสัมพันธ์</span>
        <select className="in" value={p.relation} onChange={(e) => set('relation', e.target.value as Relation)}>
          {Object.entries(relationLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      {text('nickname', 'ชื่อเล่น / ชื่อเรียก', { placeholder: 'เช่น น้องมะลิ, พ่อเอ' })}
      {text('fullName', 'ชื่อ-นามสกุล')}
      <label className="f"><span>เพศ</span>
        <select className="in" value={p.sex} onChange={(e) => set('sex', e.target.value as Person['sex'])}>
          <option value="">-</option><option value="male">ชาย</option><option value="female">หญิง</option>
        </select>
      </label>
      {text('birthDate', 'วันเกิด', { type: 'date' })}
      {text('phone', 'เบอร์โทร (แสดงในบัตรฉุกเฉิน)', { type: 'tel', inputMode: 'tel' })}
      {text('bloodGroup', 'กรุ๊ปเลือด', { placeholder: 'เช่น O, A, B, AB' })}
      {text('hospital', 'โรงพยาบาลประจำ')}
      {text('hn', 'เลข HN')}
      <label className="check">
        <input type="checkbox" checked={!!p.g6pd} onChange={(e) => set('g6pd', e.target.checked)} />
        มีภาวะพร่องเอนไซม์ G-6-PD
      </label>
      {text('allergies', 'แพ้ยา / แพ้อาหาร')}
      {text('notes', 'หมายเหตุ')}
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !(p.nickname || p.fullName)} onClick={submit}>
          {busy ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}
