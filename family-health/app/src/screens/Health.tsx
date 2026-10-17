import { useState } from 'react'
import type { Data, Person } from '../lib/types'
import { G6PD_RULES, searchG6pd, type G6pdItem } from '../data/g6pd'
import Soon from './Soon'
import Vaccines from './Vaccines'

const SUBS: [string, string][] = [
  ['vax', 'วัคซีน'], ['g6pd', 'G-6-PD'], ['growth', 'การเจริญเติบโต'], ['ill', 'การเจ็บป่วย'], ['dspm', 'พัฒนาการ'],
]

interface Props { person?: Person; data: Data; sub: string; setSub: (s: string) => void }

export default function Health({ person, data, sub, setSub }: Props) {
  return (
    <>
      <div className="tabs">
        {SUBS.map(([k, l]) => (
          <button key={k} className={k === sub ? 'on' : ''} onClick={() => setSub(k)}>{l}</button>
        ))}
      </div>
      {sub === 'g6pd' && <G6pdChecker person={person} />}
      {sub === 'vax' && (person ? <Vaccines person={person} data={data} /> : <p className="mute">เพิ่มโปรไฟล์ก่อน</p>)}
      {sub === 'growth' && <Soon title="การเจริญเติบโต" phase={3} items={['กราฟน้ำหนัก/ส่วนสูง/รูปร่าง ตามเกณฑ์ WHO และกรมอนามัย', 'แปลผล 5–6 ระดับอัตโนมัติ', 'ระหว่างนี้ดู/แก้ได้ในแท็บ measurements ของ Google Sheet']} />}
      {sub === 'ill' && <Soon title="การเจ็บป่วย" phase={4} items={['ไทม์ไลน์การเจ็บป่วยและการนอนโรงพยาบาล', 'บันทึกยา + ตรวจ G-6-PD อัตโนมัติ', 'ระหว่างนี้ดู/แก้ได้ในแท็บ illnesses ของ Google Sheet']} />}
      {sub === 'dspm' && <Soon title="พัฒนาการ" phase={6} items={['รายการประเมินตามคู่มือ DSPM ของกรมอนามัย', 'ติ๊กผ่าน/ไม่ผ่าน ตามช่วงอายุ']} />}
    </>
  )
}

const LEVEL: Record<G6pdItem['level'], [string, string, string]> = {
  avoid: ['bad', '🔴 ห้ามใช้', 'อยู่ในรายการยาที่ควรหลีกเลี่ยง แจ้งแพทย์/เภสัชกรว่ามีภาวะ G-6-PD เพื่อเปลี่ยนยา'],
  caution: ['warn', '🟡 ใช้ด้วยความระมัดระวัง', 'ใช้ได้เมื่อจำเป็น ตามขนาดที่แพทย์สั่ง และสังเกตอาการหลังใช้'],
  food: ['bad', '🚫 ควรหลีกเลี่ยง', 'อาหาร/สารเคมีที่อาจกระตุ้นให้เม็ดเลือดแดงแตก'],
}

function G6pdChecker({ person }: { person?: Person }) {
  const [q, setQ] = useState('')
  const hits = searchG6pd(q)
  return (
    <>
      {person && !person.g6pd && (
        <div className="card alert">โปรไฟล์นี้ไม่ได้ระบุว่ามีภาวะ G-6-PD · ตั้งค่าได้ที่เมนู เพิ่มเติม → โปรไฟล์</div>
      )}
      <div className="card">
        <h3>💊 ตรวจชื่อยา / อาหาร / สารเคมี</h3>
        <input className="in" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="พิมพ์ชื่อยาจากฉลาก เช่น co-trimoxazole" autoComplete="off" />
        {q.trim().length >= 3 && hits.length === 0 && (
          <div className="result info">
            <b>ไม่พบในรายการ</b><br />ไม่ได้แปลว่าปลอดภัย ให้ถามแพทย์หรือเภสัชกรก่อนใช้ทุกครั้ง
          </div>
        )}
        {hits.map((it) => {
          const [cls, title, msg] = LEVEL[it.level]
          return (
            <div key={it.name} className={`result ${cls}`}>
              <b>{title}: {it.name}</b> <span className="mute">({it.group})</span><br />{msg}
              {it.note && <><br /><small>{it.note}</small></>}
            </div>
          )
        })}
        <p className="mute">รายการจากสมุดประจำตัวผู้มีภาวะพร่องเอนไซม์ G-6-PD เป็นเพียงตัวอย่าง ไม่ครอบคลุมยาทุกตัว</p>
      </div>
      <div className="card">
        <h3>ข้อปฏิบัติตัว</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>{G6PD_RULES.map((r) => <li key={r}>{r}</li>)}</ol>
      </div>
    </>
  )
}
