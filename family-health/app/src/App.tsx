import { useEffect, useMemo, useState } from 'react'
import { authConfigured, useUser } from './lib/auth'
import { refresh, startAutoRefresh, useStore } from './lib/store'
import { ageText } from './lib/date'
import Login from './screens/Login'
import Home from './screens/Home'
import Health from './screens/Health'
import Emergency from './screens/Emergency'
import More from './screens/More'
import School from './screens/School'
import Expenses from './screens/Expenses'
import Medicines from './screens/Medicines'

export type Tab = 'home' | 'health' | 'meds' | 'school' | 'money' | 'more'

const TABS: [Tab, string, string][] = [
  ['home', '🏠', 'หน้าหลัก'], ['health', '❤️', 'สุขภาพ'], ['meds', '🧴', 'ตู้ยา'], ['school', '🎓', 'การเรียน'],
  ['money', '💰', 'ค่าใช้จ่าย'], ['more', '☰', 'เพิ่มเติม'],
]

export default function App() {
  const user = useUser()
  const { data, loading, saving, error } = useStore()
  const people = data.people
  const [tab, setTab] = useState<Tab>('home')
  const [healthSub, setHealthSub] = useState('vax')
  const [sos, setSos] = useState(false)

  // เปลี่ยนบัญชี: กลับหน้าแรกและดึงข้อมูลใหม่
  useEffect(() => {
    setTab('home')
    if (user) void refresh()
  }, [user?.email])

  // ข้อมูลที่อีกเครื่องบันทึกจะเข้ามาเองเมื่อกลับมาเปิดแอป หรือทุก 2 นาที
  useEffect(() => (user ? startAutoRefresh() : undefined), [user?.email])

  // แอปนี้เก็บข้อมูลลูกคนเดียว
  const person = useMemo(() => people.find((p) => p.relation === 'child') ?? people[0], [people])

  if (!authConfigured) return <NotConfigured />
  if (!user) return <Login />

  const go = (t: Tab, sub?: string) => {
    setTab(t)
    if (sub) setHealthSub(sub)
    scrollTo(0, 0)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="avatar">{person?.photo ? <img src={person.photo} alt="" /> : person?.sex === 'female' ? '👧' : '👦'}</div>
        <div className="who">
          <b>{person ? person.nickname || person.fullName : 'สมุดสุขภาพ'}</b>
          <br />
          <small>{person ? ageText(person.birthDate) : loading ? 'กำลังโหลด…' : 'ยังไม่มีข้อมูลลูก'}</small>
        </div>
        <button className="sync" onClick={() => refresh()} aria-label="ดึงข้อมูลล่าสุด" disabled={loading}>
          {loading || saving ? '⏳' : '🔄'}
        </button>
        {person?.g6pd && (
          <button className="sos" onClick={() => setSos(true)}>
            🆘 G6PD
          </button>
        )}
      </header>

      {error && <div className="banner">{error}</div>}

      <main>
        {tab === 'home' && <Home person={person} data={data} go={go} openSos={() => setSos(true)} />}
        {tab === 'health' && <Health person={person} data={data} sub={healthSub} setSub={setHealthSub} />}
        {tab === 'meds' && (person ? <Medicines person={person} data={data} /> : null)}
        {tab === 'school' && <School person={person} data={data} />}
        {tab === 'money' && <Expenses key={person?.id} person={person} data={data} />}
        {tab === 'more' && <More user={user} person={person} />}
      </main>

      <nav className="bottom">
        {TABS.map(([k, icon, label]) => (
          <button key={k} className={k === tab ? 'on' : ''} onClick={() => go(k)}>
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {sos && person && <Emergency person={person} onClose={() => setSos(false)} />}
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="center">
      <div className="card" style={{ maxWidth: 420, textAlign: 'left' }}>
        <h3>ยังไม่ได้ตั้งค่าการเชื่อมต่อ</h3>
        <p className="mute">
          ต้องตั้งตัวแปร <code>VITE_GOOGLE_CLIENT_ID</code> และ <code>VITE_API_URL</code> (URL ของ Apps Script Web App)
          ตามขั้นตอนใน <code>SETUP.md</code>
        </p>
      </div>
    </div>
  )
}
