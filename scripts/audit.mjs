// Content completeness audit: every text atom, prompt block and URL of Part 2 (+ appendices)
// must appear in the rendered app. Runs the real built app in Chromium (Playwright).
// Usage: npm run build && npm run audit   → docs/audit-report.json
import fs from 'node:fs';
import path from 'node:path';
import { parseSource, codeBlocks, urlsOf, ROOT } from './lib/source.mjs';
import { marked } from 'marked';
import { serve, launch } from '../tests/lib.mjs';

const src = parseSource();
const pages = src.chapters.flatMap(c => c.pages);

// ---- atoms ----
const plain = s => String(s)
  .replace(/\[([^\]]*)\]\((https?:[^)]+)\)/g, '$1')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/(?<!\\)_/g, '')
  .replace(/\\([\\_*\[\]()#`>~|.-])/g, '$1');
const squash = s => String(s).replace(/[\s→—]+/g, '');
// Text intentionally replaced by live UI (documented exceptions)
const UI_REPLACED = [
  { re: /^(Name|Description|Instructions)[\d,]+\/[\d,]+\s*(ตัวอักษร)?$/, why: 'ตัวนับตัวอักษรแบบ static ในต้นฉบับ → แอปนับใหม่แบบ live' },
  { re: /^Starter promptsชื่อ: ข้อความ$/, why: 'ป้ายบล็อก Starter prompts → แสดงเป็น "Starter prompts · ชื่อ: ข้อความ"' }
];

function atomsOf(md) {
  const atoms = [];
  const walk = tokens => {
    for (const t of tokens) {
      if (t.type === 'space' || t.type === 'hr' || t.type === 'html') continue;
      if (t.type === 'code') { atoms.push({ kind: 'code', text: t.text }); continue; }
      if (t.type === 'list') { t.items.forEach(it => walk(it.tokens)); continue; }
      if (t.type === 'heading' || t.type === 'paragraph' || t.type === 'text') {
        if (t.tokens && t.type === 'text' && t.tokens.some(x => x.type !== 'text' && x.type !== 'strong' && x.type !== 'em' && x.type !== 'codespan' && x.type !== 'link' && x.type !== 'escape' && x.type !== 'br')) { walk(t.tokens); continue; }
        const p = plain(t.text).trim();
        if (p && squash(p)) atoms.push({ kind: 'text', text: p });
        continue;
      }
      if (t.type === 'table') { atoms.push(...t.header.map(h => ({ kind: 'text', text: plain(h.text) }))); t.rows.forEach(r => r.forEach(c => c.text && atoms.push({ kind: 'text', text: plain(c.text) }))); continue; }
      if (t.tokens) walk(t.tokens);
    }
  };
  walk(marked.lexer(md));
  return atoms;
}

const { srv, url } = await serve();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(e.message));
await page.goto(url);
await page.waitForSelector('.hero');

async function grab(hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForFunction(() => document.querySelector('#main .wrap'));
  await page.waitForTimeout(30);
  return page.evaluate(() => {
    const main = document.querySelector('#main').cloneNode(true);
    main.querySelectorAll('.supp').forEach(s => s.remove()); // supplements are NOT allowed to satisfy source atoms
    main.querySelectorAll('select').forEach(s => s.remove());
    const pres = [...main.querySelectorAll('pre')].map(p => p.textContent);
    const hrefs = [...main.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
    return { text: main.textContent, pres, hrefs };
  });
}

const report = { generatedAt: new Date().toISOString(), pages: [], totals: { atoms: 0, exact: 0, ordered: 0, uiReplaced: 0, missing: 0, code: 0, codeOk: 0, urls: 0, urlsOk: 0 }, missing: [], uiReplaced: [], consoleErrors };

function check(label, md, dom) {
  const T = squash(dom.text);
  const res = { page: label, atoms: 0, missing: [] };
  for (const a of atomsOf(md)) {
    res.atoms++; report.totals.atoms++;
    if (a.kind === 'code') {
      report.totals.code++;
      const want = a.text.split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
      if (dom.pres.some(p => p.split('\n').map(l => l.replace(/\s+$/, '')).join('\n').includes(want))) { report.totals.codeOk++; report.totals.exact++; continue; }
      res.missing.push({ kind: 'code', text: a.text.slice(0, 120) }); report.totals.missing++; continue;
    }
    const s = squash(a.text);
    if (T.includes(s)) { report.totals.exact++; continue; }
    const ui = UI_REPLACED.find(u => u.re.test(a.text));
    if (ui) { report.totals.uiReplaced++; report.uiReplaced.push({ page: label, text: a.text, why: ui.why }); continue; }
    // ordered-segment fallback: every word present, in order (labels separated by form controls)
    const segs = a.text.split(/\s+/).map(squash).filter(Boolean);
    let at = 0, ok = true;
    for (const g of segs) { const i = T.indexOf(g, at); if (i < 0) { ok = false; break; } at = i + g.length; }
    if (ok && segs.length > 1) { report.totals.ordered++; continue; }
    res.missing.push({ kind: 'text', text: a.text.slice(0, 160) }); report.totals.missing++;
  }
  for (const u of urlsOf(md)) {
    report.totals.urls++;
    if (dom.text.includes(u) || dom.hrefs.includes(u)) report.totals.urlsOk++;
    else { res.missing.push({ kind: 'url', text: u }); report.totals.missing++; }
  }
  report.pages.push({ page: label, atoms: res.atoms, missing: res.missing.length });
  if (res.missing.length) report.missing.push(res);
}

for (const p of pages) check(`หน้า ${p.n}`, p.md, await grab('#/p/' + p.n));
check('ภาคผนวก A', src.appendixA.replace(/^# .+\n/, ''), await grab('#/appendix-a'));
check('ภาคผนวก B', src.appendixB.replace(/^# .+\n/, ''), await grab('#/appendix-b'));

// home page requirements from Part 1
const home = await grab('#/');
const homeNeed = ['Copilot', 'AI Agents for Work 2026', 'การใช้งาน AI แบบพาลงมือทำ · 23 ตุลาคม 2569', 'เริ่มที่ Prompt Mode →', 'ค้นหา Agent ตามกลุ่มงาน', '67', 'Agent พร้อมการตั้งค่าคัดลอกได้', '17', 'กลุ่มงาน', '27', 'บทเรียน', 'หน้าที่เรียนแล้ว', '© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret'];
report.home = homeNeed.map(h => ({ text: h, ok: home.text.includes(h) }));

// forbidden-term scan of the built output (CLAUDE.md rule)
const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
const termsFile = path.join(ROOT, 'content', 'forbidden-terms.txt');
const terms = fs.existsSync(termsFile) ? fs.readFileSync(termsFile, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')) : [];
const docNo = html.replace(/<svg[\s\S]*?<\/svg>/g, '').match(/\b(?:SOP|WI|QP|FM|QM|WP|PR|DOC)-\d{2,}[\w-]*/g) || [];
report.forbidden = { termsChecked: terms.length, hits: terms.filter(t => html.includes(t)), documentNumberPatterns: [...new Set(docNo)], brandFiles: fs.existsSync(path.join(ROOT, 'dist', 'brand')) ? fs.readdirSync(path.join(ROOT, 'dist', 'brand')) : [] }; // official Copilot logo approved by the owner (2026-10-14)

await browser.close(); srv.close();
fs.writeFileSync(path.join(ROOT, 'docs', 'audit-report.json'), JSON.stringify(report, null, 2));
const t = report.totals;
console.log(`atoms ${t.atoms} · exact ${t.exact} · ordered ${t.ordered} · ui-replaced ${t.uiReplaced} · MISSING ${t.missing}`);
console.log(`code blocks ${t.codeOk}/${t.code} · urls ${t.urlsOk}/${t.urls} · home ${report.home.filter(x => x.ok).length}/${report.home.length} · console errors ${consoleErrors.length}`);
console.log('forbidden:', JSON.stringify(report.forbidden));
for (const m of report.missing.slice(0, 40)) console.log('  ✗', m.page, JSON.stringify(m.missing.slice(0, 4)));
process.exitCode = t.missing || consoleErrors.length || report.home.some(x => !x.ok) || report.forbidden.hits.length ? 1 : 0;
