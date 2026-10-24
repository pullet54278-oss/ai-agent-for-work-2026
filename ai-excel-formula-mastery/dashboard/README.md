# Interactive HTML Dashboard: Prototype vs Production

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้

Dashboard นี้มี 3 โหมด และต้องบอกผู้ใช้ทุกครั้งว่ากำลังดูโหมดใด: **Prototype** ใช้ข้อมูลตัวอย่าง F001–F004 ที่ฝังในไฟล์ เพื่อสาธิต Layout และการโต้ตอบ ไม่เชื่อมข้อมูลจริงและไม่ควรใช้ตัดสินใจ · **อัปโหลดไฟล์** อ่านไฟล์ Excel/CSV/JSON ที่ผู้ใช้เลือกในเบราว์เซอร์ อัปเดตเมื่อมีการอัปโหลดใหม่เท่านั้น · **Production** อ่าน data feed ที่ Pipeline สร้างและผ่านการอนุมัติแล้ว

**สิ่งที่ไฟล์ HTML ทำไม่ได้เอง:** HTML แบบ Static ไม่อ่านไฟล์ Excel บน SharePoint/OneDrive โดยอัตโนมัติ และไม่รู้ว่าไฟล์ต้นทางเปลี่ยน ต้องมี Power Query/Power Automate/Server job สร้าง `farm-kpi.json` ใหม่ หรือให้ผู้ใช้อัปโหลดไฟล์ใหม่

**วิธีรัน Prototype:** เปิด `dashboard/index.html` ผ่านเว็บเซิร์ฟเวอร์ภายในเครื่อง (เช่น `npx serve dashboard` หรือ `python -m http.server` ในโฟลเดอร์ dashboard) แล้วเปิด URL ที่ได้ — การเปิดแบบ file:// อาจโหลด JSON ไม่ได้เพราะนโยบายความปลอดภัยของเบราว์เซอร์

**วิธีใช้โหมดอัปโหลด:** กดปุ่ม "เลือกไฟล์" เลือกไฟล์ที่มีชีต/ตารางตาม Schema (Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count, Birds_Placed) ระบบตรวจ Schema ก่อนแสดง ถ้าไม่ผ่านจะแสดงรายการคอลัมน์ที่ขาดหรือผิดชนิด ไฟล์ไม่ถูกส่งออกจากเครื่อง

**วิธีเชื่อม Production:** (1) สร้าง Pipeline ตามคู่มือ Power Automate หรือ Server job ที่เขียน `published/farm-kpi.json` ตาม jsonContract (2) โฮสต์ Dashboard ในที่ที่ใช้ SSO ขององค์กร (3) ตั้งค่า URL ของ feed ในไฟล์ config (ไม่ใส่ secret) (4) ตั้ง CSP/Cache-Control (5) รัน Test Cases TC-DB-01 ถึง TC-DB-10 โดยเฉพาะ TC-DB-08 พิสูจน์ Refresh End-to-End แล้วบันทึกผลจริงก่อนเปลี่ยนป้ายเป็น Production

**การอ่านค่า:** การ์ด FCR และ Mortality ใช้นิยามใน `kpi_definition` ของ feed ถ้า quality_warnings แจ้งว่านิยามยังไม่ยืนยัน การ์ดจะมีเครื่องหมายเตือน · Last Updated คือเวลา Refresh ของข้อมูล ไม่ใช่เวลาที่เปิดหน้า

**สถานะที่ยังไม่ได้ทดสอบ:** ระบุในส่วนท้ายของ README ว่า Test Case ใดผ่านแล้ว (วันที่/ผู้ทดสอบตามบทบาท) และใดยังไม่ได้ทดสอบ ตามข้อ 18 ของต้นฉบับ

## Data Flow

1. **1. Excel ต้นทาง:** ไฟล์รายวันใน Farm_Inbox (ตาราง Farm_Performance) ตาม Schema เดียวกับคู่มือ Power Query
2. **2. ETL:** Power Query (desktop) หรือ Office Scripts + Power Automate ตรวจ Schema, แยก Error, รวมเป็น Farm_Daily, คำนวณ KPI ตามนิยามที่ยืนยันแล้ว
3. **3. Data feed:** สร้าง `farm-kpi.json` ตาม jsonContract → staging → Human Approval → published (หรือ API บนเซิร์ฟเวอร์ที่อ่านข้อมูลชุดที่อนุมัติ)
4. **4. HTML Dashboard:** โหลด JSON จาก published ผ่าน HTTPS ที่ต้องยืนยันตัวตน ตรวจ contract ก่อนแสดง แสดง last_updated/refresh_status และเตือนเมื่อข้อมูลเก่า
5. **5. Feedback loop:** quality_warnings และ Error_Rows ส่งกลับไปผู้รับผิดชอบไฟล์ต้นทาง — Dashboard ไม่แก้ข้อมูลเอง

## โหมด

- **Prototype (ข้อมูลตัวอย่าง):** ฝังข้อมูลตัวอย่าง F001–F004 ในไฟล์ HTML (เช่น sample-data.json) เพื่อทดลอง Layout/Filter/Chart · ป้ายบนสุด "Prototype — ข้อมูลตัวอย่าง ไม่เชื่อมข้อมูลจริง" · last_updated = วันที่สร้างข้อมูลตัวอย่าง · refresh_status = "sample" · ใช้สอนและรับ Feedback เท่านั้น ห้ามใช้ตัดสินใจ
- **อัปโหลดไฟล์ (Static + ไฟล์ผู้ใช้):** HTML เดียวกันเพิ่มปุ่มเลือกไฟล์ (.xlsx/.csv/.json) อ่านในเบราว์เซอร์ด้วยไลบรารีอ่าน Excel (เช่น SheetJS) ไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์ ตรวจ Schema แบบเดียวกับ Validate_Farm_Data ก่อนแสดง · ข้อมูลอัปเดตเมื่อผู้ใช้อัปโหลดไฟล์ใหม่เท่านั้น · Data Source = ชื่อไฟล์ที่อัปโหลด · Last Updated = เวลาที่อัปโหลด (ไม่ใช่เวลาข้อมูลต้นทาง) — ต้องเขียนกำกับให้ชัด
- **Production (เชื่อมข้อมูลจริง):** Dashboard โฮสต์ในที่ที่ต้องยืนยันตัวตน อ่าน `published/farm-kpi.json` หรือ API ที่ Pipeline อัปเดตหลังการอนุมัติ · แสดง run_id, last_updated, refresh_status และ quality_warnings จาก feed · มีการทดสอบพิสูจน์ Refresh End-to-End ก่อนประกาศว่าเป็น Production
  - Pipeline ที่ทำงานจริงและผ่าน Test Cases (Power Automate Flow หรือ Server job) พร้อม Execution Log
  - ที่เก็บ data feed ที่ควบคุมสิทธิ์ได้ (SharePoint/OneDrive, Blob storage ที่มี SAS อายุสั้น หรือ API ภายใน) — การดึงไฟล์จาก SharePoint ด้วย JavaScript ต้องผ่าน Microsoft Graph พร้อม Entra ID app registration (ตรวจกับบัญชีจริงก่อนสอน)
  - การยืนยันตัวตน (SSO ขององค์กร) และการกำหนดสิทธิ์ผู้ชม
  - Human Approval ก่อนเผยแพร่ feed และ Audit trail
  - เกณฑ์ข้อมูลเก่า (stale) ที่ตกลงกัน เช่น เกิน 26 ชั่วโมงสำหรับข้อมูลรายวัน
  - ผู้รับผิดชอบดูแลระบบและช่องทางแจ้งปัญหา
  - นิยาม KPI ที่ผู้มีอำนาจอนุมัติยืนยันแล้ว (โดยเฉพาะ Feed รายวัน/สะสม และสูตร FCR)

## JSON Contract

```json
// ===== JSON Schema (draft 2020-12) ของ farm-kpi.json =====
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Farm KPI dashboard feed",
  "type": "object",
  "required": ["schema_version", "data_source", "mode", "last_updated", "refresh_status", "rows", "quality_warnings"],
  "properties": {
    "schema_version": { "type": "string", "const": "1.0" },
    "mode":           { "type": "string", "enum": ["prototype", "upload", "production"] },
    "run_id":         { "type": ["string", "null"], "description": "Idempotency key ของรันที่สร้างข้อมูล" },
    "data_source":    { "type": "string", "description": "ที่มาของข้อมูล เช่น ตาราง/ไฟล์ และวิธี ETL" },
    "last_updated":   { "type": "string", "format": "date-time", "description": "เวลา Refresh ของข้อมูล (ไม่ใช่เวลา export)" },
    "generated_at":   { "type": "string", "format": "date-time" },
    "refresh_status": { "type": "string", "enum": ["sample", "success", "success_with_warnings", "success_with_errors", "failed", "skipped_duplicate_run"] },
    "approved_by_role": { "type": ["string", "null"], "description": "เช่น ผู้มีอำนาจอนุมัติ (ไม่ใส่ชื่อ/อีเมลบุคคลใน feed สาธารณะ)" },
    "kpi_definition": { "type": "object", "properties": {
        "feed_basis": { "type": "string", "enum": ["cumulative", "daily"] },
        "mortality_basis": { "type": "string", "enum": ["cumulative", "daily"] },
        "fcr_formula": { "type": "string" } } },
    "row_count":      { "type": "integer", "minimum": 0 },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["Farm_ID", "Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"],
        "properties": {
          "Farm_ID":         { "type": "string", "pattern": "^F00[1-4]$" },
          "Date":            { "type": "string", "format": "date" },
          "Age_Days":        { "type": "integer", "minimum": 0 },
          "Body_Weight_g":   { "type": "number", "exclusiveMinimum": 0 },
          "Feed_Intake_kg":  { "type": "number", "minimum": 0 },
          "Mortality_Count": { "type": "integer", "minimum": 0 },
          "Birds_Placed":    { "type": "integer", "exclusiveMinimum": 0 },
          "Source_File":     { "type": ["string", "null"] },
          "Refresh_Timestamp": { "type": ["string", "null"], "format": "date-time" }
        }
      }
    },
    "quality_warnings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["level", "code", "message"],
        "properties": {
          "level":   { "type": "string", "enum": ["INFO", "WARNING", "ERROR"] },
          "code":    { "type": "string" },
          "farm_id": { "type": ["string", "null"] },
          "row":     { "type": ["integer", "null"] },
          "column":  { "type": ["string", "null"] },
          "message": { "type": "string" }
        }
      }
    }
  }
}

// ===== ตัวอย่าง payload (ข้อมูลสมมติ ข้อ 15 ของต้นฉบับ) =====
{
  "schema_version": "1.0",
  "mode": "prototype",
  "run_id": null,
  "data_source": "ข้อมูลตัวอย่าง Farm_Performance (ข้อ 15) — ไม่เชื่อมข้อมูลจริง",
  "last_updated": "2026-10-08T00:00:00Z",
  "generated_at": "2026-10-14T00:00:00Z",
  "refresh_status": "sample",
  "approved_by_role": null,
  "kpi_definition": { "feed_basis": "cumulative", "mortality_basis": "cumulative",
    "fcr_formula": "Feed_Intake_kg / (Body_Weight_g/1000 * (Birds_Placed - Mortality_Count))" },
  "row_count": 4,
  "rows": [
    { "Farm_ID": "F001", "Date": "2026-10-01", "Age_Days": 14, "Body_Weight_g": 520, "Feed_Intake_kg": 2400, "Mortality_Count": 3, "Birds_Placed": 10000, "Source_File": null, "Refresh_Timestamp": null },
    { "Farm_ID": "F001", "Date": "2026-10-08", "Age_Days": 21, "Body_Weight_g": 950, "Feed_Intake_kg": 3600, "Mortality_Count": 4, "Birds_Placed": 10000, "Source_File": null, "Refresh_Timestamp": null },
    { "Farm_ID": "F002", "Date": "2026-10-01", "Age_Days": 14, "Body_Weight_g": 505, "Feed_Intake_kg": 2350, "Mortality_Count": 2, "Birds_Placed": 9800, "Source_File": null, "Refresh_Timestamp": null },
    { "Farm_ID": "F002", "Date": "2026-10-08", "Age_Days": 21, "Body_Weight_g": 925, "Feed_Intake_kg": 3500, "Mortality_Count": 5, "Birds_Placed": 9800, "Source_File": null, "Refresh_Timestamp": null }
  ],
  "quality_warnings": [
    { "level": "WARNING", "code": "FEED_DEFINITION_UNCONFIRMED", "farm_id": null, "row": null, "column": "Feed_Intake_kg",
      "message": "ข้อมูลตัวอย่างไม่ระบุว่า Feed Intake เป็นรายวันหรือสะสม ห้ามใช้ FCR จากชุดนี้ตัดสินใจ" },
    { "level": "WARNING", "code": "MORTALITY_DEFINITION_UNCONFIRMED", "farm_id": null, "row": null, "column": "Mortality_Count",
      "message": "ต้องยืนยันว่า Mortality Count เป็นรายวันหรือสะสมก่อนคำนวณ Mortality %" }
  ]
}
```

## Security

- **Access control:** โหมด Production ต้องอยู่หลังการยืนยันตัวตนขององค์กร (เช่น SharePoint/Teams tab หรือเว็บภายในที่ใช้ SSO) และให้สิทธิ์ตามกลุ่มผู้ชม ไม่เผยแพร่ลิงก์สาธารณะ
- **ไม่มี secret ใน HTML/JavaScript:** ห้ามฝัง API key, client secret, connection string, SAS token อายุยาวในหน้าเว็บ — ทุกอย่างที่อยู่ในเบราว์เซอร์ถือว่าผู้ใช้อ่านได้ ใช้ token อายุสั้นที่ได้จากการล็อกอินแทน
- **Content Security Policy:** ตั้ง header เช่น `Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self' https://<data-host>; img-src 'self' data:; style-src 'self'; frame-ancestors 'self'` และโหลดไลบรารีจาก CDN ที่ระบุเวอร์ชันพร้อม Subresource Integrity (หรือฝังในไฟล์)
- **ป้องกัน XSS:** แสดงค่าจาก JSON/ไฟล์ที่อัปโหลดด้วย `textContent` ไม่ใช้ `innerHTML` กับข้อมูลดิบ · ตรวจ contract (ชนิด/ช่วงค่า) ก่อน render · ไฟล์ CSV ที่ Export ให้ป้องกัน CSV/Formula injection โดยเติม `'` หน้าค่าที่ขึ้นต้นด้วย = + - @
- **PII masking:** feed มีเฉพาะข้อมูลที่ Dashboard ต้องใช้ ไม่มีชื่อ/อีเมล/เบอร์โทรของบุคคล ใช้บทบาท (ผู้รับผิดชอบ/ผู้มีอำนาจอนุมัติ) แทนชื่อ ถ้าต้องมีรหัสบุคคลให้ใช้ค่าแฮชหรือรหัสแทน
- **ข้อมูลธุรกิจอ่อนไหว:** ใช้รหัสฟาร์ม (F001–F004) ไม่ใช้ชื่อสถานที่จริงใน feed ที่แชร์กว้าง และจำกัดคอลัมน์ต้นทุน/ราคาไว้เฉพาะกลุ่มที่มีสิทธิ์
- **โหมดอัปโหลด:** อ่านไฟล์ในเบราว์เซอร์เท่านั้น ไม่ส่งออกนอกเครื่อง จำกัดขนาดไฟล์และจำนวนแถว ไม่รัน macro/สูตรในไฟล์
- **HTTPS และ Cache:** ให้บริการผ่าน HTTPS · ตั้ง `Cache-Control: no-cache` (หรืออายุสั้น) ให้ไฟล์ feed เพื่อไม่ให้ผู้ใช้เห็นข้อมูลเก่าจาก cache

## States

- **Loading:** แสดง skeleton/ข้อความ "กำลังโหลดข้อมูล..." พร้อมชื่อแหล่งข้อมูล ไม่แสดงตัวเลข 0 ชั่วคราว (ผู้ใช้อาจเข้าใจผิดว่าเป็นค่าจริง) · ตั้ง timeout เช่น 15 วินาทีแล้วเปลี่ยนเป็นสถานะ Error
- **Error:** โหลดไม่ได้ (เครือข่าย/สิทธิ์ 401–403/ไฟล์ไม่พบ) หรือ JSON ไม่ตรง contract → แสดงข้อความภาษาไทยที่บอกสาเหตุและสิ่งที่ทำได้ (ลองใหม่, ติดต่อผู้รับผิดชอบ) พร้อมปุ่ม "ลองใหม่" และไม่แสดงข้อมูลชุดที่ไม่ผ่านการตรวจ
- **Empty:** feed ถูกต้องแต่ rows = [] หรือ Filter แล้วไม่เหลือข้อมูล → แยกข้อความ "ยังไม่มีข้อมูลในแหล่ง" กับ "ไม่มีข้อมูลตามตัวกรอง" และมีปุ่มล้างตัวกรอง
- **Stale data:** last_updated เก่ากว่าเกณฑ์ (เช่น 26 ชั่วโมง) หรือ refresh_status = failed → แถบเตือนสีเหลือง/แดง "ข้อมูลล่าสุดเมื่อ ... อาจไม่เป็นปัจจุบัน" แสดงคู่กับข้อมูล (ไม่ซ่อนข้อมูล)
- **Warnings:** quality_warnings ไม่ว่าง → แสดงจำนวนและรายการในแผงที่เปิดดูได้ KPI ที่ได้รับผลกระทบ (เช่น FCR เมื่อ FEED_DEFINITION_UNCONFIRMED) ต้องมีไอคอนเตือนที่การ์ด
- **Prototype/Upload label:** ป้ายโหมดแสดงตลอดทุกสถานะ

## Acceptance Tests

| กรณีทดสอบ | การตั้งค่า / ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| TC-DB-01 Contract validation | ป้อน feed ที่ขาด last_updated · ป้อน feed ที่ Body_Weight_g เป็นข้อความ | ทั้งสองกรณีแสดงสถานะ Error ระบุฟิลด์ที่ผิด และไม่ render KPI |
| TC-DB-02 KPI ตรงกับ Excel | ใช้ feed ชุดทดสอบที่รู้คำตอบ (ชุดเดียวกับ TC-OS-05) · เปรียบเทียบการ์ด FCR, Body Weight, Mortality, Feed Intake กับ KPI_Summary ใน Excel | ทุกค่าตรงกันตามจำนวนทศนิยมที่กำหนด และ Tooltip/หมายเหตุแสดงนิยาม KPI |
| TC-DB-03 Filters + Search | เลือก Farm = F002, ช่วงวันที่ 2026-10-01 ถึง 2026-10-08, Age 14–21 · ค้นหา "F00" | Charts, Data Table และ KPI Cards อัปเดตตรงกันทุกส่วน · จำนวนแถวในตารางเท่ากับที่กรองด้วยมือ |
| TC-DB-04 Export | Export CSV และ Excel หลังกรอง · เปิดไฟล์ใน Excel | ได้เฉพาะแถวที่กรอง หัวคอลัมน์ตรง ภาษาไทยไม่เพี้ยน (CSV มี UTF-8 BOM) และค่าที่ขึ้นต้นด้วย = ถูกป้องกัน |
| TC-DB-05 States | จำลองเครือข่ายช้า/ล้ม (DevTools) · feed rows = [] · feed last_updated เก่ากว่า 26 ชั่วโมง | Loading → Error พร้อมปุ่มลองใหม่ · Empty state ข้อความถูกต้อง · แถบ stale แสดงพร้อมเวลา |
| TC-DB-06 Responsive + ภาษาไทย | เปิดที่ความกว้าง 360 px และ 1440 px ทั้งโหมดสว่าง/มืด | ไม่มี horizontal scroll ของหน้า · ตารางเลื่อนในกรอบของตัวเอง · ตัวอักษรไทยไม่ถูกตัด · ปุ่มกดได้ขนาดอย่างน้อย 44 px |
| TC-DB-07 Security | ค้นหาในซอร์ส HTML/JS คำว่า key, secret, token, password · ตรวจ response header · ใส่ค่า `<img src=x onerror=alert(1)>` ใน Farm_ID ของไฟล์อัปโหลด | ไม่พบ secret · มี CSP และ Cache-Control ตามที่กำหนด · ค่าแสดงเป็นข้อความ ไม่รันสคริปต์ · ผู้ไม่มีสิทธิ์เปิดโหมด Production ไม่ได้ |
| TC-DB-08 พิสูจน์ Refresh End-to-End | จด last_updated และค่า Body_Weight_g ล่าสุดของ F003 บน Dashboard · อัปโหลดไฟล์ใหม่ที่ F003 มีค่าต่างออกไปเข้า Farm_Inbox · รอ Flow ทำงานและอนุมัติ · รีโหลด Dashboard | ค่า F003 เปลี่ยนตามไฟล์ใหม่ · last_updated และ run_id ใหม่ตรงกับ Flow_Run_Log · ก่อนอนุมัติ Dashboard ยังแสดงค่าเดิม (พิสูจน์ว่า Approval gate ทำงาน) |
| TC-DB-09 โหมดอัปโหลด | อัปโหลดไฟล์ถูกต้อง · อัปโหลดไฟล์ขาดคอลัมน์ | ไฟล์ถูก: Data Source = ชื่อไฟล์, ป้าย "ข้อมูลจากไฟล์ที่อัปโหลด" · ไฟล์ผิด: แสดงคอลัมน์ที่ขาดและไม่แทนที่ข้อมูลเดิม · Network tab ไม่มีการส่งไฟล์ออก |
| TC-DB-10 ป้ายโหมด | เปิดแต่ละโหมด | Prototype แสดง "ข้อมูลตัวอย่าง ไม่เชื่อมข้อมูลจริง" ตลอด · Production แสดง run_id และ last_updated จาก feed |

## ไฟล์ในโฟลเดอร์นี้

- `index.html` — Dashboard แบบไฟล์เดียว (Prototype: ข้อมูลตัวอย่าง + อัปโหลดไฟล์ Excel/CSV ของคุณ) เปิดด้วยเบราว์เซอร์ได้ทันที ต้องมี `xlsx.full.min.js` (SheetJS) อยู่โฟลเดอร์เดียวกันเพื่ออ่าน/Export Excel

- Dashboard ฉบับเดียวกันอยู่ใน Web App หลักสูตรที่ `#/x/dashboard`
