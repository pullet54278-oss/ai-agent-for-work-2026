# Acceptance Criteria และ Test Plan

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้

## ต้นฉบับ

## 18. Acceptance Criteria สำหรับ Claude

- [ ] ครบทั้ง Beginner, Intermediate, Advanced พร้อม Course Map
- [ ] Prompt B01–B07, I01–I07, A01–A08 ครบ ไม่ถูกตัด
- [ ] ทุกสูตรระบุ Input/Output, เวอร์ชัน, สมมติฐาน และวิธีตรวจ
- [ ] Workshop อย่างน้อย 5 กิจกรรมต่อระดับ พร้อมเฉลย
- [ ] แบบทดสอบอย่างน้อย 10 ข้อต่อระดับ พร้อมเฉลย
- [ ] ตัวอย่าง Excel มีข้อมูลจริงในไฟล์และสูตรที่ตรวจสอบได้ (หากสร้างไฟล์)
- [ ] มี Power Query ETL, Automation Architecture และ Error Handling
- [ ] Dashboard ใช้งานได้จริงตามขอบเขตที่ประกาศ ไม่อ้างการเชื่อมต่อที่ยังไม่มี
- [ ] Responsive และรองรับภาษาไทย หากพัฒนา Web App
- [ ] มี Test Plan และระบุส่วนที่ยังไม่ผ่านการทดสอบ

## สถานะจริง

| Acceptance Criteria | สถานะ | หลักฐาน / หมายเหตุ |
|---|---|---|
| ครบ 3 ระดับ + Course Map | ทำแล้ว | Beginner 7 บท · Intermediate 7 บท · Advanced 8 บท · หน้า Course Map |
| Prompt B01–B07, I01–I07, A01–A08 ครบ ไม่ถูกตัด | ทำแล้ว · ตรวจอัตโนมัติ | แสดงต้นฉบับทุกตัวอักษรใน Prompt Library และในบทเรียน · audit ตรวจทุกบล็อก |
| ทุกสูตรระบุ Input/Output, เวอร์ชัน, สมมติฐาน, วิธีตรวจ | ทำแล้ว | ทุกสูตรมีป้ายเวอร์ชันและกรณีทดสอบ ≥ 3 |
| Workshop ≥ 5 กิจกรรมต่อระดับ พร้อมเฉลย | ทำแล้ว | Beginner 5 · Intermediate 6 · Advanced 7 |
| แบบทดสอบ ≥ 10 ข้อต่อระดับ พร้อมเฉลย | ทำแล้ว | Beginner ก่อน 10 + หลัง 10 · Intermediate ก่อน 10 + หลัง 10 · Advanced ก่อน 10 + หลัง 10 |
| ตัวอย่าง Excel มีข้อมูลจริงและสูตรตรวจได้ | ทำแล้ว · ทดสอบแล้ว | สูตร 354/354 เซลล์ตรงกับค่าที่คำนวณแยก (LibreOffice) |
| Power Query ETL, Automation Architecture, Error Handling | ทำแล้ว (คู่มือ + โค้ดแม่แบบ) | ยังไม่ได้รันในบัญชี Microsoft 365 จริง |
| Dashboard ใช้งานได้จริงตามขอบเขตที่ประกาศ | ทำแล้ว · ทดสอบใน Chromium | Prototype (ข้อมูลตัวอย่าง) + อัปโหลดไฟล์ · ไม่อ้างการเชื่อมต่อแหล่งข้อมูลจริง |
| Responsive และรองรับภาษาไทย | ทำแล้ว · ทดสอบใน Chromium | Desktop / Tablet / Mobile, Light/Dark |
| Test Plan และส่วนที่ยังไม่ผ่านการทดสอบ | ทำแล้ว | สูตรคลาสสิก 528/528 กรณีผ่าน LibreOffice · สูตร Microsoft 365 26 สูตรยังไม่ได้ทดสอบใน Excel จริง |

## Test Plan

1. `node scripts/excel/verify-formulas.mjs` — ตรวจสคีมา จำนวนบท/Workshop/แบบทดสอบ และคำนวณทุกกรณีทดสอบของสูตรคลาสสิกด้วย LibreOffice
2. `python3 scripts/excel/make_workbook.py && python3 scripts/excel/verify_workbook.py` — สร้างไฟล์ตัวอย่างและเทียบผลทุกเซลล์สูตร
3. `npm run audit` — ตรวจว่าต้นฉบับทุกส่วน (รวม Prompt 24 บล็อก) แสดงใน Web App ครบ
4. `node tests/e2e.mjs` — ทดสอบหน้า Excel, Prompt Library, Formula Lab, Quiz, Progress, Dashboard (กรอง/Export/อัปโหลด/Error), ออฟไลน์ และ Responsive

## ยังไม่ได้ทดสอบ

- สูตร Microsoft 365 / Excel 2021+ (XLOOKUP, FILTER, LET, LAMBDA, MAP, GROUPBY ฯลฯ) ยังไม่ได้รันใน Excel จริง — ตรวจตรรกะด้วยกรณีทดสอบเท่านั้น
- Power Query M Code, Office Scripts และ Power Automate Flow เป็นแม่แบบ ยังไม่ได้รันในบัญชี Microsoft 365 จริง
- Dashboard ทดสอบใน Chromium (Desktop/Mobile) เท่านั้น ยังไม่ได้ทดสอบบน Safari/Firefox
- การเปิดไฟล์ sample-workbook.xlsx ใน Microsoft Excel จริง (ตรวจด้วย LibreOffice)
