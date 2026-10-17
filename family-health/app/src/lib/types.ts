// ชนิดข้อมูลตรงกับคอลัมน์ในแต่ละแท็บของ Google Sheet (ดู apps-script/Code.gs → TABLES)

export type Relation = 'child' | 'father' | 'mother' | 'other'

interface Base {
  id: string
  updatedAt?: string
  updatedBy?: string
}

export interface Person extends Base {
  nickname: string
  fullName: string
  relation: Relation
  sex: 'male' | 'female' | ''
  birthDate: string // ค.ศ. YYYY-MM-DD
  phone: string
  bloodGroup: string
  hospital: string
  hn: string
  g6pd: boolean
  allergies: string
  notes: string
}

export interface Vaccine extends Base {
  personId: string
  code: string // รหัสวัคซีน เช่น DTP-HB-Hib, EV71 (ดู data/vaccines.ts)
  name: string
  dose: number
  date: string
  lot: string
  place: string
  price: number | null
  priceEstimate: boolean
  notes: string
}

export interface Appointment extends Base {
  personId: string
  type: 'vaccine' | 'doctor' | 'school' | 'other'
  title: string
  date: string
  time: string
  place: string
  status: 'pending' | 'done' | 'cancelled'
  notes: string
  calendarEventId?: string
}

export interface Measurement extends Base {
  personId: string
  date: string
  weightKg: number | null
  heightCm: number | null
  headCm: number | null
  source: string
  notes: string
}

export interface Illness extends Base {
  personId: string
  startDate: string
  endDate: string
  place: string
  doctor: string
  diagnosis: string
  admitted: boolean
  restDays: number | null
  medications: string
  advice: string
  cost: number | null
  notes: string
}

export interface Expense extends Base {
  personId: string
  date: string
  category: string
  item: string
  amount: number | null
  status: 'evidence' | 'estimate' | 'pending'
  claim: string
  period: string
  notes: string
}

export interface SchoolResult extends Base {
  personId: string
  academicYear: string
  term: string
  program: string
  subject: string
  score: number | null
  maxScore: number | null
  grade: string
  comment: string
}

export interface Data {
  people: Person[]
  vaccines: Vaccine[]
  appointments: Appointment[]
  measurements: Measurement[]
  illnesses: Illness[]
  expenses: Expense[]
  school: SchoolResult[]
}
export type Table = keyof Data
export type Row<T extends Table> = Data[T][number]

export const emptyData: Data = {
  people: [], vaccines: [], appointments: [], measurements: [], illnesses: [], expenses: [], school: [],
}

// คอลัมน์ที่ต้องแปลงจากข้อความใน Sheet
export const NUMBER_FIELDS: Partial<Record<Table, string[]>> = {
  vaccines: ['dose', 'price'],
  measurements: ['weightKg', 'heightCm', 'headCm'],
  illnesses: ['restDays', 'cost'],
  expenses: ['amount'],
  school: ['score', 'maxScore'],
}
export const BOOL_FIELDS: Partial<Record<Table, string[]>> = {
  people: ['g6pd'],
  vaccines: ['priceEstimate'],
  illnesses: ['admitted'],
}

export const emptyPerson: Omit<Person, 'id'> = {
  nickname: '', fullName: '', relation: 'child', sex: '', birthDate: '', phone: '',
  bloodGroup: '', hospital: '', hn: '', g6pd: false, allergies: '', notes: '',
}
