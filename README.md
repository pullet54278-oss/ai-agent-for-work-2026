# Copilot AI Agents for Work 2026 — Interactive Learning Web App

คู่มือเรียนรู้แบบโต้ตอบ (ภาษาไทย) สำหรับคอร์ส "การใช้งาน AI แบบพาลงมือทำ" · 23 ตุลาคม 2569
สร้างจาก `content/copilot-ai-agents-for-work.md` (ส่วนที่ 1 = สเปก UI, ส่วนที่ 2 = เนื้อหาทั้งหมด) และ `assets/logo.png`

Live (Netlify): https://ai-agent-for-work-2026.netlify.app

## มีอะไรบ้าง

| ฟังก์ชัน | ที่อยู่ในแอป |
|---|---|
| เนื้อหา 27 บท · 155 หน้า (หน้าแรก + 154 หน้าจากส่วนที่ 2) + ภาคผนวก A/B | สารบัญซ้าย / `#/p/{n}` |
| Agent Directory — 67 Agent กรองตาม 17 กลุ่มงาน ระดับความพร้อม และข้อความ | ปุ่ม "Agent ตามกลุ่มงาน" / `#/agents` |
| Agent Builder Setup ในทุกหน้า Agent — เว็บไซต์ 4 แหล่ง, แนบไฟล์ (SheetJS อ่านชีต/คอลัมน์), บล็อกคัดลอก + ตัวนับ Name ≤30 / Description ≤1,000 / Instructions ≤8,000 | หน้า Agent (แผงขวา) |
| Agent Builder Studio — เขียนการตั้งค่าเอง ตรวจ 8 ส่วน ตรวจกติกา URL ดาวน์โหลด .txt | `#/builder` |
| Prompt Builder (5 ช่อง → Prompt 3 แบบทันที) | หน้า 9 |
| Prompt Lab 12 หมวด | หน้า 23 |
| เครื่องคำนวณ 2 ตัว (ราคาอาหารสัตว์, พื้นที่เลี้ยง) | หน้า 70, 115 |
| Agent Flow player + หน้าต่างแชทจำลอง | 14 หน้า Flow |
| ค้นหา Ctrl+K (ชื่อหน้า, Agent, คำอธิบาย, ข้อมูลที่ใช้, เนื้อหาเต็ม) | ทุกหน้า |
| Learning Progress (localStorage) + toast "จบบทที่ n แล้ว" | `#/progress` |
| ส่วนขยายการเรียนรู้ทุกหน้า: เจาะลึก · ตัวอย่าง · Workshop · วิธีตรวจสอบ (แยกจากต้นฉบับ) | ท้ายทุกหน้า |
| Light/Dark, Desktop/Tablet/Mobile (ลิ้นชักสารบัญ < 900px + แถบล่าง), ลูกศรซ้าย/ขวาเปลี่ยนหน้า | — |

## โครงสร้าง

```
content/copilot-ai-agents-for-work.md   แหล่งความจริงของเนื้อหา (ห้ามตัด/สรุป)
content/supplements.mjs                 ส่วนขยายการเรียนรู้ (เพิ่มเติมจากต้นฉบับ)
content/forbidden-terms.txt             รายการคำต้องห้ามสำหรับ audit (เจ้าของงานเติม)
data/*.json                             ข้อมูลเสริมที่ MD สูญหาย (Prompt Lab 11 หมวด, ปุ่ม Agent, Office chips, Agent #28)
src/template.html · app.css · app.js    UI (Fluent 2 + design tokens ส่วนที่ 1), vanilla JS
src/icons.json                          Fluent UI System Icons (MIT) ที่ใช้
assets/logo.png · favicon.svg · vendor/ โลโก้ AI Agent for Work, SheetJS 0.18.5
scripts/build.mjs                       MD + JSON → dist/ (ไฟล์เดียว index.html + assets + _headers)
scripts/inventory.mjs                   Content inventory + รายการความคลาดเคลื่อนของต้นฉบับ
scripts/audit.mjs                       ตรวจความครบถ้วนเนื้อหาเทียบ MD ทุกตัวอักษร (ในเบราว์เซอร์จริง)
tests/e2e.mjs                           ทดสอบทุกฟังก์ชัน (Playwright)
docs/                                   PLAN.md, TEST-REPORT.md, รายงาน JSON
legacy/index-v1.html                    เวอร์ชันเดิม (อ้างอิงค่าตัวอย่าง Prompt Builder)
```

## คำสั่ง

```bash
npm install            # ติดตั้ง marked (ใช้ตอน build)
npm run build          # สร้าง dist/
npm run inventory      # นับบท/หน้า/Agent/Prompt + ความคลาดเคลื่อน → docs/content-inventory.json
npm run serve          # เปิด dist/ ที่ http://localhost:5173

# ทดสอบ (ต้องมี Playwright + Chromium: npm i -D playwright && npx playwright install chromium)
npm run audit          # ความครบถ้วนเนื้อหา → docs/audit-report.json
node tests/e2e.mjs     # ฟังก์ชันทั้งหมด → docs/test-report.json
AXE=path/to/axe.min.js node tests/e2e.mjs   # เพิ่มการตรวจ WCAG ด้วย axe-core
```

เปิดแบบออฟไลน์ได้: ดับเบิลคลิก `dist/index.html` (ฟอนต์ต้องใช้อินเทอร์เน็ต ถ้าไม่มีจะใช้ฟอนต์ระบบ)

## เผยแพร่บน Netlify

`netlify.toml` ตั้งค่าไว้แล้ว: build command `npm run build` · publish `dist` · Node 22
`dist/_headers` สร้างตอน build: CSP แบบ hash ของสคริปต์ในไฟล์นั้น, nosniff, frame-ancestors none, cache

1. Netlify → Add new site → Import from Git → เลือก repo นี้ (ค่า build อ่านจาก `netlify.toml`)
2. หรือแบบลากวาง: `npm run build` แล้วลากโฟลเดอร์ `dist/` ไปที่ Netlify Drop (ต้องลากทั้งโฟลเดอร์ เพราะมี `_headers` และ `vendor/`)

## โลโก้และภาพประกอบ

- โลโก้ Copilot ทางการ (`assets/brand/copilot-logo.svg`) ใช้ตามคำสั่งเจ้าของงาน แสดงที่แถบบนและหน้าแรก เครื่องหมายการค้าเป็นของ Microsoft — ดู `assets/brand/NOTICE.txt`
  ถ้าองค์กรมีไฟล์จาก Microsoft brand kit ให้วางทับไฟล์เดิมแล้ว build ใหม่
- ภาพประกอบทั้งหมดเป็น inline SVG (ไม่มีไฟล์ภาพเพิ่ม): ฉากหน้าแรก ไฟล์ → Prompt → Agent → ผลลัพธ์ และภาพประกอบประจำกลุ่มงาน 18 แบบ ใช้ในหัวทุกหน้าและการ์ดบทเรียน สีตามกลุ่มงานและธีม

© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret
