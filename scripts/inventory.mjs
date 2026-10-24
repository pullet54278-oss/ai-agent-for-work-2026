// Content inventory + source discrepancy report.
// Usage: node scripts/inventory.mjs  → writes docs/content-inventory.json and prints a summary.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseSource, readJSON, codeBlocks, urlsOf, tablesOf, builderBlocksOf, jsLen } from './lib/source.mjs';

const src = parseSource();
const agentsJ = readJSON('agents.json');
const chaptersJ = readJSON('chapters.json');
const guides = readJSON('guides.json');
const websites = readJSON('websites.json');
const groups = readJSON('groups.json');

const pages = src.chapters.flatMap(c => c.pages);
const byType = {};
for (const p of pages) byType[p.type] = (byType[p.type] || 0) + 1;

const issues = [];
const note = (sev, area, msg) => issues.push({ sev, area, msg });

// ---- chapters / pages ----
for (const t of src.toc) {
  const ch = src.chapters.find(c => c.n === t.n);
  if (!ch) { note('high', 'TOC', `บทที่ ${t.n} อยู่ในสารบัญแต่ไม่พบเนื้อหา`); continue; }
  if (ch.pages.length !== t.pages) note('info', 'TOC', `บทที่ ${t.n} สารบัญระบุ ${t.pages} หน้า แต่พบหัวข้อ "### หน้า" ${ch.pages.length} หน้า` + (t.n === 1 ? ' (หน้า 1 = หน้าแรก ซึ่งสเปกอยู่ในส่วนที่ 1 ไม่มีเนื้อหาในส่วนที่ 2)' : ''));
}
const nums = pages.map(p => p.n);
for (let i = 2; i <= 155; i++) if (!nums.includes(i)) note('high', 'Pages', `ไม่พบหน้า ${i}`);
const dupN = nums.filter((n, i) => nums.indexOf(n) !== i);
if (dupN.length) note('high', 'Pages', 'เลขหน้าซ้ำ: ' + dupN.join(', '));

// ---- agents ----
const agentPages = pages.filter(p => p.type === 'agent');
const flowPages = pages.filter(p => p.type === 'agentflow');
const agentIdsWithPage = new Set(agentPages.map(p => p.agent));
const jsonIds = agentsJ.map(a => +a.id);
const missingAgentPage = jsonIds.filter(id => !agentIdsWithPage.has(id));
for (const id of missingAgentPage) {
  const a = agentsJ.find(x => +x.id === id);
  const fl = flowPages.find(p => p.agent === id);
  note('high', 'Agent', `Agent #${id} "${a.name}" ไม่มีหน้า Agent (page-type: agent) ในส่วนที่ 2` + (fl ? ` มีเพียงหน้า Flow หน้า ${fl.n} "${fl.title}"` : ''));
}
// Appendix A registry
const regRows = tablesOf(src.appendixA)[0].slice(1);
if (regRows.length !== 67) note('high', 'Appendix A', `ทะเบียน Agent มี ${regRows.length} แถว`);
for (const r of regRows) {
  const id = +r[0];
  const pg = agentPages.find(p => p.agent === id);
  if (pg && pg.title !== r[1]) note('low', 'Appendix A', `Agent #${id}: ชื่อในทะเบียน "${r[1]}" ≠ ชื่อหน้า "${pg.title}"`);
  const j = agentsJ.find(x => +x.id === id);
  if (j && j.name !== r[1]) note('low', 'data/agents.json', `Agent #${id}: ชื่อใน JSON "${j.name}" ≠ ทะเบียน "${r[1]}"`);
}

// builder blocks: counters + limits + URL rules
const builders = {};
let starterCount = 0;
for (const p of agentPages) {
  const b = builderBlocksOf(p.md);
  if (!b) { note('high', 'Agent Builder', `หน้า ${p.n}: ไม่พบแผง "สร้าง Agent นี้"`); continue; }
  builders[p.agent] = b;
  for (const k of ['name', 'description', 'instructions', 'knowledge', 'capabilities', 'starters', 'all']) if (!b[k]) note('high', 'Agent Builder', `หน้า ${p.n} (#${p.agent}): ไม่พบบล็อก ${k}`);
  const L = { name: jsLen(b.name), description: jsLen(b.description), instructions: jsLen(b.instructions) };
  if (L.name > 30) note('high', 'Limits', `#${p.agent} Name ยาว ${L.name} > 30`);
  if (L.description > 1000) note('high', 'Limits', `#${p.agent} Description ยาว ${L.description} > 1,000`);
  if (L.instructions > 8000) note('high', 'Limits', `#${p.agent} Instructions ยาว ${L.instructions} > 8,000`);
  for (const k of ['name', 'description', 'instructions']) {
    const d = b.declared[k] ? +b.declared[k].replace(/,/g, '') : null;
    if (d != null && d !== L[k]) note('low', 'Counters', `#${p.agent} ${k}: ตัวเลขที่พิมพ์ในต้นฉบับ ${d} ≠ นับจริง ${L[k]} (แอปจะนับใหม่แบบ live)`);
  }
  if (b.sites.length !== 4) note('high', 'Knowledge', `#${p.agent}: เว็บไซต์ ${b.sites.length} แหล่ง (ควรเป็น 4)`);
  for (const s of b.sites) {
    const u = new URL(s.url);
    const depth = u.pathname.split('/').filter(Boolean).length;
    if (depth > 2) note('medium', 'URL rule', `#${p.agent}: ${s.url} ลึก ${depth} ระดับ (> 2)`);
    if (s.url.includes('?')) note('medium', 'URL rule', `#${p.agent}: ${s.url} มีเครื่องหมาย ?`);
    if (s.url !== s.urlText) note('low', 'URL', `#${p.agent}: ลิงก์ ${s.url} ≠ ข้อความ ${s.urlText}`);
    if (!b.knowledge.includes(s.url)) note('medium', 'Knowledge', `#${p.agent}: ${s.url} ไม่อยู่ในบล็อก Knowledge`);
  }
  starterCount += b.starters.split('\n').filter(Boolean).length;
  // cross-check with JSON
  const j = agentsJ.find(x => +x.id === p.agent);
  if (j?.builder?.name && j.builder.name !== b.name) note('low', 'data/agents.json', `#${p.agent}: builder.name ใน JSON "${j.builder.name}" ≠ MD "${b.name}"`);
}

// ---- prompts (code blocks) ----
const builderLabels = /\*\*(Name|Description|Instructions|Knowledge|Capabilities|Starter prompts)\*\*[^\n]*\n\n$/;
let promptBlocks = 0, builderBlocks = 0, otherBlocks = 0;
const promptsByType = {};
for (const p of pages) {
  const blocks = [...p.md.matchAll(/```text\n[\s\S]*?\n[ \t]*```/g)];
  for (const m of blocks) {
    const before = p.md.slice(Math.max(0, m.index - 220), m.index);
    if (builderLabels.test(before) || /###### Agent Builder Setup\n\n[^\n]+\n\n$/.test(before)) builderBlocks++;
    else { promptBlocks++; promptsByType[p.type] = (promptsByType[p.type] || 0) + 1; }
  }
}
const allBlocks = codeBlocks(src.part2);
otherBlocks = allBlocks.length - promptBlocks - builderBlocks;
const labPrompts = guides.promptLab.reduce((s, c) => s + c[2].length, 0);
const labInMd = pages.find(p => p.type === 'plab');
const labVisible = guides.promptLab.filter(c => c[2].every(pr => labInMd.md.replace(/\\/g, '').includes(pr)));
note('high', 'Prompt Lab', `ต้นฉบับ MD มี Prompt Lab เพียงหมวดแรก (${labVisible.map(c => c[0]).join(', ')}) จาก ${guides.promptLab.length} หมวด — อีก ${guides.promptLab.length - labVisible.length} หมวด (${labPrompts - labVisible.reduce((s, c) => s + c[2].length, 0)} Prompt) มีเฉพาะใน data/guides.json`);
note('high', 'Prompt Builder', 'หน้า Prompt Builder (หน้า 9) ใน MD มีเพียงชื่อช่องและหัวข้อผลลัพธ์ ไม่มีค่าตัวอย่างและข้อความ Prompt — แอปสร้างจากแม่แบบ Prompt Mode (หน้า 8 ขั้น 2–4) + ค่าตัวอย่างจากเวอร์ชันเดิม');
const mapPages = pages.filter(p => p.type === 'map');
for (const p of mapPages) note('medium', 'Map', `หน้า ${p.n} "${p.title}": MD มีเพียงหัวข้อกลุ่ม ไม่มีรายชื่อ Agent (ปุ่มหายตอนแปลง) — แอปเติมจาก data/chapters.json + data/agents.json`);
const calcPages = pages.filter(p => p.type === 'calc' || p.type === 'calc2');
for (const p of calcPages) if (!/\d/.test(p.md.replace(/^#.*$/gm, ''))) note('medium', 'Calculator', `หน้า ${p.n}: MD ไม่มีค่าตัวเลขในฟอร์ม — ใช้สูตรและค่าเริ่มต้นจากส่วนที่ 1`);

// ---- spec claims (part 1) vs reality ----
note('high', 'Spec', `ส่วนที่ 1 ระบุ "หน้า Agent (67 หน้า)" แต่พบหน้า page-type: agent ${agentPages.length} หน้า (Agent #${missingAgentPage.join(', ')} ไม่มีหน้า)`);
const workGroups = Object.keys(groups).filter(g => g !== 'gen');
const groupsWithAgents = new Set(agentsJ.map(a => a.group));
note('info', 'Spec', `"17 กลุ่มงาน" = รหัสกลุ่ม ${workGroups.length} กลุ่ม (ไม่นับ gen) · มี Agent จริง ${groupsWithAgents.size} กลุ่ม`);
const specCardKeys = ['pmode', 'acct', 'build', 'personal', 'handoff', 'data', 'doc', 'inv', 'plan', 'fin', 'sales', 'eng', 'ci', 'office', 'rep', 'arch', 'wf', 'pb', 'hat', 'brl', 'lp', 'erp', 'feed', 'lab', 'qms', 'cis'];
const notInCards = src.chapters.filter(c => !specCardKeys.includes(c.key)).map(c => `${c.key} (บทที่ ${c.n})`);
if (notInCards.length) note('medium', 'Spec', `การ์ดบทเรียนหน้าแรก 3 กลุ่มในสเปกครอบคลุม ${specCardKeys.length} บท ไม่มี: ${notInCards.join(', ')} — แอปจัดไว้ในกลุ่ม "พื้นฐาน"`);
note('high', 'Spec', 'ส่วนที่ 1 และ CLAUDE.md ห้ามใช้โลโก้ Microsoft/Copilot แต่คำสั่งงานรอบนี้ขอ "โลโก้ Copilot ทางการ" — ข้อกำหนดขัดกัน ต้องให้เจ้าของงานตัดสิน');
note('info', 'Spec', 'ส่วนที่ 1 ระบุ SheetJS จาก cdnjs — แอปใช้ไฟล์ SheetJS 0.18.5 ที่แนบในโปรเจกต์ (vendor) เพื่อทำงานออฟไลน์และไม่พึ่ง CDN ภายนอก');

// ---- JSON vs MD cross checks ----
const chapJTotal = chaptersJ.reduce((s, c) => s + c.pages.length, 0);
if (chapJTotal !== pages.length + 1) note('medium', 'data/chapters.json', `จำนวนหน้าใน JSON ${chapJTotal} ≠ MD ${pages.length}+หน้าแรก`);
for (const c of chaptersJ) for (const pj of c.pages) {
  if (pj.n === 1) continue;
  const pm = pages.find(p => p.n === pj.n);
  if (!pm) continue;
  if (pm.title !== pj.title) note('low', 'data/chapters.json', `หน้า ${pj.n}: ชื่อ JSON "${pj.title}" ≠ MD "${pm.title}"`);
  if (pm.type !== pj.type) note('low', 'data/chapters.json', `หน้า ${pj.n}: type JSON ${pj.type} ≠ MD ${pm.type}`);
}

// ---- URLs ----
const urls = urlsOf(src.part2 + src.appendixB);
const appendixBRows = tablesOf(src.appendixB)[0].slice(1);
const webJ = Object.values(websites).map(w => w.url);
for (const u of webJ) if (!urls.includes(u)) note('low', 'data/websites.json', `URL ${u} อยู่ใน JSON แต่ไม่พบใน MD`);
for (const r of appendixBRows) {
  const u = new URL(r[1]);
  if (u.pathname.split('/').filter(Boolean).length > 2 || r[1].includes('?')) note('medium', 'URL rule', `ภาคผนวก B: ${r[1]} ผิดกติกา URL`);
}

// ---- tables ----
const tables = pages.flatMap(p => tablesOf(p.md).map(t => ({ page: p.n, rows: t.length - 1, cols: t[0].length })));

const inv = {
  generatedAt: new Date().toISOString(),
  source: 'content/copilot-ai-agents-for-work.md',
  totals: {
    chapters: src.chapters.length,
    contentPages: pages.length,
    pagesIncludingHome: pages.length + 1,
    pageTypes: byType,
    agentsInRegistry: regRows.length,
    agentsInJSON: agentsJ.length,
    agentDetailPages: agentPages.length,
    agentFlowPages: flowPages.length,
    codeBlocksTotal: allBlocks.length,
    promptBlocks,
    builderConfigBlocks: builderBlocks,
    otherBlocks,
    promptsByPageType: promptsByType,
    starterPrompts: starterCount,
    promptLabCategories: guides.promptLab.length,
    promptLabPromptsJSON: labPrompts,
    tables: tables.length,
    tableRows: tables.reduce((s, t) => s + t.rows, 0),
    uniqueURLs: urls.length,
    appendixBWebsites: appendixBRows.length
  },
  chapters: src.chapters.map(c => ({ n: c.n, key: c.key, group: c.group, title: c.title, pages: c.pages.length, agents: c.pages.filter(p => p.type === 'agent').length, flows: c.pages.filter(p => p.type === 'agentflow').length })),
  issues
};
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'content-inventory.json'), JSON.stringify(inv, null, 2));
console.log(JSON.stringify(inv.totals, null, 2));
console.table(inv.chapters);
for (const i of issues) console.log(`[${i.sev}] ${i.area}: ${i.msg}`);
