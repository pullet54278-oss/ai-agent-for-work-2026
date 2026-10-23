# AI + Excel Formula Mastery — ชุดส่งมอบ

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้

หลักสูตร 3 ระดับ (Beginner → Intermediate → Advanced) ตามข้อกำหนด `AI_Excel_3_Levels_Claude_Build_Spec.md` · Web App อยู่ในแอป Copilot AI Agents for Work ที่ `#/excel`

## สถานะ

- บทเรียน Beginner 7 · Intermediate 7 · Advanced 8 บท
- Workshop Beginner 5 · Intermediate 6 · Advanced 7 กิจกรรม พร้อมเฉลยและเกณฑ์ตรวจ
- แบบทดสอบ Beginner 10+10 · Intermediate 10+10 · Advanced 10+10 ข้อ
- สูตร 175 สูตร / 614 กรณีทดสอบ — LibreOffice ผ่าน 528/528 · ยังไม่ได้ทดสอบใน Excel จริง 26 สูตร
- ไฟล์ตัวอย่าง 11 ชีต · สูตร 354/354 เซลล์ตรวจผ่าน

## ไฟล์

- `curriculum/01-beginner.md`
- `prompts/beginner-prompts.md`
- `workshops/beginner-workshops.md`
- `curriculum/02-intermediate.md`
- `prompts/intermediate-prompts.md`
- `workshops/intermediate-workshops.md`
- `curriculum/03-advanced.md`
- `prompts/advanced-prompts.md`
- `workshops/advanced-workshops.md`
- `automation/power-query-guide.md`
- `automation/office-scripts-guide.md`
- `automation/power-automate-flow.md`
- `dashboard/README.md`
- `dashboard/index.html`
- `dashboard/xlsx.full.min.js`
- `tests/formula-test-cases.md`
- `tests/acceptance-criteria.md`
- `data/sample-workbook.xlsx`

## วิธีสร้างใหม่

```bash
python3 scripts/excel/make_workbook.py
python3 scripts/excel/verify_workbook.py
node scripts/excel/verify-formulas.mjs
node scripts/excel/export.mjs
```

## สิ่งที่ต้องตั้งค่าเพิ่มเติม

- Power Query: แก้ FolderPath ให้ชี้โฟลเดอร์จริง และตั้ง Privacy Levels/Credentials
- Office Scripts / Power Automate: ต้องมี License และสิทธิ์ใน Tenant (ตรวจกับบัญชีจริงก่อนสอน)
- Dashboard แบบ Production: ต้องสร้าง Pipeline Excel → ETL → JSON/API และระบบสิทธิ์ ตาม dashboard/README.md
