import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Login() {
  const [err, setErr] = useState('')
  async function login() {
    setErr('')
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth!, provider)
    } catch (e) {
      const code = (e as { code?: string }).code
      // แอปที่ติดตั้งบนหน้าจอบางเครื่องเปิด popup ไม่ได้ ให้ใช้ redirect แทน
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth!, provider)
      } else if (code !== 'auth/popup-closed-by-user') {
        setErr(`เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง (${code ?? 'unknown'})`)
      }
    }
  }
  return (
    <div className="center">
      <div>
        <img className="logo" src="/icons/icon-192.png" alt="" />
        <h2 style={{ margin: '16px 0 4px' }}>สมุดสุขภาพครอบครัว</h2>
        <p className="mute" style={{ marginTop: 0 }}>สุขภาพ วัคซีน การเจ็บป่วย พัฒนาการ และผลการเรียน</p>
        <button className="btn block" onClick={login}>เข้าสู่ระบบด้วย Google</button>
        {err && <p className="pill bad" style={{ marginTop: 12 }}>{err}</p>}
        <p className="mute" style={{ marginTop: 24 }}>ข้อมูลเห็นเฉพาะสมาชิกในครอบครัวที่ได้รับเชิญเท่านั้น</p>
      </div>
    </div>
  )
}
