export default {
  id: 'journey-result', page: 'journey', title: 'ทดสอบและรับผลงานเป็นไฟล์',
  intro: 'ทดสอบใน Try it 4 ขั้น',
  init: { screen: 'builder', tab: 'configure', created: true, f: { name: 'ผู้ช่วยขั้นตอนงาน', desc: 'ตอบคำถามวิธีปฏิบัติงานจากไฟล์ขั้นตอนงาน', instr: 'บทบาท: ผู้ช่วยอธิบายขั้นตอนงาน…' }, skills: [], msgs: [], caps: ['code'], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'tab:try', act: 'click', tab: 'try', tip: 'เปิดแท็บ **Try it**' },
    { t: 'try:attach', act: 'click', set: { attach: 'ขั้นตอนเข้าออกพื้นที่เลี้ยง.pdf' }, tip: 'แนบไฟล์ที่ใช้ตอบ (ตามผลการขออนุญาตที่สถานี 5)' },
    { t: 'try:input', act: 'type', type: 'สรุปขั้นตอนก่อนเข้าโรงเรือนเป็นเช็กลิสต์ไฟล์ Word', tip: 'ขอผลงานให้ชัด: **ทำอะไร + รูปแบบไฟล์**' },
    { t: 'try:send', act: 'click', msgs: [{ r: 'u', t: 'สรุปขั้นตอนก่อนเข้าโรงเรือนเป็นเช็กลิสต์ไฟล์ Word', file: 'ขั้นตอนเข้าออกพื้นที่เลี้ยง.pdf' }, { r: 'a', t: 'สร้างเช็กลิสต์ 6 ข้อจากหัวข้อ 4 ของเอกสารแล้ว · ตรวจลำดับขั้นตอนก่อนนำไปใช้', out: 'เช็กลิสต์ก่อนเข้าโรงเรือน.docx' }], tip: 'ได้ไฟล์ผลงาน → **ตรวจกับเอกสารต้นฉบับ**ก่อนส่งต่อ' }
  ]
};
