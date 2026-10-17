import { useEffect, useRef } from 'react'
import { isMock, mockSignIn, renderSignInButton } from '../lib/auth'

export default function Login() {
  const btn = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isMock && btn.current) void renderSignInButton(btn.current)
  }, [])
  return (
    <div className="center">
      <div>
        <img className="logo" src="/icons/icon-192.png" alt="" />
        <h2 style={{ margin: '16px 0 4px' }}>สมุดสุขภาพครอบครัว</h2>
        <p className="mute" style={{ marginTop: 0 }}>สุขภาพ วัคซีน การเจ็บป่วย พัฒนาการ และผลการเรียน</p>
        <div ref={btn} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
        {isMock && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => mockSignIn('dad@example.com', 'พ่อทดสอบ')}>ทดสอบ: พ่อ</button>
            <button className="btn ghost" onClick={() => mockSignIn('mom@example.com', 'แม่ทดสอบ')}>ทดสอบ: แม่</button>
            <button className="btn ghost" onClick={() => mockSignIn('evil@example.com', 'คนนอก')}>ทดสอบ: คนนอก</button>
          </div>
        )}
        <p className="mute" style={{ marginTop: 24 }}>ใช้ได้เฉพาะบัญชี Google ของพ่อและแม่ที่ตั้งไว้เท่านั้น</p>
      </div>
    </div>
  )
}
