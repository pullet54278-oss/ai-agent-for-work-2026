// ฉากหน้าจอจำลอง: เพิ่ม Skill (.zip) ให้ Agent (หน้าเสริม 21A) · ข้อมูลไฟล์ตรงกับตัวอย่าง sop-assistant.zip
export default {
  id: 'add-skill',
  page: 21.5,
  title: 'เพิ่ม Skill (.zip) ให้ Agent',
  intro: 'ดูการอัปโหลด sop-assistant.zip เป็น Skill แล้วทดสอบใน Try it 6 ขั้น · กด "ลองกดเอง" เพื่อฝึก',
  init: { screen: 'builder', tab: 'configure', created: true, f: { name: 'ผู้ช่วยขั้นตอนงาน', desc: 'ตอบคำถามวิธีปฏิบัติงานจากไฟล์ขั้นตอนงาน', instr: 'คำถามเรื่องขั้นตอนงาน ให้ใช้ Skill sop-assistant' }, skills: [], msgs: [], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'skills:add', act: 'click', set: { dialog: 'skill' }, tip: 'ในแท็บ **Configure** เลื่อนไปหัวข้อ **Skills** แล้วกด **Add**' },
    { t: 'dialog:file', act: 'click', set: { upload: true }, tip: 'อัปโหลด **ไฟล์ .zip ทั้งไฟล์** (ห้ามอัปโหลด SKILL.md เดี่ยว ๆ)' },
    { t: 'dialog:add', act: 'click', set: { dialog: null }, skill: 'sop-assistant', toast: 'เพิ่ม Skill แล้ว', tip: 'ตรวจชื่อ คำอธิบาย และไฟล์ที่ระบบอ่านได้ แล้วกด **Add**' },
    { t: 'tab:try', act: 'click', tab: 'try', tip: 'เปิดแท็บ **Try it** เพื่อลองคำขอที่ควรใช้ Skill นี้' },
    { t: 'try:input', act: 'type', type: 'ก่อนเข้าโรงเรือนต้องทำอะไรบ้าง', tip: 'พิมพ์คำถามที่ตรงกับ **description** ของ Skill' },
    { t: 'try:send', act: 'click', msgs: [{ r: 'u', t: 'ก่อนเข้าโรงเรือนต้องทำอะไรบ้าง' }, { r: 'a', skill: 'sop-assistant', t: '1. ลงทะเบียนที่จุดรับรอง ระบุสถานที่ที่ไปมาก่อนหน้า\n2. ยานพาหนะผ่านจุดพ่นน้ำยาฆ่าเชื้อ แล้วบันทึกเวลา\n3. อาบน้ำ เปลี่ยนชุดและรองเท้าของพื้นที่เลี้ยง\n4. จุ่มเท้าในอ่างน้ำยาและล้างมือก่อนเข้าโรงเรือน\nอ้างอิง: sop-biosecurity.pdf หัวข้อ 4' }], tip: 'ส่งคำถาม · Agent ใช้ **Skill sop-assistant** ตอบตามขั้นตอนใน SKILL.md' }
  ]
};
