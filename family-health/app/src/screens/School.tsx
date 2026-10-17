import { useState } from 'react'
import type { Data, Person, SchoolResult } from '../lib/types'
import { newId, remove, save } from '../lib/store'

export default function School({ person, data }: { person?: Person; data: Data }) {
  const [form, setForm] = useState<Partial<SchoolResult> | null>(null)
  if (!person) return <p className="mute">เพิ่มโปรไฟล์ก่อน</p>
  const rows = data.school.filter((r) => r.personId === person.id)
  if (form) return <div className="card"><ResultForm person={person} rows={rows} initial={form} onDone={() => setForm(null)} /></div>

  const years = [...new Set(rows.map((r) => r.academicYear))].sort().reverse()
  return (
    <>
      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>ผลการเรียน</h3>
          <button className="btn ghost" onClick={() => setForm({ academicYear: years[0] ?? '', term: '1', maxScore: 100 })}>+ เพิ่มผล</button></div>
        {rows.length === 0 && <p className="mute">ยังไม่มีผลการเรียน</p>}
      </div>
      {years.map((y) => {
        const programs = [...new Set(rows.filter((r) => r.academicYear === y).map((r) => r.program))]
        return programs.map((prog) => {
          const pr = rows.filter((r) => r.academicYear === y && r.program === prog)
          const terms = [...new Set(pr.map((r) => r.term))].sort()
          const subjects = [...new Set(pr.map((r) => r.subject))]
          const comments = [...new Set(pr.map((r) => r.comment).filter(Boolean))]
          return (
            <div key={y + prog} className="card">
              <h3 style={{ marginBottom: 2 }}>{prog}</h3>
              <div className="mute">ปีการศึกษา {y}</div>
              <table className="tbl">
                <thead><tr><th>วิชา</th>{terms.map((t) => <th key={t} className="num">เทอม {t}</th>)}{terms.length > 1 && <th />}</tr></thead>
                <tbody>
                  {subjects.map((s) => {
                    const cells = terms.map((t) => pr.find((r) => r.subject === s && r.term === t))
                    const scores = cells.map((c) => (c?.score != null && c.maxScore ? (c.score / c.maxScore) * 100 : null))
                    const [a, b] = [scores[scores.length - 2], scores[scores.length - 1]]
                    return (
                      <tr key={s}>
                        <td>{s}</td>
                        {cells.map((c, i) => (
                          <td key={i} className="num" onClick={() => c && setForm(c)} style={{ cursor: c ? 'pointer' : undefined }}>
                            {c ? <>{c.score ?? '-'}{c.maxScore && c.maxScore !== 100 ? `/${c.maxScore}` : ''}{c.grade && c.grade !== 'Pass' && <small className="mute"> {c.grade}</small>}</> : '-'}
                          </td>
                        ))}
                        {terms.length > 1 && (
                          <td className="num">
                            {a != null && b != null && (b > a ? <span className="pill ok">▲ {Math.round(b - a)}</span>
                              : b < a ? <span className="pill warn">▼ {Math.round(a - b)}</span> : <span className="mute">=</span>)}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {comments.map((c) => <p key={c} className="mute" style={{ margin: '8px 0 0' }}>💬 {c}</p>)}
            </div>
          )
        })
      })}
    </>
  )
}

function ResultForm({ person, rows, initial, onDone }: { person: Person; rows: SchoolResult[]; initial: Partial<SchoolResult>; onDone: () => void }) {
  const [v, setV] = useState<Partial<SchoolResult>>({ program: '', subject: '', grade: '', comment: '', ...initial })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof SchoolResult>(k: K, val: SchoolResult[K]) => setV((o) => ({ ...o, [k]: val }))
  const num = (k: 'score' | 'maxScore', label: string) => (
    <label className="f"><span>{label}</span>
      <input className="in" type="number" inputMode="decimal" value={v[k] ?? ''}
        onChange={(e) => set(k, e.target.value === '' ? null : Number(e.target.value))} /></label>
  )
  async function submit() {
    setBusy(true)
    const ok = await save('school', { ...v, id: v.id ?? newId(), personId: person.id })
    setBusy(false)
    if (ok) onDone()
  }
  return (
    <div>
      <h3>{v.id ? 'แก้ไขผลการเรียน' : 'เพิ่มผลการเรียน'}</h3>
      <div className="grid2">
        <label className="f"><span>ปีการศึกษา (พ.ศ.)</span>
          <input className="in" inputMode="numeric" value={v.academicYear ?? ''} onChange={(e) => set('academicYear', e.target.value)} /></label>
        <label className="f"><span>เทอม</span>
          <select className="in" value={v.term} onChange={(e) => set('term', e.target.value)}>
            <option value="1">1</option><option value="2">2</option><option value="ทั้งปี">ทั้งปี</option></select></label>
      </div>
      <label className="f"><span>โปรแกรม / ชั้น</span>
        <input className="in" list="programs" value={v.program ?? ''} onChange={(e) => set('program', e.target.value)} placeholder="เช่น EIS (อนุบาล 2/1)" />
        <datalist id="programs">{[...new Set(rows.map((r) => r.program))].map((p) => <option key={p} value={p} />)}</datalist></label>
      <label className="f"><span>วิชา / ทักษะ</span>
        <input className="in" list="subjects" value={v.subject ?? ''} onChange={(e) => set('subject', e.target.value)} />
        <datalist id="subjects">{[...new Set(rows.map((r) => r.subject))].map((p) => <option key={p} value={p} />)}</datalist></label>
      <div className="grid2">{num('score', 'คะแนนที่ได้')}{num('maxScore', 'คะแนนเต็ม')}</div>
      <label className="f"><span>เกรด</span>
        <input className="in" value={v.grade ?? ''} onChange={(e) => set('grade', e.target.value)} /></label>
      <label className="f"><span>ความเห็นครู</span>
        <input className="in" value={v.comment ?? ''} onChange={(e) => set('comment', e.target.value)} /></label>
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>ยกเลิก</button>
        <button className="btn grow" disabled={busy || !v.academicYear || !v.subject} onClick={submit}>บันทึก</button>
      </div>
      {v.id && (
        <button className="btn ghost block" style={{ marginTop: 10, color: 'var(--bad)' }}
          onClick={async () => { if (confirm('ลบผลนี้?')) { await remove('school', v.id!); onDone() } }}>ลบ</button>
      )}
    </div>
  )
}
