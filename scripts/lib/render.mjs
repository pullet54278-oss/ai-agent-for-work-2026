// Page renderer: turns one page's verbatim Markdown (from Part 2) into structured HTML.
// Every piece of source text is emitted; layout depends on page-type.
// Data lost during the original HTML→MD conversion (button labels, hidden tabs, table cells)
// is restored from data/*.json and asserted against the MD where both exist.
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const inline = s => marked.parseInline(String(s ?? '').trim())
  .replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
const plain = s => String(s ?? '').replace(/\*\*|__|`/g, '').replace(/\\([_*\[\]()#`>~|-])/g, '$1').replace(/(^|\s)_([^_]+)_(?=\s|$)/g, '$1$2').trim();
export const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

const isCaps = t => { const p = plain(t); return /^[A-Z][A-Z0-9 &+\/·.-]*$/.test(p) && p.replace(/[^A-Z]/g, '').length >= 2; };
const VERIFY_RE = /ตรวจกับบัญชีจริงก่อนสอน|ทดสอบกับบัญชีจริงก่อนสอน|ตรวจหน้าจอจริงก่อนสอน|^ร่าง ·|^ร่างข้อเสนอ|^จากการทดสอบของผู้สอน|ต้องยืนยันกับเงื่อนไข/;
const EXTRA_MARKERS = new Set(['อธิบายเพิ่มเติม', 'วิธีใช้หน้านี้']);

export function codeHTML(text, label = 'Prompt', extraCls = '') {
  return `<div class="prompt ${extraCls}"><div class="prompt-head">${ic('sparkle')}<span>${esc(label)}</span><button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code>${esc(text)}</code></pre></div>`;
}
export const verifyBadge = t => `<p class="badge-verify" role="note">${ic('warning')}<span>${inline(t)}</span></p>`;

function sigTokens(tokens) { return tokens.filter(t => t.type !== 'space' && t.type !== 'hr' && t.type !== 'html'); }

// ---------- section/icon hints ----------
const SECTION_ICONS = [
  [/ปัญหา/, 'warning'], [/เป้าหมาย/, 'target_arrow'], [/ข้อมูล|ไฟล์/, 'document_text'], [/ผลลัพธ์/, 'data_bar_vertical'],
  [/ขั้นตอน/, 'flowchart'], [/ใช้งานจริง/, 'play'], [/คำถาม|Prompt/, 'chat'], [/โครงสร้าง/, 'apps'], [/Personal|Business/, 'people_team'],
  [/ความเสี่ยง|ควบคุม/, 'shield_checkmark'], [/พัฒนา/, 'arrow_trending_lines'], [/ตัวอย่าง/, 'lightbulb'], [/เคล็ดลับ|วิธีใช้/, 'info'],
  [/ทบทวน/, 'question_circle'], [/ลงมือ/, 'rocket'], [/ประเด็น/, 'star'], [/Agent/, 'bot'], [/ทดลอง|ทดสอบ/, 'beaker'], [/บัญชี/, 'people_team'], [/เส้นทาง/, 'branch'], [/หลัง|ก่อน/, 'clipboard_task'], [/ลำดับ/, 'text_bullet_list_square'], [/การตั้งค่า/, 'settings']
];
export const sectionIcon = t => (SECTION_ICONS.find(([re]) => re.test(t)) || [0, 'circle'])[1];

// ---------- generic block engine ----------
// opts: { h6: 'card' | 'section', chips: Set<string>, cardHook(card) → html|undefined, tables: [{start:text, cols:n, build(rows)}] }
export function renderTokens(tokens, opts = {}) {
  tokens = sigTokens(tokens);
  const out = [];
  let cards = null, card = null, pendingEyebrow = null;
  let extraOpen = false;
  const pushOut = h => { out.push(h); };
  const flushCard = () => { if (card) { (cards ||= []).push(card); card = null; } };
  const flushGrid = () => {
    flushCard();
    if (cards && cards.length) pushOut(gridHTML(cards, opts));
    cards = null;
  };
  const emit = h => { if (card && card.single && card.body.length >= 1) flushGrid(); if (card) card.body.push(h); else { flushGrid(); pushOut(h); } };
  const nextSig = i => tokens[i + 1];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading') {
      if (t.depth <= 4) { if (opts.skipTitle !== false && t.depth === 4 && !opts._titleSkipped) { opts._titleSkipped = true; continue; } flushGrid(); pushOut(`<h2 class="sec">${inline(t.text)}</h2>`); continue; }
      if (t.depth === 5) { flushGrid(); pushOut(`<h2 class="sec">${ic(sectionIcon(t.text))}<span>${inline(t.text)}</span></h2>`); continue; }
      if (t.depth === 6) {
        if (opts.h6 === 'section') { flushGrid(); pushOut(`<h3 class="sub">${ic(sectionIcon(t.text))}<span>${inline(t.text)}</span></h3>`); continue; }
        flushCard(); cards ||= [];
        card = { eyebrow: pendingEyebrow, title: t.text, body: [] }; pendingEyebrow = null; continue;
      }
    }
    if (t.type === 'paragraph') {
      const txt = t.text.trim();
      const nx = nextSig(i);
      if (EXTRA_MARKERS.has(txt)) { flushGrid(); if (extraOpen) pushOut('</div></details>'); pushOut(`<details class="src-extra" open><summary>${ic('book_open')}<span>${esc(txt)}</span><small>เนื้อหาต้นฉบับ</small></summary><div class="src-extra-body">`); extraOpen = true; continue; }
      // flattened table
      const tb = (opts.tables || []).find(x => x.start === txt);
      if (tb) {
        const cells = [];
        let j = i;
        while (j < tokens.length && tokens[j].type === 'paragraph' && !EXTRA_MARKERS.has(tokens[j].text.trim()) && !(tb.stop && tb.stop(tokens[j].text.trim()))) { cells.push(tokens[j].text.trim()); j++; }
        emit(tb.build(cells));
        i = j - 1; continue;
      }
      if (isCaps(txt)) {
        if (nx && nx.type === 'heading' && nx.depth === 6 && opts.h6 !== 'section') { flushCard(); pendingEyebrow = plain(txt); continue; }
        flushCard(); cards ||= []; card = { eyebrow: plain(txt), title: null, body: [], single: true }; continue;
      }
      const stat = txt.match(/^(\d+)\*\*(.+)\*\*$/);
      if (stat) { flushCard(); cards ||= []; card = { stat: stat[1], title: stat[2], body: [], single: true }; continue; }
      if (nx && nx.type === 'heading' && nx.depth === 6 && opts.h6 !== 'section' && txt.length <= 60 && !/[.。]$/.test(txt) && (!card || card.body.length > 0) && !VERIFY_RE.test(txt)) {
        flushCard(); pendingEyebrow = txt; continue;
      }
      if (VERIFY_RE.test(txt)) { emit(verifyBadge(txt)); continue; }
      const kv = txt.match(/^\*\*([^*]+)\*\*([\s\S]+)$/);
      if (kv && !/^\s*[:：]/.test(kv[2])) {
        const label = kv[1].trim(), rest = kv[2].trim();
        if (label === 'ข้อแนะนำ') { emit(`<div class="callout tip">${ic('lightbulb')}<div><b>${esc(label)}</b><p>${inline(rest)}</p></div></div>`); continue; }
        if (/^ขั้น \d/.test(label)) { emit(`<div class="roadstep"><b>${esc(label)}</b><span>${inline(rest)}</span></div>`); continue; }
        if (label === 'ลองกับงานของคุณ') { emit(`<div class="callout cta">${ic('rocket')}<div><b>${esc(label)}</b><p>${inline(rest)}</p></div><a class="btn btn-primary" href="#/p/9">เปิด Prompt Builder ${ic('arrow_right')}</a></div>`); continue; }
        emit(`<p class="kv${isCaps(label) ? ' kv-caps' : ''}"><b>${esc(label)}</b><span>${inline(rest)}</span></p>`); continue;
      }
      if (/^\*\*[^*]+\*\*$/.test(txt) && isCaps(txt)) { flushCard(); cards ||= []; card = { eyebrow: plain(txt), title: null, body: [], single: true }; continue; }
      if (txt.includes('_→_')) { emit(chainHTML(txt.split('_→_').map(s => s.trim()))); continue; }
      if (/ → /.test(txt) && txt.length <= 80 && txt.split(' → ').every(s => s.length <= 24)) { emit(chainHTML(txt.split(' → '))); continue; }
      if (opts.chips) { const cs = chipSplit(txt, opts.chips); if (cs) { emit(`<ul class="chips">${cs.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`); continue; } }
      if (txt === '**→**') continue; // handled by chain pre-pass
      emit(`<p>${inline(txt).replace(/\n/g, '<br>')}</p>`); continue;
    }
    if (t.type === 'list') { emit(listHTML(t, opts)); continue; }
    if (t.type === 'code') { emit(codeHTML(t.text, opts.codeLabel || 'Prompt')); continue; }
    if (t.type === 'chain') { emit(chainHTML(t.items, t.links)); continue; }
    if (t.type === 'raw') { emit(t.html); continue; }
    if (t.type === 'table') { emit(tableHTML([t.header.map(h => h.text), ...t.rows.map(r => r.map(c => c.text))])); continue; }
    if (t.type === 'blockquote') { emit(`<blockquote>${renderTokens(t.tokens, { ...opts, skipTitle: false })}</blockquote>`); continue; }
    throw new Error('unhandled token ' + t.type + ': ' + (t.raw || '').slice(0, 80));
  }
  flushGrid();
  if (extraOpen) pushOut('</div></details>');
  return out.join('\n');
}

function gridHTML(cards, opts) {
  const cols = cards.length >= 4 && cards.every(c => c.body.join('').length < 400) ? 'grid-4' : cards.length === 3 ? 'grid-3' : 'grid-2';
  return `<div class="cards ${cols}">${cards.map(c => {
    const hook = opts.cardHook && opts.cardHook(c);
    return `<article class="card${c.stat ? ' stat' : ''}">${c.stat ? `<div class="stat-n">${esc(c.stat)}</div>` : ''}${c.eyebrow ? `<div class="eyebrow">${esc(c.eyebrow)}</div>` : ''}${c.title ? `<h3>${inline(c.title)}</h3>` : ''}${c.body.join('')}${hook || ''}</article>`;
  }).join('')}</div>`;
}

export function chainHTML(items, links = []) {
  return `<ol class="chain">${items.map((s, i) => {
    const m = s.match(/^(.*?)_(.+)_$/);
    const main = m ? m[1] : s, sub = m ? m[2] : '';
    const link = links[i];
    const inner = `<span class="chain-t">${inline(main)}</span>${sub ? `<small>${inline(sub)}</small>` : ''}${link ? `<a class="chain-a" href="#/p/${link.page}">${ic('bot')}<span>${esc(link.name)}</span></a>` : ''}`;
    return `<li class="${link ? 'has-agent' : ''}">${inner}</li>`;
  }).join('')}</ol>`;
}

function chipSplit(text, vocab) {
  const words = [...vocab].sort((a, b) => b.length - a.length);
  const out = []; let s = text;
  while (s.length) { const w = words.find(w => s.startsWith(w)); if (!w) return null; out.push(w); s = s.slice(w.length); }
  return out.length >= 2 ? out : null;
}

function listItemTokens(item) {
  // marked list item tokens: may contain 'text' tokens with nested inline tokens
  return item.tokens.map(t => t.type === 'text' ? { type: 'paragraph', text: t.text, raw: t.raw } : t);
}

function listHTML(list, opts) {
  const items = list.items.map(listItemTokens);
  const first = items.map(ts => sigTokens(ts)[0]);
  // step cards: "1" + heading | "1**Title**"
  const stepLike = list.ordered && first.every(f => f && f.type === 'paragraph' && /^\d+(\*\*.+\*\*)?$/.test(f.text.trim()));
  if (stepLike) {
    return `<ol class="steps">${items.map((ts, idx) => {
      const s = sigTokens(ts);
      const m = s[0].text.trim().match(/^(\d+)(?:\*\*(.+)\*\*)?$/);
      let title = m[2] || '', rest = s.slice(1);
      if (!title && rest[0] && rest[0].type === 'heading') { title = rest[0].text; rest = rest.slice(1); }
      return `<li class="step"><span class="step-n" aria-hidden="true">${esc(m[1])}</span><div class="step-b"><h3>${inline(title)}</h3>${renderTokens(rest, { ...opts, skipTitle: false, tables: [] })}</div></li>`;
    }).join('')}</ol>`;
  }
  // numbered label items: "**01**Executive Summary"
  if (list.ordered && first.every(f => f && f.type === 'paragraph' && /^\*\*\d+\*\*/.test(f.text.trim()))) {
    return `<ol class="storyline">${items.map(ts => { const m = sigTokens(ts)[0].text.trim().match(/^\*\*(\d+)\*\*(.*)$/); return `<li><b>${esc(m[1])}</b><span>${inline(m[2])}</span></li>`; }).join('')}</ol>`;
  }
  const checks = first.every(f => f && f.type === 'paragraph' && /^\*\*[✓✕]\*\*/.test(f.text.trim()));
  if (checks) {
    return `<ul class="checks">${items.map(ts => { const t = sigTokens(ts)[0].text.trim(); const ok = t.startsWith('**✓**'); return `<li class="${ok ? 'ok' : 'no'}">${ic(ok ? 'checkmark_circle' : 'dismiss_circle')}<span class="sr-only">${ok ? '✓' : '✕'}</span><span>${inline(t.replace(/^\*\*[✓✕]\*\*/, ''))}</span></li>`; }).join('')}</ul>`;
  }
  const tag = list.ordered ? 'ol' : 'ul';
  return `<${tag} class="${list.ordered ? 'olist' : 'ulist'}">${items.map(ts => {
    const s = sigTokens(ts);
    if (s.length === 1 && s[0].type === 'paragraph') return `<li>${inline(s[0].text)}</li>`;
    return `<li>${renderTokens(s, { ...opts, skipTitle: false, tables: [] })}</li>`;
  }).join('')}</${tag}>`;
}

export function tableHTML(rows, opts = {}) {
  const [head, ...body] = rows;
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(opts.label || 'ตาราง')}"><table class="tbl ${opts.cls || ''}"><thead><tr>${head.map(h => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map((c, i) => i === 0 && opts.rowHeader !== false ? `<th scope="row">${typeof c === 'object' ? c.html : inline(c)}</th>` : `<td>${typeof c === 'object' ? c.html : inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// Turn "P, **→**, P, **→**, P" runs into a chain token
export function chainPrepass(tokens, workflow = []) {
  const s = sigTokens(tokens);
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const t = s[i];
    if (t.type === 'paragraph' && s[i + 1] && s[i + 1].type === 'paragraph' && s[i + 1].text.trim() === '**→**') {
      const items = [t.text.trim()];
      let j = i + 1;
      while (s[j] && s[j].type === 'paragraph' && s[j].text.trim() === '**→**' && s[j + 1] && s[j + 1].type === 'paragraph') { items.push(s[j + 1].text.trim()); j += 2; }
      const links = items.map(it => { const name = it.replace(/_.+_$/, '').trim(); const w = workflow.find(w => w.step === name); return w && w.agent ? w.agent : null; });
      out.push({ type: 'chain', items, links });
      i = j - 1; continue;
    }
    out.push(t);
  }
  return out;
}

export { marked };
