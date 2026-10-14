# Power Query: รวมไฟล์รายวันจากโฟลเดอร์ ตรวจ Schema แยก Error Rows

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้ · โค้ดเป็นแม่แบบ ยังไม่ได้รันในบัญชีจริง

คู่มือนี้ตอบ Prompt **A03** โดยสร้าง ETL ที่รวมไฟล์ Excel ทุกไฟล์ในโฟลเดอร์เดียวกัน ตรวจโครงสร้าง (Schema) รายไฟล์ แปลงชนิดข้อมูล จัดการแถวซ้ำ แยกแถวที่มีปัญหาไปตาราง `Error_Rows` และเก็บ `Source_File` กับ `Refresh_Timestamp` ทุกแถว เพื่อให้ตรวจย้อนกลับได้ว่าตัวเลขแต่ละตัวมาจากไฟล์ใดและ Refresh เมื่อไร

โครงสร้าง Query ที่แนะนำมี 5 ตัว: `FolderPath` และ `SheetName` (Parameter), `File_Schema_Check` (รายงานรายไฟล์), `Farm_Daily_Staging` (Connection only — รวมทุกแถวพร้อมรหัสปัญหา), `Farm_Daily` (ตารางสะอาดสำหรับคำนวณ KPI) และ `Error_Rows` (แถวที่ต้องให้ผู้รับผิดชอบแก้ไข) การแยก Staging ออกมาทำให้ตารางสะอาดและตาราง Error มาจากชุดข้อมูลเดียวกัน จึงกระทบยอดจำนวนแถวได้

**สำคัญ:** Power Query ไม่ Refresh เองเมื่อมีไฟล์ใหม่ ต้องมีคนกด Refresh หรือมีการตั้งค่า/เครื่องมือเสริมที่ระบุไว้ในหัวข้อ "การ Refresh" เท่านั้น โค้ดในคู่มือนี้เป็นแม่แบบที่ต้องปรับชื่อคอลัมน์ ชื่อชีต และเกณฑ์ให้ตรงกับข้อมูลจริงก่อนใช้

## สิ่งที่ต้องมี

- Excel for Microsoft 365 หรือ Excel 2016 ขึ้นไปบน Windows (เมนู **Data → Get Data → From File → From Folder**) — Excel for Mac รองรับ Power Query แล้วแต่บางแหล่งข้อมูล/เมนูอาจต่างกัน (ตรวจกับบัญชีจริงก่อนสอน)
- ไฟล์ต้นทางทุกไฟล์เป็น `.xlsx` มีชีตชื่อเดียวกัน (ค่าเริ่มต้น `Data`) หัวตารางอยู่แถวแรกของข้อมูล และชื่อคอลัมน์ตรงตาม Schema ด้านล่าง
- ตกลงนิยามคอลัมน์กับผู้รับผิดชอบข้อมูลก่อน โดยเฉพาะ Feed_Intake_kg และ Mortality_Count ว่าเป็น **รายวันหรือสะสม** (ข้อจำกัดในข้อ 15 ของต้นฉบับ) — คู่มือนี้กำหนดให้เป็น **ค่าสะสมตั้งแต่ลงเลี้ยง** ตามสมุดงานตัวอย่าง
- ถ้าโฟลเดอร์อยู่บน SharePoint/OneDrive ให้ใช้ `SharePoint.Files` แทน `Folder.Files` (ดูโค้ด Parameter) เพราะ Path แบบ `C:\...` ใช้ได้เฉพาะเครื่องที่มีโฟลเดอร์นั้น
- ผู้เรียนรู้จักหน้าต่าง Power Query Editor: Applied Steps, Formula Bar (View → Formula Bar) และ Advanced Editor
- ปิด Privacy/สิทธิ์ให้ถูกต้อง: ผู้ที่ Refresh ต้องมีสิทธิ์อ่านทุกไฟล์ในโฟลเดอร์

## Schema

| คอลัมน์ | ชนิด | กฎ |
|---|---|---|
| Farm_ID | text | บังคับ · ตัดช่องว่างและแปลงเป็นตัวพิมพ์ใหญ่ · ต้องอยู่ในรายการ F001–F004 (แก้รายการได้ที่ `ValidFarmIds`) · ไม่ตรง = `FARM_ID_INVALID` |
| Date | date | บังคับ · ถ้าเป็นข้อความต้องเป็นรูปแบบ `yyyy-mm-dd` (แปลงด้วย culture en-US) · ปี > 2400 ถือว่าเป็นปี พ.ศ. = `DATE_BUDDHIST_YEAR` · วันที่หลังวัน Refresh = `DATE_IN_FUTURE` |
| Age_Days | Int64 (whole number) | บังคับ · 0–70 วัน (เกณฑ์ตัวอย่าง ปรับตามรอบการเลี้ยงจริง) · นอกช่วง = `AGE_OUT_OF_RANGE` · หมายเหตุ: การแปลงเป็น Whole Number จะปัดทศนิยม |
| Body_Weight_g | number (decimal) | บังคับ · น้ำหนักเฉลี่ยต่อตัว หน่วยกรัม · ต้อง > 0 = มิฉะนั้น `BODY_WEIGHT_INVALID` |
| Feed_Intake_kg | number (decimal) | **ตัดสินใจ: ค่าสะสมตั้งแต่ลงเลี้ยงจนถึงวันที่บันทึก ของทั้งฝูง หน่วย kg** (ในสมุดงานตัวอย่างคอลัมน์นี้ชื่อ `Feed_Cum_kg`) · ต้อง ≥ 0 · ค่าต้องไม่ลดลงเมื่อวันที่เพิ่ม (ตรวจใน Office Script ข้อ 1) · ถ้าต้นทางส่งเป็นรายวัน ต้องเปลี่ยนชื่อคอลัมน์เป็น `Feed_Daily_kg` และเพิ่มขั้นตอนสะสม ห้ามนำมาคำนวณ FCR ปนกัน |
| Mortality_Count | Int64 (whole number) | **ตัดสินใจ: ค่าสะสมตั้งแต่ลงเลี้ยง** (ในสมุดงานตัวอย่างชื่อ `Mortality_Cum`) · ต้อง ≥ 0 และไม่เกิน Birds_Placed · ต้องไม่ลดลงเมื่อวันที่เพิ่ม |
| Birds_Placed | Int64 (whole number) | บังคับสำหรับคำนวณ Mortality % และ FCR · ต้อง > 0 · ควรเท่ากันทุกแถวของฟาร์มเดียวกันในรอบเดียวกัน |
| Source_File | text | Power Query เติมเอง = ชื่อไฟล์ต้นทาง (`[Name]` จาก Folder.Files) ใช้ตรวจย้อนกลับ ห้ามให้ผู้ใช้กรอก |
| Source_Row | Int64 | Power Query เติมเอง = ลำดับแถวในไฟล์ต้นทาง (สมมติหัวตารางอยู่แถว 1) ใช้บอกผู้รับผิดชอบว่าต้องแก้แถวไหน |
| Refresh_Timestamp | datetime | Power Query เติมเองด้วย `DateTime.LocalNow()` ครั้งเดียวต่อการ Refresh · บน Excel desktop เป็นเวลาเครื่อง ถ้า Refresh บนบริการคลาวด์อาจเป็นเวลา UTC (ตรวจกับบัญชีจริงก่อนสอน) |

## ขั้นตอนบนหน้าจอ

1. **เตรียมโฟลเดอร์:** สร้างโฟลเดอร์เฉพาะสำหรับไฟล์รายวัน ใส่ไฟล์ทดสอบ 2–3 ไฟล์ที่ถูกต้อง ปิดไฟล์ทุกไฟล์ก่อน (ไฟล์ที่เปิดค้างจะมีไฟล์ชั่วคราว `~$...` ซึ่ง Query จะกรองทิ้ง)
2. **สร้าง Parameter:** Data → Get Data → Launch Power Query Editor → Home → Manage Parameters → New → Name `FolderPath`, Type `Text`, Current Value = path ของโฟลเดอร์ → OK · ทำซ้ำสร้าง `SheetName` = `Data`
3. **เชื่อมโฟลเดอร์:** ใน Excel เลือก Data → Get Data → From File → **From Folder** → เลือกโฟลเดอร์ → หน้าต่างแสดงรายการไฟล์ → กด **Transform Data** (อย่ากด Combine ทันที เพื่อคุมขั้นตอนเอง)
4. **ผูก Parameter:** ที่ขั้น `Source` ใน Formula Bar แก้ path เป็น `= Folder.Files(FolderPath)` (สำหรับ SharePoint ใช้ `SharePoint.Files(SiteUrl, [ApiVersion = 15])` แล้วกรอง `[Folder Path]`)
5. **กรองไฟล์:** คลิกลูกศรคอลัมน์ Extension → เลือกเฉพาะ `.xlsx` · คอลัมน์ Name → Text Filters → Does Not Begin With → `~$`
6. **ทางลัดด้วย UI (ไว้เปรียบเทียบ):** คลิกปุ่มลูกศรคู่ที่หัวคอลัมน์ Content → **Combine Files** → เลือกชีตตัวอย่าง `Data` → OK · Excel จะสร้าง Helper Queries (Sample File, Transform Sample File, Transform File) อัตโนมัติ — วิธีนี้เร็วแต่ถ้าไฟล์ใดผิด Schema ทั้ง Query จะ Error จึงแนะนำให้เปลี่ยนเป็นโค้ดใน `mcode.main` ด้วย Advanced Editor
7. **ใส่โค้ด Staging:** Home → Advanced Editor → วางโค้ด `Farm_Daily_Staging` จาก `mcode.main` → Done → ตั้งชื่อ Query ที่แผง Query Settings ว่า `Farm_Daily_Staging`
8. **ตรวจ Schema:** คลิกขวาที่แผง Queries → New Query → Other Sources → Blank Query → Advanced Editor → วางโค้ด `File_Schema_Check` จาก `mcode.schemaCheck` · ตรวจคอลัมน์ `Schema_Status` ต้องเป็น `PASS` ทุกไฟล์ที่ตั้งใจใช้
9. **ตรวจการแปลงชนิด (Change Type):** ใน Staging คลิกขั้น `Typed` ดูไอคอนชนิดข้อมูลที่หัวคอลัมน์ (ABC = text, ปฏิทิน = date, 123 = whole number, 1.2 = decimal) · ถ้าต้องเปลี่ยนด้วย UI ให้คลิกขวาหัวคอลัมน์ → Change Type → **Using Locale...** เลือก English (United States) เพื่อไม่ให้วันที่สลับวัน/เดือนตามเครื่อง
10. **ดูรหัสปัญหา:** คอลัมน์ `Rule_Issue` ต้องเป็น null สำหรับแถวปกติ · ใช้ View → Column quality / Column distribution / Column profile (เลือก "based on entire data set" ที่แถบสถานะด้านล่าง) เพื่อดู Error/Empty ทั้งชุด
11. **สร้างตารางสะอาด:** คลิกขวา `Farm_Daily_Staging` → Reference → ตั้งชื่อ `Farm_Daily` → Advanced Editor วางโค้ดส่วน `Farm_Daily` (กรองเฉพาะ `Rule_Issue = null`, Remove Errors, **Remove Duplicates** ด้วย Table.Distinct และตัดคีย์ Farm_ID + Date ที่ขัดแย้ง)
12. **ลบแถวซ้ำด้วย UI (เทียบกับโค้ด):** เลือกคอลัมน์ข้อมูล 7 คอลัมน์ (ไม่รวม Source_File/Source_Row/Refresh_Timestamp) → Home → Remove Rows → **Remove Duplicates** · ถ้าเลือก Source_File ด้วย แถวที่ซ้ำข้ามไฟล์จะไม่ถูกลบ
13. **สร้างตาราง Error:** New Query → Blank Query → วางโค้ด `mcode.errors` ตั้งชื่อ `Error_Rows` · ตาราง Error ต้องมี Source_File, Source_Row, Raw_Values, Error_Code, Error_Detail เพื่อให้ผู้รับผิดชอบแก้ต้นทางได้ (ห้ามแก้ข้อมูลในตาราง Error แล้วถือว่าจบ)
14. **Source.Name:** ถ้าใช้ทางลัด Combine Files Excel จะสร้างคอลัมน์ `Source.Name` ให้ — ในโค้ดของคู่มือนี้ใช้ชื่อ `Source_File` และเติมผ่าน `Table.AddColumn(..., "Source_File", ...)` ก่อนรวมไฟล์
15. **Refresh Timestamp:** ตรวจว่าคอลัมน์ `Refresh_Timestamp` มีค่าเดียวกันทุกแถว (ประกาศ `RefreshTs = DateTime.LocalNow()` ครั้งเดียว) · Add Column → Custom Column ด้วย `DateTime.LocalNow()` โดยตรงก็ได้ แต่ควรอ้างค่าคงที่ตัวเดียวเพื่อไม่ให้ต่างกันระหว่างแถว
16. **ตั้งค่าโหลด:** Home → Close & Load → **Close & Load To...** · `Farm_Daily_Staging` และ Parameter → **Only Create Connection** · `Farm_Daily`, `Error_Rows`, `File_Schema_Check` → **Table** ในชีตใหม่ ตั้งชื่อ Excel Table ให้ตรงชื่อ Query (Table Design → Table Name)
17. **ตั้ง Privacy:** File → Options and settings → Query Options → Privacy → ตั้งระดับ Privacy ของแหล่งข้อมูลให้ถูก (เช่น Organizational) ไม่แนะนำ "Ignore the Privacy Levels" กับข้อมูลจริง
18. **ตั้ง Refresh:** Data → Queries & Connections → คลิกขวา `Farm_Daily` → Properties → เลือก **Refresh data when opening the file** ตามต้องการ · ทดสอบโดย Data → **Refresh All** แล้วตรวจ Refresh_Timestamp เปลี่ยน
19. **บันทึกและทดสอบ:** บันทึกเป็น `.xlsx` (ไม่ต้องใช้ macro) แล้วทำ Test Cases ทั้งหมดในหัวข้อ tests พร้อมจดผลจริง (ห้ามกรอกผลโดยไม่ได้ทดสอบ)

## M Code

### Parameter

```powerquery
// ===== Parameter: FolderPath =====
// สร้างผ่าน Home → Manage Parameters → New (Type = Text) หรือวางใน Advanced Editor ของ Blank Query
"C:\FarmData\Daily" meta [IsParameterQuery = true, Type = "Text", IsParameterQueryRequired = true]

// ===== Parameter: SheetName =====
"Data" meta [IsParameterQuery = true, Type = "Text", IsParameterQueryRequired = true]

// ===== ทางเลือก: โฟลเดอร์บน SharePoint / OneDrive for Business =====
// แทนขั้น Source ใน Farm_Daily_Staging และ File_Schema_Check ด้วย 2 บรรทัดนี้
// SiteUrl เป็น Parameter อีกตัว เช่น "https://<tenant>.sharepoint.com/sites/<site>"
// FolderPath ต้องเป็น URL เต็มของโฟลเดอร์ที่ลงท้ายด้วย "/" ตรงกับค่าในคอลัมน์ [Folder Path]
//    Source = SharePoint.Files(SiteUrl, [ApiVersion = 15]),
//    InFolder = Table.SelectRows(Source, each [Folder Path] = FolderPath),
// แล้วให้ขั้น XlsxOnly อ้าง InFolder แทน Source
// (การเข้าสู่ระบบเลือก Organizational account — ตรวจกับบัญชีจริงก่อนสอน)
```

### Query หลัก

```powerquery
// ===== Query 1: Farm_Daily_Staging (Close & Load To... → Only Create Connection) =====
// รวมไฟล์ทุกไฟล์ในโฟลเดอร์ → ตรวจ Schema รายไฟล์ → รวมเฉพาะไฟล์ที่ผ่าน → แปลงชนิด → ติดรหัสปัญหา Rule_Issue
// ต้องมี Parameter: FolderPath (text) และ SheetName (text) — ดู mcode.sample
let
    // ---------- 1) ค่าที่แก้ได้ ----------
    ExpectedColumns = {"Farm_ID", "Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"},
    ValidFarmIds    = {"F001", "F002", "F003", "F004"},
    MaxAgeDays      = 70,                       // เกณฑ์ตัวอย่าง ปรับตามรอบการเลี้ยงจริง
    RefreshTs       = DateTime.LocalNow(),      // ประกาศครั้งเดียว ทุกแถวได้เวลาเดียวกัน

    // ---------- 2) รายการไฟล์ ----------
    Source   = Folder.Files(FolderPath),
    XlsxOnly = Table.SelectRows(Source, each Text.Lower([Extension]) = ".xlsx" and not Text.StartsWith([Name], "~$")),
    FileCols = Table.SelectColumns(XlsxOnly, {"Name", "Content"}),

    // ---------- 3) ดึงชีตข้อมูลจากแต่ละไฟล์ (อ่านไม่ได้/ไม่พบชีต = null) ----------
    WithData = Table.AddColumn(FileCols, "Data", each
        let
            wb   = try Excel.Workbook([Content], true) otherwise null,
            pick = if wb = null then null
                   else Table.SelectRows(wb, (r) => r[Kind] = "Sheet" and r[Item] = SheetName)
        in
            if pick = null or Table.IsEmpty(pick) then null
            else Table.TransformColumnNames(pick{0}[Data], Text.Trim)),   // ตัดช่องว่างในชื่อหัวคอลัมน์

    // ---------- 4) ตรวจ Schema รายไฟล์ (รายงานละเอียดอยู่ใน File_Schema_Check) ----------
    WithMissing = Table.AddColumn(WithData, "Missing_Columns", each
        if [Data] = null then "SHEET_NOT_FOUND"
        else Text.Combine(List.Difference(ExpectedColumns, Table.ColumnNames([Data])), ", "), type text),
    SchemaOk = Table.SelectRows(WithMissing, each [Missing_Columns] = ""),

    // ---------- 5) เลือกคอลัมน์ตาม Schema + เลขแถวต้นทาง + ชื่อไฟล์ ----------
    Tagged = Table.AddColumn(SchemaOk, "Tagged", (f) =>
        let
            t1 = Table.SelectColumns(f[Data], ExpectedColumns),
            t2 = Table.AddIndexColumn(t1, "Source_Row", 2, 1, Int64.Type),          // แถว 1 = หัวตาราง
            t3 = Table.SelectRows(t2, (r) =>                                          // ตัดแถวว่างทั้งแถว
                     List.NonNullCount(List.Transform(Record.FieldValues(Record.SelectFields(r, ExpectedColumns)),
                         (v) => if v = "" then null else v)) > 0),
            t4 = Table.AddColumn(t3, "Source_File", (r) => f[Name], type text)       // = Source.Name
        in
            t4),
    Combined = if Table.IsEmpty(Tagged)
               then #table(ExpectedColumns & {"Source_Row", "Source_File"}, {})
               else Table.Combine(Tagged[Tagged]),

    // ---------- 6) ทำความสะอาดข้อความ + เก็บค่าดิบไว้ตรวจย้อนหลัง ----------
    Cleaned = Table.TransformColumns(Combined,
        {{"Farm_ID", each if _ = null then null else Text.Upper(Text.Trim(Text.From(_))), type nullable text}}),
    WithRaw = Table.AddColumn(Cleaned, "Raw_Values", each
        Text.Combine(List.Transform(Record.FieldValues(Record.SelectFields(_, ExpectedColumns)),
            (v) => if v = null then "" else Text.From(v)), " | "), type text),

    // ---------- 7) แปลงชนิดข้อมูล (culture en-US: ข้อความวันที่ควรเป็น yyyy-mm-dd) ----------
    // ค่าที่แปลงไม่ได้จะกลายเป็น Error ในเซลล์ (ไม่ทำให้ทั้ง Query ล้ม) แล้วถูกจับในขั้นถัดไป
    Typed = Table.TransformColumnTypes(WithRaw, {
        {"Date", type date},
        {"Age_Days", Int64.Type},
        {"Body_Weight_g", type number},
        {"Feed_Intake_kg", type number},       // สะสมตั้งแต่ลงเลี้ยง (kg ทั้งฝูง)
        {"Mortality_Count", Int64.Type},       // สะสมตั้งแต่ลงเลี้ยง (ตัว)
        {"Birds_Placed", Int64.Type}}, "en-US"),

    // ---------- 8) กฎคุณภาพข้อมูลรายแถว: null = ผ่าน ----------
    WithIssue = Table.AddColumn(Typed, "Rule_Issue", each
        let
            r = try (
                if [Farm_ID] = null or not List.Contains(ValidFarmIds, [Farm_ID]) then "FARM_ID_INVALID"
                else if [Date] = null then "DATE_MISSING"
                else if Date.Year([Date]) > 2400 then "DATE_BUDDHIST_YEAR"
                else if [Date] > Date.From(RefreshTs) then "DATE_IN_FUTURE"
                else if [Age_Days] = null or [Age_Days] < 0 or [Age_Days] > MaxAgeDays then "AGE_OUT_OF_RANGE"
                else if [Body_Weight_g] = null or [Body_Weight_g] <= 0 then "BODY_WEIGHT_INVALID"
                else if [Feed_Intake_kg] = null or [Feed_Intake_kg] < 0 then "FEED_INVALID"
                else if [Mortality_Count] = null or [Mortality_Count] < 0 then "MORTALITY_INVALID"
                else if [Birds_Placed] = null or [Birds_Placed] <= 0 then "BIRDS_PLACED_INVALID"
                else if [Mortality_Count] > [Birds_Placed] then "MORTALITY_GT_PLACED"
                else null)
        in
            if r[HasError] then "TYPE_ERROR" else r[Value], type nullable text),

    // ---------- 9) เวลา Refresh ----------
    WithTs = Table.AddColumn(WithIssue, "Refresh_Timestamp", each RefreshTs, type datetime)
in
    WithTs

// ===== Query 2: Farm_Daily (Close & Load To... → Table ชื่อ Farm_Daily) =====
// ตารางสะอาดสำหรับคำนวณ KPI: ผ่านกฎทุกข้อ ไม่มี Error ไม่ซ้ำ และคีย์ Farm_ID + Date ไม่ขัดแย้ง
let
    Source   = Farm_Daily_Staging,
    DataCols = {"Farm_ID", "Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"},
    Valid    = Table.SelectRows(Source, each [Rule_Issue] = null),
    NoErr    = Table.RemoveRowsWithErrors(Valid),
    // เรียงก่อนแล้ว Buffer เพื่อให้ Table.Distinct เก็บแถวแรกตามลำดับไฟล์อย่างคงที่
    Sorted   = Table.Buffer(Table.Sort(NoErr, {{"Source_File", Order.Ascending}, {"Source_Row", Order.Ascending}})),
    // แถวซ้ำ = ค่าเหมือนกันทุกคอลัมน์ข้อมูล (แม้มาจากคนละไฟล์) → เก็บแถวแรก
    Dedup    = Table.Distinct(Sorted, DataCols),
    // คีย์ซ้ำแต่ค่าต่างกัน = KEY_CONFLICT → ไม่เข้าตารางหลัก (ไปอยู่ Error_Rows ให้คนตัดสิน)
    Counts   = Table.Group(Dedup, {"Farm_ID", "Date"}, {{"Key_Count", each Table.RowCount(_), Int64.Type}}),
    Joined   = Table.NestedJoin(Dedup, {"Farm_ID", "Date"}, Counts, {"Farm_ID", "Date"}, "K", JoinKind.LeftOuter),
    Expanded = Table.ExpandTableColumn(Joined, "K", {"Key_Count"}),
    Clean    = Table.SelectRows(Expanded, each [Key_Count] = 1),
    Final    = Table.SelectColumns(Clean, DataCols & {"Source_File", "Source_Row", "Refresh_Timestamp"})
in
    Final
```

### ตรวจ Schema

```powerquery
// ===== Query: File_Schema_Check (Close & Load To... → Table ชื่อ File_Schema_Check) =====
// ตรวจทุกไฟล์ในโฟลเดอร์ว่ามีชีตและคอลัมน์ครบตาม Schema หรือไม่ (1 แถวต่อไฟล์)
// StrictSchema = true → หยุด Refresh ทั้งหมดด้วย Error ที่อ่านเข้าใจได้ (ใช้ตอนต้องการบังคับให้แก้ก่อน)
// StrictSchema = false → แค่ติดสถานะ (ค่าเริ่มต้น) แล้ว Error_Rows จะรายงานไฟล์ที่ไม่ผ่าน
let
    ExpectedColumns = {"Farm_ID", "Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"},
    StrictSchema    = false,
    CheckedAt       = DateTime.LocalNow(),

    Source   = Folder.Files(FolderPath),
    XlsxOnly = Table.SelectRows(Source, each Text.Lower([Extension]) = ".xlsx" and not Text.StartsWith([Name], "~$")),

    Checked = Table.AddColumn(XlsxOnly, "Result", each
        let
            wb      = try Excel.Workbook([Content], true),
            sheets  = if wb[HasError] then null
                      else Table.SelectRows(wb[Value], (r) => r[Kind] = "Sheet" and r[Item] = SheetName),
            data    = if sheets = null or Table.IsEmpty(sheets) then null
                      else Table.TransformColumnNames(sheets{0}[Data], Text.Trim),
            cols    = if data = null then {} else Table.ColumnNames(data),
            missing = List.Difference(ExpectedColumns, cols),
            extra   = List.Difference(cols, ExpectedColumns),
            rows    = if data = null then 0 else Table.RowCount(data),
            status  = if wb[HasError] then "UNREADABLE"
                      else if data = null then "SHEET_NOT_FOUND"
                      else if not List.IsEmpty(missing) then "MISSING_COLUMNS"
                      else if rows = 0 then "EMPTY_FILE"
                      else "PASS",
            detail  = if status = "UNREADABLE" then "เปิดไฟล์ไม่ได้: " & wb[Error][Message]
                      else if status = "SHEET_NOT_FOUND" then "ไม่พบชีตชื่อ " & SheetName
                      else if status = "MISSING_COLUMNS" then "ขาดคอลัมน์: " & Text.Combine(missing, ", ")
                      else if status = "EMPTY_FILE" then "มีหัวตารางแต่ไม่มีข้อมูล"
                      else "ครบตาม Schema"
        in
            [Schema_Status = status, Missing_Columns = Text.Combine(missing, ", "),
             Extra_Columns = Text.Combine(extra, ", "), Data_Rows = rows, Detail = detail]),

    Expanded = Table.ExpandRecordColumn(Checked, "Result",
                   {"Schema_Status", "Missing_Columns", "Extra_Columns", "Data_Rows", "Detail"}),
    Selected = Table.SelectColumns(Expanded,
                   {"Name", "Date modified", "Schema_Status", "Missing_Columns", "Extra_Columns", "Data_Rows", "Detail"}),
    Renamed  = Table.RenameColumns(Selected, {{"Name", "Source_File"}, {"Date modified", "File_Modified"}}),
    WithTs   = Table.AddColumn(Renamed, "Checked_At", each CheckedAt, type datetime),
    Typed    = Table.TransformColumnTypes(WithTs, {
                   {"Source_File", type text}, {"File_Modified", type datetime}, {"Schema_Status", type text},
                   {"Missing_Columns", type text}, {"Extra_Columns", type text}, {"Data_Rows", Int64.Type}, {"Detail", type text}}),

    // ---------- Gate: หยุดเมื่อ StrictSchema = true และมีไฟล์ผิดโครงสร้าง ----------
    Failed = Table.SelectRows(Typed, each [Schema_Status] <> "PASS" and [Schema_Status] <> "EMPTY_FILE"),
    Gate   = if StrictSchema and not Table.IsEmpty(Failed)
             then error Error.Record("SchemaError",
                      "พบไฟล์ผิด Schema " & Text.From(Table.RowCount(Failed)) & " ไฟล์",
                      Text.Combine(Failed[Source_File], ", "))
             else Typed
in
    Gate
```

### Error_Rows

```powerquery
// ===== Query: Error_Rows (Close & Load To... → Table ชื่อ Error_Rows) =====
// รวม 3 แหล่งปัญหา: (A) แถวผิดกฎ/แปลงชนิดไม่ได้ (B) คีย์ Farm_ID + Date ขัดแย้ง (C) ไฟล์ไม่ผ่าน Schema
// ต้องมี Query: Farm_Daily_Staging และ File_Schema_Check
let
    Stg       = Farm_Daily_Staging,
    DataCols  = {"Farm_ID", "Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"},
    TypedCols = {"Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"},
    OutCols   = {"Source_File", "Source_Row", "Farm_ID", "Date", "Raw_Values", "Error_Code", "Error_Detail", "Refresh_Timestamp"},

    // ---------- (A) แถวที่ไม่ผ่านกฎหรือแปลงชนิดไม่ได้ ----------
    RuleFail   = Table.SelectRows(Stg, each [Rule_Issue] <> null),
    WithDetail = Table.AddColumn(RuleFail, "Error_Detail", each
        Text.Combine(List.Transform(TypedCols, (c) =>
            let t = try Record.Field(_, c)
            in if t[HasError] then c & ": " & t[Error][Message] else null), "; "), type text),
    RuleRen    = Table.RenameColumns(WithDetail, {{"Rule_Issue", "Error_Code"}}),
    RuleSel    = Table.SelectColumns(RuleRen, OutCols),
    RuleRows   = Table.ReplaceErrorValues(RuleSel, {{"Date", null}}),   // ค่าดิบยังอยู่ใน Raw_Values

    // ---------- (B) คีย์ซ้ำแต่ค่าต่างกัน ----------
    Valid     = Table.RemoveRowsWithErrors(Table.SelectRows(Stg, each [Rule_Issue] = null)),
    Sorted    = Table.Buffer(Table.Sort(Valid, {{"Source_File", Order.Ascending}, {"Source_Row", Order.Ascending}})),
    Dedup     = Table.Distinct(Sorted, DataCols),
    Grouped   = Table.Group(Dedup, {"Farm_ID", "Date"},
                    {{"Rows", each _, type table}, {"Key_Count", each Table.RowCount(_), Int64.Type}}),
    Conflicts = Table.SelectRows(Grouped, each [Key_Count] > 1),
    ConfRows  = if Table.IsEmpty(Conflicts) then #table(Table.ColumnNames(Dedup), {}) else Table.Combine(Conflicts[Rows]),
    ConfCode  = Table.AddColumn(ConfRows, "Error_Code", each "KEY_CONFLICT", type text),
    ConfOut   = Table.AddColumn(ConfCode, "Error_Detail",
                    each "Farm_ID + Date ซ้ำแต่ค่าต่างกัน ให้ผู้รับผิดชอบยืนยันค่าที่ถูกที่ไฟล์ต้นทาง", type text),

    // ---------- (C) ไฟล์ที่ไม่ผ่าน Schema (1 แถวต่อไฟล์) ----------
    SchemaFail = Table.SelectRows(File_Schema_Check, each [Schema_Status] <> "PASS"),
    SchemaOut  = Table.FromRecords(List.Transform(Table.ToRecords(SchemaFail), (r) => [
                     Source_File = r[Source_File], Source_Row = null, Farm_ID = null, Date = null,
                     Raw_Values = null, Error_Code = "SCHEMA_" & r[Schema_Status],
                     Error_Detail = r[Detail], Refresh_Timestamp = r[Checked_At]])),

    // ---------- รวมและกำหนดชนิด ----------
    All = Table.Combine({
              RuleRows,
              Table.SelectColumns(ConfOut, OutCols, MissingField.UseNull),
              Table.SelectColumns(SchemaOut, OutCols, MissingField.UseNull)}),
    Typed = Table.TransformColumnTypes(All, {
              {"Source_File", type text}, {"Source_Row", Int64.Type}, {"Farm_ID", type text},
              {"Date", type date}, {"Raw_Values", type text}, {"Error_Code", type text},
              {"Error_Detail", type text}, {"Refresh_Timestamp", type datetime}}),
    Sorted2 = Table.Sort(Typed, {{"Source_File", Order.Ascending}, {"Source_Row", Order.Ascending}})
in
    Sorted2
```

## Refresh

- **Excel desktop (Windows/Mac):** Refresh เกิดเมื่อกด Data → Refresh / Refresh All หรือ Ctrl+Alt+F5 · ตั้งเพิ่มได้ใน Query Properties: "Refresh data when opening the file" และ "Refresh every N minutes" (ทำงานเฉพาะตอนที่ไฟล์เปิดอยู่บนเครื่องนั้น) — **ไม่มีการ Refresh เมื่อไฟล์ปิดอยู่**
- **Excel for the web:** Refresh Power Query ได้กับแหล่งข้อมูลบางประเภทเท่านั้น และสร้าง/แก้ Query บนเว็บได้จำกัด แหล่งแบบ `Folder.Files` บนเครื่อง (C:\...) ใช้บนเว็บไม่ได้ ส่วน SharePoint/OneDrive ขึ้นกับการรองรับและสิทธิ์ของ tenant (ตรวจกับบัญชีจริงก่อนสอน)
- **Power Automate / Office Scripts:** ไม่มี Action มาตรฐานที่สั่ง "Refresh Power Query ในไฟล์ Excel" โดยตรง และเอกสารของ Office Scripts ระบุข้อจำกัดเรื่อง Refresh ข้อมูลเมื่อรันผ่าน Power Automate (ตรวจกับบัญชีจริงก่อนสอน) — ถ้าต้องการอัตโนมัติจริงให้ใช้แนวทางในคู่มือ Power Automate (ประมวลผลด้วย Office Scripts แทน) หรือย้ายไป Power BI dataflow/semantic model ที่ตั้ง Scheduled refresh ได้
- **สิ่งที่ไม่อัตโนมัติ:** การวางไฟล์ใหม่ในโฟลเดอร์ไม่ทำให้ตาราง Farm_Daily อัปเดต · การแก้ไฟล์ต้นทางที่เปิดค้าง (ยังไม่บันทึก) จะไม่ถูกอ่าน · ตารางสูตร/PivotTable ที่อ้าง Farm_Daily ต้อง Refresh ตาม (Refresh All ครอบคลุม PivotTable ด้วย)
- **Privacy Levels:** เมื่อ Query รวมหลายแหล่ง (เช่น โฟลเดอร์ + ตาราง Master ในไฟล์) Power Query อาจเตือน Formula.Firewall ให้ตั้งระดับ Privacy ให้ถูก (Organizational สำหรับข้อมูลภายใน) การเลือก Ignore ทำให้ข้อมูลอาจถูกส่งข้ามแหล่งโดยไม่ตั้งใจ
- **Credentials:** Data → Get Data → Data Source Settings → เลือกแหล่ง → Edit Permissions → Credentials · โฟลเดอร์ในเครื่องใช้สิทธิ์ Windows ของผู้ใช้ · SharePoint ใช้ Organizational account · ผู้ใช้แต่ละคนที่ Refresh ต้องมีสิทธิ์ของตัวเอง ไฟล์ที่ส่งต่อให้คนอื่นจะไม่พาสิทธิ์ติดไปด้วย
- **พิสูจน์ว่า Refresh ทำงาน:** ดู `Refresh_Timestamp` และ `Checked_At` เปลี่ยน, จำนวนแถวใน `File_Schema_Check` เท่ากับจำนวนไฟล์ในโฟลเดอร์, และกระทบยอดจำนวนแถว (Test Case "Row count reconciliation")
- **Background refresh:** ใน Connection Properties ปิด "Enable background refresh" ถ้าต้องการให้สูตรที่อ้างตารางคำนวณหลัง Refresh เสร็จแน่นอน

## Test Cases

| กรณีทดสอบ | การตั้งค่า / ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| TC-PQ-01 ไฟล์ใหม่ที่ถูกต้อง | โฟลเดอร์มี 2 ไฟล์ถูกต้อง (F001, F002 ไฟล์ละ 2 แถว) แล้วเพิ่มไฟล์ที่ 3 (F003 2 แถว) · Refresh All ก่อนเพิ่มไฟล์ จดจำนวนแถว Farm_Daily · คัดลอกไฟล์ที่ 3 เข้าโฟลเดอร์ · Refresh All อีกครั้ง | Farm_Daily เพิ่ม 2 แถว · Source_File ของแถวใหม่ = ชื่อไฟล์ที่ 3 · File_Schema_Check มี 3 แถว PASS ทั้งหมด · Error_Rows ไม่เพิ่ม |
| TC-PQ-02 ไฟล์ผิด Schema | ไฟล์ทดสอบที่เปลี่ยนชื่อคอลัมน์ `Body_Weight_g` เป็น `BodyWeight` · ใส่ไฟล์ในโฟลเดอร์ · Refresh All (StrictSchema = false) · ตั้ง StrictSchema = true แล้ว Refresh อีกครั้ง | ครั้งแรก: File_Schema_Check แสดง `MISSING_COLUMNS` + "ขาดคอลัมน์: Body_Weight_g" และ Extra_Columns = BodyWeight · แถวของไฟล์นี้ไม่เข้า Farm_Daily · Error_Rows มี `SCHEMA_MISSING_COLUMNS` 1 แถว · ครั้งที่สอง: Refresh ล้มด้วยข้อความ "พบไฟล์ผิด Schema 1 ไฟล์" |
| TC-PQ-03 แถวซ้ำ | ไฟล์ A มีแถว F001/2026-10-01 · ไฟล์ B มีแถวเดียวกันทุกค่า และอีกแถว F001/2026-10-01 ที่ Body_Weight_g ต่างกัน · Refresh All · นับแถว F001/2026-10-01 ใน Farm_Daily และ Error_Rows | ถ้ามีแค่แถวที่เหมือนกันทุกค่า: Farm_Daily เหลือ 1 แถว (Source_File = ไฟล์ที่เรียงก่อน) · เมื่อมีแถวค่าต่างกันด้วย: คีย์นี้ไม่อยู่ใน Farm_Daily และ Error_Rows มี `KEY_CONFLICT` 2 แถว |
| TC-PQ-04 ข้อความในคอลัมน์ตัวเลข | แถวหนึ่งมี Feed_Intake_kg = "N/A" และอีกแถวมี Body_Weight_g = "-5" · Refresh All · เปิด Error_Rows | แถว "N/A" ได้ Error_Code `TYPE_ERROR` และ Error_Detail ขึ้นต้นด้วย "Feed_Intake_kg:" · แถว -5 ได้ `BODY_WEIGHT_INVALID` · Raw_Values แสดงค่าดิบ · Query ไม่ล้ม |
| TC-PQ-05 ไฟล์ว่าง | (ก) ไฟล์มีหัวตารางครบแต่ไม่มีข้อมูล (ข) ไฟล์ไม่มีชีต Data (ค) ไฟล์ .xlsx ที่เสีย (เปลี่ยนนามสกุลจาก .txt) · ใส่ทั้ง 3 ไฟล์ · Refresh All | (ก) `EMPTY_FILE` ไม่เพิ่มแถวใน Farm_Daily (ข) `SHEET_NOT_FOUND` (ค) `UNREADABLE` · ทั้ง 3 ไฟล์ปรากฏใน Error_Rows ขึ้นต้น `SCHEMA_` และ Query ไม่ล้ม |
| TC-PQ-06 วันที่เป็นข้อความ | แถวที่ Date เป็นข้อความ "2026-10-08", "08/10/2026" และ "2569-10-08" · Refresh All · ตรวจคอลัมน์ Date ใน Farm_Daily และ Error_Rows | "2026-10-08" แปลงเป็นวันที่ 8 ต.ค. 2026 · "08/10/2026" ด้วย culture en-US จะถูกตีความเป็น 10 ส.ค. 2026 (ไม่ Error แต่ผิดความหมาย) → บันทึกเป็นความเสี่ยงและกำหนดให้ต้นทางใช้ yyyy-mm-dd · "2569-10-08" ได้ `DATE_BUDDHIST_YEAR` |
| TC-PQ-07 Refresh Timestamp เปลี่ยน | ไฟล์ที่ Refresh แล้ว 1 ครั้ง · จด Refresh_Timestamp ของ Farm_Daily · รอ 1 นาที กด Refresh All · เปรียบเทียบ | Refresh_Timestamp ใหม่ > ค่าเดิม · ทุกแถวมีค่าเดียวกัน · Checked_At ใน File_Schema_Check เปลี่ยนด้วย |
| TC-PQ-08 กระทบยอดจำนวนแถว | ชุดทดสอบรวมที่รู้คำตอบ: 4 ไฟล์ (F001–F004) รวม 16 แถวข้อมูล มี 1 แถวซ้ำทุกค่า, 1 คู่คีย์ขัดแย้ง (2 แถว), 1 แถว TYPE_ERROR · Refresh All · คำนวณ: แถวใน Staging = Farm_Daily + แถวที่ Error (A) + แถวที่ Error (B) + แถวซ้ำที่ถูกตัด | Staging 16 = Farm_Daily 12 + Rule/Type error 1 + KEY_CONFLICT 2 + ซ้ำที่ตัด 1 · ผลรวม Data_Rows ใน File_Schema_Check (ไฟล์ที่ PASS) ≥ แถวใน Staging (ต่าง = แถวว่างที่ตัดทิ้ง) |
| TC-PQ-09 Farm_ID นอกรายการ/ตัวพิมพ์ | แถวที่ Farm_ID = " f002 " และ "F009" · Refresh All | " f002 " ถูกทำความสะอาดเป็น F002 และผ่าน · "F009" ได้ `FARM_ID_INVALID` |
| TC-PQ-10 ไฟล์ชั่วคราวและไฟล์ชนิดอื่น | เปิดไฟล์ต้นทางค้างไว้ (เกิด ~$...xlsx) และวางไฟล์ .csv ในโฟลเดอร์ · Refresh All | File_Schema_Check ไม่แสดง ~$ และ .csv · จำนวนแถว Farm_Daily ไม่เปลี่ยน |

## Troubleshooting

- Refresh ล้มทั้ง Query ด้วย "The column 'X' of the table wasn't found": มักเกิดจากขั้น Changed Type ที่ UI สร้างอัตโนมัติอ้างชื่อคอลัมน์ตายตัว หรือใช้ Combine Files แบบอัตโนมัติ · ลบขั้น Changed Type ที่ไม่ต้องการ และใช้ `Table.SelectColumns(..., MissingField.UseNull)` หรือโครงในคู่มือนี้ที่กรองไฟล์ผิด Schema ออกก่อนรวม
- Formula.Firewall: Query references other queries or steps...: ตั้ง Privacy Level ของทุกแหล่งให้ถูก (File → Options → Query Options → Privacy) หรือแยกการอ่านแหล่งข้อมูลแต่ละแหล่งเป็น Query ของตัวเองแล้วอ้างอิงกัน · หลีกเลี่ยงการเลือก Ignore Privacy Levels กับข้อมูลจริง
- วันที่สลับวัน/เดือน หรือกลายเป็นปี 2569: กำหนด culture ใน `Table.TransformColumnTypes(..., "en-US")` และให้ต้นทางกรอก yyyy-mm-dd · ถ้าต้นทางเป็น dd/mm/yyyy ให้เปลี่ยน culture เป็น "en-GB" · ปี พ.ศ. ถูกจับด้วย `DATE_BUDDHIST_YEAR` แล้วแก้ที่ต้นทาง
- Mortality_Count ที่เป็นทศนิยมถูกปัดโดยไม่รู้ตัว: การแปลงเป็น Int64.Type (Whole Number) ปัดทศนิยม · ถ้าต้องจับค่าทศนิยม ให้แปลงเป็น number ก่อนแล้วเพิ่มกฎ `Number.Round([Mortality_Count]) <> [Mortality_Count]` เป็น `NOT_INTEGER`
- Table.Distinct เก็บแถวไม่ตรงกับที่คาด: เรียงข้อมูลก่อนแล้วครอบด้วย `Table.Buffer` (ตามโค้ด) เพื่อให้ลำดับคงที่ · ระบุคอลัมน์ที่ใช้เทียบเป็นอาร์กิวเมนต์ที่สองเสมอ ไม่รวม Source_File/Refresh_Timestamp
- Refresh ช้ามากเมื่อไฟล์เยอะ: ย้ายไฟล์เก่าไปโฟลเดอร์ Archive แล้วรวมเป็นไฟล์สรุปรายเดือน · กรองไฟล์ด้วย [Date modified] หรือชื่อไฟล์ก่อนเรียก Excel.Workbook · ใช้ SharePoint.Files แทน SharePoint.Contents เฉพาะเมื่อจำเป็น และวัดเวลาจริงก่อนสรุปว่าเร็วขึ้น
- Feed_Intake_kg ลดลงจากสัปดาห์ก่อน: ตามนิยามค่าสะสมต้องไม่ลดลง · ตรวจว่าต้นทางเปลี่ยนเป็นค่ารายวันหรือกรอกผิด (Office Script ข้อ 1 รายงาน `CUM_DECREASED`) · ห้ามนำแถวนั้นไปคำนวณ FCR จนกว่าผู้รับผิดชอบยืนยัน
- Excel for the web แจ้งว่า Refresh ไม่ได้: ตรวจว่าแหล่งข้อมูลไม่ใช่โฟลเดอร์ในเครื่อง และ tenant รองรับการ Refresh แหล่งนั้นบนเว็บ (ตรวจกับบัญชีจริงก่อนสอน) · ถ้าไม่รองรับ ให้ Refresh บน Excel desktop หรือใช้แนวทาง Office Scripts + Power Automate
- DataFormat.Error: External table is not in the expected format: ไฟล์เสียหรือไม่ใช่ .xlsx จริง · โค้ดในคู่มือจับด้วย `try Excel.Workbook(...)` และรายงาน `UNREADABLE` — ให้ผู้รับผิดชอบส่งไฟล์ใหม่
