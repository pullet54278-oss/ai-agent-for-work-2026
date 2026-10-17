export type Relation = 'child' | 'father' | 'mother' | 'other'

export interface Family {
  id: string
  name: string
  members: string[]
  memberNames: Record<string, string>
  inviteCode: string
}

export interface Person {
  id: string
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

export const emptyPerson: Omit<Person, 'id'> = {
  nickname: '', fullName: '', relation: 'child', sex: '', birthDate: '', phone: '',
  bloodGroup: '', hospital: '', hn: '', g6pd: false, allergies: '', notes: '',
}

export const relationLabel: Record<Relation, string> = {
  child: 'ลูก', father: 'พ่อ', mother: 'แม่', other: 'อื่น ๆ',
}
