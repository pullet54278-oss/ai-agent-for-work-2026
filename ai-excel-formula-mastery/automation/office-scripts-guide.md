# Office Scripts: ตรวจคุณภาพข้อมูล สรุป KPI และ Export สำหรับ Dashboard

> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้ · ตรวจสิทธิ์/License กับบัญชีจริงก่อนสอน

Office Scripts คือสคริปต์ TypeScript ที่สั่งงานสมุดงาน Excel ผ่าน API `ExcelScript` รันได้จากแท็บ **Automate** ใน Excel for the web (และ Excel desktop รุ่นใหม่บางช่องทาง — ตรวจกับบัญชีจริงก่อนสอน) และรันจาก Power Automate ด้วย Action **Run script** ของ Excel Online (Business)

ชุดสคริปต์นี้มี 4 ตัวที่ใช้ร่วมกับ Flow ในคู่มือ Power Automate: (1) `Validate_Farm_Data` ตรวจ Schema/คุณภาพข้อมูล (2) `Farm_KPI_Summary` คำนวณ FCR, Mortality %, น้ำหนักเฉลี่ย และ Flag ตามตาราง Rules (3) `Export_Dashboard_Json` ส่งออก JSON และเขียน Execution Log พร้อม Run ID (4) `Append_Validated_Rows` นำแถวที่ผ่านการตรวจเข้าตารางหลักแบบไม่ซ้ำ

ทุกสคริปต์เป็น **แม่แบบที่ยังไม่ได้รันกับไฟล์จริง** ต้องปรับชื่อตาราง/คอลัมน์ และทดสอบตามหัวข้อ tests ก่อนใช้งาน · AI ช่วยเขียนและอธิบายโค้ดได้ แต่การรันต้องทำในบัญชีที่มีสิทธิ์

**นิยาม KPI ที่ใช้ (ต้องยืนยันกับมาตรฐานองค์กรก่อนใช้จริง):** Feed_Intake_kg และ Mortality_Count เป็นค่าสะสมตั้งแต่ลงเลี้ยง · FCR สะสม = Feed_Intake_kg ÷ น้ำหนักที่ใช้คำนวณ (kg) โดยน้ำหนักที่ใช้คำนวณ = (Body_Weight_g − chickWeightG) ÷ 1000 × จำนวนตัวมีชีวิต · chickWeightG = 0 คือ FCR ต่อน้ำหนักมีชีวิต, > 0 คือ FCR ต่อน้ำหนักที่เพิ่ม · จำนวนตัวมีชีวิต = Birds_Placed − Mortality_Count · Mortality % = Mortality_Count ÷ Birds_Placed × 100

## เงื่อนไข

- บัญชีงาน/โรงเรียน (Microsoft Entra ID) ใน Microsoft 365 แผนที่รวม Office Scripts — โดยทั่วไปเป็นแผน Business/Enterprise ที่มีแอป Office บนเว็บ บัญชีส่วนตัว (Microsoft account) ใช้ไม่ได้ (ตรวจกับบัญชีจริงก่อนสอน)
- ผู้ดูแลระบบ Microsoft 365 ต้องเปิด Office Scripts ใน Microsoft 365 admin center → Settings → Org settings → Office Scripts (มีตัวเลือกให้ผู้ใช้ใช้สคริปต์ แชร์สคริปต์ และใช้กับ Power Automate แยกกัน) — ชื่อเมนูอาจเปลี่ยน (ตรวจกับบัญชีจริงก่อนสอน)
- ไฟล์ต้องอยู่บน OneDrive for Business หรือ SharePoint และเปิดด้วย Excel for the web เพื่อสร้าง/แก้สคริปต์ผ่าน Automate → New Script (Code Editor)
- สคริปต์ถูกเก็บเป็นไฟล์ `.osts` ใน OneDrive ของผู้สร้าง (โฟลเดอร์ Documents/Office Scripts) หรือแชร์ผูกกับสมุดงาน · ถ้าต้องการให้ Flow ของทีมใช้ ให้พิจารณา Action "Run script from SharePoint library" (ตรวจกับบัญชีจริงก่อนสอน)
- การรันจาก Power Automate ต้องมีสิทธิ์ใช้ Power Automate และ Connector Excel Online (Business) ไม่ถูกบล็อกโดย DLP policy
- ผู้รัน (หรือบัญชีที่ใช้ Connection ใน Flow) ต้องมีสิทธิ์แก้ไขไฟล์ที่สคริปต์เขียนข้อมูล
- สร้างตารางล่วงหน้าตามชื่อในสคริปต์: `Farm_Performance` (ไฟล์รายวัน), `Farm_Daily` (สมุดงานหลัก — ตารางปกติที่สคริปต์ 4 เติมข้อมูล ไม่ใช่ผลโหลดของ Power Query), `Rules` (เกณฑ์ Flag) — ตาราง `Execution_Log` สคริปต์ 3 สร้างให้เองถ้ายังไม่มี

## Validate_Farm_Data

ตรวจ Schema และคุณภาพข้อมูลของตาราง (คอลัมน์ขาด/เกิน, Farm_ID, วันที่, ตัวเลขเป็นข้อความ, ค่าติดลบ, คีย์ซ้ำ, ค่าสะสมลดลง) แล้วเขียนผลลงชีต `Validation` (ถ้า writeSheet = true) และส่งคืนสรุปผลเป็น JSON ให้ Power Automate ใช้ตัดสินใจ

```typescript
// Script: Validate_Farm_Data
// ตรวจ Schema + Data Quality แล้วเขียนชีต Validation (PASS / WARNING / ERROR) และส่งคืนสรุปผล
// writeSheet = false เมื่อรันกับไฟล์ต้นทางจาก Power Automate (ไม่แก้ไฟล์ต้นทาง และไม่ปลุก Trigger ซ้ำ)

type Cell = string | number | boolean;

interface Issue {
  row: number;      // เลขแถวใน Excel (0 = ระดับตาราง)
  column: string;
  level: string;    // ERROR | WARNING
  code: string;
  message: string;
}

interface ValidationSummary {
  status: string;   // PASS | WARNING | ERROR
  tableName: string;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  missingColumns: string[];
  issues: Issue[];  // ส่งคืนไม่เกิน 50 รายการแรก (รายการเต็มอยู่ในชีต Validation)
  checkedAt: string;
}

const EXPECTED_COLUMNS: string[] = ["Farm_ID", "Date", "Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"];
const VALID_FARMS: string[] = ["F001", "F002", "F003", "F004"];
const MAX_AGE_DAYS = 70;            // เกณฑ์ตัวอย่าง
const MAX_SHEET_ROWS = 5000;        // จำกัดจำนวนแถวที่เขียนลงชีต Validation

function main(workbook: ExcelScript.Workbook, tableName: string = "Farm_Performance", writeSheet: boolean = true): ValidationSummary {
  const checkedAt = new Date().toISOString();
  const issues: Issue[] = [];
  let rowCount = 0;
  let missing: string[] = [];

  const table = workbook.getTable(tableName);
  if (!table) {
    issues.push({ row: 0, column: "-", level: "ERROR", code: "TABLE_NOT_FOUND", message: "ไม่พบตารางชื่อ " + tableName });
  } else {
    const headers: string[] = table.getHeaderRowRange().getValues()[0].map((h) => String(h).trim());
    missing = EXPECTED_COLUMNS.filter((c) => headers.indexOf(c) < 0);
    for (const c of missing) {
      issues.push({ row: 0, column: c, level: "ERROR", code: "MISSING_COLUMN", message: "ไม่พบคอลัมน์ " + c });
    }
    for (const h of headers) {
      if (EXPECTED_COLUMNS.indexOf(h) < 0) {
        issues.push({ row: 0, column: h, level: "WARNING", code: "EXTRA_COLUMN", message: "คอลัมน์เกินจาก Schema (ไม่ถูกใช้คำนวณ)" });
      }
    }

    if (missing.length === 0) {
      const headerRowNumber = table.getRange().getRowIndex() + 1;   // getRowIndex() เริ่มที่ 0
      const values: Cell[][] = table.getRangeBetweenHeaderAndTotal().getValues();
      const col = (name: string): number => headers.indexOf(name);
      const seenKey: { [key: string]: number } = {};
      const lastCum: { [farm: string]: number[] } = {};             // [dateSerial, feed, mortality]
      const today = Date.now();

      for (let i = 0; i < values.length; i++) {
        const r = values[i];
        const excelRow = headerRowNumber + 1 + i;
        if (r.every((v) => v === "")) { continue; }                  // ข้ามแถวว่าง
        rowCount++;

        // Farm_ID
        const farm = String(r[col("Farm_ID")]).trim().toUpperCase();
        if (farm === "") {
          issues.push({ row: excelRow, column: "Farm_ID", level: "ERROR", code: "FARM_ID_MISSING", message: "ไม่มี Farm_ID" });
        } else if (VALID_FARMS.indexOf(farm) < 0) {
          issues.push({ row: excelRow, column: "Farm_ID", level: "ERROR", code: "FARM_ID_INVALID", message: "Farm_ID ไม่อยู่ในรายการ: " + farm });
        }

        // Date (Excel เก็บวันที่เป็น serial number)
        const d = r[col("Date")];
        let dateSerial = -1;
        if (typeof d === "number") {
          const year = new Date(serialToMs(d)).getUTCFullYear();
          if (d < 1) {
            issues.push({ row: excelRow, column: "Date", level: "ERROR", code: "DATE_INVALID", message: "วันที่ไม่ถูกต้อง" });
          } else if (year > 2400) {
            issues.push({ row: excelRow, column: "Date", level: "ERROR", code: "DATE_BUDDHIST_YEAR", message: "ปีเป็น พ.ศ. (" + year + ") ต้องเป็น ค.ศ." });
          } else if (serialToMs(d) > today) {
            issues.push({ row: excelRow, column: "Date", level: "ERROR", code: "DATE_IN_FUTURE", message: "วันที่อยู่ในอนาคต" });
          } else {
            dateSerial = Math.floor(d);
          }
        } else if (String(d).trim() === "") {
          issues.push({ row: excelRow, column: "Date", level: "ERROR", code: "DATE_MISSING", message: "ไม่มีวันที่" });
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(d).trim())) {
          issues.push({ row: excelRow, column: "Date", level: "WARNING", code: "DATE_AS_TEXT", message: "วันที่เป็นข้อความ ควรแปลงเป็นวันที่จริง: " + String(d) });
        } else {
          issues.push({ row: excelRow, column: "Date", level: "ERROR", code: "DATE_INVALID", message: "รูปแบบวันที่ไม่รองรับ: " + String(d) });
        }

        // ตัวเลข
        checkNumber(r[col("Age_Days")], "Age_Days", excelRow, 0, MAX_AGE_DAYS, true, issues);
        checkNumber(r[col("Body_Weight_g")], "Body_Weight_g", excelRow, 0.0001, Number.MAX_VALUE, false, issues);
        const feed = checkNumber(r[col("Feed_Intake_kg")], "Feed_Intake_kg", excelRow, 0, Number.MAX_VALUE, false, issues);
        const mort = checkNumber(r[col("Mortality_Count")], "Mortality_Count", excelRow, 0, Number.MAX_VALUE, true, issues);
        const placed = checkNumber(r[col("Birds_Placed")], "Birds_Placed", excelRow, 1, Number.MAX_VALUE, true, issues);
        if (mort !== null && placed !== null && mort > placed) {
          issues.push({ row: excelRow, column: "Mortality_Count", level: "ERROR", code: "MORTALITY_GT_PLACED", message: "จำนวนตายสะสมมากกว่าจำนวนที่ลงเลี้ยง" });
        }

        // คีย์ซ้ำ Farm_ID + Date
        if (farm !== "" && dateSerial >= 0) {
          const key = farm + "|" + dateSerial;
          if (seenKey[key] !== undefined) {
            issues.push({ row: excelRow, column: "Farm_ID,Date", level: "ERROR", code: "DUPLICATE_KEY", message: "ซ้ำกับแถว " + seenKey[key] });
          } else {
            seenKey[key] = excelRow;
          }
          // ค่าสะสมต้องไม่ลดลงเมื่อวันที่เพิ่ม (ตรวจเมื่อข้อมูลเรียงตามวันที่ในแต่ละฟาร์ม)
          const prev = lastCum[farm];
          if (prev && feed !== null && mort !== null && dateSerial > prev[0]) {
            if (feed < prev[1]) {
              issues.push({ row: excelRow, column: "Feed_Intake_kg", level: "WARNING", code: "CUM_DECREASED", message: "อาหารสะสมลดลงจากบันทึกก่อนหน้า ตรวจว่าเป็นค่ารายวันหรือกรอกผิด" });
            }
            if (mort < prev[2]) {
              issues.push({ row: excelRow, column: "Mortality_Count", level: "WARNING", code: "CUM_DECREASED", message: "จำนวนตายสะสมลดลงจากบันทึกก่อนหน้า" });
            }
          }
          if (feed !== null && mort !== null && (!prev || dateSerial > prev[0])) {
            lastCum[farm] = [dateSerial, feed, mort];
          }
        }
      }
      if (rowCount === 0) {
        issues.push({ row: 0, column: "-", level: "WARNING", code: "EMPTY_TABLE", message: "ตารางไม่มีข้อมูล" });
      }
    }
  }

  const errorCount = issues.filter((x) => x.level === "ERROR").length;
  const warningCount = issues.filter((x) => x.level === "WARNING").length;
  const summary: ValidationSummary = {
    status: errorCount > 0 ? "ERROR" : (warningCount > 0 ? "WARNING" : "PASS"),
    tableName: tableName,
    rowCount: rowCount,
    errorCount: errorCount,
    warningCount: warningCount,
    missingColumns: missing,
    issues: issues.slice(0, 50),
    checkedAt: checkedAt
  };
  if (writeSheet) {
    writeValidationSheet(workbook, summary, issues);
  }
  return summary;
}

// ตรวจค่าตัวเลข: คืนค่าตัวเลขเมื่อผ่าน หรือ null เมื่อไม่ผ่าน (และเพิ่ม Issue)
function checkNumber(v: Cell, column: string, row: number, min: number, max: number, integer: boolean, issues: Issue[]): number | null {
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") {
      issues.push({ row: row, column: column, level: "ERROR", code: "VALUE_MISSING", message: "ไม่มีค่า" });
      return null;
    }
    if (!isNaN(Number(t))) {
      issues.push({ row: row, column: column, level: "WARNING", code: "NUMBER_AS_TEXT", message: "ตัวเลขถูกเก็บเป็นข้อความ: " + t });
      return Number(t);
    }
    issues.push({ row: row, column: column, level: "ERROR", code: "NOT_A_NUMBER", message: "ไม่ใช่ตัวเลข: " + t });
    return null;
  }
  if (typeof v !== "number") {
    issues.push({ row: row, column: column, level: "ERROR", code: "NOT_A_NUMBER", message: "ไม่ใช่ตัวเลข" });
    return null;
  }
  if (v < min || v > max) {
    issues.push({ row: row, column: column, level: "ERROR", code: "OUT_OF_RANGE", message: "ค่า " + v + " อยู่นอกช่วง " + min + "–" + max });
    return null;
  }
  if (integer && Math.floor(v) !== v) {
    issues.push({ row: row, column: column, level: "ERROR", code: "NOT_INTEGER", message: "ต้องเป็นจำนวนเต็ม: " + v });
    return null;
  }
  return v;
}

function serialToMs(serial: number): number {
  return Math.round((serial - 25569) * 86400000);   // 25569 = 1970-01-01 ในระบบวันที่ของ Excel
}

function writeValidationSheet(workbook: ExcelScript.Workbook, summary: ValidationSummary, issues: Issue[]): void {
  let sheet = workbook.getWorksheet("Validation");
  if (sheet) {
    sheet.getRange().clear(ExcelScript.ClearApplyTo.all);
  } else {
    sheet = workbook.addWorksheet("Validation");
  }
  const rows: Cell[][] = [["Checked_At", "Overall_Status", "Row", "Column", "Level", "Code", "Message"]];
  if (issues.length === 0) {
    rows.push([summary.checkedAt, "PASS", "", "", "PASS", "OK", "ไม่พบปัญหา (" + summary.rowCount + " แถว)"]);
  }
  for (const x of issues.slice(0, MAX_SHEET_ROWS)) {
    rows.push([summary.checkedAt, summary.status, x.row, x.column, x.level, x.code, x.message]);
  }
  sheet.getRange("A1").getResizedRange(rows.length - 1, rows[0].length - 1).setValues(rows);
  sheet.getRange("A1:G1").getFormat().getFont().setBold(true);
  sheet.getRange("A:G").getFormat().autofitColumns();
}
```

**ผลลัพธ์:** object `ValidationSummary` → Power Automate ได้เป็น JSON ในผลลัพธ์ `result` เช่น `{ "status": "WARNING", "rowCount": 16, "errorCount": 0, "warningCount": 2, "missingColumns": [], "issues": [...], "checkedAt": "..." }`

> รันกับไฟล์ต้นทางจาก Flow ให้ส่ง `writeSheet = false` เพื่อไม่แก้ไฟล์ต้นทาง (ถ้าเขียนลงไฟล์ จะทำให้ Trigger "created or modified" ทำงานซ้ำเป็นลูป) · Error ระดับตาราง (TABLE_NOT_FOUND, MISSING_COLUMN) ใช้ row = 0 · การตรวจ CUM_DECREASED ถูกต้องเมื่อข้อมูลในแต่ละฟาร์มเรียงตามวันที่ ถ้าไม่เรียงให้เรียงก่อนหรือย้ายการตรวจไปสคริปต์ KPI · เกณฑ์ (VALID_FARMS, MAX_AGE_DAYS) เป็นค่าตัวอย่าง ควรย้ายไปอ่านจากตาราง Master ในสมุดงานเมื่อใช้งานจริง

## Farm_KPI_Summary

คำนวณ KPI ต่อฟาร์มจากตาราง `Farm_Daily` ตามนิยามที่ระบุชัด (FCR สะสม, FCR ช่วงล่าสุด, Mortality %, น้ำหนักล่าสุดและค่าเฉลี่ย) แล้ว Flag ความผิดปกติตามตาราง `Rules` เขียนผลลงชีต `KPI_Summary` และส่งคืนรายการ Anomaly

```typescript
// Script: Farm_KPI_Summary
// นิยาม (ต้องยืนยันกับมาตรฐานองค์กรก่อนใช้จริง):
//   Feed_Intake_kg, Mortality_Count = ค่าสะสมตั้งแต่ลงเลี้ยง ณ วันที่บันทึก (ทั้งฝูง)
//   Live_Birds       = Birds_Placed - Mortality_Count
//   Calc_Weight_kg   = (Body_Weight_g - chickWeightG) / 1000 * Live_Birds
//                      chickWeightG = 0  -> FCR ต่อน้ำหนักมีชีวิต
//                      chickWeightG > 0  -> FCR ต่อน้ำหนักที่เพิ่ม (หักน้ำหนักลูกไก่แรกเข้า)
//   FCR_Cum          = Feed_Intake_kg(ล่าสุด) / Calc_Weight_kg(ล่าสุด)
//   FCR_Period       = (Feed ล่าสุด - Feed ก่อนหน้า) / (Live weight ล่าสุด - Live weight ก่อนหน้า)  [kg]
//   Mortality_Pct    = Mortality_Count(ล่าสุด) / Birds_Placed * 100
//   Avg_Body_Weight_g = ค่าเฉลี่ยของทุกบันทึกในช่วง (ใช้ดูแนวโน้ม) ; Body_Weight_End_g = ค่าบันทึกล่าสุด
// ตาราง Rules: Metric | Operator | Threshold | Level | Message
//   Metric ที่รองรับ: FCR_Cum, FCR_Period, Mortality_Pct, Body_Weight_End_g, Avg_Body_Weight_g
//   Operator: > >= < <= =

type Cell = string | number | boolean;

interface FarmKpi {
  farmId: string;
  startDate: string;
  endDate: string;
  records: number;
  birdsPlaced: number;
  liveBirds: number;
  feedCumKg: number;
  bodyWeightEndG: number;
  avgBodyWeightG: number;
  fcrCum: number | null;
  fcrPeriod: number | null;
  mortalityPct: number | null;
  flags: string[];
}

interface Anomaly {
  farmId: string;
  metric: string;
  value: number | null;
  rule: string;
  level: string;
  message: string;
}

interface KpiResult {
  generatedAt: string;
  definition: string;
  farms: FarmKpi[];
  anomalies: Anomaly[];
  anomalyCount: number;
}

function main(workbook: ExcelScript.Workbook, dataTable: string = "Farm_Daily", rulesTable: string = "Rules", chickWeightG: number = 0): KpiResult {
  const generatedAt = new Date().toISOString();
  const data = workbook.getTable(dataTable);
  if (!data) {
    throw new Error("ไม่พบตาราง " + dataTable);       // ทำให้ Action Run script ล้ม → Flow ไปทาง Error
  }
  const headers: string[] = data.getHeaderRowRange().getValues()[0].map((h) => String(h).trim());
  const col = (name: string): number => {
    const i = headers.indexOf(name);
    if (i < 0) { throw new Error("ไม่พบคอลัมน์ " + name + " ในตาราง " + dataTable); }
    return i;
  };
  const cFarm = col("Farm_ID");
  const cDate = col("Date");
  const cBw = col("Body_Weight_g");
  const cFeed = col("Feed_Intake_kg");
  const cMort = col("Mortality_Count");
  const cPlaced = col("Birds_Placed");

  // จัดกลุ่มตามฟาร์ม (ข้ามแถวที่วันที่ไม่ใช่ตัวเลข — ควรถูกจับตั้งแต่ขั้น Validation)
  const byFarm: { [farm: string]: Cell[][] } = {};
  for (const r of data.getRangeBetweenHeaderAndTotal().getValues()) {
    const farm = String(r[cFarm]).trim();
    if (farm === "" || typeof r[cDate] !== "number") { continue; }
    if (!byFarm[farm]) { byFarm[farm] = []; }
    byFarm[farm].push(r);
  }

  const farms: FarmKpi[] = [];
  for (const farm of Object.keys(byFarm).sort()) {
    const list = byFarm[farm].sort((a, b) => (a[cDate] as number) - (b[cDate] as number));
    const flags: string[] = [];
    const last = list[list.length - 1];
    const placed = Number(last[cPlaced]);
    const mortEnd = Number(last[cMort]);
    const feedEnd = Number(last[cFeed]);
    const bwEnd = Number(last[cBw]);
    const live = placed - mortEnd;

    if (list.some((r) => Number(r[cPlaced]) !== placed)) { flags.push("BIRDS_PLACED_CHANGED"); }
    if (!(placed > 0) || live <= 0) { flags.push("INVALID_BIRD_COUNT"); }

    const calcWeightKg = (bwEnd - chickWeightG) / 1000 * live;
    const fcrCum = (calcWeightKg > 0 && feedEnd >= 0) ? round(feedEnd / calcWeightKg, 3) : null;
    if (fcrCum === null) { flags.push("FCR_CUM_NOT_COMPUTABLE"); }

    let fcrPeriod: number | null = null;
    if (list.length >= 2) {
      const prev = list[list.length - 2];
      const livePrev = Number(prev[cPlaced]) - Number(prev[cMort]);
      const dFeed = feedEnd - Number(prev[cFeed]);
      const dWeightKg = (bwEnd * live - Number(prev[cBw]) * livePrev) / 1000;
      if (dFeed >= 0 && dWeightKg > 0) {
        fcrPeriod = round(dFeed / dWeightKg, 3);
      } else {
        flags.push("FCR_PERIOD_NOT_COMPUTABLE");      // เช่น ค่าสะสมลดลง หรือน้ำหนักรวมไม่เพิ่ม
      }
    } else {
      flags.push("SINGLE_RECORD");
    }

    let bwSum = 0;
    for (const r of list) { bwSum += Number(r[cBw]); }

    farms.push({
      farmId: farm,
      startDate: serialToIso(list[0][cDate] as number),
      endDate: serialToIso(last[cDate] as number),
      records: list.length,
      birdsPlaced: placed,
      liveBirds: live,
      feedCumKg: feedEnd,
      bodyWeightEndG: bwEnd,
      avgBodyWeightG: round(bwSum / list.length, 1),
      fcrCum: fcrCum,
      fcrPeriod: fcrPeriod,
      mortalityPct: placed > 0 ? round(mortEnd / placed * 100, 2) : null,
      flags: flags
    });
  }

  // ประเมินกฎจากตาราง Rules
  const anomalies: Anomaly[] = [];
  const rules = workbook.getTable(rulesTable);
  if (!rules) {
    anomalies.push({ farmId: "-", metric: "-", value: null, rule: "-", level: "WARNING", message: "ไม่พบตาราง " + rulesTable + " จึงไม่ได้ตรวจเกณฑ์" });
  } else {
    for (const rr of rules.getRangeBetweenHeaderAndTotal().getValues()) {
      const metric = String(rr[0]).trim();
      const op = String(rr[1]).trim();
      const threshold = Number(rr[2]);
      const level = String(rr[3]).trim() || "WARNING";
      const message = String(rr[4]);
      if (metric === "") { continue; }
      for (const f of farms) {
        const value = metricValue(f, metric);
        const ruleText = metric + " " + op + " " + threshold;
        if (value === undefined || isNaN(threshold) || [">", ">=", "<", "<=", "="].indexOf(op) < 0) {
          anomalies.push({ farmId: f.farmId, metric: metric, value: null, rule: ruleText, level: "WARNING", message: "กฎไม่ถูกต้อง ตรวจตาราง Rules" });
          break;
        }
        if (value === null) {
          anomalies.push({ farmId: f.farmId, metric: metric, value: null, rule: ruleText, level: "WARNING", message: "คำนวณค่าไม่ได้ ต้องตรวจข้อมูล" });
        } else if (compare(value, op, threshold)) {
          anomalies.push({ farmId: f.farmId, metric: metric, value: value, rule: ruleText, level: level, message: message });
        }
      }
    }
  }

  writeKpiSheet(workbook, farms, anomalies, generatedAt);
  return {
    generatedAt: generatedAt,
    definition: "Feed/Mortality cumulative; FCR_Cum = Feed_Cum_kg / ((BW_g - " + chickWeightG + ")/1000 * Live_Birds)",
    farms: farms,
    anomalies: anomalies,
    anomalyCount: anomalies.length
  };
}

// คืน undefined เมื่อชื่อ Metric ไม่รู้จัก, null เมื่อคำนวณไม่ได้
function metricValue(f: FarmKpi, metric: string): number | null | undefined {
  switch (metric) {
    case "FCR_Cum": return f.fcrCum;
    case "FCR_Period": return f.fcrPeriod;
    case "Mortality_Pct": return f.mortalityPct;
    case "Body_Weight_End_g": return f.bodyWeightEndG;
    case "Avg_Body_Weight_g": return f.avgBodyWeightG;
    default: return undefined;
  }
}

function compare(value: number, op: string, threshold: number): boolean {
  switch (op) {
    case ">": return value > threshold;
    case ">=": return value >= threshold;
    case "<": return value < threshold;
    case "<=": return value <= threshold;
    case "=": return value === threshold;
    default: return false;
  }
}

function round(v: number, digits: number): number {
  const p = Math.pow(10, digits);
  return Math.round(v * p) / p;
}

function serialToIso(serial: number): string {
  return new Date(Math.round((serial - 25569) * 86400000)).toISOString().substring(0, 10);
}

function writeKpiSheet(workbook: ExcelScript.Workbook, farms: FarmKpi[], anomalies: Anomaly[], generatedAt: string): void {
  let sheet = workbook.getWorksheet("KPI_Summary");
  if (sheet) {
    sheet.getRange().clear(ExcelScript.ClearApplyTo.all);
  } else {
    sheet = workbook.addWorksheet("KPI_Summary");
  }
  const rows: Cell[][] = [["Farm_ID", "Start_Date", "End_Date", "Records", "Birds_Placed", "Live_Birds", "Feed_Cum_kg",
    "Body_Weight_End_g", "Avg_Body_Weight_g", "FCR_Cum", "FCR_Period", "Mortality_Pct", "Flags", "Generated_At"]];
  for (const f of farms) {
    rows.push([f.farmId, f.startDate, f.endDate, f.records, f.birdsPlaced, f.liveBirds, f.feedCumKg,
      f.bodyWeightEndG, f.avgBodyWeightG, f.fcrCum === null ? "" : f.fcrCum, f.fcrPeriod === null ? "" : f.fcrPeriod,
      f.mortalityPct === null ? "" : f.mortalityPct, f.flags.join(", "), generatedAt]);
  }
  sheet.getRange("A1").getResizedRange(rows.length - 1, rows[0].length - 1).setValues(rows);

  const start = rows.length + 2;                     // เว้น 1 แถวแล้วเขียนตาราง Anomaly
  const aRows: Cell[][] = [["Farm_ID", "Metric", "Value", "Rule", "Level", "Message"]];
  for (const a of anomalies) {
    aRows.push([a.farmId, a.metric, a.value === null ? "" : a.value, a.rule, a.level, a.message]);
  }
  sheet.getRange("A" + start).getResizedRange(aRows.length - 1, aRows[0].length - 1).setValues(aRows);
  sheet.getRange("A1:N1").getFormat().getFont().setBold(true);
  sheet.getRange("A" + start + ":F" + start).getFormat().getFont().setBold(true);
  sheet.getRange("A:N").getFormat().autofitColumns();
}
```

**ผลลัพธ์:** object `KpiResult` → `{ generatedAt, definition, farms: [...], anomalies: [...], anomalyCount }` Flow ใช้ `anomalyCount > 0` เป็นเงื่อนไขส่งแจ้งเตือน

> ตัวอย่างตาราง Rules (เกณฑ์สมมติเพื่อฝึก ไม่ใช่มาตรฐานสายพันธุ์): `FCR_Cum | > | 1.8 | WARNING | FCR สะสมสูงกว่าเกณฑ์` · `Mortality_Pct | > | 2 | ERROR | อัตราตายสะสมเกินเกณฑ์` · `Body_Weight_End_g | < | 400 | WARNING | น้ำหนักล่าสุดต่ำกว่าเกณฑ์` · เกณฑ์ที่ขึ้นกับอายุ (เช่น น้ำหนักเป้าหมายตามวันอายุ) ต้องเพิ่มคอลัมน์ Age_From/Age_To ในตาราง Rules — สคริปต์นี้เป็นเกณฑ์ค่าเดียวเพื่อความเรียบง่าย · ตรวจผลคำนวณด้วยชุดข้อมูลที่รู้คำตอบ เช่น F001: Feed 5200 kg, BW 510 g, Placed 10000, Mortality 80 → Live 9920 → Live weight 5059.2 kg → FCR_Cum ≈ 1.028 (chickWeightG = 0) · ห้ามใช้ FCR ที่ได้จากข้อมูลที่นิยาม Feed ยังไม่ยืนยัน (ข้อจำกัดในข้อ 15 ของต้นฉบับ)

## Export_Dashboard_Json

ส่งออกตาราง (ค่าเริ่มต้น `Farm_Daily`) เป็น JSON ตามสัญญาข้อมูลของ Dashboard (data_source, last_updated, refresh_status, rows, quality_warnings) และเขียนแถวลงตาราง `Execution_Log` พร้อม Run ID — ถ้า Run ID เดิมเคยสำเร็จแล้วจะไม่ทำซ้ำ (idempotency)

```typescript
// Script: Export_Dashboard_Json
// runId = idempotency key ที่ Flow ส่งมา (เช่น SharePoint Item ID + Version) ; ว่าง = สร้างให้แบบ manual-...
// ส่งคืน JSON string สำหรับบันทึกเป็นไฟล์ด้วย SharePoint "Create file" ใน Power Automate

type Cell = string | number | boolean;
type JsonValue = string | number | boolean | null;

interface QualityWarning {
  level: string;
  code: string;
  row: JsonValue;
  column: string;
  message: string;
}

const LOG_SHEET = "Log";
const LOG_TABLE = "Execution_Log";
const LOG_HEADERS: Cell[] = ["Run_Id", "Started_At", "Finished_At", "Script", "Source_File", "Table", "Row_Count", "Status", "Message"];
const DATE_COLUMNS: string[] = ["Date"];
const DATETIME_COLUMNS: string[] = ["Refresh_Timestamp", "Imported_At"];
const MAX_JSON_CHARS = 4000000;   // เผื่อขนาด payload ของ Power Automate (ตรวจกับบัญชีจริงก่อนสอน)

function main(workbook: ExcelScript.Workbook, runId: string = "", sourceFile: string = "", tableName: string = "Farm_Daily", dataSource: string = "Excel: Farm_Daily"): string {
  const startedAt = new Date().toISOString();
  const id = runId.trim() !== "" ? runId.trim()
    : "manual-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000000).toString(36);

  // 1) Idempotency: Run ID เดิมที่สำเร็จแล้ว → ไม่ export ซ้ำ ไม่เขียน Log ซ้ำ
  if (hasSuccessfulRun(workbook, id)) {
    return JSON.stringify({ run_id: id, refresh_status: "skipped_duplicate_run", data_source: dataSource,
      last_updated: null, row_count: 0, rows: [], quality_warnings: [] });
  }

  try {
    const table = workbook.getTable(tableName);
    if (!table) { throw new Error("ไม่พบตาราง " + tableName); }
    const headers: string[] = table.getHeaderRowRange().getValues()[0].map((h) => String(h).trim());
    const values: Cell[][] = table.getRangeBetweenHeaderAndTotal().getValues();

    // 2) แปลงแถวเป็น object และแปลง serial date เป็น ISO
    const rows: { [key: string]: JsonValue }[] = [];
    let lastRefresh = 0;
    for (const r of values) {
      if (r.every((v) => v === "")) { continue; }
      const obj: { [key: string]: JsonValue } = {};
      headers.forEach((h, i) => {
        const v = r[i];
        if (typeof v === "number" && DATE_COLUMNS.indexOf(h) >= 0) {
          obj[h] = serialToIso(v).substring(0, 10);
        } else if (typeof v === "number" && DATETIME_COLUMNS.indexOf(h) >= 0) {
          obj[h] = serialToIso(v);
          lastRefresh = Math.max(lastRefresh, v);
        } else {
          obj[h] = v === "" ? null : v;
        }
      });
      rows.push(obj);
    }

    // 3) คำเตือนคุณภาพข้อมูลจากชีต Validation และตาราง Error_Rows (ถ้ามี)
    const warnings: QualityWarning[] = readValidationWarnings(workbook);
    const errTable = workbook.getTable("Error_Rows");
    if (errTable) {
      const errCount = errTable.getRangeBetweenHeaderAndTotal().getValues().filter((r) => !r.every((v) => v === "")).length;
      if (errCount > 0) {
        warnings.push({ level: "WARNING", code: "ERROR_ROWS_PRESENT", row: null, column: "-",
          message: "มี " + errCount + " แถวถูกแยกไป Error_Rows และไม่รวมใน Dashboard" });
      }
    }

    // last_updated = เวลา Refresh/Import ของข้อมูล (ไม่ใช่เวลา export) ; ไม่มีคอลัมน์เวลา → ใช้เวลา export และแจ้งเตือน
    let lastUpdated = startedAt;
    if (lastRefresh > 0) {
      lastUpdated = serialToIso(lastRefresh);
    } else {
      warnings.push({ level: "WARNING", code: "NO_REFRESH_TIMESTAMP", row: null, column: "-",
        message: "ไม่พบเวลา Refresh ในตาราง ใช้เวลา export แทน" });
    }

    const payload = {
      run_id: id,
      data_source: dataSource,
      last_updated: lastUpdated,
      generated_at: startedAt,
      refresh_status: warnings.some((w) => w.level === "ERROR") ? "success_with_errors"
        : (warnings.length > 0 ? "success_with_warnings" : "success"),
      row_count: rows.length,
      rows: rows,
      quality_warnings: warnings
    };
    const json = JSON.stringify(payload);
    if (json.length > MAX_JSON_CHARS) {
      throw new Error("JSON ใหญ่เกิน " + MAX_JSON_CHARS + " ตัวอักษร ให้แบ่งช่วงข้อมูลหรือสรุปก่อน export");
    }
    appendLog(workbook, [id, startedAt, new Date().toISOString(), "Export_Dashboard_Json", sourceFile, tableName, rows.length, "SUCCESS", payload.refresh_status]);
    return json;
  } catch (e) {
    appendLog(workbook, [id, startedAt, new Date().toISOString(), "Export_Dashboard_Json", sourceFile, tableName, 0, "FAILED", String(e)]);
    throw e;   // ให้ Action Run script ล้ม เพื่อให้ Flow เข้าสู่ Scope Catch
  }
}

function hasSuccessfulRun(workbook: ExcelScript.Workbook, id: string): boolean {
  const log = workbook.getTable(LOG_TABLE);
  if (!log) { return false; }
  const vals = log.getRangeBetweenHeaderAndTotal().getValues();
  return vals.some((r) => String(r[0]) === id && String(r[7]) === "SUCCESS");
}

function appendLog(workbook: ExcelScript.Workbook, values: Cell[]): void {
  const table = workbook.getTable(LOG_TABLE);
  if (table) {
    table.addRow(-1, values);
    return;
  }
  // สร้างตาราง Log ครั้งแรก: เขียนหัว + แถวแรกพร้อมกัน เพื่อไม่ให้มีแถวว่างค้าง
  let sheet = workbook.getWorksheet(LOG_SHEET);
  if (!sheet) { sheet = workbook.addWorksheet(LOG_SHEET); }
  const range = sheet.getRange("A1").getResizedRange(1, LOG_HEADERS.length - 1);
  range.setValues([LOG_HEADERS, values]);
  const created = workbook.addTable(range, true);
  created.setName(LOG_TABLE);
}

function readValidationWarnings(workbook: ExcelScript.Workbook): QualityWarning[] {
  const out: QualityWarning[] = [];
  const sheet = workbook.getWorksheet("Validation");
  if (!sheet) { return out; }
  const used = sheet.getUsedRange();
  if (!used) { return out; }
  const vals = used.getValues();
  // หัวคอลัมน์ตามสคริปต์ Validate_Farm_Data: Checked_At, Overall_Status, Row, Column, Level, Code, Message
  for (let i = 1; i < vals.length && out.length < 200; i++) {
    const level = String(vals[i][4]);
    if (level === "ERROR" || level === "WARNING") {
      out.push({ level: level, code: String(vals[i][5]), row: vals[i][2] === "" ? null : vals[i][2],
        column: String(vals[i][3]), message: String(vals[i][6]) });
    }
  }
  return out;
}

function serialToIso(serial: number): string {
  return new Date(Math.round((serial - 25569) * 86400000)).toISOString();
}
```

**ผลลัพธ์:** JSON string (Power Automate ได้ใน `result`) → ใช้ Action SharePoint "Create file" บันทึกเป็น `farm-kpi.json` ในโฟลเดอร์ staging · กรณี Run ID ซ้ำได้ `refresh_status = "skipped_duplicate_run"`

> เวลาใน Excel ไม่มีโซนเวลา การแปลง serial → ISO ในสคริปต์ถือว่าเป็น UTC ถ้าต้นทางเป็นเวลาท้องถิ่น ให้ระบุโซนเวลาใน data_source หรือปรับค่า offset · Run ID ที่ดีต้องคงที่สำหรับ "เหตุการณ์เดียวกัน" เช่น `{ItemId}-{VersionNumber}` ของไฟล์ SharePoint ไม่ควรใช้เวลาปัจจุบัน (จะไม่กันการทำซ้ำ) · แถวใน Execution_Log ที่ FAILED จะไม่กันการรันใหม่ (กันเฉพาะ SUCCESS) จึงกด Resubmit ใน Flow ได้อย่างปลอดภัย · ห้ามใส่ข้อมูลส่วนบุคคลหรือคอลัมน์ที่ Dashboard ไม่ต้องใช้ใน JSON — ตัดคอลัมน์ก่อน export

## Append_Validated_Rows

รับแถวจากไฟล์รายวัน (JSON จาก Action "List rows present in a table") แล้วเพิ่มเข้าตาราง `Farm_Daily` ในสมุดงานหลักแบบ upsert-safe: คีย์ Farm_ID + Date ใหม่ = เพิ่ม, ซ้ำค่าเดิม = ข้าม, ซ้ำแต่ค่าต่าง = ไม่เขียนทับ และรายงานเป็น conflict ให้คนตัดสิน

```typescript
// Script: Append_Validated_Rows
// ใช้กับตาราง Farm_Daily ที่เป็นตารางปกติ (ไม่ใช่ผลโหลดของ Power Query เพราะ Refresh จะเขียนทับ)
// คอลัมน์ Farm_Daily: Farm_ID, Date, Age_Days, Body_Weight_g, Feed_Intake_kg, Mortality_Count, Birds_Placed, Source_File, Run_Id, Imported_At
// rowsJson: อาร์เรย์ JSON ของแถว (Excel connector ส่งค่าเป็นข้อความ เช่น "520" และวันที่เป็น ISO ถ้าตั้ง DateTime Format = ISO 8601)

type Cell = string | number | boolean;

interface IncomingRow {
  Farm_ID: string;
  Date: string | number;
  Age_Days: string | number;
  Body_Weight_g: string | number;
  Feed_Intake_kg: string | number;
  Mortality_Count: string | number;
  Birds_Placed: string | number;
}

interface AppendResult {
  runId: string;
  received: number;
  inserted: number;
  skippedSame: number;
  conflicts: string[];
  rejected: string[];
  status: string;   // SUCCESS | SUCCESS_WITH_CONFLICTS | NOTHING_TO_DO
}

const NUM_FIELDS: string[] = ["Age_Days", "Body_Weight_g", "Feed_Intake_kg", "Mortality_Count", "Birds_Placed"];

function main(workbook: ExcelScript.Workbook, rowsJson: string, runId: string, sourceFile: string, tableName: string = "Farm_Daily"): AppendResult {
  const table = workbook.getTable(tableName);
  if (!table) { throw new Error("ไม่พบตาราง " + tableName); }
  const headers: string[] = table.getHeaderRowRange().getValues()[0].map((h) => String(h).trim());
  const iFarm = headers.indexOf("Farm_ID");
  const iDate = headers.indexOf("Date");
  if (iFarm < 0 || iDate < 0) { throw new Error("ตาราง " + tableName + " ต้องมีคอลัมน์ Farm_ID และ Date"); }

  const incoming = JSON.parse(rowsJson) as IncomingRow[];
  const existing: Cell[][] = table.getRangeBetweenHeaderAndTotal().getValues();
  const index: { [key: string]: Cell[] } = {};
  for (const r of existing) {
    if (typeof r[iDate] === "number") { index[String(r[iFarm]).trim() + "|" + Math.floor(r[iDate] as number)] = r; }
  }

  const importedAt = new Date().toISOString();
  const toAdd: Cell[][] = [];
  const conflicts: string[] = [];
  const rejected: string[] = [];
  let skippedSame = 0;

  incoming.forEach((src, n) => {
    const farm = String(src.Farm_ID || "").trim().toUpperCase();
    const serial = toSerial(src.Date);
    const nums: number[] = NUM_FIELDS.map((f) => Number(String((src as unknown as { [k: string]: string | number })[f]).trim()));
    if (farm === "" || serial === null || nums.some((v) => isNaN(v))) {
      rejected.push("แถวที่ " + (n + 1) + ": ข้อมูลไม่ครบหรือไม่ใช่ตัวเลข");
      return;
    }
    const key = farm + "|" + serial;
    const old = index[key];
    if (old) {
      const same = NUM_FIELDS.every((f, k) => Number(old[headers.indexOf(f)]) === nums[k]);
      if (same) { skippedSame++; } else { conflicts.push(farm + " " + serialToIso(serial) + " (ค่าต่างจากที่มีอยู่ ไม่เขียนทับ)"); }
      return;
    }
    const row: Cell[] = headers.map((h) => {
      switch (h) {
        case "Farm_ID": return farm;
        case "Date": return serial;
        case "Source_File": return sourceFile;
        case "Run_Id": return runId;
        case "Imported_At": return importedAt;
        default: {
          const k = NUM_FIELDS.indexOf(h);
          return k >= 0 ? nums[k] : "";
        }
      }
    });
    toAdd.push(row);
    index[key] = row;      // กันซ้ำภายในชุดเดียวกัน
  });

  if (toAdd.length > 0) {
    table.addRows(-1, toAdd);
    const dateCol = table.getColumnByName("Date");
    if (dateCol) { dateCol.getRangeBetweenHeaderAndTotal().setNumberFormat("yyyy-mm-dd"); }
  }
  return {
    runId: runId,
    received: incoming.length,
    inserted: toAdd.length,
    skippedSame: skippedSame,
    conflicts: conflicts,
    rejected: rejected,
    status: toAdd.length === 0 && conflicts.length === 0 ? "NOTHING_TO_DO"
      : (conflicts.length > 0 || rejected.length > 0 ? "SUCCESS_WITH_CONFLICTS" : "SUCCESS")
  };
}

// รับ serial number หรือข้อความ yyyy-mm-dd[...] → Excel serial (จำนวนเต็ม) ; ไม่ได้ = null
function toSerial(v: string | number): number | null {
  if (typeof v === "number") { return v >= 1 ? Math.floor(v) : null; }
  const t = String(v || "").trim();
  if (/^\d+(\.\d+)?$/.test(t)) { return Math.floor(Number(t)); }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (!m) { return null; }
  const year = Number(m[1]);
  if (year > 2400) { return null; }   // ปี พ.ศ. ไม่รับ
  return Date.UTC(year, Number(m[2]) - 1, Number(m[3])) / 86400000 + 25569;
}

function serialToIso(serial: number): string {
  return new Date(Math.round((serial - 25569) * 86400000)).toISOString().substring(0, 10);
}
```

**ผลลัพธ์:** object `AppendResult` → `{ runId, received, inserted, skippedSame, conflicts[], rejected[], status }` ถ้า conflicts หรือ rejected ไม่ว่าง Flow ต้องบันทึก Error Log และแจ้งผู้รับผิดชอบ

> รันซ้ำด้วยไฟล์เดิมจะได้ inserted = 0 และ skippedSame = จำนวนแถว (idempotent) — ใช้เป็น Test Case ได้ · ใน Action "List rows present in a table" ให้เปิด Pagination (Settings) ถ้าตารางเกินค่าเริ่มต้น และตั้ง DateTime Format เป็น ISO 8601 (ตรวจกับบัญชีจริงก่อนสอน) · การส่ง rowsJson ใช้ expression `string(body('Select'))` หรือ `string(outputs('List_rows_present_in_a_table')?['body/value'])` ตามชื่อ Action จริง · ถ้าต้องการให้ Power Query ใช้ข้อมูลชุดนี้ ให้ Power Query อ่านตาราง Farm_Daily เป็นแหล่ง ไม่ใช่ให้สคริปต์เขียนลงตารางผลโหลดของ Query

## ข้อจำกัด

- **เวลาทำงาน:** การรันสคริปต์จาก Power Automate มีเวลาจำกัด (เอกสารระบุราว 120 วินาทีต่อการเรียกแบบ synchronous) ถ้าเกินจะล้ม — ประมวลผลเป็นชุดย่อยและหลีกเลี่ยงการอ่าน/เขียนทีละเซลล์ในลูป (ตรวจกับบัญชีจริงก่อนสอน)
- **จำนวนครั้ง:** Action Run script มีโควตาต่อผู้ใช้ต่อวัน (เอกสารระบุราว 1,600 ครั้ง/วัน รีเซ็ตเวลา 00:00 UTC) ออกแบบ Flow ไม่ให้รันทุกการแก้ไขเล็ก ๆ (ตรวจกับบัญชีจริงก่อนสอน)
- **ไม่มีการเรียก HTTP ภายนอก:** สคริปต์ที่รันผ่าน Power Automate เรียก `fetch` หรือ API ภายนอกไม่ได้ ให้ใช้ Connector ของ Flow ทำหน้าที่นั้นแทน (เช่น SharePoint Create file, Teams)
- **ขอบเขต 1 สมุดงาน:** สคริปต์เข้าถึงได้เฉพาะสมุดงานที่ถูกเรียกใช้ อ่านไฟล์อื่นเองไม่ได้ ต้องให้ Flow ส่งข้อมูลมาเป็นพารามิเตอร์ (เช่น rowsJson)
- **ขนาดข้อมูล:** พารามิเตอร์และค่าที่ส่งคืนมีขนาดจำกัด (ระดับไม่กี่ MB) และการ setValues ครั้งเดียวกับช่วงใหญ่มากอาจล้ม ให้แบ่งเป็นชุด (ตรวจกับบัญชีจริงก่อนสอน)
- **ชนิดพารามิเตอร์/ค่าส่งคืน:** ต้องเป็น string, number, boolean, array, object/interface ที่ serialize เป็น JSON ได้ ส่ง object ของ ExcelScript (เช่น Range) ออกไม่ได้ และห้ามใช้ชนิด `any`
- **ไม่มี UI ระหว่างรัน:** ไม่มีกล่องโต้ตอบให้ผู้ใช้ยืนยัน (การอนุมัติต้องทำใน Power Automate Approvals) · `console.log` แสดงในแผงผลลัพธ์ของ Code Editor และในผลลัพธ์ของ Action
- **Power Query refresh:** อย่าพึ่งการสั่ง Refresh Power Query จากสคริปต์ที่รันผ่าน Power Automate — ข้อจำกัดนี้ระบุในเอกสารของ Office Scripts (ตรวจกับบัญชีจริงก่อนสอน)
- **ไฟล์ถูกล็อก:** ถ้ามีคนเปิดแก้ไฟล์บนเดสก์ท็อปหรือไฟล์กำลังซิงก์ Action อาจล้มชั่วคราว ให้ตั้ง Retry policy ใน Flow
- **ความเข้ากันได้:** สคริปต์ใช้ API รุ่นปัจจุบัน ถ้า Code Editor แจ้ง method ไม่รู้จัก ให้ตรวจเอกสาร ExcelScript และเวอร์ชันของ Excel ในบัญชีจริง

## Test Cases

| กรณีทดสอบ | การตั้งค่า / ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| TC-OS-01 ตารางถูกต้องทั้งหมด | ตาราง Farm_Performance 4 แถว (F001, F002 วันที่ 2026-10-01 และ 2026-10-08) ค่าถูกต้อง · รัน Validate_Farm_Data (writeSheet = true) | status = PASS, errorCount = 0 · ชีต Validation มี 1 แถว "ไม่พบปัญหา (4 แถว)" |
| TC-OS-02 คอลัมน์ขาด | ลบคอลัมน์ Birds_Placed ออกจากตาราง · รัน Validate_Farm_Data | status = ERROR · missingColumns = ["Birds_Placed"] · ไม่ตรวจรายแถว (เพราะ Schema ไม่ผ่าน) |
| TC-OS-03 ข้อความในคอลัมน์ตัวเลขและวันที่เป็นข้อความ | Body_Weight_g = "520" (ข้อความ), Feed_Intake_kg = "N/A", Date = "2026-10-08" (ข้อความ) · รัน Validate_Farm_Data | NUMBER_AS_TEXT (WARNING) · NOT_A_NUMBER (ERROR) · DATE_AS_TEXT (WARNING) · status = ERROR |
| TC-OS-04 คีย์ซ้ำและค่าสะสมลดลง | F001 2026-10-01 สองแถว และ F001 2026-10-08 ที่ Feed_Intake_kg น้อยกว่าแถว 2026-10-01 · รัน Validate_Farm_Data | DUPLICATE_KEY ระบุ "ซ้ำกับแถว n" ถูกแถว · CUM_DECREASED ที่คอลัมน์ Feed_Intake_kg |
| TC-OS-05 KPI ตามค่าที่คำนวณมือ | Farm_Daily: F001 2026-10-01 (Feed 5200, BW 510, Mortality 80, Placed 10000) และ 2026-10-08 (Feed 11000, BW 940, Mortality 110, Placed 10000) · Rules ว่าง · คำนวณมือ: Live 9890, Live weight 9296.6 kg → FCR_Cum = 11000/9296.6 ≈ 1.183 · FCR_Period = 5800 / (9296.6 − 5059.2) ≈ 1.369 · Mortality % = 1.10 · รัน Farm_KPI_Summary (chickWeightG = 0) | fcrCum = 1.183, fcrPeriod = 1.369, mortalityPct = 1.1 ตรงกับค่ามือ (ค่าตัวอย่างสมมติ) |
| TC-OS-06 Rules ทำงานและกฎผิดรูปแบบ | Rules: `Mortality_Pct > 1 ERROR ...` และ `FCR_X > 1 WARNING ...` (ชื่อ Metric ผิด) · รัน Farm_KPI_Summary | มี Anomaly ระดับ ERROR สำหรับฟาร์มที่ Mortality_Pct > 1 · มี WARNING "กฎไม่ถูกต้อง ตรวจตาราง Rules" สำหรับ FCR_X |
| TC-OS-07 Export + Idempotency | สมุดงานที่มี Farm_Daily และยังไม่มีชีต Log · รัน Export_Dashboard_Json ด้วย runId = "T-001" · รันซ้ำด้วย runId เดิม · รันด้วย runId = "T-002" | ครั้งแรก: สร้างตาราง Execution_Log 1 แถว SUCCESS และคืน JSON มี rows ครบ · ครั้งที่สอง: refresh_status = skipped_duplicate_run และ Log ไม่เพิ่ม · ครั้งที่สาม: Log เพิ่มเป็น 2 แถว |
| TC-OS-08 Append ไม่ซ้ำ | rowsJson 4 แถว (หนึ่งแถวมี Body_Weight_g ต่างจากที่มีอยู่) · รัน Append_Validated_Rows · รันซ้ำด้วยข้อมูลเดิม | ครั้งแรก inserted = 3, conflicts 1 รายการ · ครั้งที่สอง inserted = 0, skippedSame = 3, conflicts 1 รายการ (ไม่เขียนทับ) |
| TC-OS-09 ไม่พบตาราง | เรียกด้วย tableName ที่ไม่มีจริง · รันทั้ง 4 สคริปต์จาก Power Automate | Validate คืน status = ERROR (TABLE_NOT_FOUND) · สคริปต์ 2–4 throw Error → Action Run script ล้ม และ Flow เข้า Scope Catch พร้อมบันทึก Error Log |
