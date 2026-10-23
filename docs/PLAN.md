# Copilot AI Agents for Work 2026 — Content Inventory, Architecture, Development Plan, Test Plan

> เอกสารนี้จัดทำ **ก่อนเขียนโค้ด** จากการวิเคราะห์ `content/copilot-ai-agents-for-work.md` (23,208 บรรทัด) และ `data/*.json`
> ตัวเลขทั้งหมดสร้างซ้ำได้ด้วย `npm run inventory` → `docs/content-inventory.json`

## 1. Content Inventory (นับจริงจากไฟล์ต้นฉบับ)

| รายการ | จำนวนที่พบจริง | ที่ต้นฉบับระบุ | หมายเหตุ |
|---|---|---|---|
| บท (`## บทที่`) | **27** | 27 | ตรง |
| หน้าเนื้อหา (`### หน้า`) | **154** (หน้า 2–155) | 155 | หน้า 1 = หน้าแรก กำหนดในส่วนที่ 1 ไม่มีเนื้อหาในส่วนที่ 2 → รวม 155 ตรงกับ "เรียนแล้ว x/155" |
| Agent ในทะเบียน (ภาคผนวก A) | **67** | 67 | ตรงกับ `data/agents.json` |
| หน้า Agent (`page-type: agent`) | **66** | "หน้า Agent (67 หน้า)" | **Agent #28 ไม่มีหน้า Agent** มีเฉพาะหน้า Flow (หน้า 73) |
| หน้า Agent Flow (`agentflow`) | **14** | – | Agent #1, 2, 5, 6, 7, 8, 9, 10, 13, 16, 20, 23, 27, 28 |
| Prompt (บล็อก ```` ```text ```` ที่ไม่ใช่การตั้งค่า) | **238** | – | outline 20 · pmode 4 · webref 4 · pers 10 · handoff 2 · agent 198 (คำถามต่อยอด/Prompt เริ่มงาน) |
| บล็อกตั้งค่า Agent Builder | **462** | – | 66 หน้า × 7 บล็อก (ทั้งหมด, Name, Description, Instructions, Knowledge, Capabilities, Starter prompts) |
| Starter prompts | **264** | – | 66 × 4 |
| Prompt Lab | **12 หมวด / 24 Prompt** | 12 หมวด | MD มีเพียงหมวด Analyze (2 Prompt) อีก 11 หมวดอยู่ใน `data/guides.json` |
| URL ไม่ซ้ำ | **42** | – | ตรงกับภาคผนวก B 42 แหล่ง |
| กลุ่มงาน | **17** (+ gen) | 17 | ทุกกลุ่มมี Agent |

### ประเภทหน้า (page-type)
module 19 · agent 66 · agentflow 14 · outline 23 · pers 5 · office 4 · anatomy 2 · map 2 · objectives, chat2agent, readiness, pmode, pbuild, webref, accounts, sp, build, instr, caps, store, plab, websrc, handoff, route, calc, calc2, matrix อย่างละ 1

### จำนวนหน้าต่อบท
| บท | รหัส | หน้า | Agent | Flow | บท | รหัส | หน้า | Agent | Flow |
|---|---|---|---|---|---|---|---|---|---|
| 1 | intro | 6 (+หน้าแรก) | 0 | 0 | 15 | wf | 1 | 0 | 0 |
| 2 | pmode | 3 | 0 | 0 | 16 | pb | 5 | 4 | 0 |
| 3 | acct | 7 | 0 | 0 | 17 | hat | 5 | 4 | 0 |
| 4 | build | 7 | 0 | 0 | 18 | brl | 6 | 5 | 0 |
| 5 | personal | 5 | 0 | 0 | 19 | lp | 9 | 7 | 0 |
| 6 | handoff | 2 | 0 | 0 | 20 | erp | 6 | 5 | 0 |
| 7 | data | 10 | 4 | 2 | 21 | feed | 4 | 3 | 0 |
| 8 | doc | 7 | 2 | 2 | 22 | lab | 5 | 4 | 0 |
| 9 | inv | 7 | 2 | 2 | 23 | qms | 4 | 3 | 0 |
| 10 | plan | 7 | 2 | 2 | 24 | cis | 5 | 4 | 0 |
| 11 | fin | 12 | 6 | 3 | 25 | office | 4 | 0 | 0 |
| 12 | sales | 6 | 3 | 1 | 26 | rep | 4 | 2 | 0 |
| 13 | eng | 6 | 3 | 1 | 27 | arch | 4 | 0 | 0 |
| 14 | ci | 7 | 3 | 1 | | | | | |

## 2. ความคลาดเคลื่อนของข้อมูลต้นฉบับ (Source Discrepancies)

| # | ระดับ | รายละเอียด | วิธีจัดการในแอป |
|---|---|---|---|
| D1 | สูง | สเปกระบุ "หน้า Agent (67 หน้า)" แต่มี 66 หน้า — Agent #28 Accounting & Financial Analysis Agent มีเพียงหน้า Flow (หน้า 73) | หน้า 73 แสดงแผง "สร้าง Agent นี้" จาก `data/agents.json` พร้อมป้ายระบุแหล่งข้อมูล ทำให้ครบ 67 Agent โดยไม่เพิ่มหน้า |
| D2 | สูง | MD เป็นข้อความที่แปลงจากหน้าเว็บเดิม: **ตารางถูกแตกเป็นย่อหน้า** (หน้า 14, 21, 24, 31, 153) และข้อความในปุ่มหาย (รายชื่อ Agent ในหน้า 7, 31, 94 และห่วงโซ่ Workflow) | ประกอบตารางกลับจากลำดับย่อหน้า (ตรวจจำนวนเซลล์ตอน build) และเติมปุ่ม Agent จาก JSON |
| D3 | สูง | Prompt Lab ใน MD มีแค่หมวดแรก (แท็บที่ซ่อนอยู่ไม่ถูกแปลง) | ใช้ 12 หมวดจาก `data/guides.json` และตรวจว่าหมวดแรกตรงกับ MD ทุกตัวอักษร |
| D4 | สูง | Prompt Builder (หน้า 9) ใน MD ไม่มีค่าตัวอย่างและข้อความ Prompt | สร้าง Prompt 3 แบบจากแม่แบบหน้า 8 ขั้น 2–4 ค่าตัวอย่างจากเวอร์ชันเดิม (`legacy/index-v1.html`) |
| D5 | สูง | ส่วนที่ 1 และ CLAUDE.md **ห้ามใช้โลโก้ Microsoft/Copilot** แต่คำสั่งงานรอบนี้ขอ "โลโก้ Copilot ทางการ" | ไม่ฝังไฟล์โลโก้ Microsoft ในโค้ด เตรียมช่องโลโก้ (`assets/brand/copilot-logo.svg`) ที่ build จะแสดงอัตโนมัติเมื่อเจ้าของงานวางไฟล์ที่ได้รับอนุญาต — รอการตัดสินใจ |
| D6 | ต่ำ | ตัวนับ Instructions ที่พิมพ์ใน MD (เช่น 2,837/8,000) น้อยกว่าข้อความจริง 24–27 ตัว เพราะตอนแปลงหัวข้อ `# 1. บทบาท` กลายเป็น `#### 1. บทบาท` | ใช้ข้อความตาม MD และนับตัวอักษรใหม่แบบ live (ทุกตัวยังต่ำกว่า 8,000) |
| D7 | กลาง | สเปกการ์ดบทเรียน 3 กลุ่มครอบคลุม 26 บท ไม่มีบท `intro` (บทที่ 1) | จัดบทที่ 1 ไว้ต้นกลุ่ม "พื้นฐาน" |
| D8 | กลาง | สูตรเครื่องคำนวณพื้นที่เลี้ยง "ลูกไก่ต่อวัน = ยอดเชือด × (1 + %ตาย)" เป็นค่าประมาณ (สูตรที่แม่นกว่าคือ ÷ (1 − %ตาย)) | ใช้สูตรต้นฉบับ และอธิบายความต่างในส่วน "เจาะลึก" |
| D9 | ต่ำ | หน้า 4 ระบุ "ทุก Agent ใน 21 เคส" ขณะที่คู่มือมี 67 Agent และระบุ Knowledge เป็น "ไฟล์ SOP Master Data" ซึ่งขัดกับข้อจำกัดบัญชีองค์กร (ใช้เว็บไซต์ 4 แหล่ง) | คงข้อความต้นฉบับ ชี้แจงในส่วนขยาย |
| D10 | ต่ำ | ทะเบียน/JSON ไม่ระบุรายการคำต้องห้าม (ชื่อบริษัท ฟาร์ม เอกสาร) | audit ตรวจรูปแบบเลขที่เอกสารทั่วไป และอ่านรายการคำเพิ่มจาก `content/forbidden-terms.txt` (เจ้าของงานต้องเติม) |
| D11 | ข้อมูล | ส่วนที่ 1 ระบุ SheetJS จาก cdnjs | ใช้ SheetJS 0.18.5 ฉบับเดียวกันที่แนบในโปรเจกต์ (`vendor/`) เพื่อใช้งานออฟไลน์และทดสอบได้ |

## 3. Architecture

```
content/copilot-ai-agents-for-work.md ─┐ (แหล่งความจริงของเนื้อหา)
data/*.json ───────────────────────────┤ (ข้อมูลที่ MD สูญหาย: ปุ่ม Agent, Prompt Lab, Office chips, Workflow)
content/supplements.mjs ───────────────┤ (ส่วนขยาย: เจาะลึก / ตัวอย่าง / Workshop / วิธีตรวจสอบ — แยกจากต้นฉบับ)
src/ (template.html, app.css, app.js) ─┤
assets/ (logo.png, icons, vendor) ─────┘
        │  scripts/build.mjs  (parse MD → render HTML ต่อหน้าแบบ page-type → bundle)
        ▼
dist/index.html  (ไฟล์เดียว: HTML+CSS+JS+ข้อมูล) + logo.png + vendor/xlsx.full.min.js + netlify.toml headers
        │  scripts/audit.mjs   (ตรวจความครบถ้วนเนื้อหาเทียบ MD ทุกตัวอักษร)
        │  tests/e2e.mjs       (Playwright: ทดสอบทุกฟังก์ชัน 3 ขนาดจอ 2 ธีม)
        ▼
Netlify (build: npm run build · publish: dist)
```

- **Client:** Vanilla JS ไม่มี framework, hash router `#/p/{n}`, `#/agents`, `#/builder`, `#/progress`, `#/appendix-a`, `#/appendix-b`
- **Rendering:** ฝั่ง build แปลง MD ต่อหน้าเป็น HTML ตาม page-type (การ์ด, ขั้นตอน, ตาราง, Prompt พร้อมคัดลอก) เก็บเป็น JSON ฝังในหน้า แสดงเมื่อเปิดหน้า
- **State:** localStorage (ครอบ try/catch): หน้าที่เปิด, หน้าที่เรียนแล้ว, หน้าล่าสุด, ธีม, ค่าฟอร์ม Prompt Builder
- **Design:** Microsoft Fluent 2 — elevation shadow, corner radius 4/8/12, Fluent System Icons (MIT), motion curve Fluent, focus ring ชัด + design tokens จากส่วนที่ 1
- **Security:** CSP, ไม่มี inline event handler, ไฟล์แนบอ่านในเบราว์เซอร์เท่านั้น ไม่ส่งออก

## 4. Development Plan

1. ตั้งโครงโปรเจกต์ + parser + inventory (เสร็จ)
2. Renderer ต่อ page-type + การประกอบตารางที่แตก + เติมข้อมูลจาก JSON
3. App shell: แถบบน, สารบัญ (พับได้/ลิ้นชัก), พื้นที่เนื้อหา, แถบล่างมือถือ, ธีม Light/Dark
4. ฟังก์ชัน: Search (Ctrl+K), Agent Directory, Agent Builder Setup (แผงต่อหน้า + สตูดิโอ), Prompt Builder, Prompt Lab, Calculators ×2, Agent Flow player, Learning Progress, คัดลอก, แนบไฟล์ (SheetJS)
5. ส่วนขยายการเรียนรู้ทุกหน้า (เจาะลึก · ตัวอย่าง · Workshop · วิธีตรวจสอบ)
6. ภาพประกอบ ไอคอน และ Animation (เคารพ prefers-reduced-motion)
7. Audit ความครบถ้วน + E2E tests + แก้ข้อบกพร่อง
8. Netlify config + README + commit/push

## 5. Test Plan

| ชุดทดสอบ | วิธี | เกณฑ์ผ่าน |
|---|---|---|
| T1 ความครบถ้วนเนื้อหา | `scripts/audit.mjs` ดึงทุกย่อหน้า รายการ หัวข้อ Prompt URL จาก MD แต่ละหน้า แล้วค้นในข้อความที่ render จริง (Playwright `textContent`) | 100% ของ atom พบ (ยกเว้นข้อความ UI ที่ระบุเหตุผล) |
| T2 Prompt/บล็อกตั้งค่า | เทียบทุก code block ทีละตัวอักษร | 700/700 |
| T3 URL | ทุก URL ใน MD มีในหน้า + กติกา ≤4 ต่อ Agent, ลึก ≤2, ไม่มี ? | ผ่านทั้งหมด |
| T4 Navigation | เปิดทุกหน้า 155 หน้า ไม่มี console error, ก่อนหน้า/ถัดไป, ลูกศรซ้ายขวา | 0 error |
| T5 Search | Ctrl+K, พิมพ์, ลูกศร, Enter, Esc | ตรงสเปก |
| T6 Agent Directory | ชิปกรองกลุ่ม 17 กลุ่ม, จำนวนการ์ด 67 | ตรง |
| T7 Agent Builder | คัดลอกทุกบล็อก, ตัวนับ, เกินขีดจำกัดเตือน, แนบ .xlsx/.csv → อ่านชีต/คอลัมน์ → แทรก Instructions ส่วนที่ 3 + Knowledge + Prompt เริ่มงาน | ตรง |
| T8 Prompt Builder | แก้ช่อง → Prompt 3 แบบเปลี่ยนทันที | ตรง |
| T9 Calculators | ค่าเริ่มต้นและค่าทดสอบเทียบผลคำนวณมือ | ตรงทศนิยม |
| T10 Progress | ทำเครื่องหมาย, reload คงอยู่, toast จบบท | ตรง |
| T11 Responsive | 1440 / 820 / 390 / 400 px ไม่มีการเลื่อนแนวนอน, ลิ้นชัก <900px, แถบล่างมือถือ | ตรง |
| T12 Theme & A11y | Light/Dark, focus ring, คีย์บอร์ด, reduced-motion | ตรง |
| T13 คำต้องห้าม | ค้น build ด้วยรายการคำต้องห้าม | 0 |

## 6. สถานะหลังพัฒนา (อัปเดตหลังทดสอบจริง)

| ขั้น | สถานะ |
|---|---|
| 1. Parser + Inventory | เสร็จ (`npm run inventory`) |
| 2. Renderer ต่อ page-type + ประกอบตารางกลับ + เติมข้อมูลจาก JSON | เสร็จ — build มี assertion ตรวจว่าข้อมูล JSON ตรงกับ MD (เป้าหมายบท, ขั้นตอน Flow, Prompt Lab หมวด 1, ตาราง route, Matrix 67 แถว, การตั้งค่า Agent ทั้งชุด) |
| 3–4. App shell + ฟังก์ชันทั้งหมด | เสร็จ |
| 5. ส่วนขยายการเรียนรู้ 154 หน้า | เสร็จ (หน้า Agent/Flow/เปิดบท/สรุปโมดูล สร้างจากข้อมูลจริงของแต่ละ Agent/บท, หน้าอื่น 44 หน้าเขียนเฉพาะ) |
| 6. ภาพประกอบ ไอคอน Animation | เสร็จ (Fluent icons 202 ตัว, ภาพประกอบหัวหน้า, Hero path animation, Flow player, เคารพ reduced-motion) |
| 7. Audit + E2E | เนื้อหาขาด 0 จาก 7,767 ชิ้น · Prompt 700/700 · URL 348/348 · E2E 171/171 · axe 0 violation — ดู `docs/TEST-REPORT.md` |
| 8. Netlify | `netlify.toml` + `dist/_headers` (CSP hash) พร้อม — ยังไม่ได้ deploy |
