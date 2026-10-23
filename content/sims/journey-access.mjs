export default {
  id: 'journey-access', page: 'journey', title: 'ตรวจว่าบัญชีสร้าง Agent ได้',
  intro: 'ดูว่าเมนูสร้าง Agent พร้อมใช้ 3 ขั้น',
  init: { screen: 'chat', tab: 'describe', created: false, f: { name: '', desc: '', instr: '' }, skills: [], msgs: [], draft: '', attach: null, dialog: null, upload: false },
  steps: [
    { t: 'rail:agents', act: 'click', go: 'agents', tip: 'บัญชีที่มีสิทธิ์จะเห็นเมนู **Agents & Skills** · ถ้าไม่เห็น ให้ติดต่อผู้ดูแลระบบ' },
    { t: 'btn:new-agent', act: 'click', go: 'builder', tab: 'describe', tip: 'ปุ่ม **New agent** ใช้ได้ = บัญชีนี้สร้าง Agent ได้ตามนโยบายองค์กร' },
    { t: 'tab:configure', act: 'click', tab: 'configure', tip: 'ในแท็บ **Configure** Agent จะเห็นข้อมูลได้**เท่าที่ผู้ใช้แต่ละคนมีสิทธิ์**เท่านั้น' }
  ]
};
