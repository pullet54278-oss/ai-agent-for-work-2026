import { useState } from 'react'
import { signOut, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { createFamily, joinFamily } from '../lib/family'

export default function Setup({ user }: { user: User }) {
  const fromLink = new URLSearchParams(location.search).get('join') ?? ''
  const [invite, setInvite] = useState(fromLink)
  const [name, setName] = useState('ครอบครัวของเรา')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setErr('')
    try {
      await fn()
      history.replaceState(null, '', location.pathname)
    } catch {
      setErr('ไม่สำเร็จ ตรวจสอบลิงก์เชิญหรืออินเทอร์เน็ตแล้วลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', paddingTop: 32 }}>
      <h2>สวัสดี {user.displayName}</h2>
      <div className="card">
        <h3>เข้าร่วมครอบครัว</h3>
        <p className="mute">ถ้าอีกฝ่ายสร้างครอบครัวไว้แล้ว ให้เปิดลิงก์เชิญที่เขาส่งมา หรือวางลิงก์/รหัสที่นี่</p>
        <input className="in" value={invite} onChange={(e) => setInvite(e.target.value.split('join=').pop() ?? '')}
          placeholder="วางลิงก์เชิญ" />
        <button className="btn block" style={{ marginTop: 10 }} disabled={busy || !invite}
          onClick={() => run(() => joinFamily(user, invite))}>เข้าร่วม</button>
      </div>
      {!fromLink && (
        <div className="card">
          <h3>หรือสร้างครอบครัวใหม่</h3>
          <label className="f"><span>ชื่อครอบครัว</span>
            <input className="in" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <button className="btn ghost block" disabled={busy || !name}
            onClick={() => run(() => createFamily(user, name))}>สร้างครอบครัว</button>
        </div>
      )}
      {err && <div className="card alert red">{err}</div>}
      <button className="btn ghost" onClick={() => signOut(auth!)}>ออกจากระบบ</button>
    </main>
  )
}
