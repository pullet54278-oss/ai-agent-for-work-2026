export default function Soon({ title, phase, items }: { title: string; phase: number; items: string[] }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <span className="pill info">กำลังพัฒนา · ระยะที่ {phase}</span>
      <ul className="mute">{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  )
}
