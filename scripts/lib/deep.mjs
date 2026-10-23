// Deep Learning track (36 lessons) — parsed from content/deep-learning-v10.html (Microsoft Copilot 36 v10).
// The v10 app ran lesson scripts with new Function/eval inside shadow DOM. Here every lesson is converted
// at build time into static, CSP-safe HTML: interactive parts become native app widgets, and content that
// was repeated identically in every lesson is kept once on the Deep Learning overview page.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './source.mjs';

export const DEEP_SRC = path.join(ROOT, 'content', 'deep-learning-v10.html');

// ---- wording rules from CLAUDE.md (no job titles / document numbers on the web) ----
export const SANITIZE = [
  [/ผู้จัดการฟาร์ม/g, 'ผู้รับผิดชอบฟาร์ม'], [/หัวหน้าฟาร์ม/g, 'ผู้รับผิดชอบฟาร์ม'], [/หัวหน้างาน/g, 'ผู้รับผิดชอบงาน'],
  [/ผู้จัดการ/g, 'ผู้มีอำนาจอนุมัติ'], [/QA Manager/g, 'ผู้มีอำนาจอนุมัติด้าน QA'], [/Farm Manager/g, 'ผู้รับผิดชอบฟาร์ม'],
  [/\bProject Manager\b/g, 'ผู้รับผิดชอบโครงการ'], [/\bManager\b/g, 'ผู้มีอำนาจอนุมัติ'], [/\bSupervisor\b/g, 'ผู้ตรวจทาน'],
  [/\b(SOP|WI|QP|FM|QM|WP|PR|DOC)-(\d{2,})/g, '$1-ตัวอย่าง-$2']
];
export const sanitizeText = s => SANITIZE.reduce((t, [re, to]) => t.replace(re, to), s);

export const DEEP_GROUPS = [
  { key: 'd1', a: 1, b: 5, name: 'Copilot Fundamentals', th: 'พื้นฐาน Copilot', desc: 'รู้จัก Copilot และใช้ AI อย่างมั่นใจ', c: ['#2778CA', '#7FB6F0'], icon: 'lightbulb' },
  { key: 'd2', a: 6, b: 12, name: 'Microsoft 365 Productivity', th: 'Copilot ในแอป Microsoft 365', desc: 'Word, Excel, PowerPoint, Outlook, Teams และ SharePoint', c: ['#1E8A72', '#6FD3BC'], icon: 'window' },
  { key: 'd3', a: 13, b: 19, name: 'AI Agents & Automation', th: 'AI Agents และ Automation', desc: 'สร้าง Agent และออกแบบ Workflow', c: ['#7650CF', '#B9A0F5'], icon: 'bot' },
  { key: 'd4', a: 20, b: 27, name: 'Security & Governance', th: 'ความปลอดภัยและการกำกับดูแล', desc: 'ความปลอดภัย การกำกับดูแล และคุณภาพ', c: ['#A86C1F', '#F0BE72'], icon: 'shield_checkmark' },
  { key: 'd5', a: 28, b: 33, name: 'Business Applications', th: 'ประยุกต์ใช้กับงานจริง', desc: 'งานตรวจประเมิน กฎระเบียบ และข้อมูลฟาร์ม', c: ['#B4486F', '#F297B8'], icon: 'data_bar_vertical' },
  { key: 'd6', a: 34, b: 36, name: 'Implementation & Final Project', th: 'นำไปใช้จริงและประเมินผล', desc: 'นำไปใช้จริงและประเมินผล', c: ['#4A6C96', '#9DB8DC'], icon: 'hat_graduation' }
];
export const deepGroupOf = n => DEEP_GROUPS.find(g => n >= g.a && n <= g.b);

export function loadV10() {
  const html = fs.readFileSync(DEEP_SRC, 'utf8');
  const js = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>', html.indexOf('<script>')));
  const start = js.indexOf('[', js.indexOf('const chapters='));
  const end = js.indexOf(';\nconst groups=');
  const chapters = JSON.parse(js.slice(start, end));
  if (chapters.length !== 36) throw new Error('v10: expected 36 lessons, got ' + chapters.length);
  return chapters;
}

// ---- tiny HTML helpers ----
const stripTags = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
export const textOf = stripTags;

// top-level <section> elements in document order (balanced, so nested sections stay inside)
function topSections(html) {
  const out = []; const re = /<section\b[^>]*>|<\/section>/g; let depth = 0, from = -1, m;
  while ((m = re.exec(html))) {
    if (m[0][1] !== '/') { if (depth === 0) from = m.index; depth++; }
    else { depth--; if (depth === 0) out.push(html.slice(from, m.index + m[0].length)); }
  }
  return out;
}
const secId = sec => (sec.match(/^<section\b[^>]*\sid="([^"]+)"/) || [])[1] || null;
const h2Of = sec => stripTags((sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '');

const KIND = h => {
  if (/^1\. แนวคิดและหลักตัดสินใจ$/.test(h)) return 'principles';
  if (/^Interactive Prompt Builder/.test(h)) return 'promptbuilder';
  if (/^Checklist ก่อนนำไปใช้$|^Checklist ความพร้อมก่อนนำไปใช้จริง$/.test(h)) return 'checklist';
  if (/^Quiz /.test(h)) return 'quiz';
  if (/^ข้อจำกัดและสถานะฟีเจอร์$/.test(h)) return 'limits';
  if (/^เครื่องมือช่วยตัดสินใจเบื้องต้น$/.test(h)) return 'decision';
  return 'keep';
};

// make a kept section safe for our page: no handlers, prefixed ids, in-page anchors handled by the app
function clean(sec, n) {
  let s = sec
    .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/\s on[a-z]+="[^"]*"/g, '').replace(/\son[a-z]+="[^"]*"/g, '')
    .replace(/\sid="([^"]+)"/g, (m, id) => ` id="dl${n}-${id}"`)
    .replace(/<a href="#([^"]+)"/g, (m, id) => `<a href="#dl${n}-${id}" data-scroll="dl${n}-${id}"`)
    .replace(/<a (href="https?:[^"]+")(?![^>]*target=)/g, '<a $1 target="_blank" rel="noopener noreferrer"')
    .replace(/<table>/g, '<div class="table-wrap" tabindex="0"><table class="tbl">').replace(/<\/table>/g, '</table></div>');
  // apply wording rules to text nodes only
  s = s.replace(/>([^<]+)</g, (m, t) => '>' + sanitizeText(t) + '<');
  return s;
}

function parseQuizFieldsets(sec) {
  return [...sec.matchAll(/<fieldset>([\s\S]*?)<\/fieldset>/g)].map(m => ({
    q: stripTags((m[1].match(/<legend>([\s\S]*?)<\/legend>/) || [])[1] || ''),
    opts: [...m[1].matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)].map(x => stripTags(x[1]))
  }));
}
function parseQuizDivs(sec) {
  return [...sec.matchAll(/<div class="q">([\s\S]*?)<div aria-live/g)].map(m => ({
    q: stripTags((m[1].match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || ''),
    opts: [...m[1].matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)].map(x => stripTags(x[1]))
  }));
}
const arr = (script, name) => { const m = script.match(new RegExp('const ' + name + '=(\\[[^\\]]*\\])')); return m ? JSON.parse(m[1]) : null; };
const checklistItems = sec => [...sec.matchAll(/<label[^>]*>\s*<input[^>]*type="checkbox"[^>]*\/?>([\s\S]*?)<\/label>/g)].map(m => sanitizeText(stripTags(m[1])));
const fieldsOf = sec => [...sec.matchAll(/<label[^>]*>([\s\S]*?)<\/label>\s*<(?:textarea|input)([^>]*)>/g)].map(m => ({ id: (m[2].match(/id="([^"]+)"/) || [])[1], label: stripTags(m[1]), ph: sanitizeText((m[2].match(/placeholder="([^"]*)"/) || [])[1] || '') })).filter(f => /^f\d$/.test(f.id || ''));

export function buildDeep() {
  const chapters = loadV10();
  const shared = { principles: null, quiz: null, checklist: null, limits: null };
  const sourceBlocks = new Map(); // dedupe identical "เนื้อหาเชิงลึกจากคู่มือเดิม" blocks
  const lessons = []; const report = { removedAsShared: {}, dedupedBlocks: [], sanitized: 0 };
  for (const c of chapters) {
    const n = c.n; const body = c.body; const script = c.scripts.join('\n');
    const head = body.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    const outcome = sanitizeText(stripTags(((head && head[1].match(/ผลลัพธ์หลังเรียน:[^<]*/)) || [''])[0]).replace(/^ผลลัพธ์หลังเรียน:\s*/, ''));
    const lede = head ? sanitizeText(stripTags((head[1].match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '')) : '';
    const nav = (body.match(/<nav[^>]*>[\s\S]*?<\/nav>/) || [''])[0];
    const headExtra = head && n === 1 ? clean('<div class="deep-head">' + head[1].replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '').replace(/<span class="appicon[^>]*>[\s\S]*?<\/span>/, '') + '</div>', n) : '';
    const parts = []; const widgets = {};
    for (const sec of topSections(body)) {
      const h = h2Of(sec); const kind = KIND(h);
      if (kind === 'principles') { shared.principles ||= clean(sec, 0); report.removedAsShared.principles = (report.removedAsShared.principles || 0) + 1; parts.push({ kind: 'ref', ref: 'principles' }); continue; }
      if (kind === 'limits') { shared.limits ||= clean(sec, 0); report.removedAsShared.limits = (report.removedAsShared.limits || 0) + 1; widgets.limits = true; continue; }
      if (kind === 'quiz') {
        const qs = sec.includes('<fieldset>') ? parseQuizFieldsets(sec) : parseQuizDivs(sec);
        const ans = arr(script, 'correct') || arr(script, 'answers');
        const why = (() => { const m = script.match(/const (?:reasons|explanations)=(\[[^\]]*\])/); return m ? JSON.parse(m[1]) : []; })();
        const quiz = qs.map((q, i) => ({ q: sanitizeText(q.q), opts: q.opts.map(sanitizeText), a: ans[i], why: sanitizeText(why[i] || '') }));
        if (n === 1) { widgets.quiz = { title: h, intro: sanitizeText(stripTags((sec.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '')), items: quiz }; parts.push({ kind: 'widget', w: 'quiz', id: secId(sec) }); }
        else { shared.quiz ||= quiz; report.removedAsShared.quiz = (report.removedAsShared.quiz || 0) + 1; parts.push({ kind: 'widget', w: 'quiz', id: secId(sec) }); }
        continue;
      }
      if (kind === 'checklist') {
        const items = checklistItems(sec);
        if (n === 1) widgets.checklist = { title: h, items };
        else { shared.checklist ||= items; widgets.checklist = { title: h, items: shared.checklist }; }
        parts.push({ kind: 'widget', w: 'checklist', id: secId(sec) }); continue;
      }
      if (kind === 'promptbuilder') { widgets.pb = { title: h, intro: sanitizeText(stripTags((sec.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '')), fields: fieldsOf(sec), variant: n === 1 ? 'ecosystem' : 'lesson' }; parts.push({ kind: 'widget', w: 'pb', id: secId(sec) }); continue; }
      if (kind === 'decision') {
        const opts = [...sec.matchAll(/<option value="([^"]+)">([^<]*)<\/option>/g)].map(m => ({ v: m[1], t: m[2] }));
        const m = script.match(/const choices=(\{[\s\S]*?\});/);
        const choices = m ? Function('"use strict";return (' + m[1] + ')')() : {}; // build-time only, trusted repo content
        widgets.decision = { title: h, intro: stripTags((sec.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || ''), label: stripTags((sec.match(/<label[^>]*>([\s\S]*?)<\/label>/) || [])[1] || ''), opts, choices };
        parts.push({ kind: 'widget', w: 'decision', id: secId(sec) }); continue;
      }
      // deep-content blocks repeated in two lessons → keep the first, link from the second
      const src = sec.match(/เนื้อหาเชิงลึกจากคู่มือเดิม — (บทที่ \d+[^<]*)/);
      if (src) {
        const key = textOf(sec.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '')).replace(/\d+\.\s/g, '');
        if (sourceBlocks.has(key)) { const first = sourceBlocks.get(key); report.dedupedBlocks.push({ lesson: n, block: src[1], keptIn: first.n }); parts.push({ kind: 'dup', title: sanitizeText(h), of: first.n, anchor: first.anchor }); continue; }
        const anchor = `dl${n}-src${parts.length}`; sourceBlocks.set(key, { n, anchor });
        parts.push({ kind: 'html', html: `<div id="${anchor}" class="dl-anchor">${clean(sec, n)}</div>` }); continue;
      }
      parts.push({ kind: 'html', html: clean(sec, n) });
    }
    lessons.push({ n, title: sanitizeText(c.title), icon: c.icon, outcome, lede, sources: c.sources, headExtra, nav: nav ? clean(nav, n) : '', parts, widgets, group: deepGroupOf(n).key });
  }
  return { lessons, shared, report };
}

// ---- completeness expectations for scripts/audit.mjs ----
// Every text node of every v10 lesson must appear either on the lesson page (kept content, widgets)
// or on the Deep Learning overview (content that was identical in every lesson).
const decodeEnt = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const textNodes = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<textarea[\s\S]*?<\/textarea>/g, '').split(/<[^>]+>/).map(t => decodeEnt(t).replace(/\s+/g, ' ').trim()).filter(t => t && /[\p{L}\p{N}]/u.test(t));
export function deepAtoms() {
  const chapters = loadV10();
  const lesson = {}; const shared = new Set(); const dropped = [];
  const seenSrc = new Set();
  for (const c of chapters) {
    const n = c.n; lesson[n] = [];
    const head = c.body.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    if (head) lesson[n].push(...textNodes(head[1]).filter(t => !/^DEEP LEARNING · บท|^บทที่ \d+ · |^[A-Z]{1,2}$/.test(t)).map(sanitizeText)); // kicker + app icon letters are replaced by the app header
    const nav = c.body.match(/<nav[^>]*>[\s\S]*?<\/nav>/); if (nav) lesson[n].push(...textNodes(nav[0]).map(sanitizeText));
    for (const sec of topSections(c.body)) {
      const h = h2Of(sec); const kind = KIND(h); const atoms = textNodes(sec).map(sanitizeText);
      if (kind === 'principles' || kind === 'limits') { atoms.forEach(a => shared.add(a)); continue; }
      if (kind === 'quiz') {
        const keepQ = atoms.filter(a => !/^(ตรวจคำตอบ|ตรวจคำตอบและดูเฉลย|เริ่มทำใหม่|ยังไม่ได้ทำแบบทดสอบ)$/.test(a));
        if (n === 1) lesson[n].push(...keepQ); else keepQ.forEach(a => shared.add(a));
        continue;
      }
      if (kind === 'checklist') { const items = atoms.filter(a => !/^\d+\/\d+ ข้อ$|^ดำเนินการ \d+\/\d+ ข้อ$/.test(a)); if (n === 1) lesson[n].push(...items); else items.forEach(a => shared.add(a)); continue; }
      if (kind === 'promptbuilder') { lesson[n].push(...atoms.filter(a => !/^(สร้าง Prompt|สร้าง Master Prompt|คัดลอก Prompt)$/.test(a))); dropped.push({ n, what: 'ปุ่ม สร้าง/คัดลอก Prompt (แทนด้วย Prompt ที่สร้างอัตโนมัติและปุ่มคัดลอก)' }); continue; }
      if (kind === 'decision') { lesson[n].push(...atoms.filter(a => !/^แนะนำแนวทาง$|^เลือกสถานการณ์แล้วกดแนะนำแนวทาง$/.test(a))); continue; }
      const src = sec.match(/เนื้อหาเชิงลึกจากคู่มือเดิม — (บทที่ \d+[^<]*)/);
      if (src) { const key = textOf(sec.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '')).replace(/\d+\.\s/g, ''); if (seenSrc.has(key)) { lesson[n].push(sanitizeText(h)); continue; } seenSrc.add(key); }
      lesson[n].push(...atoms);
    }
  }
  return { lesson, shared: [...shared], dropped };
}
