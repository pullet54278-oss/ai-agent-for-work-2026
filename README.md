# Copilot AI Agents for Work 2026 — Interactive Learning Web App

คู่มือเรียนรู้แบบโต้ตอบ (ภาษาไทย) สำหรับคอร์ส "การใช้งาน AI แบบพาลงมือทำ" · 23 ตุลาคม 2569
สร้างจาก `content/copilot-ai-agents-for-work.md` (ส่วนที่ 1 = สเปก UI, ส่วนที่ 2 = เนื้อหาทั้งหมด) และ `assets/logo.png`

Live (Netlify): https://ai-agent-for-work-2026.netlify.app · **เวอร์ชัน 3.0.0** (ดู `CHANGELOG.md`)

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
| **เส้นทางการเรียน 7 เส้นทาง** — Copilot Agent (เริ่มที่นี่) · Excel/Word/PowerPoint · เบราว์เซอร์ · Tips & Tricks · ประยุกต์ใช้งานจริง · พื้นฐาน · ขยายผลในองค์กร | หน้าแรก / `#/tracks`, `#/track/{key}` |
| **Deep Learning 36 บทเชิงลึก** (บูรณาการจาก v10) จัด 6 กลุ่ม · แบบทดสอบเฉพาะบท 3 ข้อทุกบท · Prompt Builder/เครื่องมือตัดสินใจ/Checklist · เนื้อหาที่ซ้ำทุกบทรวมไว้ที่หน้าภาพรวม | `#/deep`, `#/d/{1–36}` |
| **อัปเดตล่าสุดเกี่ยวกับ Microsoft Copilot** (อัตโนมัติจาก Microsoft 365 Roadmap) กรองตามหัวข้อ · แสดงเด่นที่หน้าแรก | หน้าแรก / `#/updates` |
| หมายเลขเวอร์ชัน + เครดิตผู้สร้าง Nattapon Yokkret | หน้าแรก (ป้าย v3.0.0) และท้ายทุกหน้า |
| Light/Dark, Desktop/Tablet/Mobile (ลิ้นชักสารบัญ < 900px + แถบล่าง), ลูกศรซ้าย/ขวาเปลี่ยนหน้า | — |

## โครงสร้าง

```
content/copilot-ai-agents-for-work.md   แหล่งความจริงของเนื้อหา (ห้ามตัด/สรุป)
content/supplements.mjs                 ส่วนขยายการเรียนรู้ (เพิ่มเติมจากต้นฉบับ)
content/deep-learning-v10.html          ต้นฉบับ Deep Learning 36 บท (v10) — build แปลงเป็น HTML ปลอดภัย (ไม่มี eval) + แทนชื่อตำแหน่ง/เลขที่เอกสาร
content/deep-quizzes.mjs                แบบทดสอบเฉพาะบท 3 ข้อ (บท 2–36)
content/tracks.mjs                      เส้นทางการเรียน 7 เส้นทาง (Copilot Agent เป็นลำดับแรก)
data/copilot-updates.json               snapshot อัปเดต Copilot จาก Microsoft 365 Roadmap (เขียนโดย scripts/fetch-updates.mjs)
netlify/functions/                      copilot-updates.mjs (API สด /api/copilot-updates) · daily-rebuild.mjs (build ใหม่ทุกวัน)
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
npm run build          # ดึงอัปเดต Copilot ล่าสุด (ถ้าเครือข่ายใช้ได้) แล้วสร้าง dist/
npm run build:offline  # สร้าง dist/ จาก snapshot เดิม ไม่ดึงข้อมูลใหม่
npm run updates        # ดึงอัปเดตอย่างเดียว → data/copilot-updates.json
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

## ระบบอัปเดตอัตโนมัติ (Microsoft Copilot news)

แหล่งข้อมูล: RSS ทางการของ Microsoft 365 Roadmap (`https://www.microsoft.com/releasecommunications/api/v2/m365/rss`) กรองเฉพาะรายการที่เกี่ยวกับ Copilot แล้วจัดหัวข้อ (Copilot Agent / Excel·Word·PowerPoint / Teams·Outlook / เบราว์เซอร์·SharePoint / ความปลอดภัย·ผู้ดูแลระบบ / อื่น ๆ)

| ชั้น | ทำงานอย่างไร |
|---|---|
| 1. Snapshot ตอน build | `scripts/fetch-updates.mjs` เขียน `data/copilot-updates.json` แล้วฝังในหน้าเว็บ ถ้าดึงไม่ได้ใช้ snapshot เดิม (build ไม่ล้ม) |
| 2. API สด | Netlify Function `/api/copilot-updates` ดึง RSS ทุกครั้งที่ cache หมดอายุ (CDN cache 6 ชั่วโมง + stale-while-revalidate) หน้าเว็บเรียกเมื่อเปิด ถ้าไม่สำเร็จแสดง snapshot พร้อมบอกวันที่ข้อมูล |
| 3. Build ใหม่ทุกวัน | Scheduled Function `daily-rebuild` (06:00 น. เวลาไทย) เรียก Build Hook เพื่อรีเฟรช snapshot และการค้นหา |

ตั้งค่าครั้งเดียว: Netlify → Site configuration → Build & deploy → **Build hooks** → Add build hook → คัดลอก URL → Environment variables → เพิ่ม `BUILD_HOOK_URL` = URL นั้น
หมายเหตุ: Functions ทำงานเฉพาะการ deploy แบบเชื่อม Git หรือ Netlify CLI (`netlify deploy --prod`) — **Netlify Drop (ลากวาง) ไม่รองรับ Functions** หน้าเว็บจะยังแสดง snapshot ได้ตามปกติ

## โลโก้และภาพประกอบ

- โลโก้ Copilot ทางการ (`assets/brand/copilot-logo.svg`) ใช้ตามคำสั่งเจ้าของงาน แสดงที่แถบบนและหน้าแรก เครื่องหมายการค้าเป็นของ Microsoft — ดู `assets/brand/NOTICE.txt`
  ถ้าองค์กรมีไฟล์จาก Microsoft brand kit ให้วางทับไฟล์เดิมแล้ว build ใหม่
- ภาพประกอบทั้งหมดเป็น inline SVG (ไม่มีไฟล์ภาพเพิ่ม): ฉากหน้าแรก ไฟล์ → Prompt → Agent → ผลลัพธ์ และภาพประกอบประจำกลุ่มงาน 18 แบบ ใช้ในหัวทุกหน้าและการ์ดบทเรียน สีตามกลุ่มงานและธีม

© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret
