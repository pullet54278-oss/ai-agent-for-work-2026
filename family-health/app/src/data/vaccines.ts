import { addMonths } from '../lib/date'

// ตารางวัคซีนตามแผนงานสร้างเสริมภูมิคุ้มกันโรคของประเทศไทย (สมุดบันทึกสุขภาพแม่และเด็ก ส่วนที่ 3)
// และวัคซีนเสริมที่ครอบครัวใช้ — code + dose ใช้จับคู่กับบันทึกในแท็บ vaccines

export interface EpiDose {
  code: string
  dose: number
  name: string
  ageMonths: number
  ageLabel: string
  sex?: 'female'
  note?: string
}

const d = (code: string, dose: number, name: string, ageMonths: number, ageLabel: string, extra: Partial<EpiDose> = {}): EpiDose =>
  ({ code, dose, name, ageMonths, ageLabel, ...extra })

export const EPI: EpiDose[] = [
  d('BCG', 1, 'วัณโรค (BCG)', 0, 'แรกเกิด'),
  d('HB', 1, 'ตับอักเสบบี (HB)', 0, 'แรกเกิด'),
  d('OPV', 1, 'โปลิโอชนิดกิน (OPV) ครั้งที่ 1', 2, '2 เดือน'),
  d('DTP-HB-Hib', 1, 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี-ฮิบ ครั้งที่ 1', 2, '2 เดือน'),
  d('Rota', 1, 'โรต้า ครั้งที่ 1', 2, '2 เดือน'),
  d('OPV', 2, 'โปลิโอชนิดกิน (OPV) ครั้งที่ 2', 4, '4 เดือน'),
  d('DTP-HB-Hib', 2, 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี-ฮิบ ครั้งที่ 2', 4, '4 เดือน'),
  d('Rota', 2, 'โรต้า ครั้งที่ 2', 4, '4 เดือน'),
  d('IPV', 1, 'โปลิโอชนิดฉีด (IPV)', 4, '4 เดือน'),
  d('OPV', 3, 'โปลิโอชนิดกิน (OPV) ครั้งที่ 3', 6, '6 เดือน'),
  d('DTP-HB-Hib', 3, 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี-ฮิบ ครั้งที่ 3', 6, '6 เดือน'),
  d('Rota', 3, 'โรต้า ครั้งที่ 3', 6, '6 เดือน', { note: 'ยกเว้นได้ Rotarix มาแล้ว 2 ครั้ง' }),
  d('MMR', 1, 'หัด-คางทูม-หัดเยอรมัน (MMR) ครั้งที่ 1', 9, '9 เดือน'),
  d('LAJE', 1, 'ไข้สมองอักเสบเจอี (LAJE) ครั้งที่ 1', 12, '1 ปี'),
  d('OPV', 4, 'โปลิโอชนิดกิน (OPV) ครั้งที่ 4', 18, '1 ปี 6 เดือน'),
  d('DTP', 4, 'คอตีบ-บาดทะยัก-ไอกรน (DTP) ครั้งที่ 4', 18, '1 ปี 6 เดือน'),
  d('MMR', 2, 'หัด-คางทูม-หัดเยอรมัน (MMR) ครั้งที่ 2', 18, '1 ปี 6 เดือน'),
  d('LAJE', 2, 'ไข้สมองอักเสบเจอี (LAJE) ครั้งที่ 2', 30, '2 ปี 6 เดือน'),
  d('OPV', 5, 'โปลิโอชนิดกิน (OPV) ครั้งที่ 5', 48, '4 ปี'),
  d('DTP', 5, 'คอตีบ-บาดทะยัก-ไอกรน (DTP) ครั้งที่ 5', 48, '4 ปี'),
  d('HPV', 1, 'เอชพีวี (HPV) ครั้งที่ 1', 132, '11 ปี (ป.5)', { sex: 'female' }),
  d('HPV', 2, 'เอชพีวี (HPV) ครั้งที่ 2', 138, 'ห่างเข็มแรก 6–12 เดือน', { sex: 'female' }),
  d('dT', 1, 'คอตีบ-บาดทะยัก (dT)', 144, '12 ปี (ป.6)', { note: 'กระตุ้นซ้ำทุก 10 ปี' }),
]

export interface OptionalVaccine {
  code: string
  name: string
  doses: number // 0 = ฉีดซ้ำทุกปี
  /** ระยะห่างจากเข็มก่อนหน้า (เดือน) สำหรับคำนวณนัดเข็มถัดไป */
  intervalMonths: number[]
  note: string
}

export const OPTIONAL: OptionalVaccine[] = [
  { code: 'FLU', name: 'ไข้หวัดใหญ่', doses: 0, intervalMonths: [12], note: 'ปีละ 1 ครั้ง (ครั้งแรกในเด็กอายุต่ำกว่า 9 ปีฉีด 2 เข็มห่างกัน 1 เดือน)' },
  { code: 'DEN', name: 'ไข้เลือดออก (Qdenga)', doses: 2, intervalMonths: [3], note: '2 เข็ม ห่างกัน 3 เดือน' },
  { code: 'HAV', name: 'ตับอักเสบเอ', doses: 2, intervalMonths: [6], note: '2 เข็ม ห่างกัน 6–12 เดือน' },
  { code: 'EV71', name: 'มือเท้าปาก (EV71)', doses: 2, intervalMonths: [1], note: '2 เข็ม ห่างกัน 1 เดือน (อายุ 6 เดือน – 5 ปี)' },
  { code: 'VZV', name: 'อีสุกอีใส', doses: 2, intervalMonths: [3], note: '2 เข็ม' },
  { code: 'PCV', name: 'ปอดอักเสบ (นิวโมคอคคัส)', doses: 0, intervalMonths: [], note: 'ตามแพทย์แนะนำ' },
  { code: 'OTHER', name: 'อื่น ๆ', doses: 0, intervalMonths: [], note: '' },
]

export function vaccineName(code: string, dose: number): string {
  const epi = EPI.find((e) => e.code === code && e.dose === dose)
  if (epi) return epi.name
  const opt = OPTIONAL.find((o) => o.code === code)
  return opt ? `${opt.name}${dose ? ` เข็มที่ ${dose}` : ''}` : code
}

/** วันนัดเข็มถัดไปของวัคซีนเสริม (ถ้ามี) */
export function nextDoseDate(code: string, dose: number, date: string): { dose: number; date: string } | null {
  const v = OPTIONAL.find((o) => o.code === code)
  if (!v || !date) return null
  if (v.doses !== 0 && dose >= v.doses) return null
  const gap = v.doses === 0 ? v.intervalMonths[0] : v.intervalMonths[Math.min(dose - 1, v.intervalMonths.length - 1)]
  if (!gap) return null
  return { dose: dose + 1, date: addMonths(date, gap) }
}
