import { useState } from 'react'
import { signOut, type User } from '../lib/auth'
import { clearCache, newId, save, useStore } from '../lib/store'
import { emptyPerson, type Person } from '../lib/types'
import { ageText, formatPhone, parseContacts } from '../lib/date'
import { photoToDataUrl } from '../lib/photo'
import InstallButton from './InstallButton'

const SHEET_URL = import.meta.env.VITE_SHEET_URL as string | undefined

export default function More({ user, person }: { user: User; person?: Person }) {
  const [editing, setEditing] = useState<Partial<Person> | null>(null)
  const { syncedAt } = useStore()

  if (editing) return <PersonForm initial={editing} onDone={() => setEditing(null)} />

  return (
    <>
      <div className="card">
        <h3>ข้อมูลลูก</h3>
        {person ? (
          <div className="list-item" onClick={() => setEditing(person)}>
            <span className="photo">{person.photo ? <img src={person.photo} alt="" /> : person.sex === 'female' ? '👧' : '👦'}</span>
            <span className="grow">
              <b>{person.nickname || person.fullName}</b>
              <br /><span className="mute">{person.fullName} {ageText(person.birthDate) && `· ${ageText(person.birthDate)}`}</span>
              {parseContacts(person.phone).map((c) => (
                <span key={c.phone} className="mute"><br />📞 {c.label} {formatPhone(c.phone)}</span>
              ))}
            </span>
            {person.g6pd && <span className="pill bad">G6PD</span>}
            <span className="mute">แก้ไข ›</span>
          </div>
        ) : (
          <button className="btn block" onClick={() => setEditing({ ...emptyPerson })}>+ ใส่ข้อมูลลูก</button>
        )}
      </div>

      <div className="card">
        <h3>แอปบนมือถือ</h3>
        <InstallButton />
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

  const [photoErr, setPhotoErr] = useState('')
  async function pickPhoto(file?: File) {
    if (!file) return
    setPhotoErr('')
    try { set('photo', await photoToDataUrl(file)) } catch (e) { setPhotoErr((e as Error).message) }
  }

  async function submit() {
    setBusy(true)
    const ok = await save('people', { ...p, relation: 'child', id: p.id ?? newId() })
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div className="card">
      <h3>{p.id ? 'แก้ไขข้อมูลลูก' : 'ใส่ข้อมูลลูก'}</h3>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="photo lg">{p.photo ? <img src={p.photo} alt="รูปโปรไฟล์" /> : p.sex === 'female' ? '👧' : '👦'}</span>
        <span className="grow">
          <label className="btn ghost" style={{ display: 'inline-block' }}>
            {p.photo ? 'เปลี่ยนรูป' : '📷 ใส่รูปโปรไฟล์'}
            <input type="file" accept="image/*" hidden aria-label="รูปโปรไฟล์" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          {p.photo && <button className="btn ghost" style={{ marginLeft: 6 }} onClick={() => set('photo', '')}>ลบรูป</button>}
          {photoErr && <div className="mute" style={{ color: 'var(--bad)' }}>{photoErr}</div>}
        </span>
      </div>
      {text('nickname', 'ชื่อเล่น', { placeholder: 'เช่น น้องมะลิ' })}
      {text('fullName', 'ชื่อ-นามสกุล')}
      <label className="f"><span>เพศ</span>
        <select className="in" value={p.sex} onChange={(e) => set('sex', e.target.value as Person['sex'])}>
          <option value="">-</option><option value="male">ชาย</option><option value="female">หญิง</option>
        </select>
      </label>
      {text('birthDate', 'วันเกิด', { type: 'date' })}
      {text('phone', 'เบอร์โทรพ่อแม่ (แสดงในบัตรฉุกเฉิน)', { placeholder: 'เช่น พ่อ 0812345678, แม่ 0898765432' })}
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
