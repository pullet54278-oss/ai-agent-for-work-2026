export default {
  id: 'journey-tools', page: 'journey', title: 'เปิดเฉพาะความสามารถที่ต้องใช้',
  intro: 'ตั้งค่า Capabilities 2 ขั้น',
  init: { screen: 'builder', tab: 'configure', created: true, f: { name: 'ผู้ช่วยขั้นตอนงาน', desc: 'ตอบคำถามวิธีปฏิบัติงานจากไฟล์ขั้นตอนงาน', instr: 'บทบาท: ผู้ช่วยอธิบายขั้นตอนงาน…' }, skills: [], msgs: [], sites: ['dld.go.th'], caps: [], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'cap:code', act: 'click', cap: 'code', tip: 'เปิด **Code interpreter** เพราะงานนี้ต้องนับและสรุปตัวเลขจากตาราง' },
    { t: 'cap:web', act: 'click', cap: 'web', tip: 'เปิด **Web search** เฉพาะเมื่อต้องใช้ข้อมูลสาธารณะล่าสุด · **Image generator ปิดไว้** เพราะงานไม่ต้องใช้' }
  ]
};
