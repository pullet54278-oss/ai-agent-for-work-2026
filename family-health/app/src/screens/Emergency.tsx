import type { Person } from '../lib/types'
import { G6PD_ITEMS } from '../data/g6pd'
import { ageText, formatPhone } from '../lib/date'
import { relationLabel } from '../lib/types'

export default function Emergency({ person, people, onClose }: { person: Person; people: Person[]; onClose: () => void }) {
  const names = (level: string) => G6PD_ITEMS.filter((i) => i.level === level).map((i) => i.name).join(' · ')
  const contacts = people.filter((p) => p.id !== person.id && p.phone && p.relation !== 'child')
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <button className="close" onClick={onClose} aria-label="ปิด">×</button>
        <div className="emg">
          {person.g6pd && <h2>⚠️ ภาวะพร่องเอนไซม์ G-6-PD</h2>}
          <p style={{ margin: '6px 0 10px' }}>
            <b>{person.fullName || person.nickname}</b>{person.nickname && person.fullName && ` (${person.nickname})`}
            <br />
            <span className="mute">
              {ageText(person.birthDate)}
              {person.bloodGroup && ` · กรุ๊ปเลือด ${person.bloodGroup}`}
              {person.hn && ` · HN ${person.hn}${person.hospital ? ` (${person.hospital})` : ''}`}
            </span>
          </p>
          {person.allergies && <p><b>แพ้ยา/อาหาร:</b> {person.allergies}</p>}
          {person.g6pd && (
            <>
              <b style={{ color: 'var(--bad)' }}>🔴 ยาที่ห้ามใช้</b>
              <p className="mute" style={{ margin: '2px 0 8px' }}>{names('avoid')}</p>
              <b style={{ color: 'var(--warn)' }}>🟡 ใช้ด้วยความระมัดระวัง</b>
              <p className="mute" style={{ margin: '2px 0 8px' }}>{names('caution')}</p>
              <b>🚫 อาหาร/สารเคมี</b>
              <p className="mute" style={{ margin: '2px 0 8px' }}>{names('food')}</p>
              <div className="card alert red" style={{ margin: '10px 0 0' }}>
                ถ้าปัสสาวะสีดำ/สีโค้ก ตัวเหลือง ซีด เหนื่อยง่าย → ไปโรงพยาบาลทันที
              </div>
            </>
          )}
          {contacts.map((p) => (
            <p key={p.id} style={{ margin: '10px 0 0' }}>
              📞 {relationLabel[p.relation]} {p.nickname || p.fullName} <a href={`tel:${p.phone}`}>{formatPhone(p.phone)}</a>
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
