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
const DEEP0 = 1000;
const EX0 = 20000; // AI + Excel pages: 20101…
const TOTAL = D.meta.totalPages + D.meta.deepTotal + D.meta.excelTotal;
const HOME = { n: 1, title: 'หน้าแรก: Copilot AI Agents for Work 2026', type: 'home', chapter: 1, icon: 'home', typeLabel: 'หน้าแรก' };
const DEEPCH = D.deepGroups.map((g, i) => ({ n: 101 + i, key: g.key, title: g.th, en: g.name, desc: g.desc, group: g.key, goals: [], deep: true, pages: D.deepIndex.filter(l => l.group === g.key).map(l => DEEP0 + l.n), agents: 0 }));
const DEEPP = D.deepIndex.map(l => ({ n: DEEP0 + l.n, k: l.n, title: l.title, type: 'deep', typeLabel: 'Deep Learning', icon: 'hat_graduation', chapter: DEEPCH.find(c => c.key === l.group).n, header: { short: l.outcome ? 'ผลลัพธ์หลังเรียน: ' + l.outcome : '' }, outcome: l.outcome, text: l.text, html: null }));
const X_KIND_ICON = { overview: 'compass_northwest', lesson: 'book_open', workshop: 'hat_graduation', techniques: 'lightbulb', quiz: 'question_circle', automation: 'flowchart', tool: 'toolbox' };
const XCH = D.excel.chapters.map(c => ({ ...c, group: c.key, goals: [], excel: true, agents: 0 }));
const XP = D.excel.index.map(x => ({ n: x.n, slug: x.slug, k: x.code, title: x.title, type: 'excel', kind: x.kind, typeLabel: 'AI + Excel', icon: X_KIND_ICON[x.kind] || 'table', chapter: x.chapter, header: { short: x.short }, text: x.text, html: null }));
const XSLUG = new Map(XP.map(p => [p.slug, p.n]));
const PAGES = [HOME, ...D.pages, ...DEEPP, ...XP].sort((a, b) => a.n - b.n);
const PI = new Map(PAGES.map(p => [p.n, p]));
const CH = new Map([...D.chapters, ...DEEPCH, ...XCH].map(c => [c.n, c]));
const ALLCH = [...D.chapters, ...DEEPCH, ...XCH];
const isEx = n => n > EX0;
const isDeep = n => n > DEEP0 && n < EX0;
const hrefOf = n => isEx(n) ? `#/x/${PI.get(n).slug}` : isDeep(n) ? `#/d/${n - DEEP0}` : `#/p/${n}`;
const refN = r => { const [k, v] = r.split(':'); return k === 'd' ? DEEP0 + +v : k === 'x' ? XSLUG.get(v) : +v; };
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
  if (!before && chapterDone(ch) === ch.pages.length) toast(ch.deep ? `จบกลุ่ม ${ch.title} แล้ว` : `จบบทที่ ${ch.n} แล้ว`);
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
  const html = ALLCH.map(ch => {
    const pages = ch.pages.map(n => PI.get(n)).filter(p => (!g || pageGroup(p) === g || (p.type === 'module' && ch.group === g)) && (!q || p.title.toLowerCase().includes(q) || String(p.n) === q));
    if (!pages.length) return '';
    const exp = q || g || openCh.has(ch.n) || (cur && cur.chapter === ch.n);
    const d = chapterDone(ch);
    return `${ch.n === 101 ? '<p class="sb-sec">' + ic('hat_graduation') + ' <span>Deep Learning · 36 บทเชิงลึก</span></p>' : ch.n === 201 ? '<p class="sb-sec">' + ic('table') + ' <span>AI + Excel Formula Mastery</span></p>' : ''}<div class="ch" style="${gvar(ch.group)}"><button type="button" class="ch-h" data-ch="${ch.n}" aria-expanded="${!!exp}" aria-controls="pl-${ch.n}">${ic('chevron_right', 'chev')}<span class="ch-n">${ch.excel ? 'X' + (ch.n - 200) : ch.deep ? 'D' + (ch.n - 100) : String(ch.n).padStart(2, '0')}</span><span class="ch-t">${esc(ch.title)}</span>${ring(d, ch.pages.length)}<span class="sr-only">เรียนแล้ว ${d} จาก ${ch.pages.length} หน้า</span></button>
    <ul class="pl" id="pl-${ch.n}" ${exp ? '' : 'hidden'}>${pages.map(p => `<li style="${gvar(pageGroup(p))}"><a href="${hrefOf(p.n)}" ${cur && cur.n === p.n ? 'aria-current="page"' : ''}><span class="pn">${isDeep(p.n) || isEx(p.n) ? p.k : p.n}</span><span class="pt">${esc(p.title)}</span><span class="dot ${done.has(p.n) ? 'd' : visited.has(p.n) ? 'v' : ''}" title="${done.has(p.n) ? 'เรียนแล้ว' : visited.has(p.n) ? 'เปิดดูแล้ว' : 'ยังไม่เปิด'}"></span></a></li>`).join('')}</ul></div>`;
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
  lab: ['beaker', 'eye', 'shield_checkmark'], qms: ['shield_checkmark', 'document_bullet_list', 'ribbon'], cis: ['leaf_two', 'arrow_sync', 'cloud'],
  d1: ['lightbulb', 'book_open', 'sparkle'], d2: ['window', 'table', 'slide_text'], d3: ['bot', 'flowchart', 'plug_connected'], d4: ['shield_checkmark', 'lock_closed', 'eye'],
  d5: ['data_bar_vertical', 'clipboard_task', 'leaf_two'], d6: ['hat_graduation', 'trophy', 'rocket'],
  x0: ['table', 'sparkle', 'calculator'], xb: ['calculator', 'table', 'lightbulb'], xi: ['table', 'data_bar_vertical', 'filter'], xa: ['flowchart', 'code', 'data_bar_vertical'], xt: ['toolbox', 'beaker', 'data_bar_vertical']
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
  const crumb = isEx(p.n)
    ? `<nav class="crumb" aria-label="ตำแหน่ง"><a href="#/">${ic('home')} หน้าแรก</a><span aria-hidden="true">›</span><a href="#/excel">AI + Excel</a><span aria-hidden="true">›</span><span>${esc(ch.title)}</span><span class="pill">${ic(p.icon)}<span>${esc(p.k)}</span></span></nav>`
    : isDeep(p.n)
    ? `<nav class="crumb" aria-label="ตำแหน่ง"><a href="#/">${ic('home')} หน้าแรก</a><span aria-hidden="true">›</span><a href="#/deep">Deep Learning</a><span aria-hidden="true">›</span><span>${esc(ch.title)}</span><span class="pill">${ic('hat_graduation')}<span>บทเชิงลึก ${p.k} / ${D.meta.deepTotal}</span></span></nav>`
    : `<nav class="crumb" aria-label="ตำแหน่ง"><a href="#/">${ic('home')} หน้าแรก</a><span aria-hidden="true">›</span><a href="#/p/${moduleOf(ch)}">บทที่ ${ch.n} · ${esc(ch.title)}</a><span class="pill">${ic(p.icon)}<span>${esc(p.typeLabel)}</span></span><span class="pill">หน้า ${p.n} / ${D.meta.totalPages}</span></nav>`;
  let meta = '';
  if (p.type === 'agent' || p.type === 'agentflow') {
    const ready = p.header.ready || a.readinessName;
    meta = `<div class="ph-meta"><span class="pill g">${ic(D.groups[a.group].icon)}<span>${esc(p.header.group || a.groupName)}</span></span>${readyBadge(ready)}<span class="pill">${ic('bot')}<span>Agent #${a.id}</span></span></div>`;
  }
  const big = p.type === 'module';
  if (isDeep(p.n)) meta = `<div class="ph-meta"><span class="pill g">${ic(D.deepGroups.find(g => g.key === ch.key).icon)}<span>${esc(ch.en)}</span></span>${p.outcome ? `<span class="pill">${ic('target_arrow')}<span>ผลลัพธ์หลังเรียน</span></span>` : ''}</div>`;
  if (isEx(p.n)) meta = `<div class="ph-meta"><span class="pill g">${ic(ch.icon)}<span>${esc(ch.en)}</span></span><span class="pill">${ic('table')}<span>AI + Excel Formula Mastery</span></span></div>`;
  return `<header class="ph${big ? ' ph-module' : ''}">${illus(pageGroup(p), p.type === 'agent' || p.type === 'agentflow' ? 'bot' : big ? (CH_ICON[ch.key] || null) : isDeep(p.n) ? null : isEx(p.n) ? ch.icon : p.icon, 'ph-art')}${crumb}<h1>${esc(p.title)}</h1>${p.header.short ? `<p class="short">${esc(p.header.short)}</p>` : ''}${meta}</header>`;
}
const READYK = { 'Copilot-assisted': 'assist', 'Connected Automation': 'connected', 'Concept Design': 'concept' };
function readyBadge(name) { const k = READYK[name] || 'assist'; return `<span class="ready ready-${k}" title="${esc(D.readiness[k].th)}">${ic(k === 'connected' ? 'plug_connected' : k === 'concept' ? 'lightbulb' : 'sparkle')}<span>${esc(name)}</span></span>`; }
function pagerHTML(n) {
  const i = PAGES.findIndex(p => p.n === n);
  const pv = PAGES[i - 1], nx = PAGES[i + 1];
  return `<nav class="pager" aria-label="เปลี่ยนหน้า">${pv ? `<a href="${hrefOf(pv.n)}" rel="prev"><small>← ก่อนหน้า</small><b>${esc(pv.title)}</b></a>` : ''}${nx ? `<a class="nx" href="${hrefOf(nx.n)}" rel="next"><small>เรียนต่อ →</small><b>${esc(nx.title)}</b></a>` : ''}</nav>`;
}
const copyLine = () => `<p class="copy-line">${esc(D.meta.copyright)}</p><p class="ver-line">เวอร์ชัน ${esc(D.meta.version)} · ผู้สร้าง ${esc(D.meta.author)} · build ${esc(D.meta.built)}</p>`;

// ---------- router ----------
function route() {
  if (!gateOk()) return;
  const h = location.hash.replace(/^#\/?/, '');
  closeDrawer(); closeMenus(); clearTimers();
  const m = h.match(/^p\/(\d+)$/);
  if (m && PI.has(+m[1])) return +m[1] === 1 ? renderHome() : renderPage(+m[1]);
  const dm = h.match(/^d\/(\d+)$/); if (dm && PI.has(DEEP0 + +dm[1])) return renderPage(DEEP0 + +dm[1]);
  const xm = h.match(/^x\/([a-z0-9-]+)$/); if (xm && XSLUG.has(xm[1])) return renderPage(XSLUG.get(xm[1]));
  if (h === 'plab') { renderHome(); const pl = document.getElementById('plab'); if (pl) { pl.scrollIntoView({ block: 'start' }); const ta = document.getElementById('paText'); if (ta) ta.focus({ preventScroll: true }); } return; }
  if (h === 'excel') return renderExcelHome();
  if (h === 'deep') return renderDeepHome();
  const tm = h.match(/^track\/([a-z]+)$/); if (tm && D.tracks.some(t => t.key === tm[1])) return renderTrack(tm[1]);
  if (h === 'tracks') return renderTracks();
  if (h === 'updates') return renderUpdatesPage();
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
  const p = PI.get(n);
  if (isEx(n) && p.html == null) {
    $('#main').innerHTML = '<div class="wrap"><p class="empty">' + ic('arrow_sync') + ' กำลังโหลดหลักสูตร AI + Excel…</p></div>';
    return loadExcel().then(() => { if (location.hash === hrefOf(n)) renderPage(n); }, () => { $('#main').innerHTML = '<div class="wrap"><p class="empty">โหลดหลักสูตร AI + Excel ไม่ได้ (ไฟล์ excel-data.js)</p></div>'; });
  }
  if (isDeep(n) && p.html == null) {
    $('#main').innerHTML = '<div class="wrap"><p class="empty">' + ic('arrow_sync') + ' กำลังโหลดบทเรียนเชิงลึก…</p></div>';
    return loadDeep().then(() => { if (location.hash === hrefOf(n)) renderPage(n); }, () => { $('#main').innerHTML = '<div class="wrap"><p class="empty">โหลดบทเรียนเชิงลึกไม่ได้ (ไฟล์ deep-data.js)</p></div>'; });
  }
  cur = p;
  visited.add(n); saveProgress(); store.set('cpa26-last', n);
  setMain(`<div style="${gvar(pageGroup(p))}">${headerHTML(p)}${isDeep(n) ? relatedHTML(n) : ''}<div class="content${isDeep(n) ? ' deep-body' : isEx(n) ? ' x-body' : ''}">${p.html}</div>${isDeep(n) || isEx(n) ? '' : relatedHTML(n)}${p.supp || ''}<div class="done-bar"><button type="button" class="btn btn-done" id="doneBtn"></button></div>${pagerHTML(n)}${copyLine()}</div>`, p.title, n);
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
  $$('[data-quiz]', root).forEach(initQuiz);
  $$('[data-deep-pb]', root).forEach(initDeepPB);
  $$('[data-decision]', root).forEach(initDecision);
  mountExcel(root);
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
  const cnt = list.parentElement && $('[data-vcount]', list.parentElement);
  const upd = () => { if (cnt) cnt.textContent = `ทำแล้ว ${$$('input:checked', list).length}/${$$('input', list).length} ข้อ`; };
  list.addEventListener('change', upd); setTimeout(upd);
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
  ['#/track/agent', 'bot', 'เส้นทาง Copilot Agent', 'เส้นทางหลัก: แนวคิด สร้าง ทดสอบ และนำ Agent ไปใช้จริง'],
  ['#/updates', 'arrow_sync', 'อัปเดตล่าสุด Copilot', 'ข่าวฟีเจอร์ใหม่จาก Microsoft 365 Roadmap อัปเดตอัตโนมัติ'],
  ['#/deep', 'hat_graduation', 'Deep Learning 36 บท', 'บทเรียนเชิงลึก Workshop และแบบทดสอบประจำบท'],
  ['#/excel', 'table', 'AI + Excel Formula Mastery', 'หลักสูตร 3 ระดับ · Prompt Library · Formula Lab · Dashboard'],
  ['#/tracks', 'compass_northwest', 'เส้นทางการเรียนทั้งหมด', 'Agent · Office · เบราว์เซอร์ · Tips · งานจริง · Governance'],
  ['#/agents', 'people_team', 'Agent Directory', 'ค้นหาและกรอง Agent ทั้ง 67 ตัวตามกลุ่มงานและระดับความพร้อม'],
  ['#/builder', 'toolbox', 'Agent Builder Studio', 'เขียนการตั้งค่า Agent เอง พร้อมตัวนับและตรวจกติกา URL'],
  ['#/p/9', 'edit', 'Prompt Builder', 'กรอกงานของคุณ ได้ Prompt 3 แบบทันที'],
  ['#/plab', 'sparkle', 'Prompt Lab อัตโนมัติ', 'โยนไฟล์ PDF/Excel หรือวางข้อความ ได้ Prompt 7 แบบทันที'],
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
function chapterCardHTML(c) {
  const d = chapterDone(c);
  if (c.excel) return `<a class="ccard" href="${hrefOf(c.pages[0])}" style="${gvar(c.group)}"><span class="cc-art">${illus(c.group, c.icon, 'cc-svg')}</span><span class="cn">${ic(c.icon)} AI + Excel · ${esc(c.en)}</span><b>${esc(c.title)}</b><small>${c.pages.length} หน้า${d ? ` · เรียนแล้ว ${d}` : ''}</small><span class="bar" aria-hidden="true"><i style="width:${Math.round(d / c.pages.length * 100)}%"></i></span></a>`;
  const deepG = c.deep ? D.deepGroups.find(g => g.key === c.key) : null;
  return `<a class="ccard ${c.key === 'pmode' ? 'feature' : ''}" href="${hrefOf(c.deep ? c.pages[0] : moduleOf(c))}" style="${gvar(c.group)}"><span class="cc-art">${illus(c.group, c.deep ? deepG.icon : CH_ICON[c.key] || null, 'cc-svg')}</span><span class="cn">${ic(c.deep ? deepG.icon : D.groups[c.group].icon)} ${c.deep ? 'Deep Learning · ' + esc(deepG.name) : 'บทที่ ' + c.n}</span><b>${esc(c.title)}</b><small>${c.deep ? `บท ${deepG.a}–${deepG.b} · ${c.pages.length} บท` : `${c.pages.length} หน้า${c.agents ? ` · ${c.agents} Agent` : ''}`}${d ? ` · เรียนแล้ว ${d}` : ''}</small><span class="bar" aria-hidden="true"><i style="width:${Math.round(d / c.pages.length * 100)}%"></i></span></a>`;
}
function renderHome() {
  cur = HOME; visited.add(1); saveProgress();
  const last = store.get('cpa26-last', null);
  const lastP = last && PI.get(last);
  const chByKey = Object.fromEntries(D.chapters.map(c => [c.key, c]));
  const groupsN = Object.keys(D.groups).filter(g => g !== 'gen').length;
  const mark = D.meta.copilotLogo ? `<img class="copilot-mark" src="${esc(D.meta.copilotLogo)}" alt="Microsoft Copilot" width="96" height="96">` : '';
  setMain(`<section class="hero" aria-labelledby="heroT"><div class="hero-grid"><div class="hero-txt">
    <span class="logo-chip"><img src="logo.png" alt="AI Agent for Work" width="167" height="46"></span>
    <div class="hero-word">${mark}<h1 id="heroT">Copilot</h1></div>
    <p class="hero-sub">AI Agents for Work 2026</p>
    <p class="hero-ev"><span class="pill">${ic('hat_graduation')}<span>${esc(D.meta.event)}</span></span><span class="pill pill-ver">${ic('tag')}<span>v${esc(D.meta.version)}</span></span></p>
    <p class="hero-desc">คู่มือเรียนรู้ Microsoft Copilot เชิงลึก <b>เริ่มที่ Copilot Agent</b> ตั้งแต่แนวคิด สร้าง ทดสอบ จนนำไปใช้กับงานจริง ต่อด้วย Copilot ใน Excel, Word, PowerPoint การใช้งานบนเบราว์เซอร์ และเทคนิคขั้นสูง</p>
    <div class="hero-cta"><a class="btn btn-primary btn-lg" href="#/track/agent">${ic('bot')}<span>เริ่มเรียน Copilot Agent →</span></a><a class="btn btn-outline btn-lg" href="#/p/${moduleOf(chByKey.pmode)}">เริ่มที่ Prompt Mode →</a><button type="button" class="btn btn-subtle btn-lg" data-open-finder>${ic('people_team')}<span>ค้นหา Agent ตามกลุ่มงาน</span></button></div>
  </div><div class="hero-art">${heroScene()}</div></div></section>
  ${paSectionHTML()}
  ${updatesPanelHTML(true)}
  <section class="cgroup tracks-sec"><h2 class="sec">${ic('compass_northwest')}<span>เส้นทางการเรียน</span></h2><p>เรียงตามความสำคัญ เริ่มจาก Copilot Agent · แต่ละเส้นทางรวมหน้าในคอร์สหลักและบทเรียนเชิงลึกที่พูดเรื่องเดียวกันไว้ด้วยกัน</p>${tracksGridHTML()}</section>
  <div class="stats">
    <div class="stat-tile"><span class="st-ic">${ic('bot')}</span><div><b>${AGL.length}</b><span>Agent พร้อมการตั้งค่าคัดลอกได้</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('people_team')}</span><div><b>${groupsN}</b><span>กลุ่มงาน</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('book_open')}</span><div><b>${D.chapters.length}</b><span>บทเรียน</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('hat_graduation')}</span><div><b>${D.meta.deepTotal}</b><span>บทเชิงลึก (Deep Learning)</span></div></div>
    <div class="stat-tile"><span class="st-ic">${ic('trophy')}</span><div><b>${done.size}</b><span>หน้าที่เรียนแล้ว จาก ${TOTAL}</span></div></div>
  </div>
  ${lastP && last !== 1 ? `<a class="callout resume" href="${hrefOf(last)}">${ic('history')}<div><b>เรียนต่อจากหน้าล่าสุด</b><p>${isEx(last) ? 'AI + Excel · ' + esc(lastP.k) : isDeep(last) ? 'Deep Learning บท ' + lastP.k : 'หน้า ' + last} · ${esc(lastP.title)}</p></div>${ic('chevron_right')}</a>` : ''}
  <section class="cgroup"><h2 class="sec">${ic('toolbox')}<span>เครื่องมือ</span></h2><div class="tools">${TOOLS.map(([h, i, t, s]) => `<a class="tool" href="${h}"><span class="ti">${ic(i)}</span><span><b>${esc(t)}</b><small>${esc(s)}</small></span></a>`).join('')}</div></section>
  ${GROUPS3.map(([t, s, keys]) => `<section class="cgroup"><h2 class="sec">${ic('book_open')}<span>${esc(t)}</span></h2><p>${esc(s)}</p><div class="ccards">${keys.map(k => chByKey[k] ? chapterCardHTML(chByKey[k]) : '').join('')}</div></section>`).join('')}
  <section class="cgroup x-home"><h2 class="sec">${ic('table')}<span>AI + Excel Formula Mastery · 3 ระดับ</span></h2><p>เปลี่ยนภาษาคนเป็นสูตร Excel ด้วย AI · Prompt Library, Formula Lab, Interactive Dashboard และไฟล์ Excel ตัวอย่าง · <a href="#/excel">เปิดหน้าหลักสูตร</a></p><div class="ccards">${XCH.map(chapterCardHTML).join('')}</div></section>
  <section class="cgroup"><h2 class="sec">${ic('hat_graduation')}<span>Deep Learning · 36 บทเชิงลึก</span></h2><p>บทเรียนเชิงลึกพร้อม Workshop, Prompt Builder และแบบทดสอบประจำบท · <a href="#/deep">ดูภาพรวมและหลักคิดร่วม</a></p><div class="ccards">${DEEPCH.map(chapterCardHTML).join('')}</div></section>
  ${copyLine()}`, '', 1);
  wireUpdates($('#main')); wirePromptLab($('#main')); refreshUpdates();
  renderTOC(); updateProgress();
}

// ---------- Learning paths ----------
const trackItems = t => t.steps.flatMap(s => s.items).map(refN);
const trackDone = t => { const it = [...new Set(trackItems(t))]; return [it.filter(n => done.has(n)).length, it.length]; };
const TRACK_ART = { agent: 'eng', excel: 'xb', office: 'data', browser: 'lp', tips: 'ci', apply: 'farm', foundation: 'qms', implement: 'rep' };
function tracksGridHTML() {
  return `<div class="tracks">${D.tracks.map(t => { const [d, n] = trackDone(t); const nd = new Set(trackItems(t).filter(isDeep)).size, nx = new Set(trackItems(t).filter(isEx)).size; return `<a class="track ${t.star ? 'star' : ''}" href="#/track/${t.key}" style="${gvar(TRACK_ART[t.key] || 'gen')}"><span class="tr-art">${illus(TRACK_ART[t.key] || 'gen', t.icon, 'tr-svg')}</span><span class="tr-b">${t.star ? `<span class="tr-star">${ic('star_f')} เริ่มที่นี่ · ไฮไลต์หลัก</span>` : ''}<b>${esc(t.title)}</b><small>${esc(t.sub)}</small>${t.star ? `<ol class="tr-steps">${t.steps.map(x => `<li>${esc(x.t)}</li>`).join('')}</ol>` : ''}<span class="tr-meta">${t.steps.length} ขั้น · ${nx ? `${nx} หน้า AI + Excel` : `${n - nd} หน้าคอร์สหลัก · ${nd} บทเชิงลึก`}${d ? ` · เรียนแล้ว ${d}` : ''}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round(d / n * 100)}%"></i></span></span></a>`; }).join('')}</div>`;
}
function itemCardHTML(n) {
  const p = PI.get(n); if (!p) return '';
  const deep = isDeep(n), ex = isEx(n);
  const a = p.agent ? AG[p.agent] : null;
  return `<li><a class="toc-card" href="${hrefOf(n)}" style="${gvar(pageGroup(p))}"><span class="tc-ic">${ic(deep ? 'hat_graduation' : p.icon)}</span><span class="tc-b"><small>${ex ? 'AI + Excel · ' + esc(p.k) + ' · ' + esc(CH.get(p.chapter).title) : deep ? 'บทเชิงลึก ' + p.k + ' · ' + esc(CH.get(p.chapter).title) : 'คอร์สหลัก · หน้า ' + n + ' · ' + esc(p.typeLabel)}</small><b>${esc(p.title)}</b>${ex && p.header.short ? `<span class="tc-s">${esc(p.header.short)}</span>` : deep && p.outcome ? `<span class="tc-s">${esc(p.outcome)}</span>` : a && p.type === 'agent' ? `<span class="tc-s">${esc(a.short)}</span>` : ''}</span><span class="dot ${done.has(n) ? 'd' : visited.has(n) ? 'v' : ''}" title="${done.has(n) ? 'เรียนแล้ว' : visited.has(n) ? 'เปิดดูแล้ว' : 'ยังไม่เปิด'}"></span></a></li>`;
}
function renderTracks() {
  cur = null;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('compass_northwest')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>เส้นทางการเรียน</span></nav><h1>เส้นทางการเรียน</h1><p class="short">7 เส้นทาง เรียงตามความสำคัญ เริ่มที่ Copilot Agent · เนื้อหาที่ซ้ำกันระหว่างคอร์สหลักกับบทเชิงลึกถูกร้อยไว้ในขั้นเดียวกัน</p></header>${tracksGridHTML()}${copyLine()}`, 'เส้นทางการเรียน');
  renderTOC();
}
function renderTrack(key) {
  cur = null;
  const t = D.tracks.find(x => x.key === key); const [d, n] = trackDone(t);
  const g = TRACK_ART[key] || 'gen';
  const next = trackItems(t).find(x => !done.has(x));
  setMain(`<div style="${gvar(g)}"><header class="ph ph-module">${illus(g, t.icon, 'ph-art')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><a href="#/tracks">เส้นทางการเรียน</a></nav>${t.star ? `<span class="tr-star">${ic('star_f')} ไฮไลต์หลักของคอร์ส</span>` : ''}<h1>${esc(t.title)}</h1><p class="short">${esc(t.sub)}</p><div class="ph-meta"><span class="pill g">${ic('checkmark_circle')}<span>เรียนแล้ว ${d}/${n}</span></span>${next ? `<a class="btn btn-primary" href="${hrefOf(next)}">${ic('play')}<span>${d ? 'เรียนต่อ' : 'เริ่มเรียน'}: ${esc(PI.get(next).title)}</span></a>` : `<span class="pill">${ic('trophy')}<span>จบเส้นทางนี้แล้ว</span></span>`}</div></header>
  <ol class="track-steps">${t.steps.map((s, i) => `<li class="tstep"><div class="tstep-h"><span class="step-n">${i + 1}</span><h2>${esc(s.t.replace(/^\d+ · /, ''))}</h2></div><ul class="toc-cards">${s.items.map(r => itemCardHTML(refN(r))).join('')}</ul></li>`).join('')}</ol>${copyLine()}</div>`, t.title);
  renderTOC();
}
function relatedHTML(n) {
  const deep = isDeep(n);
  const list = deep ? (D.related.d[n - DEEP0] || []) : (D.related.p[n] || []).map(k => DEEP0 + k);
  const inTracks = D.tracks.filter(t => trackItems(t).includes(n));
  if (!list.length && !inTracks.length) return '';
  return `<section class="related">${list.length ? `<h2 class="sec">${ic(deep ? 'book_open' : 'hat_graduation')}<span>${deep ? 'เรียนคู่กับคอร์สหลัก' : 'เจาะลึกต่อใน Deep Learning'}</span></h2><ul class="toc-cards">${list.map(itemCardHTML).join('')}</ul>` : ''}${inTracks.length ? `<p class="rel-tracks">${ic('compass_northwest')}<span>อยู่ในเส้นทาง:</span>${inTracks.map(t => `<a class="pill" href="#/track/${t.key}">${esc(t.title)}</a>`).join('')}</p>` : ''}</section>`;
}

// ---------- Deep Learning ----------
let deepP = null;
function loadDeep() {
  if (window.__DEEP) return Promise.resolve(window.__DEEP);
  if (!deepP) deepP = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'deep-data.js?v=' + encodeURIComponent(D.meta.buildId); sc.onload = () => { for (const p of DEEPP) p.html = window.__DEEP.lessons[p.k].html; res(window.__DEEP); }; sc.onerror = () => { deepP = null; rej(new Error('deep-data.js')); }; document.head.appendChild(sc); });
  return deepP;
}
function renderDeepHome() {
  cur = null;
  const st = D.deepStats || {};
  const body = sh => `<div class="deep-sec">${sh.principles}</div><section class="deep-w"><h2>${ic('warning')}<span>ข้อจำกัดและสถานะฟีเจอร์ (ใช้กับทุกบท)</span></h2>${sh.limits.replace(/^<section[^>]*>[\s\S]*?<\/h2>/, '').replace(/<\/section>$/, '')}</section>${sh.quiz}${sh.checklist}`;
  setMain(`<div style="--dc:var(--accent)"><header class="ph ph-module">${illus('d3', 'hat_graduation', 'ph-art')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>Deep Learning</span></nav><h1>Deep Learning · 36 บทเชิงลึก</h1><p class="short">บทเรียนเชิงลึกเกี่ยวกับ Microsoft Copilot แบ่ง 6 กลุ่ม ตั้งแต่พื้นฐาน แอป Microsoft 365, AI Agents ไปจนถึงความปลอดภัยและการนำไปใช้จริง</p><div class="ph-meta"><a class="btn btn-primary" href="#/d/13">${ic('bot')}<span>เริ่มที่กลุ่ม AI Agents (บท 13)</span></a><a class="btn btn-outline" href="#/d/1">เริ่มบทที่ 1</a></div></header>
  <div class="callout tip">${ic('info')}<div><b>ปรับจากต้นฉบับ v10 ให้กระชับ</b><p>ส่วนที่ซ้ำกันทุกบท (หลักคิด Input → Process → Output → Verify, ข้อจำกัดฟีเจอร์, แบบทดสอบ 5 ข้อชุดเดิม และ Checklist) รวมไว้ในหน้านี้ที่เดียว · เนื้อหาเชิงลึกที่ซ้ำข้ามบท ${st.deduped || 0} ส่วนแสดงครั้งเดียวพร้อมลิงก์ · แต่ละบทมีแบบทดสอบเฉพาะหัวข้อ 3 ข้อแทน</p></div></div>
  ${DEEPCH.map(c => `<section class="cgroup" style="${gvar(c.group)}"><h2 class="sec">${ic(D.deepGroups.find(g => g.key === c.key).icon)}<span>${esc(c.title)} · ${esc(c.en)}</span></h2><p>${esc(c.desc)}</p><ul class="toc-cards">${c.pages.map(itemCardHTML).join('')}</ul></section>`).join('')}
  <section class="cgroup" id="deep-shared"><h2 class="sec">${ic('lightbulb')}<span>หลักคิดร่วม แบบทดสอบ และ Checklist ของทุกบท</span></h2><div class="deep-body" id="deepShared"><p class="empty">${ic('arrow_sync')} กำลังโหลด…</p></div></section>${copyLine()}</div>`, 'Deep Learning');
  loadDeep().then(d => { const el = $('#deepShared'); if (el) { el.innerHTML = body(d.shared); mount(el, { n: DEEP0 }); } }, () => { const el = $('#deepShared'); if (el) el.innerHTML = '<p class="empty">โหลดไม่ได้</p>'; });
  renderTOC();
}
function initQuiz(box) {
  const fs = $$('fieldset', box); const res = $('.qres', box);
  const best = store.get('cpa26-quiz', {});
  if (best[box.dataset.quiz] != null) res.textContent = `คะแนนครั้งก่อน ${best[box.dataset.quiz]}/${fs.length}`;
  $('[data-quiz-check]', box).addEventListener('click', () => {
    let score = 0, miss = 0;
    fs.forEach(f => {
      const a = +f.dataset.a; const sel = $('input:checked', f); const why = $('.qwhy', f); const opts = $$('.qopt', f);
      opts.forEach((o, k) => o.classList.toggle('right', k === a));
      if (!sel) { miss++; why.hidden = false; why.className = 'qwhy miss'; why.textContent = 'ยังไม่ได้ตอบ'; return; }
      const ok = +sel.value === a; if (ok) score++;
      sel.closest('.qopt').classList.toggle('wrong', !ok);
      why.hidden = false; why.className = 'qwhy ' + (ok ? 'ok' : 'no');
      why.textContent = (ok ? '✓ ถูกต้อง · ' : '✗ คำตอบที่ถูก: ' + opts[a].textContent.trim() + ' · ') + $('.qwhy-t', f).textContent;
    });
    res.textContent = `คะแนน ${score}/${fs.length}${miss ? ` · ยังไม่ได้ตอบ ${miss} ข้อ` : score === fs.length ? ' · ยอดเยี่ยม!' : ''}`;
    const b = store.get('cpa26-quiz', {}); b[box.dataset.quiz] = Math.max(score, b[box.dataset.quiz] || 0); store.set('cpa26-quiz', b);
    if (score === fs.length) toast('ทำแบบทดสอบได้คะแนนเต็ม');
  });
  $('[data-quiz-reset]', box).addEventListener('click', () => { $$('input', box).forEach(i => { i.checked = false; }); $$('.qopt', box).forEach(o => o.classList.remove('right', 'wrong')); $$('.qwhy', box).forEach(w => { w.hidden = true; }); res.textContent = ''; });
}
function initDeepPB(box) {
  const f = $$('textarea[data-f]', box); const out = $('[data-pb-out]', box); const lesson = box.dataset.lesson;
  const key = 'cpa26-dpb-' + box.dataset.deepPb; const saved = store.get(key, {});
  f.forEach(t => { if (saved[t.dataset.f]) t.value = saved[t.dataset.f]; });
  const gen = () => {
    if (box.dataset.variant === 'ecosystem') {
      const v = f.map(t => t.value.trim() || '[กรุณาระบุ]');
      out.textContent = ['บทบาท: คุณเป็นผู้ช่วย Microsoft Copilot สำหรับงานองค์กร ต้องยึดหลักฐานและสิทธิ์ข้อมูล', 'เป้าหมายงาน: ' + v[0], 'แหล่งข้อมูลที่ได้รับอนุญาต: ' + v[1], 'ข้อจำกัด/สิ่งที่ห้ามทำ: ' + v[2], 'รูปแบบผลลัพธ์/ผู้ตรวจรับ: ' + v[3], 'ขั้นตอน: 1. ตรวจความครบถ้วนของข้อมูล 2. แยกข้อเท็จจริงออกจากข้อเสนอ 3. สร้างผลลัพธ์ตามรูปแบบที่กำหนด 4. ระบุแหล่งอ้างอิงและวันที่/เวอร์ชัน 5. ระบุข้อมูลที่ไม่พบหรือไม่แน่ใจ 6. เสนอคำถามติดตาม', 'ข้อห้าม: ห้ามแต่งหลักฐาน ห้ามอ้างว่ามีสิทธิ์เข้าถึงข้อมูลที่ไม่ได้รับอนุญาต และห้ามตัดสินผลความปลอดภัย/กฎหมาย/การตรวจประเมินแทนผู้รับผิดชอบ', 'เกณฑ์ตรวจรับ: ถูกต้องตามเอกสาร, ตรวจย้อนกลับได้, ไม่เปิดเผยข้อมูลเกินสิทธิ์, ผ่าน Human Review'].join('\n');
    } else {
      const v = f.map(t => t.value.trim() || '[ระบุข้อมูล]');
      out.textContent = ['บทบาท: ผู้เชี่ยวชาญด้าน Microsoft Copilot ที่ตรวจสอบข้อมูลอย่างรอบคอบ', 'หัวข้อ: ' + lesson, 'เป้าหมายและผู้ใช้: ' + v[0], 'ข้อมูลที่ใช้และข้อจำกัด: ' + v[1], 'ผลลัพธ์ที่ต้องการและเกณฑ์ตรวจรับ: ' + v[2], 'ให้ทำงานเป็นขั้นตอน แยกข้อเท็จจริง สมมติฐาน และสิ่งที่ต้องตรวจสอบ', 'อ้างอิงหลักฐานที่ได้รับอนุญาต ระบุความไม่แน่นอน ห้ามสร้างตัวเลขหรือฟีเจอร์ที่ไม่ยืนยัน', 'แสดงผลเป็นตาราง Step | Owner | Evidence | Risk | Action', 'ห้ามดำเนินการที่กระทบระบบจริงก่อนผู้มีอำนาจอนุมัติ'].join('\n');
    }
    const sv = {}; f.forEach(t => { sv[t.dataset.f] = t.value; }); store.set(key, sv);
  };
  f.forEach(t => t.addEventListener('input', gen)); gen();
}
function initDecision(box) {
  const sel = $('select', box); const show = () => $$('.dec-item', box).forEach(x => { x.hidden = x.dataset.v !== sel.value; });
  sel.addEventListener('change', show); show();
}

// ---------- Microsoft Copilot updates (auto) ----------
let UPD = D.updates; let updTopic = 'all'; let liveState = 'snapshot';
const UPD_TOPICS = [['all', 'ทั้งหมด'], ['agent', 'Copilot Agent'], ['office', 'Excel · Word · PowerPoint'], ['teams', 'Teams · Outlook'], ['browser', 'เบราว์เซอร์ · SharePoint'], ['admin', 'ความปลอดภัย · ผู้ดูแลระบบ'], ['general', 'อื่น ๆ']];
const thDate = iso => { try { return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(iso)); } catch (e) { return iso; } };
const UPD_TH = D.updatesTh || {};
const TH_MON = { January: 'ม.ค.', February: 'ก.พ.', March: 'มี.ค.', April: 'เม.ย.', May: 'พ.ค.', June: 'มิ.ย.', July: 'ก.ค.', August: 'ส.ค.', September: 'ก.ย.', October: 'ต.ค.', November: 'พ.ย.', December: 'ธ.ค.' };
const thWhen = s => { const m = String(s || '').match(/([A-Z][a-z]+)\s+CY(\d{4})/); return m && TH_MON[m[1]] ? `${TH_MON[m[1]]} ${+m[2] + 543}` : String(s || ''); };
const ST_EXPL = { 'In development': 'Microsoft กำลังพัฒนา ยังใช้งานไม่ได้', 'Rolling out': 'เริ่มทยอยเปิดให้บางบัญชี อาจยังไม่เห็นทันที', 'Launched': 'เปิดใช้แล้ว (ขึ้นกับ License และการตั้งค่าองค์กร)' };
const topicTh = k => (UPD_TOPICS.find(x => x[0] === k) || [0, 'Microsoft Copilot'])[1];
const timelineTh = i => [i.preview ? `ทดลองใช้ (Preview): ${thWhen(i.preview)}` : '', i.ga ? `เปิดใช้ทั่วไป (GA): ${thWhen(i.ga)}` : ''].filter(Boolean).join(' · ');
// Thai headline + plain-language summary: hand-written (data/updates-th.json) or generated from status/dates for brand-new items
function thOf(i) {
  const t = UPD_TH[i.id];
  if (t) return { t: t.t, s: t.s, w: t.w, auto: false };
  const when = timelineTh(i);
  return { t: i.title, s: `ข่าวใหม่ในหมวด ${topicTh(i.topic)}${i.products.length ? ' สำหรับ ' + i.products.join(', ') : ''} · สถานะ “${i.statusTh || 'ไม่ระบุ'}”${i.status && ST_EXPL[i.status] ? ' (' + ST_EXPL[i.status] + ')' : ''}${when ? ' · ' + when : ''} · ข่าวนี้เพิ่งเข้ามา ยังไม่มีคำอธิบายภาษาไทย อ่านต้นฉบับด้านล่าง`, w: i.topic === 'admin' ? 'ผู้ดูแลระบบ' : '', auto: true };
}
// 3 highlight stories: Agent first, usable-now and everyday-user news ranked higher, one per topic
function featuredUpd(items) {
  const now = Date.now();
  const monthIdx = s => { const m = String(s || '').match(/([A-Z][a-z]+)\s+CY(\d{4})/); const k = m ? Object.keys(TH_MON).indexOf(m[1]) : -1; return k < 0 ? null : Date.UTC(+m[2], k, 15); };
  // news value: GA/preview from ~4 months ago up to the coming year counts as current; long-launched items drop
  const fresh = i => { const g = monthIdx(i.ga) ?? monthIdx(i.preview); if (g == null) return 0; const d = (g - now) / 864e5; return d < -120 ? -4 : d <= 365 ? 2 : 0.5; };
  const score = i => { const t = UPD_TH[i.id]; return fresh(i) + (i.agent ? 3 : 0) + (i.status === 'Launched' ? 2.5 : i.status === 'Rolling out' ? 2 : 0) + (t ? 1.5 : 0) + (t && t.w === 'ผู้ใช้ทั่วไป' ? 2.5 : 0) + (['agent', 'office', 'browser', 'teams'].includes(i.topic) ? 1 : 0) - Math.min(4, Math.max(0, now - Date.parse(i.updated || 0)) / 864e5 / 15); };
  const ranked = [...items].sort((a, b) => score(b) - score(a));
  const out = []; const seen = new Set();
  for (const i of ranked) { if (out.length === 3) break; if (!seen.has(i.topic)) { out.push(i); seen.add(i.topic); } }
  for (const i of ranked) { if (out.length === 3) break; if (!out.includes(i)) out.push(i); }
  return out.sort((a, b) => (b.topic === 'agent') - (a.topic === 'agent'));
}
function updCard(i, feat) {
  const th = thOf(i); const when = timelineTh(i);
  return `<li class="upd${feat ? ' feat' : ''}" data-topic="${esc(i.topic)}"><div class="upd-top">${i.statusTh ? `<span class="upd-st st-${esc(i.status.replace(/\s/g, '').toLowerCase())}" title="${esc(ST_EXPL[i.status] || '')}">${esc(i.statusTh)}</span>` : ''}${i.agent ? `<span class="upd-ag">${ic('bot')}Agent</span>` : ''}${th.w ? `<span class="upd-who">${ic('person')}เหมาะกับ${esc(th.w)}</span>` : ''}</div>
  <a class="upd-t" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer"${th.auto ? ' lang="en"' : ''}>${esc(th.t)} ${ic('open')}</a>${th.auto ? '' : `<p class="upd-en" lang="en">${esc(i.title)}</p>`}
  <p class="upd-s">${esc(th.s)}</p>
  <p class="upd-d">${when ? `${ic('timer')}<span>${esc(when)}</span>` : ''}${i.products.length ? `<span>${esc(i.products.join(' · '))}</span>` : ''}<span>Roadmap ID ${esc(i.id)}</span></p>
  ${i.summary ? `<details class="upd-orig"><summary>อ่านต้นฉบับภาษาอังกฤษ (Microsoft)</summary><p lang="en">${esc(i.summary)}</p></details>` : ''}</li>`;
}
function updItemsHTML() {
  const items = (UPD && UPD.items || []).filter(i => updTopic === 'all' || i.topic === updTopic);
  if (!items.length) return '<p class="empty">ไม่มีรายการในหมวดนี้</p>';
  return `<ul class="upd-list">${items.map(i => updCard(i, false)).join('')}</ul>`;
}
let updAllOpen = false;
function updatesPanelHTML(home) {
  const u = UPD || { items: [] };
  const feat = featuredUpd(u.items);
  return `<section class="updates${home ? ' home' : ''}" aria-labelledby="updH${home ? 'h' : 'p'}"><div class="upd-head"><div><h2 id="updH${home ? 'h' : 'p'}">${ic('arrow_sync')}<span>${home ? 'อัปเดตล่าสุดเกี่ยวกับ Microsoft Copilot' : '3 ข่าวเด่นตอนนี้'}</span></h2><p class="upd-meta"><span class="live-dot ${liveState}" aria-hidden="true"></span><span data-upd-meta>${updMetaText()}</span></p></div><span class="badge-verify">${ic('warning')}<span>ข้อมูลจาก Microsoft · ตรวจกับบัญชีจริงก่อนสอน</span></span></div>
  ${home ? '<p class="upd-lead">3 ข่าวเด่นที่คัดมาให้ (Copilot Agent ก่อน) · สรุปเป็นภาษาไทยให้อ่านเข้าใจง่าย</p>' : ''}
  <ul class="upd-list feat-list">${feat.map(i => updCard(i, true)).join('')}</ul>
  ${home ? `<a class="btn btn-primary upd-more" href="#/updates">${ic('arrow_right')}<span>ดูข่าวทั้งหมด ${u.items.length} รายการ</span></a>` : `<details class="upd-all" data-upd-all${updAllOpen ? ' open' : ''}><summary>${ic('text_bullet_list_square')}<span>ดูข่าวทั้งหมด ${u.items.length} รายการ · กรองตามหมวด</span>${ic('chevron_right', 'chev')}</summary>
  <div class="fchips upd-chips" role="group" aria-label="กรองหมวดอัปเดต">${UPD_TOPICS.map(([k, t]) => `<button type="button" class="fchip" data-ut="${k}" aria-pressed="${updTopic === k}">${esc(t)} (${k === 'all' ? u.items.length : u.items.filter(i => i.topic === k).length})</button>`).join('')}</div>
  <div data-upd-list>${updItemsHTML()}</div></details>`}</section>`;
}
function updMetaText() {
  if (!UPD) return 'ยังไม่มีข้อมูล';
  return `${liveState === 'live' ? 'ข้อมูลสด' : 'ข้อมูล ณ การ build ล่าสุด'} · ${esc(UPD.source.name)} · ดึงข้อมูลเมื่อ ${thDate(UPD.fetchedAt)} · ระบบอัปเดตอัตโนมัติ`;
}
function wireUpdates(root) {
  $$('.updates', root).forEach(sec => {
    const all = $('[data-upd-all]', sec); if (all) all.addEventListener('toggle', () => { updAllOpen = all.open; });
    $$('[data-ut]', sec).forEach(b => b.addEventListener('click', () => { updTopic = b.dataset.ut; $$('[data-ut]', sec).forEach(x => x.setAttribute('aria-pressed', x.dataset.ut === updTopic)); $('[data-upd-list]', sec).innerHTML = updItemsHTML(); }));
  });
}
let liveTried = false;
async function refreshUpdates(force) {
  if ((liveTried && !force) || !/^https?:$/.test(location.protocol)) return; liveTried = true;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
    const r = await fetch('/api/copilot-updates', { headers: { accept: 'application/json' }, signal: ctl.signal }); clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j.items || !j.items.length) throw new Error('empty');
    UPD = j; liveState = 'live';
    $$('.updates').forEach(sec => { sec.outerHTML = updatesPanelHTML(sec.classList.contains('home')); });
    wireUpdates($('#main'));
  } catch (e) { liveState = 'snapshot'; }
}
function renderUpdatesPage() {
  cur = null;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('arrow_sync')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>อัปเดตล่าสุด</span></nav><h1>อัปเดตล่าสุดเกี่ยวกับ Microsoft Copilot</h1><p class="short">ฟีเจอร์ที่กำลังพัฒนา กำลังทยอยเปิดใช้ และเปิดใช้แล้ว จาก Microsoft 365 Roadmap · หน้าเว็บดึงข้อมูลใหม่อัตโนมัติ (ฝั่งเซิร์ฟเวอร์รีเฟรชทุก 6 ชั่วโมง และ build ใหม่ทุกวัน)</p></header><div class="upd-legend" role="note"><b>อ่านสถานะข่าว:</b>${Object.entries(ST_EXPL).map(([k, v]) => `<span><i class="upd-st st-${k.replace(/\s/g, '').toLowerCase()}">${esc({ 'In development': 'กำลังพัฒนา', 'Rolling out': 'กำลังทยอยเปิดใช้', 'Launched': 'เปิดใช้แล้ว' }[k])}</i> ${esc(v)}</span>`).join('')}<span><b>Preview</b> = ช่วงทดลองใช้ก่อนเปิดจริง · <b>GA</b> = เปิดใช้ทั่วไป (ปีเป็น พ.ศ.)</span></div>${updatesPanelHTML(false)}<p class="src-note">${ic('info')} หัวข้อและสรุปภาษาไทยเรียบเรียงโดยผู้สร้างคู่มือเพื่อให้อ่านง่าย (ไม่ใช่คำแปลทางการของ Microsoft) · ต้นฉบับภาษาอังกฤษอยู่ในแต่ละการ์ด · กดหัวข้อเพื่อเปิด Microsoft 365 Roadmap · ความพร้อมใช้งานขึ้นกับบัญชี License และนโยบายองค์กร</p>${copyLine()}`, 'อัปเดตล่าสุด Copilot');
  wireUpdates($('#main')); refreshUpdates(); renderTOC();
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
  SIDX = PAGES.filter(p => p.n !== 1 && (p.html || p.text)).map(p => {
    const a = p.agent ? AG[p.agent] : null;
    const ch = CH.get(p.chapter);
    return { kind: 'page', n: p.n, title: p.title, t: p.title.toLowerCase(), meta: isEx(p.n) ? `AI + Excel · ${p.k} · ${ch.title}` : isDeep(p.n) ? `Deep Learning บท ${p.k} · ${ch.title}` : `หน้า ${p.n} · บทที่ ${ch.n} ${ch.title}`, icon: p.icon, g: pageGroup(p),
      a: a && (p.type === 'agent' || p.type === 'agentflow') ? [a.name, a.short, a.builder.name, ...a.inputs, ...a.outputs].join(' ').toLowerCase() : '',
      body: isDeep(p.n) || isEx(p.n) ? p.text : strip(p.html), bl: '' };
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
function cmdGo(i) { const r = cmdRes[i]; if (!r) return; closeCmd(); location.hash = r.x.kind === 'tool' ? r.x.href : hrefOf(r.x.n); }
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
  <h2 class="sec">${ic('book_open')}<span>รายบท</span></h2><div class="pchap">${ALLCH.map(ch => { const d = chapterDone(ch); const nx = ch.pages.find(n => !done.has(n)) || moduleOf(ch); return `<a href="${hrefOf(nx)}" style="${gvar(ch.group)}"><span class="n">${ch.excel ? 'X' + (ch.n - 200) : ch.deep ? 'D' + (ch.n - 100) : String(ch.n).padStart(2, '0')}</span><span><b>${esc(ch.title)}</b><span class="bar" aria-hidden="true"><i style="width:${Math.round(d / ch.pages.length * 100)}%"></i></span></span><small>${d}/${ch.pages.length} หน้า</small></a>`; }).join('')}</div>${copyLine()}`, 'Learning Progress');
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
  if (document.body.classList.contains('gated')) return;
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

/*__EXCEL_JS__*/
/*__PROMPTLAB_JS__*/

// ---------- Email gate (once per device) ----------
const GATE = (() => { try { return JSON.parse(document.getElementById('gate-cfg').textContent); } catch (e) { return { on: false, h: [] }; } })();
const GATE_KEY = 'cpa26-gate';
// SHA-256 (hex): Web Crypto when available, small pure-JS fallback for insecure origins
function sha256js(str) {
  const b = new TextEncoder().encode(str); const K = []; const H = [];
  const isP = n => { for (let f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; };
  for (let n = 2, i = 0; i < 64; n++) if (isP(n)) { if (i < 8) H[i] = (Math.pow(n, 1 / 2) * 2 ** 32) | 0; K[i++] = (Math.pow(n, 1 / 3) * 2 ** 32) | 0; }
  const l = b.length, w = new Uint8Array(((l + 9 + 63) >> 6) << 6); w.set(b); w[l] = 0x80; const dv = new DataView(w.buffer); dv.setUint32(w.length - 4, l * 8); dv.setUint32(w.length - 8, Math.floor(l / 2 ** 29));
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < w.length; o += 64) {
    const W = new Array(64); for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0; }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) { const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0; h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0; }
    [a, bb, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) | 0; });
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
async function sha256(str) {
  try { if (crypto && crypto.subtle) return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)))].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { /* fall back */ }
  return sha256js(str);
}
// mask both parts: no full name and no organisation domain is ever shown on screen
const maskEmail = e => { const [u, d] = e.split('@'); const dot = d.indexOf('.'); return (u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '•••' + u.slice(-1)) + '@' + d[0] + '•••' + (dot > 0 ? d.slice(dot) : ''); };
let gatePassed = false; // this session (also covers browsers where storage is blocked)
const gateOk = () => { if (!GATE.on || gatePassed) return true; const g = store.get(GATE_KEY, null); return !!(g && g.h && GATE.h.includes(g.h)); };
function gateThen(go) {
  if (gateOk()) { go(); return; }
  const lock = ['#topbar', '.shell', '.bottombar'].map(s => $(s)).filter(Boolean);
  lock.forEach(el => { el.inert = true; el.setAttribute('aria-hidden', 'true'); });
  document.body.classList.add('gated');
  const old = store.get(GATE_KEY, null);
  document.body.insertAdjacentHTML('beforeend', `<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gateT"><form class="gate-card" id="gateForm" novalidate>
    <img class="gate-icon" src="icons/icon-192.png" alt="" width="88" height="88"><div class="gate-logos"><span class="logo-chip"><img src="logo.png" alt="AI Agent for Work" width="140" height="39"></span>${D.meta.copilotLogo ? `<img class="copilot-mark" src="${esc(D.meta.copilotLogo)}" alt="Microsoft Copilot" width="40" height="40">` : ''}</div>
    <h1 id="gateT"><span>Copilot</span> AI Agents for Work 2026</h1>
    <p class="gate-sub">${old ? 'Email ที่เคยใช้ในเครื่องนี้ไม่อยู่ในรายชื่อผู้มีสิทธิ์แล้ว กรุณากรอก Email ใหม่' : 'กรอก Email ที่ลงทะเบียนไว้เพื่อเข้าใช้งาน · กรอกครั้งเดียวต่อเครื่อง ครั้งต่อไปเปิดแอปเข้าได้ทันที'}</p>
    <label for="gateEmail">Email</label>
    <div class="input-ic">${ic('mail')}<input id="gateEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" required placeholder="name@example.com"></div>
    <p class="gate-err" id="gateErr" role="alert" aria-live="assertive"></p>
    <button type="submit" class="btn btn-primary gate-go">${ic('lock_closed')}<span>เข้าใช้งาน</span></button>
    <p class="gate-note">${ic('shield_checkmark')}<span>เครื่องนี้จะจำเฉพาะค่าที่เข้ารหัสแบบทางเดียว (SHA-256) ของ Email ไม่เก็บ Email ตัวจริง และไม่ส่งข้อมูลออกไปที่ใด · ล้างข้อมูลเว็บไซต์หรือกด “ออกจากระบบ” ในเมนูเครื่องมือเพื่อเปลี่ยน Email</span></p>
    <p class="gate-ver">เวอร์ชัน ${esc(D.meta.version)} · ${esc(D.meta.copyright)}</p></form></div>`);
  const inp = $('#gateEmail'), err = $('#gateErr');
  setTimeout(() => inp.focus(), 50);
  $('#gateForm').addEventListener('submit', async e => {
    e.preventDefault();
    const em = inp.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { err.textContent = 'รูปแบบ Email ไม่ถูกต้อง'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
    const h = await sha256(GATE.salt + em);
    if (!GATE.h.includes(h)) { err.textContent = 'Email นี้ยังไม่มีสิทธิ์เข้าใช้งาน · ตรวจการสะกด หรือติดต่อผู้รับผิดชอบคอร์ส'; inp.setAttribute('aria-invalid', 'true'); inp.select(); return; }
    gatePassed = true;
    store.set(GATE_KEY, { h, m: maskEmail(em), at: new Date().toISOString() });
    $('#gate').remove(); document.body.classList.remove('gated');
    lock.forEach(el => { el.inert = false; el.removeAttribute('aria-hidden'); });
    go(); renderAppMenu(); toast('ยินดีต้อนรับ · เครื่องนี้จำการเข้าใช้งานแล้ว');
  });
}
function gateSignOut() {
  try { localStorage.removeItem(GATE_KEY); } catch (e) { /* ignore */ }
  location.reload();
}

// ---------- PWA: service worker, install, "รีเฟรช อัปเดตแอป" ----------
let swReg = null, installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
async function latestVersion() {
  const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function waitForWorker(reg, ms) {
  return new Promise(res => {
    const done = () => res(reg.waiting || null);
    if (reg.waiting) return done();
    const w = reg.installing; if (!w) return res(null);
    const t = setTimeout(done, ms);
    w.addEventListener('statechange', () => { if (w.state === 'installed' || w.state === 'redundant') { clearTimeout(t); done(); } });
  });
}
async function activateWaiting(reg) {
  if (!reg || !reg.waiting) return false;
  await new Promise(res => { const t = setTimeout(res, 3000); navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(t); res(); }, { once: true }); reg.waiting.postMessage('SKIP_WAITING'); });
  return true;
}
let updating = false;
async function updateApp() {
  if (updating) return; updating = true;
  const btn = $('#updateBtn'); btn.classList.add('spin'); btn.setAttribute('aria-busy', 'true');
  try {
    toast('กำลังตรวจสอบเวอร์ชันใหม่…');
    let v = null;
    try { v = await latestVersion(); } catch (e) { v = null; }
    if (!v) { toast(`ออฟไลน์หรือเชื่อมต่อไม่ได้ · ใช้เวอร์ชัน ${D.meta.version} ที่บันทึกในเครื่อง`); return; }
    if (v.build === D.meta.buildId) {
      if (swReg) { try { await swReg.update(); } catch (e) { /* ignore */ } await activateWaiting(swReg); }
      await refreshUpdates(true);
      route();
      toast(`เป็นเวอร์ชันล่าสุดแล้ว (v${D.meta.version}) · รีเฟรชข้อมูลและข่าวแล้ว`);
      return;
    }
    toast(`พบเวอร์ชันใหม่ v${v.version} · กำลังอัปเดต…`);
    if (swReg) { try { await swReg.update(); } catch (e) { /* ignore */ } await waitForWorker(swReg, 8000); await activateWaiting(swReg); }
    else { try { for (const k of await caches.keys()) if (k.startsWith('cpa26-')) await caches.delete(k); } catch (e) { /* no cache api */ } }
    location.reload();
  } finally { updating = false; btn.classList.remove('spin'); btn.removeAttribute('aria-busy'); }
}
function showUpdateReady(v) {
  $('#updateBtn .upd-dot').hidden = false;
  $('#updateBtn').setAttribute('aria-label', `มีเวอร์ชันใหม่ v${v.version} · กดเพื่ออัปเดตแอป`);
  if ($('#updBanner')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="upd-banner" id="updBanner" role="status">${ic('arrow_sync')}<span>มีเวอร์ชันใหม่ <b>v${esc(v.version)}</b> พร้อมใช้งาน</span><button type="button" class="btn btn-primary" data-upd-now>อัปเดตเลย</button><button type="button" class="btn btn-icon" data-upd-later aria-label="ปิด">${ic('dismiss')}</button></div>`);
  $('#updBanner [data-upd-now]').addEventListener('click', updateApp);
  $('#updBanner [data-upd-later]').addEventListener('click', () => $('#updBanner').remove());
}
let lastCheck = 0;
async function autoCheck() {
  if (!/^https?:$/.test(location.protocol) || Date.now() - lastCheck < 15 * 60e3) return; lastCheck = Date.now();
  try { const v = await latestVersion(); if (v.build !== D.meta.buildId) showUpdateReady(v); else if (swReg && swReg.waiting) swReg.waiting.postMessage('SKIP_WAITING'); } catch (e) { /* offline */ }
}
function initPWA() {
  $('#updateBtn').addEventListener('click', updateApp);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').then(reg => { swReg = reg; }).catch(() => { /* SW unavailable */ });
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderAppMenu(); });
  window.addEventListener('appinstalled', () => { installEvt = null; renderAppMenu(); toast('ติดตั้งแอปเรียบร้อย · เปิดจากหน้าจอโฮมได้เลย'); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') autoCheck(); });
  setTimeout(autoCheck, 4000);
  renderAppMenu();
}
async function installApp() {
  if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { /* ignore */ } installEvt = null; renderAppMenu(); return; }
  toast(isIOS() ? 'iPhone/iPad: เปิดใน Safari แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”' : 'เปิดเมนูของเบราว์เซอร์ แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มลงในหน้าจอหลัก”');
}
function renderAppMenu() {
  const m = $('#toolsMenu'); $$('[data-app-act]', m).forEach(x => x.remove()); const sep = $('.menu-sep', m); if (sep) sep.remove();
  const g = store.get(GATE_KEY, null);
  const items = [['update', 'arrow_sync', 'รีเฟรช · อัปเดตแอป', `เวอร์ชัน ${D.meta.version} · ตรวจเวอร์ชันใหม่และโหลดข่าวล่าสุด`]];
  if (!isStandalone()) items.push(['install', 'arrow_download', 'ติดตั้งเป็นแอป (มือถือ/แท็บเล็ต/คอม)', installEvt ? 'ติดตั้งบนเครื่องนี้ เปิดเต็มจอและใช้ออฟไลน์ได้' : 'วิธีเพิ่มไปยังหน้าจอโฮม']);
  if (GATE.on && g && g.m) items.push(['signout', 'person', 'ออกจากระบบ (เปลี่ยน Email)', 'เข้าใช้งานด้วย ' + g.m]);
  m.insertAdjacentHTML('beforeend', '<hr class="menu-sep">' + items.map(([k, i, t, sub]) => `<a role="menuitem" href="#" data-app-act="${k}">${ic(i)}<span>${esc(t)}<small>${esc(sub)}</small></span></a>`).join(''));
  // same actions in the contents drawer (phones hide the tools menu)
  $('#sbApp').innerHTML = `${g && g.m && GATE.on ? `<p class="sb-user">${ic('person')}<span>${esc(g.m)}</span></p>` : ''}<div class="sb-app-btns">${items.map(([k, i, t]) => `<button type="button" class="btn btn-subtle" data-app-act="${k}">${ic(i)}<span>${esc({ update: 'อัปเดตแอป', install: 'ติดตั้งแอป', signout: 'ออกจากระบบ' }[k] || t)}</span></button>`).join('')}</div><p class="sb-ver">เวอร์ชัน ${esc(D.meta.version)}</p>`;
  $$('[data-app-act]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); closeMenus(); const k = a.dataset.appAct; if (k === 'update') updateApp(); else if (k === 'install') installApp(); else if (k === 'signout') gateSignOut(); }));
}

// ---------- boot ----------
if (!location.hash) { const last = store.get('cpa26-last', null); if (last && PI.has(last) && last !== 1) { /* stay on home; resume card offered */ } }
if (D.meta.copilotLogo) $('.brand-t').insertAdjacentHTML('beforebegin', `<span class="brand-sep" aria-hidden="true"></span><img class="copilot-mark" src="${esc(D.meta.copilotLogo)}" alt="Microsoft Copilot" width="30" height="30">`);
updateProgress();
initPWA();
gateThen(() => {
  route();
  // reset the sequential-focus starting point so the first Tab reaches the skip link
  try { document.body.setAttribute('tabindex', '-1'); document.body.focus({ preventScroll: true }); document.body.removeAttribute('tabindex'); } catch (e) { /* ignore */ }
});
window.__app = { D, done, visited, AG, ATT, cmdSearch: q => { cmdSearch(q); return cmdRes.map(r => r.x.n || r.x.href); } };
})();
