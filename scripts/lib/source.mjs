// Parser for content/copilot-ai-agents-for-work.md
// Splits Part 2 into chapters → pages (verbatim markdown bodies) plus appendices.
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
export const SRC_MD = path.join(ROOT, 'content', 'copilot-ai-agents-for-work.md');

export function readJSON(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name), 'utf8'));
}

export function parseSource(file = SRC_MD) {
  const md = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const p2 = md.indexOf('\n# ส่วนที่ 2');
  const apA = md.indexOf('\n# ภาคผนวก A');
  const apB = md.indexOf('\n# ภาคผนวก B');
  if (p2 < 0 || apA < 0 || apB < 0) throw new Error('source structure changed: part markers not found');
  const part1 = md.slice(0, p2);
  const part2 = md.slice(p2, apA);
  const appendixA = md.slice(apA, apB).trim();
  const appendixB = md.slice(apB).trim();

  // TOC (declared page counts per chapter)
  const toc = [...part2.matchAll(/^- \*\*บทที่ (\d+) (.+?)\*\* — (\d+) หน้า$/gm)].map(m => ({ n: +m[1], title: m[2], pages: +m[3] }));

  const chapters = [];
  const chParts = part2.split(/^## บทที่ /m).slice(1);
  for (const raw of chParts) {
    const nl = raw.indexOf('\n');
    const headLine = raw.slice(0, nl);
    const m = headLine.match(/^(\d+): (.+)$/);
    if (!m) throw new Error('bad chapter heading: ' + headLine);
    const body = raw.slice(nl + 1);
    const firstPage = body.search(/^### หน้า /m);
    const pre = firstPage >= 0 ? body.slice(0, firstPage) : body;
    const key = (pre.match(/รหัสบท: `([^`]+)`/) || [])[1];
    const group = (pre.match(/กลุ่มสี: `([^`]+)`/) || [])[1];
    const goalsLine = (pre.match(/^- เป้าหมายการเรียนรู้: (.+)$/m) || [])[1] || '';
    const ch = { n: +m[1], title: m[2], key, group, goals: goalsLine ? goalsLine.split(' / ') : [], pages: [] };
    const pageParts = (firstPage >= 0 ? body.slice(firstPage) : '').split(/^### หน้า /m).slice(1);
    for (const pr of pageParts) {
      const pnl = pr.indexOf('\n');
      const ph = pr.slice(0, pnl).match(/^(\d+): (.+)$/);
      if (!ph) throw new Error('bad page heading: ' + pr.slice(0, 80));
      let pbody = pr.slice(pnl + 1);
      // remove trailing horizontal rules that separate chapters
      pbody = pbody.replace(/\n-{3,}\s*$/s, '\n').trimEnd() + '\n';
      const tm = pbody.match(/<!-- page-type: ([a-z0-9]+)(?: · agent-id: (\d+))? -->/);
      if (!tm) throw new Error('page without page-type: ' + ph[1]);
      pbody = pbody.replace(tm[0], '').trim() + '\n';
      ch.pages.push({ n: +ph[1], title: ph[2], type: tm[1], agent: tm[2] ? +tm[2] : null, chapter: ch.n, md: pbody });
    }
    chapters.push(ch);
  }
  return { part1, part2, toc, chapters, appendixA, appendixB, raw: md };
}

// ---- helpers for content atoms (used by inventory + audit) ----
export function codeBlocks(md) {
  return [...md.matchAll(/^[ \t]*```(\w*)\n([\s\S]*?)\n[ \t]*```/gm)].map(m => {
    // de-indent by the fence indentation
    const fenceIndent = (m[0].match(/^[ \t]*/) || [''])[0].length;
    const body = m[2].split('\n').map(l => l.slice(Math.min(fenceIndent, l.match(/^[ \t]*/)[0].length))).join('\n');
    return { lang: m[1], text: body };
  });
}
export function urlsOf(md) {
  return [...new Set([...md.matchAll(/https?:\/\/[^\s)`'"<>|\]]+/g)].map(m => m[0].replace(/[.,;:]+$/, '')))];
}
export function tablesOf(md) {
  const out = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\|.*\|\s*$/.test(lines[i]) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const rows = [lines[i]];
      let j = i + 2;
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) rows.push(lines[j++]);
      out.push(rows.map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())));
      i = j;
    }
  }
  return out;
}

// Agent builder blocks extracted verbatim from an agent page
export function builderBlocksOf(md) {
  const i = md.indexOf('##### สร้าง Agent นี้');
  if (i < 0) return null;
  const side = md.slice(i);
  const take = label => {
    const re = new RegExp('\\*\\*' + label + '\\*\\*[^\\n]*\\n\\n```text\\n([\\s\\S]*?)\\n```');
    const m = side.match(re);
    return m ? m[1] : null;
  };
  const all = (side.match(/###### Agent Builder Setup[\s\S]*?```text\n([\s\S]*?)\n```/) || [])[1] || null;
  const sites = [...side.matchAll(/^\d+\.\s+\[([^\]]+)\]\((https?:[^)]+)\)(.*?)`(https?:[^`]+)`\s*$/gm)].map(m => ({ name: m[1], url: m[2], use: m[3].trim(), urlText: m[4] }));
  const declared = {
    name: (side.match(/\*\*Name\*\*(\d[\d,]*)\/30/) || [])[1],
    description: (side.match(/\*\*Description\*\*(\d[\d,]*)\/1,000/) || [])[1],
    instructions: (side.match(/\*\*Instructions\*\*(\d[\d,]*)\/8,000/) || [])[1]
  };
  return {
    all, sites, declared,
    name: take('Name'), description: take('Description'), instructions: take('Instructions'),
    knowledge: take('Knowledge'), capabilities: take('Capabilities'), starters: take('Starter prompts'),
    intro: (side.match(/##### สร้าง Agent นี้\n\n([^\n]+)/) || [])[1] || '',
    note: (side.match(/\n(วางทีละ URL[^\n]+)/) || [])[1] || '',
    setupNote: (side.match(/###### Agent Builder Setup\n\n([^\n]+)/) || [])[1] || ''
  };
}

// Thai-aware character count matching JS String.length (UTF-16 code units)
export const jsLen = s => (s == null ? 0 : s.length);
