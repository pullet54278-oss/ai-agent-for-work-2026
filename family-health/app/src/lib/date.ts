const thai = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: '2-digit' })

export function thaiDate(iso: string): string {
  if (!iso) return '-'
  return thai.format(new Date(iso + 'T00:00:00'))
}

/** อายุเป็น "x ปี y เดือน" ณ วันที่ที่กำหนด (ค่าเริ่มต้นคือวันนี้) */
export function ageText(birthIso: string, at: Date = new Date()): string {
  if (!birthIso) return ''
  const b = new Date(birthIso + 'T00:00:00')
  let months = (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth())
  if (at.getDate() < b.getDate()) months--
  if (months < 0) return ''
  const y = Math.floor(months / 12), m = months % 12
  if (y === 0) return `${m} เดือน`
  return m ? `${y} ปี ${m} เดือน` : `${y} ปี`
}

/** แยกรายชื่อติดต่อจากข้อความ เช่น "พ่อป๊อป 0806688730, แม่อ๋อม 0861215202" */
export function parseContacts(text: string): { label: string; phone: string }[] {
  return text.split(/[,\n/]+/).map((part) => {
    const phone = (part.match(/[\d\s-]{9,}/)?.[0] ?? '').replace(/\D/g, '')
    return { label: part.replace(/[\d\s-]{9,}/, '').trim(), phone }
  }).filter((c) => c.phone)
}

export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p
}

/** วันที่ตามเวลาเครื่อง (ไม่ใช้ toISOString ซึ่งเป็น UTC และจะเลื่อนวันในเวลาไทย) */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayIso(): string {
  return isoDate(new Date())
}

/** บวกเดือน โดยวันที่เกินสิ้นเดือนจะปัดเป็นวันสุดท้ายของเดือน (31 ม.ค. + 1 เดือน = 28/29 ก.พ.) */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const first = new Date(y, m - 1 + months, 1)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return isoDate(new Date(first.getFullYear(), first.getMonth(), Math.min(d, last)))
}

export function ageInMonths(birthIso: string, at: Date = new Date()): number {
  const b = new Date(birthIso + 'T00:00:00')
  let m = (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth())
  if (at.getDate() < b.getDate()) m--
  return m
}

export function daysUntil(iso: string): number {
  const t = new Date(todayIso() + 'T00:00:00').getTime()
  return Math.round((new Date(iso + 'T00:00:00').getTime() - t) / 86_400_000)
}
