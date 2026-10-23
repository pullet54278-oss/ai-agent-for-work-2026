# Excel course content schema (ส่วนขยายการเรียนรู้)

ต้นฉบับ (Source of Truth) = `AI_Excel_3_Levels_Claude_Build_Spec.md` — แอปแสดงต้นฉบับทุกตัวอักษรแยกต่างหาก
ไฟล์ `level-b.mjs`, `level-i.mjs`, `level-a.mjs` คือ "ส่วนขยาย" ที่เขียนเพิ่ม (ภาษาไทย, ES module, `export default { ... }`)

## กติกาเนื้อหา
- ภาษาไทยชัดเจน ศัพท์ Excel ใช้อังกฤษ · ห้ามชื่อบริษัท/ชื่อฟาร์ม/ชื่อโรงงาน/ชื่อเอกสาร/เลขที่เอกสาร/ตำแหน่งงาน (ใช้ "ผู้รับผิดชอบ", "ผู้มีอำนาจอนุมัติ", "ผู้ตรวจทาน") · ฟาร์มใช้รหัส F001–F004 · ข้อมูลสัตว์ปีกเป็นข้อมูลสมมติ ไม่ใช่มาตรฐานสายพันธุ์
- ห้ามแต่งผล Benchmark/ผลทดสอบที่ไม่ได้รัน · ไม่อ้างว่า AI แก้ไฟล์/เชื่อมข้อมูลได้เองถ้าไม่มีเครื่องมือ/สิทธิ์
- สูตรใช้ตัวคั่น `,` (en-US) · ระบุเวอร์ชันด้วยค่ามาตรฐานใน `versions`:
  `all` (ทุกเวอร์ชันที่ยังใช้กัน), `2010+`, `2013+`, `2016+`, `2019+`, `2021+`, `2024+`, `m365` (Microsoft 365 / Excel Web เท่านั้น)
  อ้างอิง: IFNA 2013+, IFS/SWITCH/TEXTJOIN/MAXIFS/MINIFS/CONCAT 2019+, XLOOKUP/XMATCH/FILTER/SORT/SORTBY/UNIQUE/SEQUENCE/LET 2021+, LAMBDA/MAP/BYROW/BYCOL/REDUCE/SCAN/MAKEARRAY/TEXTSPLIT/TEXTBEFORE/TEXTAFTER/VSTACK/HSTACK/TOCOL/CHOOSECOLS/TAKE/DROP 2024+, GROUPBY/PIVOTBY/REGEX* m365

## โครงสร้าง
```js
export default {
  key: 'b',                      // b | i | a
  lessons: [{                    // B 7, I 7, A 8 บท
    id: 'b1', title: '...', icon: 'calculator',   // icon ไม่บังคับ
    objectives: ['...'], prerequisites: ['...'],
    concepts: ['ย่อหน้า (ใช้ **ตัวหนา** และ `code` ได้)'],
    functions: [{ name: 'SUMIF', syntax: 'SUMIF(range, criteria, [sum_range])', purpose: '...', versions: 'all' }],
    specPrompts: ['B06'],        // id ของ Prompt ในต้นฉบับที่ใช้ในบทนี้ (แอปดึงข้อความต้นฉบับมาแสดงเอง ห้ามพิมพ์ซ้ำ)
    prompts: [{ title: '...', text: 'Prompt ใหม่ คัดลอกได้' }],
    formulas: [FORMULA],         // ≥ 3 ต่อบท
    sampleData: { title: '...', cols: ['A: Department', 'B: Sales'], rows: [['Marketing', 1200]] },
    expectedOutput: ['...'],
    validation: ['ขั้นตอนตรวจสอบ ...'],
    exercises: [{ q: 'โจทย์', answer: 'เฉลย (ใส่สูตรได้)', hint: '...' }],   // ≥ 3 ต่อบท
    troubleshooting: [{ problem: '#N/A ...', fix: '...' }]
  }],
  techniques: [{                 // คลังเทคนิคใช้งานจริง (แนวหัวข้อจากชุดหนังสือ Deep Into Function — เขียนใหม่เองทั้งหมด)
    id: 'bt1', title: '...', problem: '...', prompt: 'Prompt ให้ AI ช่วย', formula: FORMULA, caution: '...'
  }],
  workshops: [{                  // B 5, I 6, A 7 — ชื่อตรงตามข้อ 6/10/14 ของต้นฉบับ ตามลำดับ
    id: 'bw1', title: '...', goal: '...', data: 'ชีต/คอลัมน์ที่ใช้ใน sample-workbook',
    steps: ['...'], answer: ['เฉลยทีละข้อ พร้อมสูตร'], rubric: ['เกณฑ์ตรวจ ...'], time: '30 นาที'
  }],
  quiz: {                        // คำถาม 4 ตัวเลือก [คำถาม, [ก,ข,ค,ง], indexที่ถูก(0-3), คำอธิบาย]
    pre: [ /* 10 ข้อ */ ], post: [ /* 10 ข้อ ไม่ซ้ำกับ pre */ ]
  }
}
```

### FORMULA (ตรวจด้วย LibreOffice จริง)
```js
{
  id: 'b1-f1', title: '...', formula: '=SUMIF(A2:A6,"Marketing",B2:B6)', cell: 'C2',
  versions: 'all', assumptions: ['...'], explain: ['ส่วนที่ 1 ...'],
  legacy: 'ทางเลือกรุ่นเก่า (ถ้ามี) เช่น =SUMPRODUCT(...)',
  tests: [                       // ≥ 3: ปกติ / ขอบเขต-ค่าว่าง / Error หรือข้อมูลผิด
    { name: 'ค่าปกติ', cells: { A2: 'Marketing', B2: 100, A3: 'Sales', B3: 50 }, expect: 100 },
    { name: 'ค่าว่าง', cells: { A2: 'Marketing' }, expect: 0 },
    { name: 'ไม่พบ', cells: { A2: 'HR', B2: 10 }, expect: 0 }
  ]
}
```
- `cells`: ค่าในชีตทดสอบ (ชีตแรกชื่อ `Sheet1`) · อ้างชีตอื่นด้วย `'Master!A2'` · ตัวเลข = number, ข้อความ = string, วันที่ = `'d:2026-10-01'`, วันที่+เวลา = `'dt:2026-10-31 14:30'`, สูตรช่วย = `'=...'`, ค่าว่าง = ไม่ต้องใส่
- `expect`: number (เทียบ ±1e-6) · string · boolean · `'#N/A'` / `'#DIV/0!'` / `'#VALUE!'` สำหรับ Error · `{ round: 2, value: 12.34 }` ถ้าต้องการปัด · array 2 มิติ `[[..],[..]]` สำหรับผลแบบ spill
- `engine: 'm365'` สำหรับสูตรที่ LibreOffice 24.2 ไม่รองรับ (XLOOKUP, XMATCH, FILTER, SORT, SORTBY, UNIQUE, SEQUENCE, LET, LAMBDA, MAP, BYROW, REDUCE, SCAN, TEXTSPLIT, VSTACK, GROUPBY, PIVOTBY, TEXTBEFORE/AFTER) — ยังต้องมี tests ครบ (ตรวจด้วยตัวคำนวณอ้างอิง/ระบุว่ายังไม่ได้ทดสอบใน Excel)
- ห้ามใช้ฟังก์ชันที่ขึ้นกับเวลาปัจจุบัน (TODAY/NOW) ใน tests ที่มี expect ตายตัว — ให้ใส่วันที่อ้างอิงในเซลล์แทน
- TEXT(...,"mmmm") ขึ้นกับ locale: ระบุ expect เป็นผลของ en-US (เช่น 'October') และอธิบาย locale ใน assumptions
