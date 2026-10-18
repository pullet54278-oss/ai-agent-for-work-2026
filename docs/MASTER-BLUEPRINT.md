# Master Blueprint — Interactive Learning PWA (ต้นแบบสำหรับสร้างคอร์สใหม่)

> โครงสร้างทั้งหมดของ Web App "Copilot AI Agents for Work 2026" (v3.2.0) สรุปเป็นแม่แบบ
> ใช้สร้างคอร์สใหม่: **Gemini & Google AI · ChatGPT · Claude · Grok**
> ทุกตัวเลขในเอกสารนี้มาจากโค้ดและผลทดสอบจริงของ v3.2.0 ใน repo นี้

---

## 1. หลักการออกแบบ (ใช้กับทุกคอร์ส)

```text
ต้นฉบับ (Source of Truth)  →  ส่วนขยาย (แยกกรอบชัด)  →  Build (ไฟล์เดียว + โหลดตามต้องการ)
        →  Audit (ต้นฉบับครบทุกตัวอักษร)  →  Verify (สูตร/ข้อมูลคำนวณจริง)  →  E2E (ทุกฟังก์ชัน)  →  Deploy (Netlify)
```

1. **ต้นฉบับห้ามตัด**: เนื้อหาหลักอยู่ในไฟล์ Markdown 1 ไฟล์ต่อคอร์ส/โมดูล — build แสดงทุกตัวอักษร และ `audit` พิสูจน์ว่าไม่มีส่วนใดหาย
2. **ส่วนขยายแยกจากต้นฉบับ**: คำอธิบายเพิ่ม ตัวอย่าง Workshop วิธีตรวจสอบ แบบทดสอบ อยู่ในไฟล์ `.mjs` แยก และแสดงในกรอบ "ส่วนขยายการเรียนรู้" (audit ตัดกรอบนี้ออกก่อนตรวจต้นฉบับ)
3. **ไม่อ้างสิ่งที่ไม่ได้ทดสอบ**: ทุกฟีเจอร์ที่ขึ้นกับบัญชี/License/เวอร์ชัน ติดป้าย "ตรวจกับบัญชีจริงก่อนสอน" · ทุกสูตร/โค้ดที่รันไม่ได้ในเครื่องทดสอบ ติดป้าย "ยังไม่ได้ทดสอบจริง"
4. **ส่งมอบง่าย**: `dist/` ลากวางขึ้น Netlify ได้ทันที · เปิดจากไฟล์ (file://) ได้ · ติดตั้งเป็นแอป (PWA) และใช้ออฟไลน์ได้
5. **ปลอดภัยโดยค่าเริ่มต้น**: CSP แบบ hash, ไม่มี eval, เนื้อหาไม่ส่ง HTML ดิบ, Email gate เก็บเฉพาะ hash

---

## 2. สถาปัตยกรรม

```text
 content/*.md (ต้นฉบับ) ─┐
 content/*.mjs (ส่วนขยาย) ├─► scripts/build.mjs ──► dist/
 data/*.json (ข้อมูลเสริม) ┤        │                 ├─ index.html        (HTML+CSS+JS+ข้อมูลหลัก ไฟล์เดียว)
 src/ (UI)               ┘        │                 ├─ deep-data.js       (บทเชิงลึก โหลดเมื่อเปิด)
                                  │                 ├─ excel-data.js      (โมดูลเสริม โหลดเมื่อเปิด)
 scripts/fetch-updates.mjs ──► data/copilot-updates.json (ข่าวอัตโนมัติ)  ├─ manifest.webmanifest · sw.js · version.json
 private/ (รายชื่อ Email) ──► hash เท่านั้น                              ├─ icons/ · logo.png · brand/ · vendor/
                                                                       └─ _headers (CSP hash, cache)
 Netlify Functions: /api/copilot-updates (ข่าวสด, cache 6 ชม.) · daily-rebuild (build ใหม่ 06:00 น.)

 เบราว์เซอร์: Email gate → Router (#/...) → หน้า → mount widgets → Progress (localStorage) · Service Worker (offline + อัปเดต)
```

- **ไม่มี framework** (vanilla JS ใน IIFE เดียว) — dependency ตอน build มีแค่ `marked` · ตอนรันใช้ SheetJS (vendored) เฉพาะเมื่ออ่าน/เขียน Excel
- **ขนาดจริง v3.2.0**: `index.html` ≈ 4.4 MB · `deep-data.js` ≈ 1.4 MB · `excel-data.js` ≈ 2.7 MB

---

## 3. โครงสร้างโฟลเดอร์

```text
<course-repo>/
├── CLAUDE.md                     กติกาโปรเจกต์ (ข้อห้าม ข้อจำกัด UI วิธีทำงาน) — Claude อ่านทุกครั้ง
├── README.md · CHANGELOG.md      วิธีใช้/สร้าง/Deploy · บันทึกเวอร์ชัน
├── package.json                  version (แสดงในแอป) + scripts: build, build:offline, updates, audit, test, serve
├── netlify.toml                  build = npm run build · publish = dist · functions = netlify/functions
├── content/
│   ├── <course>.md               ต้นฉบับหลัก: ส่วนที่ 1 สเปก UI · ส่วนที่ 2 เนื้อหาทั้งหมด
│   ├── supplements.mjs           ส่วนขยายรายหน้า (เจาะลึก · ตัวอย่าง · Workshop · วิธีตรวจสอบ)
│   ├── tracks.mjs                เส้นทางการเรียน (เรียงความสำคัญ) อ้าง 'p:N' / 'd:N' / 'x:slug'
│   ├── deep-learning-*.html      ต้นฉบับบทเชิงลึก (ถ้ามี) + deep-quizzes.mjs
│   ├── forbidden-terms.txt       คำต้องห้าม (audit ต้องเจอ 0)
│   └── <module>/                 โมดูลเสริม เช่น excel/: spec.md + SCHEMA.md + level-*.mjs + automation.mjs + sample-data.json
├── data/                         ข้อมูลเสริม JSON (agents, groups, chapters, websites, guides, readiness, updates, updates-th)
├── src/
│   ├── template.html             โครง HTML: แถบบน · สารบัญ · main · แถบล่างมือถือ · modal ค้นหา · toast
│   ├── app.css                   Fluent 2 + design tokens (Light/Dark)
│   ├── app.js                    แอปทั้งหมด (router, หน้า, widgets, ค้นหา, progress, gate, PWA)
│   ├── <module>.js               โค้ดโมดูลเสริม (ฉีดเข้า app.js ตอน build ที่ /*__EXCEL_JS__*/)
│   ├── sw.js                     Service Worker (build เติม build id + precache)
│   └── icons.json                Fluent UI System Icons (MIT) เฉพาะที่ใช้
├── assets/  logo.png · app-icon.png · icons/ (สร้างด้วย make-icons) · brand/ (โลโก้ทางการ + NOTICE) · vendor/ (SheetJS)
├── scripts/
│   ├── build.mjs                 สร้าง dist ทั้งหมด
│   ├── audit.mjs                 ตรวจต้นฉบับครบ + คำต้องห้าม + ตำแหน่งงาน + Email ตัวจริงใน dist
│   ├── inventory.mjs             นับบท/หน้า/Agent/Prompt + ความคลาดเคลื่อนของต้นฉบับ
│   ├── fetch-updates.mjs         ดึงข่าวอัตโนมัติ → data/*-updates.json (ล้มเหลวไม่ทำให้ build ล้ม)
│   ├── make-icons.mjs            ไอคอน PWA ทุกขนาดจาก app-icon.png
│   ├── lib/  source.mjs (อ่าน MD) · render.mjs · pages.mjs (renderer ตามชนิดหน้า) · deep*.mjs · updates.mjs · gate.mjs · excel.mjs
│   └── <module>/  make_workbook.py · verify_workbook.py · verify-formulas.mjs · export.mjs
├── netlify/functions/  <x>-updates.mjs (API ข่าวสด) · daily-rebuild.mjs (Scheduled + BUILD_HOOK_URL)
├── tests/  lib.mjs (เซิร์ฟเวอร์จำลอง Netlify + CSP + gate ทดสอบ) · e2e.mjs (Playwright)
├── private/                      รายชื่อ Email (gitignored ยกเว้น README)
├── docs/   PLAN.md · TEST-REPORT.md · audit/test/formula/workbook report (.json) · MASTER-BLUEPRINT.md
└── <module-deliverables>/        ชุดส่งมอบที่ export จากข้อมูลชุดเดียวกัน (ห้ามแก้มือ)
```

---

## 4. ระบบเนื้อหา

### 4.1 ชั้นเนื้อหา
| ชั้น | ไฟล์ | แสดงในแอป | ตรวจโดย |
|---|---|---|---|
| ต้นฉบับ | `content/<course>.md`, `content/<module>/*.md`, `deep-learning-*.html` | ทุกตัวอักษร (กรอบ "ต้นฉบับ" ในโมดูล) | `audit.mjs` (atoms + code + URL) |
| ส่วนขยาย | `supplements.mjs`, `deep-quizzes.mjs`, `<module>/level-*.mjs` | กรอบ "ส่วนขยายการเรียนรู้" | schema check + verify scripts |
| ข้อมูลเสริม | `data/*.json` | ส่วนที่ MD สูญหาย (ชื่อปุ่ม แท็บ ตาราง) | build assert ว่าตรงกับ MD |
| ข้อมูลสด | `data/*-updates.json` + Function | การ์ดข่าว | e2e (mock live/fail) |

### 4.2 เลขหน้าและ Route
| ช่วงเลข `n` | ชนิด | Route | โหลด |
|---|---|---|---|
| 1 | หน้าแรก | `#/` | ใน index.html |
| 2–155 | คอร์สหลัก (27 บท) | `#/p/{n}` | ใน index.html |
| 1001–1036 | บทเชิงลึก (6 กลุ่ม) | `#/d/{k}` | `deep-data.js` |
| 20101+ (บท×100+ลำดับ) | โมดูลเสริม (5 บท 47 หน้า) | `#/x/{slug}` | `excel-data.js` |

Route อื่น: `#/deep` · `#/excel` (หน้าโมดูล) · `#/tracks` · `#/track/{key}` · `#/updates` · `#/agents` · `#/builder[/{id}]` · `#/progress` · `#/appendix-a|b`

### 4.3 ชนิดหน้า (renderer ใน `scripts/lib/pages.mjs`)
`module` (หน้าเปิดบท) · `agent` (2 คอลัมน์ + แผงสร้าง Agent) · `agentflow` (Flow player + แชทจำลอง) · `pbuild` (Prompt Builder) · `plab` (Prompt Lab แท็บ) · `calc`/`calc2` (เครื่องคำนวณ) · `route` · `matrix` · generic — เพิ่มชนิดใหม่ = เพิ่มฟังก์ชันใน `RENDERERS`

### 4.4 สคีมาส่วนขยายระดับบทเรียน (ใช้ซ้ำได้ทุกคอร์ส — ดู `content/excel/SCHEMA.md`)
```js
{ key, lessons: [{ id, title, objectives[], prerequisites[], concepts[], functions[{name,syntax,purpose,versions}],
    specPrompts[], prompts[{title,text}], formulas[FORMULA], sampleData{title,cols,rows}, expectedOutput[], validation[],
    exercises[{q,answer,hint}], troubleshooting[{problem,fix}] }],
  techniques: [{ id, title, problem, prompt, formula, caution }],
  workshops: [{ id, title, goal, data, steps[], answer[], rubric[], time }],
  quiz: { pre: [[q,[4 ตัวเลือก],ข้อถูก,คำอธิบาย] ×10], post: [... ×10] } }
```
สำหรับคอร์ส AI chat (Gemini/ChatGPT/Claude/Grok) ให้แทน `formulas` ด้วย **PROMPT_CASE**:
`{ id, title, prompt, inputs (ไฟล์/ข้อมูลที่แนบ), expected (ลักษณะผลที่ดี), checks[ ≥3 วิธีตรวจ ], plan ('free'|'paid'|'team'), verifyLabel }`

---

## 5. Build Pipeline (`npm run build`)
1. `fetch-updates.mjs` ดึงข่าว (ข้ามด้วย `SKIP_UPDATES=1`, ล้มเหลวใช้ snapshot เดิม)
2. อ่านต้นฉบับ → render ทุกหน้า → ตรวจข้อมูลเสริมตรงกับ MD → render บทเชิงลึก/โมดูล
3. ประกอบ `index.html` จาก template: CSS inline + sprite ไอคอน + ข้อมูล JSON (`<script type="application/json">`) + JS
4. ฝัง gate config (hash SHA-256 + salt ของ Email) ใน `<script id="gate-cfg">`
5. เขียน `deep-data.js` / `<module>-data.js` (escape `<`), คัดลอก assets/vendor/icons/brand/ไฟล์ดาวน์โหลด
6. PWA: `manifest.webmanifest` (standalone, icons 192/512/maskable, shortcuts) · `sw.js` (build id + precache) · `version.json`
7. `_headers`: CSP (`script-src 'self' 'sha256-…'` ของ inline script ทุกตัว), nosniff, frame-ancestors none, cache รายไฟล์
8. `build-report.json`: จำนวนหน้า/บท, gate, คำแปลข่าว, ผลตรวจโมดูล, คำเตือน

---

## 6. Runtime (src/app.js) — โมดูลที่นำไปใช้ซ้ำได้
| โมดูล | หน้าที่ | ที่เก็บข้อมูล (localStorage) |
|---|---|---|
| Router + setMain + pager | hash routing, ←/→ เปลี่ยนหน้า, ก่อนหน้า/ถัดไปข้ามทุกส่วน | `cpa26-last` |
| สารบัญ (TOC) | กรองข้อความ/กลุ่ม, พับบท, จุดสถานะ, หมวดเชิงลึก/โมดูล | `cpa26-open` |
| ค้นหา Ctrl+K | ดัชนีชื่อ/เนื้อหา/Agent/เครื่องมือ ↑↓ Enter Esc | — |
| Progress | เรียนแล้ว/เปิดดูแล้ว, ring รายบท, หน้า #/progress, toast จบบท | `cpa26-done`, `cpa26-visited` |
| Quiz | ตรวจ/เฉลย/เริ่มใหม่, เก็บคะแนนสูงสุด, เทียบก่อน/หลัง | `cpa26-quiz` |
| Prompt Builder / Framework Builder | ช่องกรอก → Prompt หลายแบบ อัปเดตทันที | `cpa26-pb`, `cpa26-xpb`, `cpa26-dpb-*` |
| Agent Builder panel + Studio | ตัวนับ Name/Description/Instructions, ตรวจ URL, แนบไฟล์ (SheetJS), ดาวน์โหลด .txt | `cpa26-studio` |
| Checklist | ติ๊กวิธีตรวจสอบรายหน้า | `cpa26-chk` |
| Updates | ข่าวสด → fallback snapshot, 3 ข่าวเด่น, สรุปไทย, กรองหมวด | — |
| Email gate | กรอกครั้งเดียวต่อเครื่อง, hash, ออกจากระบบ, revoke | `cpa26-gate` |
| PWA | ลงทะเบียน SW, ปุ่มรีเฟรช/อัปเดต, แบนเนอร์เวอร์ชันใหม่, ติดตั้งแอป | — |
| Theme | Light/Dark จำค่า | `cpa26-theme` |

**เปลี่ยน prefix `cpa26-` เป็นของคอร์สใหม่** (เช่น `gem26-`, `gpt26-`, `cld26-`, `grk26-`) เพื่อไม่ให้ความคืบหน้าปนกันเมื่ออยู่โดเมนเดียวกัน

---

## 7. Design System (Fluent 2)
- **Tokens** (`:root` + `[data-theme="dark"]`): `--bg --surface --surface-2 --ink --ink-2 --line --accent --brand --amber/--green(-soft,-t) --shadow2…28 --r4…16 --font --font-h --mono --acrylic`
- **สีกลุ่ม** `--g-<group>` → ใช้ผ่าน `--dc` (ภาพประกอบ, เส้นขอบ, ป้าย) · ตรวจ contrast WCAG AA ทั้ง 2 ธีม
- **ฟอนต์**: IBM Plex Sans Thai (เนื้อหา) · Bai Jamjuree (หัวข้อ) · IBM Plex Mono (Prompt/โค้ด)
- **Components**: แถบบน (logo + โลโก้ผลิตภัณฑ์ + ค้นหา + เครื่องมือ + รีเฟรช + ธีม + ความคืบหน้า) · page header `ph` + ภาพ SVG `illus()` · การ์ดบท `ccard` · `toc-card` · บล็อก Prompt `.prompt` (คัดลอก) · callout · `badge-verify` · แท็บ · quiz · `stat-tile` · track card · ตาราง `table-wrap` (เลื่อนได้)
- **Breakpoints**: 1280 · 1100 · 900 (ลิ้นชักสารบัญ + แถบล่าง 3 ปุ่ม) · 820 · 640 · 430 · 360 · `display-mode: standalone` (safe-area)
- **ภาพประกอบ**: inline SVG สร้างในโค้ด (`illus(group, icon)`, `heroScene()`) ไม่มีไฟล์ภาพเพิ่ม · `prefers-reduced-motion` ปิดแอนิเมชัน
- **ข้อบังคับ**: ชื่อผลิตภัณฑ์ใช้สีตัวอักษรปกติ ห้ามเลียนแบบสี/รูปแบบโลโก้ · โลโก้ทางการใช้ตามต้นฉบับ (ต้องมีคำสั่ง/อนุญาตจากเจ้าของงาน + NOTICE)

---

## 8. ระบบคุณภาพ (ต้องผ่านก่อนส่งมอบทุกครั้ง)
| ขั้น | คำสั่ง | v3.2.0 |
|---|---|---|
| ความครบต้นฉบับ | `npm run audit` | คอร์สหลัก 7,767 ชิ้น · เชิงลึก 8,029 · โมดูล 289 · ขาด 0 · โค้ด 700/700 + 26/26 · URL 348/348 |
| คำต้องห้าม/ตำแหน่งงาน/Email ใน dist | `npm run audit` | 0 |
| สูตร/ข้อมูลคำนวณจริง | `verify-formulas.mjs`, `verify_workbook.py` | 528/528 กรณี · 354/354 เซลล์ |
| ฟังก์ชันทั้งหมด | `node tests/e2e.mjs` (+ `AXE=…/axe.min.js`) | 23 ชุด · 334/334 · axe WCAG A/AA 0 violation |
| Mutation test | แก้ข้อมูลใน dist/expected แล้วต้องตรวจเจอ | ทำแล้วทุกชั้น |
| ตรวจด้วยตา | Desktop/Mobile × Light/Dark | ภาพหน้าจอทุกรอบ |

ชุด e2e ที่ควรมีในทุกคอร์ส: Navigation · Brand · เส้นทางการเรียน · บทเชิงลึก · Updates · Version/Credit · Search · Directory · Builder · Prompt Builder · Calculators/Lab · Flow · Progress · TOC/Theme · Storage blocked · Responsive (1440→360) · Accessibility · Offline file:// · Email gate · PWA/อัปเดต · โมดูลเสริม

---

## 9. Deploy
- **ลากวาง (Netlify Drop)**: ลากโฟลเดอร์ `dist/` ทั้งโฟลเดอร์ — gate/PWA/offline ทำงาน · Functions ไม่ทำงาน (ข่าวใช้ snapshot)
- **Git-linked**: `netlify.toml` ตั้งค่าครบ · Environment: `ALLOWED_EMAILS` (รายชื่อ, เพราะ private/ ไม่อยู่ใน repo) · `BUILD_HOOK_URL` (build ใหม่รายวัน)
- เวอร์ชันใหม่: แก้ `package.json` version + CHANGELOG → build → deploy → ผู้ใช้เห็นแบนเนอร์ "มีเวอร์ชันใหม่" / กดปุ่มรีเฟรช

---

## 10. วิธีสร้างคอร์สใหม่จาก Master (ทีละขั้น)
1. **สร้าง repo ใหม่** แล้วคัดลอกทั้ง repo นี้ ยกเว้น `content/*` เนื้อหาเดิม, `data/*` เฉพาะคอร์ส, `private/*`, `dist/`, `ai-excel-formula-mastery/`, `legacy/`, `source-docs/`
2. **ตั้งค่าแบรนด์**: ชื่อคอร์สใน `template.html`/`build.mjs` meta · `assets/logo.png` · `assets/app-icon.png` → `node scripts/make-icons.mjs` · โลโก้ผลิตภัณฑ์ใน `assets/brand/` เฉพาะเมื่อได้รับอนุญาต (ไม่มี = แสดงชื่อเป็นตัวอักษรปกติ) · เครดิตผู้สร้าง + ข้อความลิขสิทธิ์
3. **เปลี่ยน prefix** `cpa26-` (localStorage, cache SW `cpa26-`, gate salt `cpa26-gate-v1|`) เป็นของคอร์สใหม่
4. **เขียนต้นฉบับ** `content/<course>.md` (ส่วนที่ 1 สเปก UI · ส่วนที่ 2 เนื้อหา) → `npm run inventory` ดูจำนวนบท/หน้า/Prompt และความคลาดเคลื่อน
5. **ปรับ renderer** ใน `pages.mjs` ตามชนิดหน้า (Agent ของ Copilot ↔ Gems / GPTs / Projects / Skills ฯลฯ) และ `data/*.json` ที่เกี่ยวข้อง
6. **ส่วนขยาย**: `supplements.mjs` ทุกหน้า · `tracks.mjs` (ฟีเจอร์เด่นของคอร์สเป็นเส้นทางแรก) · โมดูลระดับ (Beginner/Intermediate/Advanced) ตามสคีมาข้อ 4.4
7. **ข่าวอัตโนมัติ**: เปลี่ยนแหล่งใน `scripts/lib/updates.mjs` + Function (ดูข้อ 11) · ถ้าแหล่งไม่มี RSS ให้ใช้ snapshot ที่ build ดึง/ผู้สอนอัปเดต · คำแปลไทยใน `data/updates-th.json`
8. **Email gate**: วางรายชื่อใน `private/` หรือ `ALLOWED_EMAILS`
9. **กติกา**: ปรับ `CLAUDE.md` (ข้อห้าม ข้อจำกัดแพลตฟอร์ม ป้ายตรวจกับบัญชีจริง) และ `content/forbidden-terms.txt`
10. **ทดสอบ**: ปรับ expectation ใน `tests/e2e.mjs` (จำนวนหน้า บท route) → `npm run audit` (ขาด 0) → `node tests/e2e.mjs` (ผ่านทั้งหมด) → ภาพหน้าจอ 4 แบบ → commit → zip `dist/`

---

## 11. แผนโครงคอร์ส 4 แพลตฟอร์ม (ร่าง — ชื่อเมนู/ฟีเจอร์/แพ็กเกจ ต้องตรวจกับบัญชีจริงก่อนสอน)

ทุกคอร์สใช้โครงเดียวกัน: **หน้าแรก → เส้นทางหลัก (ฟีเจอร์ "ผู้ช่วยที่สร้างเองได้") → การใช้ในแอปงาน → เบราว์เซอร์/มือถือ → Tips & Tricks → งานจริงตามกลุ่มงาน → ความปลอดภัย/ข้อมูลองค์กร → โมดูลเสริม 3 ระดับ (Prompt/ข้อมูล/Automation)**

| องค์ประกอบใน Master | Gemini & Google AI | ChatGPT | Claude | Grok |
|---|---|---|---|---|
| ฟีเจอร์เด่น (เส้นทางแรก) แทน "Copilot Agent" | Gems (ผู้ช่วยกำหนดเอง) | GPTs / Projects | Projects + Skills | (ตรวจฟีเจอร์ผู้ช่วยกำหนดเองที่มีจริงก่อน) |
| การใช้ในแอปงาน (แทน Excel/Word/PowerPoint) | Gemini ใน Gmail, Docs, Sheets, Slides, Drive, Meet | ไฟล์/การวิเคราะห์ข้อมูล, Canvas, Connectors | Artifacts, วิเคราะห์ไฟล์, Connectors | วิเคราะห์ไฟล์/ภาพ, การค้นข้อมูลแบบเรียลไทม์ |
| งานวิจัย/ค้นข้อมูลพร้อมอ้างอิง | Deep Research, NotebookLM | Deep Research, Search | Research, Web search | DeepSearch |
| สร้างสื่อ | Imagen / Veo / NotebookLM Audio | การสร้างภาพ | ไดอะแกรม/Artifacts | Aurora (สร้างภาพ) |
| Automation / นักพัฒนา | Apps Script, Google AI Studio, Gemini API | Agent mode, Actions, API | Claude Code, MCP, API | API |
| แผนการเรียนเสริม 3 ระดับ (แทน AI + Excel) | AI + Google Sheets | AI + Data Analysis | AI + Documents/Coding | AI + Real-time Research |
| แหล่งข่าวอัตโนมัติ (ตรวจว่ามี RSS/เปิดได้จริงก่อนใช้) | หน้า release notes ทางการของ Gemini / Workspace Updates | หน้า release notes ทางการของ ChatGPT | หน้า release notes ทางการของ Claude | หน้า news ทางการของ Grok |
| ข้อจำกัดที่ต้องสอน | สิทธิ์ Workspace/บัญชีองค์กร, ข้อมูลไม่ใช้ฝึกโมเดลตามสัญญา | แพ็กเกจ Free/Plus/Team/Enterprise | แพ็กเกจ Free/Pro/Team/Enterprise | ข้อมูลเรียลไทม์จากโซเชียล ต้องตรวจแหล่ง |

**เนื้อหาร่วมทุกคอร์ส** (นำจากคอร์ส Copilot ไปปรับได้ทันที): Prompt Framework 8 ส่วน · Instructions 8 ส่วน (บทบาท เป้าหมาย ข้อมูลนำเข้า ขั้นตอน รูปแบบผลลัพธ์ การตรวจสอบ ข้อห้าม เมื่อไม่แน่ใจ) · Input → Process → Output → Verify · ตัวอย่างงานตามกลุ่มงาน · Data Privacy/Governance · Human-in-the-loop · แบบทดสอบก่อน/หลัง

**ข้อควรระวังเรื่องแบรนด์**: ชื่อ/โลโก้ของแต่ละผลิตภัณฑ์เป็นเครื่องหมายการค้าของเจ้าของ — ใช้โลโก้ทางการเฉพาะเมื่อเจ้าของงานสั่งและตรวจแนวทางการใช้แบรนด์แล้ว (บันทึกใน NOTICE.txt เหมือน Copilot) · ห้ามทำตัวอักษรเลียนแบบโลโก้

---

## 12. Master Prompt สำหรับสร้างคอร์สใหม่ (คัดลอกไปใช้กับ Claude Code)

```text
ใช้ docs/MASTER-BLUEPRINT.md ของ repo "ai-agent-for-work-2026" เป็นแม่แบบ สร้าง Interactive Learning PWA ภาษาไทยสำหรับคอร์ส [ชื่อคอร์ส เช่น Gemini & Google AI for Work 2026]
ต้นฉบับเนื้อหา: [ไฟล์ .md ที่แนบ] (ส่วนที่ 1 สเปก UI · ส่วนที่ 2 เนื้อหาทั้งหมด ห้ามตัด Prompt ตาราง URL)

ข้อบังคับ:
- โครงสร้างไฟล์ build pipeline runtime modules design system และระบบคุณภาพ ตาม Blueprint ข้อ 3–9
- ฟีเจอร์เด่น [เช่น Gems] เป็นเส้นทางการเรียนแรก · ทุกหน้ามีส่วนขยาย (เจาะลึก ตัวอย่าง Workshop วิธีตรวจสอบ) แยกจากต้นฉบับ
- ข้อมูลสิทธิ์บัญชี แพ็กเกจ และชื่อเมนู ติดป้าย "ตรวจกับบัญชีจริงก่อนสอน" · ห้ามใส่ชื่อบริษัท/ตำแหน่งงาน · โลโก้ทางการใช้เมื่อได้รับอนุญาตเท่านั้น
- PWA + ปุ่มรีเฟรช/อัปเดต + Email gate (รายชื่อใน private/) + ข่าวอัตโนมัติจาก [แหล่งทางการที่ตรวจแล้วว่าเปิดได้]
- prefix localStorage/cache = [เช่น gem26-] · เวอร์ชันเริ่ม 1.0.0 · เครดิต: Created by [ชื่อ]

วิธีทำงาน: เริ่มด้วย Content Inventory (จำนวนบท หน้า Prompt และความคลาดเคลื่อน) + แผน + Test Plan ให้ยืนยันก่อน
แล้วพัฒนาทีละขั้น รัน npm run audit (ต้องขาด 0) และ node tests/e2e.mjs (ต้องผ่านทั้งหมด) ตรวจภาพหน้าจอ Desktop/Mobile × Light/Dark
รายงานผลทดสอบจริงและส่วนที่ยังไม่ได้ทดสอบ ห้ามอ้างว่าทำงานสมบูรณ์ถ้ายังไม่ได้ทดสอบ
```

---

## 13. Checklist ส่งมอบคอร์สใหม่
- [ ] ต้นฉบับครบ (audit ขาด 0) · คำต้องห้าม 0 · ไม่มี Email ตัวจริงใน dist
- [ ] ทุกหน้ามีส่วนขยาย · เส้นทางการเรียนเริ่มที่ฟีเจอร์เด่น · โมดูลเสริม 3 ระดับมี Workshop + เฉลย + แบบทดสอบ 10+10
- [ ] ป้าย "ตรวจกับบัญชีจริงก่อนสอน" ครบทุกจุดที่ขึ้นกับบัญชี/แพ็กเกจ/เมนู
- [ ] ค้นหา · Progress · Prompt Builder · Quiz · Dashboard/Lab (ถ้ามี) · ออฟไลน์ · ติดตั้งแอป · รีเฟรช/อัปเดต · Email gate ผ่าน e2e
- [ ] Responsive 1440→360 ไม่มีเลื่อนแนวนอน · axe WCAG A/AA 0 · Light/Dark
- [ ] เวอร์ชัน + เครดิตผู้สร้างแสดงหน้าแรกและท้ายทุกหน้า · CHANGELOG · README · TEST-REPORT ระบุส่วนที่ยังไม่ทดสอบ
- [ ] `dist/` zip สำหรับลากวาง + ตั้ง `ALLOWED_EMAILS` / `BUILD_HOOK_URL` ถ้า deploy ผ่าน Git
