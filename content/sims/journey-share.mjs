export default {
  id: 'journey-share', page: 'journey', title: 'แชร์ Agent ให้ทีมที่ใช้งานจริง',
  intro: 'แชร์แบบจำกัดก่อน 2 ขั้น',
  init: { screen: 'builder', tab: 'configure', created: true, shared: false, f: { name: 'ผู้ช่วยขั้นตอนงาน', desc: 'ตอบคำถามวิธีปฏิบัติงานจากไฟล์ขั้นตอนงาน', instr: 'บทบาท: ผู้ช่วยอธิบายขั้นตอนงาน…' }, skills: [], msgs: [], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'btn:share', act: 'click', set: { dialog: 'share' }, tip: 'กด **Share** เมื่อทดสอบผ่านแล้ว' },
    { t: 'share:people', act: 'click', set: { dialog: null, shared: true }, toast: 'แชร์ให้ทีมแล้ว', tip: 'เลือก **บางคนในองค์กร** (ทีมที่ทำงานนี้จริง) ก่อน · แชร์ทั้งองค์กรต้องผ่านผู้มีอำนาจอนุมัติ' }
  ]
};
