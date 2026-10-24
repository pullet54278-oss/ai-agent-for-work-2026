# Intermediate Workshops พร้อมเฉลย

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้

## ต้นฉบับ

## 10. Intermediate Workshop
1. Join ข้อมูล Farm Master กับ Performance Data
2. รวม Feed Consumption รายฟาร์ม/เดือน/ประเภทอาหาร
3. สร้างรายงาน KPI ที่เลือกฟาร์มได้
4. วิเคราะห์ %CV และ Outlier จากตัวอย่างน้ำหนัก
5. ทำ Data Quality Audit และ Exception Report
6. เปรียบเทียบสูตรกับ PivotTable/Power Query เมื่อข้อมูลใหญ่

**เกณฑ์ผ่าน:** สูตรถูกต้อง ≥85%, ตรวจข้อมูลซ้ำ/ค่าว่างได้ และอธิบาย Performance Trade-off ได้

## คู่มือ Workshop (ส่วนขยาย)

### Workshop 1: Join ข้อมูล Farm Master กับ Performance Data

- เวลา: 60 นาที

- ข้อมูล: sample-workbook: Raw_Data!A1:G25 (Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Cum_kg = อาหารสะสมตั้งแต่ลงไก่, Mortality_Cum = ตายสะสม, Birds_Placed) · Master_Data!A1:F5 (Farm_ID, Region, Houses, Birds_Placed, Placement_Date, Target_FCR_42d) · Calculations (ผลลัพธ์) · Validation (ด่านตรวจ) — ข้อมูลสมมติ ไม่ใช่มาตรฐานสายพันธุ์

- เป้าหมาย: เชื่อม Raw_Data (24 แถว รายสัปดาห์) กับ Master_Data (4 ฟาร์ม) อย่างปลอดภัย แล้วคำนวณ Live_Birds, FCR สะสม, Mortality_% และเทียบกับ Target_FCR_42d โดยตรวจคีย์ซ้ำ/คีย์กำพร้าก่อนเชื่อผล

**ขั้นตอน**

1. อ่านนิยาม KPI ในชีต Instructions และจดไว้ว่า Feed_Cum_kg และ Mortality_Cum เป็น "ค่าสะสม" (ต่างจากตัวอย่างในต้นฉบับที่ไม่ได้ระบุ) น้ำหนักลูกไก่แรกรับ = 42 กรัม (Calculations!N2)
2. ด่านที่ 1 — Master ไม่ซ้ำ: ใน Validation!L2 เขียนสูตรนับรหัสซ้ำของ Master_Data!A2:A5 ต้องได้ 0
3. ด่านที่ 2 — คีย์กำพร้า: ใน Validation!L3 นับ Farm_ID ใน Raw_Data!A2:A25 ที่ไม่มีใน Master ต้องได้ 0
4. ด่านที่ 3 — คีย์ซ้ำในธุรกรรม: ใน Validation!L4 นับแถวที่ Farm_ID + Date ซ้ำใน Raw_Data ต้องได้ 0
5. ใน Calculations เพิ่มคอลัมน์ Region (L) และ Target_FCR (H) ด้วย Lookup ที่มีข้อความ "ไม่พบฟาร์ม" และตรวจรหัสซ้ำแบบ I01 (ใช้ XLOOKUP ถ้ามี Microsoft 365 และ INDEX/MATCH สำหรับรุ่นเก่า)
6. คำนวณ Live_Birds, Weight_Gain_kg, FCR และ Mortality_% ตามนิยาม พร้อมดักข้อมูลผิด (ISNUMBER, น้ำหนัก > 42, Live_Birds > 0)
7. สร้าง FCR_Status ที่อายุ 42 วัน: "สูงกว่าเป้า" / "ตามเป้า" / "ยังไม่ถึง 42 วัน"
8. ทดสอบ 3 กรณีด้วยการแก้ข้อมูลชั่วคราว: เปลี่ยน Farm_ID หนึ่งแถวเป็น X001, เพิ่มแถว F002 ซ้ำใน Master, เปลี่ยนน้ำหนักเป็นข้อความ "2,690" แล้วบันทึกผลที่เห็น จากนั้น Undo กลับ
9. เขียนสรุป 3–5 บรรทัด: ฟาร์มใดสูงกว่าเป้า FCR และข้อจำกัดของนิยาม (ต้องให้ผู้รับผิดชอบยืนยันนิยาม FCR ขององค์กร)

**เฉลย (Answer Key)**

1. Master ซ้ำ: =SUMPRODUCT((Master_Data!A2:A5<>"")*(COUNTIF(Master_Data!A2:A5,Master_Data!A2:A5)>1)) → 0
2. คีย์กำพร้า: =SUMPRODUCT((Raw_Data!A2:A25<>"")*(COUNTIF(Master_Data!A2:A5,Raw_Data!A2:A25)=0)) → 0
3. คีย์ซ้ำ: =SUMPRODUCT((Raw_Data!A2:A25<>"")*(COUNTIFS(Raw_Data!A2:A25,Raw_Data!A2:A25,Raw_Data!B2:B25,Raw_Data!B2:B25)>1)) → 0
4. Region (Microsoft 365) L2: =IF(COUNTIF(Master_Data!$A$2:$A$5,A2)>1,"รหัสซ้ำ",XLOOKUP(A2,Master_Data!$A$2:$A$5,Master_Data!$B$2:$B$5,"ไม่พบฟาร์ม")) · รุ่นเก่า: =IF(COUNTIF(Master_Data!$A$2:$A$5,A2)>1,"รหัสซ้ำ",IFNA(INDEX(Master_Data!$B$2:$B$5,MATCH(A2,Master_Data!$A$2:$A$5,0)),"ไม่พบฟาร์ม"))
5. Target_FCR H2: =IFERROR(INDEX(Master_Data!$F$2:$F$5,MATCH(A2,Master_Data!$A$2:$A$5,0)),"ไม่พบฟาร์ม") (สูตรในไฟล์ตัวอย่าง — ปรับเป็น IFNA ได้)
6. Live_Birds D2: =Raw_Data!G2-Raw_Data!F2 · Weight_Gain_kg E2: =IF(AND(ISNUMBER(Raw_Data!D2),Raw_Data!D2>$N$2),(Raw_Data!D2-$N$2)/1000*D2,NA())
7. FCR F2: =IFERROR(IF(E2>0,Raw_Data!E2/E2,NA()),NA()) · Mortality_% G2: =IF(Raw_Data!G2>0,Raw_Data!F2/Raw_Data!G2*100,NA())
8. FCR_Status I2: =IF(C2<42,"ยังไม่ถึง 42 วัน",IF(F2>H2,"สูงกว่าเป้า","ตามเป้า"))
9. ผลที่อายุ 42 วัน (ข้อมูลสมมติ): F001 FCR 1.640 (เป้า 1.65) ตามเป้า · F002 1.656 (1.65) สูงกว่าเป้า · F003 1.624 (1.68) ตามเป้า · F004 1.706 (1.68) สูงกว่าเป้า · Mortality_% สะสม 2.40 / 3.30 / 2.10 / 4.23
10. กรณีทดสอบ: X001 → "ไม่พบฟาร์ม" และคีย์กำพร้า = 1 · F002 ซ้ำใน Master → "รหัสซ้ำ" และ Master ซ้ำ = 2 · น้ำหนัก "2,690" → Weight_Gain #N/A และ FCR #N/A (ไม่ใช่ตัวเลขผิด ๆ)

**เกณฑ์ตรวจ**

- [ ] สูตรถูกต้องอย่างน้อย 85% ของเซลล์ที่ตรวจ (สุ่มตรวจ 10 เซลล์เทียบเฉลย)
- [ ] มีด่านตรวจ Master ซ้ำ คีย์กำพร้า และคีย์ซ้ำในธุรกรรม และผลเป็น 0 ก่อนสรุป
- [ ] Lookup แสดง "ไม่พบฟาร์ม"/"รหัสซ้ำ" แทนการเลือกแถวแรกเงียบ ๆ และไม่ใช้ IFERROR ซ่อน Error ที่ไม่คาดคิดโดยไม่อธิบาย
- [ ] ทดสอบครบ 3 กรณีผิดปกติและบันทึกผล
- [ ] สรุประบุว่านิยาม FCR เป็นนิยามเพื่อการสอนและต้องยืนยันกับผู้รับผิดชอบ
- [ ] อธิบายได้ว่าการค้นหา 24 แถวกับ 100,000 แถวต่างกันอย่างไรด้าน Performance (ช่วงที่อ้าง, จำนวนการค้นหา, MATCH ครั้งเดียว)

### Workshop 2: รวม Feed Consumption รายฟาร์ม/เดือน/ประเภทอาหาร

- เวลา: 60 นาที

- ข้อมูล: สร้างชีต Feed_Log เพิ่มในไฟล์ตัวอย่าง (ข้อมูลสมมติ): A Farm_ID, B Transaction_Date (วันที่+เวลา), C Feed_Type (Starter/Grower/Finisher), D Feed_kg (ต่อรายการ) — ใช้ 5 แถวจากบทที่ 3 เป็นอย่างน้อย และเพิ่มเองให้ครบ 4 ฟาร์ม · Raw_Data!E (Feed_Cum_kg สะสม) ใช้เปรียบเทียบ

- เป้าหมาย: สร้างตารางสรุปปริมาณอาหารรายฟาร์ม × เดือน × ประเภทอาหาร ด้วย SUMIFS ที่รองรับวันที่มีเวลา (I02) พร้อม Reconcile และแยกให้ออกว่าข้อมูลใดรวมได้ (รายการ) ข้อมูลใดรวมไม่ได้ (สะสม)

**ขั้นตอน**

1. สร้าง Feed_Log อย่างน้อย 20 แถว ครอบคลุม ก.ย.–พ.ย. 2026 และให้มีรายการวันที่ 31 ต.ค. เวลา 14:30 และ 1 พ.ย. 00:00 อย่างละ 1 แถว (ทดสอบขอบเขต)
2. ใส่ข้อมูลผิดโดยตั้งใจ 2 แถว: Feed_kg เป็นข้อความ "300" และวันที่เป็นข้อความ "2026-10-15"
3. สร้างชีต Feed_Summary: A3:A6 = F001–F004, B1:D1 = 2026-09-01, 2026-10-01, 2026-11-01 (วันที่จริง), A1 = Feed_Type ที่เลือก (Data Validation: Starter/Grower/Finisher)
4. เขียนสูตร B3 ครั้งเดียวที่คัดลอกได้ทั้งตาราง โดยใช้ ">="&B$1 และ "<"&EDATE(B$1,1)
5. Reconcile: ผลรวมทั้งตาราง (ทุกประเภทอาหาร) ต้องเท่ากับ SUM ของ Feed_kg ที่เป็นตัวเลขในช่วง ก.ย.–พ.ย.
6. นับข้อความที่หลุดจากผลรวม (Feed_kg และวันที่) และอธิบายว่าต้องแก้ที่ต้นทางอย่างไร
7. เปรียบเทียบ: ทำไมห้าม SUM คอลัมน์ Raw_Data!E (Feed_Cum_kg) ข้ามสัปดาห์ และคำนวณอาหารที่ใช้ระหว่างอายุ 21–28 วันของ F001 ด้วยผลต่างของค่าสะสม
8. ทำ PivotTable จาก Feed_Log (Rows = Farm_ID, Columns = Order Date Group by Months, Filter = Feed_Type) แล้วเทียบกับตารางสูตร

**เฉลย (Answer Key)**

1. B3 (ประเภทอาหารจาก $A$1): =SUMIFS(Feed_Log!$D$2:$D$5000,Feed_Log!$A$2:$A$5000,$A3,Feed_Log!$C$2:$C$5000,$A$1,Feed_Log!$B$2:$B$5000,">="&B$1,Feed_Log!$B$2:$B$5000,"<"&EDATE(B$1,1))
2. สูตรต้นฉบับ I02 สำหรับตรวจ 1 ช่อง: =SUMIFS(D2:D10000,A2:A10000,"F001",C2:C10000,"Starter",B2:B10000,">="&DATE(2026,10,1),B2:B10000,"<"&DATE(2026,11,1)) — กับ 5 แถวตัวอย่างของบทที่ 3 ได้ 800
3. Reconcile ทั้งช่วง: =SUMIFS(Feed_Log!D2:D5000,Feed_Log!B2:B5000,">="&DATE(2026,9,1),Feed_Log!B2:B5000,"<"&DATE(2026,12,1)) ต้องเท่ากับผลรวมตารางสรุปทุก Feed_Type
4. ข้อความที่หลุด: =SUMPRODUCT(--ISTEXT(Feed_Log!D2:D5000)) และ =SUMPRODUCT((Feed_Log!B2:B5000<>"")*NOT(ISNUMBER(Feed_Log!B2:B5000))) → อย่างละ 1 จากข้อมูลผิดที่ใส่
5. อาหารช่วงอายุ 21–28 วัน F001: =SUMIFS(Raw_Data!E2:E25,Raw_Data!A2:A25,"F001",Raw_Data!C2:C25,28)-SUMIFS(Raw_Data!E2:E25,Raw_Data!A2:A25,"F001",Raw_Data!C2:C25,21) = 20,093 − 11,534 = 8,559 กก.
6. เหตุผล: Feed_Cum_kg เป็นยอดสะสม การ SUM ทุกสัปดาห์จะนับอาหารสัปดาห์แรกซ้ำทุกแถว ผลสูงเกินจริงหลายเท่า
7. PivotTable ต้องได้ตัวเลขเท่ากับตารางสูตร ยกเว้นแถวที่วันที่เป็นข้อความ (Pivot จะแยกเป็นกลุ่มข้อความ/ไม่ Group) — ใช้เป็นหลักฐานว่าต้องล้างข้อมูล

**เกณฑ์ตรวจ**

- [ ] สูตรถูกต้อง ≥ 85% และคัดลอกได้ทั้งตารางโดยไม่ต้องแก้ (ใช้ $ ถูกตำแหน่ง)
- [ ] ใช้ขอบเขต "<" วันแรกของเดือนถัดไป และพิสูจน์ด้วยรายการ 31 ต.ค. 14:30 ว่าถูกนับ
- [ ] ตรวจข้อความ/ค่าว่างที่หลุดจากผลรวมได้และ Reconcile ผ่าน
- [ ] อธิบายได้ว่าข้อมูลสะสมรวมไม่ได้ และคำนวณผลต่างได้ถูก
- [ ] อธิบาย Trade-off: SUMIFS หลายร้อยช่องอัปเดตทันที vs PivotTable ต้อง Refresh แต่สรุปข้อมูลใหญ่ได้ง่าย

### Workshop 3: สร้างรายงาน KPI ที่เลือกฟาร์มได้

- เวลา: 60 นาที

- ข้อมูล: sample-workbook: Dashboard!B3 (ช่องเลือกฟาร์ม), Calculations!A2:I25 (Farm_ID, Date, Age_Days, Live_Birds, Weight_Gain_kg, FCR, Mortality_%, Target_FCR, FCR_Status), Raw_Data!A2:G25

- เป้าหมาย: สร้างหน้ารายงานที่ผู้ใช้เลือก Farm_ID แล้วเห็น KPI ล่าสุด (อายุ, น้ำหนัก, FCR, Mortality_%) และตารางรายละเอียดเรียงวันที่ใหม่ → เก่า พร้อมจัดการกรณีไม่พบข้อมูล, ช่องว่าง และ #SPILL! (I04)

**ขั้นตอน**

1. สร้างรายการ Farm_ID ไม่ซ้ำสำหรับ Drop-down: Microsoft 365 ใช้ SORT(UNIQUE(...)) ในชีตช่วย, รุ่นเก่าใช้ Master_Data!A2:A5 โดยตรง แล้วตั้ง Data Validation ที่ Dashboard!B3
2. KPI Card 1 — อายุล่าสุด: MAXIFS ของ Age_Days ตามฟาร์ม
3. KPI Card 2–4 — Body_Weight_g, FCR, Mortality_% ที่อายุล่าสุด: SUMIFS ด้วย Farm_ID + Age_Days ล่าสุด (มีแถวเดียวต่อคู่คีย์ — ตรวจด้วย COUNTIFS)
4. ตารางรายละเอียดที่ Dashboard!A8: FILTER + SORTBY จาก Calculations ตาม I04 แล้วปรับปรุงด้วย if_empty และการตรวจ B3 ว่าง
5. ทางเลือกรุ่นเก่า: INDEX + AGGREGATE ดึงรายการที่ k (ลากลง 10 แถว)
6. ทดสอบ: เลือก F001–F004, ลบค่าใน B3, พิมพ์ X001, พิมพ์ค่าขวางพื้นที่ Spill แล้วจดผล
7. เพิ่มบรรทัดแสดงแหล่งข้อมูล วันที่รายงาน (Instructions!B27) และจำนวนแถวที่แสดง

**เฉลย (Answer Key)**

1. อายุล่าสุด C5: =IF($B$3="","—",MAXIFS(Calculations!$C$2:$C$25,Calculations!$A$2:$A$25,$B$3)) (Excel 2019+) — รุ่นเก่า: =AGGREGATE(14,6,Calculations!$C$2:$C$25/(Calculations!$A$2:$A$25=$B$3),1)
2. ตรวจคู่คีย์ไม่ซ้ำ: =COUNTIFS(Raw_Data!$A$2:$A$25,$B$3,Raw_Data!$C$2:$C$25,C5) ต้องเท่ากับ 1
3. น้ำหนักล่าสุด: =SUMIFS(Raw_Data!$D$2:$D$25,Raw_Data!$A$2:$A$25,$B$3,Raw_Data!$C$2:$C$25,C5) · FCR: =SUMIFS(Calculations!$F$2:$F$25,Calculations!$A$2:$A$25,$B$3,Calculations!$C$2:$C$25,C5) · Mortality_%: เปลี่ยนเป็นคอลัมน์ G
4. ผลที่คาดหวัง F002: อายุ 42 · 2,609 กรัม · FCR 1.656 · Mortality 3.30% · F004: 42 · 2,556 · 1.706 · 4.23%
5. ตารางรายละเอียด (ต้นฉบับ I04 ปรับช่วง): =SORTBY(FILTER(Calculations!A2:G25,Calculations!A2:A25=B3),FILTER(Calculations!B2:B25,Calculations!A2:A25=B3),-1)
6. ตารางรายละเอียด (ปรับปรุง): =IF(B3="","เลือก Farm ID",SORTBY(FILTER(Calculations!A2:G25,Calculations!A2:A25=B3,"ไม่พบข้อมูล"),FILTER(Calculations!B2:B25,Calculations!A2:A25=B3,""),-1))
7. รุ่นเก่า (คอลัมน์วันที่ แถวที่ k): =IFERROR(INDEX(Calculations!$B$2:$B$25,AGGREGATE(15,6,(ROW(Calculations!$A$2:$A$25)-1)/(Calculations!$A$2:$A$25=$B$3),ROWS($A$8:A8))),"") — เรียงเก่า → ใหม่ตามลำดับตาราง ใช้ AGGREGATE(14,...) ถ้าต้องการใหม่ → เก่า
8. ผลการทดสอบ: B3 ว่าง → "เลือก Farm ID" · X001 → "ไม่พบข้อมูล" (สูตรต้นฉบับได้ #CALC!) · ค่าขวาง → #SPILL! · แต่ละฟาร์มแสดง 6 แถว
9. จำนวนแถวที่แสดง: =IF(ISTEXT(A8),0,ROWS(A8#)) (Microsoft 365)

**เกณฑ์ตรวจ**

- [ ] KPI ทั้ง 4 ตรงกับเฉลยทุกฟาร์ม (≥ 85% ของการตรวจ 16 ค่า)
- [ ] จัดการกรณี B3 ว่าง, ไม่พบฟาร์ม และ #SPILL! ได้ พร้อมข้อความที่ผู้ใช้เข้าใจ
- [ ] มีการตรวจคู่คีย์ซ้ำก่อนใช้ SUMIFS ดึงค่าล่าสุด
- [ ] มีทางเลือกสำหรับ Excel ที่ไม่มี FILTER และระบุเวอร์ชันของแต่ละสูตร
- [ ] อธิบาย Trade-off: FILTER ทั้งตารางใหญ่คำนวณใหม่ทุกครั้งที่ข้อมูลเปลี่ยน vs PivotTable + Slicer ที่ต้อง Refresh

### Workshop 4: วิเคราะห์ %CV และ Outlier จากตัวอย่างน้ำหนัก

- เวลา: 45 นาที

- ข้อมูล: sample-workbook: Weight_Samples!A1:B101 (Bird_No, Body_Weight_g — F001 อายุ 21 วัน, ข้อมูลสมมติ) · ผลลัพธ์ใน Calculations (ส่วนสถิติน้ำหนักตัวอย่าง) หรือชีตใหม่ Stats

- เป้าหมาย: คำนวณ n, Mean, Median, SD (Sample), CV%, P10, P90, IQR และ Tukey fence จากน้ำหนักไก่ตัวอย่าง 100 ตัว ตรวจคุณภาพข้อมูลก่อนคำนวณ และเขียนสรุปที่ไม่ตีความ %CV เป็นเกณฑ์มาตรฐานสายพันธุ์ (I03)

**ขั้นตอน**

1. ทดสอบสูตรกับชุดเล็กที่รู้คำตอบก่อน: 1800, 1900, 2000, 2100, 2200 (Mean 2,000, SD 158.11, CV% 7.91, P10 1,840, P90 2,160, IQR 200)
2. ตรวจข้อมูล: จำนวนค่าที่ไม่ใช่ตัวเลข, MIN, MAX และค่าที่น่าสงสัยเรื่องหน่วย (น้อยกว่า 50)
3. คำนวณ n, Mean, Median, SD (Sample), CV% (สูตรต้นฉบับและสูตรปรับปรุง), P10, P90, Q1, Q3, IQR
4. คำนวณ Lower/Upper fence = Q1 − 1.5×IQR และ Q3 + 1.5×IQR แล้ว Flag ทุกแถวในคอลัมน์ C
5. ทดลองแก้ B2 เป็น 9,400 (พิมพ์ผิดหนึ่งหลัก) แล้วดูว่า Mean, SD, CV%, Median, IQR เปลี่ยนแค่ไหน จากนั้น Undo
6. เปรียบเทียบ STDEV.S กับ STDEV.P และอธิบายว่าทำไมเลือก STDEV.S
7. เขียนสรุป 5 บรรทัด ระบุ n, วิธีคำนวณ, ข้อจำกัด และประโยค "ไม่ได้เทียบกับเกณฑ์มาตรฐานสายพันธุ์"

**เฉลย (Answer Key)**

1. ไม่ใช่ตัวเลข: =COUNTA(Weight_Samples!B2:B101)-COUNT(Weight_Samples!B2:B101) → 0 · MIN 787 · MAX 1,094
2. n: =COUNT(Weight_Samples!$B$2:$B$101) → 100
3. Mean: =AVERAGE(Weight_Samples!$B$2:$B$101) → 940.85 · Median: =MEDIAN(...) → 943.5
4. SD (Sample): =STDEV.S(Weight_Samples!$B$2:$B$101) → 80.48 · STDEV.P → 80.07
5. CV% ต้นฉบับ: =IF(AVERAGE(B2:B101)=0,NA(),STDEV.S(B2:B101)/AVERAGE(B2:B101)*100) → 8.55 · ปรับปรุง: =IF(COUNT(B2:B101)<2,NA(),IF(AVERAGE(B2:B101)<=0,NA(),STDEV.S(B2:B101)/AVERAGE(B2:B101)*100)) → 8.55
6. P10: =PERCENTILE.INC(Weight_Samples!$B$2:$B$101,0.1) → 827.9 · P90: 0.9 → 1,057.1
7. Q1: =QUARTILE.INC(...,1) → 885.5 · Q3: =QUARTILE.INC(...,3) → 1,004.25 · IQR → 118.75
8. Fence: 885.5 − 1.5×118.75 = 707.375 และ 1,004.25 + 1.5×118.75 = 1,182.375 → ไม่มีค่าใดอยู่นอก fence (Outlier = 0)
9. Flag C2: =IF(NOT(ISNUMBER(B2)),"ตรวจข้อมูล",IF(B2<$H$4-1.5*($H$5-$H$4),"ต่ำผิดปกติ",IF(B2>$H$5+1.5*($H$5-$H$4),"สูงผิดปกติ",""))) (H4 = Q1, H5 = Q3)
10. ทดลอง B2 = 9,400: Mean และ SD สูงขึ้นมาก (CV% เพิ่มหลายเท่า) แต่ Median และ IQR เปลี่ยนน้อย และ Flag แสดง "สูงผิดปกติ" — ยืนยันว่าต้องตรวจ Outlier ก่อนรายงาน CV% (ให้ผู้เรียนบันทึกตัวเลขที่ได้จริงจาก Excel)
11. ตัวอย่างสรุป: "น้ำหนักตัวอย่าง F001 อายุ 21 วัน n = 100 ตัว Mean 940.85 กรัม Median 943.5 กรัม SD 80.48 กรัม CV% 8.55 P10–P90 = 827.9–1,057.1 กรัม ไม่พบค่านอก Tukey fence ข้อมูลเป็นข้อมูลสมมติ และยังไม่ได้เทียบกับเกณฑ์มาตรฐานสายพันธุ์ใด ๆ"

**เกณฑ์ตรวจ**

- [ ] ค่าสถิติทั้ง 8 ตัว (n, Mean, Median, SD, CV%, P10, P90, IQR) ถูกต้อง ≥ 85% (ปัด 2 ตำแหน่ง)
- [ ] ตรวจค่าไม่ใช่ตัวเลข/ค่าว่าง และขนาดตัวอย่างก่อนคำนวณ
- [ ] ใช้ STDEV.S พร้อมเหตุผล และสูตร CV% ป้องกัน n < 2 และ Mean = 0
- [ ] Flag Outlier โดยไม่ลบข้อมูล และอธิบายผลของค่าพิมพ์ผิดต่อ Mean/SD vs Median/IQR
- [ ] สรุปไม่ตีความ %CV เป็นเกณฑ์มาตรฐานสายพันธุ์ และระบุว่าเป็นข้อมูลสมมติ

### Workshop 5: ทำ Data Quality Audit และ Exception Report

- เวลา: 60 นาที

- ข้อมูล: sample-workbook: Validation!A3:E12 (Farm_ID, Date, Body_Weight_g, Feed_Cum_kg, Mortality_Cum — 9 แถวที่มีปัญหาโดยตั้งใจ) · Instructions!B27 = วันที่รายงาน 2026-10-31 · Master_Data!A2:A5

- เป้าหมาย: สร้างคอลัมน์ Status / Reason / Rule_Type ให้ชีต Validation ตาม I06 แยกกฎรูปแบบกับกฎธุรกิจ สรุปจำนวน PASS/WARNING/ERROR และทำ Exception Report ที่ผู้รับผิดชอบนำไปแก้ได้

**ขั้นตอน**

1. อ่านข้อมูลทั้ง 9 แถวและเดาสถานะด้วยตัวเองก่อน (บันทึกไว้เทียบภายหลัง)
2. เขียนตารางกฎ: กฎรูปแบบ (ERROR) = Farm_ID ว่าง, Body_Weight_g ไม่ใช่ตัวเลข, ค่าติดลบ, วันที่เกินวันรายงาน · กฎธุรกิจ (WARNING) = Farm_ID + Date ซ้ำ, Feed_Cum_kg ว่าง, (เพิ่มเอง) Farm_ID ไม่อยู่ใน Master
3. F4: สูตร Status ที่ตรวจกฎรูปแบบก่อนกฎธุรกิจ · G4: สูตร Reason ที่ให้เหตุผลเดียวตามลำดับเดียวกัน · H4: Rule_Type (Format/Business/—)
4. ใช้ Instructions!$B$27 แทน TODAY() เพื่อให้ผลตรวจย้อนได้
5. สรุปจำนวนแต่ละสถานะใน J4:J6 และตรวจว่ารวมกัน = 9
6. Exception Report: Microsoft 365 ใช้ FILTER แสดงเฉพาะแถวที่ไม่ PASS เรียง ERROR ก่อน · รุ่นเก่าใช้ AutoFilter + SUBTOTAL(103,...) นับแถวที่มองเห็น
7. ใส่ Conditional Formatting สีแดง/เหลืองให้ ERROR/WARNING
8. ทดสอบเพิ่ม 3 แถว: Farm_ID X001, วันที่เป็นข้อความ, Mortality_Cum ติดลบ แล้วตรวจว่า Reason ถูก

**เฉลย (Answer Key)**

1. Status F4: =IF(A4="","ERROR",IF(NOT(ISNUMBER(C4)),"ERROR",IF(C4<0,"ERROR",IF(B4>Instructions!$B$27,"ERROR",IF(COUNTIFS($A$4:$A$12,A4,$B$4:$B$12,B4)>1,"WARNING",IF(D4="","WARNING","PASS"))))))
2. Reason G4: =IF(A4="","ไม่มี Farm_ID",IF(NOT(ISNUMBER(C4)),"Body_Weight_g ไม่ใช่ตัวเลข",IF(C4<0,"ค่าติดลบ",IF(B4>Instructions!$B$27,"วันที่เกินวันรายงาน",IF(COUNTIFS($A$4:$A$12,A4,$B$4:$B$12,B4)>1,"ข้อมูลซ้ำ (Farm_ID + Date)",IF(D4="","Feed_Cum_kg ว่าง","ผ่าน"))))))
3. Rule_Type H4: =IF(F4="ERROR","Format",IF(F4="WARNING","Business","—"))
4. ผลที่คาดหวัง (แถว 4–12): PASS, PASS, WARNING (ซ้ำ), WARNING (ซ้ำ), ERROR (ไม่มี Farm_ID), ERROR (ค่าติดลบ), ERROR (วันที่เกินวันรายงาน), ERROR (ไม่ใช่ตัวเลข "1,000"), WARNING (Feed_Cum_kg ว่าง)
5. สรุป: =COUNTIF($F$4:$F$12,"ERROR") → 4 · "WARNING" → 3 · "PASS" → 2 · รวม 9
6. Exception Report (Microsoft 365): =LET(d,A4:G12,s,F4:F12,r,FILTER(d,s<>"PASS","ไม่มีข้อผิดพลาด"),IF(COLUMNS(r)=1,r,SORTBY(r,FILTER(s,s<>"PASS"),1)))
7. กฎเพิ่ม Farm_ID ไม่อยู่ใน Master (ใส่ก่อนชั้น "ซ้ำ"): IF(COUNTIF(Master_Data!$A$2:$A$5,A4)=0,"WARNING",...) และ Reason "ไม่พบใน Master"
8. แถวทดสอบเพิ่ม: X001 → WARNING ไม่พบใน Master (หลังเพิ่มกฎ) · วันที่เป็นข้อความ → ต้องเพิ่มกฎ NOT(ISNUMBER(B4)) มิฉะนั้นข้อความ > ตัวเลขจะถูกจัดเป็น "วันที่เกินวันรายงาน" (ผลถูกโดยบังเอิญแต่เหตุผลผิด) · Mortality_Cum ติดลบ → ต้องขยายกฎค่าติดลบให้ครอบคลุมคอลัมน์ E (สูตรในไฟล์ตรวจเฉพาะ C)

**เกณฑ์ตรวจ**

- [ ] สถานะและเหตุผลถูกต้อง ≥ 85% ของแถว (รวมแถวทดสอบเพิ่ม)
- [ ] ตรวจค่าว่างและข้อมูลซ้ำได้ และกฎรูปแบบอยู่ก่อนกฎธุรกิจ
- [ ] ไม่ใช้ TODAY() ในผลที่ต้องตรวจย้อน และไม่ใช้ IFERROR เปลี่ยน Error เป็น PASS
- [ ] มีสรุปจำนวนและ Reconcile = จำนวนแถว
- [ ] Exception Report ใช้งานได้ทั้ง Microsoft 365 และรุ่นเก่า
- [ ] อธิบายได้ว่าการตรวจซ้ำด้วย COUNTIFS ทุกแถวมีต้นทุนการคำนวณเพิ่มตามจำนวนแถว และเมื่อใดควรย้ายไป Power Query

### Workshop 6: เปรียบเทียบสูตรกับ PivotTable/Power Query เมื่อข้อมูลใหญ่

- เวลา: 90 นาที

- ข้อมูล: สร้างชีต Big_Data จาก Raw_Data (หรือ Sales_Data) ขยายเป็น 100,000 แถวแล้ว Paste Values (ข้อมูลสมมติ) · ชีต Keys = คีย์ 20,000 ค่า (90% พบ / 10% ไม่พบ) · ชีต Bench_Log = บันทึกผลวัด

- เป้าหมาย: ออกแบบและ (ถ้ามีเวลา) ทดลองวัดการสรุปข้อมูลขนาดใหญ่ด้วย 3 วิธี — สูตร SUMIFS/Lookup, PivotTable และ Power Query — ตามแผน Benchmark ของ I07 แล้วสรุป Trade-off จากผลที่วัดได้จริงเท่านั้น

**ขั้นตอน**

1. เขียนคำถามที่ต้องตอบ: สรุป Feed/Amount ตาม Farm_ID × เดือน และค้นหาค่าจากคีย์ 20,000 ค่า
2. สร้างข้อมูลทดสอบที่ทำซ้ำได้: สร้างด้วยสูตรครั้งเดียวแล้ว Paste Values, บันทึกจำนวนแถว/คอลัมน์ และ Save เป็นไฟล์แยก
3. ตารางตัวแปรควบคุมใน Bench_Log: Excel version/Build, 32/64-bit, sorted/unsorted, match mode, search mode, จำนวนสูตร, Calculation mode, จำนวนรอบ, เครื่อง/โปรแกรมอื่นที่เปิด
4. วิธีที่ 1 — สูตร: วาง XLOOKUP, VLOOKUP(FALSE), INDEX/MATCH แยกคอลัมน์ละ 20,000 เซลล์ และ SUMIFS ตารางสรุป ตั้ง Calculation = Manual แล้ววัด Full Calculation
5. วิธีที่ 2 — PivotTable: สร้างจาก Big_Data (ไม่ใช้/ใช้ Data Model) วัดเวลา Refresh
6. วิธีที่ 3 — Power Query: Group By Farm_ID + Month และ Merge กับ Keys วัดเวลา Refresh All
7. วัดแต่ละวิธี 5 รอบ ตัดรอบแรก บันทึกค่าดิบ ค่าเฉลี่ย ต่ำสุด สูงสุด (ถ้าไม่ได้วัด ให้เขียน "ยังไม่ได้วัด")
8. ตรวจความถูกต้องก่อนเทียบความเร็ว: ผลรวมของทั้ง 3 วิธีต้องเท่ากัน
9. สรุปตาราง Trade-off: ความเร็ว (จากผลวัด), การอัปเดต, การตรวจย้อน, ขนาดไฟล์, ความยากในการดูแล, ข้อจำกัดเวอร์ชัน

**เฉลย (Answer Key)**

1. โค้ดวัดเวลา (VBA ตัวอย่าง): Sub Bench(): Dim t As Double, i As Integer: Application.Calculation = xlCalculationManual: For i = 1 To 5: t = Timer: Application.CalculateFull: Debug.Print i, Timer - t: Next i: End Sub (ไฟล์ .xlsm; Office Scripts ใช้ Date.now() คู่กับ workbook.getApplication().calculate(ExcelScript.CalculationType.full))
2. ตาราง Bench_Log คอลัมน์: Run_ID, Method, Excel_Build, Bitness, Rows, Lookups, Sorted, Match_Mode, Calc_Mode, Round, Seconds, Note
3. สูตรตรวจความถูกต้อง: =SUM(ผลสรุปสูตร)=GETPIVOTDATA("Feed_kg",Pivot!$A$3) และ =SUM(ผลสรุปสูตร)=SUM(PQ_Result[Feed_kg])
4. ข้อสรุปที่ยอมรับได้ (ไม่ใช่ผลวัด): สูตรเหมาะกับรายงานที่ต้องคำนวณทันทีและตรวจทีละเซลล์ · PivotTable เหมาะกับการสรุปแบบสำรวจและ Distinct Count ผ่าน Data Model · Power Query เหมาะกับการรวม/ล้างข้อมูลหลายไฟล์และ Refresh เป็นขั้นตอน — ความเร็วจริงให้ดูจาก Bench_Log ของเครื่องที่วัดเท่านั้น
5. ตัวอย่างการเขียนผล: "XLOOKUP (unsorted, exact) เฉลี่ย __ วินาที จาก 4 รอบ บน Excel Build ____ 64-bit" — เว้นว่างจนกว่าจะวัดจริง ห้ามเติมตัวเลขที่ไม่ได้วัด
6. ข้อควรระวังที่ต้องเขียนในรายงาน: ผลขึ้นกับเครื่องและเวอร์ชัน, การอ้างทั้งคอลัมน์และ volatile function ทำให้ช้าลง, binary search (XLOOKUP search_mode 2 หรือ MATCH match_type 1) ต้องเรียงข้อมูลก่อน มิฉะนั้นผลผิด

**เกณฑ์ตรวจ**

- [ ] แผน Benchmark ครบตัวแปรควบคุมตาม I07 (version, sorted/unsorted, match mode, จำนวนสูตร, calculation mode, หลายรอบ)
- [ ] ตรวจความถูกต้องของผลทั้ง 3 วิธีก่อนเทียบความเร็ว (ผลรวมเท่ากัน)
- [ ] ไม่สรุปว่าวิธีใดเร็วที่สุดโดยไม่มีผลวัด และบันทึกค่าดิบทุกรอบ
- [ ] อธิบาย Performance Trade-off ได้ครบ: ความเร็ว การอัปเดต การตรวจย้อน การดูแล และข้อจำกัดเวอร์ชัน
- [ ] ระบุสิ่งที่ต้องตั้งค่า/สิทธิ์ (Power Query แหล่งข้อมูล, VBA/Office Scripts ที่องค์กรอนุญาต)
