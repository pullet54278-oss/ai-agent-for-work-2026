import { useState } from 'react'
import type { Data, Person, Vaccine } from '../lib/types'
import { EPI, OPTIONAL, nextDoseDate, vaccineName, type EpiDose } from '../data/vaccines'
import { addMonths, ageInMonths, daysUntil, thaiDate, todayIso } from '../lib/date'
import { newId, remove, save } from '../lib/store'
import { AppointmentForm, AppointmentList, upcoming } from './Appointments'

const EPI_CODES = new Set(EPI.map((e) => e.code))
const baht = (n: number) => n.toLocaleString('th-TH')

type Status = { kind: 'given'; rec: Vaccine } | { kind: 'missing' } | { kind: 'upcoming'; due: string }

export function epiStatus(person: Person, recs: Vaccine[], e: EpiDose): Status {
  const rec = recs.find((r) => r.code === e.code && r.dose === e.dose)
  if (rec) return { kind: 'given', rec }
  if (!person.birthDate) return { kind: 'missing' }
  if (ageInMonths(person.birthDate) >= e.ageMonths) return { kind: 'missing' }
  return { kind: 'upcoming', due: addMonths(person.birthDate, e.ageMonths) }
}

export function epiFor(person: Person): EpiDose[] {
  return EPI.filter((e) => !e.sex || e.sex === person.sex)
}

export default function Vaccines({ person, data }: { person: Person; data: Data }) {
  const [form, setForm] = useState<Partial<Vaccine> | null>(null)
  const [apptForm, setApptForm] = useState(false)
  const recs = data.vaccines.filter((v) => v.personId === person.id)
  const optional = recs.filter((r) => !EPI_CODES.has(r.code)).sort((a, b) => b.date.localeCompare(a.date))
  const optionalTotal = optional.reduce((s, r) => s + (r.price ?? 0), 0)
  const appts = upcoming(data, person.id).filter((a) => a.type === 'vaccine')

  if (form) return <div className="card"><VaccineForm person={person} recs={recs} initial={form} onDone={() => setForm(null)} /></div>
  if (apptForm) {
    return <div className="card"><AppointmentForm initial={{ personId: person.id, type: 'vaccine' }} onDone={() => setApptForm(false)} /></div>
  }

  let lastAge = ''
  return (
    <>
      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>นัดวัคซีน</h3>
          <button className="btn ghost" onClick={() => setApptForm(true)}>+ นัด</button></div>
        <div style={{ marginTop: 10 }}><AppointmentList items={appts} people={data.people} /></div>
      </div>

      <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setForm({ personId: person.id })}>
        + บันทึกการฉีดวัคซีน
      </button>

      <div className="card">
        <h3>วัคซีนตามแผนงาน (EPI)</h3>
        {!person.birthDate && <p className="mute">ใส่วันเกิดในโปรไฟล์ก่อน เพื่อคำนวณวันที่ควรได้รับ</p>}
        {epiFor(person).map((e) => {
          const st = epiStatus(person, recs, e)
          const showAge = e.ageLabel !== lastAge
          lastAge = e.ageLabel
          return (
            <div key={e.code + e.dose} className="vrow" style={{ cursor: 'pointer' }}
              onClick={() => setForm(st.kind === 'given' ? st.rec : { personId: person.id, code: e.code, dose: e.dose })}>
              <span className="age">{showAge ? e.ageLabel : ''}</span>
              <span className="grow">{e.name}{e.note && <><br /><small className="mute">{e.note}</small></>}</span>
              {st.kind === 'given' && <span className="pill ok">✓ {thaiDate(st.rec.date)}</span>}
              {st.kind === 'missing' && <span className="pill warn">ยังไม่บันทึก</span>}
              {st.kind === 'upcoming' && (
                <span className="pill info">{daysUntil(st.due) <= 60 ? `อีก ${daysUntil(st.due)} วัน` : thaiDate(st.due)}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>วัคซีนเสริม</h3>
          {optionalTotal > 0 && <span className="mute">รวม {baht(optionalTotal)} บาท</span>}</div>
        {optional.length === 0 && <p className="mute">ยังไม่มีบันทึก</p>}
        {optional.map((r) => (
          <div key={r.id} className="vrow" style={{ cursor: 'pointer' }} onClick={() => setForm(r)}>
            <span className="grow">
              <b>{r.name || vaccineName(r.code, r.dose)}</b>
              <br /><span className="mute">{r.date ? thaiDate(r.date) : 'ไม่ทราบวันที่'}{r.place && ` · ${r.place}`}</span>
            </span>
            {r.price != null && (
              <span className={`pill ${r.priceEstimate ? 'warn' : 'ok'}`}>{baht(r.price)}{r.priceEstimate ? ' ~' : ''}</span>
            )}
          </div>
        ))}
        {optional.some((r) => r.priceEstimate) && <p className="mute">~ = ราคาประมาณการจากราคากลาง ยังไม่มีใบเสร็จ</p>}
      </div>
    </>
  )
}

function VaccineForm({ person, recs, initial, onDone }: { person: Person; recs: Vaccine[]; initial: Partial<Vaccine>; onDone: () => void }) {
  const [v, setV] = useState<Partial<Vaccine>>({ date: todayIso(), dose: 1, place: '', lot: '', notes: '', priceEstimate: false, ...initial })
  const [busy, setBusy] = useState(false)
  const isEpi = !!v.code && EPI_CODES.has(v.code)
  const next = !isEpi && v.code ? nextDoseDate(v.code, v.dose ?? 1, v.date ?? '') : null
  const [makeAppt, setMakeAppt] = useState(!initial.id)
  const [apptDate, setApptDate] = useState('')
  const set = <K extends keyof Vaccine>(k: K, val: Vaccine[K]) => setV((o) => ({ ...o, [k]: val }))

  // ตัวเลือก: วัคซีน EPI ที่ยังไม่ได้บันทึก + วัคซีนเสริม
  const epiPending = epiFor(person).filter((e) => !recs.some((r) => r.code === e.code && r.dose === e.dose) || (e.code === v.code && e.dose === v.dose))
  const choice = v.code ? (isEpi ? `${v.code}|${v.dose}` : v.code) : ''

  function pick(val: string) {
    const [code, dose] = val.split('|')
    if (dose) setV((o) => ({ ...o, code, dose: Number(dose) }))
    else {
      const given = recs.filter((r) => r.code === code && r.id !== v.id).length
      setV((o) => ({ ...o, code, dose: given + 1 }))
    }
  }

  async function submit() {
    setBusy(true)
    const id = v.id ?? newId()
    const ok = await save('vaccines', { ...v, id, personId: person.id, name: vaccineName(v.code!, v.dose ?? 1) })
    if (ok && makeAppt && next) {
      await save('appointments', {
        id: newId(), personId: person.id, type: 'vaccine', status: 'pending',
        title: vaccineName(v.code!, next.dose), date: apptDate || next.date, time: '', place: v.place ?? '', notes: '',
      })
    }
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div>
      <h3>{v.id ? 'แก้ไขบันทึกวัคซีน' : 'บันทึกการฉีดวัคซีน'}</h3>
      <label className="f"><span>วัคซีน</span>
        <select className="in" value={choice} onChange={(e) => pick(e.target.value)}>
          <option value="">— เลือก —</option>
          <optgroup label="วัคซีนเสริม">
            {OPTIONAL.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
          </optgroup>
          <optgroup label="ตามแผนงาน (EPI)">
            {epiPending.map((e) => <option key={e.code + e.dose} value={`${e.code}|${e.dose}`}>{e.ageLabel}: {e.name}</option>)}
          </optgroup>
        </select>
      </label>
      {!isEpi && v.code && (
        <>
          <p className="mute" style={{ marginTop: -6 }}>{OPTIONAL.find((o) => o.code === v.code)?.note}</p>
          <label className="f"><span>เข็มที่</span>
            <input className="in" type="number" min={1} value={v.dose ?? 1} onChange={(e) => set('dose', Number(e.target.value))} /></label>
        </>
      )}
      <div className="grid2">
        <label className="f"><span>วันที่ฉีด</span>
          <input className="in" type="date" value={v.date ?? ''} onChange={(e) => set('date', e.target.value)} /></label>
        <label className="f"><span>เลข Lot</span>
          <input className="in" value={v.lot ?? ''} onChange={(e) => set('lot', e.target.value)} /></label>
      </div>
      <label className="f"><span>สถานที่</span>
        <input className="in" value={v.place ?? ''} onChange={(e) => set('place', e.target.value)} /></label>
      <div className="grid2">
        <label className="f"><span>ราคา (บาท)</span>
          <input className="in" type="number" inputMode="numeric" value={v.price ?? ''}
            onChange={(e) => set('price', e.target.value === '' ? null : Number(e.target.value))} /></label>
        <label className="check" style={{ marginTop: 26 }}>
          <input type="checkbox" checked={!!v.priceEstimate} onChange={(e) => set('priceEstimate', e.target.checked)} />
          ราคาประมาณ
        </label>
      </div>
      <label className="f"><span>หมายเหตุ</span>
        <input className="in" value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></label>
      {next && (
        <div className="card alert" style={{ margin: '0 0 12px' }}>
          <label className="check" style={{ marginBottom: 6 }}>
            <input type="checkbox" checked={makeAppt} onChange={(e) => setMakeAppt(e.target.checked)} />
            สร้างนัด{vaccineName(v.code!, next.dose)}
          </label>
          {makeAppt && <input className="in" type="date" value={apptDate || next.date} onChange={(e) => setApptDate(e.target.value)} />}
        </div>
      )}
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !v.code || !v.date} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
      </div>
      {v.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }} disabled={busy}
          onClick={async () => { if (confirm('ลบบันทึกนี้?')) { await remove('vaccines', v.id!); onDone() } }}>ลบบันทึก</button>
      )}
    </div>
  )
}
