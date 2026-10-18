import { useState } from 'react'
import { promptInstall, useInstall } from '../lib/install'

/** ปุ่ม "ติดตั้งแอปลงเครื่อง" — ซ่อนเองเมื่อติดตั้งแล้ว · iPhone แสดงวิธีเพิ่มไปยังหน้าจอโฮม */
export default function InstallButton({ compact = false }: { compact?: boolean }) {
  const state = useInstall()
  const [help, setHelp] = useState(false)
  if (state === 'installed') return compact ? null : <p className="mute" style={{ margin: 0 }}>✅ ติดตั้งแอปในเครื่องนี้แล้ว</p>

  const click = async () => {
    if (state === 'ready') await promptInstall()
    else setHelp(!help)
  }
  return (
    <div>
      <button className={compact ? 'btn ghost' : 'btn block'} onClick={click}>📲 ติดตั้งแอปลงเครื่อง</button>
      {help && (
        <div className="result info" style={{ marginTop: 8, textAlign: 'left' }}>
          {state === 'ios' ? (
            <>ใน Safari กดปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรขึ้น) → <b>เพิ่มไปยังหน้าจอโฮม</b> → <b>เพิ่ม</b></>
          ) : (
            <>เปิดลิงก์นี้ด้วย <b>Chrome</b> แล้วกดเมนู <b>⋮</b> มุมขวาบน → <b>ติดตั้งแอป</b> หรือ <b>เพิ่มลงในหน้าจอหลัก</b>
              <br /><small className="mute">ถ้าไม่มีเมนูนี้ แปลว่าอาจติดตั้งไว้แล้ว ลองหาไอคอนแอปบนหน้าจอมือถือ</small></>
          )}
        </div>
      )}
    </div>
  )
}
