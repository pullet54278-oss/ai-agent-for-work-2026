import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, configured } from './lib/firebase'
import { useFamily, useFamilyId, usePeople } from './lib/family'
import { ageText } from './lib/date'
import { relationLabel } from './lib/types'
import Login from './screens/Login'
import Setup from './screens/Setup'
import Home from './screens/Home'
import Health from './screens/Health'
import Emergency from './screens/Emergency'
import More from './screens/More'
import Soon from './screens/Soon'

export type Tab = 'home' | 'health' | 'school' | 'money' | 'more'

const TABS: [Tab, string, string][] = [
  ['home', '🏠', 'หน้าหลัก'], ['health', '❤️', 'สุขภาพ'], ['school', '🎓', 'การเรียน'],
  ['money', '💰', 'ค่าใช้จ่าย'], ['more', '☰', 'เพิ่มเติม'],
]

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => (auth ? onAuthStateChanged(auth, setUser) : undefined), [])
  const fid = useFamilyId(user ?? null)
  const family = useFamily(fid)
  const people = usePeople(fid)
  const [personId, setPersonId] = useState<string>('')
  const [tab, setTab] = useState<Tab>('home')
  const [healthSub, setHealthSub] = useState('g6pd')
  const [sos, setSos] = useState(false)

  const person = useMemo(
    () => people.find((p) => p.id === personId) ?? people.find((p) => p.relation === 'child') ?? people[0],
    [people, personId],
  )

  if (!configured) return <NotConfigured />
  if (user === undefined || (user && (fid === undefined || (fid && family === undefined)))) {
    return <div className="center mute">กำลังโหลด…</div>
  }
  if (!user) return <Login />
  if (!fid || !family) return <Setup user={user} />

  const go = (t: Tab, sub?: string) => {
    setTab(t)
    if (sub) setHealthSub(sub)
    scrollTo(0, 0)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="avatar">{person?.relation === 'child' ? '👦' : person?.relation === 'mother' ? '👩' : '👨'}</div>
        <div className="who">
          {people.length > 0 ? (
            <select value={person?.id} onChange={(e) => setPersonId(e.target.value)} aria-label="เลือกคนในครอบครัว">
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname || p.fullName} ({relationLabel[p.relation]})
                </option>
              ))}
            </select>
          ) : (
            <b>{family.name}</b>
          )}
          <br />
          <small>{person ? ageText(person.birthDate) : 'ยังไม่มีโปรไฟล์'}</small>
        </div>
        {person?.g6pd && (
          <button className="sos" onClick={() => setSos(true)}>
            🆘 G6PD
          </button>
        )}
      </header>

      <main>
        {tab === 'home' && <Home person={person} people={people} go={go} openSos={() => setSos(true)} />}
        {tab === 'health' && <Health person={person} sub={healthSub} setSub={setHealthSub} />}
        {tab === 'school' && <Soon title="การเรียน" phase={5} items={['ผลการเรียนรายเทอม แยกโปรแกรม EIS / IEP / จินตคณิต', 'กราฟเทียบรายเทอม', 'แนบรูปใบประกาศ']} />}
        {tab === 'money' && <Soon title="ค่าใช้จ่าย" phase={5} items={['ค่ารักษาและค่าเรียน รายเทอม รายปี', 'ค่าใช้จ่ายรายเดือน เช่น เรียนพิเศษ', 'แนบใบเสร็จ + สลิป และสถานะการเบิก']} />}
        {tab === 'more' && <More user={user} family={family} people={people} />}
      </main>

      <nav className="bottom">
        {TABS.map(([k, icon, label]) => (
          <button key={k} className={k === tab ? 'on' : ''} onClick={() => go(k)}>
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {sos && person && <Emergency person={person} people={people} onClose={() => setSos(false)} />}
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="center">
      <div className="card" style={{ maxWidth: 420, textAlign: 'left' }}>
        <h3>ยังไม่ได้เชื่อมต่อ Firebase</h3>
        <p className="mute">
          สร้างไฟล์ <code>.env.local</code> จาก <code>.env.example</code> แล้วใส่ค่าการตั้งค่าเว็บแอปจาก Firebase Console
          ตามขั้นตอนใน <code>SETUP.md</code>
        </p>
      </div>
    </div>
  )
}
