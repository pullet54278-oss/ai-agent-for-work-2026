import { useState } from 'react'
import type { Data, Expense, Person } from '../lib/types'
import { addMonths, thaiDate, todayIso } from '../lib/date'
import { newId, remove, save } from '../lib/store'

const baht = (n: number) => n.toLocaleString('th-TH')
const STATUS: Record<Expense['status'], [string, string]> = {
  evidence: ['🟢', 'มีหลักฐาน / จ่ายแล้ว'], estimate: ['🟡', 'ประมาณการ'], pending: ['⚪', 'รอชำระ'],
}
const CATEGORIES = ['ค่าเรียน', 'ค่ารักษา', 'ค่าวัคซีน', 'อื่น ๆ']
const CLAIMS = ['', 'ไม่เบิก', 'ยังไม่เบิก', 'ยื่นเบิกแล้ว', 'ได้รับเงินแล้ว']

/** ปี พ.ศ. ของรายการ: จาก period (เช่น 2569/1) หรือจากวันที่ */
export function yearOf(e: Pick<Expense, 'period' | 'date'>): string {
  if (/^\d{4}/.test(e.period)) return e.period.slice(0, 4)
  return e.date ? String(Number(e.date.slice(0, 4)) + 543) : 'ไม่ระบุ'
}

/** เทอมถัดไป: 2569/1 → 2569/2, 2569/2 → 2570/1 */
export function nextPeriod(p: string): string {
  const m = /^(\d{4})\/([12])$/.exec(p)
  if (!m) return /^\d{4}$/.test(p) ? String(Number(p) + 1) : p
  return m[2] === '1' ? `${m[1]}/2` : `${Number(m[1]) + 1}/1`
}

export default function Expenses({ person, data }: { person?: Person; data: Data }) {
  const [form, setForm] = useState<Partial<Expense> | null>(null)
  const rows = data.expenses.filter((e) => !person || e.personId === person.id)
  const years = [...new Set(rows.map(yearOf))].sort().reverse()
  const thisYear = String(new Date().getFullYear() + 543)
  const [year, setYear] = useState(years.includes(thisYear) ? thisYear : years[0] ?? thisYear)
  if (!person) return <p className="mute">เพิ่มโปรไฟล์ก่อน</p>
  if (form) return <div className="card"><ExpenseForm person={person} initial={form} onDone={() => setForm(null)} /></div>

  const inYear = rows.filter((e) => yearOf(e) === year)
  const total = inYear.reduce((s, e) => s + (e.amount ?? 0), 0)
  const byStatus = (st: Expense['status']) => inYear.filter((e) => e.status === st).reduce((s, e) => s + (e.amount ?? 0), 0)
  const byCat = CATEGORIES.map((c) => [c, inYear.filter((e) => (e.category || 'อื่น ๆ') === c).reduce((s, e) => s + (e.amount ?? 0), 0)] as const)
    .filter(([, v]) => v > 0)
  const periods = [...new Set(inYear.map((e) => e.period || 'ไม่ระบุ'))].sort()
  const toClaim = rows.filter((e) => e.claim === 'ยังไม่เบิก' || e.claim === 'ยื่นเบิกแล้ว')

  // ข้อมูลประกอบจากบันทึกสุขภาพ (ไม่นับรวมยอดด้านบน เพื่อไม่ให้ซ้ำกับรายการที่บันทึกเป็นค่าใช้จ่ายแล้ว)
  const ce = Number(year) - 543
  const illCost = data.illnesses.filter((i) => i.personId === person.id && i.startDate.startsWith(String(ce)))
    .reduce((s, i) => s + (i.cost ?? 0), 0)
  const vacCost = data.vaccines.filter((v) => v.personId === person.id && v.date.startsWith(String(ce)))
    .reduce((s, v) => s + (v.price ?? 0), 0)

  async function copyPeriod(p: string) {
    const src = inYear.filter((e) => (e.period || 'ไม่ระบุ') === p)
    const np = nextPeriod(p)
    if (!confirm(`คัดลอก ${src.length} รายการไปเป็น "รอชำระ" ของ ${np}?`)) return
    for (const e of src) {
      await save('expenses', {
        id: newId(), personId: person!.id, category: e.category, item: e.item, amount: e.amount, status: 'pending',
        claim: e.claim ? 'ยังไม่เบิก' : '', period: np, date: e.date ? addMonths(e.date, 6) : '', notes: '',
      })
    }
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <select className="in" style={{ width: 'auto' }} value={year} onChange={(e) => setYear(e.target.value)} aria-label="ปี">
            {(years.length ? years : [thisYear]).map((y) => <option key={y} value={y}>ปี {y}</option>)}
          </select>
          <span className="grow" />
          <button className="btn ghost" onClick={() => setForm({ date: todayIso(), status: 'evidence', category: 'ค่าเรียน', period: year })}>+ เพิ่ม</button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{baht(total)} <small className="mute">บาท</small></div>
        <div className="mute">
          🟢 {baht(byStatus('evidence'))} · 🟡 {baht(byStatus('estimate'))} · ⚪ รอชำระ {baht(byStatus('pending'))}
        </div>
        {byCat.length > 1 && <div className="mute">{byCat.map(([c, v]) => `${c} ${baht(v)}`).join(' · ')}</div>}
        {(illCost > 0 || vacCost > 0) && (
          <p className="mute" style={{ margin: '8px 0 0' }}>
            จากบันทึกสุขภาพปี {year}: ค่ารักษา {baht(illCost)} · วัคซีนเสริม {baht(vacCost)} บาท (ไม่รวมในยอดด้านบน)
          </p>
        )}
      </div>

      {toClaim.length > 0 && (
        <div className="card alert">
          <b>รอเบิกค่ารักษา {toClaim.length} รายการ · {baht(toClaim.reduce((s, e) => s + (e.amount ?? 0), 0))} บาท</b>
          {toClaim.map((e) => <div key={e.id} className="mute" onClick={() => setForm(e)} style={{ cursor: 'pointer' }}>{e.item} · {e.claim}</div>)}
        </div>
      )}

      {periods.map((p) => {
        const items = inYear.filter((e) => (e.period || 'ไม่ระบุ') === p).sort((a, b) => (a.date || '9').localeCompare(b.date || '9'))
        return (
          <div key={p} className="card">
            <div className="row">
              <h3 className="grow" style={{ margin: 0 }}>{/^\d{4}\/\d$/.test(p) ? `เทอม ${p}` : p === 'ไม่ระบุ' ? 'ไม่ระบุช่วง' : `ปี ${p}`}</h3>
              <b>{baht(items.reduce((s, e) => s + (e.amount ?? 0), 0))}</b>
            </div>
            {items.map((e) => (
              <div key={e.id} className="vrow" style={{ cursor: 'pointer' }} onClick={() => setForm(e)}>
                <span title={STATUS[e.status]?.[1]}>{STATUS[e.status]?.[0] ?? '⚪'}</span>
                <span className="grow">{e.item}<br /><small className="mute">{e.date ? thaiDate(e.date) : 'ไม่ระบุวันที่'}{e.claim && ` · ${e.claim}`}</small></span>
                <span>{e.amount != null ? baht(e.amount) : '-'}</span>
                {e.status === 'pending' && (
                  <button className="btn ghost" style={{ padding: '6px 10px' }}
                    onClick={(ev) => { ev.stopPropagation(); void save('expenses', { id: e.id, status: 'evidence', date: todayIso() }) }}>จ่ายแล้ว</button>
                )}
              </div>
            ))}
            {/^\d{4}(\/[12])?$/.test(p) && !rows.some((e) => e.period === nextPeriod(p)) && (
              <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => copyPeriod(p)}>คัดลอกไป{nextPeriod(p).includes('/') ? `เทอม ${nextPeriod(p)}` : `ปี ${nextPeriod(p)}`}</button>
            )}
          </div>
        )
      })}
      <p className="mute">🟢 มีหลักฐาน/จ่ายแล้ว · 🟡 ประมาณการ · ⚪ รอชำระ</p>
    </>
  )
}

function ExpenseForm({ person, initial, onDone }: { person: Person; initial: Partial<Expense>; onDone: () => void }) {
  const [v, setV] = useState<Partial<Expense>>({ item: '', claim: '', notes: '', period: '', ...initial })
  const [repeatTo, setRepeatTo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Expense>(k: K, val: Expense[K]) => setV((o) => ({ ...o, [k]: val }))

  async function submit() {
    setBusy(true)
    let ok = await save('expenses', { ...v, id: v.id ?? newId(), personId: person.id })
    // ทำซ้ำรายเดือน: สร้างรายการ "รอชำระ" เดือนถัดไปจนถึงเดือนที่เลือก
    if (ok && repeatTo && v.date) {
      for (let d = addMonths(v.date, 1); d.slice(0, 7) <= repeatTo; d = addMonths(d, 1)) {
        ok = (await save('expenses', { ...v, id: newId(), personId: person.id, date: d, status: 'pending' })) && ok
      }
    }
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div>
      <h3>{v.id ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าใช้จ่าย'}</h3>
      <label className="f"><span>รายการ</span>
        <input className="in" value={v.item ?? ''} onChange={(e) => set('item', e.target.value)} /></label>
      <div className="grid2">
        <label className="f"><span>จำนวนเงิน (บาท)</span>
          <input className="in" type="number" inputMode="numeric" value={v.amount ?? ''}
            onChange={(e) => set('amount', e.target.value === '' ? null : Number(e.target.value))} /></label>
        <label className="f"><span>วันที่</span>
          <input className="in" type="date" value={v.date ?? ''} onChange={(e) => set('date', e.target.value)} /></label>
      </div>
      <div className="grid2">
        <label className="f"><span>หมวด</span>
          <select className="in" value={v.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f"><span>ช่วง (เช่น 2569/2 หรือ 2569)</span>
          <input className="in" value={v.period ?? ''} onChange={(e) => set('period', e.target.value)} /></label>
      </div>
      <label className="f"><span>สถานะ</span>
        <select className="in" value={v.status} onChange={(e) => set('status', e.target.value as Expense['status'])}>
          {(Object.keys(STATUS) as Expense['status'][]).map((s) => <option key={s} value={s}>{STATUS[s][0]} {STATUS[s][1]}</option>)}
        </select></label>
      {(v.category === 'ค่ารักษา' || v.claim) && (
        <label className="f"><span>การเบิก</span>
          <select className="in" value={v.claim ?? ''} onChange={(e) => set('claim', e.target.value)}>
            {CLAIMS.map((c) => <option key={c} value={c}>{c || '—'}</option>)}</select></label>
      )}
      <label className="f"><span>หมายเหตุ (เลขใบเสร็จ ฯลฯ)</span>
        <input className="in" value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></label>
      {!v.id && (
        <label className="f"><span>ทำซ้ำทุกเดือนถึง (ไม่บังคับ เช่น ค่าเรียนพิเศษ)</span>
          <input className="in" type="month" value={repeatTo} onChange={(e) => setRepeatTo(e.target.value)} /></label>
      )}
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !v.item || v.amount == null} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
      </div>
      {v.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }}
          onClick={async () => { if (confirm('ลบรายการนี้?')) { await remove('expenses', v.id!); onDone() } }}>ลบ</button>
      )}
    </div>
  )
}
