import { useState } from 'react'
import type { Benefit, Data, Illness, Insurance, Person } from '../lib/types'
import { daysUntil, formatPhone, thaiDate, todayIso } from '../lib/date'
import { newId, remove, save } from '../lib/store'

const baht = (n: number) => n.toLocaleString('th-TH')
const GROUPS: Record<Benefit['group'], string> = { ipd: '🏥 ผู้ป่วยใน (นอนโรงพยาบาล)', opd: '🩺 ผู้ป่วยนอก', other: 'อื่น ๆ' }

export function benefitsOf(p: Pick<Insurance, 'benefits'>): Benefit[] {
  try {
    const b = JSON.parse(p.benefits || '[]')
    return Array.isArray(b) ? b : []
  } catch {
    return []
  }
}

/** กรมธรรม์ที่คุ้มครองอยู่ ณ วันที่ */
export function activePolicies(list: Insurance[], personId: string, on = todayIso()): Insurance[] {
  return list.filter((p) => p.personId === personId && (!p.startDate || p.startDate <= on) && (!p.endDate || p.endDate >= on))
}

/** ครั้งที่ใช้สิทธิผู้ป่วยนอก: การป่วยที่ไม่ได้นอนโรงพยาบาลและมีค่ารักษา ในช่วงคุ้มครอง */
export function opdVisits(p: Pick<Insurance, 'startDate' | 'endDate' | 'personId'>, illnesses: Illness[]): Illness[] {
  return illnesses.filter((i) => i.personId === p.personId && !i.admitted && (i.cost ?? 0) > 0 &&
    (!p.startDate || i.startDate >= p.startDate) && (!p.endDate || i.startDate <= p.endDate))
}

export default function InsuranceList({ person, data, onBack }: { person: Person; data: Data; onBack: () => void }) {
  const [open, setOpen] = useState<Insurance | null>(null)
  const [form, setForm] = useState<Partial<Insurance> | null>(null)
  const list = data.insurance.filter((p) => p.personId === person.id).sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''))

  if (form) return <div className="card"><InsuranceForm person={person} initial={form} onDone={() => setForm(null)} /></div>
  const current = open && list.find((p) => p.id === open.id)
  if (current) return <PolicyView p={current} data={data} onBack={() => setOpen(null)} onEdit={() => setForm(current)} />

  return (
    <>
      <div className="card">
        <div className="row">
          <button className="btn ghost" onClick={onBack} aria-label="กลับ">‹</button>
          <h3 className="grow" style={{ margin: 0 }}>🛡️ ประกัน</h3>
          <button className="btn ghost" onClick={() => setForm({})}>+ เพิ่ม</button>
        </div>
      </div>
      <div className="card">
        {list.length === 0 && <p className="mute">ยังไม่มีกรมธรรม์</p>}
        {list.map((p) => <PolicyRow key={p.id} p={p} onOpen={() => setOpen(p)} />)}
      </div>
    </>
  )
}

export function PolicyRow({ p, onOpen }: { p: Insurance; onOpen: () => void }) {
  const left = p.endDate ? daysUntil(p.endDate) : null
  return (
    <div className="list-item" onClick={onOpen} style={{ cursor: 'pointer' }}>
      <span className="grow">
        <b>{p.company}</b>{p.plan && <span className="mute"> · {p.plan}</span>}
        <br /><span className="mute">เลขสมาชิก {p.memberNo || '-'}</span>
        {p.endDate && <><br /><span className="mute">คุ้มครองถึง {thaiDate(p.endDate)}</span></>}
      </span>
      {left != null && (left < 0 ? <span className="pill bad">หมดอายุ</span> : left <= 45 ? <span className="pill warn">ใกล้ครบกำหนด</span> : <span className="pill ok">คุ้มครองอยู่</span>)}
    </div>
  )
}

function PolicyView({ p, data, onBack, onEdit }: { p: Insurance; data: Data; onBack: () => void; onEdit: () => void }) {
  const benefits = benefitsOf(p)
  const opd = benefits.find((b) => b.group === 'opd' && b.maxPerYear)
  const used = opd ? opdVisits(p, data.illnesses) : []
  const groups = (Object.keys(GROUPS) as Benefit['group'][]).filter((g) => benefits.some((b) => b.group === g))
  return (
    <>
      <div className="card">
        <div className="row">
          <button className="btn ghost" onClick={onBack} aria-label="กลับ">‹</button>
          <h3 className="grow" style={{ margin: 0 }}>{p.company}</h3>
          <button className="btn ghost" onClick={onEdit}>แก้ไข</button>
        </div>
        {p.plan && <p className="mute" style={{ margin: '6px 0 0' }}>{p.plan}</p>}
        <div className="emg" style={{ marginTop: 10 }}>
          <div>เลขสมาชิก <b>{p.memberNo || '-'}</b></div>
          {p.policyNo && <div className="mute">กรมธรรม์ {p.policyNo}{p.holder && ` · ${p.holder}`}</div>}
          {p.employeeNo && <div className="mute">เลขพนักงาน {p.employeeNo}</div>}
          <div className="mute">คุ้มครอง {p.startDate ? thaiDate(p.startDate) : '-'} – {p.endDate ? thaiDate(p.endDate) : '-'}</div>
          {p.phone && <div style={{ marginTop: 6 }}>📞 <a href={`tel:${p.phone.replace(/\D/g, '')}`}>{formatPhone(p.phone)}</a> (Call Center)</div>}
        </div>
      </div>

      {opd && (
        <div className="card">
          <div className="row"><b className="grow">สิทธิผู้ป่วยนอกปีนี้</b><b>{Math.max(0, opd.maxPerYear! - used.length)} / {opd.maxPerYear} ครั้ง</b></div>
          <div style={{ height: 8, background: '#e6ebf3', borderRadius: 4, margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (used.length / opd.maxPerYear!) * 100)}%`, height: '100%', background: 'var(--pri)' }} />
          </div>
          <p className="mute" style={{ margin: 0 }}>
            ใช้ไป {used.length} ครั้ง (นับจากบันทึกการป่วยที่มีค่ารักษาและไม่ได้นอน รพ.) · ยอดที่บริษัทประกันแจ้งอาจต่างเล็กน้อย
          </p>
        </div>
      )}

      {groups.map((g) => (
        <div key={g} className="card">
          <h3>{GROUPS[g]}</h3>
          {benefits.filter((b) => b.group === g).map((b) => (
            <div key={b.label} className="vrow" style={{ alignItems: 'flex-start' }}>
              <span className="grow">{b.label}{b.limit && <><br /><small className="mute">{b.limit}</small></>}</span>
              {b.amount != null && <b style={{ whiteSpace: 'nowrap' }}>{baht(b.amount)}{b.per && <small className="mute"> /{b.per}</small>}</b>}
            </div>
          ))}
        </div>
      ))}
      {p.notes && <div className="card"><p className="mute" style={{ margin: 0 }}>{p.notes}</p></div>}
    </>
  )
}

function InsuranceForm({ person, initial, onDone }: { person: Person; initial: Partial<Insurance>; onDone: () => void }) {
  const [v, setV] = useState<Partial<Insurance>>({
    company: '', plan: '', memberNo: '', policyNo: '', holder: '', employeeNo: '', startDate: '', endDate: '', phone: '',
    benefits: '[]', notes: '', ...initial,
  })
  const [busy, setBusy] = useState(false)
  const text = (k: keyof Insurance, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="f"><span>{label}</span>
      <input className="in" value={(v[k] as string) ?? ''} onChange={(e) => setV((o) => ({ ...o, [k]: e.target.value }))} {...props} /></label>
  )
  async function submit() {
    setBusy(true)
    const ok = await save('insurance', { ...v, id: v.id ?? newId(), personId: person.id })
    setBusy(false)
    if (ok) onDone()
  }
  return (
    <div>
      <h3>{v.id ? 'แก้ไขกรมธรรม์' : 'เพิ่มกรมธรรม์'}</h3>
      {text('company', 'บริษัทประกัน', { placeholder: 'เช่น เมืองไทยประกันชีวิต' })}
      {text('plan', 'แผน / ประเภท', { placeholder: 'เช่น Health CARE ประกันกลุ่ม' })}
      <div className="grid2">{text('memberNo', 'หมายเลขสมาชิก')}{text('policyNo', 'หมายเลขกรมธรรม์')}</div>
      {text('holder', 'เจ้าของกรมธรรม์ (ถ้าเป็นประกันกลุ่ม)')}
      {text('employeeNo', 'เลขพนักงาน')}
      <div className="grid2">{text('startDate', 'เริ่มคุ้มครอง', { type: 'date' })}{text('endDate', 'สิ้นสุด', { type: 'date' })}</div>
      {text('phone', 'เบอร์ Call Center', { inputMode: 'tel' })}
      {text('notes', 'หมายเหตุ')}
      <p className="mute"><small>รายการผลประโยชน์แก้ได้ในแท็บ insurance ของ Google Sheet</small></p>
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !v.company} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
      </div>
      {v.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }}
          onClick={async () => { if (confirm('ลบกรมธรรม์นี้?')) { await remove('insurance', v.id!); onDone() } }}>ลบ</button>
      )}
    </div>
  )
}
