import { useState } from 'react'
import type { Data, Person } from '../lib/types'
import type { Tab } from '../App'
import { ageText, thaiDate } from '../lib/date'
import { AppointmentForm, AppointmentList, overdue, upcoming } from './Appointments'
import { epiFor, epiStatus } from './Vaccines'
import { recentRepeat } from './Illnesses'

interface Props { person?: Person; data: Data; go: (t: Tab, sub?: string) => void; openSos: () => void }

export default function Home({ person, data, go, openSos }: Props) {
  const [addAppt, setAddAppt] = useState(false)
  if (!person) {
    return (
      <div className="card">
        <h3>เริ่มต้นใช้งาน</h3>
        <p className="mute">ใส่ข้อมูลลูกก่อน เพื่อเริ่มบันทึกข้อมูลสุขภาพ</p>
        <button className="btn" onClick={() => go('more')}>ใส่ข้อมูลลูก</button>
      </div>
    )
  }
  if (addAppt) return <div className="card"><AppointmentForm initial={{ personId: person.id }} onDone={() => setAddAppt(false)} /></div>

  const recs = data.vaccines.filter((v) => v.personId === person.id)
  const missing = epiFor(person).filter((e) => epiStatus(person, recs, e).kind === 'missing')
  const late = overdue(data, person.id)
  const latest = data.measurements.filter((m) => m.personId === person.id && m.weightKg).sort((a, b) => b.date.localeCompare(a.date))[0]
  const repeat = recentRepeat(data.illnesses.filter((i) => i.personId === person.id))

  return (
    <>
      {person.g6pd && (
        <div className="card alert red" onClick={openSos} style={{ cursor: 'pointer' }}>
          <b>⚠️ มีภาวะพร่องเอนไซม์ G-6-PD</b>
          <div className="mute">ก่อนใช้ยาทุกครั้ง ตรวจชื่อยาหรือแจ้งแพทย์/เภสัชกร · แตะเพื่อเปิดบัตรฉุกเฉิน</div>
        </div>
      )}

      <div className="card">
        <div className="row"><h3 className="grow" style={{ margin: 0 }}>นัดถัดไป</h3>
          <button className="btn ghost" onClick={() => setAddAppt(true)}>+ นัด</button></div>
        <div style={{ marginTop: 10 }}>
          <AppointmentList items={[...late, ...upcoming(data, person.id)].slice(0, 5)} people={data.people} />
        </div>
      </div>

      {repeat && (
        <div className="card alert" onClick={() => go('health', 'ill')} style={{ cursor: 'pointer' }}>
          <b>⚠️ ป่วยซ้ำ {repeat.length} ครั้งในช่วงสั้น ๆ</b>
          <div className="mute">{repeat.map((i) => i.diagnosis).join(' → ')} · ควรติดตามอาการใกล้ชิดหรือปรึกษาแพทย์</div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="card alert" onClick={() => go('health', 'vax')} style={{ cursor: 'pointer' }}>
          <b>💉 วัคซีนตามแผนงานที่ยังไม่มีบันทึก {missing.length} รายการ</b>
          <div className="mute">{missing.slice(0, 3).map((e) => e.name).join(' · ')}{missing.length > 3 && ' …'}</div>
        </div>
      )}

      <div className="card">
        <h3>{person.fullName || person.nickname}</h3>
        <div className="mute">
          {ageText(person.birthDate) || 'ยังไม่ได้ใส่วันเกิด'}
          {person.bloodGroup && ` · กรุ๊ปเลือด ${person.bloodGroup}`}
          {person.hn && ` · HN ${person.hn}`}
        </div>
        {latest && (
          <div className="mute" style={{ marginTop: 6 }}>
            วัดล่าสุด {thaiDate(latest.date)}: {latest.weightKg} กก.{latest.heightCm && ` · ${latest.heightCm} ซม.`}
          </div>
        )}
      </div>

      <div className="quick">
        <button onClick={() => go('health', 'vax')}><span>💉</span>วัคซีน</button>
        {person.g6pd && <button onClick={() => go('health', 'g6pd')}><span>💊</span>ตรวจชื่อยา</button>}
        <button onClick={() => go('health', 'growth')}><span>⚖️</span>น้ำหนัก</button>
        <button onClick={() => go('health', 'ill')}><span>🤒</span>เจ็บป่วย</button>
        <button onClick={() => go('health', 'meds')}><span>🧴</span>ตู้ยา</button>
      </div>

      {!person.phone && (
        <div className="card alert" onClick={() => go('more')} style={{ cursor: 'pointer' }}>
          <b>ยังไม่มีเบอร์โทรพ่อแม่</b>
          <div className="mute">เบอร์โทรจะแสดงในบัตรฉุกเฉิน · เพิ่มได้ที่เมนู เพิ่มเติม</div>
        </div>
      )}
    </>
  )
}
