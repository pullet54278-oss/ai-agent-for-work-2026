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

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return isoDate(d)
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
