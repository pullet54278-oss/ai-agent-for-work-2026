# Copilot AI Agents for Work – คู่มือเรียนรู้ (Web App)

## เป้าหมาย
Web app คู่มือเรียนรู้ภาษาไทย สำหรับคอร์ส "การใช้งาน AI แบบพาลงมือทำ" หัวข้อ Copilot AI Agents for Work 2026
ผู้เรียนเปิดทบทวนเองบนคอมและมือถือ เป็นหน้าเนื้อหา ไม่ใช่สไลด์ ส่งมอบเป็นไฟล์ HTML เดียว (dist/index.html สร้างด้วย npm run build) พร้อม logo.png

## โครงสร้างโปรเจกต์
- `content/copilot-ai-agents-for-work.md` **แหล่งความจริงของเนื้อหา** ส่วนที่ 1 = สเปก UI, ส่วนที่ 2 = เนื้อหาทั้งหมด (ใช้ตามเดิมทุกตัวอักษร)
- `content/supplements.mjs` ส่วนขยายการเรียนรู้ (เจาะลึก/ตัวอย่าง/Workshop/วิธีตรวจสอบ) — แยกจากต้นฉบับ แสดงในกรอบ "ส่วนขยายการเรียนรู้"
- `content/deep-learning-v10.html` ต้นฉบับ Deep Learning 36 บท (v10) · `content/deep-quizzes.mjs` แบบทดสอบเฉพาะบท · `content/tracks.mjs` เส้นทางการเรียน 7 เส้นทาง (Copilot Agent ลำดับแรก) — build แปลงผ่าน `scripts/lib/deep.mjs` (กฎ SANITIZE แทนชื่อตำแหน่ง/เลขที่เอกสาร) และ `deep-render.mjs` → `dist/deep-data.js`
- `data/copilot-updates.json` snapshot อัปเดต Copilot จาก Microsoft 365 Roadmap (`scripts/fetch-updates.mjs`, `scripts/lib/updates.mjs`) · `netlify/functions/` API สด `/api/copilot-updates` + build ใหม่รายวันผ่าน `BUILD_HOOK_URL`
- `data/updates-th.json` หัวข้อ/สรุปข่าวภาษาไทย (key = Roadmap ID) — เมื่อ snapshot มีข่าวใหม่ build จะเตือนจำนวนที่ยังไม่แปล ให้เติมคำแปลแล้ว build ใหม่ (ข่าวที่ไม่มีคำแปลแสดงสรุปอัตโนมัติ)
- PWA: `src/sw.js` (build เติม build id + precache) · `assets/icons/` สร้างด้วย `node scripts/make-icons.mjs` จาก `assets/app-icon.png` (ถ้ามี) · build เขียน `manifest.webmanifest`, `sw.js`, `version.json`
- Email gate: `scripts/lib/gate.mjs` อ่านรายชื่อจาก `private/` (gitignored) หรือ env `ALLOWED_EMAILS` ฝังเฉพาะ hash — **ห้าม commit รายชื่อ Email และห้ามใส่ Email ตัวจริงใน dist/**
- เวอร์ชันแอปอ่านจาก `package.json` (แสดงบนหน้าแรกและท้ายหน้า) ขึ้นเวอร์ชันพร้อมบันทึกใน `CHANGELOG.md`
- `data/` ข้อมูลเสริมที่ MD สูญหายตอนแปลงจากหน้าเว็บ (Prompt Lab 11 หมวด, ชื่อปุ่ม Agent, Office chips, Agent #28) build จะตรวจว่าตรงกับ MD เมื่อมีทั้งสองที่
- `src/` template.html, app.css (Fluent 2 + design tokens ส่วนที่ 1), app.js, icons.json (Fluent UI System Icons, MIT)
- `scripts/build.mjs` สร้าง `dist/` (index.html ไฟล์เดียว + logo.png + vendor/ + _headers) · `scripts/inventory.mjs` · `scripts/audit.mjs`
- `tests/e2e.mjs` ทดสอบทุกฟังก์ชันด้วย Playwright · `docs/` แผน รายงาน
- `assets/logo.png` โลโก้ AI Agent for Work · `assets/brand/copilot-logo.svg` โลโก้ Copilot ทางการ (แสดงที่แถบบนและหน้าแรก)
- `legacy/index-v1.html` เวอร์ชันเดิม (อ้างอิง)
- `source-docs/` เอกสาร Workflow ต้นทาง (ห้ามเผยแพร่ ห้าม copy เข้า dist/)

## ข้อห้าม (สำคัญ)
- ห้ามใส่ชื่อบริษัท ชื่อฟาร์มหรือโรงงาน ชื่อเอกสาร เลขที่เอกสาร หรือตำแหน่งงานบนเว็บ ใช้คำว่า "ผู้รับผิดชอบ" หรือ "ผู้มีอำนาจอนุมัติ" แทน
- โลโก้ Copilot ทางการ: เจ้าของงานสั่งให้ใช้ (14 ต.ค. 2569) ไฟล์อยู่ที่ `assets/brand/copilot-logo.svg` (ดู NOTICE.txt) ใช้ตามต้นฉบับ ห้ามดัดแปลงสีหรือรูปทรงโลโก้ ห้ามใช้โลโก้ Microsoft อื่น
- ห้ามทำตัวอักษร COPILOT เลียนแบบสีหรือรูปแบบโลโก้ คำว่า Copilot ใช้สีตัวอักษรปกติ (สี --ink)
- ก่อนส่งมอบทุกครั้ง ค้นหาคำต้องห้ามใน dist/index.html และ dist/deep-data.js ให้ได้ผล 0 (`npm run audit` อ่านรายการจาก content/forbidden-terms.txt)

## ข้อจำกัดระบบที่ต้องออกแบบตาม
- บัญชีองค์กรเพิ่มไฟล์เป็น Knowledge ไม่ได้ ใช้เว็บไซต์สาธารณะไม่เกิน 4 แหล่งต่อ Agent
- URL ลึกไม่เกิน 2 ระดับ และไม่มีเครื่องหมาย ? ตรวจว่าเปิดได้จริงก่อนใส่
- ไฟล์งานจริงให้แนบในแชทตอนเรียกใช้ Agent
- Agent Builder: Name ≤ 30, Description ≤ 1,000, Instructions ≤ 8,000 ตัวอักษร
- Instructions ใช้โครง 8 ส่วน: บทบาท เป้าหมาย ข้อมูลนำเข้า ขั้นตอน รูปแบบผลลัพธ์ การตรวจสอบ ข้อห้าม เมื่อไม่แน่ใจ
- ข้อมูลเรื่องสิทธิ์บัญชีและชื่อเมนู Copilot ให้ติดป้าย "ตรวจกับบัญชีจริงก่อนสอน" เว้นแต่ผู้ใช้ยืนยันด้วยภาพหน้าจอ

## UI
- คำว่า Copilot ต้องเด่นและใหญ่ที่สุดบนหน้าแรก ใช้โลโก้ logo.png และโลโก้ Copilot ที่แถบบนและหน้าแรก
- ภาพประกอบเป็น inline SVG สร้างใน app.js (`illus()` ตามกลุ่มงาน, `heroScene()`) ใช้สีกลุ่มผ่าน --dc รองรับทั้ง 2 ธีม
- โหมด Light/Dark (ในโหมดมืดให้โลโก้วางบนพื้นสีอ่อน)
- ลิขสิทธิ์ท้ายทุกหน้า: © 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret
- หน้า Agent: 2 คอลัมน์ แผง "สร้าง Agent" ติดด้านขวา มีเว็บไซต์ 4 แหล่ง กล่องแนบไฟล์ และการตั้งค่าที่คัดลอกได้
- ฟังก์ชัน: Ctrl+K ค้นหา, บันทึกความคืบหน้า, Prompt Builder, เครื่องคำนวณ 2 หน้า, แถบเมนูล่างบนมือถือ
- ไม่มีตารางเวลา ไม่มีโหมด Present
- สเปกสีและรายละเอียดอื่นดู "ส่วนที่ 1" ใน content/copilot-ai-agents-for-work.md

## วิธีทำงาน
- ใช้ Plan mode ก่อนงานที่แก้หลายไฟล์ เสนอแผนให้ผู้ใช้ยืนยันก่อนลงมือ
- แก้เนื้อหาที่ content/copilot-ai-agents-for-work.md (หรือ data/ สำหรับส่วนที่ MD ไม่มี) แล้ว `npm run build`
- หลังแก้ รัน `npm run audit` (ต้องขาด 0) และ `node tests/e2e.mjs` (ต้องผ่านทั้งหมด) แล้วเปิด dist/index.html ตรวจทั้งจอคอมและจอมือถือ ทั้งโหมดสว่างและมืด
- commit ทุกครั้งที่ได้เวอร์ชันที่ใช้งานได้ พร้อมข้อความสรุปสิ่งที่เปลี่ยน
- ตอบผู้ใช้เป็นภาษาไทย
