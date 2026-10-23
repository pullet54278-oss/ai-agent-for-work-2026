// AI + Excel Formula Mastery — build-time loader/renderer.
// Source of truth: content/excel/AI_Excel_3_Levels_Claude_Build_Spec.md (rendered verbatim inside .x-src boxes)
// Extensions: content/excel/level-{b,i,a}.mjs, automation.mjs, sample-data.json (rendered inside .supp.x-ext boxes,
// which the completeness audit removes before checking the spec atoms).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { esc, ic, codeHTML } from './render.mjs';
import { quizHTML } from './deep-render.mjs';

const XDIR = 'content/excel';
// Excel content contains literal tags in examples (e.g. "<img src=x onerror=…>" in security tests) → never pass raw HTML through
const XM = new Marked({ gfm: true, breaks: false });
XM.use({ renderer: { html(t) { return esc(typeof t === 'string' ? t : (t.raw ?? t.text)); } } });
const inline = s => XM.parseInline(String(s ?? '').trim()).replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
export function tableHTML(rows, opts = {}) {
  const [head, ...body] = rows;
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(opts.label || 'ตาราง')}"><table class="tbl ${opts.cls || ''}"><thead><tr>${head.map(h => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map((c, i) => i === 0 && opts.rowHeader !== false ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
// web rules (CLAUDE.md): no job titles on the site → same wording rule as the deep lessons
export const X_SANITIZE = [[/หัวหน้างาน/g, 'ผู้รับผิดชอบงาน']];
const clean = s => X_SANITIZE.reduce((t, [re, to]) => t.replace(re, to), String(s));

export const VERSION_TH = {
  all: 'ทุกเวอร์ชัน', '2010+': 'Excel 2010 ขึ้นไป', '2013+': 'Excel 2013 ขึ้นไป', '2016+': 'Excel 2016 ขึ้นไป', '2019+': 'Excel 2019 ขึ้นไป',
  '2021+': 'Excel 2021 / 2024 / Microsoft 365', '2024+': 'Excel 2024 / Microsoft 365', m365: 'Microsoft 365 เท่านั้น'
};
export const LEVELS = [
  { key: 'b', code: 'B', ch: 202, name: 'Beginner', th: 'ระดับ 1 · Beginner', sub: 'เปลี่ยนภาษาคนเป็นสูตร Excel', icon: 'calculator', pass: 'ถูกต้อง ≥ 80%' },
  { key: 'i', code: 'I', ch: 203, name: 'Intermediate', th: 'ระดับ 2 · Intermediate', sub: 'สูตรซ้อน + วิเคราะห์หลายตาราง', icon: 'table', pass: 'ถูกต้อง ≥ 85%' },
  { key: 'a', code: 'A', ch: 204, name: 'Advanced', th: 'ระดับ 3 · Advanced', sub: 'LET, LAMBDA, Power Query, Automation, Dashboard', icon: 'flowchart', pass: 'ผ่าน Acceptance Tests' }
];

// ---------- spec parsing ----------
export function loadSpec(root) {
  const md = clean(fs.readFileSync(path.join(root, XDIR, 'AI_Excel_3_Levels_Claude_Build_Spec.md'), 'utf8'));
  const lines = md.split('\n');
  const sec = {}; const prompts = {}; const order = [];
  let cur = 'pre', curP = null;
  const push = (k, l) => { (sec[k] ||= []).push(l); };
  for (const l of lines) {
    let m;
    if ((m = l.match(/^# (LEVEL \d)/))) { cur = m[1]; curP = null; order.push(cur); push(cur, l); continue; }
    if ((m = l.match(/^## (\d+)\. /))) { cur = 's' + m[1]; curP = null; order.push(cur); push(cur, l); continue; }
    if ((m = l.match(/^### ([BIA]0\d) /))) { curP = m[1]; (prompts[curP] ||= []).push(l); push(cur, l); continue; }
    if (/^## /.test(l) || /^# /.test(l)) curP = null;
    if (curP && /^(---|##)/.test(l)) curP = null;
    if (curP) prompts[curP].push(l);
    push(cur, l);
  }
  const S = Object.fromEntries(Object.entries(sec).map(([k, v]) => [k, v.join('\n').replace(/\n---\s*$/, '').trim()]));
  const P = Object.fromEntries(Object.entries(prompts).map(([k, v]) => [k, v.join('\n').trim()]));
  return { md, S, P, order };
}

// ---------- markdown → html (verbatim, no text dropped) ----------
function listHTML(t) {
  const tag = t.ordered ? 'ol' : 'ul';
  return `<${tag} class="${t.ordered ? 'olist' : 'ulist'}${t.items.some(i => i.task) ? ' tasks' : ''}">${t.items.map(it => {
    const inner = it.tokens.filter(x => x.type !== 'checkbox').map(x => x.type === 'text' ? inline(x.text) : x.type === 'list' ? listHTML(x) : tokensHTML([x])).join('');
    return `<li>${it.task ? `<span class="tk" aria-hidden="true">${it.checked ? '☑' : '☐'}</span>` : ''}${inner}</li>`;
  }).join('')}</${tag}>`;
}
function tokensHTML(tokens, label = 'Prompt') {
  let lastHead = label;
  return tokens.map(t => {
    if (t.type === 'space' || t.type === 'hr' || t.type === 'checkbox') return '';
    if (t.type === 'html') return `<p>${esc(t.raw)}</p>`;
    if (t.type === 'heading') { lastHead = t.text.replace(/\*\*/g, ''); return t.depth <= 2 ? `<h2 class="sec">${inline(t.text)}</h2>` : `<h3 class="sub">${inline(t.text)}</h3>`; }
    if (t.type === 'paragraph') return `<p>${inline(t.text).replace(/\n/g, '<br>')}</p>`;
    if (t.type === 'list') return listHTML(t);
    if (t.type === 'code') return codeHTML(t.text, /^[BIA]0\d/.test(lastHead) ? lastHead : /Master Prompt/.test(lastHead) ? 'Master Prompt' : /Framework/.test(lastHead) ? 'Prompt Framework' : /โครงสร้าง/.test(lastHead) ? 'โครงสร้างไฟล์' : /คำสั่งสุดท้าย/.test(lastHead) ? 'คำสั่งสุดท้าย' : label);
    if (t.type === 'table') return tableHTML([t.header.map(h => h.text), ...t.rows.map(r => r.map(c => c.text))], { rowHeader: false });
    if (t.type === 'blockquote') return `<blockquote class="x-quote">${tokensHTML(t.tokens)}</blockquote>`;
    if (t.type === 'text') return `<p>${inline(t.text)}</p>`;
    throw new Error('excel md: unhandled token ' + t.type);
  }).join('\n');
}
export const mdHTML = (md, label) => tokensHTML(XM.lexer(md), label);
const src = (md, title = 'ต้นฉบับ (Source of Truth)') => `<section class="x-src"><div class="x-src-tag">${ic('book_open')}<span>${esc(title)}</span></div>${mdHTML(md)}</section>`;
let extN = 0;
const ext = (title, body, icon = 'hat_graduation') => { const id = 'xe' + (++extN); return `<section class="supp x-ext" aria-labelledby="${id}"><div class="supp-in"><div class="supp-head"><h2 id="${id}">${ic(icon)}<span>${esc(title)}</span></h2><span class="supp-tag">ส่วนขยายการเรียนรู้ · เพิ่มเติมจากต้นฉบับ</span></div>${body}</div></section>`; };
const paras = a => (a || []).map(p => `<p>${inline(p)}</p>`).join('');
const ul = (a, cls = 'ulist') => `<ul class="${cls}">${(a || []).map(x => `<li>${inline(x)}</li>`).join('')}</ul>`;
const ol = (a, cls = 'olist') => `<ol class="${cls}">${(a || []).map(x => `<li>${inline(x)}</li>`).join('')}</ol>`;
const verPill = v => `<span class="xver v-${esc(v.replace(/\W/g, ''))}" title="${esc(VERSION_TH[v] || v)}">${ic('info')}<span>${esc(VERSION_TH[v] || v)}</span></span>`;
const fmtVal = v => v == null ? '(ว่าง)' : typeof v === 'object' && !Array.isArray(v) && 'round' in v ? `≈ ${v.value} (ปัด ${v.round} ตำแหน่ง)` : Array.isArray(v) ? v.map(r => r.join(' | ')).join(' ⏎ ') : typeof v === 'string' && /^dt?:/.test(v) ? v.replace(/^dt?:/, '') : String(v);

// ---------- formula card (shared by lessons, techniques and the Formula Lab) ----------
export function formulaCard(F, status = {}) {
  const st = F.engine === 'm365'
    ? `<span class="xstat m365" title="LibreOffice 24.2 ไม่รองรับฟังก์ชันนี้">${ic('warning')}<span>ยังไม่ได้ทดสอบใน Excel จริง · ตรวจตรรกะด้วยกรณีทดสอบ</span></span>`
    : status.failed ? `<span class="xstat bad">${ic('dismiss_circle')}<span>ไม่ผ่าน ${status.failed} กรณี</span></span>`
      : status.passed ? `<span class="xstat ok">${ic('checkmark_circle')}<span>ผ่านการคำนวณจริง ${status.passed}/${status.passed} กรณี (LibreOffice)</span></span>` : '';
  const cells = t => Object.entries(t.cells || {}).map(([k, v]) => `<code>${esc(k)}=${esc(fmtVal(v))}</code>`).join(' ') || '<span class="hint">(ไม่มีข้อมูล)</span>';
  return `<article class="xf" id="xf-${esc(F.id)}" data-ver="${esc(F.versions)}" data-engine="${F.engine === 'm365' ? 'm365' : 'lo'}"><div class="xf-h"><h3>${inline(F.title)}</h3>${verPill(F.versions)}${st}</div>
  ${codeHTML(F.formula, `สูตร · วางที่ ${F.cell}`, 'xf-code')}
  ${F.explain && F.explain.length ? `<details class="xf-d" open><summary>อธิบายทีละส่วน</summary>${ol(F.explain)}</details>` : ''}
  ${F.assumptions && F.assumptions.length ? `<p class="xf-k"><b>ข้อสมมติ</b></p>${ul(F.assumptions)}` : ''}
  <div class="table-wrap" tabindex="0" role="region" aria-label="กรณีทดสอบ ${esc(F.id)}"><table class="tbl xf-t"><thead><tr><th scope="col">กรณีทดสอบ</th><th scope="col">ข้อมูลนำเข้า</th><th scope="col">ผลที่คาดหวัง</th></tr></thead><tbody>${(F.tests || []).map(t => `<tr><td>${esc(t.name)}</td><td>${cells(t)}</td><td><code>${esc(fmtVal(t.expect))}</code></td></tr>`).join('')}</tbody></table></div>
  ${F.legacy ? `<p class="xf-k"><b>ทางเลือกสำหรับ Excel รุ่นเก่า:</b> ${inline(F.legacy)}</p>` : ''}</article>`;
}

// ---------- pages ----------
export async function buildExcel(root) {
  extN = 0;
  const spec = loadSpec(root);
  const load = async f => (await import(pathToFileURL(path.join(root, XDIR, f)).href + '?t=' + Date.now())).default;
  const L = {}; for (const lv of LEVELS) L[lv.key] = await load(`level-${lv.key}.mjs`);
  const auto = await load('automation.mjs');
  const sample = JSON.parse(fs.readFileSync(path.join(root, XDIR, 'sample-data.json'), 'utf8'));
  const repF = path.join(root, 'docs', 'excel-formula-report.json'), repW = path.join(root, 'docs', 'excel-workbook-report.json');
  const fReport = fs.existsSync(repF) ? JSON.parse(fs.readFileSync(repF, 'utf8')) : null;
  const wReport = fs.existsSync(repW) ? JSON.parse(fs.readFileSync(repW, 'utf8')) : null;
  // per-formula verification status from the LibreOffice run (only when the report is current: no failures pending)
  const status = {};
  if (fReport) for (const r of [...(fReport.fails || [])]) { (status[r.id] ||= { passed: 0, failed: 0 }).failed++; }
  const passIds = new Set();
  if (fReport && fReport.libreoffice && fReport.libreoffice.tests) {
    // report stores fails only; passed = tests − fails for LO formulas
    for (const lv of LEVELS) for (const F of allFormulas(L[lv.key])) if (F.engine !== 'm365') { const s = (status[F.id] ||= { passed: 0, failed: 0 }); s.passed = (F.tests || []).length - s.failed; passIds.add(F.id); }
  }
  const pages = []; const chapters = [];
  const addCh = (n, key, title, en, desc, icon) => { const c = { n, key, title, en, desc, icon, pages: [] }; chapters.push(c); return c; };
  const addPage = (c, slug, title, short, html, kind = 'lesson', code = '') => { const n = c.n * 100 + c.pages.length + 1; /* 20101…: no clash with deep 1001–1036 */ c.pages.push(n); pages.push({ n, slug, title, short, html, kind, code, chapter: c.n }); return n; };

  // 201 · course start
  const c0 = addCh(201, 'x0', 'เริ่มต้นหลักสูตร AI + Excel', 'Course Map', 'เป้าหมาย ผลลัพธ์ที่ส่งมอบ Master Prompt และ Prompt Framework มาตรฐาน', 'compass_northwest');
  const lvTable = tableHTML([['ระดับ', 'หัวข้อ', 'บทเรียน', 'สูตร (มีกรณีทดสอบ)', 'Workshop', 'แบบทดสอบ', 'เกณฑ์ผ่าน'], ...LEVELS.map(lv => { const X = L[lv.key]; const nf = allFormulas(X).length; return [lv.th, lv.sub, String(X.lessons.length), String(nf), String(X.workshops.length), `${X.quiz.pre.length} + ${X.quiz.post.length} ข้อ`, lv.pass]; })], { rowHeader: true, label: 'Course Map' });
  addPage(c0, 'start', 'AI + Excel Formula Mastery: Course Map', 'ภาพรวมหลักสูตร 3 ระดับ ผลลัพธ์ที่ต้องส่งมอบ และหลักการทำงาน',
    src(spec.S.pre + '\n\n' + spec.S.s0) + ext('Course Map และวิธีเรียน', `${lvTable}${ol([
      '**ลำดับแนะนำ:** ทำแบบทดสอบก่อนเรียน → อ่านบทเรียนทีละบท (ลองสูตรใน Formula Lab และไฟล์ตัวอย่าง) → ทำ Workshop พร้อมตรวจกับเฉลย → แบบทดสอบหลังเรียน → เทียบคะแนนก่อน/หลัง',
      '**หลักการ 7 ขั้น:** Goal → Schema → Formula/Tool Selection → Build → Validate → Optimize → Automate ใช้กับทุกโจทย์ ไม่ว่าจะเขียนสูตรเองหรือให้ AI ช่วย',
      '**ไฟล์ฝึก:** ดาวน์โหลด `sample-workbook.xlsx` ที่หน้า "ไฟล์ Excel ตัวอย่าง" (มีชีต Raw_Data, Master_Data, Calculations, Validation, Dashboard, Instructions ตามข้อกำหนด)',
      '**ป้ายเวอร์ชัน:** ทุกสูตรบอกเวอร์ชัน Excel ที่รองรับ — ฟังก์ชันใหม่ (เช่น XLOOKUP, FILTER, LET, LAMBDA, GROUPBY) อาจไม่มีใน Excel รุ่นเก่า ให้ใช้สูตรทางเลือกที่ระบุไว้ (ตรวจกับเวอร์ชันจริงก่อนสอน)',
      '**การตรวจสอบ:** สูตรที่ใช้ฟังก์ชันคลาสสิกผ่านการคำนวณจริงด้วย LibreOffice ตามกรณีทดสอบทุกข้อ ส่วนสูตร Microsoft 365 ระบุว่า "ยังไม่ได้ทดสอบใน Excel จริง"'
    ])}`, 'compass_northwest'), 'overview', 'START');
  addPage(c0, 'master-prompt', 'Master Prompt และ Prompt Framework มาตรฐาน', 'Prompt สำหรับเริ่มโปรเจกต์ และโครง Prompt 8 ช่องที่ใช้ได้ทั้ง 3 ระดับ',
    src(spec.S.s1 + '\n\n' + spec.S.s2) + ext('วิธีใช้ Prompt Framework ให้ได้สูตรที่ถูกต้อง', `${ol([
      '**เติมทุกช่องให้ครบ** โดยเฉพาะ "ข้อมูล" (ชื่อชีต คอลัมน์ ชนิดข้อมูล ตัวอย่าง 3–5 แถว) และ "เวอร์ชัน" — AI จะเลือกฟังก์ชันได้ตรงกับ Excel ที่ใช้จริง',
      '**รูปแบบสูตร:** ถ้าเครื่องตั้งค่าภูมิภาคที่ใช้ `;` คั่นอาร์กิวเมนต์ ให้บอก AI เพราะสูตรที่ได้จะวางแล้วใช้ได้ทันที',
      '**กฎธุรกิจต้องชัด:** นิยาม KPI หน่วย การนับวัน (Day 0/Day 1) การจัดการค่าว่าง/ซ้ำ — ถ้าไม่บอก AI จะเดา',
      '**ขอให้ AI ทดสอบ 5 แบบ:** ค่าปกติ ค่าว่าง ข้อมูลซ้ำ ค่าขอบเขต และ Error แล้วนำกรณีเหล่านั้นมาลองในไฟล์จริงเสมอ',
      '**ตรวจด้วยมนุษย์ก่อนใช้งานจริง:** อ่านคำอธิบายทีละส่วน เทียบกับข้อมูลที่รู้คำตอบ และบันทึกเวอร์ชันสูตร'
    ])}<p class="hint">ลองเติม Framework แบบโต้ตอบได้ที่หน้า Prompt Library</p>`, 'edit'), 'overview', 'PROMPT');

  // 202–204 · levels
  for (const lv of LEVELS) {
    const X = L[lv.key]; const c = addCh(lv.ch, 'x' + lv.key, lv.th, lv.sub, lv.sub, lv.icon);
    const lvSpec = spec.S['LEVEL ' + ({ b: 1, i: 2, a: 3 }[lv.key])];
    const goals = { b: ['s3', 's4'], i: ['s7', 's8'], a: ['s11', 's12'] }[lv.key].map(k => spec.S[k]).join('\n\n');
    const lessonCards = `<ul class="toc-cards x-cards">${X.lessons.map((l, i) => `<li><a class="toc-card" href="#/x/${lv.key}${i + 1}"><span class="tc-ic">${ic(l.icon || lv.icon)}</span><span class="tc-b"><small>${lv.code}${i + 1} · บทเรียน</small><b>${esc(l.title)}</b><span class="tc-s">${esc((l.objectives || [])[0] || '')}</span></span></a></li>`).join('')}</ul>`;
    addPage(c, `${lv.key}-overview`, `${lv.th}: ${lv.sub}`, 'เป้าหมายการเรียนรู้ Function Map และแผนบทเรียนของระดับนี้',
      src(lvSpec + '\n\n' + goals) + ext('แผนบทเรียนระดับนี้', lessonCards + `<p class="hint">เกณฑ์ผ่านของระดับนี้: ${esc(lv.pass)} · ดู Workshop และแบบทดสอบท้ายระดับ</p>`, 'text_bullet_list_square'), 'overview', lv.code + '0');
    X.lessons.forEach((l, i) => {
      const fx = (l.formulas || []).map(F => formulaCard(F, status[F.id])).join('');
      const body = `<div class="x-sec"><h2 class="sec">${ic('target_arrow')}<span>Learning Objectives</span></h2>${ul(l.objectives)}<h3 class="sub">Prerequisites</h3>${ul(l.prerequisites)}</div>
      <div class="x-sec"><h2 class="sec">${ic('lightbulb')}<span>Concepts</span></h2>${paras(l.concepts)}</div>
      <div class="x-sec"><h2 class="sec">${ic('table')}<span>Function Reference</span></h2>${tableHTML([['ฟังก์ชัน', 'รูปแบบ (Syntax)', 'ใช้ทำอะไร', 'เวอร์ชัน'], ...(l.functions || []).map(f => [`**${f.name}**`, '`' + f.syntax + '`', f.purpose, VERSION_TH[f.versions] || f.versions])], { label: 'Function Reference' })}</div>
      ${(l.prompts || []).length ? `<div class="x-sec"><h2 class="sec">${ic('sparkle')}<span>Copy-ready AI Prompts (เพิ่มเติม)</span></h2>${l.prompts.map(p => codeHTML(p.text, p.title)).join('')}</div>` : ''}
      <div class="x-sec"><h2 class="sec">${ic('calculator')}<span>Formula Examples · เวอร์ชัน · ข้อสมมติ · กรณีทดสอบ</span></h2>${fx}</div>
      <div class="x-sec"><h2 class="sec">${ic('document_text')}<span>Sample Data</span></h2>${l.sampleData ? `<p><b>${inline(l.sampleData.title || '')}</b></p>${tableHTML([l.sampleData.cols, ...l.sampleData.rows.map(r => r.map(v => String(v ?? '')))], { rowHeader: false, label: 'Sample Data' })}` : ''}
      <h3 class="sub">Expected Output</h3>${ul(l.expectedOutput)}</div>
      <div class="x-sec"><h2 class="sec">${ic('shield_checkmark')}<span>Validation</span></h2>${ol(l.validation)}</div>
      <div class="x-sec"><h2 class="sec">${ic('edit')}<span>Exercises + Answer Key</span></h2><ol class="x-ex">${(l.exercises || []).map(e => `<li><p>${inline(e.q)}</p>${e.hint ? `<p class="hint">คำใบ้: ${inline(e.hint)}</p>` : ''}<details class="x-ans"><summary>ดูเฉลย</summary><div>${inline(e.answer).replace(/\n/g, '<br>')}</div></details></li>`).join('')}</ol></div>
      <div class="x-sec"><h2 class="sec">${ic('warning')}<span>Troubleshooting</span></h2>${tableHTML([['อาการ / ปัญหา', 'วิธีแก้'], ...(l.troubleshooting || []).map(t => [t.problem, t.fix])], { label: 'Troubleshooting' })}</div>`;
      const sp = (l.specPrompts || []).map(id => spec.P[id]).filter(Boolean).join('\n\n');
      addPage(c, `${lv.key}${i + 1}`, l.title, (l.objectives || [])[0] || '', (sp ? src(sp, 'Prompt จากต้นฉบับ (Source of Truth)') : '') + ext('บทเรียน: Concepts · Function Reference · Formula Examples · Exercises', body, lv.icon), 'lesson', lv.code + (i + 1));
    });
    // workshops
    const wsSpec = spec.S[{ b: 's6', i: 's10', a: 's14' }[lv.key]];
    const ws = X.workshops.map((w, i) => `<article class="x-ws" id="xw-${esc(w.id)}"><div class="x-ws-h"><span class="step-n">${i + 1}</span><div><h3>${inline(w.title)}</h3><p class="hint">${w.time ? esc(w.time) + ' · ' : ''}${inline(w.data || '')}</p></div></div>
      <p><b>เป้าหมาย:</b> ${inline(w.goal)}</p><h4>ขั้นตอน</h4>${ol(w.steps)}
      <details class="x-ans"><summary>เฉลย (Answer Key)</summary>${ol(w.answer)}</details>
      <h4>เกณฑ์ตรวจ</h4><ul class="vlist">${(w.rubric || []).map(x => `<li><label><input type="checkbox"><span>${inline(x)}</span></label></li>`).join('')}</ul><p class="hint" data-vcount></p></article>`).join('');
    addPage(c, `${lv.key}-workshop`, `Workshop ${lv.name} (${X.workshops.length} กิจกรรม) พร้อมเฉลย`, 'กิจกรรมลงมือทำพร้อมขั้นตอน เฉลย และเกณฑ์ตรวจ', src(wsSpec) + ext('คู่มือ Workshop พร้อมเฉลยและเกณฑ์ตรวจ', ws, 'hat_graduation'), 'workshop', lv.code + 'W');
    // techniques
    const tech = (X.techniques || []).map(t => `<article class="x-tech" id="xt-${esc(t.id)}"><h3>${inline(t.title)}</h3><p><b>ปัญหา:</b> ${inline(t.problem)}</p>${codeHTML(t.prompt, 'Prompt ให้ AI ช่วยสร้าง')}${formulaCard(t.formula, status[t.formula.id])}${t.caution ? `<p class="callout tip">${ic('warning')}<span><b>ข้อควรระวัง:</b> ${inline(t.caution)}</span></p>` : ''}</article>`).join('');
    addPage(c, `${lv.key}-techniques`, `คลังเทคนิคใช้งานจริง ${lv.name} (${(X.techniques || []).length} เทคนิค)`, 'ปัญหาที่เจอบ่อย → Prompt ให้ AI ช่วย → สูตรพร้อมกรณีทดสอบ',
      ext('คลังเทคนิค + Prompt ให้ AI ช่วย', `<p class="hint">แนวหัวข้ออ้างอิงจากชุดหนังสือ Deep Into Function (เพจวิศวกรสร้างภาพ) — คำอธิบาย สูตร และตัวอย่างข้อมูลในหน้านี้เขียนใหม่ทั้งหมดสำหรับหลักสูตรนี้</p>${tech}`, 'lightbulb'), 'techniques', lv.code + 'T');
    // quizzes
    const q4 = (id, title, items, note) => quizHTML(id, title, items.map(([q, opts, a, why], k) => ({ q: `${k + 1}. ${q}`, opts, a, why })), note);
    addPage(c, `${lv.key}-quiz`, `แบบทดสอบก่อน/หลังเรียน ${lv.name}`, `${X.quiz.pre.length} + ${X.quiz.post.length} ข้อ พร้อมเฉลยและคำอธิบาย · เทียบคะแนนก่อน/หลัง`,
      ext('แบบทดสอบ', `<div class="x-cmp" data-xq-compare="${lv.key}"></div>${q4(`xq-${lv.key}-pre`, `แบบทดสอบก่อนเรียน (${X.quiz.pre.length} ข้อ)`, X.quiz.pre, 'ทำก่อนเริ่มบทเรียนเพื่อวัดพื้นฐาน ไม่ต้องกังวลเรื่องคะแนน')}${q4(`xq-${lv.key}-post`, `แบบทดสอบหลังเรียน (${X.quiz.post.length} ข้อ)`, X.quiz.post, `เกณฑ์ผ่านของระดับนี้: ${lv.pass}`)}`, 'question_circle'), 'quiz', lv.code + 'Q');
    if (lv.key === 'a') addAutomation(c, auto, addPage, spec);
  }

  // 205 · tools
  const c5 = addCh(205, 'xt', 'เครื่องมือ Excel', 'Tools', 'Prompt Library, Formula Lab, Interactive Dashboard, ไฟล์ Excel ตัวอย่าง และมาตรฐานคุณภาพ', 'toolbox');
  const libExtra = LEVELS.map(lv => `<h3 class="sub" data-xlv="${lv.key}">${esc(lv.th)} · Prompt เพิ่มเติมจากบทเรียน</h3>${L[lv.key].lessons.flatMap(l => (l.prompts || []).map(p => `<div class="xp-item" data-xlv="${lv.key}">${codeHTML(p.text, `${lv.code} · ${p.title}`)}</div>`)).join('')}`).join('');
  addPage(c5, 'prompts', 'Prompt Library: Prompt ทั้งหมดของหลักสูตร', 'Master Prompt, Framework, B01–B07, I01–I07, A01–A08 และ Prompt เพิ่มเติม · คัดลอกได้ทุกบล็อก',
    `<div class="xp-ctl" data-xlib><div class="input-ic">${ic('search')}<label class="sr-only" for="xpQ">ค้นหา Prompt</label><input id="xpQ" type="search" placeholder="ค้นหา Prompt เช่น XLOOKUP, FCR, Power Query…" autocomplete="off"></div><div class="fchips" role="group" aria-label="กรองระดับ">${[['', 'ทั้งหมด'], ['b', 'Beginner'], ['i', 'Intermediate'], ['a', 'Advanced']].map(([k, t]) => `<button type="button" class="fchip" data-xf="${k}" aria-pressed="${!k}">${t}</button>`).join('')}</div><p class="hint" data-xp-count aria-live="polite"></p></div>
    <div class="xpb" data-xpb></div>
    <div data-xlv="core">${src(spec.S.s1 + '\n\n' + spec.S.s2, 'ต้นฉบับ: Master Prompt + Framework')}</div>
    <div data-xlv="b">${src(spec.S.s5, 'ต้นฉบับ: Beginner Prompts')}</div><div data-xlv="i">${src(spec.S.s9, 'ต้นฉบับ: Intermediate Prompts')}</div><div data-xlv="a">${src(spec.S.s13, 'ต้นฉบับ: Advanced Prompts')}</div>
    ${ext('Prompt เพิ่มเติมจากบทเรียน', libExtra, 'sparkle')}`, 'tool', 'LIB');
  const allF = LEVELS.flatMap(lv => [...L[lv.key].lessons.flatMap((l, i) => (l.formulas || []).map(F => ({ F, lv, where: `${lv.code}${i + 1} · ${l.title}` }))), ...(L[lv.key].techniques || []).map(t => ({ F: t.formula, lv, where: `${lv.code} เทคนิค · ${t.title}` }))]);
  const nLO = allF.filter(x => x.F.engine !== 'm365').length;
  addPage(c5, 'formulas', `Formula Lab: สูตรทั้งหมด ${allF.length} สูตร พร้อมกรณีทดสอบ`, 'ลองสูตรแบบโต้ตอบ กรองตามระดับ/เวอร์ชัน และดูผลการตรวจด้วยการคำนวณจริง',
    `<div class="xlab-wrap">${ext('ลองสูตรแบบโต้ตอบ (คำนวณในเบราว์เซอร์ตามนิยามสูตร)', '<div data-xlab></div>', 'beaker')}</div>
    <div class="xf-ctl" data-xfl><div class="input-ic">${ic('search')}<label class="sr-only" for="xfQ">ค้นหาสูตร</label><input id="xfQ" type="search" placeholder="ค้นหาชื่อสูตร ฟังก์ชัน หรือ KPI…" autocomplete="off"></div>
    <label class="sr-only" for="xfL">ระดับ</label><select id="xfL"><option value="">ทุกระดับ</option>${LEVELS.map(lv => `<option value="${lv.key}">${esc(lv.th)}</option>`).join('')}</select>
    <label class="sr-only" for="xfV">เวอร์ชัน</label><select id="xfV"><option value="">ทุกเวอร์ชัน</option>${Object.entries(VERSION_TH).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
    <p class="hint" data-xf-count aria-live="polite"></p></div>
    <p class="src-note">${ic('info')} ${allF.length} สูตร · ${nLO} สูตรใช้ฟังก์ชันคลาสสิกและผ่านการคำนวณจริงด้วย LibreOffice ตามกรณีทดสอบ · ${allF.length - nLO} สูตรใช้ฟังก์ชัน Microsoft 365/Excel 2021+ ที่เครื่องมือทดสอบไม่รองรับ จึง "ยังไม่ได้ทดสอบใน Excel จริง"</p>
    <div class="xf-list">${allF.map(({ F, lv, where }) => `<div class="xf-wrap" data-xlv="${lv.key}" data-ver="${esc(F.versions)}"><p class="xf-where">${esc(where)}</p>${formulaCard(F, status[F.id])}</div>`).join('')}</div>`, 'tool', 'LAB');
  addPage(c5, 'dashboard', 'Interactive Dashboard: Farm Performance', 'KPI Cards, ตัวกรอง, กราฟ, ตาราง, Export และสถานะข้อมูล · Prototype + อัปโหลดไฟล์ Excel ของคุณ',
    `<div data-xdash></div>` + ext('ขอบเขตของ Dashboard นี้ (อ่านก่อนใช้)', ul([
      '**Prototype:** เปิดครั้งแรกใช้ข้อมูลตัวอย่างชุดเดียวกับชีต Raw_Data ในไฟล์ `sample-workbook.xlsx` (ข้อมูลสมมติ)',
      '**อัปโหลดไฟล์:** เลือกไฟล์ .xlsx/.csv ที่มีชีต Raw_Data และคอลัมน์ตามสคีมา — อ่านในเบราว์เซอร์นี้เท่านั้น ไม่ส่งไฟล์ไปที่ใด',
      '**ไม่อัปเดตข้อมูลต้นทางเอง:** หน้าเว็บแบบ Static ไม่เชื่อมต่อแหล่งข้อมูลจริง ถ้าข้อมูลเปลี่ยนต้องอัปโหลดไฟล์ใหม่ หรือสร้าง Pipeline (Excel → ETL → JSON/API → Dashboard) ตามบท Dashboard ระดับ Advanced',
      '**นิยาม KPI:** FCR = Feed_Cum_kg ÷ ((Body_Weight_g − น้ำหนักลูกไก่) ÷ 1000 × ไก่ที่ยังมีชีวิต) · Mortality % = Mortality_Cum ÷ Birds_Placed × 100 — ยืนยันกับมาตรฐานองค์กรก่อนใช้งานจริง'
    ]), 'shield_checkmark'), 'tool', 'DASH');
  const sheetDesc = [['Instructions', 'วิธีใช้ไฟล์ นิยาม KPI ข้อสมมติ และวันที่รายงาน'], ['Raw_Data', `ข้อมูลผลการเลี้ยงรายสัปดาห์ ${sample.rows.length} แถว (4 ฟาร์ม × 6 ช่วงอายุ) เป็น Excel Table`], ['Master_Data', 'ข้อมูลหลักของฟาร์ม (เป้า FCR) + Product Master'], ['Calculations', 'KPI ต่อแถว สรุปรายฟาร์ม และสถิติน้ำหนัก %CV/P10/P90/IQR'], ['Validation', 'ตัวอย่างข้อมูลมีปัญหา + Data Quality Status (PASS/WARNING/ERROR) พร้อมเหตุผล'], ['Dashboard', 'เลือกฟาร์มแล้ว KPI และกราฟเปลี่ยนตาม'], ['Sales_Data / Product_Master', 'ข้อมูลยอดขายจากต้นฉบับข้อ 15 + แถวทดสอบ'], ['Farm_Performance', 'ตาราง Farm_Performance จากต้นฉบับตามเดิม + ข้อจำกัด'], ['Weight_Samples', 'น้ำหนักไก่ตัวอย่าง 100 ตัว'], ['M365_Formulas', 'สูตร Microsoft 365 เป็นข้อความให้คัดลอกไปลอง + สูตรทางเลือก']];
  addPage(c5, 'workbook', 'ไฟล์ Excel ตัวอย่าง (sample-workbook.xlsx)', 'ดาวน์โหลดไฟล์ฝึกที่มีข้อมูลจริงในไฟล์และสูตรที่ตรวจสอบได้',
    ext('ไฟล์ Excel ตัวอย่าง', `<p><a class="btn btn-primary" href="excel/sample-workbook.xlsx" download>${ic('arrow_download')}<span>ดาวน์โหลด sample-workbook.xlsx</span></a></p>
    ${wReport ? `<p class="xstat ok">${ic('checkmark_circle')}<span>ตรวจแล้ว: สูตร ${wReport.passed}/${wReport.formulaCells} เซลล์ให้ผลตรงกับค่าที่คำนวณแยก (คำนวณใหม่ด้วย LibreOffice) · ${wReport.sheets.length} ชีต</span></p>` : ''}
    ${tableHTML([['ชีต', 'เนื้อหา'], ...sheetDesc], { label: 'ชีตในไฟล์' })}
    <h3 class="sub">นิยาม KPI ที่ใช้ในไฟล์</h3>${ul(['Live_Birds = Birds_Placed − Mortality_Cum', `Weight_Gain_kg = (Body_Weight_g − ${sample.chickWeightG}) ÷ 1000 × Live_Birds (น้ำหนักลูกไก่แรกรับ ${sample.chickWeightG} กรัม ปรับได้)`, 'FCR = Feed_Cum_kg ÷ Weight_Gain_kg (อาหารสะสมตั้งแต่ลงไก่ถึงวันบันทึก)', 'Mortality_% = Mortality_Cum ÷ Birds_Placed × 100 (สะสม)', 'เป็นนิยามเพื่อการเรียน — ยืนยันกับมาตรฐานองค์กรก่อนใช้งานจริง'])}
    <p class="hint">สูตรในชีตหลักใช้ฟังก์ชันที่มีใน Excel 2010 ขึ้นไป (MAXIFS ต้อง Excel 2019+) · ไฟล์ไม่มีค่าที่คำนวณไว้ล่วงหน้า Excel จะคำนวณเมื่อเปิดไฟล์</p>`, 'document_text'), 'tool', 'XLSX');
  addPage(c5, 'quality', 'ข้อมูลตัวอย่างและมาตรฐานคุณภาพ', 'ตัวอย่างข้อมูลสำหรับ Workshop และมาตรฐาน Correctness, Edge Cases, Compatibility, Performance, Privacy, Governance',
    src(spec.S.s15 + '\n\n' + spec.S.s16), 'overview', 'QA');
  addPage(c5, 'deliverables', 'โครงสร้างผลลัพธ์ Acceptance Criteria และสถานะงาน', 'ไฟล์ที่ต้องจัดทำ เกณฑ์ตรวจรับ และสถานะการทดสอบจริงของหลักสูตรนี้',
    src(spec.S.s17 + '\n\n' + spec.S.s18 + '\n\n' + spec.S.s19) + ext('สถานะงานจริงของหลักสูตรนี้', deliverablesHTML(L, fReport, wReport), 'clipboard_task'), 'overview', 'DONE');

  // search text + index
  const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
  const index = pages.map(p => ({ n: p.n, slug: p.slug, title: p.title, short: p.short, kind: p.kind, code: p.code, chapter: p.chapter, text: strip(p.html).slice(0, 3000) }));
  const html = Object.fromEntries(pages.map(p => [p.n, p.html]));
  return { chapters: chapters.map(c => ({ n: c.n, key: c.key, title: c.title, en: c.en, desc: c.desc, icon: c.icon, pages: c.pages })), index, html, sample, spec, levels: L, auto, report: { formulas: allF.length, lo: nLO, m365: allF.length - nLO, pages: pages.length, workbook: wReport ? { passed: wReport.passed, cells: wReport.formulaCells } : null, formulaReport: fReport ? fReport.libreoffice : null } };
}

export const allFormulas = X => [...(X.lessons || []).flatMap(l => l.formulas || []), ...(X.techniques || []).map(t => t.formula)];

function addAutomation(c, A, addPage) {
  const pq = A.powerQuery, os = A.officeScripts, pa = A.powerAutomate, db = A.dashboard, ag = A.agent;
  const tests = (arr, cols = ['กรณีทดสอบ', 'การตั้งค่า / ขั้นตอน', 'ผลที่คาดหวัง']) => tableHTML([cols, ...(arr || []).map(t => [t.name, [t.setup, t.steps].flat().filter(Boolean).join(' · '), t.expect])], { label: 'กรณีทดสอบ' });
  const tsl = arr => (arr || []).map(t => typeof t === 'string' ? t : `${t.problem || t.name}: ${t.fix || t.expect || ''}`);
  addPage(c, 'a-power-query', pq.title, 'ETL รวมไฟล์รายวันจากโฟลเดอร์ ตรวจ Schema แยก Error Rows เก็บ Source File และ Refresh Timestamp',
    ext('คู่มือ Power Query (automation/power-query-guide.md)', `${paras(pq.intro)}<h3 class="sub">สิ่งที่ต้องมี</h3>${ul(pq.prerequisites)}<h3 class="sub">Schema ที่คาดหวัง</h3>${tableHTML([['คอลัมน์', 'ชนิด', 'กฎ'], ...pq.folderSchema.columns.map(x => [x.name, x.type, x.rule])], { label: 'Schema' })}<h3 class="sub">ขั้นตอนบนหน้าจอ (ทีละคลิก)</h3>${ol(pq.uiSteps)}${codeHTML(pq.mcode.sample, 'M Code · Parameter FolderPath')}${codeHTML(pq.mcode.main, 'M Code · Query หลัก (รวมไฟล์)')}${codeHTML(pq.mcode.schemaCheck, 'M Code · ตรวจ Schema')}${codeHTML(pq.mcode.errors, 'M Code · Error_Rows')}<h3 class="sub">การ Refresh (อะไรอัตโนมัติ อะไรไม่อัตโนมัติ)</h3>${ul(pq.refresh)}<h3 class="sub">Test Cases</h3>${tests(pq.tests)}<h3 class="sub">Troubleshooting</h3>${ul(tsl(pq.troubleshooting))}<p class="badge-verify" role="note">${ic('warning')}<span>โค้ดเป็นแม่แบบให้ปรับใช้ ยังไม่ได้รันในบัญชี/ไฟล์จริงของผู้เรียน</span></p>`, 'flowchart'), 'automation', 'A-PQ');
  addPage(c, 'a-office-scripts', os.title, 'สคริปต์ตรวจ Schema/Data Quality, สรุป KPI + Flag และ Export JSON/Execution Log',
    ext('คู่มือ Office Scripts (automation/office-scripts-guide.md)', `${paras(os.intro)}<h3 class="sub">เงื่อนไขการใช้งาน</h3>${ul(os.requirements)}${os.scripts.map(s => `<h3 class="sub">${esc(s.name)}</h3><p>${inline(s.purpose)}</p>${codeHTML(s.code, 'Office Script · ' + s.name)}${s.returns ? `<p><b>ผลลัพธ์:</b> ${inline(s.returns)}</p>` : ''}${s.notes ? `<p class="hint">${inline(Array.isArray(s.notes) ? s.notes.join(' · ') : s.notes)}</p>` : ''}`).join('')}<h3 class="sub">ข้อจำกัด</h3>${ul(os.limits)}<h3 class="sub">Test Cases</h3>${tests(os.tests)}<p class="badge-verify" role="note">${ic('warning')}<span>สิทธิ์และความพร้อมของ Office Scripts ขึ้นกับ License/การตั้งค่าองค์กร · ตรวจกับบัญชีจริงก่อนสอน · ยังไม่ได้รันสคริปต์ในบัญชีจริง</span></p>`, 'code'), 'automation', 'A-OS');
  addPage(c, 'a-power-automate', pa.title, 'Workflow Excel → Validation → Alert พร้อม Approval, Log, Retry, Idempotency และ Recovery',
    ext('คู่มือ Power Automate Flow (automation/power-automate-flow.md)', `${paras(pa.intro)}<h3 class="sub">Architecture</h3>${ol(pa.architecture)}${codeHTML(pa.diagram, 'Flow Diagram')}<h3 class="sub">Trigger</h3>${ul(pa.trigger.options)}<p><b>แนะนำ:</b> ${inline(pa.trigger.recommended)}</p><h3 class="sub">Actions</h3>${tableHTML([['ขั้น', 'Connector', 'Action', 'รายละเอียด'], ...pa.actions.map(a => [String(a.step), a.connector, a.action, a.detail])], { rowHeader: false, label: 'Actions' })}
    ${[['Connectors', pa.connectors], ['Permissions', pa.permissions], ['DLP', pa.dlp], ['Retry', pa.retry], ['Idempotency', pa.idempotency], ['Recovery Plan', pa.recovery], ['Human Approval', pa.approval], ['ทางเลือกเมื่อ Connector ถูกบล็อก', pa.alternatives]].map(([h, a]) => `<h3 class="sub">${esc(h)}</h3>${ul(a)}`).join('')}<h3 class="sub">Test Cases</h3>${tests(pa.tests)}<p class="badge-verify" role="note">${ic('warning')}<span>ชื่อ Connector/Action และ License ขึ้นกับ Tenant · ตรวจกับบัญชีจริงก่อนสอน · ยังไม่ได้สร้าง Flow ในบัญชีจริง</span></p>`, 'flowchart'), 'automation', 'A-PA');
  addPage(c, 'a-dashboard-design', db.title, 'Data Flow จริง Excel → ETL → JSON/API → HTML Dashboard, Prototype vs Production, Security และ Acceptance Tests',
    ext('คู่มือออกแบบ Dashboard (dashboard/README.md)', `${paras(db.intro)}<h3 class="sub">Data Flow</h3>${ol(db.dataFlow)}<h3 class="sub">โหมดการใช้งาน</h3>${db.modes.map(m => `<div class="callout">${ic('info')}<div><b>${esc(m.name)}</b><p>${inline(m.desc)}</p>${m.requires ? ul(m.requires) : ''}</div></div>`).join('')}${codeHTML(db.jsonContract, 'JSON Contract ของ Data Feed')}<h3 class="sub">Security</h3>${ul(db.security)}<h3 class="sub">Loading / Error / Empty / Stale States</h3>${ul(db.states)}<h3 class="sub">Acceptance Tests</h3>${tests(db.tests)}<p><a class="btn btn-primary" href="#/x/dashboard">${ic('data_bar_vertical')}<span>เปิด Interactive Dashboard</span></a></p>`, 'data_bar_vertical'), 'automation', 'A-DB');
  addPage(c, 'a-ai-agent', ag.title, 'Tools, Permissions, Validation Gates, Human Approval, Audit Trail, Privacy และ Failure Handling',
    ext('สถาปัตยกรรม AI Agent สำหรับ Excel (A08)', `${paras(ag.intro)}${codeHTML(ag.diagram, 'Architecture Diagram')}<h3 class="sub">องค์ประกอบ</h3>${ul(ag.components)}<h3 class="sub">Tools</h3>${tableHTML([['Tool', 'ใช้ทำอะไร', 'ต้องมี'], ...ag.tools.map(t => [t.name, t.purpose, t.needs])], { label: 'Tools' })}
    ${[['Permissions', ag.permissions], ['Validation Gates (ตามลำดับ)', ag.gates], ['Human Approval', ag.humanApproval], ['Audit Trail', ag.auditTrail], ['Data Privacy', ag.privacy], ['Failure Handling', ag.failure], ['สิ่งที่ Agent ทำได้จริง (เมื่อมี Connector/Code Runtime)', ag.canDo], ['ขั้นตอนที่ต้องทำโดยมนุษย์', ag.humanDo], ['Implementation Plan', ag.plan], ['Acceptance Criteria', ag.acceptance]].map(([h, a]) => `<h3 class="sub">${esc(h)}</h3>${ul(a)}`).join('')}<h3 class="sub">Test Plan</h3>${tests(ag.testPlan)}`, 'bot'), 'automation', 'A-AG');
}

export function deliverablesRows(L, fR, wR) {
  const n = k => L[k];
  return [
    ['ครบ 3 ระดับ + Course Map', 'ทำแล้ว', `${LEVELS.map(lv => `${lv.name} ${n(lv.key).lessons.length} บท`).join(' · ')} · หน้า Course Map`],
    ['Prompt B01–B07, I01–I07, A01–A08 ครบ ไม่ถูกตัด', 'ทำแล้ว · ตรวจอัตโนมัติ', 'แสดงต้นฉบับทุกตัวอักษรใน Prompt Library และในบทเรียน · audit ตรวจทุกบล็อก'],
    ['ทุกสูตรระบุ Input/Output, เวอร์ชัน, สมมติฐาน, วิธีตรวจ', 'ทำแล้ว', 'ทุกสูตรมีป้ายเวอร์ชันและกรณีทดสอบ ≥ 3'],
    ['Workshop ≥ 5 กิจกรรมต่อระดับ พร้อมเฉลย', 'ทำแล้ว', LEVELS.map(lv => `${lv.name} ${n(lv.key).workshops.length}`).join(' · ')],
    ['แบบทดสอบ ≥ 10 ข้อต่อระดับ พร้อมเฉลย', 'ทำแล้ว', LEVELS.map(lv => `${lv.name} ก่อน ${n(lv.key).quiz.pre.length} + หลัง ${n(lv.key).quiz.post.length}`).join(' · ')],
    ['ตัวอย่าง Excel มีข้อมูลจริงและสูตรตรวจได้', wR && !wR.failed ? 'ทำแล้ว · ทดสอบแล้ว' : 'ยังไม่ผ่าน', wR ? `สูตร ${wR.passed}/${wR.formulaCells} เซลล์ตรงกับค่าที่คำนวณแยก (LibreOffice)` : '-'],
    ['Power Query ETL, Automation Architecture, Error Handling', 'ทำแล้ว (คู่มือ + โค้ดแม่แบบ)', 'ยังไม่ได้รันในบัญชี Microsoft 365 จริง'],
    ['Dashboard ใช้งานได้จริงตามขอบเขตที่ประกาศ', 'ทำแล้ว · ทดสอบใน Chromium', 'Prototype (ข้อมูลตัวอย่าง) + อัปโหลดไฟล์ · ไม่อ้างการเชื่อมต่อแหล่งข้อมูลจริง'],
    ['Responsive และรองรับภาษาไทย', 'ทำแล้ว · ทดสอบใน Chromium', 'Desktop / Tablet / Mobile, Light/Dark'],
    ['Test Plan และส่วนที่ยังไม่ผ่านการทดสอบ', 'ทำแล้ว', fR ? `สูตรคลาสสิก ${fR.libreoffice.passed}/${fR.libreoffice.tests} กรณีผ่าน LibreOffice · สูตร Microsoft 365 ${fR.notTestedInExcel.formulas} สูตรยังไม่ได้ทดสอบใน Excel จริง` : '-']
  ];
}
function deliverablesHTML(L, fR, wR) {
  const rows = deliverablesRows(L, fR, wR);
  return tableHTML([['Acceptance Criteria', 'สถานะ', 'หลักฐาน / หมายเหตุ'], ...rows], { label: 'สถานะงาน' }) + `<p class="hint">ไฟล์ส่งมอบตามโครงสร้างข้อ 17 อยู่ในโฟลเดอร์ <code>ai-excel-formula-mastery/</code> ของ repository (สร้างจากข้อมูลชุดเดียวกับหน้าเว็บ)</p>`;
}

// atoms of the spec (sanitised) for the completeness audit
export function specAtoms(root) {
  const { md } = loadSpec(root);
  return md;
}
