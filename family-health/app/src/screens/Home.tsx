import type { Person } from '../lib/types'
import type { Tab } from '../App'
import { ageText } from '../lib/date'

interface Props { person?: Person; people: Person[]; go: (t: Tab, sub?: string) => void; openSos: () => void }

export default function Home({ person, people, go, openSos }: Props) {
  if (!person) {
    return (
      <div className="card">
        <h3>เริ่มต้นใช้งาน</h3>
        <p className="mute">เพิ่มโปรไฟล์ลูกและพ่อแม่ก่อน เพื่อเริ่มบันทึกข้อมูลสุขภาพ</p>
        <button className="btn" onClick={() => go('more')}>เพิ่มโปรไฟล์</button>
      </div>
    )
  }
  const parentsMissingPhone = people.filter((p) => (p.relation === 'father' || p.relation === 'mother') && !p.phone)
  return (
    <>
      {person.g6pd && (
        <div className="card alert red" onClick={openSos} style={{ cursor: 'pointer' }}>
          <b>⚠️ มีภาวะพร่องเอนไซม์ G-6-PD</b>
          <div className="mute">ก่อนใช้ยาทุกครั้ง ตรวจชื่อยาหรือแจ้งแพทย์/เภสัชกร · แตะเพื่อเปิดบัตรฉุกเฉิน</div>
        </div>
      )}
      <div className="card">
        <h3>{person.fullName || person.nickname}</h3>
        <div className="mute">
          {ageText(person.birthDate) || 'ยังไม่ได้ใส่วันเกิด'}
          {person.bloodGroup && ` · กรุ๊ปเลือด ${person.bloodGroup}`}
          {person.hn && ` · HN ${person.hn}`}
        </div>
      </div>
      <div className="quick">
        {person.g6pd && <button onClick={() => go('health', 'g6pd')}><span>💊</span>ตรวจชื่อยา</button>}
        <button onClick={() => go('health', 'vax')}><span>💉</span>วัคซีน</button>
        <button onClick={() => go('health', 'growth')}><span>⚖️</span>น้ำหนัก</button>
        <button onClick={() => go('health', 'ill')}><span>🤒</span>บันทึกป่วย</button>
      </div>
      {parentsMissingPhone.length > 0 && (
        <div className="card alert">
          <b>ยังไม่มีเบอร์โทรของ{parentsMissingPhone.map((p) => p.nickname || p.fullName).join(', ')}</b>
          <div className="mute">เบอร์โทรจะแสดงในบัตรฉุกเฉิน · เพิ่มได้ที่เมนู เพิ่มเติม</div>
        </div>
      )}
      <div className="card">
        <h3>นัดถัดไป</h3>
        <p className="mute">ตารางนัดวัคซีน นัดหมอ และค่าเทอม พร้อมแจ้งเตือน จะมาในระยะที่ 2</p>
      </div>
    </>
  )
}
