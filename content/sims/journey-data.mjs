export default {
  id: 'journey-data', page: 'journey', title: 'เพิ่มเว็บไซต์ Knowledge และแนบไฟล์ในแชท',
  intro: 'กำหนดแหล่งข้อมูล 3 ขั้น',
  init: { screen: 'builder', tab: 'configure', created: true, f: { name: 'ผู้ช่วยขั้นตอนงาน', desc: 'ตอบคำถามวิธีปฏิบัติงานจากไฟล์ขั้นตอนงาน', instr: 'บทบาท: ผู้ช่วยอธิบายขั้นตอนงาน…' }, skills: [], msgs: [], sites: [], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'knowledge:add', act: 'click', sites: ['dld.go.th', 'acfs.go.th'], tip: 'เพิ่ม**เว็บไซต์สาธารณะ**เป็น Knowledge ไม่เกิน 4 แหล่ง · URL ลึกไม่เกิน 2 ระดับ' },
    { t: 'tab:try', act: 'click', tab: 'try', tip: 'ไฟล์งานจริง**ไม่ใส่เป็น Knowledge** ให้แนบตอนใช้งานในแชท' },
    { t: 'try:attach', act: 'click', set: { attach: 'ขั้นตอนเข้าออกพื้นที่เลี้ยง.pdf' }, tip: 'กด**แนบไฟล์**ในแชท · Agent เห็นเฉพาะไฟล์ที่คุณเลือก' }
  ]
};
