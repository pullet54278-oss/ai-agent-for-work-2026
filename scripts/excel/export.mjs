// Generate the deliverable folder (spec section 17) from the same data the web app uses:
// ai-excel-formula-mastery/{README.md, curriculum/, prompts/, workshops/, automation/, dashboard/, tests/, data/}
// Usage: node scripts/excel/export.mjs  (run after make_workbook.py and verify-formulas.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { buildExcel, LEVELS, VERSION_TH, allFormulas, deliverablesRows } from '../lib/excel.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'ai-excel-formula-mastery');
const X = await buildExcel(ROOT);
const { spec, levels: L, auto: A, sample } = X;
const fR = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'excel-formula-report.json'), 'utf8'));
const wR = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'excel-workbook-report.json'), 'utf8'));
const failIds = new Set((fR.fails || []).map(f => f.id));
const write = (rel, text) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text.replace(/\n{3,}/g, '\n\n').trim() + '\n'); return rel; };
const files = [];
const li = a => (a || []).map(x => `- ${x}`).join('\n');
const nl = a => (a || []).map((x, i) => `${i + 1}. ${x}`).join('\n');
const fence = (t, lang = 'text') => '```' + lang + '\n' + t + '\n```';
const cellv = v => v == null ? '(ว่าง)' : typeof v === 'object' && !Array.isArray(v) && 'round' in v ? `≈${v.value} (ปัด ${v.round})` : Array.isArray(v) ? JSON.stringify(v) : String(v);
const mdTable = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map(r => `| ${r.map(c => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>')).join(' | ')} |`).join('\n')}`;
const verified = F => F.engine === 'm365' ? 'ยังไม่ได้ทดสอบใน Excel จริง (ฟังก์ชัน Microsoft 365 ที่ LibreOffice 24.2 ไม่รองรับ)' : failIds.has(F.id) ? 'ไม่ผ่าน' : `ผ่านการคำนวณจริงด้วย LibreOffice ${F.tests.length}/${F.tests.length} กรณี`;
const formulaMD = F => [`#### ${F.title}`, `- สูตร (วางที่ \`${F.cell}\`): \`${F.formula}\``, `- เวอร์ชัน: ${VERSION_TH[F.versions] || F.versions}`, F.assumptions?.length ? `- ข้อสมมติ: ${F.assumptions.join(' · ')}` : '', F.explain?.length ? `- อธิบาย:\n${F.explain.map(e => `  - ${e}`).join('\n')}` : '', F.legacy ? `- ทางเลือกรุ่นเก่า: ${F.legacy}` : '', `- ผลการตรวจ: ${verified(F)}`, '', mdTable(['กรณีทดสอบ', 'ข้อมูลนำเข้า', 'ผลที่คาดหวัง'], F.tests.map(t => [t.name, Object.entries(t.cells || {}).map(([k, v]) => `${k}=${cellv(v).replace(/^dt?:/, '')}`).join(', ') || '(ไม่มี)', cellv(t.expect)]))].filter(Boolean).join('\n');
const quizMD = (title, q) => `### ${title}\n\n${q.map(([qq, o, a, why], i) => `${i + 1}. ${qq}\n${o.map((x, k) => `   ${'กขคง'[k]}. ${x}`).join('\n')}\n   - **เฉลย:** ${'กขคง'[a]}. ${o[a]} — ${why}`).join('\n')}`;
const head = (t, note = '') => `# ${t}\n\n> สร้างอัตโนมัติจากข้อมูลชุดเดียวกับ Web App (scripts/excel/export.mjs) · ส่วน "ต้นฉบับ" คัดจาก AI_Excel_3_Levels_Claude_Build_Spec.md ทุกตัวอักษร (แทน "หัวหน้างาน" ด้วย "ผู้รับผิดชอบงาน" ตามกติกาเว็บ) · ส่วนอื่นเป็นส่วนขยายการเรียนรู้${note ? ' · ' + note : ''}\n`;
const NUM = { b: '01-beginner', i: '02-intermediate', a: '03-advanced' };
const SPEC_S = { b: ['LEVEL 1', 's3', 's4'], i: ['LEVEL 2', 's7', 's8'], a: ['LEVEL 3', 's11', 's12'] };
const PROMPT_S = { b: 's5', i: 's9', a: 's13' }, WS_S = { b: 's6', i: 's10', a: 's14' };

for (const lv of LEVELS) {
  const Lv = L[lv.key];
  files.push(write(`curriculum/${NUM[lv.key]}.md`, [head(`${lv.th}: ${lv.sub}`), '## ต้นฉบับ', SPEC_S[lv.key].map(k => spec.S[k]).join('\n\n'),
    '## บทเรียน (ส่วนขยาย)', ...Lv.lessons.map((l, i) => [`### ${lv.code}${i + 1}. ${l.title}`, '**Learning Objectives**', li(l.objectives), '**Prerequisites**', li(l.prerequisites), '**Concepts**', (l.concepts || []).join('\n\n'),
      '**Function Reference**', mdTable(['ฟังก์ชัน', 'Syntax', 'ใช้ทำอะไร', 'เวอร์ชัน'], l.functions.map(f => [f.name, '`' + f.syntax + '`', f.purpose, VERSION_TH[f.versions] || f.versions])),
      l.specPrompts?.length ? `**Prompt จากต้นฉบับ:** ${l.specPrompts.join(', ')} (ดู prompts/${{ b: 'beginner', i: 'intermediate', a: 'advanced' }[lv.key]}-prompts.md)` : '',
      ...(l.prompts || []).map(p => `**Prompt: ${p.title}**\n\n${fence(p.text)}`),
      '**Formula Examples**', ...l.formulas.map(formulaMD),
      `**Sample Data — ${l.sampleData.title || ''}**`, mdTable(l.sampleData.cols, l.sampleData.rows.map(r => r.map(v => v ?? ''))), '**Expected Output**', li(l.expectedOutput), '**Validation**', nl(l.validation),
      '**Exercises + Answer Key**', l.exercises.map((e, k) => `${k + 1}. ${e.q}${e.hint ? `\n   - คำใบ้: ${e.hint}` : ''}\n   - **เฉลย:** ${e.answer}`).join('\n'), '**Troubleshooting**', mdTable(['ปัญหา', 'วิธีแก้'], l.troubleshooting.map(t => [t.problem, t.fix]))].join('\n\n')),
    '## คลังเทคนิคใช้งานจริง (ส่วนขยาย)', '_แนวหัวข้ออ้างอิงจากชุดหนังสือ Deep Into Function (เพจวิศวกรสร้างภาพ) — คำอธิบาย สูตร และตัวอย่างเขียนใหม่ทั้งหมด_', ...(Lv.techniques || []).map(t => [`### ${t.title}`, `**ปัญหา:** ${t.problem}`, fence(t.prompt), formulaMD(t.formula), t.caution ? `> ข้อควรระวัง: ${t.caution}` : ''].join('\n\n')),
    '## แบบทดสอบก่อน/หลังเรียน (ส่วนขยาย)', quizMD(`แบบทดสอบก่อนเรียน (${Lv.quiz.pre.length} ข้อ)`, Lv.quiz.pre), quizMD(`แบบทดสอบหลังเรียน (${Lv.quiz.post.length} ข้อ)`, Lv.quiz.post)].join('\n\n')));
  const nm = { b: 'beginner', i: 'intermediate', a: 'advanced' }[lv.key];
  files.push(write(`prompts/${nm}-prompts.md`, [head(`${lv.name} Prompts`), '## ต้นฉบับ', spec.S[PROMPT_S[lv.key]], '## Prompt เพิ่มเติมจากบทเรียน (ส่วนขยาย)', ...Lv.lessons.flatMap((l, i) => (l.prompts || []).map(p => `### ${lv.code}${i + 1} · ${p.title}\n\n${fence(p.text)}`))].join('\n\n')));
  files.push(write(`workshops/${nm}-workshops.md`, [head(`${lv.name} Workshops พร้อมเฉลย`), '## ต้นฉบับ', spec.S[WS_S[lv.key]], '## คู่มือ Workshop (ส่วนขยาย)', ...Lv.workshops.map((w, i) => [`### Workshop ${i + 1}: ${w.title}`, `- เวลา: ${w.time || '-'}`, `- ข้อมูล: ${w.data || '-'}`, `- เป้าหมาย: ${w.goal}`, '**ขั้นตอน**', nl(w.steps), '**เฉลย (Answer Key)**', nl(w.answer), '**เกณฑ์ตรวจ**', w.rubric.map(r => `- [ ] ${r}`).join('\n')].join('\n\n'))].join('\n\n')));
}
// automation
const pq = A.powerQuery, os = A.officeScripts, pa = A.powerAutomate, db = A.dashboard, ag = A.agent;
const tests = arr => mdTable(['กรณีทดสอบ', 'การตั้งค่า / ขั้นตอน', 'ผลที่คาดหวัง'], (arr || []).map(t => [t.name, [t.setup, t.steps].flat().filter(Boolean).join(' · '), t.expect]));
const tsl = arr => li((arr || []).map(t => typeof t === 'string' ? t : `${t.problem || t.name}: ${t.fix || t.expect || ''}`));
files.push(write('automation/power-query-guide.md', [head(pq.title, 'โค้ดเป็นแม่แบบ ยังไม่ได้รันในบัญชีจริง'), (pq.intro || []).join('\n\n'), '## สิ่งที่ต้องมี', li(pq.prerequisites), '## Schema', mdTable(['คอลัมน์', 'ชนิด', 'กฎ'], pq.folderSchema.columns.map(c => [c.name, c.type, c.rule])), '## ขั้นตอนบนหน้าจอ', nl(pq.uiSteps), '## M Code', '### Parameter', fence(pq.mcode.sample, 'powerquery'), '### Query หลัก', fence(pq.mcode.main, 'powerquery'), '### ตรวจ Schema', fence(pq.mcode.schemaCheck, 'powerquery'), '### Error_Rows', fence(pq.mcode.errors, 'powerquery'), '## Refresh', li(pq.refresh), '## Test Cases', tests(pq.tests), '## Troubleshooting', tsl(pq.troubleshooting)].join('\n\n')));
files.push(write('automation/office-scripts-guide.md', [head(os.title, 'ตรวจสิทธิ์/License กับบัญชีจริงก่อนสอน'), (os.intro || []).join?.('\n\n') ?? os.intro, '## เงื่อนไข', li(os.requirements), ...os.scripts.map(s => [`## ${s.name}`, s.purpose, fence(s.code, 'typescript'), s.returns ? `**ผลลัพธ์:** ${s.returns}` : '', s.notes ? `> ${Array.isArray(s.notes) ? s.notes.join(' · ') : s.notes}` : ''].join('\n\n')), '## ข้อจำกัด', li(os.limits), '## Test Cases', tests(os.tests)].join('\n\n')));
files.push(write('automation/power-automate-flow.md', [head(pa.title, 'ชื่อ Connector/Action ขึ้นกับ Tenant — ตรวจกับบัญชีจริงก่อนสอน'), (pa.intro || []).join?.('\n\n') ?? pa.intro, '## Architecture', nl(pa.architecture), fence(pa.diagram), '## Trigger', li(pa.trigger.options), `**แนะนำ:** ${pa.trigger.recommended}`, '## Actions', mdTable(['ขั้น', 'Connector', 'Action', 'รายละเอียด'], pa.actions.map(a => [a.step, a.connector, a.action, a.detail])), ...[['Connectors', pa.connectors], ['Permissions', pa.permissions], ['DLP', pa.dlp], ['Retry', pa.retry], ['Idempotency', pa.idempotency], ['Recovery Plan', pa.recovery], ['Human Approval', pa.approval], ['ทางเลือกเมื่อ Connector ถูกบล็อก', pa.alternatives]].map(([h, a]) => `## ${h}\n\n${li(a)}`), '## Test Cases', tests(pa.tests), '## AI Agent สำหรับ Excel (A08)', (ag.intro || []).join?.('\n\n') ?? ag.intro, fence(ag.diagram), ...[['Components', ag.components], ['Permissions', ag.permissions], ['Validation Gates', ag.gates], ['Human Approval', ag.humanApproval], ['Audit Trail', ag.auditTrail], ['Privacy', ag.privacy], ['Failure Handling', ag.failure], ['Agent ทำได้จริง', ag.canDo], ['ต้องทำโดยมนุษย์', ag.humanDo], ['Implementation Plan', ag.plan], ['Acceptance Criteria', ag.acceptance]].map(([h, a]) => `### ${h}\n\n${li(a)}`), '### Tools', mdTable(['Tool', 'ใช้ทำอะไร', 'ต้องมี'], ag.tools.map(t => [t.name, t.purpose, t.needs])), '### Test Plan', tests(ag.testPlan)].join('\n\n')));
// dashboard (standalone single file built from the same dashboard code as the web app)
files.push(write('dashboard/README.md', [head(db.title), (db.readme || []).join('\n\n'), '## Data Flow', nl(db.dataFlow), '## โหมด', db.modes.map(m => `- **${m.name}:** ${m.desc}${m.requires ? '\n' + m.requires.map(r => `  - ${r}`).join('\n') : ''}`).join('\n'), '## JSON Contract', fence(db.jsonContract, 'json'), '## Security', li(db.security), '## States', li(db.states), '## Acceptance Tests', tests(db.tests), '## ไฟล์ในโฟลเดอร์นี้', '- `index.html` — Dashboard แบบไฟล์เดียว (Prototype: ข้อมูลตัวอย่าง + อัปโหลดไฟล์ Excel/CSV ของคุณ) เปิดด้วยเบราว์เซอร์ได้ทันที ต้องมี `xlsx.full.min.js` (SheetJS) อยู่โฟลเดอร์เดียวกันเพื่ออ่าน/Export Excel', '- Dashboard ฉบับเดียวกันอยู่ใน Web App หลักสูตรที่ `#/x/dashboard`'].join('\n\n')));
const appJs = fs.readFileSync(path.join(ROOT, 'src', 'excel.js'), 'utf8');
const dashCode = appJs.slice(appJs.indexOf('// ---------- Interactive Dashboard'));
const css = fs.readFileSync(path.join(ROOT, 'src', 'app.css'), 'utf8');
const icons = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'icons.json'), 'utf8'));
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${Object.entries(icons).filter(([k]) => dashCode.includes(`'${k}'`)).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="currentColor">${v}</symbol>`).join('')}</svg>`;
const dashHTML = `<!doctype html><html lang="th" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Farm Performance Dashboard (Prototype)</title>
<style>${css}\nbody{padding:16px}main{max-width:1200px;margin:0 auto}</style></head><body>${sprite}<main><h1>Farm Performance Dashboard</h1><p class="short">Prototype จากหลักสูตร AI + Excel Formula Mastery · ข้อมูลตัวอย่าง (สมมติ) หรืออัปโหลดไฟล์ Raw_Data ของคุณ · ไม่เชื่อมต่อแหล่งข้อมูลอัตโนมัติ</p><div id="dash"></div><p class="copy-line">© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret</p></main><div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
<script>(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=(n,c='')=>'<svg class="ic '+c+'" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-'+n+'"/></svg>';
const fmt=(v,d=2,min=0)=>Number.isFinite(v)?new Intl.NumberFormat('th-TH',{maximumFractionDigits:d,minimumFractionDigits:min}).format(v):'—';
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{t.hidden=true},2600)};
let xp;const loadXLSX=()=>window.XLSX?Promise.resolve(window.XLSX):(xp||(xp=new Promise((res,rej)=>{const s=document.createElement('script');s.src='xlsx.full.min.js';s.onload=()=>res(window.XLSX);s.onerror=()=>{xp=null;rej(new Error('ไม่พบ xlsx.full.min.js ในโฟลเดอร์เดียวกัน'))};document.head.appendChild(s)})));
const xfmt=(v,d=2)=>typeof v==='number'?(Number.isInteger(v)?fmt(v,0):fmt(v,d,d)):esc(v);
${dashCode.replace(/<\/script/gi, '<\\/script')}
initXDash($('#dash'),{sample:${JSON.stringify(sample).replace(/</g, '\\u003c')}});
})();</script></body></html>`;
fs.mkdirSync(path.join(OUT, 'dashboard'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'dashboard', 'index.html'), dashHTML); files.push('dashboard/index.html');
fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.full.min.js'), path.join(OUT, 'dashboard', 'xlsx.full.min.js')); files.push('dashboard/xlsx.full.min.js');
// tests
const allF = LEVELS.flatMap(lv => allFormulas(L[lv.key]).map(F => ({ F, lv })));
files.push(write('tests/formula-test-cases.md', [head('Formula Test Cases', `ผลการตรวจ ${fR.generatedAt}`), `- สูตรทั้งหมด ${fR.formulas} สูตร · กรณีทดสอบ ${fR.tests} กรณี`, `- ตรวจด้วย ${fR.engine}: ผ่าน ${fR.libreoffice.passed}/${fR.libreoffice.tests} กรณี`, `- ยังไม่ได้ทดสอบใน Excel จริง: ${fR.notTestedInExcel.formulas} สูตร (${fR.notTestedInExcel.why})`, `- ไฟล์ตัวอย่าง: สูตร ${wR.passed}/${wR.formulaCells} เซลล์ตรงกับค่าที่คำนวณแยกด้วย Python (คำนวณใหม่ใน LibreOffice)`, ...LEVELS.map(lv => `## ${lv.th}\n\n${allF.filter(x => x.lv.key === lv.key).map(x => formulaMD(x.F)).join('\n\n')}`)].join('\n\n')));
files.push(write('tests/acceptance-criteria.md', [head('Acceptance Criteria และ Test Plan'), '## ต้นฉบับ', spec.S.s18, '## สถานะจริง', mdTable(['Acceptance Criteria', 'สถานะ', 'หลักฐาน / หมายเหตุ'], deliverablesRows(L, fR, wR)),
  '## Test Plan', nl(['`node scripts/excel/verify-formulas.mjs` — ตรวจสคีมา จำนวนบท/Workshop/แบบทดสอบ และคำนวณทุกกรณีทดสอบของสูตรคลาสสิกด้วย LibreOffice', '`python3 scripts/excel/make_workbook.py && python3 scripts/excel/verify_workbook.py` — สร้างไฟล์ตัวอย่างและเทียบผลทุกเซลล์สูตร', '`npm run audit` — ตรวจว่าต้นฉบับทุกส่วน (รวม Prompt 24 บล็อก) แสดงใน Web App ครบ', '`node tests/e2e.mjs` — ทดสอบหน้า Excel, Prompt Library, Formula Lab, Quiz, Progress, Dashboard (กรอง/Export/อัปโหลด/Error), ออฟไลน์ และ Responsive']), '## ยังไม่ได้ทดสอบ', li(['สูตร Microsoft 365 / Excel 2021+ (XLOOKUP, FILTER, LET, LAMBDA, MAP, GROUPBY ฯลฯ) ยังไม่ได้รันใน Excel จริง — ตรวจตรรกะด้วยกรณีทดสอบเท่านั้น', 'Power Query M Code, Office Scripts และ Power Automate Flow เป็นแม่แบบ ยังไม่ได้รันในบัญชี Microsoft 365 จริง', 'Dashboard ทดสอบใน Chromium (Desktop/Mobile) เท่านั้น ยังไม่ได้ทดสอบบน Safari/Firefox', 'การเปิดไฟล์ sample-workbook.xlsx ใน Microsoft Excel จริง (ตรวจด้วย LibreOffice)'])].join('\n\n')));
// README
files.push(write('README.md', [head('AI + Excel Formula Mastery — ชุดส่งมอบ'), `หลักสูตร 3 ระดับ (Beginner → Intermediate → Advanced) ตามข้อกำหนด \`AI_Excel_3_Levels_Claude_Build_Spec.md\` · Web App อยู่ในแอป Copilot AI Agents for Work ที่ \`#/excel\``, '## สถานะ', li([`บทเรียน ${LEVELS.map(lv => `${lv.name} ${L[lv.key].lessons.length}`).join(' · ')} บท`, `Workshop ${LEVELS.map(lv => `${lv.name} ${L[lv.key].workshops.length}`).join(' · ')} กิจกรรม พร้อมเฉลยและเกณฑ์ตรวจ`, `แบบทดสอบ ${LEVELS.map(lv => `${lv.name} ${L[lv.key].quiz.pre.length}+${L[lv.key].quiz.post.length}`).join(' · ')} ข้อ`, `สูตร ${fR.formulas} สูตร / ${fR.tests} กรณีทดสอบ — LibreOffice ผ่าน ${fR.libreoffice.passed}/${fR.libreoffice.tests} · ยังไม่ได้ทดสอบใน Excel จริง ${fR.notTestedInExcel.formulas} สูตร`, `ไฟล์ตัวอย่าง ${wR.sheets.length} ชีต · สูตร ${wR.passed}/${wR.formulaCells} เซลล์ตรวจผ่าน`]), '## ไฟล์', files.filter(f => f !== 'README.md').concat(['data/sample-workbook.xlsx']).map(f => `- \`${f}\``).join('\n'), '## วิธีสร้างใหม่', fence('python3 scripts/excel/make_workbook.py\npython3 scripts/excel/verify_workbook.py\nnode scripts/excel/verify-formulas.mjs\nnode scripts/excel/export.mjs', 'bash'), '## สิ่งที่ต้องตั้งค่าเพิ่มเติม', li(['Power Query: แก้ FolderPath ให้ชี้โฟลเดอร์จริง และตั้ง Privacy Levels/Credentials', 'Office Scripts / Power Automate: ต้องมี License และสิทธิ์ใน Tenant (ตรวจกับบัญชีจริงก่อนสอน)', 'Dashboard แบบ Production: ต้องสร้าง Pipeline Excel → ETL → JSON/API และระบบสิทธิ์ ตาม dashboard/README.md'])].join('\n\n')));
console.log(`exported ${files.length} files → ai-excel-formula-mastery/`);
