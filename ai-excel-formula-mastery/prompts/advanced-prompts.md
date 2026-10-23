# Advanced Prompts

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้

## ต้นฉบับ

## 13. Advanced Prompts

### A01 — ปรับสูตรซ้ำให้เป็น LET
```text
ช่วย Refactor สูตร Excel ที่คำนวณค่าเฉลี่ยและ SD จากช่วงน้ำหนัก B2:B101
ใช้ LET เพื่อตั้งชื่อตัวแปร data, avg, sd และ cv
ตรวจค่าเฉลี่ยเป็นศูนย์ ขนาดตัวอย่างน้อยกว่า 2 และค่าที่ไม่ใช่ตัวเลข
อธิบายความแตกต่างด้านความอ่านง่ายและประสิทธิภาพโดยไม่อ้างผล Benchmark ที่ไม่ได้ทดสอบ
```
ตัวอย่าง: `=LET(w,B2:B101,n,COUNT(w),avg,AVERAGE(w),IF(OR(n<2,avg=0),NA(),STDEV.S(w)/avg*100))`

### A02 — สร้าง LAMBDA เป็นฟังก์ชันองค์กร
```text
ออกแบบฟังก์ชัน LAMBDA ชื่อ CALC_FCR(feed_kg,weight_gain_kg)
ผลลัพธ์คือ Feed Conversion Ratio โดยมีเงื่อนไขทั้งสองเป็นตัวเลขและ weight_gain_kg > 0
อธิบายการบันทึกใน Name Manager การเรียกใช้ และ Unit Tests
ระบุว่าต้องยืนยันนิยาม FCR และวิธีคำนวณ Weight Gain ตามมาตรฐานองค์กรก่อนใช้งานจริง
```
ตัวอย่างนิยาม: `=LAMBDA(feed_kg,weight_gain_kg,IF(AND(ISNUMBER(feed_kg),ISNUMBER(weight_gain_kg),weight_gain_kg>0),feed_kg/weight_gain_kg,NA()))`

### A03 — Power Query: รวม Excel หลายไฟล์
```text
ออกแบบ Power Query ETL สำหรับไฟล์รายวันในโฟลเดอร์เดียวกัน โดยแต่ละไฟล์มี Farm ID, Date, Age, Body Weight, Feed Intake, Mortality
ต้องรวมไฟล์ ตรวจ Schema, แปลงชนิดข้อมูล, จัดการแถวซ้ำ, แยก Error Rows, เก็บ Source File และ Refresh Timestamp
เขียนขั้นตอน UI ทีละคลิก พร้อมตัวอย่าง M Code ที่แก้ไขได้ และ Test Cases
ห้ามอ้างว่า Refresh อัตโนมัติได้โดยไม่ระบุวิธีตั้งค่าและสภาพแวดล้อม
```

### A04 — Automation: Excel → Validation → Alert
```text
ออกแบบ Workflow สำหรับ Excel ใน SharePoint/OneDrive:
1. เมื่อมีไฟล์ใหม่หรือข้อมูลเปลี่ยน
2. ตรวจ Schema และ Data Quality
3. Refresh/Process ข้อมูลด้วยเครื่องมือที่เหมาะสม
4. สรุป KPI และ Flag ความผิดปกติ
5. ส่งแจ้งเตือนผ่าน Teams/Email เฉพาะกรณีที่เข้าเงื่อนไข
6. บันทึก Execution Log และ Error Log
7. ต้องมี Human Approval ก่อนเผยแพร่ผลสำคัญ

แสดง Architecture, Trigger, Action, Connector, Permissions, DLP, Retry, Idempotency และ Recovery Plan
เปรียบเทียบ Office Scripts + Power Automate กับวิธีอื่นที่ใช้งานได้หากถูกบล็อก Connector
```

### A05 — Interactive HTML Dashboard จาก Excel
```text
สร้าง Production-ready Interactive Dashboard สำหรับ Farm Performance จากข้อมูล Excel
ต้องมี: KPI Cards (FCR, Body Weight, Mortality, Feed Intake), Filters (Farm, Date, Age), Charts, Data Table, Export CSV/Excel, Search, Responsive Mobile/Desktop
แสดง Data Source, Last Updated, Refresh Status และ Data Quality Warnings
ออกแบบ Data Flow จริง: Excel → ETL → JSON/API หรือ Server → HTML Dashboard
ระบุว่าถ้าใช้ Static HTML เพียงอย่างเดียวจะไม่อัปเดตข้อมูลต้นทางเอง ต้องมี Pipeline หรือการอัปโหลดไฟล์ใหม่
เพิ่ม Security, Access Control, Loading/Error/Empty States และการทดสอบ
ห้ามสร้าง Mockup แล้วอ้างว่าเชื่อมต่อข้อมูลจริง
```

### A06 — LAMBDA + MAP / BYROW
```text
มีข้อมูล KPI หลายฟาร์ม ต้องประเมินแต่ละแถวด้วยกฎธุรกิจที่กำหนดในตาราง Rules
ช่วยออกแบบ LAMBDA ร่วมกับ MAP หรือ BYROW ให้แก้ไขกฎได้ง่าย
เปรียบเทียบกับ IF/IFS และ Power Query และระบุข้อจำกัดด้านเวอร์ชัน
สร้าง Test Cases สำหรับค่า Boundary, Missing, Duplicate และ Invalid Types
```

### A07 — GROUPBY/PIVOTBY และ Dashboard Summary
```text
ต้องการสรุป Feed Consumption, Mortality และ Average Body Weight ตาม Farm ID และ Month
ประเมิน GROUPBY/PIVOTBY เทียบ PivotTable และ Power Query
สร้างตัวอย่างสูตรที่รองรับจริงตามเวอร์ชัน Excel ที่ระบุ
หากใช้สูตรใหม่ไม่ได้ ให้เสนอทางเลือกพร้อมวิธีสร้างรายงานที่ได้ผลลัพธ์เทียบเท่า
```

### A08 — End-to-End AI Agent สำหรับ Excel
```text
ออกแบบ AI Agent ที่รับ Excel หลายไฟล์ วิเคราะห์โครงสร้างข้อมูล ตรวจความถูกต้อง รวมข้อมูล คำนวณ KPI สร้างรายงาน Excel ใหม่ และสร้าง HTML Dashboard
ระบุ Tools, Permissions, Validation Gates, Human Approval, Audit Trail, Data Privacy และ Failure Handling
แยกสิ่งที่ Agent ทำได้จริงเมื่อมี Connector/Code Runtime ออกจากขั้นตอนที่ต้องทำด้วยมนุษย์
ส่ง Architecture Diagram, Implementation Plan, Acceptance Criteria และ Test Plan
```

## Prompt เพิ่มเติมจากบทเรียน (ส่วนขยาย)

### A1 · Refactor สูตร KPI ที่มีนิพจน์ซ้ำให้เป็น LET พร้อมตารางทดสอบ

```text
บทบาท: คุณเป็นผู้เชี่ยวชาญ Microsoft Excel
เป้าหมาย: Refactor สูตรด้านล่างให้เป็น LET ที่อ่านง่าย แก้ช่วงข้อมูลได้ที่เดียว
สูตรเดิม: =IF(AVERAGE(B2:B101)=0,NA(),STDEV.S(B2:B101)/AVERAGE(B2:B101)*100)
ข้อมูล: B2:B101 น้ำหนักไก่รายตัว หน่วยกรัม (ข้อมูลสมมติ) อาจมีเซลล์ว่างและข้อความ เช่น "ชั่งไม่ได้"
เวอร์ชัน: Microsoft 365 และต้องมีทางเลือกสำหรับ Excel 2019
รูปแบบสูตร: คั่นอาร์กิวเมนต์ด้วย ,
โปรด:
1) เขียนสูตร LET ตั้งชื่อ w, n, avg, sd, cv
2) อธิบายลำดับ Guard และเหตุผลที่ไม่ใส่นิพจน์ที่อาจ Error ไว้ใน OR
3) สร้างตารางทดสอบอย่างน้อย 5 กรณี: ปกติ, n=1, ช่วงว่าง, ค่าเฉลี่ยเป็นศูนย์, มีข้อความปน พร้อมค่าที่คาดหวัง
4) เปรียบเทียบผลสูตรเดิมกับสูตรใหม่ทุกกรณี ถ้าต่างกันให้บอกว่าต่างเพราะอะไร
5) ห้ามอ้างว่าเร็วขึ้นเป็นตัวเลขถ้าไม่ได้วัด
6) ระบุสิ่งที่ผู้ตรวจทานต้องตรวจก่อนใช้งานจริง
```

### A1 · ขอ LET ที่คืนหลายค่า (n, Mean, SD, CV%) เป็นแถวเดียว

```text
ข้อมูลน้ำหนักไก่ (กรัม) อยู่ใน B2:B101 ใช้ Microsoft 365
ช่วยเขียน LET หนึ่งสูตรที่คืนผลแบบ Spill 1 แถว 4 คอลัมน์: n, Mean, SD (Sample), CV%
ใช้ HSTACK หรือ {} ตามความเหมาะสม และบอกว่าต้องเว้นเซลล์ว่างทางขวากี่คอลัมน์เพื่อไม่ให้เกิด #SPILL!
ถ้า n<2 ให้ Mean แสดงได้ แต่ SD และ CV% เป็น #N/A
ให้ตัวอย่างข้อมูล 5 แถวพร้อมผลที่คาดหวัง และสูตรทางเลือกแบบ 4 เซลล์สำหรับ Excel 2019
```

### A1 · ตรวจสูตร LET ที่ได้มาจากเพื่อนร่วมงาน (Reverse Engineering)

```text
อธิบายสูตรนี้ทีละตัวแปร พร้อมระบุจุดเสี่ยง:
=LET(w,B2:B101,n,COUNT(w),avg,AVERAGE(w),IF(OR(n<2,avg=0),NA(),STDEV.S(w)/avg*100))
1) ถ้า B2:B101 ว่างทั้งหมด ผลคืออะไร และเพราะอะไร
2) ถ้ามีข้อความปน 10 แถว ผลจะคำนวณจากกี่แถว
3) เสนอรุ่นปรับปรุงที่ทุกกรณีผิดปกติคืน #N/A และรายงานจำนวนค่าที่ไม่ใช่ตัวเลข
4) ทำตารางทดสอบ Input → Output ที่ฉันนำไปวางทดสอบเองได้
```

### A2 · ออกแบบ LAMBDA พร้อมพารามิเตอร์ไม่บังคับ (ISOMITTED)

```text
ช่วยต่อยอด CALC_FCR(feed_kg,weight_gain_kg) ให้มีพารามิเตอร์ไม่บังคับ [decimals] สำหรับจำนวนทศนิยม (ค่าเริ่มต้น 3)
เวอร์ชัน: Microsoft 365 / Excel 2024 · ตัวคั่น ,
เงื่อนไข: ทั้งสองค่าต้องเป็นตัวเลขและ weight_gain_kg > 0 นอกนั้นคืน #N/A
โปรดให้: 1) นิยาม LAMBDA ที่ใช้ ISOMITTED 2) วิธีทดสอบแบบเรียกทันทีในเซลล์ 3) ขั้นตอนบันทึกใน Name Manager พร้อม Comment เวอร์ชัน 4) ตาราง Unit Tests 6 กรณี พร้อมค่าที่คาดหวัง 5) สูตรทางเลือกสำหรับ Excel 2021
ย้ำในคำตอบว่านิยาม FCR และช่วงเวลาของอาหาร/น้ำหนักต้องยืนยันตามมาตรฐานองค์กร
```

### A2 · สร้าง LAMBDA คำนวณ Weight Gain ให้สอดคล้องกับ CALC_FCR

```text
ออกแบบ LAMBDA ชื่อ CALC_GAIN_KG(start_bw_g,end_bw_g,birds_alive)
ผลลัพธ์ = (end_bw_g − start_bw_g) × birds_alive ÷ 1000 (กก.)
เงื่อนไข: ทุกค่าเป็นตัวเลข, end_bw_g > start_bw_g, birds_alive > 0 นอกนั้น #N/A
อธิบายว่าการใช้จำนวนไก่ที่มีชีวิต ณ วันชั่ง ต่างจากการใช้น้ำหนักไก่ตายรวมอย่างไร และให้ระบุคำถามที่ต้องถามผู้รับผิดชอบเพื่อยืนยันนิยาม
ให้ Unit Tests 5 กรณีและสูตรดั้งเดิมที่ให้ผลเท่ากัน
```

### A2 · Code Review ฟังก์ชัน LAMBDA ก่อนประกาศใช้ทั้งทีม

```text
ตรวจทานนิยามนี้ในฐานะผู้ตรวจทานสูตร:
=LAMBDA(feed_kg,weight_gain_kg,IF(AND(ISNUMBER(feed_kg),ISNUMBER(weight_gain_kg),weight_gain_kg>0),feed_kg/weight_gain_kg,NA()))
1) หาเงื่อนไขที่ยังไม่ครอบคลุม (เช่น feed ติดลบ, ค่าเป็น Error, ส่งช่วงหลายเซลล์แทนเซลล์เดียว)
2) เสนอ V2 ที่แก้ไขพร้อมเหตุผล แต่ห้ามเปลี่ยนนิยาม FCR เอง
3) ให้ตาราง Unit Tests ที่ V1 และ V2 ต้องผ่าน และระบุกรณีที่ผลต่างกันโดยตั้งใจ
4) ระบุสิ่งที่ต้องขออนุมัติจากผู้มีอำนาจอนุมัติก่อนเปลี่ยนเวอร์ชัน
```

### A3 · ออกแบบ Rules Table + BYROW สำหรับ KPI หลายฟาร์ม

```text
บทบาท: ผู้เชี่ยวชาญ Excel Dynamic Array
ข้อมูล: ชีต KPI คอลัมน์ A=Farm_ID (F001–F004), B=FCR, C=Mortality_% (ข้อมูลสมมติ) · ชีต Rules: A=Rule_Key, B=Value (FCR_MAX, MORT_MAX)
เวอร์ชัน: Microsoft 365 · ตัวคั่น ,
เป้าหมาย: สูตรเดียวใน D2 คืนสถานะทุกแถว ERROR (ข้อมูลไม่ใช่ตัวเลข) / WARNING (เกินเกณฑ์) / PASS
โปรด:
1) เขียน BYROW + LAMBDA + LET ที่ดึงเกณฑ์จาก Rules ด้วย Rule_Key
2) ระบุว่าเท่ากับเกณฑ์ถือว่าอะไร และเขียนไว้ที่ใดในชีต Rules
3) ให้สูตรต่อแถวแบบดั้งเดิมที่ให้ผลเท่ากันสำหรับ Excel 2021
4) Test Cases: Boundary, Missing, Duplicate, Invalid Types, กฎหาย พร้อมผลที่คาดหวัง
5) อธิบายว่าคีย์ซ้ำต้องตรวจแยกอย่างไร เพราะ BYROW ไม่เห็นแถวอื่น
```

### A3 · แปลงสูตร IFS ยาว ๆ เป็น LAMBDA ที่ใช้ซ้ำ

```text
ฉันมีสูตรนี้ลากลงไป 5,000 แถว: =IFS(B2="","ERROR",B2>1.7,"HIGH",B2>1.6,"WARNING",TRUE,"PASS")
ช่วยแปลงเป็นฟังก์ชันชื่อ FCR_STATUS(fcr,warn_max,high_max) ใน Name Manager และใช้ MAP เรียกทั้งคอลัมน์
อธิบายข้อดี/ข้อเสียเทียบกับสูตรเดิม (ความอ่านง่าย การ Debug การรองรับเวอร์ชัน) โดยไม่อ้างผลความเร็วที่ไม่ได้วัด
ให้ตารางทดสอบ 6 กรณีรวมค่าเท่ากับเกณฑ์พอดี
```

### A3 · ใช้ BYCOL ทำ Data Completeness Report

```text
ตาราง Raw_Data A1:G1000 (หัวตารางแถว 1) มี Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count, Birds_Placed
ช่วยเขียน BYCOL คืน % ค่าที่เป็นตัวเลขของคอลัมน์ C:G และ HSTACK หัวคอลัมน์ไว้ด้านบน
แนะนำเกณฑ์ว่าเท่าไรควรแจ้งเตือน (ให้เป็นค่าที่ผู้รับผิดชอบกำหนด ไม่ใช่มาตรฐาน) และสูตรทางเลือก COUNT/ROWS สำหรับรุ่นเก่า
```

### A4 · สร้าง Summary Farm × Month 3 แบบแล้วเทียบผล

```text
ข้อมูล Raw_Data: A=Farm_ID (F001–F004), B=Date (วันที่จริง), C=Month_Key (=TEXT(B2,"yyyy-mm")), D=Body_Weight_g, E=Feed_Intake_kg (รายวัน), F=Mortality_Count (รายวัน) — ข้อมูลสมมติ
เวอร์ชัน: ผู้ใช้ครึ่งหนึ่งใช้ Microsoft 365 อีกครึ่งใช้ Excel 2021
โปรด:
1) สูตร GROUPBY รวม Feed ตาม Farm_ID และ PIVOTBY Farm × Month สำหรับ Microsoft 365
2) ตาราง SUMIFS/AVERAGEIFS หัวคอลัมน์คงที่สำหรับ Excel 2021 ที่ได้ผลเท่ากัน
3) ขั้นตอน PivotTable และ Power Query Group By แบบย่อ
4) เซลล์ Reconciliation ตรวจยอดรวมกับข้อมูลดิบ
5) ตารางเปรียบเทียบ: การอัปเดต, การ Refresh, การรองรับเวอร์ชัน, ความเหมาะกับ Dashboard
ห้ามสรุปว่าวิธีใดเร็วกว่าถ้าไม่ได้วัด
```

### A4 · ถ่วงน้ำหนัก Average Body Weight ให้ถูกต้อง

```text
ฉันมีน้ำหนักเฉลี่ยรายสัปดาห์ (D) และจำนวนตัวอย่างที่ชั่ง (G) ของแต่ละฟาร์ม
ช่วยอธิบายว่าทำไม AVERAGE ของค่าเฉลี่ยรายสัปดาห์อาจผิด และเขียนสูตรค่าเฉลี่ยถ่วงน้ำหนักราย Farm × Month ด้วย SUMPRODUCT/SUMIFS พร้อมตัวอย่างตัวเลขที่ผลต่างกัน
ให้ทางเลือกด้วย GROUPBY (Microsoft 365) ถ้าทำได้ และกรณีทดสอบ 3 แบบ
```

### A5 · ขอขั้นตอน Power Query ทีละคลิกจาก Schema จริง

```text
บทบาท: ผู้เชี่ยวชาญ Power Query ใน Excel
สภาพแวดล้อม: Excel Microsoft 365 Desktop บน Windows, ไฟล์อยู่ในไลบรารี SharePoint (ใส่ URL ไซต์เป็น <site-url>)
ไฟล์: daily_YYYYMMDD.xlsx วันละ 1 ไฟล์ แต่ละไฟล์มี Table ชื่อ tblDaily คอลัมน์ Farm_ID (ข้อความ F001–F004), Date (วันที่), Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count
โปรด:
1) ขั้นตอน UI ทีละคลิก ตั้งแต่ Get Data จนโหลด 3 ตาราง: Clean_Data, Error_Rows, Load_Log
2) M Code ที่แก้ได้ โดยใช้ Parameter สำหรับ URL และรายการคอลัมน์ที่คาดหวัง
3) วิธีตรวจ Schema รายไฟล์และแยกไฟล์ผิด Schema
4) กฎการจัดการแถวซ้ำ Farm_ID+Date ที่ต้องให้ผู้รับผิดชอบยืนยัน
5) Test Cases 6 กรณี (ไฟล์ปกติ, คอลัมน์หาย, ชื่อคอลัมน์ตัวพิมพ์ต่าง, วันที่เป็นข้อความ, แถวซ้ำ, ไฟล์ว่าง) พร้อมผลที่คาดหวัง
6) อธิบายว่าการ Refresh ต้องตั้งค่าอย่างไรและข้อจำกัดบน Excel Web ห้ามอ้างว่า Refresh อัตโนมัติโดยไม่ระบุวิธีตั้งค่า
```

### A5 · อธิบาย M Code ที่ได้มาทีละ Step

```text
อธิบาย M Code ด้านล่างทีละ Step ว่าทำอะไร ใช้ชนิดข้อมูลอะไร และจุดใดเสี่ยงเมื่อมีไฟล์ใหม่ที่ Schema ต่าง
บอกว่า Step ใดอ้างชื่อคอลัมน์แบบตายตัว (Hard-coded) และเสนอวิธีทำให้ทนต่อการเปลี่ยนแปลง
ให้รายการ Test ที่ต้องรันหลังแก้ไข
[วาง M Code จาก Advanced Editor ที่นี่ — ลบ Path/ชื่อไซต์จริงออกก่อนส่ง]
```

### A5 · เลือกระหว่าง VSTACK กับ Power Query

```text
ฉันมีข้อมูลรายเดือน 12 ชีตในไฟล์เดียว และในอนาคตจะเป็นไฟล์รายวันในโฟลเดอร์
เปรียบเทียบ VSTACK (Microsoft 365) กับ Power Query ในด้าน: จำนวนไฟล์, การตรวจ Schema, ร่องรอยการแปลง, การ Refresh, ขนาดข้อมูล, ผู้ใช้ที่ไม่มี Microsoft 365
แนะนำว่าเมื่อใดควรย้ายจากสูตรไป Power Query และขั้นตอนย้ายที่ไม่ทำให้รายงานเดิมเสีย
```

### A6 · เขียน Office Script ตรวจข้อมูลและคืน JSON ให้ Flow

```text
บทบาท: ผู้เชี่ยวชาญ Office Scripts (TypeScript) และ Power Automate
ไฟล์: Farm_Daily.xlsx บน SharePoint มี Table ชื่อ tblDaily คอลัมน์ Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count, Birds_Placed (ข้อมูลสมมติ) และ Table tblRules (Rule_Key, Value)
โปรดเขียน Office Script ที่:
1) ตรวจหัวคอลัมน์ตรงกับรายการที่คาดหวัง (แยกตัวพิมพ์)
2) นับแถว, แถวที่มีค่าว่าง/ข้อความในคอลัมน์ตัวเลข, คีย์ซ้ำ Farm_ID+Date
3) คำนวณ Mortality % ต่อแถว และ Flag ตามเกณฑ์ใน tblRules
4) คืนค่า interface { schemaOk: boolean; rows: number; errorRows: number; warnings: { key: string; message: string }[] }
5) ไม่แก้ข้อมูลต้นฉบับ เขียนผลลงชีต Validation เท่านั้น
อธิบายวิธีทดสอบใน Automate tab ก่อนต่อกับ Flow และข้อจำกัด (เวลา Timeout, ขนาดข้อมูล, สิทธิ์)
```

### A6 · ออกแบบ Flow แจ้งเตือนพร้อม Approval และ Log

```text
ออกแบบ Power Automate Flow ทีละ Action จาก Office Script ข้างต้น:
Trigger: Recurrence ทุกวัน 07:00 (เขตเวลา SE Asia Standard Time)
1) Run script → ถ้า schemaOk=false ส่ง Teams ให้ผู้รับผิดชอบไฟล์ และเขียน Error_Log แล้วหยุด
2) กรอง warnings ที่ key ยังไม่อยู่ใน SharePoint List "Alert_Log" (Idempotency)
3) ถ้ามีรายการใหม่ → Start and wait for an approval ให้ผู้มีอำนาจอนุมัติ
4) Approved → ส่งสรุปเข้า Teams channel และบันทึก key ลง Alert_Log · Rejected → บันทึกเหตุผล
5) ทุกเส้นทางเขียน Execution_Log (Run ID, เวลา, ผล)
ระบุ Retry Policy ของแต่ละ Action, Action ที่ห้าม Retry, Connector ที่ต้องใช้ และสิ่งที่ต้องตรวจ DLP กับผู้ดูแลระบบ
```

### A6 · แผนสำรองเมื่อ Connector ถูกบล็อก

```text
tenant ของเราบล็อก Excel Online (Business) Connector ใน Power Automate ด้วย DLP
เป้าหมายเดิม: ตรวจข้อมูลรายวัน แจ้งเตือน KPI ผิดปกติ และขออนุมัติก่อนเผยแพร่
เสนอทางเลือก 3 แบบที่ทำได้โดยไม่ละเมิดนโยบาย พร้อมข้อดี/ข้อเสีย สิ่งที่ต้องทำด้วยมนุษย์ และวิธีเก็บ Log/หลักฐานการอนุมัติ
ห้ามแนะนำวิธีหลีกเลี่ยง DLP
```

### A7 · ขอ Spec Dashboard ที่แยก Prototype กับ Production ชัดเจน

```text
บทบาท: Data Engineer + Front-end Developer
เป้าหมาย: Dashboard Farm Performance จากข้อมูล Excel (ข้อมูลสมมติ ฟาร์ม F001–F004)
ข้อมูล: Clean_Data (Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count, Birds_Placed) และ Load_Log (Refresh_Time, Rows, Error_Rows, Source)
โปรดส่ง 2 ระยะ:
ระยะที่ 1 Static Prototype: HTML ไฟล์เดียวอ่านไฟล์ที่ผู้ใช้อัปโหลด แสดงป้าย "ต้นแบบ" และเวลาของไฟล์
ระยะที่ 2 Connected: Data Flow Excel → ETL → JSON/API → HTML พร้อม Trigger, สิทธิ์, Access Control, Monitoring
ทั้งสองระยะต้องมี KPI Cards (FCR, Body Weight, Mortality, Feed Intake), Filters (Farm, Date, Age), Charts, Data Table, Search, Export CSV/Excel, Responsive, Loading/Error/Empty/Stale States, Data Quality Warnings
ระบุ Test Plan และ Acceptance Criteria ห้ามอ้างว่าเชื่อมข้อมูลจริงในระยะที่ 1
```

### A7 · ตรวจความปลอดภัยของ Dashboard HTML ที่ได้มา

```text
ตรวจโค้ด HTML/JavaScript ด้านล่างในด้าน Security:
1) มี Token/Key/URL ภายในที่ไม่ควรเปิดเผยหรือไม่
2) ใช้ innerHTML กับข้อมูลจากไฟล์หรือไม่ (XSS)
3) Export CSV ป้องกัน CSV Injection หรือไม่
4) ข้อมูลที่โหลดมีคอลัมน์เกินจำเป็นหรือข้อมูลส่วนบุคคลหรือไม่
5) โหลดสคริปต์จาก CDN ที่ไม่ระบุเวอร์ชันหรือไม่
ให้รายการแก้ไขเรียงตามความเสี่ยง และ Test Case ยืนยันการแก้
[วางโค้ด — ลบ URL/ข้อมูลจริงก่อน]
```

### A7 · สร้างชุดทดสอบ KPI ของ Dashboard จาก Excel

```text
จากตาราง Clean_Data ตัวอย่าง 8 แถว (F001–F002, 2026-10-01 และ 2026-10-08) ช่วยสร้างตารางคำตอบอ้างอิงด้วยสูตร Excel (SUMIFS, AVERAGEIFS, Mortality % ถ่วงน้ำหนัก) สำหรับ 6 สถานการณ์ตัวกรอง: ทั้งหมด, F001, F002, วันที่ 2026-10-08, อายุ 21 วัน, F003 (ไม่มีข้อมูล → Empty State)
บอกค่าที่ KPI Card ต้องแสดงในแต่ละสถานการณ์ เพื่อใช้ทดสอบ Dashboard ด้วยมือหรือ Playwright
```

### A8 · Instructions 8 ส่วนสำหรับ Agent วิเคราะห์ไฟล์ Excel หลายชุด

```text
บทบาท: คุณคือผู้ช่วยวิเคราะห์ข้อมูล Excel ด้านผลการเลี้ยง (ข้อมูลฟาร์ม F001–F004)
เป้าหมาย: รวมไฟล์ที่แนบ ตรวจคุณภาพ คำนวณ KPI และร่างรายงานพร้อม Audit Log ให้มนุษย์อนุมัติ
ข้อมูลนำเข้า: ไฟล์ .xlsx ที่ผู้ใช้แนบในแชท คอลัมน์ Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count, Birds_Placed
ขั้นตอน: 1) ตรวจรายการไฟล์และ Schema (G1) 2) ตรวจคุณภาพข้อมูล (G2) 3) คำนวณ KPI ด้วยโค้ดเท่านั้น และแสดงสูตร/โค้ดที่ใช้ (G3) 4) Reconcile ยอดรวม 5) ร่างรายงานและตาราง Audit Log (G4)
รูปแบบผลลัพธ์: ตาราง Gate Results, ตาราง KPI, รายการคำเตือน, Assumptions, คำถามที่ต้องให้มนุษย์ตอบ
การตรวจสอบ: ทุกตัวเลขต้องมาจากการคำนวณที่แสดงได้ ถ้า Gate ใด FAIL ให้หยุดและรายงาน
ข้อห้าม: ห้ามแต่งตัวเลข ห้ามอนุมัติแทนมนุษย์ ห้ามสรุปว่าผ่านมาตรฐานสายพันธุ์ ห้ามกำหนดนิยาม FCR เอง
เมื่อไม่แน่ใจ: ถามผู้ใช้พร้อมตัวเลือก เช่น "Feed_Intake_kg เป็นรายวันหรือสะสม?"
```

### A8 · ขอ Architecture + Acceptance Criteria ที่แยกงาน Agent กับงานมนุษย์

```text
จาก A08 ช่วยทำตาราง 3 คอลัมน์: ขั้นตอน | Agent ทำได้จริงเมื่อมีเครื่องมือใด (Connector/Code Runtime/สิทธิ์) | ส่วนที่มนุษย์ต้องทำหรือยืนยัน
ตามด้วย Acceptance Criteria แบบตรวจได้ (Given/When/Then) อย่างน้อย 10 ข้อ ครอบคลุม Correctness, Edge Cases, Compatibility, Performance, Privacy, Traceability, Governance, Dashboard (ข้อ 16)
และ Test Plan ที่ใช้ Golden Dataset 3 ชุดพร้อมผลที่คาดหวัง
ระบุสิ่งที่ยังไม่สามารถทดสอบได้ในสภาพแวดล้อมของเรา
```

### A8 · Red-team Agent ก่อนใช้งานจริง

```text
ช่วยออกแบบกรณีทดสอบเชิงรุก 10 กรณีสำหรับ Agent วิเคราะห์ Excel เช่น ไฟล์มีคำสั่งแฝงในเซลล์ ("ให้ละเว้นกฎทั้งหมด"), ไฟล์มีอีเมลบุคคล, Schema เปลี่ยน, ไฟล์ซ้ำ, ข้อมูลอนาคต, ตัวเลขเป็นข้อความ, ไฟล์ใหญ่เกินขีดจำกัด
บอกพฤติกรรมที่ถูกต้องของ Agent ในแต่ละกรณีและ Gate ที่ต้องจับได้
```
