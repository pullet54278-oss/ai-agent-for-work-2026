// Verify the Excel course content (content/excel/level-*.mjs):
//  1. schema + counts required by the spec (lessons, formulas, ≥3 tests each, workshops, 10+10 quiz per level)
//  2. every non-m365 formula test is evaluated by LibreOffice (headless, real recalculation) and compared with `expect`
// Usage: node scripts/excel/verify-formulas.mjs [--level b|i|a] [--no-lo]   → docs/excel-formula-report.json
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
const only = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const noLO = args.includes('--no-lo');

const sb = {}; sb.self = sb; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.full.min.js'), 'utf8'), sb);
const X = sb.XLSX;

export const VERSIONS = ['all', '2010+', '2013+', '2016+', '2019+', '2021+', '2024+', 'm365'];
const NEED = { b: { lessons: 7, workshops: 5 }, i: { lessons: 7, workshops: 6 }, a: { lessons: 8, workshops: 7 } };
const SPEC_IDS = { b: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07'], i: ['I01', 'I02', 'I03', 'I04', 'I05', 'I06', 'I07'], a: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08'] };
// functions stored with the _xlfn. prefix in OOXML (newer than Excel 2007)
const XLFN = 'STDEV.S STDEV.P VAR.S VAR.P IFNA IFS SWITCH MAXIFS MINIFS TEXTJOIN CONCAT PERCENTILE.INC PERCENTILE.EXC QUARTILE.INC QUARTILE.EXC AGGREGATE NETWORKDAYS.INTL WORKDAY.INTL DAYS ISOWEEKNUM CEILING.MATH FLOOR.MATH RANK.EQ RANK.AVG MODE.SNGL NORM.DIST XOR FORMULATEXT ISFORMULA NUMBERVALUE UNICHAR UNICODE XLOOKUP XMATCH FILTER SORT SORTBY UNIQUE SEQUENCE LET LAMBDA MAP BYROW BYCOL REDUCE SCAN MAKEARRAY TEXTSPLIT TEXTBEFORE TEXTAFTER VSTACK HSTACK TOCOL TOROW CHOOSECOLS CHOOSEROWS TAKE DROP GROUPBY PIVOTBY'.split(' ');
const xlfn = f => f.replace(new RegExp(`(^|[^A-Za-z0-9_.])(${XLFN.map(s => s.replace('.', '\\.')).join('|')})\\(`, 'g'), (m, pre, fn) => `${pre}_xlfn.${fn}(`);

const serial = (s, time) => { const [d, t = '00:00'] = s.split(' '); const [y, m, dd] = d.split('-').map(Number); const [hh, mm] = t.split(':').map(Number); return (Date.UTC(y, m - 1, dd) - Date.UTC(1899, 11, 30)) / 864e5 + (time ? (hh * 60 + mm) / 1440 : 0); };
function cellObj(v) {
  if (typeof v === 'number') return { t: 'n', v };
  if (typeof v === 'boolean') return { t: 'b', v };
  if (typeof v === 'string' && v.startsWith('d:')) return { t: 'n', v: serial(v.slice(2)), z: 'yyyy-mm-dd' };
  if (typeof v === 'string' && v.startsWith('dt:')) return { t: 'n', v: serial(v.slice(3), true), z: 'yyyy-mm-dd hh:mm' };
  if (typeof v === 'string' && v.startsWith('=')) return { t: 'n', f: xlfn(v.slice(1)) };
  return { t: 's', v: String(v) };
}

async function loadLevel(k) {
  const f = path.join(ROOT, 'content', 'excel', `level-${k}.mjs`);
  if (!fs.existsSync(f)) return null;
  return (await import(pathToFileURL(f).href + '?t=' + Date.now())).default;
}

const problems = [];
const P = (where, msg) => problems.push(`${where}: ${msg}`);
const formulas = [];
const ids = new Set();
function checkFormula(F, where) {
  if (!F || typeof F !== 'object') return P(where, 'missing formula object');
  for (const k of ['id', 'title', 'formula', 'cell', 'versions']) if (!F[k]) P(where, `formula missing ${k}`);
  if (ids.has(F.id)) P(where, `duplicate id ${F.id}`); ids.add(F.id);
  if (F.formula && !String(F.formula).startsWith('=')) P(where, `formula must start with = (${F.id})`);
  if (!VERSIONS.includes(F.versions)) P(where, `bad versions "${F.versions}" (${F.id})`);
  if (!Array.isArray(F.tests) || F.tests.length < 3) P(where, `needs ≥3 tests (${F.id})`);
  formulas.push({ ...F, where });
}

const levels = {};
for (const k of ['b', 'i', 'a']) {
  if (only && k !== only) continue;
  const L = await loadLevel(k);
  if (!L) { P('level-' + k, 'file missing'); continue; }
  levels[k] = L;
  const w = `level-${k}`;
  if (L.key !== k) P(w, 'key mismatch');
  if ((L.lessons || []).length !== NEED[k].lessons) P(w, `lessons ${L.lessons?.length} ≠ ${NEED[k].lessons}`);
  const used = new Set();
  for (const l of L.lessons || []) {
    const lw = `${w}/${l.id}`;
    for (const key of ['id', 'title', 'objectives', 'prerequisites', 'concepts', 'functions', 'formulas', 'sampleData', 'expectedOutput', 'validation', 'exercises', 'troubleshooting']) if (!l[key] || (Array.isArray(l[key]) && !l[key].length)) P(lw, `missing/empty ${key}`);
    if ((l.formulas || []).length < 3) P(lw, 'needs ≥3 formulas');
    if ((l.exercises || []).length < 3) P(lw, 'needs ≥3 exercises');
    for (const fn of l.functions || []) if (!VERSIONS.includes(fn.versions)) P(lw, `function ${fn.name} bad versions ${fn.versions}`);
    for (const id of l.specPrompts || []) { if (!SPEC_IDS[k].includes(id)) P(lw, `unknown spec prompt ${id}`); used.add(id); }
    (l.formulas || []).forEach(F => checkFormula(F, lw));
  }
  for (const id of SPEC_IDS[k]) if (!used.has(id)) P(w, `spec prompt ${id} not placed in any lesson`);
  for (const t of L.techniques || []) { if (!t.prompt || !t.problem) P(`${w}/${t.id}`, 'technique needs problem + prompt'); checkFormula(t.formula, `${w}/${t.id}`); }
  if ((L.workshops || []).length !== NEED[k].workshops) P(w, `workshops ${L.workshops?.length} ≠ ${NEED[k].workshops}`);
  for (const ws of L.workshops || []) for (const key of ['id', 'title', 'goal', 'steps', 'answer', 'rubric']) if (!ws[key] || (Array.isArray(ws[key]) && !ws[key].length)) P(`${w}/${ws.id}`, `workshop missing ${key}`);
  for (const part of ['pre', 'post']) {
    const q = L.quiz?.[part] || [];
    if (q.length < 10) P(w, `quiz.${part} has ${q.length} < 10`);
    q.forEach((x, i) => { if (!Array.isArray(x) || x.length !== 4 || !Array.isArray(x[1]) || x[1].length !== 4 || !(x[2] >= 0 && x[2] < 4) || !x[3]) P(w, `quiz.${part}[${i}] malformed`); });
  }
}

// ---- LibreOffice evaluation ----
const results = [];
const lo = formulas.filter(F => F.engine !== 'm365');
if (!noLO && lo.length) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlverify-'));
  const inDir = path.join(dir, 'in'), outDir = path.join(dir, 'out'); fs.mkdirSync(inDir); fs.mkdirSync(outDir);
  const jobs = [];
  for (const F of lo) (F.tests || []).forEach((t, ti) => {
    const sheets = { Sheet1: {} };
    for (const [ref, v] of Object.entries(t.cells || {})) { const [sh, c] = ref.includes('!') ? ref.split('!') : ['Sheet1', ref]; (sheets[sh] ||= {})[c] = cellObj(v); }
    sheets.Sheet1[F.cell] = { t: 'n', f: xlfn(String(F.formula).slice(1)) };
    const wb = X.utils.book_new();
    for (const [name, ws] of Object.entries(sheets)) { ws['!ref'] = 'A1:Z300'; X.utils.book_append_sheet(wb, ws, name); }
    const file = `t${String(jobs.length).padStart(4, '0')}.xlsx`;
    fs.writeFileSync(path.join(inDir, file), Buffer.from(X.write(wb, { type: 'array', bookType: 'xlsx' })));
    jobs.push({ F, t, ti, file });
  });
  const files = jobs.map(j => path.join(inDir, j.file));
  for (let i = 0; i < files.length; i += 150) execFileSync('soffice', [`-env:UserInstallation=file://${dir}/profile`, '--headless', '--calc', '--convert-to', 'xlsx', '--outdir', outDir, ...files.slice(i, i + 150)], { stdio: 'ignore', timeout: 600000 }); // own profile: parallel runs don't collide
  const read = (ws, a1) => { const c = ws[a1]; if (!c) return null; if (c.t === 'e') return c.w || '#ERR'; return c.v; };
  for (const j of jobs) {
    const out = path.join(outDir, j.file);
    let got = '(no output)';
    if (fs.existsSync(out)) {
      const ws = X.read(fs.readFileSync(out), { type: 'buffer' }).Sheets.Sheet1;
      const exp = j.t.expect;
      if (Array.isArray(exp)) { const o = X.utils.decode_cell(j.F.cell); got = exp.map((row, r) => row.map((_, c) => read(ws, X.utils.encode_cell({ r: o.r + r, c: o.c + c })))); }
      else got = read(ws, j.F.cell);
    }
    results.push({ id: j.F.id, where: j.F.where, test: j.t.name, formula: j.F.formula, expect: j.t.expect, got, ok: same(j.t.expect, got) });
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
function same(e, g) {
  if (e && typeof e === 'object' && !Array.isArray(e) && 'round' in e) return typeof g === 'number' && Math.abs(Math.round(g * 10 ** e.round) / 10 ** e.round - e.value) < 1e-9;
  if (Array.isArray(e)) return Array.isArray(g) && e.every((row, r) => row.every((v, c) => same(v, g[r] && g[r][c])));
  if (typeof e === 'number') return typeof g === 'number' && Math.abs(e - g) < 1e-6;
  if (typeof e === 'boolean') return g === e;
  return String(g) === String(e);
}

const m365 = formulas.filter(F => F.engine === 'm365');
const fails = results.filter(r => !r.ok);
const report = {
  generatedAt: new Date().toISOString(), engine: noLO ? 'none' : 'LibreOffice (headless recalculation)',
  levels: Object.fromEntries(Object.entries(levels).map(([k, L]) => [k, { lessons: L.lessons.length, formulas: L.lessons.reduce((s, l) => s + l.formulas.length, 0), techniques: (L.techniques || []).length, workshops: L.workshops.length, quiz: (L.quiz.pre.length + L.quiz.post.length) }])),
  formulas: formulas.length, tests: formulas.reduce((s, F) => s + (F.tests || []).length, 0),
  libreoffice: { formulas: lo.length, tests: results.length, passed: results.length - fails.length, failed: fails.length },
  notTestedInExcel: { formulas: m365.length, ids: m365.map(F => F.id), why: 'ฟังก์ชัน Microsoft 365/Excel 2021+ ที่ LibreOffice 24.2 ไม่รองรับ' },
  problems, fails
};
fs.writeFileSync(path.join(ROOT, 'docs', 'excel-formula-report.json'), JSON.stringify(report, null, 2));
console.log(`formulas ${report.formulas} · tests ${report.tests} · LibreOffice ${report.libreoffice.passed}/${report.libreoffice.tests} passed · m365 (not evaluated) ${m365.length} · schema problems ${problems.length}`);
for (const p of problems.slice(0, 40)) console.log('  ✗', p);
for (const f of fails.slice(0, 40)) console.log('  ✗', f.id, '·', f.test, '·', f.formula, '→ got', JSON.stringify(f.got), 'want', JSON.stringify(f.expect));
process.exitCode = problems.length || fails.length ? 1 : 0;
