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
const refTitle = r => { const [k, n] = r.split(':'); return k === 'p' ? pageByN.get(+n).title : deepTitle(+n); };
const tracks = TRACKS.map(t => ({ ...t, steps: t.steps.map(s => ({ t: s.t, items: s.items.map(r => { if (!refTitle(r)) throw new Error('bad track ref ' + r); return r; }) })) }));
const related = { p: {}, d: {} };
for (const t of TRACKS) for (const s of t.steps) {
  const ps = s.items.filter(r => r[0] === 'p').map(r => +r.slice(2)), ds = s.items.filter(r => r[0] === 'd').map(r => +r.slice(2));
  for (const d of ds) related.d[d] = [...new Set([...(related.d[d] || []), ...ps])];
  for (const q of ps) related.p[q] = [...new Set([...(related.p[q] || []), ...ds])];
}
const updates = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'copilot-updates.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// ---- appendices ----
const appendix = md => marked.parse(md.replace(/^# .+\n/, '')).replace(/<table>/g, '<div class="table-wrap" tabindex="0"><table class="tbl">').replace(/<\/table>/g, '</table></div>').replace(/(https?:\/\/[^\s<]+)/g, (m, u, off, s) => s.slice(Math.max(0, off - 6), off).includes('href=') ? m : `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

// ---- data bundle ----
const data = {
  meta: {
    title: 'Copilot AI Agents for Work 2026', subtitle: 'AI Agents for Work 2026', event: 'การใช้งาน AI แบบพาลงมือทำ · 23 ตุลาคม 2569',
    copyright: '© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret', author: 'Nattapon Yokkret', version: pkg.version, totalPages: pages.length + 1, deepTotal: deep.lessons.length, built: new Date().toISOString().slice(0, 10)
  },
  groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, { name: v.name, c: GROUP_COLORS[k], icon: GROUP_ICON[k] }])),
  readiness,
  chapters: src.chapters.map(c => ({ n: c.n, key: c.key, title: c.title, group: c.group, goals: c.goals, pages: c.pages.map(p => p.n), agents: c.pages.filter(p => p.type === 'agent' || (p.type === 'agentflow' && !agents[p.agent].page)).length })),
  pages: rendered,
  agents,
  promptLab: guides.promptLab,
  pbDefaults: { task: 'จัดลำดับคิวไก่เข้าเชือดรายวัน', file: 'แผนจับไก่รายฟาร์ม และผลตรวจ Salmonella รายฝูง (Excel)', need: 'เรียงคิวตามผล Salmonella ก่อน แล้วตามสถานะการใช้ยา ตรวจเวลางดอาหาร 6–12 ชั่วโมงรวมเวลาขนส่ง', outs: ['ตารางสรุปพร้อมสรุป 5 บรรทัด', 'Dashboard ใน Excel', 'รายงาน Word 1–2 หน้า', 'สไลด์ PowerPoint สำหรับผู้บริหาร', 'Interactive Presentation ไฟล์ HTML'], ref: 'มาตรฐานสวัสดิภาพสัตว์ระหว่างการจับและขนส่งไก่เนื้อ' },
  pmodeTemplates: (() => { const p8 = pageByN.get(8).md; return [...p8.matchAll(/```text\n([\s\S]*?)\n\s*```/g)].map(m => m[1].split('\n').map(l => l.replace(/^ {4}/, '')).join('\n')); })(),
  appendixA: appendix(src.appendixA), appendixB: appendix(src.appendixB),
  websites: Object.values(websites),
  deepGroups: DEEP_GROUPS,
  deepIndex: deep.lessons.map(l => ({ n: l.n, title: l.title, outcome: l.outcome, group: l.group, icon: l.icon, text: Object.values(deepRendered[l.n]).join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2500) })),
  tracks, related, updates,
  deepStats: { deduped: deep.report.dedupedBlocks.length, shared: deep.report.removedAsShared }
};

// ---- brand: optional official Copilot logo (only when the owner supplies an authorised file) ----
const brandDir = path.join(ROOT, 'assets', 'brand');
const copilotLogo = ['copilot-logo.svg', 'copilot-logo.png'].find(f => fs.existsSync(path.join(brandDir, f)));
data.meta.copilotLogo = copilotLogo ? 'brand/' + copilotLogo : null;

// ---- assemble ----
const tpl = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'src', 'app.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf8');
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(icons).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="currentColor">${v}</symbol>`).join('')}</svg>`;
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = tpl
  .replace('/*__CSS__*/', () => css)
  .replace('<!--__SPRITE__-->', () => sprite)
  .replace('/*__DATA__*/', () => json)
  .replace('/*__JS__*/', () => js)
  .replace(/__BUILD__/g, data.meta.built);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html);
// deep lessons load on demand (CSP 'self', works from file:// too)
fs.writeFileSync(path.join(DIST, 'deep-data.js'), 'window.__DEEP=' + JSON.stringify({ lessons: deepRendered, shared: deepShared }).replace(/</g, '\\u003c') + ';');
fs.copyFileSync(path.join(ROOT, 'assets', 'logo.png'), path.join(DIST, 'logo.png'));
fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.full.min.js'), path.join(DIST, 'vendor', 'xlsx.full.min.js'));
fs.copyFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.LICENSE'), path.join(DIST, 'vendor', 'xlsx.LICENSE.txt'));
if (fs.existsSync(path.join(ROOT, 'assets', 'favicon.svg'))) fs.copyFileSync(path.join(ROOT, 'assets', 'favicon.svg'), path.join(DIST, 'favicon.svg'));
if (copilotLogo) { fs.mkdirSync(path.join(DIST, 'brand'), { recursive: true }); fs.copyFileSync(path.join(brandDir, copilotLogo), path.join(DIST, 'brand', copilotLogo)); }
// ---- Netlify headers: strict CSP with hashes of the inline scripts in this build ----
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
const csp = [
  "default-src 'self'", `script-src 'self' ${hashes.join(' ')}`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'"
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

/deep-data.js
  Cache-Control: public, max-age=0, must-revalidate
`);
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify({ built: new Date().toISOString(), pages: rendered.length + 1, deepLessons: deep.lessons.length, deepReport: deep.report, updates: { fetchedAt: updates.fetchedAt, items: updates.items.length }, version: pkg.version, agents: Object.keys(agents).length, bytes: Buffer.byteLength(html), warnings }, null, 2));
console.log(`built dist/index.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB  pages=${rendered.length + 1} agents=${Object.keys(agents).length}  ${Date.now() - t0}ms`);
for (const w of warnings) console.log('  ⚠', w);
