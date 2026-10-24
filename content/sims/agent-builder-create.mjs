// ฉากหน้าจอจำลอง: สร้าง Agent ใน Agent Builder (หน้า 19) · หน้าจอวาดใหม่เพื่อการเรียน ไม่ใช่ภาพหน้าจอจริง
const INSTR = `บทบาท: ผู้ช่วยอธิบายขั้นตอนงานให้พนักงานหน้างาน
เป้าหมาย: ตอบวิธีปฏิบัติงานให้ถูกตามเอกสาร
ข้อมูลนำเข้า: ไฟล์ขั้นตอนงานที่ผู้ใช้แนบในแชท
ขั้นตอน: อ่านไฟล์ → หาหัวข้อที่ตรง → ตอบเป็นขั้นตอน
รูปแบบผลลัพธ์: ข้อสั้นมีเลขข้อ + บรรทัดอ้างอิง
การตรวจสอบ: ตัวเลขและลำดับต้องตรงเอกสาร
ข้อห้าม: ห้ามแต่งข้อมูลที่ไม่มีในไฟล์
เมื่อไม่แน่ใจ: ตอบว่าไม่พบในเอกสาร แล้วถามกลับ`;
export default {
  id: 'agent-builder-create',
  page: 19,
  title: 'สร้าง Agent ใน Agent Builder',
  intro: 'ดูการสร้าง Copilot Agent ตั้งแต่เปิดเมนูจนทดสอบคำตอบ 11 ขั้น · กด "ลองกดเอง" เพื่อฝึกกดตามจุดที่มีวงแสง',
  init: { screen: 'chat', tab: 'describe', created: false, f: { name: '', desc: '', instr: '' }, skills: [], msgs: [], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'rail:agents', act: 'click', go: 'agents', tip: 'เปิด Copilot Chat แล้วเลือกเมนู **Agents & Skills** ทางซ้าย' },
    { t: 'btn:new-agent', act: 'click', go: 'builder', tab: 'describe', tip: 'กด **New agent** เพื่อเริ่มสร้าง Agent ใหม่' },
    { t: 'tab:configure', act: 'click', tab: 'configure', tip: 'เลือกแท็บ **Configure** เพื่อกรอกการตั้งค่าเอง (แท็บ Describe ใช้บรรยายให้ Agent Builder ช่วยร่าง)' },
    { t: 'field:name', act: 'type', type: 'ผู้ช่วยขั้นตอนงาน', tip: 'ตั้งชื่อ Agent · **Name ไม่เกิน 30 ตัวอักษร**' },
    { t: 'field:desc', act: 'type', type: 'ตอบคำถามวิธีปฏิบัติงานจากไฟล์ขั้นตอนงานที่แนบในแชท', tip: '**Description** บอกว่า Agent ทำอะไร ให้คนอื่นเข้าใจ (ไม่เกิน 1,000 ตัวอักษร)' },
    { t: 'field:instr', act: 'type', type: INSTR, tip: '**Instructions** เขียนตามโครง 8 ส่วน: บทบาท → เมื่อไม่แน่ใจ (ไม่เกิน 8,000 ตัวอักษร)' },
    { t: 'btn:create', act: 'click', set: { created: true }, toast: 'สร้าง Agent แล้ว', tip: 'กด **Create** เพื่อบันทึก Agent' },
    { t: 'tab:try', act: 'click', tab: 'try', tip: 'เปิดแท็บ **Try it** เพื่อทดสอบก่อนแชร์ให้คนอื่นใช้' },
    { t: 'try:attach', act: 'click', set: { attach: 'sop-biosecurity.pdf' }, tip: '**แนบไฟล์งานจริงในแชท** ตอนเรียกใช้ (บัญชีองค์กรเพิ่มไฟล์เป็น Knowledge ไม่ได้)' },
    { t: 'try:input', act: 'type', type: 'ก่อนเข้าโรงเรือนต้องทำอะไรบ้าง', tip: 'พิมพ์คำถามทดสอบที่คำตอบอยู่ในไฟล์' },
    { t: 'try:send', act: 'click', msgs: [{ r: 'u', t: 'ก่อนเข้าโรงเรือนต้องทำอะไรบ้าง', file: 'sop-biosecurity.pdf' }, { r: 'a', t: '1. ลงทะเบียนที่จุดรับรอง\n2. ยานพาหนะผ่านจุดพ่นน้ำยาฆ่าเชื้อทั้งคัน\n3. อาบน้ำ เปลี่ยนชุดและรองเท้า\n4. จุ่มเท้าและล้างมือก่อนเข้าโรงเรือน\nอ้างอิง: sop-biosecurity.pdf หัวข้อ 4' }], tip: 'ส่งคำถาม แล้ว**ตรวจคำตอบกับเอกสารทุกครั้ง** ก่อนนำไปใช้' }
  ]
};
