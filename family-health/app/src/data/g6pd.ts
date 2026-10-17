// ที่มา: สมุดประจำตัวสำหรับผู้มีภาวะพร่องเอนไซม์ จี-6-พีดี (กระทรวงสาธารณสุข)
// รายการเป็นเพียงตัวอย่าง ไม่ครอบคลุมยาทุกตัว — ถ้าไม่พบ ห้ามสรุปว่าปลอดภัย

export type G6pdLevel = 'avoid' | 'caution' | 'food'

export interface G6pdItem {
  name: string
  group: string
  level: G6pdLevel
  aliases?: string[]
  note?: string
}

const avoid = (group: string, names: string[]): G6pdItem[] =>
  names.map((name) => ({ name, group, level: 'avoid' as const }))
const caution = (group: string, names: string[]): G6pdItem[] =>
  names.map((name) => ({ name, group, level: 'caution' as const }))

export const G6PD_ITEMS: G6pdItem[] = [
  ...avoid('ยาปฏิชีวนะกลุ่มควิโนโลน', ['ciprofloxacin', 'nalidixic acid', 'norfloxacin', 'ofloxacin']),
  ...avoid('ยาปฏิชีวนะกลุ่มซัลฟา', ['co-trimoxazole', 'sulfacetamide', 'sulfadimidine', 'sulfamethoxazole', 'sulfanilamide',
    'sulfapyridine', 'sulfasalazine', 'sulfisoxazole']),
  ...avoid('ยาปฏิชีวนะกลุ่มไนโตรฟูแรน', ['nitrofurantoin', 'nitrofurazone']),
  ...avoid('ยาปฏิชีวนะกลุ่มคลอแรม', ['chloramphenicol']),
  ...avoid('ยารักษาโรคเรื้อน', ['dapsone']),
  { name: 'primaquine', group: 'ยารักษามาลาเรีย', level: 'avoid',
    note: 'มาลาเรียชนิดไวแวกซ์อาจใช้ได้ด้วยความระมัดระวังเป็นพิเศษ · chloroquine / quinine ใช้ได้ในขนาดปกติเมื่อมีข้อบ่งชี้' },
  ...avoid('ยาเคมีบำบัด', ['doxorubicin']),
  ...avoid('ยาแก้ปวดระบบทางเดินปัสสาวะ', ['phenazopyridine']),
  ...avoid('Antimethemoglobinemic agent', ['methylene blue']),

  ...caution('ยาปฏิชีวนะกลุ่มซัลฟา', ['sulfadiazine', 'sulfaguanidine', 'sulfamerazine', 'sulfamethoxypyridazole']),
  ...caution('ยาปฏิชีวนะกลุ่มไนโตรฟูแรน', ['furazolidone']),
  ...caution('ยารักษาวัณโรค', ['isoniazid', 'para-aminosalicylic acid', 'streptomycin']),
  { name: 'aspirin', group: 'ยาแก้ปวด แก้ไข้', level: 'caution', aliases: ['แอสไพริน', 'acetylsalicylic acid'] },
  { name: 'dipyrone', group: 'ยาแก้ปวด แก้ไข้', level: 'caution', aliases: ['metamizole'] },
  ...caution('ยาแก้ปวด แก้ไข้', ['aminopyrine', 'phenacetin', 'phenazone', 'phenylbutazone', 'triaprofenic acid']),
  ...caution('ยากันชัก', ['phenytoin']),
  ...caution('ยาเบาหวาน', ['glibenclamide']),
  ...caution('ยาต้านพิษ', ['dimercaprol']),
  ...caution('ยาต้านฮีสตามีน (ยาแก้แพ้)', ['antazoline', 'diphenhydramine']),
  ...caution('ยาลดความดันโลหิต', ['hydralazine', 'methyldopa']),
  ...caution('ยารักษาโรคพาร์กินสัน', ['trihexyphenidyl']),
  ...caution('ยารักษาโรคหัวใจและหลอดเลือด', ['dopamine', 'procainamide', 'quinidine']),
  ...caution('ยารักษาโรคเก๊าท์', ['colchicine', 'probenecid']),
  { name: 'vitamin C (ขนาดสูง)', group: 'วิตามิน', level: 'caution', aliases: ['vitamin c', 'วิตามินซี', 'ascorbic acid'] },
  { name: 'vitamin K3 (menadione)', group: 'วิตามิน', level: 'caution', aliases: ['vitamin k3', 'menadione', 'วิตามินเค'],
    note: 'vitamin K1 (phytomenadione) มีความเสี่ยงน้อยกว่า' },

  { name: 'ถั่วปากอ้า', group: 'อาหาร', level: 'food', aliases: ['fava bean', 'broad bean'], note: 'โดยเฉพาะการรับประทานแบบดิบ' },
  { name: 'บลูเบอร์รี่', group: 'อาหาร', level: 'food', aliases: ['blueberry'] },
  { name: 'ไวน์แดง', group: 'อาหาร', level: 'food', aliases: ['red wine'] },
  { name: 'ลูกเหม็น', group: 'สารเคมี', level: 'food', aliases: ['naphthalene', 'แนฟทาลีน'] },
  { name: 'การบูร', group: 'สารเคมี', level: 'food', aliases: ['camphor'] },
  { name: 'พิมเสน', group: 'สารเคมี', level: 'food' },
  { name: 'Toluidine blue', group: 'สารเคมี (สารช่วยวินิจฉัย)', level: 'food' },
  { name: 'สารหนูชนิดอินทรีย์', group: 'สารเคมี', level: 'food', aliases: ['organic arsenic', 'arsenic', 'สารหนู'] },
]

export const G6PD_RULES = [
  'แจ้งให้แพทย์ทราบเสมอว่ามีภาวะพร่องเอนไซม์ G-6-PD',
  'เมื่อไม่สบาย ไม่ควรซื้อยาใช้เองโดยไม่ปรึกษาแพทย์หรือเภสัชกร',
  'ถ้าปัสสาวะเป็นสีดำหรือสีโค้ก ควรรีบไปโรงพยาบาลทันที',
  'หลีกเลี่ยงยา อาหาร หรือสารเคมีที่กระตุ้นให้เม็ดเลือดแดงแตก',
  'เมื่อจะมีบุตร ควรรับคำปรึกษาและแนะนำจากแพทย์',
]

const norm = (s: string) => s.toLowerCase().replace(/[\s\-_.]/g, '')

/** ค้นหาจากชื่อยาที่พิมพ์ (บางส่วนก็ได้ อย่างน้อย 3 ตัวอักษร) */
export function searchG6pd(query: string): G6pdItem[] {
  const q = norm(query)
  if (q.length < 3) return []
  return G6PD_ITEMS.filter((it) =>
    [it.name, ...(it.aliases ?? [])].some((n) => {
      const k = norm(n)
      return k.includes(q) || q.includes(k)
    }),
  )
}
