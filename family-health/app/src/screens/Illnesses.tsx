import { useState } from 'react'
import type { Data, Illness, Person } from '../lib/types'
import { searchG6pd, type G6pdItem } from '../data/g6pd'
import { addMonths, daysUntil, thaiDate, todayIso } from '../lib/date'
import { newId, remove, save } from '../lib/store'

const baht = (n: number) => n.toLocaleString('th-TH')

export function medList(text: string): string[] {
  return text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
}

/** ยาแต่ละตัวที่ตรงรายการ G-6-PD (ห้ามใช้/ระวัง) */
export function g6pdHits(text: string): { med: string; item: G6pdItem }[] {
  return medList(text).flatMap((med) => {
    const hit = searchG6pd(med).find((i) => i.level !== 'food')
    return hit ? [{ med, item: hit }] : []
  })
}

/** ช่วงที่ป่วยซ้ำ: ครั้งถัดไปเริ่มภายใน 14 วันหลังครั้งก่อน */
export function repeatEpisodes(list: Illness[]): Illness[][] {
  const sorted = [...list].filter((i) => i.startDate).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const groups: Illness[][] = []
  let cur: Illness[] = []
  for (const i of sorted) {
    const prev = cur[cur.length - 1]
    const prevEnd = prev ? prev.endDate || prev.startDate : ''
    if (prev && daysBetween(prevEnd, i.startDate) <= 14) cur.push(i)
    else {
      if (cur.length > 1) groups.push(cur)
      cur = [i]
    }
  }
  if (cur.length > 1) groups.push(cur)
  return groups
}

/** ปีการศึกษา (พ.ศ.) ของวันที่: เริ่ม พ.ค. ถึง เม.ย. ปีถัดไป */
export function schoolYear(date: string): number {
  const y = Number(date.slice(0, 4)) + 543
  return Number(date.slice(5, 7)) >= 5 ? y : y - 1
}

/** วันลาเรียนรวมต่อปีการศึกษา ใหม่สุดก่อน */
export function leaveByYear(list: Illness[]): { year: number; days: number; times: number }[] {
  const m = new Map<number, { days: number; times: number }>()
  for (const i of list) {
    if (!i.restDays || !i.startDate) continue
    const y = schoolYear(i.startDate)
    const cur = m.get(y) ?? { days: 0, times: 0 }
    m.set(y, { days: cur.days + i.restDays, times: cur.times + 1 })
  }
  return [...m].map(([year, v]) => ({ year, ...v })).sort((a, b) => b.year - a.year)
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86_400_000)
}

export default function Illnesses({ person, data }: { person: Person; data: Data }) {
  const [form, setForm] = useState<Partial<Illness> | null>(null)
  const list = data.illnesses.filter((i) => i.personId === person.id).sort((a, b) => b.startDate.localeCompare(a.startDate))
  if (form) return <div className="card"><IllnessForm person={person} initial={form} onDone={() => setForm(null)} /></div>

  const yearAgo = addMonths(todayIso(), -12)
  const lastYear = list.filter((i) => i.startDate >= yearAgo)
  const cost = lastYear.reduce((s, i) => s + (i.cost ?? 0), 0)
  const groups = repeatEpisodes(list)
  const leave = leaveByYear(list).slice(0, 2)

  return (
    <>
      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>การเจ็บป่วย</h3>
          <button className="btn ghost" onClick={() => setForm({ startDate: todayIso(), admitted: false })}>+ บันทึก</button></div>
        <p className="mute" style={{ margin: '6px 0 0' }}>
          12 เดือนล่าสุด: ป่วย {lastYear.length} ครั้ง
          {lastYear.some((i) => i.admitted) && ` · นอนโรงพยาบาล ${lastYear.filter((i) => i.admitted).length} ครั้ง`}
          {cost > 0 && ` · ค่ารักษา ${baht(cost)} บาท`}
        </p>
        {leave.map((l) => (
          <p key={l.year} className="mute" style={{ margin: '2px 0 0' }}>
            🏫 ปีการศึกษา {l.year}: ลาเรียน {l.days} วัน ({l.times} ครั้ง)
          </p>
        ))}
      </div>

      {groups.slice(-2).reverse().map((g) => (
        <div key={g[0].id} className="card alert">
          <b>⚠️ ป่วยต่อเนื่อง {g.length} ครั้ง ภายใน {daysBetween(g[0].startDate, g[g.length - 1].startDate)} วัน</b>
          <div className="mute">{g.map((i) => i.diagnosis).join(' → ')} ({thaiDate(g[0].startDate)} – {thaiDate(g[g.length - 1].startDate)})</div>
        </div>
      ))}

      <div className="card">
        {list.length === 0 && <p className="mute">ยังไม่มีบันทึก</p>}
        <div className="tl">
          {list.map((i) => {
            const hits = person.g6pd ? g6pdHits(i.medications) : []
            return (
              <div key={i.id} className={`ev ${i.admitted ? 'adm' : ''}`} onClick={() => setForm(i)} style={{ cursor: 'pointer' }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <span className="grow">
                    <b>{i.diagnosis || 'ไม่ระบุ'}</b>
                    {i.admitted && <span className="pill bad" style={{ marginLeft: 6 }}>นอน รพ.</span>}
                    <div className="mute">
                      {thaiDate(i.startDate)}{i.endDate && i.endDate !== i.startDate && ` – ${thaiDate(i.endDate)}`}
                      {i.place && ` · ${i.place}`}{i.restDays ? ` · ลาเรียน ${i.restDays} วัน` : ''}
                    </div>
                    {i.medications && <div className="mute">💊 {medList(i.medications).join(', ')}</div>}
                    {hits.map((h) => (
                      <div key={h.med} className={`pill ${h.item.level === 'avoid' ? 'bad' : 'warn'}`} style={{ marginTop: 4 }}>
                        {h.item.level === 'avoid' ? '🔴 ห้ามใช้' : '🟡 ระวัง'}: {h.med}
                      </div>
                    ))}
                  </span>
                  {i.cost != null && <span className="mute">{baht(i.cost)} ฿</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function IllnessForm({ person, initial, onDone }: { person: Person; initial: Partial<Illness>; onDone: () => void }) {
  const [v, setV] = useState<Partial<Illness>>({
    endDate: '', place: '', doctor: '', diagnosis: '', medications: '', advice: '', notes: '', ...initial,
  })
  const [followUp, setFollowUp] = useState('')
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Illness>(k: K, val: Illness[K]) => setV((o) => ({ ...o, [k]: val }))
  const text = (k: keyof Illness, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="f"><span>{label}</span>
      <input className="in" value={(v[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} {...props} /></label>
  )
  const hits = g6pdHits(v.medications ?? '')

  async function submit() {
    const avoid = hits.filter((h) => h.item.level === 'avoid')
    if (person.g6pd && avoid.length && !confirm(`ยา ${avoid.map((h) => h.med).join(', ')} อยู่ในรายการห้ามใช้สำหรับ G-6-PD\nแจ้งแพทย์/เภสัชกรก่อนใช้ — บันทึกต่อหรือไม่?`)) return
    setBusy(true)
    const ok = await save('illnesses', { ...v, id: v.id ?? newId(), personId: person.id })
    if (ok && followUp) {
      await save('appointments', {
        id: newId(), personId: person.id, type: 'doctor', status: 'pending', time: '', notes: '',
        title: `ติดตามอาการ${v.diagnosis ? ` ${v.diagnosis}` : ''}`, date: followUp, place: v.place ?? '',
      })
    }
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div>
      <h3>{v.id ? 'แก้ไขการเจ็บป่วย' : 'บันทึกการเจ็บป่วย'}</h3>
      {text('diagnosis', 'การวินิจฉัย / อาการ', { placeholder: 'เช่น ไข้หวัด, ทอนซิลอักเสบ' })}
      <div className="grid2">
        {text('startDate', 'วันที่เริ่ม', { type: 'date' })}
        {text('endDate', 'ถึงวันที่', { type: 'date' })}
      </div>
      {text('place', 'สถานพยาบาล')}
      {text('doctor', 'แพทย์')}
      <label className="check">
        <input type="checkbox" checked={!!v.admitted} onChange={(e) => set('admitted', e.target.checked)} />นอนโรงพยาบาล
      </label>
      <label className="f"><span>ยาที่ได้รับ (บรรทัดละ 1 ตัว หรือคั่นด้วย ,)</span>
        <textarea className="in" rows={3} value={v.medications ?? ''} onChange={(e) => set('medications', e.target.value)}
          placeholder="ดูชื่อยาจากฉลากหรือซองยา เช่น amoxicillin" /></label>
      {person.g6pd && hits.map((h) => (
        <div key={h.med} className={`result ${h.item.level === 'avoid' ? 'bad' : 'warn'}`} style={{ margin: '-6px 0 10px' }}>
          <b>{h.item.level === 'avoid' ? '🔴 ห้ามใช้' : '🟡 ใช้ด้วยความระมัดระวัง'}: {h.med}</b> <span className="mute">({h.item.group})</span>
        </div>
      ))}
      {person.g6pd && medList(v.medications ?? '').length > 0 && hits.length === 0 && (
        <p className="mute" style={{ marginTop: -6 }}>ไม่พบในรายการ G-6-PD (ไม่ได้แปลว่าปลอดภัย ควรแจ้งแพทย์ทุกครั้ง)</p>
      )}
      <div className="grid2">
        <label className="f"><span>ลาเรียน (วัน)</span>
          <input className="in" type="number" inputMode="numeric" value={v.restDays ?? ''}
            onChange={(e) => set('restDays', e.target.value === '' ? null : Number(e.target.value))} /></label>
        <label className="f"><span>ค่ารักษา (บาท)</span>
          <input className="in" type="number" inputMode="numeric" value={v.cost ?? ''}
            onChange={(e) => set('cost', e.target.value === '' ? null : Number(e.target.value))} /></label>
      </div>
      {text('advice', 'คำแนะนำจากแพทย์')}
      {text('notes', 'หมายเหตุ')}
      {!v.id && (
        <label className="f"><span>นัดติดตามอาการ (ไม่บังคับ)</span>
          <input className="in" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></label>
      )}
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !v.startDate} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
      </div>
      {v.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }}
          onClick={async () => { if (confirm('ลบบันทึกนี้?')) { await remove('illnesses', v.id!); onDone() } }}>ลบ</button>
      )}
    </div>
  )
}

/** การ์ดเตือนสำหรับหน้าแรก: ป่วยซ้ำในช่วง 30 วันล่าสุด */
export function recentRepeat(list: Illness[]): Illness[] | null {
  const g = repeatEpisodes(list).pop()
  if (!g) return null
  const last = g[g.length - 1]
  return daysUntil(last.startDate) >= -30 ? g : null
}
