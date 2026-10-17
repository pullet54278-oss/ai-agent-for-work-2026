import { useState } from 'react'
import { signOut, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { inviteLink, savePerson } from '../lib/family'
import { emptyPerson, relationLabel, type Family, type Person, type Relation } from '../lib/types'
import { ageText } from '../lib/date'

interface Props { user: User; family: Family; people: Person[] }

export default function More({ user, family, people }: Props) {
  const [editing, setEditing] = useState<Partial<Person> | null>(null)
  const [copied, setCopied] = useState(false)
  const link = inviteLink(family)

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: 'เข้าร่วมสมุดสุขภาพครอบครัว', url: link }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    }
  }

  if (editing) return <PersonForm fid={family.id} initial={editing} onDone={() => setEditing(null)} />

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
        <h3>ผู้ใช้แอป ({family.members.length} คน)</h3>
        {family.members.map((uid) => (
          <div key={uid} className="list-item" style={{ cursor: 'default' }}>
            <span className="grow">{family.memberNames?.[uid] ?? uid}</span>
            {uid === user.uid && <span className="pill info">คุณ</span>}
          </div>
        ))}
        <p className="mute">ส่งลิงก์เชิญให้อีกฝ่ายเปิดบนมือถือ แล้วเข้าสู่ระบบด้วย Google ของตัวเอง</p>
        <button className="btn block" onClick={share}>{copied ? 'คัดลอกลิงก์แล้ว ✓' : 'ส่งลิงก์เชิญ'}</button>
      </div>

      <div className="card">
        <div className="row"><span className="grow">เข้าสู่ระบบเป็น {user.email}</span></div>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => signOut(auth!)}>ออกจากระบบ</button>
      </div>
    </>
  )
}

function PersonForm({ fid, initial, onDone }: { fid: string; initial: Partial<Person>; onDone: () => void }) {
  const [p, setP] = useState<Partial<Person>>(initial)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Person>(k: K, v: Person[K]) => setP((o) => ({ ...o, [k]: v }))
  const text = (k: keyof Person, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="f"><span>{label}</span>
      <input className="in" value={(p[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} {...props} />
    </label>
  )

  async function save() {
    setBusy(true)
    try {
      await savePerson(fid, p)
      onDone()
    } finally {
      setBusy(false)
    }
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
        <button className="btn ghost grow" onClick={() => onDone()}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !(p.nickname || p.fullName)} onClick={save}>บันทึก</button>
      </div>
    </div>
  )
}
