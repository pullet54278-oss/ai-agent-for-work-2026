/* Lesson content: stations, scripted demo scenes and Prompt Lab configs. All screen data is sample data. */
(() => {
  'use strict';
  const MK = window.MK, ic = MK.ic;

  // ---------- scene helpers ----------
  const W = (main, o = {}) => MK.win(
    (o.noSide ? '' : MK.side(o.side || {})) + `<main class="mk-main ${o.cls || ''}">${main}</main>${o.panel || ''}`,
    { title: o.title || 'ChatGPT' });
  const S = (active, title, body) => MK.win(MK.settings(active, title, body), { title: 'Settings' });
  const hero = t => `<div class="mk-hero">${t}</div>`;
  const PROJ = 'รายงานยอดขายรายสัปดาห์';
  const panel = (outs = '', srcs = '') => `<aside class="mk-panel"><div class="mk-ph">Outputs <span${' data-h="out-add"'}>${ic('plus', 13)}</span></div>${outs || '<small class="mk-muted">Create a file or site</small>'}
    <hr><div class="mk-ph">Sources <span data-h="src-add">${ic('plus', 13)}</span></div>${srcs || '<small class="mk-muted">Attach files or connect apps</small>'}</aside>`;
  const fileRow = (name, sub, id, icon = 'file') => `<div class="mk-file"${id ? ` data-h="${id}"` : ''}>${ic(icon)}<span>${name}<small>${sub}</small></span></div>`;
  const SRC = fileRow('ยอดขาย_W42.xlsx', 'Google Drive') + fileRow('เป้าหมาย_KPI_Q4.pdf', 'Library');
  const PLUS_MENU = (hot) => MK.menu([
    { t: 'Add photos & files', d: 'Upload from computer', icon: 'file', id: 'm-files' },
    { t: 'Add from library', d: 'Browse and search your files', icon: 'lib', id: 'm-lib', on: hot === 'm-lib' },
    { t: 'Create image', d: 'Visualize anything', icon: 'img' },
    { t: 'Add browser tabs', d: 'Use open tabs', icon: 'tab' },
    { t: 'Web search', d: 'Find real-time news and info', icon: 'globe' },
    { t: 'Work in a project', d: 'Start a chat in a project', icon: 'folder' }
  ], 'left:20px;bottom:86px;width:330px');
  const projHeader = (extra = '') => `<div class="mk-proj"><div class="mk-ptitle">${ic('folder', 20)} ${PROJ}</div><div class="mk-ptabs"><span class="on">Chats</span><span>Sources</span><span data-h="instr">Instructions</span></div>${extra}</div>`;
  const workComposer = (o = {}) => MK.composer({ ph: 'Work with ChatGPT', model: 'GPT-6 Sol High', ...o });

  // =====================================================================
  // LESSON 1 — สร้าง Agent ทำงานอัตโนมัติ (7 stations)
  // =====================================================================
  const L1 = {
    id: 'agent', n: 1, icon: '🤖', color: '#10a37f',
    title: 'สร้าง Agent ทำงานอัตโนมัติ',
    sub: 'ตั้งเป้าหมาย → ให้สิทธิ์ → ดึงข้อมูล → ใช้เครื่องมือ → ขออนุญาต → สร้างผลงาน → ส่งมอบและทำซ้ำเอง',
    minutes: 25,
    intro: 'บทนี้พาสร้าง Agent “รายงานยอดขายรายสัปดาห์” ตั้งแต่ศูนย์ ให้ ChatGPT Work ดึงไฟล์ เปิดเว็บ สร้างรายงาน ขออนุญาตในจุดเสี่ยง และส่งงานให้คุณตรวจ แล้วตั้งให้ทำซ้ำทุกสัปดาห์โดยอัตโนมัติ',
    stations: [
      {
        key: 'goal', icon: '🎯', title: 'ตั้งเป้าหมาย: สร้าง Project ให้ Agent',
        what: 'Project คือ “บ้านของงาน” — เก็บแชต ไฟล์ คำสั่ง และความจำของงานเดียวกันไว้ที่เดียว Agent จะกลับมาทำงานต่อได้โดยไม่ต้องอธิบายใหม่',
        points: ['ตั้งชื่อให้บอกผลลัพธ์ เช่น “รายงานยอดขายรายสัปดาห์”', 'เลือก <b>Project-only memory</b> เมื่อไม่อยากให้ข้อมูลงานนี้ปนกับแชตอื่น (แต่งานบน cloud จะใช้ไม่ได้)', 'เขียน Instructions: เป้าหมาย ขอบเขต ข้อห้าม และเกณฑ์ “เสร็จ”'],
        steps: [
          { scene: () => W(`${MK.toggleCW('Work')}${hero('🤖 What should we work on?')}${workComposer()}`), hot: 'proj-add', tip: 'กดปุ่ม <b>+</b> ข้างหัวข้อ <b>Projects</b> ในแถบซ้าย' },
          { scene: () => W(hero('🤖 What should we work on?') + MK.modal('Create project', `<label>Project name</label><div class="mk-input" data-h="pname">${ic('folder')} <span data-type></span><em>Copenhagen Trip</em></div><div class="mk-note">💡 Projects keep chats, files, and custom instructions in one place.</div><div class="mk-mf">${MK.select('Default memory', 'mem')}<span class="mk-gap"></span>${MK.btn('Create project', '', 'dim')}</div>`)), hot: 'pname', typeText: PROJ, tip: 'ตั้งชื่อโปรเจกต์ให้บอกผลลัพธ์ที่ต้องการ' },
          { scene: () => W(hero('🤖 What should we work on?') + MK.modal('Create project', `<label>Project name</label><div class="mk-input">${ic('folder')} ${PROJ}</div><div class="mk-note">💡 Projects keep chats, files, and custom instructions in one place.</div><div class="mk-mf">${MK.select('Default memory', 'mem')}<span class="mk-gap"></span>${MK.btn('Create project', '', 'dark')}</div>`) + MK.menu([{ t: 'Default memory', d: 'ใช้ความจำร่วมกับแชตอื่นได้ทั้งสองทาง', check: true, id: 'mem-def' }, { t: 'Project-only memory', d: 'เห็นเฉพาะความจำของโปรเจกต์นี้ · งานบน cloud ใช้ไม่ได้', id: 'mem-only' }], 'left:250px;top:300px;width:360px')), hot: 'mem-only', tip: 'เลือก <b>Project-only memory</b> เพื่อแยกข้อมูลงานนี้ออกจากแชตส่วนตัว' },
          { scene: () => W(hero('🤖 What should we work on?') + MK.modal('Create project', `<label>Project name</label><div class="mk-input">${ic('folder')} ${PROJ}</div><div class="mk-note">💡 Projects keep chats, files, and custom instructions in one place.</div><div class="mk-mf">${MK.select('Project-only memory', '')}<span class="mk-gap"></span>${MK.btn('Create project', 'create', 'dark')}</div>`)), hot: 'create', tip: 'กด <b>Create project</b>' },
          { scene: () => W(projHeader(`<div class="mk-empty">ยังไม่มีแชต — เริ่มจากเขียน Instructions ให้ Agent</div>`) + workComposer(), { side: { newProj: PROJ } }), hot: 'instr', tip: 'เปิดแท็บ <b>Instructions</b> เพื่อบอกกติกาการทำงานถาวรของโปรเจกต์' },
          { scene: () => W(projHeader() + MK.modal('Project instructions', `<div class="mk-area" data-h="itext"><span data-type></span><em>บอก ChatGPT ว่าโปรเจกต์นี้ทำงานอย่างไร…</em></div><div class="mk-mf"><span class="mk-gap"></span>${MK.btn('Save', '', 'dark')}</div>`, 'width:560px'), { side: { newProj: PROJ } }), hot: 'itext', typeText: 'เป้าหมาย: สรุปยอดขายรายสัปดาห์ให้ผู้จัดการ 1 หน้า + ไฟล์ Excel\nข้อมูลหลัก: ไฟล์ใน Sources และ dashboard ยอดขาย\nห้าม: แก้ไฟล์ต้นฉบับ, ส่งอีเมลเอง\nเสร็จเมื่อ: ตัวเลขตรงต้นฉบับ แยก Fact/Assumption/Need Data', tip: 'เขียน <b>เป้าหมาย · ข้อมูลหลัก · ข้อห้าม · เกณฑ์เสร็จ</b> — นี่คือ “สัญญางาน” ของ Agent' }
        ]
      },
      {
        key: 'perm', icon: '🔐', title: 'ตั้งสิทธิ์ให้ทำงานเองได้อย่างปลอดภัย',
        what: 'ก่อนปล่อยให้ Agent ทำงานอัตโนมัติ ต้องกำหนดว่า “ทำเองได้ / ต้องถามก่อน / ห้ามทำ” ผ่าน Settings 3 หน้า: Cloud computer, Plugins และ Computer use',
        points: ['<b>Always ask</b> ปลอดภัยสุดแต่ต้องคอยกด · <b>Auto approve</b> ให้ระบบตัดสินตามความเสี่ยง · <b>Always allow</b> (สีส้ม) เสี่ยงสุด', 'Plugins ตั้งค่าเริ่มต้นเป็น <b>Allow low-risk tools</b> แล้วค่อยเพิ่มสิทธิ์รายตัว', 'Computer use เปิดเฉพาะแอปที่งานนี้ต้องใช้ (least privilege)'],
        steps: [
          { scene: () => S('Cloud computer', 'Cloud computer', `<p class="mk-muted">Manage cloud browsing settings and saved website cookies</p><div class="mk-card">${MK.row('ChatGPT Work cookies', 'Manage cookies used by ChatGPT Work', ic('down', 14))}${MK.row('ChatGPT Work website approvals', 'Choose whether ChatGPT Work asks before opening websites.', MK.select('Always ask', 'appr'))}</div><div class="mk-row"><div><b>Website permissions</b><small>Add sites to override the default permission</small></div>${MK.btn('Add website', 'addsite')}</div>`), hot: 'appr', tip: 'Settings › <b>Cloud computer</b> › เปิดตัวเลือก <b>website approvals</b>' },
          { scene: () => S('Cloud computer', 'Cloud computer', `<p class="mk-muted">Manage cloud browsing settings and saved website cookies</p><div class="mk-card">${MK.row('ChatGPT Work cookies', 'Manage cookies used by ChatGPT Work', ic('down', 14))}${MK.row('ChatGPT Work website approvals', 'Choose whether ChatGPT Work asks before opening websites.', MK.select('Always ask', 'appr'))}</div>`) + MK.menu([{ t: 'Always ask', d: 'Ask before ChatGPT opens a website', check: true }, { t: 'Auto approve', d: 'Automatically approve or deny actions based on their risk', id: 'auto' }, { t: 'Always allow', d: 'Let ChatGPT open websites without asking', warn: true }], 'right:40px;top:230px;width:360px'), hot: 'auto', tip: 'เลือก <b>Auto approve</b> — ระบบอนุมัติงานเสี่ยงต่ำเอง และถามคุณเมื่อเสี่ยงสูง' },
          { scene: () => S('Plugins', 'Plugins', `<div class="mk-card">${MK.row('Default permission', '', MK.select('Allow low-risk tools', 'defperm'))}</div><div class="mk-card">${[['Google Drive', 'Drive, Docs, Sheets or Slides', 'Allow low-risk tools'], ['Gmail', 'Read and manage Gmail', 'Ask before acting'], ['Canva', 'Create, review, edit designs', 'Allow all tools']].map(([a, b, c]) => MK.row(a, b, `<span class="mk-muted">${c} ›</span>`)).join('')}</div>`), hot: 'defperm', tip: 'Settings › <b>Plugins</b> — ค่าเริ่มต้น <b>Allow low-risk tools</b> แล้วปรับรายตัว เช่น Gmail ให้ถามก่อน' },
          { scene: () => S('Computer use', 'Computer use', `<p class="mk-muted">Manage how ChatGPT uses other applications on your computer</p><div class="mk-card">${MK.row('Any App', 'Let ChatGPT control apps on your computer', MK.toggle(false))}${MK.row('Google Chrome', '● Browser extension installed', MK.toggle(false, 'cu-chrome'))}${MK.row('Microsoft Excel', 'Use Microsoft Excel add-in for additional control', MK.toggle(true))}</div><div class="mk-sh2">Always-allowed apps</div><div class="mk-card mk-center mk-muted">None yet</div>`), hot: 'cu-chrome', tip: 'Settings › <b>Computer use</b> — เปิดเฉพาะ <b>Chrome</b> และ <b>Excel</b> ที่งานนี้ใช้ ปล่อย Any App ปิดไว้' }
        ]
      },
      {
        key: 'data', icon: '📂', title: 'ดึงข้อมูล: แนบไฟล์และเชื่อมแหล่งข้อมูล',
        what: 'Agent ทำงานดีเท่าข้อมูลที่ได้รับ ให้แนบเฉพาะไฟล์ที่เป็น “source of truth” และเชื่อมแอปที่จำเป็นผ่าน Sources',
        points: ['เมนู <b>+</b> › Add from library / Add photos & files', 'แผงขวา <b>Sources</b> เก็บไฟล์และแอปที่เชื่อมไว้ให้ทุกแชตในโปรเจกต์', 'อย่าแนบข้อมูลลับเกินจำเป็น'],
        steps: [
          { scene: () => W(projHeader() + workComposer() + PLUS_MENU(), { side: { newProj: PROJ }, panel: panel() }), hot: 'm-lib', tip: 'กด <b>+</b> ในช่องพิมพ์ › <b>Add from library</b>' },
          { scene: () => W(projHeader() + MK.modal('Add from library', `<div class="mk-input">${ic('lib')} ค้นหาไฟล์</div>${[['ยอดขาย_W42.xlsx', 'Google Drive · แก้ไข 2 ชม.ที่แล้ว', 1], ['เป้าหมาย_KPI_Q4.pdf', 'Uploaded', 1], ['รูปทีมงาน.jpg', 'Uploaded', 0]].map(([a, b, on], i) => `<div class="mk-pick${on ? ' on' : ''}">${ic(on ? 'check' : 'file', 14)}<span>${a}<small>${b}</small></span></div>`).join('')}<div class="mk-mf"><span class="mk-gap"></span>${MK.btn('Attach 2 files', 'attach', 'dark')}</div>`, 'width:480px'), { side: { newProj: PROJ }, panel: panel() }), hot: 'attach', tip: 'เลือกเฉพาะไฟล์ที่ต้องใช้ แล้วกด <b>Attach</b>' },
          { scene: () => W(projHeader() + workComposer({ chips: `<div class="mk-chips"><span>${ic('file', 12)} ยอดขาย_W42.xlsx</span><span>${ic('file', 12)} เป้าหมาย_KPI_Q4.pdf</span></div>` }), { side: { newProj: PROJ }, panel: panel('', SRC + `<div class="mk-file" data-h="drive">${ic('globe')}<span>เชื่อม Google Drive<small>Connect app</small></span></div>`) }), hot: 'drive', tip: 'ไฟล์ขึ้นใน <b>Sources</b> แล้ว — เชื่อม <b>Google Drive</b> เพื่อให้ Agent ดึงไฟล์สัปดาห์ถัดไปได้เอง' }
        ]
      },
      {
        key: 'tools', icon: '🛠️', title: 'สั่งงานและเรียกใช้เครื่องมือ',
        what: 'พิมพ์ <code>@</code> เพื่อเรียกเครื่องมือ เช่น Chrome, Computer, Google Drive แล้วเขียนคำสั่งที่บอกผลลัพธ์ ข้อมูล และข้อห้ามให้ครบ',
        points: ['<code>@Chrome</code> ให้ Agent เปิดและอ่านเว็บในเบราว์เซอร์ของคุณ', '<code>@Computer</code> ควบคุมแอปบน Windows', 'Agent จะแตกงานเป็นขั้นตอนและแสดงความคืบหน้าให้ดู'],
        steps: [
          { scene: () => W(projHeader() + MK.menu([{ t: 'Add photos & files', d: 'Upload from computer', icon: 'file' }, '-', { t: 'Chrome', d: 'Browse with ChatGPT', icon: 'globe', id: 'at-chrome' }, { t: 'Computer', d: 'Control Windows apps', icon: 'pc' }, { t: 'Google Drive', d: 'Drive, Docs, Sheets', icon: 'lib' }, { t: 'Create image', d: 'Visualize anything', icon: 'img' }], 'left:20px;bottom:86px;width:330px') + workComposer({ text: '@c' }), { side: { newProj: PROJ }, panel: panel('', SRC) }), hot: 'at-chrome', tip: 'พิมพ์ <b>@</b> แล้วเลือก <b>Chrome</b> จากหมวด Plugins' },
          { scene: () => W(projHeader() + workComposer({ text: '', ph: '' , chips: `<div class="mk-chips"><span class="g">${ic('globe', 12)} Chrome</span></div>` }), { side: { newProj: PROJ }, panel: panel('', SRC) }), hot: 'input', typeText: 'เปิด dashboard ยอดขาย ดึงยอดสัปดาห์นี้ รวมกับไฟล์ใน Sources แล้วสร้างรายงาน Excel + สรุป 1 หน้า · ห้ามแก้ไฟล์ต้นฉบับ ห้ามส่งอีเมล', tip: 'เขียนคำสั่ง: <b>ทำอะไร · ใช้ข้อมูลไหน · ได้ผลลัพธ์อะไร · ห้ามอะไร</b>' },
          { scene: () => W(projHeader(MK.bubble('@Chrome เปิด dashboard ยอดขาย ดึงยอดสัปดาห์นี้ … ห้ามแก้ไฟล์ต้นฉบับ ห้ามส่งอีเมล') + `<div class="mk-muted mk-wf">Working for 8s</div>` + MK.steps(['อ่านไฟล์ใน Sources', 'เปิด Chrome › dashboard ยอดขาย', 'ดึงตัวเลขสัปดาห์ที่ 42', 'สร้างไฟล์ Excel', 'เขียนสรุป 1 หน้า'], 1)) + workComposer({ send: 'stop' }), { side: { newProj: PROJ }, panel: panel('', SRC) }), hot: 'send', tip: 'Agent แตกงานเป็นขั้นตอนเอง — ปุ่ม <b>■</b> ใช้หยุดได้ทุกเมื่อ' }
        ]
      },
      {
        key: 'approve', icon: '✋', title: 'ขออนุญาต: คุณคือผู้ตัดสินใจ',
        what: 'เมื่อ Agent จะทำสิ่งที่มีความเสี่ยง เช่น ใช้เบราว์เซอร์ของคุณ หรือส่งข้อความออกไปข้างนอก จะหยุดและถามก่อน ลองเลือกเองว่าจะตอบอย่างไร',
        points: ['<b>Allow once</b> — ปลอดภัยที่สุดสำหรับงานที่ยังไม่คุ้น', '<b>Always allow</b> — สะดวก แต่ Agent จะไม่ถามอีก ใช้กับงานที่ไว้ใจแล้วเท่านั้น', '<b>Deny</b> — เมื่อคำขอไม่ตรงกับงานที่สั่ง หรือสงสัย prompt injection'],
        steps: [
          { scene: () => W(projHeader(`<div class="mk-muted mk-wf">Working for 14s</div>` + MK.steps(['อ่านไฟล์ใน Sources', 'เปิด Chrome › dashboard ยอดขาย'], 1) + MK.approval({ app: 'Chrome', q: 'Allow ChatGPT to use your Chrome?', d: 'ChatGPT can read your open tabs and take actions in them to help complete your tasks.' })) + workComposer({ send: 'stop' }), { side: { newProj: PROJ } }),
            tip: 'Agent ขอใช้ Chrome ของคุณ — คุณจะตอบอย่างไร?',
            choices: [
              { h: 'once', label: 'Allow once', level: 'good', result: 'ยอดเยี่ยม! อนุญาตเฉพาะครั้งนี้ ครั้งหน้าจะถามอีก เหมาะกับงานใหม่ ก่อนกดให้ปิดแท็บธนาคารหรือข้อมูลลับก่อน' },
              { h: 'always', label: 'Always allow', level: 'warn', result: 'สะดวกแต่เสี่ยง — Agent จะเห็นและกระทำในแท็บที่เปิดอยู่โดยไม่ถามอีก ใช้เมื่อไว้ใจงานนี้แล้วเท่านั้น' },
              { h: 'deny', label: 'Deny', level: 'neutral', result: 'Agent จะหยุดและหาทางอื่น หรือรายงานว่าทำต่อไม่ได้ — เหมาะเมื่อคำขอไม่ตรงกับงานที่สั่ง' }
            ] },
          { scene: () => W(projHeader(`<div class="mk-muted mk-wf">Working for 1m 10s</div>` + MK.steps(['ดึงตัวเลขสัปดาห์ที่ 42', 'สร้างไฟล์ Excel', 'ส่งอีเมลสรุปถึงผู้จัดการ'], 2) + MK.approval({ icon: 'bell', app: 'Gmail', q: 'Send email to manager@company.co.th?', d: 'Subject: รายงานยอดขาย W42 · Attachment: weekly-sales-W42.xlsx' })) + workComposer({ send: 'stop' }), { side: { newProj: PROJ } }),
            tip: 'Agent จะ “ส่งอีเมล” ทั้งที่คำสั่งเขียนว่าห้ามส่ง — คุณจะตอบอย่างไร?',
            choices: [
              { h: 'deny', label: 'Deny', level: 'good', result: 'ถูกต้อง! คำขอนี้ขัดกับข้อห้ามที่ตั้งไว้ ให้ Agent บันทึกเป็นฉบับร่างแทน แล้วคุณตรวจและส่งเอง' },
              { h: 'once', label: 'Allow once', level: 'warn', result: 'อีเมลจะถูกส่งจริงทันทีโดยคุณยังไม่ได้ตรวจตัวเลข — การสื่อสารภายนอกควรผ่านการตรวจของคนเสมอ' },
              { h: 'always', label: 'Always allow', level: 'bad', result: 'เสี่ยงมาก — ต่อไป Agent จะส่งอีเมลได้เองทุกครั้ง ขัดกับหลัก Human approval' }
            ] }
        ]
      },
      {
        key: 'output', icon: '📊', title: 'สร้างผลงานและตรวจก่อนรับ',
        what: 'ผลงานจะขึ้นในแผง <b>Outputs</b> เปิด Preview เพื่อตรวจตัวเลข หน่วย และภาษาไทย ก่อนรับงาน',
        points: ['ขอไฟล์ที่แก้ไขได้ (xlsx, docx, pptx) ไม่ใช่ภาพทั้งหน้า', 'ตรวจว่า Agent แยก Fact / Assumption / Need Data', 'ถ้าไม่ผ่าน ให้รวม Feedback แล้วสั่งแก้ครั้งเดียว'],
        steps: [
          { scene: () => W(projHeader(`<div class="mk-muted mk-wf">Working for 1m 52s</div>` + MK.steps(['อ่านไฟล์ใน Sources', 'เปิด Chrome › dashboard ยอดขาย', 'ดึงตัวเลขสัปดาห์ที่ 42', 'สร้างไฟล์ Excel', 'เขียนสรุป 1 หน้า', 'ตรวจตัวเลขกับต้นฉบับ'], 4)) + workComposer({ send: 'stop' }), { side: { newProj: PROJ }, panel: panel(fileRow('weekly-sales-W42.xlsx', 'กำลังสร้าง…', '', 'file'), SRC) }), hot: 'out-add', tip: 'ระหว่างทำงาน ไฟล์จะเริ่มปรากฏใน <b>Outputs</b>' },
          { scene: () => W(projHeader(`<div class="mk-muted mk-wf">Worked for 2m 31s</div>` + MK.steps(['อ่านไฟล์ใน Sources', 'เปิด Chrome › dashboard ยอดขาย', 'ดึงตัวเลขสัปดาห์ที่ 42', 'สร้างไฟล์ Excel', 'เขียนสรุป 1 หน้า', 'ตรวจตัวเลขกับต้นฉบับ'], 6)) + workComposer(), { side: { newProj: PROJ }, panel: panel(fileRow('weekly-sales-W42.xlsx', 'Spreadsheet · 3 sheets', 'out-file') + fileRow('summary-W42.docx', 'Document · 1 page'), SRC) }), hot: 'out-file', tip: 'งานเสร็จ — กดไฟล์ใน <b>Outputs</b> เพื่อเปิด Preview' },
          { scene: () => W(`<div class="mk-preview"><div class="mk-ptitle">${ic('file', 18)} weekly-sales-W42.xlsx <span class="mk-tag">ข้อมูลตัวอย่าง</span></div>
              <table><tr><th>ภูมิภาค</th><th>ยอดขาย (บาท)</th><th>เทียบเป้า</th><th>สถานะข้อมูล</th></tr>
              <tr><td>ภาคกลาง</td><td>1,240,000</td><td>104%</td><td><span class="mk-b f">Fact</span></td></tr>
              <tr><td>ภาคเหนือ</td><td>860,000</td><td>92%</td><td><span class="mk-b f">Fact</span></td></tr>
              <tr><td>ภาคใต้</td><td>~700,000</td><td>—</td><td><span class="mk-b a">Assumption</span></td></tr>
              <tr><td>ภาคตะวันออก</td><td>?</td><td>?</td><td><span class="mk-b n">Need Data</span></td></tr></table>
              <div class="mk-mf"><span class="mk-muted">Agent แจ้ง: ไม่พบยอดภาคตะวันออกใน dashboard</span><span class="mk-gap"></span>${MK.btn('ตรวจผ่าน ✓', 'verify', 'dark')}</div></div>`, { side: { newProj: PROJ } }), hot: 'verify', tip: 'ตรวจว่าตัวเลขมีที่มา และ Agent บอกข้อมูลที่ขาด (<b>Need Data</b>) แทนการเดา' }
        ]
      },
      {
        key: 'deliver', icon: '🚀', title: 'ส่งมอบ และตั้งให้ทำซ้ำอัตโนมัติ',
        what: 'เมื่อจบงาน ChatGPT แจ้ง <b>Turn complete</b> จากนั้นตั้ง <b>Scheduled</b> ให้ Agent ทำงานเดิมทุกสัปดาห์โดยไม่ต้องสั่งใหม่',
        points: ['เปิดแจ้งเตือน Settings › Notifications › <b>Tasks</b> และ <b>Responses</b>', 'Scheduled รองรับ Daily / Weekly / Monitoring', 'ทบทวน Activity และผลลัพธ์เป็นระยะ อย่าปล่อยแล้วลืม'],
        steps: [
          { scene: () => W(projHeader(`<div class="mk-muted mk-wf">Worked for 2m 31s</div>` + MK.bubble('สร้างรายงานเสร็จแล้ว: <b>weekly-sales-W42.xlsx</b> และสรุป 1 หน้า · ยอดภาคตะวันออกยังขาด (Need Data) · ไม่ได้ส่งอีเมลตามข้อห้าม', 'bot')) + workComposer() + `<div class="mk-toast" data-h="toast"><b>${ic('check', 14)} Turn complete</b><small>ChatGPT finished a turn.</small><div class="mk-input">Reply to ChatGPT</div></div>`, { side: { newProj: PROJ } }), hot: 'toast', tip: 'ป๊อปอัป <b>Turn complete</b> แจ้งว่างานเสร็จ — คุณตอบกลับจากตรงนี้ได้ทันที' },
          { scene: () => W(`<div class="mk-page"><h3>Scheduled</h3><p class="mk-muted">Ask ChatGPT to schedule tasks, set reminders, or monitor for updates</p>${MK.composer({ ph: 'Schedule a task', send: 'up' })}
              ${[['🔄', 'ติดตามข่าว AI รายวัน', 'Daily · Next run in 23 hours'], ['🔔', 'เฝ้าดูประกาศกฎระเบียบ', 'Monitoring · Next run in 1 hour']].map(([e, a, b]) => `<div class="mk-task">${e}<span>${a}<small>${b}</small></span></div>`).join('')}</div>`, { side: { active: 'sched', newProj: PROJ } }), hot: 'input', typeText: 'ทุกวันจันทร์ 08:00 ทำรายงานยอดขายสัปดาห์ก่อนในโปรเจกต์ “รายงานยอดขายรายสัปดาห์” แล้วแจ้งเตือนฉัน', tip: 'เปิด <b>Scheduled</b> แล้วพิมพ์ว่า “ทำอะไร · เมื่อไร · ในโปรเจกต์ไหน · แจ้งอย่างไร”' },
          { scene: () => W(`<div class="mk-page"><h3>Scheduled</h3><p class="mk-muted">Ask ChatGPT to schedule tasks, set reminders, or monitor for updates</p>${MK.composer({ ph: 'Schedule a task', send: 'up' })}
              <div class="mk-task new" data-h="task-new">📊<span>รายงานยอดขายรายสัปดาห์<small>Weekly · Mon 08:00 · Next run in 3 days</small></span></div>
              ${[['🔄', 'ติดตามข่าว AI รายวัน', 'Daily · Next run in 23 hours'], ['🔔', 'เฝ้าดูประกาศกฎระเบียบ', 'Monitoring · Next run in 1 hour']].map(([e, a, b]) => `<div class="mk-task">${e}<span>${a}<small>${b}</small></span></div>`).join('')}</div>`, { side: { active: 'sched', newProj: PROJ } }), hot: 'task-new', tip: '🎉 Agent พร้อมทำงานเองทุกสัปดาห์ — คุณเหลือหน้าที่ <b>ตรวจรับ</b> เท่านั้น' }
        ]
      }
    ],
    lab: {
      title: 'Prompt Lab: ออกแบบ Agent ของคุณ',
      fields: [
        { k: 'name', label: 'ชื่อ Agent / Project', ph: 'เช่น รายงานยอดขายรายสัปดาห์', def: 'รายงานยอดขายรายสัปดาห์' },
        { k: 'goal', label: 'เป้าหมาย (ผลลัพธ์ที่ต้องการ)', ph: 'เช่น สรุป 1 หน้า + ไฟล์ Excel ให้ผู้จัดการ', def: 'สรุปยอดขาย 1 หน้า + ไฟล์ Excel ให้ผู้จัดการฝ่ายขาย' },
        { k: 'data', label: 'แหล่งข้อมูล', ph: 'ไฟล์ / แอป / เว็บ', def: 'ไฟล์ใน Sources, Google Drive โฟลเดอร์ “ยอดขาย”, dashboard ยอดขาย' },
        { k: 'tools', label: 'เครื่องมือที่ใช้', type: 'multi', options: ['@Chrome', '@Computer', 'Google Drive', 'Gmail (ร่างเท่านั้น)', 'Excel', 'Web search'], def: ['@Chrome', 'Google Drive', 'Excel'] },
        { k: 'perm', label: 'ระดับการอนุมัติ', type: 'select', options: ['Always ask', 'Auto approve', 'Always allow'], def: 'Auto approve' },
        { k: 'deny', label: 'ข้อห้าม', ph: 'สิ่งที่ห้าม Agent ทำ', def: 'ห้ามแก้ไฟล์ต้นฉบับ ห้ามส่งอีเมลหรือข้อความออกภายนอก ห้ามลบข้อมูล' },
        { k: 'sched', label: 'ทำซ้ำอัตโนมัติ', type: 'select', options: ['ไม่ต้องทำซ้ำ', 'ทุกวัน 08:00', 'ทุกวันจันทร์ 08:00', 'เฝ้าดู (Monitoring) และแจ้งเมื่อมีการเปลี่ยนแปลง'], def: 'ทุกวันจันทร์ 08:00' }
      ],
      build: v => `คุณคือ Agent ของโปรเจกต์ “${v.name}”

เป้าหมาย: ${v.goal}
แหล่งข้อมูลหลัก: ${v.data}
เครื่องมือที่อนุญาต: ${(v.tools || []).join(', ') || '-'}
ระดับการอนุมัติ: ${v.perm}

ขั้นตอนการทำงาน:
1) สรุปความเข้าใจและแผนงานสั้น ๆ ก่อนลงมือ
2) ดึงข้อมูลจากแหล่งที่ระบุเท่านั้น
3) ใช้เครื่องมือตามลำดับ และแสดงความคืบหน้า
4) ขออนุญาตก่อนทำสิ่งที่มีผลภายนอก
5) สร้างผลงานเป็นไฟล์ที่แก้ไขได้
6) ตรวจตัวเลขกับต้นฉบับ แยก Fact / Assumption / Need Data
7) ส่งมอบพร้อมสรุปสิ่งที่ทำและสิ่งที่ยังขาด

ข้อห้าม: ${v.deny}
ห้ามรายงานว่าสำเร็จหากยังไม่ได้ตรวจไฟล์จริง
${v.sched && v.sched !== 'ไม่ต้องทำซ้ำ' ? `\nตั้งเวลา: ${v.sched} ทำงานนี้ซ้ำในโปรเจกต์นี้ แล้วแจ้งเตือนฉันเมื่อเสร็จ` : ''}`,
      sim: v => [`📁 เปิดโปรเจกต์ “${v.name}”`, '📋 วางแผน 7 ขั้นตอน', `📂 อ่าน: ${String(v.data).split(',')[0]}`, ...(v.tools || []).slice(0, 3).map(t => `🛠️ ใช้ ${t}`), v.perm === 'Always ask' ? '✋ ถามคุณก่อนทุกการกระทำ' : '✋ ขออนุญาตในขั้นที่เสี่ยง', '📊 สร้างไฟล์ผลงาน', '✅ ตรวจและส่งมอบ'],
      risk: v => {
        const r = [];
        if (v.perm === 'Always allow') r.push('Always allow: Agent จะไม่ถามก่อนเปิดเว็บหรือกระทำ — เสี่ยงสูง');
        if (!/ห้าม/.test(v.deny || '')) r.push('ยังไม่มีข้อห้าม — ควรระบุสิ่งที่ห้ามทำอย่างน้อย 1 ข้อ');
        if ((v.tools || []).includes('@Computer')) r.push('@Computer ควบคุมแอปในเครื่องได้ — จำกัดขอบเขตให้ชัด');
        return r;
      }
    },
    quiz: [
      ['Agent จะขอส่งอีเมล ทั้งที่คำสั่งเขียนว่า “ห้ามส่งอีเมล” ควรทำอย่างไร?', ['Always allow', 'Allow once', 'Deny แล้วให้บันทึกเป็นร่าง'], 2],
      ['ตัวเลือกใดเหมาะเมื่อไม่อยากให้ข้อมูลโปรเจกต์ปนกับแชตอื่น?', ['Default memory', 'Project-only memory', 'ปิด Memory ทั้งบัญชี'], 1],
      ['ค่าเริ่มต้นที่แนะนำสำหรับ Plugins คือ?', ['Allow all tools', 'Allow low-risk tools', 'Always allow'], 1]
    ],
    check: ['สร้าง Project และเขียน Instructions (เป้าหมาย/ข้อมูล/ข้อห้าม/เกณฑ์เสร็จ)', 'ตั้ง website approvals เป็น Auto approve หรือ Always ask', 'เปิด Computer use เฉพาะแอปที่จำเป็น', 'แนบเฉพาะไฟล์ที่เป็น source of truth', 'ตอบคำขออนุญาตอย่างมีเหตุผล', 'ตรวจผลงาน Fact / Assumption / Need Data', 'ตั้ง Scheduled และเปิดแจ้งเตือน']
  };

  // =====================================================================
  // LESSON 2 — Projects
  // =====================================================================
  const L2 = {
    id: 'projects', n: 2, icon: '📁', color: '#3b82f6', title: 'Projects: บ้านของงานต่อเนื่อง', minutes: 12,
    sub: 'สร้างโปรเจกต์ เลือกความจำ ใส่ไฟล์และคำสั่ง ย้ายแชตเข้าโปรเจกต์',
    intro: 'Projects เก็บแชต ไฟล์ และ Instructions ของงานเดียวกันไว้ด้วยกัน เหมาะกับงานต่อเนื่อง เช่น หลักสูตรอบรม งานตรวจมาตรฐาน หรือการทำเว็บไซต์',
    stations: [{
      key: 'p', icon: '📁', title: 'สร้างและจัดการ Project',
      what: 'ทำตามเดโมเพื่อสร้างโปรเจกต์ เลือกความจำ และย้ายแชตเก่าเข้ามาไว้ในโปรเจกต์',
      points: ['<b>Default memory</b> — ใช้ความจำร่วมกับแชตอื่นได้ทั้งสองทาง', '<b>Project-only memory</b> — เห็นเฉพาะความจำของโปรเจกต์ งานบน cloud ใช้ไม่ได้', 'เมนู “…” ของแชต › <b>Move to project</b> ใช้ย้ายแชตเข้าโปรเจกต์'],
      steps: [
        { scene: () => W(`${MK.toggleCW('Chat')}${hero('Where should we begin?')}${MK.composer()}`) + '', hot: 'proj-add', tip: 'กด <b>+</b> ข้าง Projects' },
        { scene: () => W(hero('Where should we begin?') + MK.modal('Create project', `<label>Project name</label><div class="mk-input" data-h="pname">${ic('folder')} <span data-type></span><em>Copenhagen Trip</em></div><div class="mk-mf">${MK.select('Default memory', 'mem')}<span class="mk-gap"></span>${MK.btn('Create project', '', 'dim')}</div>`)), hot: 'pname', typeText: 'คอร์สอบรม AI Agent', tip: 'ตั้งชื่อโปรเจกต์' },
        { scene: () => W(hero('') + `<div class="mk-compare"><div data-h="c1"><b>Default memory</b><small>โปรเจกต์ ⇄ แชตอื่น แชร์ความจำได้</small><div class="mk-flow">💬 ⇄ 📁 ⇄ 💬</div></div><div><b>Project-only memory</b><small>ความจำอยู่ในโปรเจกต์เท่านั้น</small><div class="mk-flow">💬 ✕ 📁 ✕ 💬</div></div></div>`), hot: 'c1', tip: 'เปรียบเทียบความจำ 2 แบบ — งานลับหรืองานลูกค้าให้ใช้ <b>Project-only</b>' },
        { scene: () => W(`<div class="mk-proj"><div class="mk-ptitle">${ic('folder', 20)} คอร์สอบรม AI Agent</div><div class="mk-ptabs"><span>Chats</span><span class="on" data-h="srcs">Sources</span><span>Instructions</span></div><div class="mk-card">${fileRow('โครงหลักสูตร.docx', 'Uploaded')}${fileRow('รายชื่อผู้เรียน.xlsx', 'Google Drive')}</div></div>`, { side: { newProj: 'คอร์สอบรม AI Agent' } }), hot: 'srcs', tip: 'แท็บ <b>Sources</b> ใส่ไฟล์ที่ทุกแชตในโปรเจกต์ใช้ร่วมกัน' },
        { scene: () => W(hero('') + `<div class="mk-ctx">${MK.menu([{ t: 'Rename', icon: 'edit' }, { t: 'Pin', icon: 'spark' }, { t: 'Share', icon: 'up' }, '-', { t: 'Archive', icon: 'lib' }, { t: 'Delete', icon: 'x', warn: true }, '-', { t: 'Move to project', icon: 'folder', id: 'move' }], 'left:10px;top:10px;width:220px')}${MK.menu([{ t: 'New project', icon: 'plus' }, '-', { t: 'คอร์สอบรม AI Agent', icon: 'folder', id: 'target' }, { t: 'รายงานยอดขาย', icon: 'folder' }], 'left:236px;top:150px;width:240px')}</div>`, { side: { newProj: 'คอร์สอบรม AI Agent' } }), hot: 'target', tip: 'แชตเก่า: เมนู “…” › <b>Move to project</b> › เลือกโปรเจกต์' }
      ]
    }],
    lab: {
      title: 'Prompt Lab: Instructions ของ Project',
      fields: [
        { k: 'name', label: 'ชื่อโปรเจกต์', def: 'คอร์สอบรม AI Agent' },
        { k: 'who', label: 'ใครใช้ผลงาน', def: 'พนักงานฝ่ายผลิตที่ไม่มีพื้นฐาน AI' },
        { k: 'std', label: 'มาตรฐาน/สไตล์', def: 'ภาษาไทยเข้าใจง่าย มีตัวอย่างงานจริง ทุกบทจบด้วยแบบฝึกหัด' },
        { k: 'mem', label: 'ความจำ', type: 'select', options: ['Default memory', 'Project-only memory'], def: 'Project-only memory' },
        { k: 'deny', label: 'ข้อห้าม', def: 'ห้ามแต่งสถิติหรือแหล่งอ้างอิง ห้ามใช้ข้อมูลส่วนบุคคลของผู้เรียน' }
      ],
      build: v => `Project: ${v.name} (${v.mem})

บริบท: งานในโปรเจกต์นี้ทำเพื่อ ${v.who}
มาตรฐาน: ${v.std}
ใช้ไฟล์ใน Sources เป็นข้อมูลหลัก ถ้าข้อมูลขัดกันให้ถามก่อน
ทุกคำตอบ: แยก Fact / Assumption / Need Data
ข้อห้าม: ${v.deny}
เมื่อเริ่มแชตใหม่ในโปรเจกต์ ให้ทบทวนงานล่าสุดและสิ่งที่ค้างก่อนเสมอ`,
      sim: v => [`📁 สร้าง “${v.name}”`, `🧠 ตั้ง ${v.mem}`, '📂 ใส่ไฟล์ใน Sources', '📝 บันทึก Instructions', '💬 แชตใหม่ทุกแชตใช้กติกาเดียวกัน'],
      risk: v => v.mem === 'Default memory' ? ['Default memory: ข้อมูลโปรเจกต์อาจถูกใช้ในแชตอื่น — งานลับควรใช้ Project-only'] : []
    },
    quiz: [['งานบน cloud ใช้ไม่ได้กับความจำแบบใด?', ['Default memory', 'Project-only memory'], 1], ['ย้ายแชตเก่าเข้าโปรเจกต์ทำที่ไหน?', ['Settings › General', 'เมนู “…” ของแชต › Move to project', 'Library'], 1]],
    check: ['สร้างโปรเจกต์และเลือกความจำ', 'ใส่ไฟล์หลักใน Sources', 'เขียน Instructions', 'ย้ายแชตที่เกี่ยวข้องเข้าโปรเจกต์']
  };

  // =====================================================================
  // LESSON 3 — Skills + Plugins
  // =====================================================================
  const plugRow = (name, d, act, id) => `<div class="mk-plug"${id ? ` data-h="${id}"` : ''}><span class="mk-pi">${name[0]}</span><span>${name}<small>${d}</small></span><span class="mk-gap"></span>${act}</div>`;
  const L3 = {
    id: 'skills', n: 3, icon: '🧩', color: '#a855f7', title: 'Skills + Plugins: ต่อเครื่องมือให้ Agent', minutes: 15,
    sub: 'ติดตั้ง Plugin ตั้งสิทธิ์ สร้าง Skill และเข้าใจ Hook',
    intro: '<b>Plugin</b> = แพ็กเกจที่เชื่อม ChatGPT กับแอปภายนอก · <b>Skill</b> = คู่มือคำสั่งที่ Agent อ่านก่อนทำงาน · <b>Hook</b> = กฎอัตโนมัติที่ทำงานตามเหตุการณ์ (หมายเหตุ: GPTs กำลังจะเลิกใช้ และถูกย้ายไปเป็น Plugins)',
    stations: [{
      key: 's', icon: '🧩', title: 'ติดตั้ง Plugin และสร้าง Skill',
      what: 'ติดตั้ง Plugin จากหน้า Plugins แล้วสร้าง Skill ของคุณเองด้วยการคุยกับ ChatGPT',
      points: ['ตั้งสิทธิ์ Plugin รายตัว: Allow low-risk tools / Ask / Allow all tools', 'Skill สร้างได้ 3 ทาง: Create with chat · Create with editor · Upload', 'Skill ที่ดีมี: ชื่อ, ใช้เมื่อไร, ขั้นตอน, ข้อห้าม, ตัวอย่าง'],
      steps: [
        { scene: () => W(`<div class="mk-page"><div class="mk-tabs"><span class="on">Plugins</span><span data-h="tab-skills">Skills</span></div><h3>Plugins</h3><p class="mk-muted">Connect plugins to let ChatGPT work across your tools</p><div class="mk-input">${ic('lib')} Search plugins</div><div class="mk-sh2">Popular</div><div class="mk-grid2">${plugRow('Gmail', 'Read and manage Gmail', '⋯')}${plugRow('Notion', 'Create docs, tasks, databases', `<span class="mk-ib" data-h="install">${ic('plus')}</span>`)}${plugRow('Google Drive', 'Drive, Docs, Sheets or Slides', '⋯')}${plugRow('Atlassian', 'Jira, Confluence & more', ic('plus'))}</div></div>`, { side: { active: 'plug' } }), hot: 'install', tip: 'เมนู <b>Plugins</b> › เลือก Plugin › กด <b>+</b> เพื่อติดตั้ง' },
        { scene: () => S('Plugins', 'Plugins', `<div class="mk-card">${MK.row('Default permission', '', MK.select('Allow low-risk tools'))}</div><div class="mk-card">${MK.row('Notion', 'Create docs, tasks, databases', MK.select('Allow low-risk tools', 'np'))}${MK.row('Gmail', 'Read and manage Gmail', '<span class="mk-muted">Ask before acting ›</span>')}</div>`), hot: 'np', tip: 'ตั้งสิทธิ์ของ Plugin ใหม่ — เริ่มที่ <b>Allow low-risk tools</b>' },
        { scene: () => W(`<div class="mk-page"><div class="mk-tabs"><span>Plugins</span><span class="on">Skills</span></div><h3>Skills</h3><p class="mk-muted">Instructions that extend ChatGPT's capabilities</p><div class="mk-sh2">Installed</div>${plugRow('skill-creator', 'Guide for creating and updating high-quality skills…', '⋯')}</div>` + MK.menu([{ t: 'Create with chat', icon: 'edit', id: 'sk-chat' }, { t: 'Create with editor', icon: 'code' }, { t: 'Upload from your computer', icon: 'file' }], 'right:20px;top:40px;width:260px'), { side: { active: 'plug' } }), hot: 'sk-chat', tip: 'แท็บ <b>Skills</b> › <b>Add</b> › <b>Create with chat</b>' },
        { scene: () => W(hero('สร้าง Skill ใหม่') + MK.composer({ ph: 'อธิบาย Skill ที่ต้องการ' }), { side: { active: 'plug' } }), hot: 'input', typeText: 'สร้าง Skill “ตรวจรายงานก่อนส่งผู้บริหาร”: ใช้เมื่อฉันแนบรายงาน ตรวจตัวเลข หน่วย วันที่ แยก Fact/Assumption และสรุปเป็นตาราง ห้ามแก้ไฟล์ต้นฉบับ', tip: 'บอกว่า Skill <b>ใช้เมื่อไร · ทำอะไร · ผลลัพธ์ · ข้อห้าม</b>' },
        { scene: () => W(`<div class="mk-page"><div class="mk-ptitle">🧩 report-reviewer ${MK.toggle(true, 'sk-on')}</div><pre class="mk-code">---
name: report-reviewer
description: ตรวจรายงานก่อนส่งผู้บริหาร
---
# Report Reviewer
ใช้เมื่อ: ผู้ใช้แนบรายงานและขอให้ตรวจ
ขั้นตอน:
1. ตรวจตัวเลข หน่วย วันที่
2. แยก Fact / Assumption / Need Data
3. สรุปเป็นตาราง ปัญหา | ผลกระทบ | วิธีแก้
ข้อห้าม: ห้ามแก้ไฟล์ต้นฉบับ</pre>${MK.btn('Try now', '', 'dark')}</div>`, { side: { active: 'plug' } }), hot: 'sk-on', tip: 'ChatGPT สร้างไฟล์ <b>SKILL.md</b> ให้ — เปิดสวิตช์เพื่อใช้งาน แล้วกด Try now' },
        { scene: () => S('Plugins', 'Hooks', `<p class="mk-muted">Manage lifecycle hooks from config and enabled plugins.</p><div class="mk-card" data-h="hooks"><b>No hooks found</b><small class="mk-muted">Configured hooks will appear here</small></div><div class="mk-layers"><span>📦 Plugin</span>→<span>📘 Skill</span>→<span>⚡ Hook</span></div>`), hot: 'hooks', tip: '<b>Hooks</b> คือกฎอัตโนมัติจาก config/plugin — ผู้เริ่มต้นยังไม่ต้องตั้ง แต่ควรรู้ว่าอยู่ที่นี่' }
      ]
    }],
    lab: {
      title: 'Prompt Lab: สร้าง Skill ด้วยแชต',
      fields: [
        { k: 'name', label: 'ชื่อ Skill', def: 'report-reviewer' },
        { k: 'when', label: 'ใช้เมื่อไร', def: 'เมื่อฉันแนบรายงานและขอให้ตรวจก่อนส่งผู้บริหาร' },
        { k: 'steps', label: 'ขั้นตอน (คั่นด้วย ;)', def: 'ตรวจตัวเลข หน่วย วันที่; แยก Fact/Assumption/Need Data; สรุปปัญหาเป็นตาราง' },
        { k: 'out', label: 'รูปแบบผลลัพธ์', def: 'ตาราง: ประเด็น | ผลกระทบ | หลักฐาน | วิธีแก้' },
        { k: 'deny', label: 'ข้อห้าม', def: 'ห้ามแก้ไฟล์ต้นฉบับ ห้ามแต่งข้อมูล' },
        { k: 'plugins', label: 'Plugin ที่ Skill ใช้ได้', type: 'multi', options: ['Google Drive', 'Gmail', 'Notion', 'Canva', 'GitHub'], def: ['Google Drive'] }
      ],
      build: v => `สร้าง Skill ใหม่ชื่อ “${v.name}”

ใช้เมื่อ: ${v.when}
ขั้นตอน:
${String(v.steps).split(';').map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}
รูปแบบผลลัพธ์: ${v.out}
Plugin ที่อนุญาต: ${(v.plugins || []).join(', ') || 'ไม่มี'}
ข้อห้าม: ${v.deny}

เขียนเป็นไฟล์ SKILL.md (มี name, description, ขั้นตอน, ข้อห้าม และตัวอย่าง input/output 1 ชุด)
แล้วแสดงให้ฉันตรวจก่อนบันทึก`,
      sim: v => ['🧩 Skills › Add › Create with chat', '📝 ร่าง SKILL.md', `🔌 ผูก Plugin: ${(v.plugins || []).join(', ') || '-'}`, '👀 ให้คุณตรวจ', '✅ เปิดสวิตช์ใช้งาน'],
      risk: v => (v.plugins || []).includes('Gmail') ? ['Skill ที่ใช้ Gmail ควรให้ “ร่าง” เท่านั้น ไม่ส่งเอง'] : []
    },
    quiz: [['ข้อใดอธิบาย Skill ได้ถูกต้อง?', ['แพ็กเกจเชื่อมแอปภายนอก', 'คู่มือคำสั่งที่ Agent อ่านก่อนทำงาน', 'กฎอัตโนมัติตามเหตุการณ์'], 1], ['GPTs ที่ผู้สร้างย้ายแล้วจะไปอยู่ที่ใด?', ['Plugins', 'Library', 'Maps'], 0]],
    check: ['ติดตั้ง Plugin ที่จำเป็นเท่านั้น', 'ตั้งสิทธิ์ Plugin รายตัว', 'สร้าง Skill แรกด้วย Create with chat', 'ทดสอบ Skill ด้วย Try now']
  };

  // =====================================================================
  // LESSON 4 — Codex web app
  // =====================================================================
  const CODEX_SIDE = { title: 'Codex', projects: [] };
  const codexComp = (o = {}) => `<div class="mk-env"><span>${ic('globe', 13)} Cloud</span><span data-h="env">${ic('pc', 13)} ${o.env || 'Choose environment'}</span></div>` + MK.composer({ ph: 'Do anything', model: 'GPT-6.1 Sol Light', chips: '', ...o }).replace('<span class="mk-gap"></span>', `<span class="mk-appr-mode" data-h="apprmode">✋ ${o.mode || 'Ask for approval'}</span><span class="mk-gap"></span>`);
  const L4 = {
    id: 'codex', n: 4, icon: '💻', color: '#f59e0b', title: 'สั่ง Codex สร้างเว็บแอป', minutes: 18,
    sub: 'สลับไป Codex เลือก environment สั่งงานแบบ requirement-first ตรวจ diff และเปิด PR',
    intro: 'Codex คือพื้นที่ “Build” ของ ChatGPT ใช้สร้าง แก้ ทดสอบ และรีวิวซอฟต์แวร์ ทำงานบน repository ใน environment ที่คุณตั้งไว้ และขออนุญาตก่อนทำสิ่งสำคัญ',
    stations: [{
      key: 'c', icon: '💻', title: 'จากคำสั่งถึง Pull Request',
      what: 'Workflow ที่ปลอดภัย: Requirement → Inspect → Plan → Approve → Implement → Test → Review → Merge',
      points: ['ตั้ง environment ที่ Settings › <b>Codex Cloud</b> (repository + เครื่องมือ)', 'โหมด <b>Ask for approval</b> ให้ Codex ถามก่อนรันคำสั่งสำคัญ', 'เปิด Settings › Git › <b>Create draft pull requests</b> เพื่อให้ทุกงานเป็น draft ก่อน'],
      steps: [
        { scene: () => W(hero('Where should we begin?') + MK.composer() + MK.menu([{ t: 'ChatGPT', d: 'Create, learn, and explore', check: true }, { t: 'Codex', d: 'Build, debug, and ship', id: 'codex' }], 'left:8px;top:8px;width:260px')), hot: 'codex', tip: 'กดชื่อ <b>ChatGPT ▾</b> มุมซ้ายบน › เลือก <b>Codex</b>' },
        { scene: () => W(hero('🛠️ What should we build?') + codexComp() + MK.menu([{ t: 'sales-dashboard', d: 'my-org/sales-dashboard · Private', icon: 'code', id: 'repo' }, { t: '+ Create environment', icon: 'plus' }], 'left:60px;top:250px;width:320px'), { side: CODEX_SIDE }), hot: 'repo', tip: 'เลือก <b>environment</b> (repository ที่ Codex จะทำงาน)' },
        { scene: () => W(hero('🛠️ What should we build?') + codexComp({ env: 'sales-dashboard' }), { side: CODEX_SIDE }), hot: 'input', typeText: 'สร้างหน้า Dashboard ยอดขาย อ่าน CSV แสดงกราฟรายสัปดาห์ รองรับมือถือ ภาษาไทย · เริ่มจากสรุป requirement + แผนไฟล์ + แผนทดสอบ ยังไม่แก้ไฟล์จนกว่าฉันอนุมัติ', tip: 'สั่งแบบ <b>requirement-first</b>: ให้สรุปและวางแผนก่อน ยังไม่แก้ไฟล์' },
        { scene: () => W(`<div class="mk-proj">${MK.bubble('สร้างหน้า Dashboard ยอดขาย … ยังไม่แก้ไฟล์จนกว่าฉันอนุมัติ')}${MK.bubble('<b>แผนงาน</b><br>1. src/dashboard.html, src/chart.js, src/parse-csv.js<br>2. ทดสอบ: parse CSV 3 กรณี, responsive 375px<br>3. คำถาม: ใช้ไลบรารีกราฟได้หรือไม่? <br><span class="mk-btn dark" data-h="approve">อนุมัติแผน ✓</span>', 'bot')}</div>` + codexComp({ env: 'sales-dashboard' }), { side: CODEX_SIDE }), hot: 'approve', tip: 'อ่านแผนและคำถาม แล้ว <b>อนุมัติ</b> เมื่อถูกต้อง' },
        { scene: () => W(`<div class="mk-proj"><div class="mk-muted mk-wf">Working for 3m 12s</div>${MK.steps(['Inspect repository', 'Create src/dashboard.html', 'Create src/chart.js', 'Run tests (6 passed)', 'Prepare diff'], 5)}<div class="mk-diff"><b>3 files changed</b> <span class="g">+214</span> <span class="r">−3</span><div>src/dashboard.html <span class="g">+96</span></div><div>src/chart.js <span class="g">+88</span></div><div>tests/parse.test.js <span class="g">+30 −3</span></div></div><div class="mk-mf"><span class="mk-gap"></span>${MK.btn('Create draft PR', 'pr', 'dark')}</div></div>`, { side: CODEX_SIDE }), hot: 'pr', tip: 'ตรวจ <b>diff</b> และผลทดสอบ แล้วเปิด <b>draft PR</b> ให้ทีมรีวิว' }
      ]
    }],
    lab: {
      title: 'Prompt Lab: สั่ง Codex สร้างเว็บแอป',
      fields: [
        { k: 'app', label: 'ชื่อระบบ', def: 'Dashboard ยอดขาย' },
        { k: 'user', label: 'ผู้ใช้', def: 'ผู้จัดการฝ่ายขาย' },
        { k: 'goal', label: 'แก้ปัญหาอะไร', def: 'ดูยอดขายรายสัปดาห์โดยไม่ต้องเปิด Excel' },
        { k: 'in', label: 'ข้อมูลเข้า', def: 'ไฟล์ CSV ยอดขาย' },
        { k: 'out', label: 'ข้อมูลออก', def: 'กราฟรายสัปดาห์ ตารางสรุป ปุ่มดาวน์โหลด PDF' },
        { k: 'con', label: 'ข้อจำกัด', type: 'multi', options: ['Responsive มือถือ', 'ภาษาไทย', 'ทำงาน offline', 'ไม่ส่งข้อมูลออกนอกเครื่อง', 'ไม่ใช้ framework'], def: ['Responsive มือถือ', 'ภาษาไทย'] }
      ],
      build: v => `สร้างเว็บแอป ${v.app} สำหรับ ${v.user}

เป้าหมาย: ${v.goal}
ข้อมูลเข้า: ${v.in}
ข้อมูลออก: ${v.out}
ข้อจำกัด: ${(v.con || []).join(' / ') || '-'}

เริ่มจาก:
1) สรุป requirement และคำถามที่ยังขาด
2) ออกแบบโครงสร้างไฟล์และ data model
3) เสนอหน้าจอและ workflow
4) เสนอแผนทดสอบ

ยังไม่แก้ไฟล์จริงจนกว่าจะได้รับอนุมัติแผน
เมื่ออนุมัติแล้ว: เขียนโค้ด รันทดสอบ แสดง diff และเปิดเป็น draft pull request
ห้ามใส่ secret, password หรือ API key ในโค้ด`,
      sim: v => ['🔀 สลับเป็น Codex', '🗂️ เลือก environment', '📋 สรุป requirement + แผน', '✋ รอคุณอนุมัติ', '⌨️ เขียนโค้ด', '🧪 รันทดสอบ', '🔍 แสดง diff', '📬 เปิด draft PR'],
      risk: v => (v.con || []).includes('ไม่ส่งข้อมูลออกนอกเครื่อง') ? [] : ['ถ้าข้อมูลเป็นความลับ ให้เพิ่มข้อจำกัด “ไม่ส่งข้อมูลออกนอกเครื่อง”']
    },
    quiz: [['ทำไมควรสั่งให้ Codex “ยังไม่แก้ไฟล์จนกว่าจะอนุมัติแผน”?', ['ให้เร็วขึ้น', 'ตรวจ requirement และไฟล์ที่จะเปลี่ยนก่อนลงมือ', 'ประหยัดเครดิต'], 1], ['ควรตรวจอะไรก่อน merge?', ['จำนวนบรรทัด', 'diff, ผลทดสอบ และผลกระทบ', 'สีของปุ่ม'], 1]],
    check: ['ตั้ง environment ใน Codex Cloud', 'ใช้โหมด Ask for approval', 'สั่งแบบ requirement-first', 'ตรวจ diff + ผลทดสอบ', 'เปิดเป็น draft PR']
  };

  // =====================================================================
  // LESSON 5 — PWA
  // =====================================================================
  const phone = inner => `<div class="mk-phone"><div class="mk-notch"></div>${inner}</div>`;
  const L5 = {
    id: 'pwa', n: 5, icon: '📱', color: '#ec4899', title: 'สร้างแอป PWA และ Deploy', minutes: 15,
    sub: 'สั่ง Codex ทำ manifest, service worker, ปุ่มติดตั้ง, ใช้งาน offline แล้ว Deploy ขึ้น Netlify',
    intro: 'PWA (Progressive Web App) คือเว็บที่ติดตั้งลงมือถือ/คอมได้เหมือนแอป เปิดได้แม้ออฟไลน์ ไม่ต้องผ่าน App Store — เหมาะกับคู่มือ ระบบบันทึกข้อมูล และเครื่องมือภายในองค์กร',
    stations: [{
      key: 'w', icon: '📱', title: 'จากเว็บธรรมดาสู่แอปที่ติดตั้งได้',
      what: 'องค์ประกอบ PWA: <code>manifest.webmanifest</code> (ชื่อ ไอคอน สี) · <code>sw.js</code> (cache ให้ใช้ offline) · ไอคอน 192/512 px · ปุ่มติดตั้ง · HTTPS',
      points: ['ทดสอบด้วย Chrome DevTools › Application › Manifest / Service Workers', 'iPhone ไม่มีปุ่มติดตั้งอัตโนมัติ ต้องแนะนำ Share › Add to Home Screen', 'เพิ่มเลขเวอร์ชันใน sw.js ทุกครั้งที่อัปเดต เพื่อให้ผู้ใช้ได้ไฟล์ใหม่'],
      steps: [
        { scene: () => W(hero('🛠️ What should we build?') + codexComp({ env: 'sales-dashboard' }), { side: CODEX_SIDE }), hot: 'input', typeText: 'แปลง Dashboard ยอดขายเป็น PWA: เพิ่ม manifest, service worker ให้ใช้ offline, ไอคอน 192/512, ปุ่ม “ติดตั้งแอป” และวิธีติดตั้งบน iPhone', tip: 'สั่ง Codex เพิ่มองค์ประกอบ PWA ให้ครบในคำสั่งเดียว' },
        { scene: () => W(`<div class="mk-proj"><div class="mk-muted mk-wf">Working for 2m 05s</div>${MK.steps(['Create manifest.webmanifest', 'Create sw.js (offline cache)', 'Generate icons 192 / 512', 'Add install button + iOS guide', 'Lighthouse PWA check'], 5)}<div class="mk-diff"><b>5 files changed</b> <span class="g">+168</span><div>manifest.webmanifest <span class="g">+22</span></div><div>sw.js <span class="g">+41</span></div><div>icons/ <span class="g">2 files</span></div></div><div class="mk-mf"><span class="mk-gap"></span>${MK.btn('Preview', 'prev', 'dark')}</div></div>`, { side: CODEX_SIDE }), hot: 'prev', tip: 'Codex สร้างไฟล์และตรวจด้วย Lighthouse — กด <b>Preview</b>' },
        { scene: () => MK.win(`<div class="mk-center-wrap">${phone(`<div class="mk-app"><b>📊 ยอดขาย</b><div class="mk-bars"><i style="height:40%"></i><i style="height:65%"></i><i style="height:55%"></i><i style="height:85%"></i></div></div><div class="mk-install" data-h="inst">⬇️ ติดตั้งแอป “ยอดขาย”?<span class="mk-btn dark">ติดตั้ง</span></div>`)}<div class="mk-side-note">ทดสอบบนมือถือ: แถบติดตั้งขึ้นเอง · ปิดเน็ตแล้วยังเปิดได้</div></div>`, { title: 'Preview · mobile' }), hot: 'inst', tip: 'ทดสอบบนมือถือ: กด <b>ติดตั้ง</b> แล้วลองปิดอินเทอร์เน็ต' },
        { scene: () => W(`<div class="mk-proj">${MK.bubble('@Netlify deploy เว็บนี้ขึ้น production')}${MK.approval({ icon: 'up', app: 'Netlify', q: 'Allow ChatGPT to deploy to Netlify?', d: 'Site: sales-dashboard · Production deploy' })}</div>` + codexComp({ env: 'sales-dashboard' }), { side: CODEX_SIDE }), tip: 'Deploy ขึ้น production คือการเผยแพร่จริง — ตอบอย่างไร?',
          choices: [
            { h: 'once', label: 'Allow once', level: 'good', result: 'เหมาะสม — คุณตรวจ Preview แล้ว อนุญาตเฉพาะการ deploy ครั้งนี้' },
            { h: 'always', label: 'Always allow', level: 'warn', result: 'ต่อไป Codex จะ deploy เองทุกครั้ง — เสี่ยงเผยแพร่โค้ดที่ยังไม่ผ่านการตรวจ' },
            { h: 'deny', label: 'Deny', level: 'neutral', result: 'ไม่ deploy — คุณอาจให้ Codex เปิด PR แล้วให้ Netlify deploy preview แทน' }
          ] },
        { scene: () => W(`<div class="mk-proj">${MK.bubble('✅ Deploy สำเร็จ<br><span class="mk-link" data-h="url">https://sales-dashboard.netlify.app</span><br>Lighthouse PWA: ผ่าน · Offline: ผ่าน', 'bot')}</div>` + codexComp({ env: 'sales-dashboard' }), { side: CODEX_SIDE }), hot: 'url', tip: '🎉 ได้ลิงก์จริง — ส่งให้ผู้ใช้เปิดแล้วกด <b>ติดตั้ง</b> ได้ทันที' }
      ]
    }],
    lab: {
      title: 'Prompt Lab: สร้าง PWA',
      fields: [
        { k: 'app', label: 'ชื่อแอป', def: 'คู่มือ AI สำหรับทีม' },
        { k: 'short', label: 'ชื่อสั้น (ใต้ไอคอน)', def: 'AI Guide' },
        { k: 'color', label: 'สีธีม', def: '#10A37F' },
        { k: 'feat', label: 'ฟีเจอร์ PWA', type: 'multi', options: ['ใช้งาน offline', 'ปุ่มติดตั้งแอป', 'วิธีติดตั้งบน iPhone', 'แจ้งเตือนเมื่อมีเวอร์ชันใหม่', 'ไอคอน maskable', 'Shortcuts'], def: ['ใช้งาน offline', 'ปุ่มติดตั้งแอป', 'วิธีติดตั้งบน iPhone'] },
        { k: 'host', label: 'Deploy ที่', type: 'select', options: ['Netlify', 'GitHub Pages', 'Firebase Hosting', 'ยังไม่ deploy'], def: 'Netlify' }
      ],
      build: v => `แปลงเว็บนี้เป็น PWA ชื่อ “${v.app}” (short_name: ${v.short}, theme_color: ${v.color})

ต้องมี:
- manifest.webmanifest (name, short_name, start_url, display: standalone, icons 192/512)
- sw.js สำหรับ cache ไฟล์หลัก
${(v.feat || []).map(f => `- ${f}`).join('\n')}

ทดสอบ: Lighthouse PWA, เปิดแบบ offline, ติดตั้งบน Android และ iPhone
${v.host !== 'ยังไม่ deploy' ? `Deploy: ${v.host} — ขออนุญาตฉันก่อน deploy production ทุกครั้ง` : ''}
อธิบายไฟล์ที่สร้างและวิธีอัปเดตเวอร์ชัน`,
      sim: v => ['📄 manifest.webmanifest', '⚙️ sw.js', '🖼️ ไอคอน 192/512', ...(v.feat || []).slice(0, 3).map(f => '✨ ' + f), '🔦 Lighthouse', v.host !== 'ยังไม่ deploy' ? `🚀 Deploy ${v.host} (หลังอนุมัติ)` : '📦 พร้อม deploy'],
      risk: v => (v.feat || []).includes('ใช้งาน offline') ? [] : ['ยังไม่เลือก “ใช้งาน offline” — PWA ส่วนใหญ่ควร cache ไฟล์หลัก']
    },
    quiz: [['ไฟล์ใดทำให้ PWA ใช้งาน offline ได้?', ['manifest.webmanifest', 'sw.js (service worker)', 'index.css'], 1], ['บน iPhone ติดตั้ง PWA อย่างไร?', ['รอปุ่มติดตั้งขึ้นเอง', 'Share › Add to Home Screen', 'ดาวน์โหลดจาก App Store'], 1]],
    check: ['มี manifest + ไอคอนครบ', 'มี service worker และทดสอบ offline', 'มีปุ่มติดตั้ง + วิธีติดตั้ง iPhone', 'ตรวจ Preview ก่อน deploy', 'อนุญาต deploy ทีละครั้ง']
  };

  // =====================================================================
  // LESSON 6 — Voice
  // =====================================================================
  const L6 = {
    id: 'voice', n: 6, icon: '🎙️', color: '#06b6d4', title: 'GPT Voice: คุยและสั่งงานด้วยเสียง', minutes: 10,
    sub: 'ตั้งเสียงและภาษา ใช้ Dictation และ Voice mode อย่างได้ผล',
    intro: 'Voice เหมาะกับการระดมไอเดีย ฝึกภาษา หรือสั่งงานระหว่างทำอย่างอื่น ส่วนข้อมูลสำคัญควรให้สรุปเป็นข้อความเพื่อตรวจและอ้างอิงได้',
    stations: [{
      key: 'v', icon: '🎙️', title: 'ตั้งค่าและใช้งานเสียง',
      what: 'ไมค์ 🎤 = <b>Dictation</b> (พูดแล้วแปลงเป็นข้อความในช่องพิมพ์) · ปุ่มคลื่นเสียง = <b>Voice mode</b> (คุยโต้ตอบด้วยเสียง)',
      points: ['Settings › Voice: เลือกเสียง (เช่น Sol) และภาษา <b>Thai</b>', 'เปิด <b>Enable Dictation</b> เพื่อพิมพ์ด้วยเสียง', 'จบการคุยแล้วสั่ง “สรุปเป็นข้อความ + Action items” เสมอ'],
      steps: [
        { scene: () => S('General', 'Voice', `<div class="mk-card">${MK.row('Voice', 'Choose the voice used for voice chat and read aloud', MK.btn('Sol', 'voice'))}${MK.row('Language', '', MK.select('Thai'))}</div><div class="mk-sh2">Dictation</div><div class="mk-card">${MK.row('Enable Dictation', 'Use dictation in the chat composer.', MK.toggle(true))}${MK.row('Recent recordings', 'Your last 20 recordings are saved on this device', '')}</div>`), hot: 'voice', tip: 'Settings › <b>Voice</b> › เลือกเสียงที่ชอบ' },
        { scene: () => S('General', 'Voice', '') + MK.modal('Voice', `<div class="mk-sh2">American English</div>${['Spruce', 'Juniper', 'Sol', 'Maple', 'Ember', 'Cove'].map(n => `<div class="mk-pick${n === 'Sol' ? ' on' : ''}"${n === 'Maple' ? ' data-h="maple"' : ''}>${n === 'Sol' ? ic('check', 14) : '<i style="width:14px"></i>'}<span>${n}</span></div>`).join('')}<div class="mk-mf"><span class="mk-gap"></span>${MK.btn('Cancel')}${MK.btn('Done', '', 'dark')}</div>`, 'width:380px'), hot: 'maple', tip: 'ฟังตัวอย่างแล้วเลือกเสียง กด <b>Done</b>' },
        { scene: () => W(`${MK.toggleCW('Chat')}${hero('Where should we begin?')}${MK.composer()}`), hot: 'send', tip: 'กลับหน้าแชต กดปุ่ม <b>คลื่นเสียง</b> สีเขียวเพื่อเข้า Voice mode' },
        { scene: () => MK.win(`<div class="mk-voice"><div class="mk-orb" data-h="orb"></div><div class="mk-cap">🗣️ “ช่วยวางแผนการประชุมทีมพรุ่งนี้ 30 นาที”</div><div class="mk-cap bot">🤖 “ได้เลยครับ เริ่มจากเป้าหมายการประชุมก่อน…”</div><div class="mk-vctl"><span>🎤</span><span class="r">✕</span></div></div>`, { title: 'Voice' }), hot: 'orb', tip: 'คุยได้ต่อเนื่อง พูดแทรกได้ — มีคำบรรยายให้อ่านตาม' },
        { scene: () => W(`<div class="mk-proj">${MK.bubble('🎙️ Voice chat · 3 นาที', 'user')}${MK.bubble('<b>สรุปการประชุม</b><br>• เป้าหมาย: ปิดงาน Q4<br>• Action: คุณเอ — ส่งสไลด์ศุกร์นี้', 'bot')}</div>${MK.composer({ text: 'สรุปเป็นข้อความ + Action items' })}`), hot: 'input', tip: 'จบแล้วสั่ง “<b>สรุปเป็นข้อความ + Action items</b>” เพื่อเก็บไว้ตรวจ' }
      ]
    }],
    lab: {
      title: 'Prompt Lab: ใช้ Voice ให้ได้งาน',
      fields: [
        { k: 'mode', label: 'สถานการณ์', type: 'select', options: ['ระดมความคิด', 'ฝึกพรีเซนต์', 'ฝึกภาษาอังกฤษ', 'ซ้อมสัมภาษณ์งาน'], def: 'ฝึกพรีเซนต์' },
        { k: 'topic', label: 'หัวข้อ', def: 'นำเสนอผลการตรวจมาตรฐานฟาร์มให้ผู้บริหาร' },
        { k: 'len', label: 'ความยาว (นาที)', def: '5' },
        { k: 'fb', label: 'อยากได้ Feedback เรื่อง', def: 'ความชัดเจน ความเร็วในการพูด และคำถามที่ผู้บริหารอาจถาม' }
      ],
      build: v => `(พูดใน Voice mode) เราจะ${v.mode}เรื่อง “${v.topic}” ประมาณ ${v.len} นาที
ให้คุณรับบทผู้ฟังที่เหมาะสม ถามกลับทีละคำถาม และพูดสั้น ๆ
เมื่อฉันพูดว่า “จบ” ให้สรุปเป็นข้อความ:
1) จุดแข็ง 3 ข้อ
2) จุดที่ควรปรับ (${v.fb})
3) คำถามที่ควรเตรียมตอบ
4) Action items`,
      sim: v => ['🎙️ เข้า Voice mode', `🎭 ${v.mode}`, '🔁 โต้ตอบทีละคำถาม', '🛑 พูดว่า “จบ”', '📝 สรุปเป็นข้อความ + Action items'],
      risk: () => []
    },
    quiz: [['ปุ่มไมค์ 🎤 ในช่องพิมพ์ทำอะไร?', ['Voice mode', 'Dictation แปลงเสียงเป็นข้อความ', 'อัดเสียงส่งเพื่อน'], 1], ['หลังคุยด้วยเสียงเรื่องสำคัญควรทำอะไร?', ['ปิดเลย', 'สั่งสรุปเป็นข้อความเพื่อตรวจ', 'ลบแชต'], 1]],
    check: ['ตั้งเสียงและภาษาไทย', 'เปิด Dictation', 'ลอง Voice mode 1 รอบ', 'สรุปเป็นข้อความ + Action items']
  };

  window.LESSONS = [L1, L2, L3, L4, L5, L6];
})();
