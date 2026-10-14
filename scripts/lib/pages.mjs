// Page-type renderers. Each returns { html, warnings[] } for one source page.
import { marked, renderTokens, chainPrepass, chainHTML, codeHTML, tableHTML, verifyBadge, inline, esc, ic, sectionIcon } from './render.mjs';
import { builderBlocksOf } from './source.mjs';

const lex = md => marked.lexer(md).filter(t => !['space', 'hr', 'html'].includes(t.type));
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const norm = s => String(s).replace(/\\([_*\[\]()#`>~|-])/g, '$1').replace(/\s+/g, ' ').trim();

export const READY = {
  'Copilot-assisted': 'assist', 'Connected Automation': 'connected', 'Concept Design': 'concept'
};
export const readyBadge = name => `<span class="ready ready-${READY[name] || 'assist'}">${ic(READY[name] === 'connected' ? 'plug_connected' : READY[name] === 'concept' ? 'lightbulb' : 'sparkle')}<span>${esc(name)}</span></span>`;

const TYPE_LABEL = {
  module: 'หน้าเปิดบท', agent: 'Agent', agentflow: 'Agent Flow', outline: 'บทความ', pmode: 'Prompt Mode', pbuild: 'Prompt Builder', webref: 'แหล่งอ้างอิง',
  pers: 'Microsoft 365 Personal', handoff: 'ส่งต่องาน', route: 'ตารางเลือก Agent', calc: 'เครื่องคำนวณ', calc2: 'เครื่องคำนวณ', caps: 'ตาราง', accounts: 'ตาราง',
  matrix: 'ตาราง', websrc: 'ตาราง', build: 'ขั้นตอน', instr: 'Instructions', store: 'Agent Store', plab: 'Prompt Lab', sp: 'SharePoint', objectives: 'ภาพรวม',
  chat2agent: 'แนวคิด', anatomy: 'แนวคิด', readiness: 'ระดับความพร้อม', map: 'แผนที่ Agent', office: 'Microsoft 365 Apps'
};
export const typeLabel = t => TYPE_LABEL[t] || t;
export const TYPE_ICON = {
  module: 'book_open', agent: 'bot', agentflow: 'flowchart', outline: 'document_text', pmode: 'sparkle', pbuild: 'edit', webref: 'globe', pers: 'person',
  handoff: 'mail', route: 'table', calc: 'calculator', calc2: 'calculator', caps: 'settings', accounts: 'people_team', matrix: 'grid', websrc: 'link',
  build: 'toolbox', instr: 'text_bullet_list_square', store: 'apps', plab: 'beaker', sp: 'globe', objectives: 'target_arrow', chat2agent: 'chat_multiple',
  anatomy: 'organization', readiness: 'ribbon', map: 'compass_northwest', office: 'window'
};

function tailAfterExtra(tokens) {
  const i = tokens.findIndex(t => t.type === 'paragraph' && ['อธิบายเพิ่มเติม', 'วิธีใช้หน้านี้'].includes(t.text.trim()));
  return i < 0 ? { head: tokens, tail: [] } : { head: tokens.slice(0, i), tail: tokens.slice(i) };
}

// ---------------------------------------------------------------- generic
export function renderGeneric(page, ctx) {
  const opts = { h6: 'card', tables: [], chips: null };
  if (page.type === 'office') opts.chips = ctx.officeChips;
  if (page.type === 'accounts') opts.tables.push(flatTable('ประเด็น', 4, 'เปรียบเทียบสิทธิ์บัญชี'));
  if (page.type === 'caps') opts.tables.push(flatTable('การตั้งค่า', 4, 'การตั้งค่าความสามารถ'));
  if (page.type === 'websrc') opts.tables.push(flatTable('แหล่ง', 4, 'เว็บไซต์ทั้งหมด', rows => ctx.checkWebUsage(rows), t => /^ตรวจทุก URL/.test(t)));
  if (page.type === 'map') opts.cardHook = c => ctx.groupAgentsHTML(c.title);
  let tokens = lex(page.md);
  if (page.type === 'handoff') tokens = handoffDiagram(tokens);
  return renderTokens(tokens, opts);
}

function flatTable(start, cols, label, check, stop) {
  return {
    start, stop,
    build(cells) {
      must(cells.length % cols === 0, `flat table "${start}" has ${cells.length} cells, not divisible by ${cols}`);
      const rows = [];
      for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols));
      if (check) check(rows);
      return tableHTML(rows, { label });
    }
  };
}

function handoffDiagram(tokens) {
  const a = tokens.findIndex(t => t.type === 'paragraph' && t.text.trim() === 'ต้นทาง');
  const b = tokens.findIndex(t => t.type === 'paragraph' && t.text.trim() === 'ส่งหรือบันทึกโดยคน');
  if (a < 0 || b < 0) return tokens;
  const ps = tokens.slice(a, b + 1).map(t => t.text.trim());
  const expect = ['ต้นทาง', 'หน้าเว็บหรือ SharePoint ใน Edge', 'อีเมลใน Outlook', 'ไฟล์แนบ', '**Copilot สรุปเป็น Handoff Brief**', 'เรื่องสิ่งที่ขอข้อมูลและไฟล์กำหนดเวลาAgent ที่ควรทำต่อ', 'ทำต่อ', '@Agent ตามงาน', 'ผลลัพธ์ให้คนตรวจ', 'ส่งหรือบันทึกโดยคน'];
  must(JSON.stringify(ps) === JSON.stringify(expect), 'handoff diagram text changed: ' + JSON.stringify(ps));
  const brief = ['เรื่อง', 'สิ่งที่ขอ', 'ข้อมูลและไฟล์', 'กำหนดเวลา', 'Agent ที่ควรทำต่อ'];
  must(brief.join('') === ps[5], 'handoff brief chips mismatch');
  const html = `<div class="handoff-diagram" role="img" aria-label="แผนภาพส่งต่องาน: ต้นทาง → Copilot สรุปเป็น Handoff Brief → ทำต่อด้วย Agent">
  <div class="hd-col"><div class="eyebrow">${esc(ps[0])}</div><ul>${ps.slice(1, 4).map((x, i) => `<li>${ic(['globe', 'mail', 'attach'][i])}<span>${esc(x)}</span></li>`).join('')}</ul></div>
  <div class="hd-arrow" aria-hidden="true">${ic('arrow_right')}</div>
  <div class="hd-col hd-core"><div class="hd-core-t">${ic('sparkle')}<b>Copilot สรุปเป็น Handoff Brief</b></div><ul class="chips">${brief.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="hd-arrow" aria-hidden="true">${ic('arrow_right')}</div>
  <div class="hd-col"><div class="eyebrow">${esc(ps[6])}</div><ul>${ps.slice(7).map((x, i) => `<li>${ic(['bot', 'eye', 'person'][i])}<span>${esc(x)}</span></li>`).join('')}</ul></div></div>`;
  return [...tokens.slice(0, a), { type: 'raw', html }, ...tokens.slice(b + 1)];
}

// ---------------------------------------------------------------- module
export function renderModule(page, ctx) {
  const ch = ctx.chapterOf(page);
  const wf = (ctx.workflowOf(ch) || []).map(([step, agent]) => ({ step, agent: agent ? { page: ctx.agentPage(agent), name: ctx.agentName(agent) } : null }));
  const tokens = chainPrepass(lex(page.md), wf);
  let num = '', count = '', intro = [], prep = [], goals = [], chain = '', rest = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading' && t.depth === 4) continue;
    if (t.type === 'paragraph' && /^\d{2}$/.test(t.text.trim()) && !num) { num = t.text.trim(); continue; }
    if (t.type === 'paragraph' && /^\d+ (Agent|หัวข้อ)$/.test(t.text.trim())) { count = t.text.trim(); continue; }
    if (t.type === 'paragraph' && t.text.trim() === '**เตรียมก่อนเรียน**') {
      const l = tokens[i + 1]; must(l && l.type === 'list', 'prep list missing p' + page.n);
      const items = l.items.map(it => it.text.trim());
      const gi = items.findIndex(x => ch.goals.includes(x));
      if (gi >= 0) { prep = items.slice(0, gi); goals = items.slice(gi); } else prep = items;
      i++; continue;
    }
    if (t.type === 'chain') { chain = chainHTML(t.items, t.links); continue; }
    if (t.type === 'list' && !goals.length) { goals = t.items.map(it => it.text.trim()); continue; }
    if (t.type === 'paragraph' && !rest.length) { intro.push(t.text.trim()); continue; }
    rest.push(t);
  }
  if (ch.goals.length) must(JSON.stringify(goals) === JSON.stringify(ch.goals), `module p${page.n} goals mismatch: ${JSON.stringify(goals)} vs ${JSON.stringify(ch.goals)}`);
  const list = ch.pages.filter(p => p.n !== page.n).map(p => {
    const a = p.agent ? ctx.agent(p.agent) : null;
    return `<li><a class="toc-card" href="#/p/${p.n}"><span class="tc-ic">${ic(TYPE_ICON[p.type] || 'document')}</span><span class="tc-b"><small>หน้า ${p.n} · ${esc(typeLabel(p.type))}</small><b>${esc(p.title)}</b>${a && p.type === 'agent' ? `<span class="tc-s">${esc(a.short)}</span>` : ''}</span>${a && p.type === 'agent' ? readyBadge(a.readinessName) : ''}</a></li>`;
  }).join('');
  return `<div class="module-hero">
    <div class="module-num" aria-hidden="true">${esc(num || String(ch.n).padStart(2, '0'))}</div>
    <div class="module-b">${count ? `<span class="pill">${ic(count.includes('Agent') ? 'bot' : 'book_open')}<span>${esc(count)}</span></span>` : ''}${intro.map(p => `<p class="lede">${inline(p)}</p>`).join('')}</div>
  </div>
  <div class="cards grid-2 module-boxes">
    ${prep.length ? `<article class="card prep"><div class="eyebrow">${ic('clipboard_task')} <span>เตรียมก่อนเรียน</span></div><ul class="ulist">${prep.map(x => `<li>${inline(x)}</li>`).join('')}</ul></article>` : ''}
    ${goals.length ? `<article class="card goals"><div class="eyebrow">${ic('target_arrow')} <span>เป้าหมายการเรียนรู้</span></div><ul class="checks">${goals.map(x => `<li class="ok">${ic('checkmark_circle')}<span>${inline(x)}</span></li>`).join('')}</ul></article>` : ''}
  </div>
  ${chain ? `<section class="wf"><h2 class="sec">${ic('flowchart')}<span>ห่วงโซ่ขั้นตอนงาน</span></h2><p class="hint">กดชื่อ Agent ในขั้นตอนเพื่อเปิดหน้านั้น</p>${chain}</section>` : ''}
  ${rest.length ? renderTokens(rest, { h6: 'card' }) : ''}
  <section class="in-chapter"><h2 class="sec">${ic('text_bullet_list_square')}<span>ในบทนี้</span></h2><ul class="toc-cards">${list}</ul></section>`;
}

// ---------------------------------------------------------------- agent
export function parseAgentHeader(tokens) {
  const ts = [...tokens];
  const group = ts[0].type === 'paragraph' ? ts.shift().text.trim() : '';
  const title = ts[0].type === 'heading' ? ts.shift().text.trim() : '';
  const short = ts[0].type === 'paragraph' ? ts.shift().text.trim() : '';
  const ready = ts[0].type === 'paragraph' && READY[ts[0].text.trim()] ? ts.shift().text.trim() : '';
  return { group, title, short, ready, rest: ts };
}

export function renderAgent(page, ctx) {
  const cut = page.md.indexOf('##### สร้าง Agent นี้');
  must(cut > 0, 'agent page without builder: ' + page.n);
  const { group, short, ready, rest } = parseAgentHeader(lex(page.md.slice(0, cut)));
  const a = ctx.agent(page.agent);
  must(short === a.short, `agent ${page.agent} short mismatch`);
  const sections = [];
  let cur = null;
  for (const t of rest) {
    if (t.type === 'heading' && t.depth === 6) { cur = { title: t.text, tokens: [] }; sections.push(cur); continue; }
    must(cur, 'agent content before first section p' + page.n);
    cur.tokens.push(t);
  }
  const flow = ctx.flowPage(page.agent);
  const nav = sections.map((s, i) => `<a href="#a-sec-${i}" data-scroll="a-sec-${i}">${esc(s.title)}</a>`).join('');
  const body = sections.map((s, i) => `<section class="asec" id="a-sec-${i}"><h2>${ic(sectionIcon(s.title))}<span>${inline(s.title)}</span></h2>${renderTokens(s.tokens, { h6: 'card', codeLabel: /คำถาม/.test(s.title) ? 'คำถามต่อยอด' : 'Prompt' })}</section>`).join('');
  return {
    header: { group, short, ready },
    html: `<div class="agent-layout">
    <div class="agent-main">
      <nav class="sec-nav" aria-label="หัวข้อในหน้านี้">${nav}</nav>
      ${flow ? `<a class="callout flow-link" href="#/p/${flow.n}">${ic('flowchart')}<div><b>ดูขั้นตอนการทำงานแบบเคลื่อนไหว</b><p>${esc(flow.title)} · หน้า ${flow.n}</p></div>${ic('chevron_right')}</a>` : ''}
      ${body}
    </div>
    <aside class="builder" data-builder="${page.agent}" aria-label="สร้าง Agent นี้"></aside>
  </div>`
  };
}

// ---------------------------------------------------------------- agentflow
export function renderFlow(page, ctx) {
  const tokens = lex(page.md);
  const { head, tail } = tailAfterExtra(tokens);
  const h = head.filter(t => !(t.type === 'heading' && t.depth === 4));
  must(h[0].type === 'paragraph' && READY[h[0].text.trim()], 'flow readiness p' + page.n);
  must(h[1].type === 'paragraph' && h[1].text.trim() === 'Copilot · หน้าต่างจำลอง', 'flow window label p' + page.n);
  must(h[2].type === 'paragraph' && h[3].type === 'list' && h.length === 4, 'flow structure p' + page.n);
  const a = ctx.agent(page.agent);
  const steps = h[3].items.map(it => it.text.trim());
  must(JSON.stringify(steps.map(norm)) === JSON.stringify(a.steps.map(norm)), `flow steps differ from agents.json for #${page.agent}`);
  const agentPage = a.page;
  return {
    header: { ready: h[0].text.trim() },
    html: `<div class="flow-layout" data-flow="${page.agent}">
    <div class="chatwin" aria-label="หน้าต่างแชทจำลอง">
      <div class="chatwin-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${ic('sparkle')} ${esc(h[1].text.trim())}</span><span class="sim-tag">หน้าต่างจำลอง</span></div>
      <div class="chat" data-chat aria-live="polite">
        <div class="bub u">${inline(h[2].text.trim()).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="flow-steps">
      <div class="flow-ctl"><button type="button" class="btn btn-primary" data-play><span>▶ เล่นขั้นตอนการทำงาน</span></button><button type="button" class="btn btn-subtle" data-reset>${ic('arrow_clockwise')}<span>เริ่มใหม่</span></button></div>
      <ol class="fsteps">${steps.map((s, i) => `<li><span class="fs-n">${i + 1}</span><span>${inline(s)}</span></li>`).join('')}</ol>
      ${agentPage ? `<a class="btn btn-outline" href="#/p/${agentPage}">${ic('bot')}<span>เปิดหน้าการตั้งค่า Agent</span></a>` : ''}
    </div>
  </div>
  ${agentPage ? '' : `<aside class="builder builder-wide" data-builder="${page.agent}" aria-label="สร้าง Agent นี้"></aside>`}
  ${renderTokens(tail, { h6: 'card' })}`
  };
}

// ---------------------------------------------------------------- prompt builder
export const PB_LABELS = ['งานที่ต้องการให้ AI ช่วย', 'ไฟล์หรือข้อมูลที่จะแนบ', 'ความต้องการและกติกา', 'รูปแบบผลลัพธ์', 'หัวข้อที่ต้องการแหล่งอ้างอิงจากเว็บ'];
export function renderPBuild(page) {
  const t = lex(page.md).filter(x => !(x.type === 'heading' && x.depth === 4));
  must(t[1].text.trim() === PB_LABELS.join(' '), 'prompt builder labels changed');
  const outs = t.slice(2).map(x => x.text.trim().replace(/^\*\*|\*\*$/g, ''));
  must(outs.length === 3, 'prompt builder outputs');
  const f = (id, label, el) => `<div class="field"><label for="${id}">${esc(label)}</label>${el}</div>`;
  return `<p class="lede">${inline(t[0].text)}</p>
  <div class="pb" data-pb>
    <form class="pb-form card" autocomplete="off">
      <div class="eyebrow">${ic('edit')} <span>กรอกงานของคุณ</span></div>
      ${f('pbTask', PB_LABELS[0], '<input id="pbTask" name="task" type="text">')}
      ${f('pbFile', PB_LABELS[1], '<input id="pbFile" name="file" type="text">')}
      ${f('pbNeed', PB_LABELS[2], '<textarea id="pbNeed" name="need" rows="4"></textarea>')}
      ${f('pbOut', PB_LABELS[3], '<select id="pbOut" name="out"></select>')}
      ${f('pbRef', PB_LABELS[4], '<input id="pbRef" name="ref" type="text">')}
      <button type="button" class="btn btn-subtle" data-pb-reset>${ic('arrow_clockwise')}<span>คืนค่าตัวอย่าง</span></button>
    </form>
    <div class="pb-out">${outs.map((o, i) => `<div class="prompt pb-res"><div class="prompt-head">${ic(['document_text', 'bot', 'globe'][i])}<span>${esc(o)}</span><button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code id="pbOut${i}"></code></pre></div>`).join('')}</div>
  </div>`;
}

// ---------------------------------------------------------------- prompt lab
export function renderPLab(page, ctx) {
  const tokens = lex(page.md);
  const { head, tail } = tailAfterExtra(tokens);
  const h = head.filter(x => !(x.type === 'heading' && x.depth === 4));
  const lab = ctx.promptLab;
  must(norm(h[1].text) === norm(lab[0][1]), 'prompt lab category 1 description mismatch');
  must(norm(h[2].text) === norm(lab[0][2][0]) && norm(h[3].text) === norm(lab[0][2][1]), 'prompt lab category 1 prompts mismatch');
  return `<p class="lede">${inline(h[0].text)}</p>
  <div class="tabs plab" data-tabs>
    <div class="tablist" role="tablist" aria-label="หมวด Prompt">${lab.map((c, i) => `<button type="button" role="tab" id="plt-${i}" aria-controls="plp-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(c[0])}</button>`).join('')}</div>
    ${lab.map((c, i) => `<div role="tabpanel" id="plp-${i}" aria-labelledby="plt-${i}" ${i ? 'hidden' : ''}><p class="hint">${esc(c[1])}</p><div class="cards grid-2">${c[2].map((p, k) => `<article class="card">${codeHTML(p, `${c[0]} · ${k + 1}`)}</article>`).join('')}</div>${i ? '<p class="src-note">' + ic('info') + ' หมวดนี้มาจาก data/guides.json (ไม่อยู่ในไฟล์ MD ต้นฉบับ)</p>' : ''}</div>`).join('')}
  </div>
  ${renderTokens(tail, { h6: 'card' })}`;
}

// ---------------------------------------------------------------- calculators
export const CALCS = {
  calc: {
    labels: ['ราคาอาหารสัตว์เปลี่ยน (บาท/กก. อาหาร)', 'FCR (กก. อาหาร ต่อ กก. ไก่เป็น)', 'ผลผลิตไก่เป็นต่อเดือน (กก.)', 'Yield เนื้อไก่จากไก่เป็น (%)'],
    ids: ['dp', 'fcr', 'prod', 'yld'], defaults: [1, 1.6, 1000000, 72], steps: [0.1, 0.01, 1000, 0.1], units: ['บาท/กก.', '', 'กก.', '%'],
    outs: ['ต้นทุนเพิ่มต่อ กก. ไก่เป็น', 'ต้นทุนเพิ่มต่อ กก. เนื้อไก่', 'ต้นทุนเพิ่มต่อเดือน', 'กำไรลดลงต่อปี (ราคาขายคงที่)']
  },
  calc2: {
    labels: ['ยอดเชือดที่ต้องการต่อวัน (ตัว)', 'อัตราตายตลอดการเลี้ยง (%)', 'อายุจับ (วัน)', 'ระยะพักเล้า (วัน)', 'ความจุเฉลี่ยต่อโรงเรือน (ตัว)'],
    ids: ['kill', 'mort', 'age', 'rest', 'cap'], defaults: [100000, 4, 40, 14, 20000], steps: [1000, 0.1, 1, 1, 500], units: ['ตัว', '%', 'วัน', 'วัน', 'ตัว'],
    outs: ['รอบการใช้โรงเรือน', 'ลูกไก่ที่ต้องลงต่อวัน', 'ความจุที่ต้องมีพร้อมกัน', 'จำนวนโรงเรือนโดยประมาณ']
  }
};
export function renderCalc(page) {
  const tokens = lex(page.md);
  const { head, tail } = tailAfterExtra(tokens);
  const h = head.filter(x => !(x.type === 'heading' && x.depth === 4));
  const C = CALCS[page.type];
  let i = 0;
  const lede = h[i++].text.trim();
  const eyebrow = page.type === 'calc' ? h[i++].text.trim() : '';
  must(h[i++].text.trim() === C.labels.join(' '), 'calculator labels changed p' + page.n);
  const outs = [];
  while (h[i] && /\*\*—\*\*$/.test(h[i].text.trim())) outs.push(h[i++].text.trim().replace(/\*\*—\*\*$/, ''));
  must(JSON.stringify(outs) === JSON.stringify(C.outs), 'calculator outputs changed p' + page.n);
  const formula = h[i++].text.trim();
  must(i === h.length, 'calculator extra tokens p' + page.n);
  return `<p class="lede">${inline(lede)}</p>
  <div class="calc" data-calc="${page.type}">
    <form class="card calc-form" autocomplete="off">${eyebrow ? `<div class="eyebrow">${ic('calculator')} <span>${esc(eyebrow)}</span></div>` : `<div class="eyebrow">${ic('calculator')} <span>ข้อมูลนำเข้า</span></div>`}
      ${C.labels.map((l, k) => `<div class="field"><label for="c-${C.ids[k]}">${esc(l)}</label><div class="num"><input id="c-${C.ids[k]}" type="number" inputmode="decimal" step="${C.steps[k]}" min="0" value="${C.defaults[k]}" data-k="${C.ids[k]}">${C.units[k] ? `<span>${esc(C.units[k])}</span>` : ''}</div></div>`).join('')}
      <button type="button" class="btn btn-subtle" data-calc-reset>${ic('arrow_clockwise')}<span>คืนค่าเริ่มต้น</span></button>
    </form>
    <div class="calc-out" aria-live="polite">${C.outs.map((o, k) => `<div class="kpi"><span class="kpi-l">${esc(o)}</span><b class="kpi-v" data-out="${k}">—</b><small class="kpi-f" data-f="${k}"></small></div>`).join('')}
      <p class="formula">${ic('info')}<span>${inline(formula)}</span></p></div>
  </div>
  ${renderTokens(tail, { h6: 'card' })}`;
}

// ---------------------------------------------------------------- route (agent column restored from JSON)
export function renderRoute(page, ctx) {
  const tokens = lex(page.md);
  const { head, tail } = tailAfterExtra(tokens);
  const h = head.filter(x => !(x.type === 'heading' && x.depth === 4));
  const lede = h[0].text.trim();
  const hdr = h.slice(1, 4).map(x => x.text.trim());
  must(JSON.stringify(hdr) === JSON.stringify(['งานที่เข้ามา', 'Agent ที่ทำต่อ', 'กลุ่มงาน']), 'route header changed');
  const cells = h.slice(4).map(x => x.text.trim());
  const routes = ctx.handoffRoutes;
  must(cells.length === routes.length * 2, 'route row count');
  const rows = routes.map((r, i) => {
    must(norm(cells[i * 2]) === norm(r[0]), 'route task mismatch row ' + i);
    const pg = ctx.agentPage(r[2]);
    return [cells[i * 2], { html: `<a class="agent-link" href="#/p/${pg}">${ic('bot')}<span>${esc(r[1])}</span></a>` }, cells[i * 2 + 1]];
  });
  return `<p class="lede">${inline(lede)}</p>${tableHTML([hdr, ...rows], { label: 'ตารางเลือก Agent' })}<p class="src-note">${ic('info')} คอลัมน์ "Agent ที่ทำต่อ" มาจาก data/guides.json เพราะชื่อปุ่มหายไปตอนแปลงเป็น MD</p>${renderTokens(tail, { h6: 'card' })}`;
}

// ---------------------------------------------------------------- matrix (cells restored by readiness rule, verified against MD)
export function renderMatrix(page, ctx) {
  const tokens = lex(page.md);
  const { head, tail } = tailAfterExtra(tokens);
  const h = head.filter(x => !(x.type === 'heading' && x.depth === 4)).map(x => x.text.trim());
  const badge = h[0];
  const cols = h.slice(1, 8);
  must(cols[0] === 'Agent' && cols.length === 7, 'matrix header');
  const seq = h.slice(8);
  const rows = []; let cur = null;
  for (const c of seq) { if (/^\d{2} /.test(c)) { cur = { name: c, dots: [] }; rows.push(cur); } else { must(cur && /^[●○]$/.test(c), 'matrix cell ' + c); cur.dots.push(c); } }
  must(rows.length === 67, 'matrix rows ' + rows.length);
  const BI = [3, 13, 17, 23, 24, 27];
  const need = a => { const r = a.readiness; const bi = BI.includes(a.id); return [r === 'assist' ? 2 : 1, r === 'connected' ? 2 : 1, r === 'concept' ? 2 : 0, r === 'connected' ? 2 : 0, bi ? 2 : (r === 'connected' ? 1 : 0), r === 'concept' ? 2 : 0]; };
  const mk = v => v === 2 ? '<span class="mx-req" title="จำเป็น">●</span>' : v === 1 ? '<span class="mx-opt" title="ต่อยอดได้">○</span>' : '<span class="sr-only">–</span>';
  const body = rows.map(r => {
    const id = +r.name.slice(0, 2); const a = ctx.agent(id);
    const v = need(a);
    const expectDots = v.filter(x => x).map(x => x === 2 ? '●' : '○');
    must(JSON.stringify(expectDots) === JSON.stringify(r.dots), `matrix row ${id} dots ${r.dots.join('')} ≠ rule ${expectDots.join('')}`);
    return [{ html: `<a href="#/p/${ctx.agentPage(id) || ctx.flowPage(id).n}">${esc(r.name)}</a>` }, ...v.map(x => ({ html: mk(x) }))];
  });
  return verifyBadge(badge) + tableHTML([cols, ...body], { cls: 'mx', label: 'Agent Selection Matrix' }) + `<p class="src-note">${ic('info')} ตำแหน่งเครื่องหมายในแต่ละคอลัมน์ประกอบกลับจากกติกาตามระดับความพร้อม และตรวจแล้วว่าลำดับ ● ○ ตรงกับ MD ครบ 67 แถว</p>` + renderTokens(tail, { h6: 'card' });
}

export const RENDERERS = { module: renderModule, agent: renderAgent, agentflow: renderFlow, pbuild: renderPBuild, plab: renderPLab, calc: renderCalc, calc2: renderCalc, route: renderRoute, matrix: renderMatrix };
export { builderBlocksOf };
