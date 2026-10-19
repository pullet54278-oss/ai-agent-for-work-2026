# Copilot AI Agents for Work 2026 — Interactive Learning Web App

คู่มือเรียนรู้แบบโต้ตอบ (ภาษาไทย) สำหรับคอร์ส "การใช้งาน AI แบบพาลงมือทำ" · 23 ตุลาคม 2569
สร้างจาก `content/copilot-ai-agents-for-work.md` (ส่วนที่ 1 = สเปก UI, ส่วนที่ 2 = เนื้อหาทั้งหมด) และ `assets/logo.png`

Live (Netlify): https://ai-agent-for-work-2026.netlify.app · **เวอร์ชัน 3.2.0** (ดู `CHANGELOG.md`)

## มีอะไรบ้าง

| ฟังก์ชัน | ที่อยู่ในแอป |
|---|---|
| เนื้อหา 27 บท · 155 หน้า (หน้าแรก + 154 หน้าจากส่วนที่ 2) + ภาคผนวก A/B | สารบัญซ้าย / `#/p/{n}` |
| Agent Directory — 67 Agent กรองตาม 17 กลุ่มงาน ระดับความพร้อม และข้อความ | ปุ่ม "Agent ตามกลุ่มงาน" / `#/agents` |
| Agent Builder Setup ในทุกหน้า Agent — เว็บไซต์ 4 แหล่ง, แนบไฟล์ (SheetJS อ่านชีต/คอลัมน์), บล็อกคัดลอก + ตัวนับ Name ≤30 / Description ≤1,000 / Instructions ≤8,000 | หน้า Agent (แผงขวา) |
| Agent Builder Studio — เขียนการตั้งค่าเอง ตรวจ 8 ส่วน ตรวจกติกา URL ดาวน์โหลด .txt | `#/builder` |
| Prompt Builder (5 ช่อง → Prompt 3 แบบทันที) | หน้า 9 |
| **Prompt Lab อัตโนมัติ** — โยนไฟล์ PDF / Excel / CSV / TXT หรือวางข้อความ → วิเคราะห์ในเครื่อง (ประเภทเอกสาร หัวข้อ คำสำคัญ ตัวเลข/วันที่ โครงสร้างตาราง) → Prompt พร้อมคัดลอก 7 แบบ ปรับตามเป้าหมาย/ผู้อ่าน/รูปแบบ · ไม่ส่งข้อมูลออกนอกเครื่อง | หน้าแรก (ต่อจาก Hero) / `#/plab` |
| Prompt Lab 12 หมวด | หน้า 23 |
| เครื่องคำนวณ 2 ตัว (ราคาอาหารสัตว์, พื้นที่เลี้ยง) | หน้า 70, 115 |
| Agent Flow player + หน้าต่างแชทจำลอง | 14 หน้า Flow |
| ค้นหา Ctrl+K (ชื่อหน้า, Agent, คำอธิบาย, ข้อมูลที่ใช้, เนื้อหาเต็ม) | ทุกหน้า |
| Learning Progress (localStorage) + toast "จบบทที่ n แล้ว" | `#/progress` |
| ส่วนขยายการเรียนรู้ทุกหน้า: เจาะลึก · ตัวอย่าง · Workshop · วิธีตรวจสอบ (แยกจากต้นฉบับ) | ท้ายทุกหน้า |
| **เส้นทางการเรียน 7 เส้นทาง** — Copilot Agent (เริ่มที่นี่) · Excel/Word/PowerPoint · เบราว์เซอร์ · Tips & Tricks · ประยุกต์ใช้งานจริง · พื้นฐาน · ขยายผลในองค์กร | หน้าแรก / `#/tracks`, `#/track/{key}` |
| **Deep Learning 36 บทเชิงลึก** (บูรณาการจาก v10) จัด 6 กลุ่ม · แบบทดสอบเฉพาะบท 3 ข้อทุกบท · Prompt Builder/เครื่องมือตัดสินใจ/Checklist · เนื้อหาที่ซ้ำทุกบทรวมไว้ที่หน้าภาพรวม | `#/deep`, `#/d/{1–36}` |
| **อัปเดตล่าสุดเกี่ยวกับ Microsoft Copilot** (อัตโนมัติจาก Microsoft 365 Roadmap) สรุปภาษาไทยทุกการ์ด · หน้าแรกแสดง 3 ข่าวเด่น · ข่าวทั้งหมดกดเปิดดูได้ | หน้าแรก / `#/updates` |
| **AI + Excel Formula Mastery** 3 ระดับ · Prompt Library · Formula Lab · Interactive Dashboard · ไฟล์ Excel ตัวอย่าง · แบบทดสอบก่อน/หลังเรียน | `#/excel`, `#/x/{slug}` |
| **PWA** ติดตั้งเป็นแอปบนมือถือ/แท็บเล็ต ใช้ออฟไลน์ได้ · ปุ่ม **รีเฟรช · อัปเดตแอป** | แถบบน / เมนูเครื่องมือ |
| **เปิดให้ทุกคนเข้าได้** ไม่ต้องลงชื่อ (Email gate ปิดตั้งแต่ v3.3.1 · เปิดคืนได้ด้วย `EMAIL_GATE=on`) | — |
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
src/promptlab.js                        Prompt Lab อัตโนมัติ (ฉีดเข้า app.js ตอน build เหมือน src/excel.js)
src/icons.json                          Fluent UI System Icons (MIT) ที่ใช้
assets/logo.png · favicon.svg · vendor/ โลโก้ AI Agent for Work, SheetJS 0.18.5, pdf.js 4.10.38 (Apache-2.0, vendor/pdfjs/ โหลดเมื่อโยน PDF)
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

## AI + Excel Formula Mastery

| ส่วน | ไฟล์ |
|---|---|
| ต้นฉบับ (Source of Truth) | `content/excel/AI_Excel_3_Levels_Claude_Build_Spec.md` (แสดงทุกตัวอักษรในกรอบ "ต้นฉบับ") |
| ส่วนขยาย (บทเรียน สูตร เทคนิค Workshop แบบทดสอบ) | `content/excel/level-b.mjs`, `level-i.mjs`, `level-a.mjs` ตามสคีมา `content/excel/SCHEMA.md` · คู่มือ Automation `content/excel/automation.mjs` |
| ไฟล์ Excel ตัวอย่าง | `python3 scripts/excel/make_workbook.py` → `ai-excel-formula-mastery/data/sample-workbook.xlsx` + `content/excel/sample-data.json` |
| ตรวจสูตร | `node scripts/excel/verify-formulas.mjs` (สคีมา + คำนวณทุกกรณีทดสอบด้วย LibreOffice) · `python3 scripts/excel/verify_workbook.py` (ทุกเซลล์สูตรในไฟล์ตัวอย่าง) |
| ชุดส่งมอบ | `node scripts/excel/export.mjs` → `ai-excel-formula-mastery/` (curriculum, prompts, workshops, automation, dashboard, tests) |
| หน้าเว็บ | `scripts/lib/excel.mjs` (render) · `src/excel.js` (Prompt Library, Formula Lab, Dashboard) → `dist/excel-data.js` โหลดเมื่อเปิดหน้า |

ลำดับเมื่อแก้เนื้อหา: แก้ `content/excel/*.mjs` → `node scripts/excel/verify-formulas.mjs` (ต้อง 0 ปัญหา) → `npm run build` → `node scripts/excel/export.mjs` → `npm run audit` → `node tests/e2e.mjs`

## Email gate (สิทธิ์เข้าใช้งาน) — ปิดอยู่

ตั้งแต่ v3.3.1 เจ้าของงานให้ทุกคนเข้าใช้ได้โดยไม่ต้องลงชื่อ build จะไม่ฝังรายชื่อหรือ hash ใด ๆ · ถ้าต้องการเปิดคืน ตั้ง env `EMAIL_GATE=on` (Netlify → Environment variables) พร้อมรายชื่อตามขั้นตอนด้านล่าง แล้ว build ใหม่


1. รายชื่อ Email: วางไฟล์ `.txt` / `.csv` / `.xlsx` ใน `private/` (ไม่ถูก commit) หรือ Netlify → Environment variables → `ALLOWED_EMAILS` (คั่นด้วย , หรือขึ้นบรรทัดใหม่) แล้ว build ใหม่
2. build แปลงทุก Email เป็น SHA-256 (+ salt) แล้วฝังเฉพาะ hash ในหน้าเว็บ · เครื่องผู้ใช้จำ hash ไว้ใน localStorage — เปิดแอปใหม่เข้าได้ทันที, ล้างข้อมูลเว็บไซต์หรือ "ออกจากระบบ" เพื่อเปลี่ยน Email
3. ถ้าไม่มีรายชื่อ ระบบ gate จะปิด (build แจ้งเตือน)

**ข้อจำกัดสำคัญ:** gate ตรวจในเบราว์เซอร์ จึงกันผู้ใช้ทั่วไปได้ แต่ไม่ใช่ระบบความปลอดภัยระดับเซิร์ฟเวอร์ — ผู้ที่มีความรู้เทคนิคยังเปิดดูไฟล์เนื้อหาได้โดยตรง และ hash ของ Email ที่เดาง่ายอาจถูกเดาได้ ถ้าต้องการปิดกั้นจริงให้ใช้ Netlify Password Protection / Identity หรือ Edge Function

## PWA และการอัปเดตแอป

- `manifest.webmanifest` + ไอคอนใน `assets/icons/` (สร้างด้วย `node scripts/make-icons.mjs` จาก `assets/app-icon.png` ถ้ามี ไม่มีจะใช้ `assets/logo.png`) · `sw.js` แคชตัวแอปให้ใช้ออฟไลน์ (หน้าเว็บใช้เครือข่ายก่อน 4 วินาทีแล้วค่อยใช้แคช, ไฟล์อื่น stale-while-revalidate, `/api/` และ `version.json` ไม่แคช)
- ทุก build มี `version.json` (version + build id) · ปุ่มรีเฟรชตรวจไฟล์นี้: ถ้ามีเวอร์ชันใหม่ → ติดตั้ง Service Worker ใหม่แล้วโหลดหน้าใหม่, ถ้าล่าสุดแล้ว → รีเฟรชข่าวและข้อมูล · แอปตรวจเองเมื่อเปิดและทุกครั้งที่กลับมาที่แอป (ไม่บ่อยกว่า 15 นาที)
- ติดตั้ง: Android/Chrome/Edge → เมนูเครื่องมือ "ติดตั้งเป็นแอป" · iPhone/iPad → Safari ปุ่มแชร์ → "เพิ่มไปยังหน้าจอโฮม"

## โลโก้และภาพประกอบ

- โลโก้ Copilot ทางการ (`assets/brand/copilot-logo.svg`) ใช้ตามคำสั่งเจ้าของงาน แสดงที่แถบบนและหน้าแรก เครื่องหมายการค้าเป็นของ Microsoft — ดู `assets/brand/NOTICE.txt`
  ถ้าองค์กรมีไฟล์จาก Microsoft brand kit ให้วางทับไฟล์เดิมแล้ว build ใหม่
- ภาพประกอบทั้งหมดเป็น inline SVG (ไม่มีไฟล์ภาพเพิ่ม): ฉากหน้าแรก ไฟล์ → Prompt → Agent → ผลลัพธ์ และภาพประกอบประจำกลุ่มงาน 18 แบบ ใช้ในหัวทุกหน้าและการ์ดบทเรียน สีตามกลุ่มงานและธีม

© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret
