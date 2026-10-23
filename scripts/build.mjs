// Build: content/*.md + data/*.json + src/* → dist/ (single-file index.html + assets)
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { ROOT, parseSource, readJSON, builderBlocksOf, tablesOf } from './lib/source.mjs';
import { RENDERERS, renderGeneric, typeLabel, TYPE_ICON, READY, readyBadge } from './lib/pages.mjs';
import { marked, esc, inline, ic, tableHTML } from './lib/render.mjs';
import { pageSupplement, renderSupplement } from '../content/supplements.mjs';
import { buildDeep, DEEP_GROUPS } from './lib/deep.mjs';
import { renderDeepLesson, quizHTML, checklistHTML } from './lib/deep-render.mjs';
import { TRACKS } from '../content/tracks.mjs';
import { readExamples, skillsPageHTML, SKILL_PAGE, SKILL_LIMITS, SKILL_TYPES } from './lib/skills.mjs';
import { loadSims } from './lib/sims.mjs';
import { JOURNEY } from '../content/journey.mjs';
import { LIBRARY, LIB_CATS } from '../content/library.mjs';
import { CHAPTER_CHECKS } from '../content/chapter-checks.mjs';
import { BADGES } from '../content/badges.mjs';
import { loadAllowed, hashEmail, GATE_SALT } from './lib/gate.mjs';
import { buildExcel } from './lib/excel.mjs';

const t0 = Date.now();
const DIST = path.join(ROOT, 'dist');
const src = parseSource();
const agentsJ = readJSON('agents.json');
const chaptersJ = readJSON('chapters.json');
const guides = readJSON('guides.json');
const groups = readJSON('groups.json');
const readiness = readJSON('readiness.json');
const websites = readJSON('websites.json');
const icons = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'icons.json'), 'utf8'));
const warnings = [];

const pages = src.chapters.flatMap(c => c.pages);
const pageByN = new Map(pages.map(p => [p.n, p]));
const READY_NAME = Object.fromEntries(Object.entries(readiness).map(([k, v]) => [k, v.n]));

// ---- group colours (Part 1 design tokens) ----
const GROUP_COLORS = {
  gen: ['#5D6684', '#9AA3C2'], data: ['#2557E0', '#7EA2FF'], farm: ['#178F6B', '#4FD1A8'], inv: ['#A96F05', '#F0B44A'], fin: ['#0A86B8', '#4CC3EE'],
  sales: ['#CF3D69', '#F57FA2'], eng: ['#7A4FDB', '#B395FF'], ci: ['#CF5A22', '#F59468'], rep: ['#4A58B0', '#98A3F0'], pb: ['#B4532A', '#F0936A'],
  hat: ['#B07A12', '#F2BE5C'], brl: ['#2E8B57', '#6FD39A'], lp: ['#2F6FB5', '#7FB2F2'], erp: ['#6B5BB8', '#B3A6F2'], feed: ['#87661A', '#D9B865'],
  lab: ['#0E8686', '#5ED1D1'], qms: ['#A83A6B', '#F08DB8'], cis: ['#3E7D3A', '#8FD48A']
};
const GROUP_ICON = { gen: 'book_open', data: 'data_bar_vertical', farm: 'leaf_two', inv: 'box', fin: 'money', sales: 'megaphone', eng: 'wrench', ci: 'arrow_trending_lines', rep: 'board', pb: 'people_community', hat: 'heart_pulse', brl: 'shield_task', lp: 'vehicle_truck', erp: 'receipt', feed: 'food_grains', lab: 'beaker', qms: 'shield_checkmark', cis: 'leaf_two' };

// ---- agents (MD registry + agent pages + JSON) ----
const regRows = tablesOf(src.appendixA)[0].slice(1);
const agentPageOf = new Map(pages.filter(p => p.type === 'agent').map(p => [p.agent, p.n]));
const flowPageOf = new Map(pages.filter(p => p.type === 'agentflow').map(p => [p.agent, p]));
const groupKeyByName = Object.fromEntries(Object.entries(groups).map(([k, v]) => [v.name, k]));
const agents = {};
for (const a of agentsJ) {
  const id = +a.id;
  const reg = regRows.find(r => +r[0] === id);
  const pg = agentPageOf.get(id);
  let builder;
  if (pg) {
    const b = builderBlocksOf(pageByN.get(pg).md);
    const composed = `Name: ${b.name}\n\nDescription: ${b.description}\n\nInstructions:\n${b.instructions}\n\nKnowledge:\n${b.knowledge}\n\nCapabilities:\n${b.capabilities}\n\nStarter prompts:\n${b.starters}`;
    if (composed !== b.all) throw new Error(`agent ${id}: composed setup ≠ MD "Agent Builder Setup" block`);
    builder = { source: 'md', name: b.name, description: b.description, instructions: b.instructions, knowledge: b.knowledge, capabilities: b.capabilities, starters: b.starters, sites: b.sites.map(s => ({ name: s.name, url: s.url, use: s.use })), intro: b.intro, note: b.note, setupNote: b.setupNote };
  } else {
    const j = a.builder;
    const sites = a.websites.map(k => websites[k]);
    builder = {
      source: 'json', name: j.name, description: j.description, instructions: j.instructions,
      knowledge: Array.isArray(j.knowledge) ? j.knowledge.join('\n') : j.knowledge,
      capabilities: Array.isArray(j.capabilities) ? j.capabilities.join('\n') : j.capabilities,
      starters: Array.isArray(j.starterPrompts) ? j.starterPrompts.map(s => Array.isArray(s) ? s.join(': ') : (s.title ? `${s.title}: ${s.prompt}` : s)).join('\n') : j.starterPrompts,
      sites: sites.map(s => ({ name: s.name, url: s.url, use: s.use })),
      intro: agents[1]?.builder.intro || '', note: agents[1]?.builder.note || '', setupNote: agents[1]?.builder.setupNote || ''
    };
    warnings.push(`Agent #${id}: ไม่มีหน้า Agent ใน MD → ใช้การตั้งค่าจาก data/agents.json (แสดงในหน้า ${flowPageOf.get(id)?.n})`);
  }
  agents[id] = {
    id, name: reg ? reg[1] : a.name, short: a.short, group: a.group, groupName: groups[a.group].name, readiness: a.readiness, readinessName: READY_NAME[a.readiness],
    inputs: a.inputs, outputs: a.outputs, steps: a.steps, control: a.control, problem: a.problem, objective: a.objective, output: a.output,
    page: pg || null, flowPage: flowPageOf.get(id)?.n || null, chapter: (pages.find(p => p.agent === id) || {}).chapter, builder
  };
  if (reg && READY_NAME[a.readiness] !== reg[3]) warnings.push(`Agent #${id}: readiness JSON ${READY_NAME[a.readiness]} ≠ ทะเบียน ${reg[3]}`);
}
// fix JSON-sourced intro/note text now that agent 1 exists
for (const a of Object.values(agents)) if (a.builder.source === 'json') { a.builder.intro = agents[1].builder.intro; a.builder.note = agents[1].builder.note; a.builder.setupNote = agents[1].builder.setupNote; }

// ---- render context ----
const officeChips = new Set();
for (const app of Object.values(guides.office)) { for (const [, chips] of app.groups) chips.forEach(c => officeChips.add(c)); (app.can || []).forEach(c => officeChips.add(Array.isArray(c) ? c[0] : c)); }
const ctx = {
  officeChips,
  promptLab: guides.promptLab,
  handoffRoutes: guides.handoffRoutes,
  agent: id => agents[id],
  agentName: id => agents[id].name,
  agentPage: id => agents[id].page || agents[id].flowPage,
  flowPage: id => flowPageOf.get(id),
  chapterOf: p => src.chapters.find(c => c.n === p.chapter),
  workflowOf: ch => (chaptersJ.find(c => c.n === ch.n) || {}).workflow,
  groupAgentsHTML: title => {
    const key = groupKeyByName[title.trim()];
    if (!key) { warnings.push('map: unknown group ' + title); return ''; }
    const list = Object.values(agents).filter(a => a.group === key);
    return `<ul class="agent-mini">${list.map(a => `<li><a href="#/p/${a.page || a.flowPage}">${ic('bot')}<span>${esc(a.name)}</span></a></li>`).join('')}</ul>`;
  },
  checkWebUsage: rows => {
    for (const r of rows.slice(1)) {
      const url = (r[2].match(/`([^`]+)`/) || [])[1];
      const used = Object.values(agents).filter(a => a.builder.source === 'md' && a.builder.sites.some(s => s.url === url)).length;
      const usedAll = Object.values(agents).filter(a => a.builder.sites.some(s => s.url === url)).length;
      if (+r[3] !== used && +r[3] !== usedAll) warnings.push(`หน้า 24: ${url} ระบุ "Agent ที่ใช้" ${r[3]} แต่นับจริง ${usedAll}`);
    }
  }
};

// ---- render pages ----
const rendered = [];
for (const ch of src.chapters) {
  for (const p of ch.pages) {
    const r = (RENDERERS[p.type] || renderGeneric)(p, ctx);
    const res = typeof r === 'string' ? { html: r, header: {} } : r;
    const sup = pageSupplement(p, { agents, chapter: ch, pages });
    rendered.push({
      n: p.n, title: p.title, type: p.type, typeLabel: typeLabel(p.type), icon: TYPE_ICON[p.type] || 'document', chapter: ch.n, agent: p.agent,
      header: res.header || {}, html: res.html, supp: sup ? renderSupplement(sup) : ''
    });
  }
}

// ---- Deep Learning (36 lessons from v10) ----
const deep = buildDeep();
const deepTitle = n => deep.lessons.find(l => l.n === n).title;
const deepRendered = {};
for (const l of deep.lessons) deepRendered[l.n] = { html: renderDeepLesson(l, { titleOf: deepTitle }) };
const deepShared = {
  principles: deep.shared.principles,
  limits: deep.shared.limits,
  quiz: quizHTML('dq0', 'Quiz ทบทวน (5 ข้อ) พร้อมคำอธิบาย — หลักการร่วมของทุกบท', deep.shared.quiz),
  checklist: checklistHTML('Checklist ก่อนนำไปใช้ (ใช้ได้กับทุกบท)', deep.shared.checklist, 'shared')
};
// ---- learning paths + cross references (dedupe overlapping topics by linking, not repeating) ----
const excel = await buildExcel(ROOT);
// ---- หน้าเสริม: Skill ของ Agent (21A) + ตัวอย่าง zip ----
const skillExamples = readExamples(ROOT);
const skillHTML = skillsPageHTML(skillExamples);
const extPages = [{ ...SKILL_PAGE, header: { short: SKILL_PAGE.short }, html: skillHTML, text: skillHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000) }];
const refTitle = r => { const [k, n] = r.split(':'); return k === 'p' ? pageByN.get(+n).title : k === 'x' ? (excel.index.find(i => i.slug === n) || {}).title : k === 's' ? (extPages.find(e => e.slug === n) || {}).title : deepTitle(+n); };
const tracks = TRACKS.map(t => ({ ...t, steps: t.steps.map(s => ({ t: s.t, items: s.items.map(r => { if (!refTitle(r)) throw new Error('bad track ref ' + r); return r; }) })) }));
const related = { p: {}, d: {} };
for (const t of TRACKS) for (const s of t.steps) {
  const ps = s.items.filter(r => r[0] === 'p').map(r => +r.slice(2)), ds = s.items.filter(r => r[0] === 'd').map(r => +r.slice(2));
  for (const d of ds) related.d[d] = [...new Set([...(related.d[d] || []), ...ps])];
  for (const q of ps) related.p[q] = [...new Set([...(related.p[q] || []), ...ds])];
}
const updates = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'copilot-updates.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const updatesTh = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'updates-th.json'), 'utf8')).items;
const thMissing = updates.items.filter(i => !updatesTh[i.id]).length;
if (thMissing) warnings.push(`อัปเดต Copilot: ${thMissing}/${updates.items.length} รายการยังไม่มีคำแปลใน data/updates-th.json → ใช้สรุปภาษาไทยอัตโนมัติจากสถานะ/วันที่`);
const buildId = pkg.version + '-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
// email gate: only salted hashes reach dist/
const allowed = loadAllowed(ROOT);
// เจ้าของงานสั่ง (19 ต.ค. 2569): เปิดให้ทุกคนเข้าได้โดยไม่ต้องลงชื่อ · เปิด gate คืนได้ด้วย env EMAIL_GATE=on
const gateWanted = process.env.EMAIL_GATE === 'on';
const gate = gateWanted && allowed.emails.length > 0 ? { on: true, salt: GATE_SALT, h: allowed.emails.map(hashEmail).sort() } : { on: false, salt: GATE_SALT, h: [] };
if (gateWanted && !gate.on) warnings.push('Email gate ปิดอยู่: ไม่พบรายชื่อ Email (วางไฟล์ใน private/ หรือตั้ง ALLOWED_EMAILS)');

// ---- appendices ----
const appendix = md => marked.parse(md.replace(/^# .+\n/, '')).replace(/<table>/g, '<div class="table-wrap" tabindex="0"><table class="tbl">').replace(/<\/table>/g, '</table></div>').replace(/(https?:\/\/[^\s<]+)/g, (m, u, off, s) => s.slice(Math.max(0, off - 6), off).includes('href=') ? m : `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

// ---- data bundle ----
const data = {
  meta: {
    title: 'Copilot AI Agents for Work 2026', subtitle: 'AI Agents for Work 2026', event: 'การใช้งาน AI แบบพาลงมือทำ · 23 ตุลาคม 2569',
    copyright: '© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret', author: 'Nattapon Yokkret', version: pkg.version, buildId, excelTotal: excel.index.length, extTotal: extPages.length, totalPages: pages.length + 1, deepTotal: deep.lessons.length, built: new Date().toISOString().slice(0, 10)
  },
  groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, { name: v.name, c: GROUP_COLORS[k], icon: GROUP_ICON[k] }])),
  readiness,
  chapters: src.chapters.map(c => ({ n: c.n, key: c.key, title: c.title, group: c.group, goals: c.goals, pages: c.pages.flatMap(p => [p.n, ...extPages.filter(e => e.chapter === c.n && e.after === p.n).map(e => e.n)]), agents: c.pages.filter(p => p.type === 'agent' || (p.type === 'agentflow' && !agents[p.agent].page)).length })),
  pages: rendered,
  agents,
  promptLab: guides.promptLab,
  pbDefaults: { task: 'จัดลำดับคิวไก่เข้าเชือดรายวัน', file: 'แผนจับไก่รายฟาร์ม และผลตรวจ Salmonella รายฝูง (Excel)', need: 'เรียงคิวตามผล Salmonella ก่อน แล้วตามสถานะการใช้ยา ตรวจเวลางดอาหาร 6–12 ชั่วโมงรวมเวลาขนส่ง', outs: ['ตารางสรุปพร้อมสรุป 5 บรรทัด', 'Dashboard ใน Excel', 'รายงาน Word 1–2 หน้า', 'สไลด์ PowerPoint สำหรับผู้บริหาร', 'Interactive Presentation ไฟล์ HTML'], ref: 'มาตรฐานสวัสดิภาพสัตว์ระหว่างการจับและขนส่งไก่เนื้อ' },
  pmodeTemplates: (() => { const p8 = pageByN.get(8).md; return [...p8.matchAll(/```text\n([\s\S]*?)\n\s*```/g)].map(m => m[1].split('\n').map(l => l.replace(/^ {4}/, '')).join('\n')); })(),
  appendixA: appendix(src.appendixA), appendixB: appendix(src.appendixB),
  websites: Object.values(websites),
  deepGroups: DEEP_GROUPS,
  deepIndex: deep.lessons.map(l => ({ n: l.n, title: l.title, outcome: l.outcome, group: l.group, icon: l.icon, text: Object.values(deepRendered[l.n]).join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2500) })),
  tracks, related, updates, updatesTh,
  ext: extPages, skillCfg: { limits: SKILL_LIMITS, types: SKILL_TYPES },
  sims: await loadSims(ROOT, n => n === 1 || pageByN.has(n) || extPages.some(e => e.n === n)),
  journey: JOURNEY,
  library: LIBRARY, libCats: LIB_CATS, badges: BADGES,
  // ตัวเลือกแบบทดสอบท้ายบทสลับลำดับแบบคงที่ (ต้นฉบับเขียนคำตอบถูกไว้ข้อแรก)
  checks: Object.fromEntries(Object.entries(CHAPTER_CHECKS).map(([n, c]) => [n, { safety: c.safety, quiz: c.quiz.map((q, i) => { let x = (+n * 31 + i * 7) % 233280; const idx = q.opts.map((_, k) => k); for (let k = idx.length - 1; k > 0; k--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; } return { q: q.q, why: q.why, opts: idx.map(k => q.opts[k]), a: idx.indexOf(q.a) }; }) }])),
  excel: { chapters: excel.chapters, index: excel.index }, excelReportDate: excel.sample.reportDate,
  deepStats: { deduped: deep.report.dedupedBlocks.length, shared: deep.report.removedAsShared }
};

// เส้นทาง 7 สถานี: ทุกสถานีต้องมีฉาก (page: 'journey') หรือจุดขออนุญาต และลิงก์ไปหน้าที่มีอยู่จริง
if (JOURNEY.stations.length !== 7) throw new Error('journey must have 7 stations');
for (const s of JOURNEY.stations) {
  if (s.sim && !data.sims.some(x => x.id === s.sim && x.page === 'journey')) throw new Error('journey: missing sim ' + s.sim);
  if (!s.sim && !s.consent) throw new Error('journey: station needs a sim or consent ' + s.key);
  if (s.link && !pageByN.has(s.link)) throw new Error('journey: bad link ' + s.link);
}
// คลังเครื่องมือ: 40 หัวข้อ slug ไม่ซ้ำ หมวดถูก ลิงก์ชี้ไปที่มีอยู่จริง · แบบทดสอบท้ายบทครบ 27 บท
const ROUTES_OK = new Set(['#/forge', '#/journey', '#/plab', '#/builder', '#/agents', '#/excel', '#/deep', '#/tracks', '#/updates']);
if (LIBRARY.length !== 40 || new Set(LIBRARY.map(t => t.slug)).size !== 40) throw new Error('library must have 40 unique topics');
for (const t of LIBRARY) {
  if (!LIB_CATS.some(c => c.k === t.cat) || !t.points || t.points.length < 3 || !t.prompt) throw new Error('library: bad topic ' + t.slug);
  for (const r of t.links) if (r.startsWith('r:') ? !ROUTES_OK.has(r.slice(2)) : !refTitle(r)) throw new Error(`library ${t.slug}: bad link ${r}`);
}
for (const c of src.chapters) { const k = CHAPTER_CHECKS[c.n]; if (!k || k.quiz.length !== 3 || k.safety.length !== 5 || k.quiz.some(q => q.opts.length < 3 || q.a < 0 || q.a >= q.opts.length || !q.why)) throw new Error('chapter check missing/invalid: ' + c.n); }
// ---- brand: optional official Copilot logo (only when the owner supplies an authorised file) ----
const brandDir = path.join(ROOT, 'assets', 'brand');
const copilotLogo = ['copilot-logo.svg', 'copilot-logo.png'].find(f => fs.existsSync(path.join(brandDir, f)));
data.meta.copilotLogo = copilotLogo ? 'brand/' + copilotLogo : null;

// ---- assemble ----
const tpl = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'src', 'app.css'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src', 'fx.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf8').replace('/*__EXCEL_JS__*/', () => fs.readFileSync(path.join(ROOT, 'src', 'excel.js'), 'utf8'))
  .replace('/*__PROMPTLAB_JS__*/', () => fs.readFileSync(path.join(ROOT, 'src', 'promptlab.js'), 'utf8'))
  .replace('/*__SKILLS_JS__*/', () => fs.readFileSync(path.join(ROOT, 'src', 'skillbuilder.js'), 'utf8'))
  .replace('/*__FX_JS__*/', () => ['core', 'sound', 'feel', 'sim', 'journey', 'forge', 'library', 'progress'].map(f => fs.readFileSync(path.join(ROOT, 'src', 'fx', f + '.js'), 'utf8')).join('\n'));
if (/\/\*__(EXCEL|PROMPTLAB|SKILLS|FX)_JS__\*\//.test(js)) throw new Error('excel.js / promptlab.js / skillbuilder.js not injected');
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(icons).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="currentColor">${v}</symbol>`).join('')}</svg>`;
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = tpl
  .replace('/*__CSS__*/', () => css)
  .replace('<!--__SPRITE__-->', () => sprite)
  .replace('/*__DATA__*/', () => json)
  .replace('/*__GATE__*/', () => JSON.stringify(gate))
  .replace('/*__JS__*/', () => js)
  .replace(/__BUILD__/g, data.meta.built);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html);
// deep lessons load on demand (CSP 'self', works from file:// too)
fs.writeFileSync(path.join(DIST, 'deep-data.js'), 'window.__DEEP=' + JSON.stringify({ lessons: deepRendered, shared: deepShared }).replace(/</g, '\\u003c') + ';');
// AI + Excel: lesson html + dashboard sample data load on demand; sample workbook is downloadable
fs.writeFileSync(path.join(DIST, 'excel-data.js'), 'window.__EXCEL=' + JSON.stringify({ html: excel.html, sample: excel.sample }).replace(/</g, '\\u003c') + ';');
fs.mkdirSync(path.join(DIST, 'skills'), { recursive: true });
for (const e of skillExamples) fs.writeFileSync(path.join(DIST, 'skills', e.slug + '.zip'), e.zip);
fs.mkdirSync(path.join(DIST, 'excel'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'ai-excel-formula-mastery', 'data', 'sample-workbook.xlsx'), path.join(DIST, 'excel', 'sample-workbook.xlsx'));
fs.copyFileSync(path.join(ROOT, 'assets', 'logo.png'), path.join(DIST, 'logo.png'));
fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.full.min.js'), path.join(DIST, 'vendor', 'xlsx.full.min.js'));
fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.LICENSE'), path.join(DIST, 'vendor', 'xlsx.LICENSE.txt'));
// Prompt Lab อัตโนมัติ: pdf.js (Apache-2.0) อ่าน PDF ในเครื่อง · โหลดเมื่อผู้ใช้โยน PDF เท่านั้น
fs.mkdirSync(path.join(DIST, 'vendor', 'pdfjs'), { recursive: true });
for (const f of ['pdf.min.mjs', 'pdf.worker.min.mjs']) fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'pdfjs', f), path.join(DIST, 'vendor', 'pdfjs', f));
fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'pdfjs', 'LICENSE.txt'), path.join(DIST, 'vendor', 'pdfjs.LICENSE.txt'));
if (fs.existsSync(path.join(ROOT, 'assets', 'favicon.svg'))) fs.copyFileSync(path.join(ROOT, 'assets', 'favicon.svg'), path.join(DIST, 'favicon.svg'));
// ---- PWA: icons, manifest, service worker, version.json ----
fs.mkdirSync(path.join(DIST, 'icons'), { recursive: true });
const iconFiles = fs.readdirSync(path.join(ROOT, 'assets', 'icons')).filter(f => f.endsWith('.png'));
for (const f of iconFiles) fs.copyFileSync(path.join(ROOT, 'assets', 'icons', f), path.join(DIST, 'icons', f));
fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({
  id: './', name: 'Copilot AI Agents for Work 2026', short_name: 'Copilot Agents', description: 'คู่มือเรียนรู้ Microsoft Copilot และ Copilot Agent แบบลงมือทำ',
  lang: 'th', dir: 'ltr', start_url: './', scope: './', display: 'standalone', display_override: ['standalone', 'minimal-ui'], orientation: 'any',
  background_color: '#F4F6FB', theme_color: '#2557E0', categories: ['education', 'productivity'],
  icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  shortcuts: [{ name: 'เรียน Copilot Agent', url: './#/track/agent' }, { name: 'อัปเดตล่าสุด', url: './#/updates' }, { name: 'Agent Directory', url: './#/agents' }]
}, null, 1));
const precache = ['./', `deep-data.js?v=${encodeURIComponent(buildId)}`, `excel-data.js?v=${encodeURIComponent(buildId)}`, 'excel/sample-workbook.xlsx', 'logo.png', 'favicon.svg', 'manifest.webmanifest', ...iconFiles.map(f => 'icons/' + f), ...(copilotLogo ? ['brand/' + copilotLogo] : [])];
const swSrc = fs.readFileSync(path.join(ROOT, 'src', 'sw.js'), 'utf8').replaceAll('__BUILD_ID__', buildId).replaceAll('__PRECACHE__', JSON.stringify(precache));
if (/__[A-Z_]+__/.test(swSrc)) throw new Error('sw.js: unfilled placeholder');
fs.writeFileSync(path.join(DIST, 'sw.js'), swSrc);
fs.writeFileSync(path.join(DIST, 'version.json'), JSON.stringify({ version: pkg.version, build: buildId, built: new Date().toISOString() }));
if (copilotLogo) { fs.mkdirSync(path.join(DIST, 'brand'), { recursive: true }); fs.copyFileSync(path.join(brandDir, copilotLogo), path.join(DIST, 'brand', copilotLogo)); }
// ---- Netlify headers: strict CSP with hashes of the inline scripts in this build ----
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
const csp = [
  "default-src 'self'", `script-src 'self' ${hashes.join(' ')}`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:", "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com", "manifest-src 'self'", "worker-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'"
].join('; ');
fs.writeFileSync(path.join(DIST, '_headers'), `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Frame-Options: DENY

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/vendor/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/pdfjs/*
  Content-Type: text/javascript; charset=utf-8

/deep-data.js
  Cache-Control: public, max-age=0, must-revalidate

/excel-data.js
  Cache-Control: public, max-age=0, must-revalidate

/excel/*
  Cache-Control: public, max-age=0, must-revalidate

/skills/*
  Content-Type: application/zip
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: no-cache
  Service-Worker-Allowed: /

/version.json
  Cache-Control: no-store

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=0, must-revalidate

/icons/*
  Cache-Control: public, max-age=604800
`);
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify({ built: new Date().toISOString(), pages: rendered.length + 1, deepLessons: deep.lessons.length, deepReport: deep.report, updates: { fetchedAt: updates.fetchedAt, items: updates.items.length }, version: pkg.version, buildId, excel: excel.report, gate: { on: gate.on, count: gate.h.length, sources: allowed.sources }, updatesTh: { translated: updates.items.length - thMissing, total: updates.items.length }, agents: Object.keys(agents).length, bytes: Buffer.byteLength(html), warnings }, null, 2));
console.log(`built dist/index.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB  pages=${rendered.length + 1} agents=${Object.keys(agents).length}  ${Date.now() - t0}ms`);
for (const w of warnings) console.log('  ⚠', w);
