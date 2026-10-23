export default {
  id: 'journey-goal', page: 'journey', title: 'บอกเป้าหมายให้ Agent Builder ช่วยร่าง',
  intro: 'บรรยายงานในแท็บ Describe 4 ขั้น',
  init: { screen: 'chat', tab: 'describe', created: false, f: { name: '', desc: '', instr: '' }, skills: [], msgs: [], dmsgs: [], draft: '', ddraft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'rail:agents', act: 'click', go: 'agents', tip: 'เปิดเมนู **Agents & Skills**' },
    { t: 'btn:new-agent', act: 'click', go: 'builder', tab: 'describe', tip: 'กด **New agent** แล้วเริ่มที่แท็บ **Describe**' },
    { t: 'describe:input', act: 'type', type: 'ช่วยพนักงานหน้างานตอบคำถามขั้นตอนงานจากไฟล์ SOP ที่แนบในแชท', tip: 'เขียนเป้าหมายประโยคเดียว: **ช่วยใคร ทำอะไร จากข้อมูลอะไร**' },
    { t: 'describe:send', act: 'click', dmsgs: [{ r: 'u', t: 'ช่วยพนักงานหน้างานตอบคำถามขั้นตอนงานจากไฟล์ SOP ที่แนบในแชท' }, { r: 'a', t: 'ร่างการตั้งค่าให้แล้ว: Name "ผู้ช่วยขั้นตอนงาน" · Description และ Instructions อยู่ในแท็บ Configure ให้ตรวจก่อนบันทึก' }], tip: 'ส่งข้อความ แล้ว**ตรวจร่างในแท็บ Configure** ทุกครั้ง' }
  ]
};
