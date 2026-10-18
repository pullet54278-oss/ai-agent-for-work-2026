// คำนวณ z-score ตามมาตรฐาน WHO และแปลผลตามกราฟในสมุดบันทึกสุขภาพแม่และเด็ก (กรมอนามัย 2564)
// 0–5 ปี: WHO Child Growth Standards 2006 · 5–19 ปี: WHO Growth Reference 2007
import { BFA07, HCFA, HFA07, LHFA, WFA, WFA07, WFH, WFH_START, WFL, WFL_START, type LMS } from '../data/who-lms'

export type Indicator = 'wfa' | 'hfa' | 'wfh' | 'bfa'

/** ช่วงอายุ (เดือน) ที่แต่ละดัชนีมีข้อมูล WHO */
// ขอบบนตาม WHO anthroplus: น้ำหนักตามอายุ < 121 เดือน, ส่วนสูงและ BMI < 229 เดือน
export const AGE_RANGE: Record<Indicator, [number, number]> = { wfa: [0, 121], hfa: [0, 229], wfh: [0, 60], bfa: [60, 229] }
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
  if (ageMonths < AGE_RANGE[ind][0] || ageMonths > AGE_RANGE[ind][1]) return null
  if (ind === 'wfa') return ageMonths <= 60 ? at(WFA[sex], ageMonths) : at(WFA07[sex], ageMonths - 60)
  if (ind === 'hfa') return ageMonths <= 60 ? at(LHFA[sex], ageMonths) : at(HFA07[sex], ageMonths - 60)
  if (ind === 'bfa') return at(BFA07[sex], ageMonths - 60)
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
  // ดัชนีมวลกายตามอายุ 5–19 ปี ตามเกณฑ์ WHO 2007 (ผอม < −2 SD, น้ำหนักเกิน > +1 SD, อ้วน > +2 SD)
  bfa: [
    { min: -Infinity, label: 'ผอมมาก', tone: 'bad' },
    { min: -3, label: 'ผอม', tone: 'bad' },
    { min: -2, label: 'สมส่วน', tone: 'ok' },
    { min: 1, label: 'น้ำหนักเกิน', tone: 'warn' },
    { min: 2, label: 'อ้วน', tone: 'high' },
  ],
}

export const bmi = (weightKg: number, heightCm: number) => weightKg / (heightCm / 100) ** 2

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

/** ประเมินการวัดหนึ่งครั้ง (ข้ามดัชนีที่ไม่มีข้อมูลหรืออยู่นอกช่วงอายุของดัชนีนั้น) */
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
  if (heightCm != null && weightKg != null) add('bfa', bmi(weightKg, heightCm), lmsFor('bfa', sex, ageMonths))
  return out
}

/**
 * อัตราการเพิ่มส่วนสูง (ซม./ปี) จากการวัดล่าสุดเทียบกับครั้งก่อนที่ห่างกันอย่างน้อย 6 เดือน (เลือกครั้งที่ใกล้ 12 เดือนที่สุด)
 * เด็กอายุ 4 ปีจนถึงก่อนวัยรุ่นปกติสูงขึ้นประมาณ 5–6 ซม./ปี ถ้าน้อยกว่า 4 ซม./ปี ควรปรึกษาแพทย์
 */
export function heightVelocity(rows: { date: string; heightCm: number | null }[]):
  { cmPerYear: number; from: string; to: string } | null {
  const hs = rows.filter((r) => r.heightCm != null).sort((a, b) => a.date.localeCompare(b.date))
  const last = hs[hs.length - 1]
  if (!last) return null
  const days = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  const prior = hs.filter((r) => days(r.date, last.date) >= 182)
    .sort((a, b) => Math.abs(days(a.date, last.date) - 365) - Math.abs(days(b.date, last.date) - 365))[0]
  if (!prior) return null
  const cmPerYear = ((last.heightCm! - prior.heightCm!) / days(prior.date, last.date)) * 365.25
  return { cmPerYear, from: prior.date, to: last.date }
}

/** อายุเป็นเดือนแบบทศนิยม (สำหรับคำนวณ) */
export function exactAgeMonths(birthIso: string, dateIso: string): number {
  const days = (new Date(dateIso + 'T00:00:00').getTime() - new Date(birthIso + 'T00:00:00').getTime()) / 86_400_000
  return days / 30.4375
}
