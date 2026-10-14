/* Copilot AI Agents for Work 2026 — interactive learning app (vanilla JS, no framework) */
(() => {
'use strict';
const D = JSON.parse(document.getElementById('app-data').textContent);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
const md = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (v, d = 2, min = 0) => Number.isFinite(v) ? new Intl.NumberFormat('th-TH', { maximumFractionDigits: d, minimumFractionDigits: min }).format(v) : '—';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};

// ---------- data ----------
const TOTAL = D.meta.totalPages;
const HOME = { n: 1, title: 'หน้าแรก: Copilot AI Agents for Work 2026', type: 'home', chapter: 1, icon: 'home', typeLabel: 'หน้าแรก' };
const PAGES = [HOME, ...D.pages].sort((a, b) => a.n - b.n);
const PI = new Map(PAGES.map(p => [p.n, p]));
const CH = new Map(D.chapters.map(c => [c.n, c]));
const AG = D.agents;
const AGL = Object.values(AG).sort((a, b) => a.id - b.id);
CH.get(1).pages = [1, ...CH.get(1).pages];
const pageGroup = p => p.agent && AG[p.agent] ? AG[p.agent].group : CH.get(p.chapter).group;
const gvar = g => `--dc:var(--g-${g})`;
const moduleOf = ch => ch.pages.find(n => PI.get(n).type === 'module') || ch.pages[0];

// ---------- state ----------
const visited = new Set(store.get('cpa26-visited', []));
const done = new Set(store.get('cpa26-done', []));
let cur = null;
let booted = false;
const ATT = {};
let timers = [];
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

// ---------- toast ----------
let toastT;
function toast(msg) {
  const t = $('#toast'); t.innerHTML = ic('checkmark_circle') + '<span>' + esc(msg) + '</span>';
  t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; t.classList.remove('show'); }, 2700);
}

// ---------- copy ----------
function copyText(text, btn, selectEl) {
  const label = btn && btn.querySelector('span');
  const orig = label ? label.textContent : '';
  const ok = () => { toast('คัดลอกแล้ว'); if (btn) { btn.classList.add('ok'); if (label) label.textContent = 'คัดลอกแล้ว'; setTimeout(() => { btn.classList.remove('ok'); if (label) label.textContent = orig; }, 1600); } };
  const fail = () => {
    if (selectEl) { const r = document.createRange(); r.selectNodeContents(selectEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast(selectEl ? 'คัดลอกอัตโนมัติไม่ได้ · เลือกข้อความให้แล้ว กด Ctrl+C' : 'คัดลอกไม่ได้ในหน้าต่างนี้');
  };
  try { if (navigator.clipboard && window.isSecureContext !== false) navigator.clipboard.writeText(text).then(ok, fail); else fail(); } catch (e) { fail(); }
}

// ---------- progress ----------
function saveProgress() { store.set('cpa26-visited', [...visited]); store.set('cpa26-done', [...done]); }
function updateProgress() {
  $('#progTxt').textContent = `เรียนแล้ว ${done.size}/${TOTAL}`;
  $('#progBar').style.width = (done.size / TOTAL * 100) + '%';
}
function chapterDone(ch) { return ch.pages.filter(n => done.has(n)).length; }
function toggleDone(n) {
  const ch = CH.get(PI.get(n).chapter);
  const before = chapterDone(ch) === ch.pages.length;
  if (done.has(n)) done.delete(n); else { done.add(n); visited.add(n); }
  saveProgress(); updateProgress(); renderTOC();
  const b = $('#doneBtn'); if (b) setDoneBtn(b, done.has(n));
  if (!before && chapterDone(ch) === ch.pages.length) toast(`จบบทที่ ${ch.n} แล้ว`);
  else if (done.has(n)) toast('บันทึกว่าเรียนหน้านี้แล้ว');
}
function setDoneBtn(b, is) {
  b.setAttribute('aria-pressed', is);
  b.innerHTML = is ? `${ic('checkmark_circle')}<span>เรียนหน้านี้แล้ว · กดเพื่อยกเลิก</span>` : `${ic('circle')}<span>ทำเครื่องหมายว่าเรียนหน้านี้แล้ว</span>`;
}
const ring = (doneN, total, size = 22) => { const r = size / 2 - 2.5, c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="bgc" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="fgc" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - (total ? doneN / total : 0))}"/></svg>`; };

// ---------- TOC ----------
const openCh = new Set(store.get('cpa26-open', []));
function renderTOC() {
  const q = $('#tocQ').value.trim().toLowerCase();
  const g = $('#tocGroup').value;
  const html = D.chapters.map(ch => {
    const pages = ch.pages.map(n => PI.get(n)).filter(p => (!g || pageGroup(p) === g || (p.type === 'module' && ch.group === g)) && (!q || p.title.toLowerCase().includes(q) || String(p.n) === q));
    if (!pages.length) return '';
    const exp = q || g || openCh.has(ch.n) || (cur && cur.chapter === ch.n);
    const d = chapterDone(ch);
    return `<div class="ch" style="${gvar(ch.group)}"><button type="button" class="ch-h" data-ch="${ch.n}" aria-expanded="${!!exp}" aria-controls="pl-${ch.n}">${ic('chevron_right', 'chev')}<span class="ch-n">${String(ch.n).padStart(2, '0')}</span><span class="ch-t">${esc(ch.title)}</span>${ring(d, ch.pages.length)}<span class="sr-only">เรียนแล้ว ${d} จาก ${ch.pages.length} หน้า</span></button>
    <ul class="pl" id="pl-${ch.n}" ${exp ? '' : 'hidden'}>${pages.map(p => `<li style="${gvar(pageGroup(p))}"><a href="#/p/${p.n}" ${cur && cur.n === p.n ? 'aria-current="page"' : ''}><span class="pn">${p.n}</span><span class="pt">${esc(p.title)}</span><span class="dot ${done.has(p.n) ? 'd' : visited.has(p.n) ? 'v' : ''}" title="${done.has(p.n) ? 'เรียนแล้ว' : visited.has(p.n) ? 'เปิดดูแล้ว' : 'ยังไม่เปิด'}"></span></a></li>`).join('')}</ul></div>`;
  }).join('');
  $('#tocList').innerHTML = html || '<p class="empty">ไม่พบหน้าที่ตรงกับตัวกรอง</p>';
}
function scrollTocToCurrent() { const a = $('#tocList a[aria-current="page"]'); if (a) a.scrollIntoView({ block: 'nearest' }); }

// ---------- illustrations (inline SVG scenes per work group, themed by --dc) ----------
const SCENES = {
  gen: ['book_open', 'sparkle', 'lightbulb'], data: ['data_bar_vertical', 'table', 'data_trending'], farm: ['leaf_two', 'clipboard_task', 'document_text'],
  inv: ['box', 'cart', 'receipt'], fin: ['money', 'calculator', 'receipt'], sales: ['megaphone', 'people_team', 'arrow_trending_lines'],
  eng: ['wrench', 'settings', 'flash'], ci: ['arrow_trending_lines', 'target_arrow', 'lightbulb'], rep: ['board', 'slide_text', 'document_text'],
  pb: ['people_community', 'scales', 'heart_pulse'], hat: ['heart_pulse', 'timer', 'clipboard_task'], brl: ['shield_task', 'heart_pulse', 'data_bar_vertical'],
  lp: ['vehicle_truck', 'timer', 'compass_northwest'], erp: ['receipt', 'apps', 'cart'], feed: ['food_grains', 'building_factory', 'scales'],
  lab: ['beaker', 'eye', 'shield_checkmark'], qms: ['shield_checkmark', 'document_bullet_list', 'ribbon'], cis: ['leaf_two', 'arrow_sync', 'cloud']
};
const CH_ICON = { intro: 'lightbulb', pmode: 'sparkle', acct: 'people_team', build: 'toolbox', personal: 'person', handoff: 'mail', wf: 'flowchart', office: 'window', arch: 'organization' };
let illN = 0;
const spark = (x, y, r) => `<path class="il-spark" d="M${x} ${y - r}C${x + r * .18} ${y - r * .18} ${x + r * .18} ${y - r * .18} ${x + r} ${y}C${x + r * .18} ${y + r * .18} ${x + r * .18} ${y + r * .18} ${x} ${y + r}C${x - r * .18} ${y + r * .18} ${x - r * .18} ${y + r * .18} ${x - r} ${y}C${x - r * .18} ${y - r * .18} ${x - r * .18} ${y - r * .18} ${x} ${y - r}z"/>`;
function illus(g, main, cls = 'ph-art') {
  const [m, a1, a2] = SCENES[g] || SCENES.gen; const id = 'il' + (++illN);
  const u = (n, x, y, sc, f) => `<g transform="translate(${x} ${y}) scale(${sc})" style="fill:${f}"><use href="#i-${n}" width="24" height="24"/></g>`;
  return `<svg class="${cls}" viewBox="0 0 320 220" aria-hidden="true" focusable="false"${g === 'gen' ? ' style="--dc:var(--accent)"' : ''}><defs>
  <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--dc);stop-opacity:.26"/><stop offset="1" style="stop-color:var(--dc);stop-opacity:.03"/></linearGradient>
  <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--dc) 80%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--dc) 70%,#3b1d7a)"/></linearGradient>
  <pattern id="${id}p" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" style="fill:var(--dc);fill-opacity:.28"/></pattern></defs>
  <rect x="168" y="8" width="146" height="110" rx="18" fill="url(#${id}p)"/>
  <path class="art-blob" d="M150 34c50-18 128 2 146 56s-14 112-74 124-132-16-142-74 20-88 70-106z" fill="url(#${id}a)"/>
  <circle cx="214" cy="116" r="78" class="art-ring" fill="none" style="stroke:var(--dc);stroke-opacity:.35" stroke-dasharray="2 8"/>
  <circle cx="214" cy="116" r="56" fill="url(#${id}b)" class="il-core"/>
  ${u(main || m, 178, 80, 3, '#fff')}
  <g class="float1"><rect x="92" y="36" width="66" height="56" rx="14" class="il-card"/>${u(a1, 113, 52, 1, 'var(--dc)')}<rect x="104" y="80" width="42" height="4" rx="2" style="fill:var(--dc);fill-opacity:.25"/></g>
  <g class="float2"><rect x="248" y="152" width="62" height="52" rx="14" class="il-card"/>${u(a2, 267, 166, 1, 'var(--dc)')}<rect x="258" y="192" width="40" height="4" rx="2" style="fill:var(--dc);fill-opacity:.25"/></g>
  <g style="fill:var(--dc)">${spark(296, 46, 9)}${spark(134, 176, 6)}${spark(166, 22, 5)}</g></svg>`;
}

// Hero scene: file → prompt → Agent (Copilot) → result
function heroScene() {
  const logo = D.meta.copilotLogo;
  const core = logo ? `<image href="${esc(logo)}" x="208" y="138" width="84" height="84"/>` : `<g transform="translate(218 148) scale(2.6)" style="fill:#fff"><use href="#i-bot" width="24" height="24"/></g>`;
  const file = (x, y, c, t, d) => `<g transform="translate(${x} ${y})"><g class="hs-file" style="animation-delay:${d}s"><rect width="92" height="40" rx="10" class="il-card"/><rect x="10" y="9" width="22" height="22" rx="5" fill="${c}"/><text x="21" y="24" text-anchor="middle" class="hs-ext">${t}</text><rect x="40" y="13" width="40" height="5" rx="2.5" class="hs-line"/><rect x="40" y="23" width="28" height="5" rx="2.5" class="hs-line"/></g></g>`;
  return `<svg class="hero-scene" viewBox="0 0 500 360" role="img" aria-label="ภาพประกอบ: ไฟล์ → Prompt → Agent → ผลลัพธ์">
  <defs><linearGradient id="hsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F5BE3"/><stop offset=".35" stop-color="#22BE97"/><stop offset=".65" stop-color="#F2B225"/><stop offset="1" stop-color="#8A55EA"/></linearGradient>
  <radialGradient id="hsr"><stop offset="0" stop-color="#8A55EA" stop-opacity=".35"/><stop offset=".6" stop-color="#1FA3E6" stop-opacity=".12"/><stop offset="1" stop-color="#1FA3E6" stop-opacity="0"/></radialGradient></defs>
  <rect x="10" y="14" width="480" height="300" rx="20" class="hs-win"/>
  <rect x="10" y="14" width="480" height="38" rx="20" class="hs-bar"/><rect x="10" y="40" width="480" height="12" class="hs-bar"/>
  <circle cx="34" cy="33" r="5" fill="#EE5A7C"/><circle cx="52" cy="33" r="5" fill="#F2B225"/><circle cx="70" cy="33" r="5" fill="#22BE97"/>
  <rect x="160" y="24" width="180" height="18" rx="9" class="hs-url"/>
  <circle cx="250" cy="180" r="110" fill="url(#hsr)" class="hs-glow"/>
  <path class="hs-path" d="M128 108 C170 108 180 150 206 168"/><path class="hs-path" d="M128 158 C160 158 180 172 206 178"/><path class="hs-path" d="M128 208 C170 208 180 196 206 190"/><path class="hs-path" d="M296 180 C330 180 340 150 370 150"/>
  <path class="hs-flow" d="M128 108 C170 108 180 150 206 168"/><path class="hs-flow" style="animation-delay:-.8s" d="M128 208 C170 208 180 196 206 190"/><path class="hs-flow" style="animation-delay:-1.6s" d="M296 180 C330 180 340 150 370 150"/>
  ${file(34, 88, '#1D7A45', 'X', 0)}${file(34, 138, '#C23B5A', 'P', .4)}${file(34, 188, '#2557E0', 'W', .8)}
  <circle cx="250" cy="180" r="56" class="hs-core"/><circle cx="250" cy="180" r="66" fill="none" stroke="url(#hsg)" stroke-width="2.5" class="hs-pulse"/>
  ${core}
  <g transform="translate(150 62)"><g class="hs-bub"><rect width="176" height="40" rx="14" class="il-card"/><g transform="translate(12 9) scale(.92)" style="fill:#2557E0"><use href="#i-chat" width="24" height="24"/></g><rect x="42" y="12" width="108" height="5" rx="2.5" class="hs-line"/><rect x="42" y="23" width="70" height="5" rx="2.5" class="hs-line"/></g></g>
  <g transform="translate(370 104)"><g class="hs-res"><rect width="104" height="112" rx="14" class="il-card"/><rect x="16" y="64" width="12" height="30" rx="3" fill="#22BE97"/><rect x="34" y="50" width="12" height="44" rx="3" fill="#1FA3E6"/><rect x="52" y="36" width="12" height="58" rx="3" fill="#2557E0"/><rect x="70" y="56" width="12" height="38" rx="3" fill="#8A55EA"/><rect x="16" y="18" width="56" height="6" rx="3" class="hs-line"/><circle cx="88" cy="22" r="10" fill="#178F6B"/><path d="M83 22l3.5 3.5L93 18" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>
  ${['ไฟล์', 'Prompt', 'Agent', 'ผลลัพธ์'].map((t, i) => `<g transform="translate(${44 + i * 112} 334)"><circle r="12" fill="url(#hsg)"/><text y="4.5" text-anchor="middle" class="hs-n">${i + 1}</text><text x="20" y="5" class="hs-step">${t}</text>${i < 3 ? `<path d="M${76} 0h18" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="2 4"/>` : ''}</g>`).join('')}
  </svg>`;
}
const art = icon => illus('gen', icon);

// ---------- page header / footer ----------
function headerHTML(p) {
  const ch = CH.get(p.chapter);
  const a = p.agent ? AG[p.agent] : null;
  const crumb = `<nav class="crumb" aria-label="ตำแหน่ง"><a href="#/">${ic('home')} หน้าแรก</a><span aria-hidden="true">›</span><a href="#/p/${moduleOf(ch)}">บทที่ ${ch.n} · ${esc(ch.title)}</a><span class="pill">${ic(p.icon)}<span>${esc(p.typeLabel)}</span></span><span class="pill">หน้า ${p.n} / ${TOTAL}</span></nav>`;
  let meta = '';
  if (p.type === 'agent' || p.type === 'agentflow') {
    const ready = p.header.ready || a.readinessName;
    meta = `<div class="ph-meta"><span class="pill g">${ic(D.groups[a.group].icon)}<span>${esc(p.header.group || a.groupName)}</span></span>${readyBadge(ready)}<span class="pill">${ic('bot')}<span>Agent #${a.id}</span></span></div>`;
  }
  const big = p.type === 'module';
  return `<header class="ph${big ? ' ph-module' : ''}">${illus(pageGroup(p), p.type === 'agent' || p.type === 'agentflow' ? 'bot' : big ? (CH_ICON[ch.key] || null) : p.icon, 'ph-art')}${crumb}<h1>${esc(p.title)}</h1>${p.header.short ? `<p class="short">${esc(p.header.short)}</p>` : ''}${meta}</header>`;
}
const READYK = { 'Copilot-assisted': 'assist', 'Connected Automation': 'connected', 'Concept Design': 'concept' };
function readyBadge(name) { const k = READYK[name] || 'assist'; return `<span class="ready ready-${k}" title="${esc(D.readiness[k].th)}">${ic(k === 'connected' ? 'plug_connected' : k === 'concept' ? 'lightbulb' : 'sparkle')}<span>${esc(name)}</span></span>`; }
function pagerHTML(n) {
  const i = PAGES.findIndex(p => p.n === n);
  const pv = PAGES[i - 1], nx = PAGES[i + 1];
  return `<nav class="pager" aria-label="เปลี่ยนหน้า">${pv ? `<a href="#/p/${pv.n}" rel="prev"><small>← ก่อนหน้า</small><b>${esc(pv.title)}</b></a>` : ''}${nx ? `<a class="nx" href="#/p/${nx.n}" rel="next"><small>เรียนต่อ →</small><b>${esc(nx.title)}</b></a>` : ''}</nav>`;
}
const copyLine = () => `<p class="copy-line">${esc(D.meta.copyright)}</p>`;

// ---------- router ----------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  closeDrawer(); closeMenus(); clearTimers();
  const m = h.match(/^p\/(\d+)$/);
  if (m && PI.has(+m[1])) return +m[1] === 1 ? renderHome() : renderPage(+m[1]);
  if (h === 'agents') return renderDirectoryPage();
  const b = h.match(/^builder(?:\/(\d+))?$/); if (b) return renderStudio(b[1] ? +b[1] : null);
  if (h === 'progress') return renderProgress();
  if (h === 'appendix-a') return renderAppendix('ภาคผนวก A: ทะเบียน Agent ทั้งหมด', D.appendixA, 'table');
  if (h === 'appendix-b') return renderAppendix('ภาคผนวก B: เว็บไซต์สำหรับ Knowledge', D.appendixB, 'link');
  return renderHome();
}
function setMain(html, title, n) {
  const main = $('#main');
  main.innerHTML = `<div class="wrap page-enter">${html}</div>`;
  document.title = title ? `${title} · Copilot AI Agents for Work 2026` : 'Copilot AI Agents for Work 2026';
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (booted) main.focus({ preventScroll: true });
  booted = true;
  $('#bbNext').disabled = n === TOTAL + 1;
}

function renderPage(n) {
  const p = PI.get(n); cur = p;
  visited.add(n); saveProgress(); store.set('cpa26-last', n);
  setMain(`<div style="${gvar(pageGroup(p))}">${headerHTML(p)}<div class="content">${p.html}</div>${p.supp || ''}<div class="done-bar"><button type="button" class="btn btn-done" id="doneBtn"></button></div>${pagerHTML(n)}${copyLine()}</div>`, p.title, n);
  setDoneBtn($('#doneBtn'), done.has(n));
  mount($('#main'), p);
  renderTOC(); scrollTocToCurrent(); updateProgress();
}

// ---------- mount interactive widgets ----------
function mount(root, p) {
  $$('[data-builder]', root).forEach(el => renderBuilder(el, +el.dataset.builder));
  $$('[data-flow]', root).forEach(el => initFlow(el, +el.dataset.flow));
  $$('[data-pb]', root).forEach(initPB);
  $$('[data-calc]', root).forEach(initCalc);
  $$('[data-tabs]', root).forEach(initTabs);
  $$('.vlist', root).forEach(el => initChecklist(el, p ? p.n : 0));
}

// ---------- tabs ----------
function initTabs(box) {
  const tabs = $$(':scope > .tablist [role="tab"]', box);
  const select = (t, focus) => {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; const pnl = document.getElementById(x.getAttribute('aria-controls')); if (pnl) pnl.hidden = !on; });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const k = e.key; let j = null;
      if (k === 'ArrowRight') j = (i + 1) % tabs.length; else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length; else if (k === 'Home') j = 0; else if (k === 'End') j = tabs.length - 1;
      if (j != null) { e.preventDefault(); e.stopPropagation(); select(tabs[j], true); }
    });
  });
}

// ---------- supplement checklist (remembered per page) ----------
function initChecklist(list, n) {
  const all = store.get('cpa26-chk', {});
  const key = n + ':' + (list.dataset.k || '0');
  const on = new Set(all[key] || []);
  $$('input[type="checkbox"]', list).forEach((c, i) => {
    c.checked = on.has(i);
    c.addEventListener('change', () => { const a = store.get('cpa26-chk', {}); const s = new Set(a[key] || []); c.checked ? s.add(i) : s.delete(i); a[key] = [...s]; store.set('cpa26-chk', a); });
  });
}

// ---------- Agent Builder panel ----------
const LIMITS = { name: 30, description: 1000, instructions: 8000 };
function augmented(a) {
  const b = a.builder, files = ATT[a.id] || [];
  const good = files.filter(f => !f.error);
  if (!good.length) return { ...b, start: '' };
  const fileLines = good.map(f => `- ${f.name}` + (f.sheets && f.sheets.length ? f.sheets.map(s => `\n  - ชีต "${s.name}"${s.rows != null ? ` (${fmt(s.rows, 0)} แถว)` : ''}: ${s.cols.length ? s.cols.join(', ') : '(ไม่พบหัวคอลัมน์)'}`).join('') : ''));
  const block = `ไฟล์ที่ผู้ใช้จะแนบในแชท (โครงสร้างจากไฟล์ตัวอย่าง):\n${fileLines.join('\n')}\nใช้ชื่อชีตและหัวคอลัมน์ข้างต้นเป็นโครงสร้างอ้างอิง ถ้าไฟล์ที่แนบจริงต่างจากนี้ ให้แจ้งผู้ใช้ก่อนวิเคราะห์`;
  const lines = b.instructions.split('\n');
  let at = lines.findIndex(l => /^#+\s*3\.\s*ข้อมูลนำเข้า/.test(l));
  let instructions;
  if (at >= 0) { let j = at + 1; while (j < lines.length && /^-\s/.test(lines[j])) j++; lines.splice(j, 0, block); instructions = lines.join('\n'); }
  else instructions = b.instructions + '\n\n' + block;
  const knowledge = `${b.knowledge}\n\nไฟล์งานจริง (แนบในแชทตอนใช้งาน ไม่ได้เพิ่มเป็น Knowledge):\n${good.map(f => '- ' + f.name).join('\n')}`;
  const start = `@${b.name} แนบไฟล์: ${good.map(f => f.name).join(', ')}\n${good.filter(f => f.sheets && f.sheets.length).map(f => f.sheets.map(s => `ไฟล์ ${f.name} ชีต "${s.name}" มีคอลัมน์ ${s.cols.join(', ')}`).join('\n')).join('\n')}\nทำตามขั้นตอนที่ 1 ก่อน: ตรวจโครงสร้างข้อมูล (ชีต คอลัมน์ จำนวนแถว ช่วงเวลา) และบอกสิ่งที่ขาดหรือผิดรูปแบบ แล้วหยุดรอให้ฉันยืนยัน จากนั้นทำครบทุกขั้นตอนตาม Instructions และสรุปเป็น ${a.outputs.join(', ')}`.replace(/\n\n+/g, '\n');
  return { ...b, instructions, knowledge, start };
}
const composeAll = b => `Name: ${b.name}\n\nDescription: ${b.description}\n\nInstructions:\n${b.instructions}\n\nKnowledge:\n${b.knowledge}\n\nCapabilities:\n${b.capabilities}\n\nStarter prompts:\n${b.starters}`;
function blockHTML(key, label, text, limit, extra = '') {
  const len = text.length;
  return `<div class="prompt" data-block="${key}"><div class="prompt-head">${ic(key === 'start' ? 'rocket' : 'settings')}<span><b>${esc(label)}</b>${extra ? ' · ' + esc(extra) : ''}</span>${limit ? `<span class="cnt ${len > limit ? 'over' : ''}" title="จำนวนตัวอักษร">${fmt(len, 0)}/${fmt(limit, 0)}${key === 'description' ? '' : ' ตัวอักษร'}</span>` : ''}<button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code>${esc(text)}</code></pre></div>`;
}
function renderBuilder(el, id) {
  const a = AG[id]; const b = augmented(a); const files = ATT[id] || [];
  const over = Object.entries(LIMITS).filter(([k, l]) => b[k].length > l).map(([k]) => k);
  el.innerHTML = `<div class="builder-in">
    <h2>${ic('bot')}<span>สร้าง Agent นี้</span></h2>
    ${a.builder.source === 'json' ? `<p class="src-badge">${ic('info')} การตั้งค่านี้มาจาก data/agents.json เพราะไฟล์ MD ไม่มีหน้า Agent #${id}</p>` : ''}
    <p class="b-intro">${md(b.intro)}</p>
    <h3>${ic('globe')}<span>Knowledge: เว็บไซต์ 4 แหล่งสำหรับ Agent นี้</span></h3>
    <ol class="sites">${b.sites.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ${ic('open')}</a><span>${esc(s.use)}</span><code>${esc(s.url)}</code></li>`).join('')}</ol>
    <button type="button" class="btn btn-outline" data-copy-urls>${ic('link')}<span>คัดลอก URL ทั้ง ${b.sites.length} แหล่ง</span></button>
    <p class="b-note">${md(b.note)}</p>
    <h3>${ic('attach')}<span>แนบไฟล์งาน (อ่านในเบราว์เซอร์เท่านั้น)</span></h3>
    <div class="drop" tabindex="0" role="button" aria-label="แนบไฟล์: ลากไฟล์มาวาง หรือกดเพื่อเลือกไฟล์">${ic('arrow_upload')}<b>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</b><small>.xlsx .xls .csv .pdf .docx .pptx .png .jpg · ไม่อัปโหลดไปที่ใด</small><input type="file" multiple hidden accept=".xlsx,.xls,.csv,.pdf,.docx,.pptx,.png,.jpg,.jpeg"></div>
    <ul class="att">${files.map((f, i) => `<li>${ic(f.sheets ? 'table' : 'document')}<div><b>${esc(f.name)}</b><span>${fmtSize(f.size)}${f.sheets ? ' · ' + f.sheets.map(s => `${esc(s.name)}: ${s.cols.length} คอลัมน์`).join(' · ') : ''}</span>${f.error ? `<span class="err">${esc(f.error)}</span>` : ''}</div><button type="button" class="btn btn-icon" data-rm="${i}" aria-label="เอาไฟล์ ${esc(f.name)} ออก">${ic('dismiss')}</button></li>`).join('')}</ul>
    <h3>${ic('settings')}<span>Agent Builder Setup</span></h3>
    <p class="b-note">${md(b.setupNote)}</p>
    ${over.length ? `<p class="badge-verify">${ic('warning')}<span>เกินขีดจำกัดของ Agent Builder: ${over.join(', ')}</span></p>` : ''}
    <div class="bblocks">
      ${blockHTML('name', 'Name', b.name, LIMITS.name)}
      ${blockHTML('description', 'Description', b.description, LIMITS.description)}
      ${blockHTML('instructions', 'Instructions', b.instructions, LIMITS.instructions)}
      ${blockHTML('knowledge', 'Knowledge', b.knowledge)}
      ${blockHTML('capabilities', 'Capabilities', b.capabilities)}
      ${blockHTML('starters', 'Starter prompts', b.starters, 0, 'ชื่อ: ข้อความ')}
      ${b.start ? blockHTML('start', 'Prompt เริ่มงานกับไฟล์ที่แนบ', b.start) : ''}
      <details class="all-setup"><summary class="btn btn-subtle">${ic('document_text')}<span>ดูการตั้งค่าทั้งหมดในบล็อกเดียว</span></summary>${blockHTML('all', 'Agent Builder Setup ทั้งหมด', composeAll(b))}</details>
    </div>
    <button type="button" class="btn btn-primary copy-all" data-copy-all>${ic('copy')}<span>คัดลอกการตั้งค่าทั้งหมด</span></button>
    <p class="b-note"><a href="#/builder/${id}">${ic('edit')} ปรับแต่งเองใน Agent Builder Studio</a></p>
  </div>`;
  const input = $('input[type="file"]', el), drop = $('.drop', el);
  drop.addEventListener('click', e => { if (e.target !== input) input.click(); });
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addFiles(id, e.dataTransfer.files, el); });
  input.addEventListener('change', () => { addFiles(id, input.files, el); input.value = ''; });
  $$('[data-rm]', el).forEach(btn => btn.addEventListener('click', () => { ATT[id].splice(+btn.dataset.rm, 1); renderBuilder(el, id); }));
  $('[data-copy-urls]', el).addEventListener('click', e => copyText(b.sites.map(s => s.url).join('\n'), e.currentTarget));
  $('[data-copy-all]', el).addEventListener('click', e => copyText(composeAll(b), e.currentTarget, $('[data-block="all"] pre', el)));
}
const fmtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const ACCEPT = /\.(xlsx|xls|csv|pdf|docx|pptx|png|jpe?g)$/i;
let xlsxP = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxP) xlsxP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = () => { xlsxP = null; rej(new Error('โหลดตัวอ่าน Excel ไม่ได้')); }; document.head.appendChild(s); });
  return xlsxP;
}
async function readFileInfo(f) {
  const info = { name: f.name, size: f.size };
  if (!ACCEPT.test(f.name)) { info.error = 'ชนิดไฟล์ไม่รองรับ'; return info; }
  if (/\.(xlsx|xls|csv)$/i.test(f.name)) {
    if (f.size > 25 * 1048576) { info.error = 'ไฟล์ใหญ่เกิน 25 MB · อ่านเฉพาะชื่อไฟล์'; return info; }
    try {
      const X = await loadXLSX();
      const wb = /\.csv$/i.test(f.name) ? X.read(await f.text(), { type: 'string' }) : X.read(await f.arrayBuffer(), { type: 'array' });
      info.sheets = wb.SheetNames.slice(0, 20).map(name => {
        const ws = wb.Sheets[name]; const rows = X.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
        const hi = rows.findIndex(r => r.some(c => String(c).trim() !== ''));
        const cols = hi >= 0 ? rows[hi].map(c => String(c).trim()).filter(Boolean).slice(0, 60) : [];
        return { name, cols, rows: hi >= 0 ? rows.length - hi - 1 : 0 };
      });
    } catch (e) { info.error = 'อ่านโครงสร้างไฟล์ไม่ได้: ' + (e.message || e); }
  }
  return info;
}
async function addFiles(id, list, el) {
  const fs = [...list].slice(0, 10);
  ATT[id] = ATT[id] || [];
  for (const f of fs) ATT[id].push(await readFileInfo(f));
  renderBuilder(el, id);
  const okN = fs.length;
  if (okN) toast(`แนบ ${okN} ไฟล์แล้ว · อัปเดต Instructions และ Knowledge`);
}

// ---------- Agent Flow ----------
function initFlow(box, id) {
  const a = AG[id];
  const chat = $('[data-chat]', box), steps = $$('.fsteps li', box), play = $('[data-play]', box);
  const reset = () => { clearTimers(); steps.forEach(li => li.classList.remove('on')); $$('.bub.a,.typing', chat).forEach(x => x.remove()); play.disabled = false; };
  const add = (html, cls = 'bub a new') => { const b = document.createElement('div'); b.className = cls; b.innerHTML = html; chat.appendChild(b); chat.scrollTop = chat.scrollHeight; return b; };
  play.addEventListener('click', () => {
    reset(); play.disabled = true;
    const gap = reduceMotion() ? 0 : 950;
    steps.forEach((li, i) => {
      timers.push(setTimeout(() => {
        $$('.typing', chat).forEach(x => x.remove());
        steps.forEach(x => x.classList.remove('on')); li.classList.add('on');
        add(`<b>ขั้นที่ ${i + 1}</b> · ${esc(a.steps[i])}`);
        if (i < steps.length - 1 && gap) add('<i></i><i></i><i></i>', 'bub a typing');
        if (i === steps.length - 1) { add(`<b>ผลลัพธ์:</b> ${esc(a.outputs.join(', '))}<br><small>ตรวจผลก่อนใช้: ${esc(a.control)}</small>`); play.disabled = false; }
      }, gap * (i + 1)));
    });
  });
  $('[data-reset]', box).addEventListener('click', reset);
}

// ---------- Prompt Builder ----------
function initPB(box) {
  const F = { task: $('#pbTask', box), file: $('#pbFile', box), need: $('#pbNeed', box), out: $('#pbOut', box), ref: $('#pbRef', box) };
  const def = D.pbDefaults;
  F.out.innerHTML = def.outs.map(o => `<option>${esc(o)}</option>`).join('');
  const saved = store.get('cpa26-pb', null);
  const fill = v => { F.task.value = v.task; F.file.value = v.file; F.need.value = v.need; F.out.value = v.out || def.outs[0]; F.ref.value = v.ref; };
  fill(saved || { ...def, out: def.outs[0] });
  const T = D.pmodeTemplates;
  const gen = () => {
    const v = k => F[k].value.trim();
    const task = v('task') || '[งาน]', file = v('file') || '[ไฟล์]', need = v('need') || '[ความต้องการ]', out = v('out'), ref = v('ref') || task;
    const A = `เป้าหมาย: ${task}\nข้อมูลที่ใช้: ไฟล์ที่แนบ ${file}\nขั้นตอน:\n1. ตรวจข้อมูลที่ขาดหรือซ้ำ\n2. ทำงานตามความต้องการ: ${need}\n3. แสดงสูตรหรือวิธีคำนวณของทุกตัวเลข\nรูปแบบผลลัพธ์: ${out}\nข้อห้าม: ห้ามเดาข้อมูลที่ไม่มีในไฟล์ ถ้าไม่แน่ใจให้ถามก่อน`;
    const B = `งาน: ${task}\nข้อมูลที่ใช้: ${file}\nกติกา: ${need}\nรูปแบบผลลัพธ์: ${out}\n\n${T[2]}`;
    const C = T[3].replace('[หัวข้อ]', `"${ref}"`);
    [A, B, C].forEach((t, i) => { const el = $('#pbOut' + i, box); if (el.textContent !== t) { el.textContent = t; const pre = el.parentElement; pre.classList.remove('flash'); void pre.offsetWidth; pre.classList.add('flash'); } });
    store.set('cpa26-pb', { task: F.task.value, file: F.file.value, need: F.need.value, out: F.out.value, ref: F.ref.value });
  };
  Object.values(F).forEach(el => el.addEventListener('input', gen));
  F.out.addEventListener('change', gen);
  $('[data-pb-reset]', box).addEventListener('click', () => { fill({ ...def, out: def.outs[0] }); gen(); toast('คืนค่าตัวอย่างแล้ว'); });
  gen();
}

// ---------- Calculators ----------
function initCalc(box) {
  const kind = box.dataset.calc;
  const ins = $$('input[data-k]', box);
  const defaults = ins.map(i => i.defaultValue);
  const val = k => { const el = $(`input[data-k="${k}"]`, box); const v = parseFloat(el.value); return Number.isFinite(v) && v >= 0 ? v : NaN; };
  const set = (i, v, f) => { $(`[data-out="${i}"]`, box).textContent = v; $(`[data-f="${i}"]`, box).textContent = f; };
  const calc = () => {
    if (kind === 'calc') {
      const dp = val('dp'), fcr = val('fcr'), prod = val('prod'), y = val('yld') / 100;
      const live = fcr * dp, meat = y > 0 ? live / y : NaN, month = live * prod, year = month * 12;
      set(0, Number.isFinite(live) ? fmt(live, 2, 2) + ' บาท' : '—', `FCR ${fmt(fcr, 2, 2)} × Δราคา ${fmt(dp, 2, 2)}`);
      set(1, Number.isFinite(meat) ? fmt(meat, 2, 2) + ' บาท' : '—', `${fmt(live, 2, 2)} ÷ Yield ${fmt(y * 100)}%`);
      set(2, Number.isFinite(month) ? fmt(month, 0) + ' บาท' : '—', `${fmt(live, 2, 2)} × ผลผลิต ${fmt(prod, 0)} กก.`);
      set(3, Number.isFinite(year) ? fmt(year, 0) + ' บาท' : '—', `ต่อเดือน × 12`);
    } else {
      const kill = val('kill'), mort = val('mort') / 100, age = val('age'), rest = val('rest'), cap = val('cap');
      const cycle = age + rest, chicks = kill * (1 + mort), need = chicks * cycle, houses = cap > 0 ? need / cap : NaN;
      set(0, Number.isFinite(cycle) ? fmt(cycle, 0) + ' วัน' : '—', `อายุจับ ${fmt(age, 0)} + พักเล้า ${fmt(rest, 0)}`);
      set(1, Number.isFinite(chicks) ? fmt(chicks, 0) + ' ตัว' : '—', `${fmt(kill, 0)} × (1 + ${fmt(mort * 100)}%)`);
      set(2, Number.isFinite(need) ? fmt(need, 0) + ' ตัว' : '—', `${fmt(chicks, 0)} × ${fmt(cycle, 0)} วัน`);
      set(3, Number.isFinite(houses) ? '≈ ' + fmt(Math.ceil(houses), 0) + ' หลัง' : '—', Number.isFinite(houses) ? `${fmt(need, 0)} ÷ ${fmt(cap, 0)} = ${fmt(houses)}` : 'ความจุต่อหลังต้องมากกว่า 0');
    }
  };
  ins.forEach(i => i.addEventListener('input', calc));
  $('[data-calc-reset]', box).addEventListener('click', () => { ins.forEach((i, k) => { i.value = defaults[k]; }); calc(); });
  calc();
}

// ---------- Home ----------
const GROUPS3 = [
  ['พื้นฐาน: เริ่มใช้ Copilot และสร้าง Agent', 'เรียนวิธีทำงานกับ AI ที่ใช้ได้ทุกงาน ก่อนลงลึกรายกลุ่มงาน', ['intro', 'pmode', 'acct', 'build', 'personal', 'handoff']],
  ['Agent ตามกลุ่มงาน', 'Agent สำหรับงานข้อมูล การเงิน การขาย วิศวกรรม การปรับปรุง และการรายงาน', ['data', 'doc', 'inv', 'plan', 'fin', 'sales', 'eng', 'ci', 'office', 'rep', 'arch']],
  ['Agent จาก Workflow งานจริง', 'Agent ที่ออกแบบจากขั้นตอนงานจริงของ 9 กระบวนการ', ['wf', 'pb', 'hat', 'brl', 'lp', 'erp', 'feed', 'lab', 'qms', 'cis']]
];
const TOOLS = [
  ['#/agents', 'people_team', 'Agent Directory', 'ค้นหาและกรอง Agent ทั้ง 67 ตัวตามกลุ่มงานและระดับความพร้อม'],
  ['#/builder', 'toolbox', 'Agent Builder Studio', 'เขียนการตั้งค่า Agent เอง พร้อมตัวนับและตรวจกติกา URL'],
  ['#/p/9', 'edit', 'Prompt Builder', 'กรอกงานของคุณ ได้ Prompt 3 แบบทันที'],
  ['#/p/23', 'beaker', 'Prompt Lab', 'Prompt ตัวอย่าง 12 หมวด พร้อมคัดลอก'],
  ['#/p/70', 'calculator', 'คำนวณผลกระทบราคาอาหารสัตว์', 'Δต้นทุนต่อ กก. ไก่เป็น เนื้อไก่ ต่อเดือน และต่อปี'],
  ['#/p/115', 'calculator', 'คำนวณพื้นที่เลี้ยง', 'ลูกไก่ต่อวัน ความจุ และจำนวนโรงเรือน'],
  ['#/progress', 'trophy', 'Learning Progress', 'ดูความคืบหน้ารายบทและหน้าที่เรียนแล้ว'],
  ['#/appendix-a', 'table', 'ทะเบียน Agent', 'ภาคผนวก A: Agent ทั้งหมด 67 ตัว'],
  ['#/appendix-b', 'link', 'เว็บไซต์ Knowledge', 'ภาคผนวก B: เว็บไซต์ 42 แหล่ง']
];
function heroAnim() {
  const nodes = [['ไฟล์', 'Excel · PDF · Word', 'document', 20, 40], ['Prompt', 'บอกความต้องการ', 'chat', 270, 40], ['Agent', 'ทำซ้ำได้มาตรฐาน', 'bot', 20, 220], ['ผลลัพธ์', 'คนตรวจก่อนใช้', 'data_bar_vertical', 270, 220]];
  return `<svg class="hero-anim" viewBox="0 0 470 330" role="img" aria-label="เส้นทาง: ไฟล์ → Prompt → Agent → ผลลัพธ์">
  <defs><linearGradient id="hgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F5BE3"/><stop offset=".35" stop-color="#22BE97"/><stop offset=".65" stop-color="#F2B225"/><stop offset="1" stop-color="#8A55EA"/></linearGradient></defs>
  <path class="path" id="hp" d="M200 80 H270 M335 120 C335 170 110 170 95 220 M200 260 H270"/>
  <path class="flow" d="M200 80 H270"/><path class="flow" style="animation-delay:-1.1s" d="M335 120 C335 170 110 170 95 220"/><path class="flow" style="animation-delay:-2.1s" d="M200 260 H270"/>
  ${nodes.map(([t, s, i, x, y], k) => `<g class="node ${k === 2 ? 'agent' : ''}" transform="translate(${x} ${y})">${k === 2 ? '<rect class="pulse" x="-6" y="-6" width="192" height="92" rx="18" fill="none" stroke="url(#hgrad)" stroke-width="2"/>' : ''}<rect width="180" height="80" rx="14"/><g transform="translate(16 22) scale(1.5)" class="icon" fill="currentColor"><use href="#i-${i}" width="24" height="24"/></g><text x="64" y="38">${t}</text><text class="sub" x="64" y="58">${s}</text></g>`).join('')}
  </svg>`;
}
function renderHome() {
  cur = HOME; visited.add(1); saveProgress();
  const last = store.get('cpa26-last', null);
  const lastP = last && PI.get(last);
  const chByKey = Object.fromEntries(D.chapters.map(c => [c.key, c]));
  const card = k => {
    const c = chByKey[k]; if (!c) return '';
    const d = chapterDone(c);
    return `<a class="ccard ${k === 'pmode' ? 'feature' : ''}" href="#/p/${moduleOf(c)}" style="${gvar(c.group)}"><span class="cc-art">${illus(c.group, CH_ICON[c.key] || null, 'cc-svg')}</span><span class="cn">${ic(D.groups[c.group].icon)} บทที่ ${c.n}</span><b>${esc(c.title)}</b><small>${c.pages.length} หน้า${c.agents ? ` · ${c.agents} Agent` : ''}${d ? ` · เรียนแล้ว ${d}` : ''}</small><span class="bar" aria-hidden="true"><i style="width:${Math.round(d / c.pages.length * 100)}%"></i></span></a>`;
  };
  const groupsN = Object.keys(D.groups).filter(g => g !== 'gen').length;
  const mark = D.meta.copilotLogo ? `<img class="copilot-mark" src="${esc(D.meta.copilotLogo)}" alt="Microsoft Copilot" width="96" height="96">` : '';
  setMain(`<section class="hero" aria-labelledby="heroT"><div class="hero-grid"><div class="hero-txt">
    <span class="logo-chip"><img src="logo.png" alt="AI Agent for Work" width="167" height="46"></span>
    <div class="hero-word">${mark}<h1 id="heroT">Copilot</h1></div>
    <p class="hero-sub">AI Agents for Work 2026</p>
    <p class="hero-ev"><span class="pill">${ic('hat_graduation')}<span>${esc(D.meta.event)}</span></span></p>
    <p class="hero-desc">คู่มือเรียนรู้การใช้ Copilot ตั้งแต่แนบไฟล์และเขียน Prompt ไปจนถึงสร้าง Agent ที่ทำงานซ้ำได้ ครอบคลุมงานฟาร์ม การวางแผน การเงิน ห้องปฏิบัติการ และระบบคุณภาพ</p>
    <div class="hero-cta"><a class="btn btn-primary btn-lg" href="#/p/${moduleOf(chByKey.pmode)}">เริ่มที่ Prompt Mode →</a><button type="button" class="btn btn-outline btn-lg" data-open-finder>${ic('people_team')}<span>ค้นหา Agent ตามกลุ่มงาน</span></button></div>
  </div><div class="hero-art">${heroScene()}</div></div></section>
  <div class="stats">
    <div class="stat-tile"><span class="st-ic">${ic('bot')}</span><div><b>${AGL.length}</b><span>Agent พร้อมการตั้งค่าคัดลอกได้</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('people_team')}</span><div><b>${groupsN}</b><span>กลุ่มงาน</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('book_open')}</span><div><b>${D.chapters.length}</b><span>บทเรียน</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('trophy')}</span><div><b>${done.size}</b><span>หน้าที่เรียนแล้ว จาก ${TOTAL}</span></div></div>
  </div>
  ${lastP && last !== 1 ? `<a class="callout resume" href="#/p/${last}">${ic('history')}<div><b>เรียนต่อจากหน้าล่าสุด</b><p>หน้า ${last} · ${esc(lastP.title)}</p></div>${ic('chevron_right')}</a>` : ''}
  <section class="cgroup"><h2 class="sec">${ic('toolbox')}<span>เครื่องมือ</span></h2><div class="tools">${TOOLS.map(([h, i, t, s]) => `<a class="tool" href="${h}"><span class="ti">${ic(i)}</span><span><b>${esc(t)}</b><small>${esc(s)}</small></span></a>`).join('')}</div></section>
  ${GROUPS3.map(([t, s, keys]) => `<section class="cgroup"><h2 class="sec">${ic('book_open')}<span>${esc(t)}</span></h2><p>${esc(s)}</p><div class="ccards">${keys.map(card).join('')}</div></section>`).join('')}
  ${copyLine()}`, '', 1);
  renderTOC(); updateProgress();
}

// ---------- Agent directory (finder modal + page) ----------
let fState = { g: '', r: '', q: '' };
function directoryHTML(prefix) {
  const gs = [...new Set(AGL.map(a => a.group))];
  return `<div class="dir-ctl"><div class="input-ic">${ic('search')}<label class="sr-only" for="${prefix}Q">ค้นหา Agent</label><input id="${prefix}Q" type="search" placeholder="ชื่อ Agent งาน หรือข้อมูลที่ใช้…" value="${esc(fState.q)}" autocomplete="off"></div>
    <label class="sr-only" for="${prefix}R">ระดับความพร้อม</label><select id="${prefix}R" style="max-width:240px"><option value="">ทุกระดับความพร้อม</option>${Object.entries(D.readiness).map(([k, v]) => `<option value="${k}" ${fState.r === k ? 'selected' : ''}>${esc(v.n)}</option>`).join('')}</select></div>
  <div class="fchips" role="group" aria-label="กรองตามกลุ่มงาน"><button type="button" class="fchip" data-g="" aria-pressed="${!fState.g}">ทั้งหมด (${AGL.length})</button>${gs.map(g => `<button type="button" class="fchip" data-g="${g}" aria-pressed="${fState.g === g}" style="${gvar(g)}"><i></i>${esc(D.groups[g].name)} (${AGL.filter(a => a.group === g).length})</button>`).join('')}</div>
  <p class="hint" id="${prefix}Count" aria-live="polite"></p><div class="acards" id="${prefix}List"></div>`;
}
function filterAgents() {
  const q = fState.q.trim().toLowerCase();
  return AGL.filter(a => (!fState.g || a.group === fState.g) && (!fState.r || a.readiness === fState.r) && (!q || [a.name, a.short, a.groupName, a.builder.name, ...a.inputs, ...a.outputs, String(a.id)].join(' ').toLowerCase().includes(q)));
}
function agentCards(list) {
  return list.length ? list.map(a => `<article class="acard" style="${gvar(a.group)}"><div class="ah"><span class="av">${ic('bot')}</span><div><span class="gid">#${a.id} · ${esc(a.groupName)}</span><h3><a href="#/p/${a.page || a.flowPage}" data-close-finder>${esc(a.name)}</a></h3></div></div><p>${esc(a.short)}</p><p><b>ข้อมูลที่ใช้:</b> ${esc(a.inputs.join(', '))}</p><div class="af">${readyBadge(a.readinessName)}${a.flowPage && a.page ? `<a href="#/p/${a.flowPage}" data-close-finder>${ic('flowchart')} Flow</a>` : ''}<a href="#/builder/${a.id}" data-close-finder>${ic('edit')} Studio</a></div></article>`).join('') : '<p class="empty">ไม่พบ Agent ที่ตรงกับตัวกรอง</p>';
}
function wireDirectory(root, prefix) {
  const draw = () => { const l = filterAgents(); $(`#${prefix}List`, root).innerHTML = agentCards(l); $(`#${prefix}Count`, root).textContent = `แสดง ${l.length} จาก ${AGL.length} Agent`; $$('.fchip', root).forEach(c => c.setAttribute('aria-pressed', c.dataset.g === fState.g)); };
  $(`#${prefix}Q`, root).addEventListener('input', e => { fState.q = e.target.value; draw(); });
  $(`#${prefix}R`, root).addEventListener('change', e => { fState.r = e.target.value; draw(); });
  $$('.fchip', root).forEach(c => c.addEventListener('click', () => { fState.g = c.dataset.g; draw(); }));
  draw();
}
function renderDirectoryPage() {
  cur = null;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('people_team')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>เครื่องมือ</span></nav><h1>Agent Directory</h1><p class="short">Agent ทั้ง ${AGL.length} ตัว จาก ${new Set(AGL.map(a => a.group)).size} กลุ่มงาน · กดการ์ดเพื่อเปิดหน้าการตั้งค่า Agent Builder</p></header>${directoryHTML('dir')}<p class="src-note" style="margin-top:16px">${ic('info')} Agent #28 ไม่มีหน้า Agent ในไฟล์ต้นฉบับ การ์ดจึงเปิดหน้า Flow (หน้า 73) ซึ่งมีแผงการตั้งค่าครบ</p>${copyLine()}`, 'Agent Directory');
  wireDirectory($('#main'), 'dir'); renderTOC();
}
let lastFocus = null;
function openFinder() {
  lastFocus = document.activeElement;
  $('#finderBody').innerHTML = directoryHTML('fd'); wireDirectory($('#finder'), 'fd');
  $('#finder').hidden = false; $('#fdQ').focus();
}
function closeFinder() { if ($('#finder').hidden) return; $('#finder').hidden = true; if (lastFocus) lastFocus.focus(); }

// ---------- Search (Ctrl+K) ----------
let SIDX = null, cmdRes = [], cmdSel = 0;
const strip = h => h.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
function buildIndex() {
  SIDX = PAGES.filter(p => p.n !== 1).map(p => {
    const a = p.agent ? AG[p.agent] : null;
    const ch = CH.get(p.chapter);
    return { kind: 'page', n: p.n, title: p.title, t: p.title.toLowerCase(), meta: `หน้า ${p.n} · บทที่ ${ch.n} ${ch.title}`, icon: p.icon, g: pageGroup(p),
      a: a && (p.type === 'agent' || p.type === 'agentflow') ? [a.name, a.short, a.builder.name, ...a.inputs, ...a.outputs].join(' ').toLowerCase() : '',
      body: strip(p.html), bl: '' };
  });
  SIDX.forEach(x => { x.bl = x.body.toLowerCase(); });
  TOOLS.forEach(([h, i, t, s]) => SIDX.push({ kind: 'tool', href: h, title: t, t: t.toLowerCase(), meta: 'เครื่องมือ · ' + s, icon: i, g: 'gen', a: s.toLowerCase(), body: '', bl: '' }));
}
function cmdSearch(q) {
  if (!SIDX) buildIndex();
  q = q.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  if (!terms.length) { cmdRes = SIDX.filter(x => x.kind === 'tool').concat(SIDX.filter(x => x.kind === 'page' && x.a).slice(0, 8)).map(x => ({ x, s: 0, snip: '' })); }
  else {
    cmdRes = SIDX.map(x => {
      let s = 0;
      for (const t of terms) {
        const inT = x.t.includes(t), inA = x.a.includes(t), inB = x.bl.includes(t);
        if (!inT && !inA && !inB) return null;
        s += (inT ? 100 + (x.t.startsWith(t) ? 40 : 0) : 0) + (inA ? 40 : 0) + (inB ? 8 : 0);
      }
      let snip = '';
      if (x.body) { const i = x.bl.indexOf(terms[0]); if (i >= 0) snip = (i > 50 ? '…' : '') + x.body.slice(Math.max(0, i - 50), i + 110) + '…'; }
      return { x, s, snip };
    }).filter(Boolean).sort((a, b) => b.s - a.s || (a.x.n || 999) - (b.x.n || 999)).slice(0, 40);
  }
  cmdSel = 0; cmdRender(terms);
}
function hl(text, terms) { let h = esc(text); for (const t of terms) { if (t.length < 2) continue; h = h.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); } return h; }
function cmdRender(terms = []) {
  $('#cmdList').innerHTML = cmdRes.length ? cmdRes.map((r, i) => `<li role="option" id="cr-${i}" aria-selected="${i === cmdSel}" data-i="${i}" style="${gvar(r.x.g)}"><span class="ri">${ic(r.x.icon)}</span><span class="rb"><b>${hl(r.x.title, terms)}</b><small>${esc(r.x.meta)}</small>${r.snip ? `<small>${hl(r.snip, terms)}</small>` : ''}</span></li>`).join('') : '<li class="empty" role="option" aria-disabled="true">ไม่พบผลลัพธ์ ลองคำอื่น เช่น FCR, Salmonella, Dashboard</li>';
  $('#cmdCount').textContent = cmdRes.length ? `${cmdRes.length} รายการ` : '';
  $('#cmdQ').setAttribute('aria-activedescendant', cmdRes.length ? 'cr-' + cmdSel : '');
  const sel = $(`#cr-${cmdSel}`); if (sel) sel.scrollIntoView({ block: 'nearest' });
}
function cmdGo(i) { const r = cmdRes[i]; if (!r) return; closeCmd(); location.hash = r.x.kind === 'tool' ? r.x.href : '#/p/' + r.x.n; }
function openCmd() { lastFocus = document.activeElement; closeFinder(); $('#cmd').hidden = false; const q = $('#cmdQ'); q.value = ''; cmdSearch(''); q.focus(); }
function closeCmd() { if ($('#cmd').hidden) return; $('#cmd').hidden = true; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }

// ---------- Agent Builder Studio ----------
const SECTIONS8 = ['บทบาท', 'เป้าหมาย', 'ข้อมูลนำเข้า', 'ขั้นตอน', 'รูปแบบผลลัพธ์', 'การตรวจสอบ', 'ข้อห้าม', 'ไม่แน่ใจ'];
const BLANK_INSTR = '#### 1. บทบาท\nคุณคือ "[ชื่อ Agent]" ผู้ช่วยด้าน [งาน] ตอบเป็นภาษาไทยที่สุภาพและกระชับ\n\n#### 2. เป้าหมาย\n[ผลลัพธ์ที่ต้องได้และขอบเขตงาน]\n\n#### 3. ข้อมูลนำเข้า\n- [ไฟล์หรือข้อมูลที่ต้องได้รับ]\nก่อนเริ่มงาน ให้ตรวจว่าได้รับข้อมูลครบหรือไม่ ถ้าไม่ครบ ให้ถามผู้ใช้เป็นข้อ ๆ แล้วหยุดรอคำตอบ\n\n#### 4. ขั้นตอนการทำงาน (ทำตามลำดับทุกครั้ง)\n1. [ขั้นตอน]\n\n#### 5. รูปแบบผลลัพธ์\n- [ตาราง หัวข้อ ความยาว]\n\n#### 6. การตรวจสอบก่อนตอบ\n- [ยอดรวม แหล่งที่มา สิ่งที่ต้องยืนยัน]\n\n#### 7. ข้อห้าม\n- ห้ามเดาหรือสร้างข้อมูลที่ไม่มีในไฟล์หรือแหล่งข้อมูลที่กำหนด\n\n#### 8. เมื่อข้อมูลไม่พอหรือไม่แน่ใจ\nบอกตรง ๆ ว่าไม่แน่ใจ ระบุว่าขาดข้อมูลอะไร และเสนอวิธีหาข้อมูลเพิ่ม';
function studioFromAgent(a) {
  const b = a.builder; const cap = b.capabilities;
  return { from: a.id, name: b.name, description: b.description, instructions: b.instructions,
    sites: b.sites.map(s => ({ url: s.url, name: s.name })), only: /Only use specified sources/.test(b.knowledge),
    code: /Create documents, charts, and code: เปิด/.test(cap), images: /Create images: เปิด/.test(cap),
    starters: b.starters.split('\n').filter(Boolean).map(l => { const i = l.indexOf(': '); return i > 0 ? [l.slice(0, i), l.slice(i + 2)] : ['', l]; }) };
}
const studioBlank = () => ({ from: null, name: '', description: '', instructions: BLANK_INSTR, sites: [{ url: '', name: '' }, { url: '', name: '' }, { url: '', name: '' }, { url: '', name: '' }], only: true, code: true, images: false, starters: [['เริ่มตรวจข้อมูล', ''], ['ทำครบทุกขั้นตอน', ''], ['สรุปผู้บริหาร', ''], ['อธิบายวิธีคำนวณ', '']] });
function checkURL(u) {
  if (!u) return { ok: null, msg: '' };
  let x; try { x = new URL(u); } catch (e) { return { ok: false, msg: 'รูปแบบ URL ไม่ถูกต้อง' }; }
  if (x.protocol !== 'https:' && x.protocol !== 'http:') return { ok: false, msg: 'ต้องขึ้นต้นด้วย https://' };
  if (u.includes('?')) return { ok: false, msg: 'มีเครื่องหมาย ? ใช้ไม่ได้' };
  const depth = x.pathname.split('/').filter(Boolean).length;
  if (depth > 2) return { ok: false, msg: `ลึก ${depth} ระดับ (ไม่เกิน 2)` };
  return { ok: true, msg: `ลึก ${depth} ระดับ · ใช้ได้ (ตรวจว่าเปิดได้จริงก่อนใช้)` };
}
function studioCompose(s) {
  const sites = s.sites.filter(x => x.url.trim());
  const knowledge = `เว็บไซต์ ${sites.length} แหล่ง (บัญชีองค์กรเพิ่มไฟล์เป็น Knowledge ไม่ได้):\n${sites.map((x, i) => { let n = x.name; if (!n) { try { n = new URL(x.url).hostname; } catch (e) { n = ''; } } return `${i + 1}. ${x.url.trim()}${n ? '  (' + n + ')' : ''}`; }).join('\n')}${s.only ? '\nเปิด "Only use specified sources" เพื่อให้ตอบจากแหล่งที่กำหนดก่อน' : ''}`;
  const capabilities = `Create documents, charts, and code: ${s.code ? 'เปิด' : 'ปิด'}\nCreate images: ${s.images ? 'เปิด' : 'ปิด'}`;
  const starters = s.starters.filter(r => r[0] || r[1]).map(r => `${r[0]}: ${r[1]}`).join('\n');
  return { name: s.name, description: s.description, instructions: s.instructions, knowledge, capabilities, starters };
}
function renderStudio(fromId) {
  cur = null;
  let s = fromId && AG[fromId] ? studioFromAgent(AG[fromId]) : store.get('cpa26-studio', null) || studioBlank();
  if (fromId) { store.set('cpa26-studio', s); try { history.replaceState(null, '', '#/builder'); } catch (e) { /* ignore */ } }
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('toolbox')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>เครื่องมือ</span></nav><h1>Agent Builder Studio</h1><p class="short">เขียนการตั้งค่า Agent Builder ของคุณเอง ระบบนับตัวอักษร ตรวจโครง Instructions 8 ส่วน และตรวจกติกา URL (ไม่เกิน 4 แหล่ง ลึกไม่เกิน 2 ระดับ ไม่มี ?) ให้ทันที</p></header>
  <div class="card" style="margin-bottom:16px"><div class="field"><label for="stFrom">เริ่มจากแม่แบบ</label><select id="stFrom"><option value="">โครง Instructions 8 ส่วน (ว่าง)</option>${AGL.map(a => `<option value="${a.id}" ${s.from === a.id ? 'selected' : ''}>#${a.id} ${esc(a.name)}</option>`).join('')}</select></div><p class="hint">ร่างที่แก้ไขจะบันทึกไว้ในเบราว์เซอร์นี้อัตโนมัติ</p></div>
  <div class="studio"><form class="card" id="stForm" autocomplete="off">
    <div class="field"><div class="lbl-row"><label for="stName">Name</label><span class="cnt" data-cnt="name"></span></div><input id="stName" data-f="name" maxlength="60"></div>
    <div class="field"><div class="lbl-row"><label for="stDesc">Description</label><span class="cnt" data-cnt="description"></span></div><textarea id="stDesc" data-f="description" rows="3"></textarea></div>
    <div class="field"><div class="lbl-row"><label for="stInstr">Instructions</label><span class="cnt" data-cnt="instructions"></span></div><textarea id="stInstr" data-f="instructions" rows="16" style="font-family:var(--mono);font-size:13px"></textarea><ul class="checklist" id="stSec"></ul></div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-weight:600;font-size:14px;margin-bottom:4px">Knowledge: เว็บไซต์ (ไม่เกิน 4 แหล่ง)</legend>${[0, 1, 2, 3].map(i => `<div class="url-row"><label class="sr-only" for="stU${i}">URL ${i + 1}</label><input id="stU${i}" data-u="${i}" type="url" placeholder="https://"><span class="st" data-ust="${i}"></span></div><p class="vmsg" data-um="${i}"></p>`).join('')}
      <label class="toggle"><input type="checkbox" id="stOnly"><span>Only use specified sources</span></label></fieldset>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-weight:600;font-size:14px;margin-bottom:4px">Capabilities</legend><label class="toggle"><input type="checkbox" id="stCode"><span>Create documents, charts, and code</span></label><label class="toggle"><input type="checkbox" id="stImg"><span>Create images</span></label></fieldset>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-weight:600;font-size:14px;margin-bottom:4px">Starter prompts (ชื่อ: ข้อความ)</legend>${[0, 1, 2, 3].map(i => `<div class="url-row" style="margin-bottom:6px"><label class="sr-only" for="stS${i}a">ชื่อ ${i + 1}</label><input id="stS${i}a" data-s="${i}" data-p="0" style="max-width:38%" placeholder="ชื่อ"><label class="sr-only" for="stS${i}b">ข้อความ ${i + 1}</label><input id="stS${i}b" data-s="${i}" data-p="1" placeholder="ข้อความ"></div>`).join('')}</fieldset>
    <button type="button" class="btn btn-subtle" id="stReset">${ic('arrow_clockwise')}<span>ล้างเป็นโครงว่าง</span></button>
  </form>
  <div><div class="builder" style="position:sticky"><div class="builder-in"><h2>${ic('document_text')}<span>ผลลัพธ์สำหรับวางใน Agent Builder</span></h2><div class="bblocks" id="stOut"></div>
  <button type="button" class="btn btn-primary copy-all" id="stCopy">${ic('copy')}<span>คัดลอกการตั้งค่าทั้งหมด</span></button><button type="button" class="btn btn-outline copy-all" id="stDl">${ic('arrow_download')}<span>ดาวน์โหลดเป็นไฟล์ .txt</span></button></div></div></div></div>${copyLine()}`, 'Agent Builder Studio');
  const root = $('#main');
  const fill = () => {
    $('#stName').value = s.name; $('#stDesc').value = s.description; $('#stInstr').value = s.instructions;
    for (let i = 0; i < 4; i++) { $('#stU' + i).value = (s.sites[i] || {}).url || ''; $('#stS' + i + 'a').value = (s.starters[i] || [])[0] || ''; $('#stS' + i + 'b').value = (s.starters[i] || [])[1] || ''; }
    $('#stOnly').checked = s.only; $('#stCode').checked = s.code; $('#stImg').checked = s.images;
  };
  const read = () => {
    s.name = $('#stName').value; s.description = $('#stDesc').value; s.instructions = $('#stInstr').value;
    s.sites = [0, 1, 2, 3].map(i => { const url = $('#stU' + i).value.trim(); const prev = (s.sites[i] || {}); return { url, name: prev.url === url ? prev.name : '' }; });
    s.starters = [0, 1, 2, 3].map(i => [$('#stS' + i + 'a').value, $('#stS' + i + 'b').value]);
    s.only = $('#stOnly').checked; s.code = $('#stCode').checked; s.images = $('#stImg').checked;
  };
  const draw = () => {
    const o = studioCompose(s);
    for (const k of ['name', 'description', 'instructions']) { const l = o[k].length; const el = $(`[data-cnt="${k}"]`, root); el.textContent = `${fmt(l, 0)}/${fmt(LIMITS[k], 0)}`; el.classList.toggle('over', l > LIMITS[k]); }
    $('#stSec').innerHTML = SECTIONS8.map((w, i) => { const ok = new RegExp('^#+\\s*' + (i + 1) + '\\.?\\s*.*' + w, 'm').test(o.instructions) || new RegExp('^#+.*' + w, 'm').test(o.instructions); return `<li class="${ok ? 'ok' : 'no'}">${ic(ok ? 'checkmark_circle' : 'circle')}<span>ส่วนที่ ${i + 1}: ${w === 'ไม่แน่ใจ' ? 'เมื่อไม่แน่ใจ' : w}</span></li>`; }).join('');
    const urls = s.sites.map(x => x.url).filter(Boolean);
    s.sites.forEach((x, i) => { const r = checkURL(x.url); const dup = x.url && urls.indexOf(x.url) !== urls.lastIndexOf(x.url); $(`[data-ust="${i}"]`, root).innerHTML = r.ok === null ? '' : ic(r.ok && !dup ? 'checkmark_circle' : 'dismiss_circle'); $(`[data-ust="${i}"]`, root).className = 'st ' + (r.ok === null ? '' : r.ok && !dup ? 'ok' : 'bad'); const m = $(`[data-um="${i}"]`, root); m.textContent = dup ? 'URL ซ้ำ' : r.msg; m.className = 'vmsg' + (r.ok && !dup ? ' ok' : ''); });
    $('#stOut').innerHTML = blockHTML('name', 'Name', o.name, LIMITS.name) + blockHTML('description', 'Description', o.description, LIMITS.description) + blockHTML('instructions', 'Instructions', o.instructions, LIMITS.instructions) + blockHTML('knowledge', 'Knowledge', o.knowledge) + blockHTML('capabilities', 'Capabilities', o.capabilities) + blockHTML('starters', 'Starter prompts', o.starters, 0, 'ชื่อ: ข้อความ');
    store.set('cpa26-studio', s);
  };
  fill(); draw();
  $('#stForm').addEventListener('input', () => { read(); draw(); });
  $('#stFrom').addEventListener('change', e => { s = e.target.value ? studioFromAgent(AG[+e.target.value]) : studioBlank(); fill(); draw(); });
  $('#stReset').addEventListener('click', () => { s = studioBlank(); $('#stFrom').value = ''; fill(); draw(); toast('ล้างเป็นโครงว่างแล้ว'); });
  $('#stCopy').addEventListener('click', e => copyText(composeAll(studioCompose(s)), e.currentTarget));
  $('#stDl').addEventListener('click', () => { const blob = new Blob([composeAll(studioCompose(s))], { type: 'text/plain;charset=utf-8' }); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = ((s.name || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'agent') + '-setup.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); });
  renderTOC();
}

// ---------- Progress page ----------
function renderProgress() {
  cur = null;
  const pct = Math.round(done.size / TOTAL * 100);
  const r = 62, c = 2 * Math.PI * r;
  const last = store.get('cpa26-last', null);
  setMain(`<header class="ph" style="--dc:var(--green)">${art('trophy')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>เครื่องมือ</span></nav><h1>Learning Progress</h1><p class="short">ความคืบหน้าบันทึกในเบราว์เซอร์นี้เท่านั้น (localStorage) ไม่ส่งข้อมูลออกไปที่ใด</p></header>
  <div class="card prog-hero"><svg class="big-ring" viewBox="0 0 150 150" role="img" aria-label="เรียนแล้ว ${pct}%"><defs><linearGradient id="pgrad"><stop offset="0" stop-color="#1F5BE3"/><stop offset=".5" stop-color="#22BE97"/><stop offset="1" stop-color="#8A55EA"/></linearGradient></defs><circle class="bgc" cx="75" cy="75" r="${r}"/><circle class="fgc" cx="75" cy="75" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - done.size / TOTAL)}"/><text x="75" y="80" text-anchor="middle">${pct}%</text><text class="s" x="75" y="100" text-anchor="middle">${done.size}/${TOTAL} หน้า</text></svg>
  <div><p><b>เรียนแล้ว ${done.size} หน้า</b> · เปิดดูแล้ว ${visited.size} หน้า · จบแล้ว ${D.chapters.filter(ch => chapterDone(ch) === ch.pages.length).length}/${D.chapters.length} บท</p>${last ? `<a class="btn btn-primary" href="#/p/${last}">${ic('history')}<span>ไปหน้าล่าสุด (หน้า ${last})</span></a> ` : ''}<button type="button" class="btn btn-outline" id="progReset">${ic('arrow_clockwise')}<span>ล้างความคืบหน้า</span></button></div></div>
  <h2 class="sec">${ic('book_open')}<span>รายบท</span></h2><div class="pchap">${D.chapters.map(ch => { const d = chapterDone(ch); const nx = ch.pages.find(n => !done.has(n)) || moduleOf(ch); return `<a href="#/p/${nx}" style="${gvar(ch.group)}"><span class="n">${String(ch.n).padStart(2, '0')}</span><span><b>${esc(ch.title)}</b><span class="bar" aria-hidden="true"><i style="width:${Math.round(d / ch.pages.length * 100)}%"></i></span></span><small>${d}/${ch.pages.length} หน้า</small></a>`; }).join('')}</div>${copyLine()}`, 'Learning Progress');
  $('#progReset').addEventListener('click', () => { if (confirm('ล้างความคืบหน้าทั้งหมดในเบราว์เซอร์นี้?')) { done.clear(); visited.clear(); saveProgress(); store.set('cpa26-last', null); store.set('cpa26-chk', {}); updateProgress(); renderProgress(); toast('ล้างความคืบหน้าแล้ว'); } });
  renderTOC(); updateProgress();
}

function renderAppendix(title, html, icon) {
  cur = null;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art(icon)}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>ภาคผนวก</span></nav><h1>${esc(title)}</h1></header><div class="content">${html}</div>${copyLine()}`, title);
  renderTOC();
}

// ---------- drawer / menus ----------
const mq = matchMedia('(max-width: 900px)');
function openDrawer() { $('#sidebar').classList.add('open'); $('#scrim').hidden = false; $('#tocToggle').setAttribute('aria-expanded', 'true'); scrollTocToCurrent(); setTimeout(() => { const a = $('#tocList a[aria-current="page"]') || $('#tocQ'); a.focus({ preventScroll: true }); }, 50); }
function closeDrawer() { if (!$('#sidebar').classList.contains('open')) return; $('#sidebar').classList.remove('open'); $('#scrim').hidden = true; $('#tocToggle').setAttribute('aria-expanded', 'false'); }
function closeMenus() { const m = $('#toolsMenu'); if (!m.hidden) { m.hidden = true; $('#toolsBtn').setAttribute('aria-expanded', 'false'); } }
function nextPage(d) { const n = cur ? cur.n : 1; const i = PAGES.findIndex(p => p.n === n); const t = PAGES[i + d]; if (t) location.hash = '#/p/' + t.n; }

// ---------- events ----------
document.addEventListener('submit', e => e.preventDefault());
document.addEventListener('click', e => {
  const t = e.target;
  const copyBtn = t.closest('[data-copy]');
  if (copyBtn) { const pre = copyBtn.closest('.prompt').querySelector('pre'); copyText(pre.textContent, copyBtn, pre); return; }
  const sc = t.closest('[data-scroll]');
  if (sc) { e.preventDefault(); const el = document.getElementById(sc.dataset.scroll); if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); return; }
  const chb = t.closest('.ch-h');
  if (chb) { const n = +chb.dataset.ch; const ul = document.getElementById('pl-' + n); const open = ul.hidden; ul.hidden = !open; chb.setAttribute('aria-expanded', open); open ? openCh.add(n) : openCh.delete(n); store.set('cpa26-open', [...openCh]); return; }
  if (t.closest('[data-open-finder]')) { openFinder(); return; }
  if (t.closest('[data-close-finder]')) { closeFinder(); return; }
  if (t.closest('#cmdList li[data-i]')) { cmdGo(+t.closest('li').dataset.i); return; }
  if (t.closest('#doneBtn')) { if (cur) toggleDone(cur.n); return; }
  if (t.closest('.menu a')) { closeMenus(); return; }
  if (!t.closest('.menu-wrap')) closeMenus();
  if (t === $('#cmd')) closeCmd();
  if (t === $('#finder')) closeFinder();
});
$('#searchBtn').addEventListener('click', openCmd);
$('#finderBtn').addEventListener('click', openFinder);
$('#finderClose').addEventListener('click', closeFinder);
$('#bbFinder').addEventListener('click', openFinder);
$('#bbToc').addEventListener('click', () => $('#sidebar').classList.contains('open') ? closeDrawer() : openDrawer());
$('#tocToggle').addEventListener('click', () => $('#sidebar').classList.contains('open') ? closeDrawer() : openDrawer());
$('#scrim').addEventListener('click', closeDrawer);
$('#bbNext').addEventListener('click', () => nextPage(1));
$('#themeBtn').addEventListener('click', () => { const th = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', th); store.set('cpa26-theme', th); try { localStorage.setItem('cpa26-theme', th); } catch (e) { } });
$('#toolsBtn').addEventListener('click', () => { const m = $('#toolsMenu'); const open = m.hidden; m.hidden = !open; $('#toolsBtn').setAttribute('aria-expanded', open); if (open) m.querySelector('a').focus(); });
$('#toolsMenu').innerHTML = TOOLS.map(([h, i, t, s]) => `<a role="menuitem" href="${h}">${ic(i)}<span>${esc(t)}<small>${esc(s)}</small></span></a>`).join('');
$('#toolsMenu').addEventListener('keydown', e => { const items = $$('#toolsMenu a'); const i = items.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); } });
$('#tocQ').addEventListener('input', renderTOC);
$('#tocGroup').innerHTML = '<option value="">ทุกกลุ่มงาน</option>' + Object.entries(D.groups).filter(([k]) => k !== 'gen').map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join('');
$('#tocGroup').addEventListener('change', renderTOC);
$('#tocList').addEventListener('click', e => { if (e.target.closest('a') && mq.matches) closeDrawer(); });
$('#cmdQ').addEventListener('input', e => cmdSearch(e.target.value));
$('#cmdQ').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); if (cmdRes.length) { cmdSel = (cmdSel + 1) % cmdRes.length; cmdRender($('#cmdQ').value.trim().toLowerCase().split(/\s+/).filter(Boolean)); } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (cmdRes.length) { cmdSel = (cmdSel - 1 + cmdRes.length) % cmdRes.length; cmdRender($('#cmdQ').value.trim().toLowerCase().split(/\s+/).filter(Boolean)); } }
  else if (e.key === 'Enter') { e.preventDefault(); cmdGo(cmdSel); }
});
function trap(modal, e) { const f = $$('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])', modal).filter(x => !x.disabled && x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
document.addEventListener('keydown', e => {
  const k = e.key;
  if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K')) { e.preventDefault(); $('#cmd').hidden ? openCmd() : closeCmd(); return; }
  if (k === 'Escape') { if (!$('#cmd').hidden) return closeCmd(); if (!$('#finder').hidden) return closeFinder(); if (!$('#toolsMenu').hidden) { closeMenus(); $('#toolsBtn').focus(); return; } closeDrawer(); return; }
  if (k === 'Tab') { if (!$('#cmd').hidden) return trap($('#cmd'), e); if (!$('#finder').hidden) return trap($('#finder'), e); }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (/INPUT|TEXTAREA|SELECT/.test(tag) || document.activeElement.isContentEditable || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (!$('#cmd').hidden || !$('#finder').hidden) return;
  if (document.activeElement && document.activeElement.getAttribute('role') === 'tab') return;
  if (k === 'ArrowRight') { nextPage(1); } else if (k === 'ArrowLeft') { nextPage(-1); }
});
window.addEventListener('hashchange', route);
mq.addEventListener && mq.addEventListener('change', () => { if (!mq.matches) closeDrawer(); });

// ---------- boot ----------
if (!location.hash) { const last = store.get('cpa26-last', null); if (last && PI.has(last) && last !== 1) { /* stay on home; resume card offered */ } }
if (D.meta.copilotLogo) $('.brand-t').insertAdjacentHTML('beforebegin', `<span class="brand-sep" aria-hidden="true"></span><img class="copilot-mark" src="${esc(D.meta.copilotLogo)}" alt="Microsoft Copilot" width="30" height="30">`);
updateProgress();
route();
// reset the sequential-focus starting point so the first Tab reaches the skip link
try { document.body.setAttribute('tabindex', '-1'); document.body.focus({ preventScroll: true }); document.body.removeAttribute('tabindex'); } catch (e) { /* ignore */ }
window.__app = { D, done, visited, AG, ATT, cmdSearch: q => { cmdSearch(q); return cmdRes.map(r => r.x.n || r.x.href); } };
})();
