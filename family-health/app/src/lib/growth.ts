// คำนวณ z-score ตามมาตรฐาน WHO และแปลผลตามกราฟในสมุดบันทึกสุขภาพแม่และเด็ก (กรมอนามัย 2564)
import { HCFA, LHFA, WFA, WFH, WFH_START, WFL, WFL_START, type LMS } from '../data/who-lms'

export type Indicator = 'wfa' | 'hfa' | 'wfh'
type Sex = 1 | 2

function lerp(a: LMS, b: LMS, t: number): LMS {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function at(table: LMS[], index: number): LMS | null {
  if (index < 0 || index > table.length - 1) return null
  const i = Math.floor(index)
  return i === table.length - 1 ? table[i] : lerp(table[i], table[i + 1], index - i)
}

/** ค่าที่ตำแหน่ง z (ใช้วาดเส้นแบ่งในกราฟ) */
export function valueAtZ([l, m, s]: LMS, z: number): number {
  return l === 0 ? m * Math.exp(s * z) : m * Math.pow(1 + l * s * z, 1 / l)
}

/**
 * z-score ตามสูตร LMS; ดัชนีที่เป็นน้ำหนักใช้การปรับนอกช่วง ±3 SD ตามวิธีของ WHO
 * (เพราะการกระจายของน้ำหนักเบ้ขวา)
 */
export function zScore(x: number, lms: LMS, weightBased: boolean): number {
  const [l, m, s] = lms
  const z = l === 0 ? Math.log(x / m) / s : (Math.pow(x / m, l) - 1) / (l * s)
  if (!weightBased || Math.abs(z) <= 3) return z
  const sd3 = valueAtZ(lms, 3 * Math.sign(z))
  const sd2 = valueAtZ(lms, 2 * Math.sign(z))
  return Math.sign(z) * 3 + (x - sd3) / Math.abs(sd3 - sd2)
}

/** LMS ของดัชนี ณ อายุ (เดือน, ทศนิยมได้) หรือความยาว/ส่วนสูง (ซม.) — null ถ้านอกช่วงข้อมูล WHO */
export function lmsFor(ind: Indicator, sex: Sex, ageMonths: number, heightCm?: number): LMS | null {
  if (ind === 'wfa') return at(WFA[sex], ageMonths)
  if (ind === 'hfa') return at(LHFA[sex], ageMonths)
  if (heightCm == null) return null
  // อายุต่ำกว่า 2 ปีใช้ตารางความยาว (นอนวัด) อายุ 2 ปีขึ้นไปใช้ตารางส่วนสูง (ยืนวัด)
  return ageMonths < 24 ? at(WFL[sex], (heightCm - WFL_START) * 2) : at(WFH[sex], (heightCm - WFH_START) * 2)
}

export function headLms(sex: Sex, ageMonths: number): LMS | null {
  return at(HCFA[sex], ageMonths)
}

export interface Band {
  min: number // z ล่าง (รวม)
  label: string
  tone: 'bad' | 'warn' | 'ok' | 'high'
}

/** เกณฑ์ตามกราฟในสมุดสีชมพู: น้ำหนัก/ส่วนสูงตามอายุ 5 ระดับ, น้ำหนักตามส่วนสูง 6 ระดับ */
export const BANDS: Record<Indicator, Band[]> = {
  wfa: [
    { min: -Infinity, label: 'น้ำหนักน้อย', tone: 'bad' },
    { min: -2, label: 'น้ำหนักค่อนข้างน้อย', tone: 'warn' },
    { min: -1.5, label: 'น้ำหนักตามเกณฑ์', tone: 'ok' },
    { min: 1, label: 'น้ำหนักค่อนข้างมาก', tone: 'warn' },
    { min: 2, label: 'น้ำหนักมาก', tone: 'high' },
  ],
  hfa: [
    { min: -Infinity, label: 'เตี้ย', tone: 'bad' },
    { min: -2, label: 'ค่อนข้างเตี้ย', tone: 'warn' },
    { min: -1.5, label: 'สูงตามเกณฑ์', tone: 'ok' },
    { min: 1, label: 'ค่อนข้างสูง', tone: 'ok' },
    { min: 2, label: 'สูง', tone: 'ok' },
  ],
  wfh: [
    { min: -Infinity, label: 'ผอม', tone: 'bad' },
    { min: -2, label: 'ค่อนข้างผอม', tone: 'warn' },
    { min: -1.5, label: 'สมส่วน', tone: 'ok' },
    { min: 1.5, label: 'ท้วม', tone: 'warn' },
    { min: 2, label: 'เริ่มอ้วน', tone: 'high' },
    { min: 3, label: 'อ้วน', tone: 'high' },
  ],
}

export function classify(ind: Indicator, z: number): Band {
  const bands = BANDS[ind]
  let found = bands[0]
  for (const b of bands) if (z >= b.min) found = b
  return found
}

export interface Assessment {
  indicator: Indicator
  z: number
  band: Band
}

/** ประเมินการวัดหนึ่งครั้ง (ข้ามดัชนีที่ไม่มีข้อมูลหรืออยู่นอกช่วงอายุ 0–5 ปี) */
export function assess(sex: Sex, ageMonths: number, weightKg: number | null, heightCm: number | null): Assessment[] {
  const out: Assessment[] = []
  const add = (indicator: Indicator, x: number | null, lms: LMS | null) => {
    if (x == null || !lms) return
    const z = zScore(x, lms, indicator !== 'hfa')
    out.push({ indicator, z, band: classify(indicator, z) })
  }
  add('wfa', weightKg, lmsFor('wfa', sex, ageMonths))
  add('hfa', heightCm, lmsFor('hfa', sex, ageMonths))
  if (heightCm != null) add('wfh', weightKg, lmsFor('wfh', sex, ageMonths, heightCm))
  return out
}

/** อายุเป็นเดือนแบบทศนิยม (สำหรับคำนวณ) */
export function exactAgeMonths(birthIso: string, dateIso: string): number {
  const days = (new Date(dateIso + 'T00:00:00').getTime() - new Date(birthIso + 'T00:00:00').getTime()) / 86_400_000
  return days / 30.4375
}
