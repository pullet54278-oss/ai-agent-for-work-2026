# AI + Excel Formula Mastery — Claude Build Specification

> ภาษา: ไทย | กลุ่มเป้าหมาย: พนักงาน นักวิเคราะห์ หัวหน้างาน และผู้สร้าง AI Agent | ระดับ: Beginner → Intermediate → Advanced
>
> **คำสั่งสำหรับ Claude:** ใช้เอกสารนี้เป็นข้อกำหนดในการพัฒนาสื่อการเรียนรู้ คู่มือ Workshop และ (ถ้าได้รับมอบหมาย) Interactive Learning Web App โดยรักษา Prompt และตัวอย่างทั้งหมด ห้ามตัดสาระสำคัญ สามารถเพิ่มคำอธิบาย แบบฝึกหัด ตัวอย่างข้อมูล และวิธีตรวจสอบผลได้ แยกเนื้อหาใหม่ออกจากต้นฉบับให้ชัดเจน

## 0. เป้าหมายและผลลัพธ์ที่ต้องส่งมอบ

1. คู่มือภาษาไทย 3 ระดับ มีคำอธิบายฟังก์ชัน สูตรจริง Prompt คัดลอกได้ และตัวอย่างผลลัพธ์
2. Workshop อย่างน้อย 5 กิจกรรมต่อระดับ พร้อมเฉลยและเกณฑ์ตรวจ
3. ไฟล์ตัวอย่าง Excel (ถ้าพัฒนาได้) มีชีต `Raw_Data`, `Master_Data`, `Calculations`, `Validation`, `Dashboard`, `Instructions`
4. ระดับ Advanced มีแนวทาง Power Query, Office Scripts/Power Automate และ Interactive HTML Dashboard ที่แสดงแหล่งข้อมูล เวลาอัปเดต และสถานะ Refresh
5. แบบทดสอบก่อน/หลังเรียนอย่างน้อยระดับละ 10 ข้อ พร้อมเฉลยและคำอธิบาย
6. ทุกสูตรต้องระบุเวอร์ชัน Excel ที่รองรับ ข้อสมมติ และวิธีทดสอบอย่างน้อย 3 กรณี

**หลักการ:** เริ่มจาก Goal → Schema → Formula/Tool Selection → Build → Validate → Optimize → Automate. ไม่อ้างว่า AI แก้ไฟล์ต้นฉบับหรือเชื่อมข้อมูลได้หากไม่มีเครื่องมือ/สิทธิ์จริง

## 1. Master Prompt สำหรับ Claude (ใช้เริ่มโปรเจกต์)

```text
คุณเป็น Lead Excel Solution Architect, AI Prompt Engineer, Data Analyst และ Instructional Designer
จงสร้างหลักสูตร AI + Excel Formula Mastery 3 ระดับจากเอกสาร Markdown นี้

ข้อบังคับ:
- ใช้ภาษาไทยชัดเจน เป็นลำดับ เรียนรู้จากตัวอย่างจริง ไม่ตัด Prompt ตัวอย่าง สูตร ตาราง หรือข้อควรระวัง
- แยกเนื้อหา Beginner / Intermediate / Advanced อย่างชัดเจน
- แต่ละบทมี: Learning Objectives, Prerequisites, Concepts, Function Reference, Copy-ready AI Prompts, Formula Examples, Sample Data, Expected Output, Validation, Exercises, Answer Key, Troubleshooting
- ใช้ตัวอย่างงานทั่วไป (Sales, Marketing, Finance, HR, Inventory) และงานสัตว์ปีก (Farm, Feed, FCR, Mortality, Body Weight, %CV) โดยระบุหน่วยและนิยาม KPI
- สูตรต้องใช้งานได้จริงและสอดคล้องกับเวอร์ชัน Excel; ห้ามแต่งผลทดสอบที่ไม่ได้รัน
- ระบุความแตกต่างระหว่าง Excel Formula, Power Query, PivotTable, Office Scripts, Power Automate และ Dashboard HTML
- ให้คำแนะนำเรื่อง Performance, Security, Data Quality, Refresh, Governance และ Human Review
- ถ้าข้อมูลไม่ครบ ให้แสดง Assumptions/Questions แทนการสมมติแบบเงียบ ๆ

เริ่มจากสร้าง Course Map และ Deliverable Checklist แล้วพัฒนาทีละระดับอย่างครบถ้วน
```

## 2. Prompt Framework มาตรฐาน (ใช้ได้ทั้ง 3 ระดับ)

```text
บทบาท: คุณเป็นผู้เชี่ยวชาญ Microsoft Excel และ Data Analytics
เป้าหมาย: [ผลลัพธ์ที่ต้องการ]
ข้อมูล: [ชื่อไฟล์/ชีต, คอลัมน์, ชนิดข้อมูล, ตัวอย่าง 3–5 แถว]
เวอร์ชัน: [Microsoft 365 / Excel 2024 / Excel 2021 / Excel 2019 / Excel Web]
รูปแบบสูตร: [คั่นอาร์กิวเมนต์ด้วย , หรือ ;]
กฎธุรกิจ: [นิยาม KPI, เงื่อนไข, หน่วย, การจัดการค่าที่ขาด/ข้อมูลซ้ำ]
ขนาดข้อมูล: [จำนวนแถว/จำนวนไฟล์]
ผลลัพธ์: [ตำแหน่งเซลล์, ตาราง, รายงาน, Dashboard]

โปรด:
1) วิเคราะห์เป้าหมายและโครงสร้างข้อมูล
2) เลือกฟังก์ชันหรือเครื่องมือที่เหมาะสม พร้อมเหตุผล
3) ให้สูตรพร้อมวาง และระบุตำแหน่งที่จะวาง
4) อธิบายสูตรทีละส่วนและแสดงตัวอย่าง Input → Output
5) ทดสอบค่าปกติ ค่าว่าง ข้อมูลซ้ำ ขอบเขต และ Error
6) เสนอทางเลือกสำหรับ Excel รุ่นเก่า
7) ประเมินความเร็วและความเสี่ยงด้านคุณภาพข้อมูล
8) ระบุสิ่งที่ต้องตรวจด้วยมนุษย์ก่อนใช้งานจริง
```

---

# LEVEL 1 — BEGINNER: เปลี่ยนภาษาคนเป็นสูตร Excel

## 3. เป้าหมายการเรียนรู้
- อธิบายข้อมูลและผลลัพธ์โดยไม่ต้องจำชื่อสูตร
- ให้ AI สร้างสูตรที่ถูกต้องและอธิบายได้
- ใช้สูตรพื้นฐานจาก 6 หมวด: Math, Logical, Text, Date, Lookup, Information
- ตรวจสอบสูตรด้วยตัวอย่างและป้องกันข้อผิดพลาดเบื้องต้น

## 4. Function Map
| กลุ่ม | ฟังก์ชัน | ผลลัพธ์ที่ใช้ฝึก |
|---|---|---|
| Math | SUM, AVERAGE, MIN, MAX, ROUND | ยอดขายเฉลี่ยและปัดเศษ |
| Logical | IF, AND, OR, IFERROR, IFNA | ผ่าน/ไม่ผ่านและสถานะ |
| Text | LEFT, RIGHT, MID, TEXT, TRIM, TEXTJOIN | แยกรหัสและชื่อเดือน |
| Date | TODAY, DATE, DAY, MONTH, YEAR | อายุงาน/อายุไก่ |
| Lookup | XLOOKUP, VLOOKUP | ค้นหาราคาหรือ FCR |
| Information | ISNUMBER, ISBLANK, ISERROR | ตรวจสอบความถูกต้อง |

## 5. Beginner Prompts (คัดลอกได้)

### B01 — Goal-Oriented: ชื่อเดือนจากวันที่
```text
ข้อมูลวันที่จริงของ Excel อยู่ใน A2:A100 ต้องการให้ B2 แสดงชื่อเดือนภาษาไทย และ C2 แสดงเลขเดือน
ช่วยเขียนสูตรพร้อมอธิบายความแตกต่างระหว่าง TEXT กับ MONTH
ระบุผลของการตั้งค่า Locale และวิธีตรวจสอบว่าวันที่ไม่ได้เป็นข้อความ
```
ตัวอย่างสูตร: `=TEXT(A2,"mmmm")` และ `=MONTH(A2)`; ชื่อเดือนขึ้นกับ locale/format.

### B02 — แปลงเงื่อนไขเป็น IF
```text
ถ้า A2 มากกว่า 50 และ B2 เท่ากับ "ผ่าน" ให้ C2 แสดง 100 นอกนั้น 0
ช่วยสร้างสูตร IF+AND และอธิบายผลกรณี A2=50, A2=51 และ B2 ว่าง
```
สูตร: `=IF(AND(A2>50,B2="ผ่าน"),100,0)`

### B03 — ค้นหาด้วย XLOOKUP
```text
Sheet Master: A2:A100 เป็น Product ID, C2:C100 เป็น Price
Sheet Sales: A2 เป็น Product ID ที่ต้องค้นหา
ช่วยสร้าง XLOOKUP ให้คืนราคาหรือ "ไม่พบสินค้า" หากไม่พบ และแนะนำวิธีตรวจรหัสซ้ำ
```
สูตรตัวอย่างเมื่ออยู่ในชีต Sales: `=XLOOKUP(A2,Master!$A$2:$A$100,Master!$C$2:$C$100,"ไม่พบสินค้า")`

### B04 — แยกรหัสข้อความ
```text
รหัสใน A2 มีรูปแบบ BR-2026-001 ต้องการแยก BR, 2026, 001 เป็น 3 คอลัมน์ โดยเก็บศูนย์นำหน้า
ช่วยเลือก TEXTSPLIT หรือสูตรรุ่นเก่า และทดสอบกรณีรหัสผิดรูปแบบ
```
สูตร Microsoft 365: `=TEXTSPLIT(A2,"-")`

### B05 — คำนวณอายุจากวันที่
```text
A2 เป็นวันที่เริ่มต้น B2 เป็นวันที่ประเมิน ต้องการจำนวนวันที่ผ่านไป
ช่วยสร้างสูตร แยกนิยาม Day 0 และ Day 1 และตรวจกรณี B2 ก่อน A2
```
สูตร: `=B2-A2` (Day 0) หรือ `=B2-A2+1` (Day 1 ตามกฎธุรกิจ)

### B06 — สรุปยอดตามเงื่อนไข
```text
คอลัมน์ A เป็น Department และ B เป็น Sales Amount
ต้องการยอดขายของทีม Marketing และยอดขายรวมทั้งหมด
ช่วยใช้ SUMIF และ SUM พร้อมทดสอบค่าว่างและยอดติดลบ
```
สูตร: `=SUMIF(A2:A100,"Marketing",B2:B100)` และ `=SUM(B2:B100)`

### B07 — Reverse Engineering
```text
อธิบายสูตรนี้ทีละส่วน พร้อมตัวอย่างข้อมูลและเหตุผลของ Error:
=IFNA(VLOOKUP(E2,A2:C100,3,FALSE),"ไม่พบ")
แนะนำการเขียนใหม่ด้วย XLOOKUP หากเวอร์ชันรองรับ
```

## 6. Beginner Workshop
1. คำนวณยอดขายและค่าเฉลี่ยรายวัน
2. ประเมินสถานะผ่าน/ไม่ผ่านจากสองเงื่อนไข
3. แยกรหัส Lot และรักษาเลขศูนย์นำหน้า
4. ค้นหาราคาจาก Master Data
5. คำนวณอายุไก่จาก Placement Date และ Assessment Date

**เกณฑ์ผ่าน:** สูตรถูกต้องอย่างน้อย 80%, อธิบายเหตุผลของสูตรได้ และทดสอบกรณีผิดปกติได้

---

# LEVEL 2 — INTERMEDIATE: สูตรซ้อน + วิเคราะห์หลายตาราง

## 7. เป้าหมายการเรียนรู้
- สร้างสูตรหลายเงื่อนไขและสูตรซ้อนที่ตรวจสอบได้
- เชื่อมข้อมูลหลายชีตและจัดการคีย์ซ้ำ
- วิเคราะห์ข้อมูลด้วย SUMIFS, COUNTIFS, AVERAGEIFS, FILTER, UNIQUE, SORT
- ประเมินประสิทธิภาพข้อมูลหลักหมื่นถึงแสนแถว

## 8. Function Map
| กลุ่ม | ฟังก์ชัน | กรณีใช้งาน |
|---|---|---|
| Lookup | XLOOKUP, INDEX, MATCH, XMATCH | เชื่อมตารางด้วยรหัส |
| Logical | IF, IFS, SWITCH, IFNA | ประเมินหลายระดับ |
| Aggregation | SUMIFS, COUNTIFS, AVERAGEIFS, SUMPRODUCT | KPI หลายเงื่อนไข |
| Dynamic | FILTER, SORT, SORTBY, UNIQUE, VSTACK | รายงานไดนามิก |
| Statistics | STDEV.S, STDEV.P, MEDIAN, PERCENTILE.INC | ความแปรปรวนและ Outlier |
| Date | EOMONTH, NETWORKDAYS, WORKDAY | รายงานตามช่วงเวลา |

## 9. Intermediate Prompts

### I01 — Nested XLOOKUP และการจัดการ Error
```text
ฉันต้องการค้นหา Farm ID ใน G2 จาก Master A2:A1000 แล้วคืน FCR จาก D2:D1000
หากไม่พบให้แสดง "ไม่พบฟาร์ม"; หากพบรหัสซ้ำให้แสดงคำเตือนแทนการเลือกแถวแรกเงียบ ๆ
เขียนสูตรที่อ่านง่าย พร้อมกรณีทดสอบ 3 แบบ
```
สูตรตัวอย่าง: `=IF(COUNTIF(A2:A1000,G2)>1,"รหัสซ้ำ",XLOOKUP(G2,A2:A1000,D2:D1000,"ไม่พบฟาร์ม"))`

### I02 — SUMIFS หลายเงื่อนไขและช่วงวันที่
```text
A=Farm ID, B=Transaction Date, C=Feed Type, D=Feed Consumption (kg)
รวมปริมาณอาหารของ F001 เฉพาะเดือนตุลาคม 2026 และประเภท Starter
ใช้ SUMIFS ที่รองรับวันที่มีเวลาอยู่ในเซลล์ และอธิบายเหตุผลที่ใช้ขอบเขต < วันที่ 1 เดือนถัดไป
```
สูตร: `=SUMIFS(D2:D10000,A2:A10000,"F001",C2:C10000,"Starter",B2:B10000,">="&DATE(2026,10,1),B2:B10000,"<"&DATE(2026,11,1))`

### I03 — วิเคราะห์ %CV ของน้ำหนักไก่
```text
มีน้ำหนักตัวอย่างไก่ใน B2:B101 หน่วยกรัม
คำนวณ n, Mean, Median, SD แบบ Sample, CV%, P10, P90 และ IQR
ตรวจสอบข้อมูลที่ไม่ใช่ตัวเลข ค่าเฉลี่ยเป็นศูนย์ และขนาดตัวอย่าง
ห้ามตีความ %CV เป็นเกณฑ์มาตรฐานสายพันธุ์โดยไม่มีข้อมูลอ้างอิง
```
สูตร CV%: `=IF(AVERAGE(B2:B101)=0,NA(),STDEV.S(B2:B101)/AVERAGE(B2:B101)*100)`

### I04 — รายงาน FILTER + SORT + UNIQUE
```text
ตาราง A2:E1000 มี Farm ID, Date, Age, FCR, Mortality
ผู้ใช้เลือก Farm ID ใน H2 ต้องการแสดงเฉพาะรายการของฟาร์มนั้น เรียงวันที่ใหม่ไปเก่า
สร้างสูตร FILTER และ SORTBY พร้อมกรณีไม่พบข้อมูลและ #SPILL!
```
สูตรตัวอย่าง: `=SORTBY(FILTER(A2:E1000,A2:A1000=H2),FILTER(B2:B1000,A2:A1000=H2),-1)`
หมายเหตุ: ควรเพิ่มการจัดการกรณี FILTER ไม่พบข้อมูลก่อนใช้งานจริง

### I05 — รวมหลายตารางด้วย VSTACK
```text
Sheet Jan และ Feb มีคอลัมน์เดียวกัน A:E และมีหัวตารางแถว 1
ช่วยรวมข้อมูลด้วย VSTACK โดยไม่รวม Header ซ้ำ ตรวจสอบชนิดข้อมูลและแถวว่าง
เปรียบเทียบกับ Power Query หากมีหลายสิบไฟล์หรือมีข้อมูลเพิ่มทุกเดือน
```

### I06 — ตรวจสอบคุณภาพข้อมูลแบบหลายเงื่อนไข
```text
สร้างคอลัมน์ Data Quality Status สำหรับ Farm ID, Date, Body Weight, Feed Intake และ Mortality
ตรวจสอบค่าว่าง ข้อมูลซ้ำ ตัวเลขติดลบ ชนิดข้อมูลผิด และวันที่เกินวันปัจจุบัน
แสดง PASS/WARNING/ERROR พร้อม Reason และแยกกฎธุรกิจออกจากกฎตรวจรูปแบบ
```

### I07 — Performance Benchmark
```text
มีตาราง 100,000 แถว ต้องค้นหาคีย์ 20,000 ครั้ง
เปรียบเทียบ XLOOKUP, VLOOKUP, INDEX+MATCH โดยใช้ข้อมูลจริงเดียวกัน
ออกแบบ Benchmark ที่ควบคุม Excel version, sorted/unsorted, match mode, number of formulas, calculation mode และเวลาเฉลี่ยหลายรอบ
ห้ามสรุปว่าเครื่องมือใดเร็วที่สุดหากยังไม่ได้วัด
```

## 10. Intermediate Workshop
1. Join ข้อมูล Farm Master กับ Performance Data
2. รวม Feed Consumption รายฟาร์ม/เดือน/ประเภทอาหาร
3. สร้างรายงาน KPI ที่เลือกฟาร์มได้
4. วิเคราะห์ %CV และ Outlier จากตัวอย่างน้ำหนัก
5. ทำ Data Quality Audit และ Exception Report
6. เปรียบเทียบสูตรกับ PivotTable/Power Query เมื่อข้อมูลใหญ่

**เกณฑ์ผ่าน:** สูตรถูกต้อง ≥85%, ตรวจข้อมูลซ้ำ/ค่าว่างได้ และอธิบาย Performance Trade-off ได้

---

# LEVEL 3 — ADVANCED: LET, LAMBDA, Power Query, Automation, Interactive Dashboard

## 11. เป้าหมายการเรียนรู้
- สร้างสูตรที่นำกลับมาใช้ได้และลดความซ้ำซ้อน
- รวม/แปลงข้อมูลด้วย Power Query อย่างมีขั้นตอน
- สร้าง Workflow Refresh/Validation/Approval/Reporting
- สร้าง Interactive Dashboard ที่มีการเชื่อมต่อข้อมูลจริง ไม่ใช่เพียง Mockup
- จัดการ Security, Versioning, Logs, Errors และ Human-in-the-loop

## 12. Function & Tool Map
| เครื่องมือ | จุดเด่น | เงื่อนไข |
|---|---|---|
| LET | ตั้งชื่อตัวแปรในสูตร | รองรับใน Excel รุ่นใหม่ |
| LAMBDA | สร้างฟังก์ชันใช้ซ้ำโดยไม่เขียน VBA | ต้องกำหนด Name Manager หากใช้ข้ามเซลล์ |
| MAP/BYROW/BYCOL | ประมวลผลอาร์เรย์ | ตรวจเวอร์ชัน/ช่องทางอัปเดต |
| REDUCE/SCAN | สะสมผลลัพธ์ | ตรวจผลลัพธ์และขนาดอาร์เรย์ |
| GROUPBY/PIVOTBY | สรุปกลุ่มและตารางไขว้ | ตรวจการรองรับใน tenant/version |
| Power Query | ETL และ Refresh | ต้องกำหนดแหล่งข้อมูลและสิทธิ์ |
| Office Scripts | สั่งงาน Excel ผ่านสคริปต์ | ต้องมีสิทธิ์และสภาพแวดล้อมรองรับ |
| Power Automate | Trigger/Workflow/Notifications | ต้องมี Connector/License/DLP ที่รองรับ |
| HTML Dashboard | แสดงข้อมูลโต้ตอบ | ต้องออกแบบ Data API หรือ Refresh Pipeline |

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

## 14. Advanced Workshop
1. Refactor สูตร KPI ให้เป็น LET
2. สร้าง CALC_FCR ด้วย LAMBDA + Unit Tests
3. Power Query รวมไฟล์รายวันและสร้าง Error Table
4. ออกแบบ Flow แจ้งเตือน KPI ผิดปกติพร้อม Approval
5. สร้าง HTML Dashboard ที่มี Filter/Chart/Data Table
6. ทดสอบการอัปเดตข้อมูลต้นทางและพิสูจน์ Refresh End-to-End
7. ออกแบบ AI Agent วิเคราะห์ไฟล์หลายชุดและสร้าง Output พร้อม Audit Log

**เกณฑ์ผ่าน:** ระบบทำงานครบตาม Acceptance Tests, ผล KPI ถูกต้อง, มีการจัดการ Error, และพิสูจน์ Data Refresh ได้จริง

---

## 15. ตัวอย่างข้อมูลสำหรับ Workshop

### `Farm_Performance` (ข้อมูลสมมติเพื่อฝึก ไม่ใช่มาตรฐานสายพันธุ์)
| Farm_ID | Date | Age_Days | Body_Weight_g | Feed_Intake_kg | Mortality_Count | Birds_Placed |
|---|---|---:|---:|---:|---:|---:|
| F001 | 2026-10-01 | 14 | 520 | 2400 | 3 | 10000 |
| F001 | 2026-10-08 | 21 | 950 | 3600 | 4 | 10000 |
| F002 | 2026-10-01 | 14 | 505 | 2350 | 2 | 9800 |
| F002 | 2026-10-08 | 21 | 925 | 3500 | 5 | 9800 |

**ข้อจำกัด:** Feed Intake ในตัวอย่างไม่ได้ระบุชัดว่าเป็นรายวันหรือสะสม จึงห้ามคำนวณ FCR โดยไม่กำหนดนิยามและช่วงเวลาที่ตรงกันก่อน; Mortality Count ก็ต้องระบุว่าเป็นรายวันหรือสะสม

### `Sales_Data`
| Order_ID | Order_Date | Product_ID | Channel | Quantity | Unit_Price |
|---|---|---|---|---:|---:|
| O001 | 2026-10-01 | P001 | Online | 12 | 150 |
| O002 | 2026-10-02 | P002 | Retail | 8 | 220 |
| O003 | 2026-10-03 | P001 | Online | 10 | 150 |

### `Product_Master`
| Product_ID | Product_Name | Category |
|---|---|---|
| P001 | Product A | Feed |
| P002 | Product B | Equipment |

## 16. การตรวจสอบและมาตรฐานคุณภาพ
- **Correctness:** ตรวจสูตรด้วยชุดข้อมูลที่รู้คำตอบล่วงหน้า
- **Edge Cases:** ค่าว่าง, ข้อความแทนตัวเลข, หารศูนย์, รหัสซ้ำ, วันที่ผิด, #N/A, #SPILL!
- **Compatibility:** ระบุฟังก์ชันที่ใช้ไม่ได้ใน Excel รุ่นเก่า และทางเลือก
- **Performance:** ใช้ Excel Table, จำกัดช่วงอ้างอิง, หลีกเลี่ยง volatile function โดยไม่จำเป็น; Benchmark ก่อนสรุป
- **Privacy:** ปกปิดข้อมูลส่วนบุคคลและข้อมูลธุรกิจที่ไม่จำเป็นก่อนส่งให้ AI
- **Traceability:** บันทึก Input, Formula Version, Calculation Date, Reviewer, Source และ Assumptions
- **Governance:** ไม่ให้ AI ตัดสินใจอนุมัติข้อมูลสำคัญโดยไม่มี Human-in-the-loop
- **Dashboard:** แยก Static Prototype กับ Connected Production Dashboard ให้ชัดเจน

## 17. โครงสร้างผลลัพธ์ที่ Claude ควรจัดทำ

```text
ai-excel-formula-mastery/
├── README.md
├── curriculum/
│   ├── 01-beginner.md
│   ├── 02-intermediate.md
│   └── 03-advanced.md
├── prompts/
│   ├── beginner-prompts.md
│   ├── intermediate-prompts.md
│   └── advanced-prompts.md
├── workshops/
│   ├── beginner-workshops.md
│   ├── intermediate-workshops.md
│   └── advanced-workshops.md
├── data/
│   └── sample-workbook.xlsx
├── dashboard/
│   ├── index.html
│   └── README.md
├── automation/
│   ├── power-query-guide.md
│   ├── office-scripts-guide.md
│   └── power-automate-flow.md
└── tests/
    ├── formula-test-cases.md
    └── acceptance-criteria.md
```

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

## 19. คำสั่งสุดท้ายให้ Claude ดำเนินงาน

```text
ใช้เอกสาร AI_Excel_3_Levels_Claude_Build_Spec.md นี้เป็น Source of Truth
เริ่มด้วยการสรุปโครงสร้างหลักสูตร 3 ระดับและแผนไฟล์ที่จะสร้าง
จากนั้นจัดทำเนื้อหาฉบับสมบูรณ์ทีละระดับ โดยไม่ลดรายละเอียด Prompt หรือ Workshop
ถ้าได้รับสิทธิ์ให้สร้างโค้ด/ไฟล์ ให้สร้างไฟล์จริง ทดสอบสูตรและฟังก์ชันที่ทำได้ และรายงานสถานะงานอย่างตรงไปตรงมา
เมื่อพัฒนา Dashboard ให้ระบุชัดว่าเป็น Prototype (ข้อมูลตัวอย่าง) หรือ Production (เชื่อมข้อมูลจริง)
ปิดท้ายด้วยรายการไฟล์ที่สร้าง วิธีใช้งาน และสิ่งที่ต้องตั้งค่าเพิ่มเติม
```
