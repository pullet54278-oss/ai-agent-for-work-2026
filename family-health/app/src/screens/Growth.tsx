import { useState } from 'react'
import type { Data, Measurement, Person } from '../lib/types'
import { BANDS, assess, exactAgeMonths, lmsFor, valueAtZ, type Band, type Indicator } from '../lib/growth'
import { WFH_START, WFL_START } from '../data/who-lms'
import { thaiDate, todayIso } from '../lib/date'
import { newId, remove, save } from '../lib/store'

const TONE_FILL: Record<Band['tone'], string> = { bad: '#fde3e3', warn: '#fff1cc', ok: '#ddf3e6', high: '#ece3fb' }
const PILL: Record<Band['tone'], string> = { bad: 'bad', warn: 'warn', ok: 'ok', high: 'info' }
const TITLES: Record<Indicator, string> = { wfa: 'น้ำหนักตามอายุ', hfa: 'ส่วนสูงตามอายุ', wfh: 'น้ำหนักตามส่วนสูง' }

interface Point { m: Measurement; x: number; y: number; age: number }

export default function Growth({ person, data }: { person: Person; data: Data }) {
  const [ind, setInd] = useState<Indicator>('wfa')
  const [form, setForm] = useState<Partial<Measurement> | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const sex = person.sex === 'male' ? 1 : person.sex === 'female' ? 2 : null
  const rows = data.measurements.filter((m) => m.personId === person.id).sort((a, b) => a.date.localeCompare(b.date))
  const latest = [...rows].reverse().find((m) => m.weightKg != null || m.heightCm != null)
  const latestAge = latest && person.birthDate ? exactAgeMonths(person.birthDate, latest.date) : 0
  const [wfhRange, setWfhRange] = useState<'L' | 'H'>(latestAge >= 24 ? 'H' : 'L')

  if (form) return <div className="card"><MeasurementForm person={person} initial={form} onDone={() => setForm(null)} /></div>
  if (!person.birthDate || !sex) {
    return (
      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>การเจริญเติบโต</h3>
          <button className="btn ghost" onClick={() => setForm({ date: todayIso() })}>+ บันทึกการวัด</button></div>
        <div className="card alert" style={{ margin: '10px 0' }}>ใส่วันเกิดและเพศในโปรไฟล์ (เมนู เพิ่มเติม) เพื่อแปลผลตามเกณฑ์ WHO</div>
        {[...rows].reverse().map((m) => (
          <div key={m.id} className="vrow" style={{ cursor: 'pointer' }} onClick={() => setForm(m)}>
            <span className="age">{thaiDate(m.date)}</span>
            <span className="grow">{[m.weightKg != null && `${m.weightKg} กก.`, m.heightCm != null && `${m.heightCm} ซม.`].filter(Boolean).join(' · ')}</span>
          </div>
        ))}
      </div>
    )
  }

  const results = latest ? assess(sex, latestAge, latest.weightKg, latest.heightCm) : []

  return (
    <>
      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>การเจริญเติบโต</h3>
          <button className="btn ghost" onClick={() => setForm({ date: todayIso() })}>+ บันทึกการวัด</button></div>
        {latest ? (
          <>
            <p className="mute" style={{ margin: '6px 0' }}>
              วัดล่าสุด {thaiDate(latest.date)}{latest.weightKg != null && ` · ${latest.weightKg} กก.`}
              {latest.heightCm != null && ` · ${latest.heightCm} ซม.`}
            </p>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {results.map((r) => <span key={r.indicator} className={`pill ${PILL[r.band.tone]}`}>{r.band.label}</span>)}
              {results.length === 0 && <span className="mute">เกินช่วงข้อมูล WHO (0–5 ปี)</span>}
            </div>
          </>
        ) : <p className="mute">ยังไม่มีข้อมูลการวัด</p>}
      </div>

      <div className="tabs">
        {(Object.keys(TITLES) as Indicator[]).map((k) => (
          <button key={k} className={k === ind ? 'on' : ''} onClick={() => setInd(k)}>{TITLES[k]}</button>
        ))}
      </div>

      <div className="card">
        {ind === 'wfh' && (
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="mute grow">{wfhRange === 'L' ? 'อายุต่ำกว่า 2 ปี (ความยาว นอนวัด)' : 'อายุ 2–5 ปี (ส่วนสูง ยืนวัด)'}</span>
            <button className="btn ghost" onClick={() => setWfhRange(wfhRange === 'L' ? 'H' : 'L')}>
              {wfhRange === 'L' ? 'ดู 2–5 ปี' : 'ดู 0–2 ปี'}
            </button>
          </div>
        )}
        <Chart ind={ind} sex={sex} birth={person.birthDate} rows={rows} wfhRange={wfhRange} sel={sel} onSel={setSel} />
        <p className="mute" style={{ marginBottom: 0 }}>
          เส้นประ = ค่ากลาง · เกณฑ์ตามมาตรฐาน WHO และกราฟในสมุดบันทึกสุขภาพแม่และเด็ก · แตะจุดเพื่อดูรายละเอียด
        </p>
      </div>

      <div className="card">
        <h3>ผลการวัดทั้งหมด</h3>
        {rows.length === 0 && <p className="mute">ยังไม่มีข้อมูล</p>}
        {[...rows].reverse().map((m) => {
          const age = exactAgeMonths(person.birthDate, m.date)
          const a = assess(sex, age, m.weightKg, m.heightCm)
          return (
            <div key={m.id} className="vrow" style={{ cursor: 'pointer', background: sel === m.id ? 'var(--pri-soft)' : undefined }}
              onClick={() => setForm(m)}>
              <span className="age">{thaiDate(m.date)}<br />{ageLabel(age)}</span>
              <span className="grow">
                {[m.weightKg != null && `${m.weightKg} กก.`, m.heightCm != null && `${m.heightCm} ซม.`, m.headCm != null && `ศีรษะ ${m.headCm}`]
                  .filter(Boolean).join(' · ')}
                {m.notes && <><br /><small className="mute">{m.notes}</small></>}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                {a.map((r) => <span key={r.indicator} className={`pill ${PILL[r.band.tone]}`} style={{ fontSize: 11 }}>{r.band.label}</span>)}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function ageLabel(months: number): string {
  const m = Math.floor(months + 1e-6)
  return m < 24 ? `${m} ด.` : `${Math.floor(m / 12)} ป. ${m % 12} ด.`
}

function Chart({ ind, sex, birth, rows, wfhRange, sel, onSel }: {
  ind: Indicator; sex: 1 | 2; birth: string; rows: Measurement[]; wfhRange: 'L' | 'H'; sel: string | null; onSel: (id: string) => void
}) {
  const W = 360, H = 250, L = 34, R = 74, T = 10, B = 28
  // แกน x: อายุ (เดือน) หรือ ความยาว/ส่วนสูง (ซม.)
  const [x0, x1] = ind === 'wfh' ? (wfhRange === 'L' ? [WFL_START, 110] : [WFH_START, 120]) : [0, 60]
  const lmsAt = (x: number) => (ind === 'wfh' ? lmsFor('wfh', sex, wfhRange === 'L' ? 0 : 24, x) : lmsFor(ind, sex, x))
  const xs = Array.from({ length: 61 }, (_, i) => x0 + ((x1 - x0) * i) / 60)

  const points: Point[] = rows.flatMap((m) => {
    const age = exactAgeMonths(birth, m.date)
    const y = ind === 'hfa' ? m.heightCm : m.weightKg
    if (y == null) return []
    if (ind === 'wfh') {
      if (m.heightCm == null || (wfhRange === 'L') !== (age < 24)) return []
      return [{ m, x: m.heightCm, y, age }]
    }
    return age <= 60 ? [{ m, x: age, y, age }] : []
  }).filter((p) => p.x >= x0 && p.x <= x1)

  const lo = Math.min(...xs.map((x) => valueAtZ(lmsAt(x)!, -3)), ...points.map((p) => p.y))
  const hi = Math.max(...xs.map((x) => valueAtZ(lmsAt(x)!, 3)), ...points.map((p) => p.y))
  const y0 = Math.floor(lo), y1 = Math.ceil(hi)
  const sx = (x: number) => L + ((x - x0) / (x1 - x0)) * (W - L - R)
  const sy = (y: number) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B)
  const curve = (z: number) => xs.map((x) => [sx(x), sy(Math.min(y1, Math.max(y0, valueAtZ(lmsAt(x)!, z))))] as const)

  const bands = BANDS[ind]
  const edges = [-99, ...bands.slice(1).map((b) => b.min), 99] // z ของขอบแต่ละแถบ
  const clampZ = (z: number) => (z === -99 ? -6 : z === 99 ? 6 : z)
  const polys = bands.map((b, i) => {
    const lower = curve(clampZ(edges[i])), upper = curve(clampZ(edges[i + 1]))
    const pts = [...upper, ...lower.reverse()].map(([a, c]) => `${a.toFixed(1)},${c.toFixed(1)}`).join(' ')
    // ป้ายชื่อแถบที่ขอบขวา (ถ้าแถบสูงพอ)
    const yTop = upper[upper.length - 1][1], yBot = curve(clampZ(edges[i]))[60][1]
    return { b, pts, labelY: (yTop + yBot) / 2, show: yBot - yTop >= 11 }
  })

  const step = (y1 - y0) > 40 ? 10 : (y1 - y0) > 16 ? 5 : 2
  const yTicks: number[] = []
  for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) yTicks.push(v)
  const xTicks = ind === 'wfh'
    ? Array.from({ length: 13 }, (_, i) => Math.ceil(x0 / 10) * 10 + i * 10).filter((v) => v <= x1)
    : [0, 12, 24, 36, 48, 60]
  const selP = points.find((p) => p.m.id === sel)

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`กราฟ${TITLES[ind]} ${points.length} จุด`}>
        <defs><clipPath id="plot"><rect x={L} y={T} width={W - L - R} height={H - T - B} /></clipPath></defs>
        <g clipPath="url(#plot)">
          {polys.map(({ b, pts }) => <polygon key={b.label} points={pts} fill={TONE_FILL[b.tone]} />)}
          {edges.slice(1, -1).map((z) => (
            <polyline key={z} points={curve(z).map((p) => p.join(',')).join(' ')} fill="none" stroke="#1d243322" strokeWidth={1} />
          ))}
          <polyline points={curve(0).map((p) => p.join(',')).join(' ')} fill="none" stroke="#1f9d55" strokeWidth={1.2} strokeDasharray="4 3" />
        </g>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke="#1d243310" />
            <text x={L - 5} y={sy(v) + 3.5} fontSize={10} textAnchor="end" fill="#6b7385">{v}</text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={v} x={sx(v)} y={H - 10} fontSize={10} textAnchor="middle" fill="#6b7385">
            {ind === 'wfh' ? v : `${v / 12} ปี`}
          </text>
        ))}
        <text x={W - R} y={H - 10} fontSize={10} textAnchor="end" fill="#6b7385" dx={R - 2}>{ind === 'wfh' ? 'ซม.' : ''}</text>
        <text x={4} y={T + 8} fontSize={10} fill="#6b7385">{ind === 'hfa' ? 'ซม.' : 'กก.'}</text>
        {polys.filter((p) => p.show).map(({ b, labelY }) => (
          <text key={b.label} x={W - R + 4} y={labelY + 3.5} fontSize={10} fill="#4a5163">{b.label.replace('น้ำหนัก', '') || b.label}</text>
        ))}
        {points.length > 1 && (
          <polyline points={points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke="#2f6fed" strokeWidth={2} />
        )}
        {points.map((p) => (
          <g key={p.m.id} onClick={() => onSel(p.m.id)} style={{ cursor: 'pointer' }}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={12} fill="transparent" />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={p.m.id === sel ? 6 : 4.5} fill="#2f6fed" stroke="#fff" strokeWidth={2} />
          </g>
        ))}
      </svg>
      {selP && (() => {
        const a = assess(sex, selP.age, selP.m.weightKg, selP.m.heightCm).find((r) => r.indicator === ind)
        return (
          <div className="row" style={{ background: 'var(--pri-soft)', borderRadius: 10, padding: '8px 10px' }}>
            <span className="grow">
              <b>{thaiDate(selP.m.date)}</b> · อายุ {ageLabel(selP.age)}<br />
              <span className="mute">{selP.m.weightKg != null && `${selP.m.weightKg} กก.`} {selP.m.heightCm != null && `${selP.m.heightCm} ซม.`}
                {a && ` · z = ${a.z >= 0 ? '+' : ''}${a.z.toFixed(2)}`}</span>
            </span>
            {a && <span className={`pill ${PILL[a.band.tone]}`}>{a.band.label}</span>}
          </div>
        )
      })()}
      {points.length === 0 && <p className="mute">ไม่มีข้อมูลในช่วงนี้</p>}
    </>
  )
}

function MeasurementForm({ person, initial, onDone }: { person: Person; initial: Partial<Measurement>; onDone: () => void }) {
  const [m, setM] = useState<Partial<Measurement>>({ source: 'บ้าน', notes: '', ...initial })
  const [busy, setBusy] = useState(false)
  const num = (k: 'weightKg' | 'heightCm' | 'headCm', label: string) => (
    <label className="f"><span>{label}</span>
      <input className="in" type="number" inputMode="decimal" step="0.1" value={m[k] ?? ''}
        onChange={(e) => setM((o) => ({ ...o, [k]: e.target.value === '' ? null : Number(e.target.value) }))} /></label>
  )
  async function submit() {
    setBusy(true)
    const ok = await save('measurements', { ...m, id: m.id ?? newId(), personId: person.id })
    setBusy(false)
    if (ok) onDone()
  }
  return (
    <div>
      <h3>{m.id ? 'แก้ไขผลการวัด' : 'บันทึกการวัด'}</h3>
      <label className="f"><span>วันที่วัด</span>
        <input className="in" type="date" value={m.date ?? ''} onChange={(e) => setM((o) => ({ ...o, date: e.target.value }))} /></label>
      <div className="grid2">{num('weightKg', 'น้ำหนัก (กก.)')}{num('heightCm', 'ส่วนสูง (ซม.)')}</div>
      {num('headCm', 'รอบศีรษะ (ซม.) ไม่บังคับ')}
      <label className="f"><span>วัดที่</span>
        <input className="in" value={m.source ?? ''} onChange={(e) => setM((o) => ({ ...o, source: e.target.value }))} /></label>
      <label className="f"><span>หมายเหตุ</span>
        <input className="in" value={m.notes ?? ''} onChange={(e) => setM((o) => ({ ...o, notes: e.target.value }))} /></label>
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !m.date || (m.weightKg == null && m.heightCm == null)} onClick={submit}>บันทึก</button>
      </div>
      {m.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }}
          onClick={async () => { if (confirm('ลบผลการวัดนี้?')) { await remove('measurements', m.id!); onDone() } }}>ลบ</button>
      )}
    </div>
  )
}
