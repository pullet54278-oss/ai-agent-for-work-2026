import { useState } from 'react'
import type { Data, Medicine, Person } from '../lib/types'
import { daysUntil, thaiDate } from '../lib/date'
import { newId, remove, save } from '../lib/store'
import { g6pdHits } from './Illnesses'

/** ยาที่ตรงรายการ G-6-PD จากชื่อสามัญหรือชื่อบนฉลาก */
export function medicineHits(m: Pick<Medicine, 'name' | 'generic'>) {
  return g6pdHits([m.generic, m.name].filter(Boolean).join('\n'))
}

/** ใกล้หมดอายุ (ภายใน 60 วัน) หรือหมดแล้ว */
export function expiryState(expiry: string): 'expired' | 'soon' | '' {
  if (!expiry) return ''
  const d = daysUntil(expiry)
  return d < 0 ? 'expired' : d <= 60 ? 'soon' : ''
}

export default function Medicines({ person, data }: { person: Person; data: Data }) {
  const [form, setForm] = useState<Partial<Medicine> | null>(null)
  const [showFinished, setShowFinished] = useState(false)
  if (form) return <div className="card"><MedicineForm person={person} initial={form} onDone={() => setForm(null)} /></div>

  const all = data.medicines.filter((m) => m.personId === person.id)
  const have = all.filter((m) => m.status !== 'finished').sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const finished = all.filter((m) => m.status === 'finished')
  const flagged = have.filter((m) => medicineHits(m).length > 0)
  const expiring = have.filter((m) => expiryState(m.expiry))

  return (
    <>
      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>💊 ตู้ยาประจำตัว</h3>
          <button className="btn ghost" onClick={() => setForm({ status: 'have' })}>+ เพิ่มยา</button></div>
        <p className="mute" style={{ margin: '6px 0 0' }}>
          มียา {have.length} รายการ{finished.length > 0 && ` · ใช้หมด/ทิ้งแล้ว ${finished.length} รายการ`}
        </p>
      </div>

      {person.g6pd && flagged.length > 0 && (
        <div className="card alert red">
          <b>⚠️ มียาที่ตรงรายการ G-6-PD {flagged.length} รายการ</b>
          <div className="mute">{flagged.map((m) => m.name).join(' · ')} · ถามแพทย์/เภสัชกรก่อนใช้</div>
        </div>
      )}
      {expiring.length > 0 && (
        <div className="card alert">
          <b>📅 ยาหมดอายุหรือใกล้หมดอายุ {expiring.length} รายการ</b>
          <div className="mute">{expiring.map((m) => `${m.name} (${thaiDate(m.expiry)})`).join(' · ')}</div>
        </div>
      )}

      <div className="card">
        {have.length === 0 && <p className="mute">ยังไม่มียาในตู้</p>}
        {have.map((m) => <MedicineRow key={m.id} m={m} g6pd={person.g6pd} onOpen={() => setForm(m)} />)}
      </div>

      {finished.length > 0 && (
        <div className="card">
          <button className="btn ghost block" onClick={() => setShowFinished(!showFinished)}>
            {showFinished ? 'ซ่อน' : 'ดู'}ยาที่ใช้หมด/ทิ้งแล้ว ({finished.length})
          </button>
          {showFinished && finished.map((m) => <MedicineRow key={m.id} m={m} g6pd={person.g6pd} onOpen={() => setForm(m)} />)}
        </div>
      )}
      <p className="mute">ใช้ยาตามฉลากหรือที่แพทย์สั่งล่าสุดเท่านั้น ยาที่ไม่มีฉลากหรือหมดอายุควรทิ้ง</p>
    </>
  )
}

function MedicineRow({ m, g6pd, onOpen }: { m: Medicine; g6pd: boolean; onOpen: () => void }) {
  const hits = g6pd ? medicineHits(m) : []
  const exp = expiryState(m.expiry)
  return (
    <div className="list-item" onClick={onOpen} style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
      <span className="grow">
        <b>{m.name}</b>{m.generic && m.generic.toLowerCase() !== m.name.toLowerCase() && <span className="mute"> ({m.generic})</span>}
        <div className="mute">{[m.strength, m.purpose].filter(Boolean).join(' · ')}</div>
        {m.dose && <div>📋 {m.dose}</div>}
        <div className="mute">
          {[m.source, m.date && thaiDate(m.date), m.amount].filter(Boolean).join(' · ')}
          {m.expiry && ` · หมดอายุ ${thaiDate(m.expiry)}`}
        </div>
        {hits.map((h) => (
          <div key={h.med} className={`pill ${h.item.level === 'avoid' ? 'bad' : 'warn'}`} style={{ marginTop: 4 }}>
            {h.item.level === 'avoid' ? '🔴 ห้ามใช้' : '🟡 ระวัง'} (G-6-PD)
          </div>
        ))}
      </span>
      {exp && <span className={`pill ${exp === 'expired' ? 'bad' : 'warn'}`}>{exp === 'expired' ? 'หมดอายุ' : 'ใกล้หมดอายุ'}</span>}
    </div>
  )
}

function MedicineForm({ person, initial, onDone }: { person: Person; initial: Partial<Medicine>; onDone: () => void }) {
  const [v, setV] = useState<Partial<Medicine>>({
    name: '', generic: '', strength: '', purpose: '', dose: '', source: '', date: '', expiry: '', amount: '', notes: '',
    status: 'have', ...initial,
  })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Medicine>(k: K, val: Medicine[K]) => setV((o) => ({ ...o, [k]: val }))
  const text = (k: keyof Medicine, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="f"><span>{label}</span>
      <input className="in" value={(v[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} {...props} /></label>
  )
  const hits = medicineHits({ name: v.name ?? '', generic: v.generic ?? '' })

  async function submit() {
    setBusy(true)
    const ok = await save('medicines', { ...v, id: v.id ?? newId(), personId: person.id })
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div>
      <h3>{v.id ? 'แก้ไขยา' : 'เพิ่มยาในตู้'}</h3>
      {text('name', 'ชื่อยา (ตามฉลาก)', { placeholder: 'เช่น Mucolid Junior' })}
      {text('generic', 'ชื่อสามัญ (ใช้ตรวจ G-6-PD)', { placeholder: 'เช่น ambroxol' })}
      {person.g6pd && hits.map((h) => (
        <div key={h.med} className={`result ${h.item.level === 'avoid' ? 'bad' : 'warn'}`} style={{ margin: '-6px 0 10px' }}>
          <b>{h.item.level === 'avoid' ? '🔴 ห้ามใช้' : '🟡 ใช้ด้วยความระมัดระวัง'}: {h.item.name}</b> <span className="mute">({h.item.group})</span>
        </div>
      ))}
      <div className="grid2">
        {text('strength', 'ความแรง', { placeholder: 'เช่น 15 มก./5 มล.' })}
        {text('amount', 'ขนาดบรรจุ', { placeholder: 'เช่น 60 มล.' })}
      </div>
      {text('purpose', 'ใช้สำหรับ', { placeholder: 'เช่น ละลายเสมหะ' })}
      {text('dose', 'วิธีใช้ (ตามฉลาก/แพทย์สั่ง)', { placeholder: 'เช่น 2.5 ซีซี วันละ 3 ครั้ง หลังอาหาร' })}
      {text('source', 'ได้จาก', { placeholder: 'เช่น รพ.ชัยบาดาล, ร้านยา' })}
      <div className="grid2">
        {text('date', 'วันที่ได้รับ', { type: 'date' })}
        {text('expiry', 'วันหมดอายุ', { type: 'date' })}
      </div>
      <label className="f"><span>สถานะ</span>
        <select className="in" value={v.status} onChange={(e) => set('status', e.target.value as Medicine['status'])}>
          <option value="have">มีอยู่ในตู้</option><option value="finished">ใช้หมด/ทิ้งแล้ว</option>
        </select></label>
      {text('notes', 'หมายเหตุ')}
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !v.name} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
      </div>
      {v.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }}
          onClick={async () => { if (confirm('ลบยานี้ออกจากรายการ?')) { await remove('medicines', v.id!); onDone() } }}>ลบ</button>
      )}
    </div>
  )
}
