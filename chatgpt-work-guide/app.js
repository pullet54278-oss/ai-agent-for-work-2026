/* ChatGPT Work Guide — PWA app (vanilla JS, no build step required) */
(() => {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gwg:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gwg:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const ICON = {
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    wand: '<path d="m15 4 5 5L9 20H4v-5z"/><path d="m13 6 5 5"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    loop: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    play: '<path d="m7 4 13 8-13 8z"/>',
    pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
    next: '<path d="m9 6 6 6-6 6"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>'
  };
  const icon = (n, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${ICON[n] || ''}</svg>`;
  const LOGO = 'icons/logo.svg';

  // ---------- parse manual ----------
  const RAW = (window.MANUAL_MD || '').replace(/^---[\s\S]*?\n---\n/, '');
  const chapters = [];
  {
    let cur = null;
    for (const line of RAW.split('\n')) {
      const m = line.match(/^## (.+)$/);
      if (m) {
        const t = m[1].trim();
        const nm = t.match(/^(\d+)\.\s+(.*)$/);
        cur = { id: nm ? nm[1] : (t === 'สรุปหนึ่งหน้า' ? 'summary' : null), num: nm ? +nm[1] : null, title: nm ? nm[2] : t, lines: [] };
        if (cur.id) chapters.push(cur);
        continue;
      }
      if (cur) cur.lines.push(line);
    }
    chapters.forEach(c => { c.body = c.lines.join('\n').replace(/\n---\s*$/, '').trim(); delete c.lines; });
  }
  const chById = Object.fromEntries(chapters.map(c => [c.id, c]));

  const LEVELS = [
    { key: 'Beginner', th: 'ผู้เริ่มต้น', ids: ['1', '2', '3', '16'] },
    { key: 'Intermediate', th: 'ระดับกลาง', ids: ['4', '5', '6', '7', '11', '12', '13'] },
    { key: 'Advanced', th: 'ขั้นสูง', ids: ['8', '9', '10', '14', '15'] },
    { key: 'Professional', th: 'มืออาชีพ', ids: ['17', '18', '19', '20', 'summary'] }
  ];
  const levelOf = id => LEVELS.find(l => l.ids.includes(id));

  // ---------- markdown renderer ----------
  function inline(s) {
    let t = esc(s);
    const codes = [];
    t = t.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
      if (url.startsWith('#')) { const m = url.match(/^#(\d+)-/); return m ? `<a href="#/ch/${m[1]}">${txt}</a>` : txt; }
      return `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`;
    });
    t = t.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
    return t;
  }

  function flowHTML(code) {
    const merged = [];
    for (const l of code.split('\n').map(x => x.trim()).filter(Boolean)) {
      if (merged.length && merged[merged.length - 1].endsWith('→')) merged[merged.length - 1] += ' ' + l;
      else merged.push(l);
    }
    if (!merged.length || merged.length > 2 || !merged.every(l => l.includes('→'))) return null;
    const parts = merged.map(l => l.split('→').map(x => x.trim()).filter(Boolean));
    const one = steps => `<div class="flow reveal-flow">${steps.map((s, i) =>
      (i ? `<span class="flow-arrow" style="--i:${i}">→</span>` : '') + `<span class="flow-step" style="--i:${i}">${s}</span>`).join('')}</div>`;
    if (parts.length === 2 && parts[0].length === parts[1].length)
      return one(parts[0].map((p, i) => `${esc(p)}<br><small style="opacity:.7;font-weight:500">${esc(parts[1][i])}</small>`));
    return parts.map(p => one(p.map(esc))).join('');
  }

  function codeHTML(code, lang) {
    return `<div class="code"><div class="code-head"><span>${esc(lang || 'prompt')}</span><button class="copy" data-copy>${icon('copy')}<span>คัดลอก</span></button></div><pre>${esc(code)}</pre></div>`;
  }

  function renderMD(md, chId = 'x') {
    const L = md.split('\n');
    let html = '', i = 0, h3n = 0, para = [];
    const flushP = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
    while (i < L.length) {
      const line = L[i];
      if (/^```/.test(line)) {
        flushP();
        const lang = line.slice(3).trim(); const buf = []; i++;
        while (i < L.length && !/^```/.test(L[i])) buf.push(L[i++]);
        i++;
        const code = buf.join('\n');
        html += (lang === 'text' && flowHTML(code)) || codeHTML(code, lang);
        continue;
      }
      let m;
      if ((m = line.match(/^### (.+)/))) {
        flushP();
        const t = m[1]; const nm = t.match(/^(\d+\.\d+)\s+(.*)$/);
        html += `<h3 id="s-${chId}-${++h3n}">${nm ? `<span class="hn">${nm[1]}</span>${inline(nm[2])}` : inline(t)}</h3>`;
        i++; continue;
      }
      if ((m = line.match(/^#### (.+)/))) { flushP(); html += `<h4>${inline(m[1])}</h4>`; i++; continue; }
      if (/^---\s*$/.test(line)) { flushP(); html += '<hr>'; i++; continue; }
      if (/^>/.test(line)) {
        flushP(); const buf = [];
        while (i < L.length && /^>/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ''));
        html += `<blockquote>${buf.join('\n').split(/\n\s*\n/).map(p => `<p>${inline(p.replace(/\n/g, ' '))}</p>`).join('')}</blockquote>`;
        continue;
      }
      if (/^\|/.test(line)) {
        flushP(); const rows = [];
        while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const head = cells(rows[0]); const body = rows.slice(2).map(cells);
        html += `<div class="tbl-wrap"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        continue;
      }
      if (/^- \[[ x]\] /.test(line)) {
        flushP(); const items = [];
        while (i < L.length && /^- \[[ x]\] /.test(L[i])) items.push(L[i++].replace(/^- \[[ x]\] /, ''));
        html += `<ul>${items.map(t => `<li class="task"><label><input type="checkbox"> <span>${inline(t)}</span></label></li>`).join('')}</ul>`;
        continue;
      }
      if (/^[-*] /.test(line)) {
        flushP(); const items = [];
        while (i < L.length && /^[-*] /.test(L[i])) items.push(L[i++].replace(/^[-*] /, ''));
        html += `<ul>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ul>`;
        continue;
      }
      if (/^\d+\. /.test(line)) {
        flushP(); const items = [];
        while (i < L.length && /^\d+\. /.test(L[i])) items.push(L[i++].replace(/^\d+\. /, ''));
        html += `<ol>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ol>`;
        continue;
      }
      if (!line.trim()) { flushP(); i++; continue; }
      para.push(line.trim()); i++;
    }
    flushP();
    return html;
  }

  // ---------- search index (sub-sections) ----------
  const plain = s => s.replace(/```[a-z]*\n?/g, '').replace(/[|*`>#]/g, ' ').replace(/\s+/g, ' ');
  const index = [];
  const library = [];
  chapters.forEach(c => {
    const parts = c.body.split(/\n(?=### )/);
    let n = 0;
    parts.forEach(p => {
      const hm = p.match(/^### (.+)/);
      if (hm) n++;
      const title = hm ? hm[1].replace(/^\d+\.\d+\s+/, '') : c.title;
      index.push({ ch: c, sub: hm ? n : 0, title, md: p, lower: plain(p).toLowerCase(), tlower: (title + ' ' + c.title).toLowerCase() });
      if (!hm) return;
      const re = /```(\w*)\n([\s\S]*?)```/g; let m;
      while ((m = re.exec(p))) {
        if (m[1] === 'text' && flowHTML(m[2])) continue;
        library.push({ ch: c, sub: n, title, lang: m[1], code: m[2].replace(/\n$/, '') });
      }
    });
  });

  const STOP = ['คืออะไร', 'อย่างไร', 'ยังไง', 'ทำไม', 'ไหม', 'บ้าง', 'ช่วย', 'หน่อย', 'ครับ', 'ค่ะ', 'คะ', 'นะ', 'อะไร', 'ควร', 'แบบไหน', 'ต่างกัน', 'กับ', 'และ', 'การ', 'ที่', 'ของ', 'ให้', 'what', 'is', 'how', 'the', 'a', 'to'];
  function grams(q) {
    let s = q.toLowerCase().replace(/ใช้ทำอะไร|ใช้ทำ/g, ' เหมาะกับ ');
    STOP.forEach(w => { s = s.split(w).join(' '); });
    const g = new Set();
    for (const w of s.split(/[\s,.;:!?()"'“”/|\-]+/).filter(Boolean)) {
      if (/^[a-z0-9.+]+$/.test(w)) { if (w.length > 1) g.add('w:' + w); continue; }
      if (w.length < 3) { g.add('t:' + w); continue; }
      for (let i = 0; i <= w.length - 3; i++) g.add('t:' + w.slice(i, i + 3));
    }
    return [...g];
  }
  function search(q) {
    const gs = grams(q);
    if (!gs.length) return [];
    return index.map(e => {
      let s = 0;
      for (const g of gs) {
        const k = g.slice(2), w = g[0] === 'w' ? 3 : 1;
        if (e.lower.includes(k)) s += w;
        if (e.tlower.includes(k)) s += w * 2;
      }
      return { e, s: s / (gs.length * 3) };
    }).filter(r => r.s > 0.18).sort((a, b) => b.s - a.s).slice(0, 4);
  }

  // ---------- progress ----------
  const readSet = new Set(store.get('read', []));
  function markRead(id) {
    if (readSet.has(id)) return;
    readSet.add(id); store.set('read', [...readSet]);
    updateProgress(); buildNav();
    toast(`อ่านจบบท "${chById[id].title}" แล้ว`);
  }
  function updateProgress() {
    const p = Math.round(readSet.size / chapters.length * 100);
    $('#pc-text').textContent = p + '%';
    $('#pc-fg').style.strokeDashoffset = 94.25 * (1 - p / 100);
  }

  // ---------- sidebar ----------
  const TOOLS = [
    { id: 'loop', t: 'วงจร Agent', d: 'ดูขั้นตอน GOAL → DELIVER แบบเคลื่อนไหว', i: 'loop' },
    { id: 'prompt', t: 'Prompt Builder', d: 'ประกอบ Prompt 6 ส่วน แล้วคัดลอกไปใช้', i: 'wand' },
    { id: 'model', t: 'เลือกโมเดล & Effort', d: 'จับคู่งานกับโมเดลและระดับการคิด', i: 'brain' },
    { id: 'cost', t: 'คำนวณค่า API', d: 'สูตรต้นทุน Token แบบ Interactive', i: 'coin' },
    { id: 'sorter', t: 'Fact / Assumption / Need Data', d: 'ฝึกแยกข้อมูล 3 กลุ่ม', i: 'sort' },
    { id: 'perm', t: 'ระดับสิทธิ์ Agent', d: 'Read-only ถึง Denied actions', i: 'lock' },
    { id: 'checklist', t: 'Checklist ก่อนส่งงาน', d: 'ติ๊กตรวจงานก่อนส่งจริง', i: 'check' },
    { id: 'library', t: 'Prompt Library', d: 'รวม Prompt ทุกบท ค้นหาและคัดลอกได้', i: 'code' },
    { id: 'glossary', t: 'Glossary Flashcards', d: 'การ์ดพลิกทบทวนศัพท์', i: 'cards' },
    { id: 'quiz', t: 'แบบทดสอบ', d: 'ทดสอบความเข้าใจ 10 ข้อ', i: 'quiz' }
  ];
  function buildNav() {
    const cur = location.hash || '#/home';
    const item = (href, inner) => `<a class="sb-item${cur === href ? ' active' : ''}" href="${href}">${inner}</a>`;
    let h = item('#/home', `${icon('home')}<span class="label">หน้าแรก</span>`);
    h += item('#/chat', `${icon('chat')}<span class="label">ผู้ช่วยถามตอบ</span>`);
    h += `<div class="sb-group">เครื่องมือ Interactive</div>`;
    h += TOOLS.map(t => item(`#/tool/${t.id}`, `${icon(t.i)}<span class="label">${t.t}</span>`)).join('');
    LEVELS.forEach(l => {
      h += `<div class="sb-group">${l.key} · ${l.th}</div>`;
      h += l.ids.map(id => { const c = chById[id]; return c ? item(`#/ch/${id}`, `<span class="num">${c.num || '★'}</span><span class="label">${esc(c.title)}</span>${readSet.has(id) ? icon('check', 'done') : ''}`) : ''; }).join('');
    });
    $('#sb-nav').innerHTML = h;
  }

  // ---------- view helpers ----------
  const view = $('#view');
  let cleanup = [];
  function mount(html, crumb, wide) {
    cleanup.forEach(f => f()); cleanup = [];
    view.innerHTML = `<div class="wrap${wide ? ' wide' : ''} page-enter">${html}</div>`;
    view.scrollTop = 0;
    $('#crumb').innerHTML = `${esc(crumb)} <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`;
    document.title = crumb === 'หน้าแรก' ? 'ChatGPT Work Guide' : `${crumb} · ChatGPT Work Guide`;
    enhance(view);
  }
  let io;
  function enhance(root) {
    io = io || new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    $$('.reveal, .reveal-flow', root).forEach(el => io.observe(el));
    $$('.chip-card', root).forEach(el => el.addEventListener('pointermove', ev => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ev.clientX - r.left + 'px'); el.style.setProperty('--my', ev.clientY - r.top + 'px');
    }));
  }
  const widgetBox = (tag, ic, title, inner) =>
    `<section class="widget reveal"><div class="widget-tag">${icon(ic)}${tag}</div><h3>${title}</h3>${inner}</section>`;

  // ---------- HOME ----------
  const SUGGEST = [
    { q: 'Chat, Work, Codex และ API ต่างกันอย่างไร', i: 'spark' },
    { q: 'เลือกโมเดลและ Thinking effort อย่างไรให้คุ้ม', i: 'brain' },
    { q: 'สูตร Prompt 6 ส่วนมีอะไรบ้าง', i: 'wand' },
    { q: 'Prompt injection คืออะไร ป้องกันอย่างไร', i: 'lock' }
  ];
  const MODES = [
    { k: 'Chat', v: 'Ask', th: 'ถามและคิดร่วมกัน', d: 'คำตอบ การวิเคราะห์ ร่างเนื้อหา — เช่น สรุปอีเมล อธิบายสูตร Excel', ch: '1' },
    { k: 'Work', v: 'Do', th: 'ทำงานให้จบเป็นชิ้นงาน', d: 'เอกสาร ตาราง สไลด์ การวิเคราะห์ — เช่น วิเคราะห์ยอดขายแล้วทำรายงาน', ch: '8' },
    { k: 'Codex', v: 'Build', th: 'สร้างและดูแลซอฟต์แวร์', d: 'โค้ด การทดสอบ และ Pull Request — เช่น สร้างเว็บแอป แก้บั๊ก', ch: '9' },
    { k: 'API', v: 'Integrate', th: 'ให้ระบบเรียก AI เอง', d: 'เชื่อม AI เข้ากับแอปหรือ Workflow — เช่น ระบบสรุปเอกสาร Chatbot LINE', ch: '5' }
  ];
  const modesHTML = () => `<div class="mode-grid">${MODES.map((m, i) => `
    <div class="flip reveal" style="transition-delay:${i * 80}ms" data-flip tabindex="0" role="button" aria-label="${m.k}">
      <div class="flip-in">
        <div class="flip-face flip-front"><div class="big">${m.k}</div><div class="verb">= ${m.v}</div><div style="margin-top:6px">${m.th}</div><div class="hint">แตะเพื่อพลิกการ์ด ↻</div></div>
        <div class="flip-face flip-back"><b>${m.k}</b><p style="margin:8px 0">${m.d}</p><a href="#/ch/${m.ch}" class="hint" style="color:var(--green-2)">อ่านบทที่เกี่ยวข้อง →</a></div>
      </div>
    </div>`).join('')}</div>`;

  const PHRASES = ['วันนี้อยากให้ AI ช่วยงานอะไร?', 'เลือก Chat, Work หรือ Codex ให้ตรงงาน', 'สร้าง Agent ที่ปลอดภัยและตรวจได้', 'เขียน Prompt ที่ใช้กับงานจริง'];
  function home() {
    const lv = LEVELS.map(l => {
      const done = l.ids.filter(id => readSet.has(id)).length;
      return `<div class="level reveal"><div class="lv">${l.key}</div><div style="font-weight:700">${l.th}</div>
        <div class="bar"><i data-w="${done / l.ids.length * 100}"></i></div>
        <ul>${l.ids.map(id => chById[id] ? `<li><a href="#/ch/${id}"><span class="ck">${readSet.has(id) ? '✓' : '○'}</span>${esc(chById[id].title)}</a></li>` : '').join('')}</ul></div>`;
    }).join('');
    mount(`
      <section class="hero">
        <div class="hero-logo"><img src="${LOGO}" alt="ChatGPT logo"></div>
        <h1 class="greet"><span class="grad-text">สวัสดี คนทำงานยุค AI</span><span class="sub typed" id="typed"></span></h1>
      </section>
      <div class="chips">${SUGGEST.map(s => `<button class="chip-card" data-ask="${esc(s.q)}"><span class="t">${s.q}</span><span class="ic">${icon(s.i)}</span></button>`).join('')}</div>

      <h2 class="section-title reveal">เลือกเครื่องมือให้ตรงงาน</h2>
      ${modesHTML()}

      <h2 class="section-title reveal">วงจรการทำงานแบบ Agent</h2>
      ${loopHTML()}

      <h2 class="section-title reveal">เส้นทางการเรียน</h2>
      <div class="path">${lv}</div>

      <h2 class="section-title reveal">เครื่องมือ Interactive</h2>
      <div class="tool-grid">${TOOLS.map((t, i) => `<a class="tool-card reveal" style="transition-delay:${(i % 3) * 60}ms" href="#/tool/${t.id}"><span class="ti">${icon(t.i)}</span><span><b>${t.t}</b><span>${t.d}</span></span></a>`).join('')}</div>

      <blockquote class="reveal" style="margin-top:36px;padding:16px 20px;border-radius:16px;background:linear-gradient(90deg,rgba(16,163,127,.14),transparent);border-left:3px solid var(--green)">
        <b>หลักสำคัญ:</b> AI ช่วยคิด ช่วยทำ และช่วยติดตามงานได้ แต่ผู้ใช้ยังเป็นผู้กำหนดเป้าหมาย ขอบเขต สิทธิ์ และผู้ตรวจรับผลลัพธ์เสมอ
      </blockquote>
      <p class="disclaimer">เว็บแอปคู่มือการเรียนรู้ ไม่ใช่ผลิตภัณฑ์ทางการของ OpenAI · ChatGPT และโลโก้เป็นเครื่องหมายการค้าของ OpenAI · เนื้อหาเวอร์ชัน 1.0 (อัปเดต 2026-10-22)</p>
    `, 'หน้าแรก', true);
    setTimeout(() => $$('.level .bar i').forEach(b => { b.style.width = b.dataset.w + '%'; }), 300);
    typeLoop($('#typed'));
    initLoop();
  }
  function typeLoop(el) {
    let p = 0, c = 0, del = false, alive = true;
    cleanup.push(() => { alive = false; });
    (function tick() {
      if (!alive) return;
      const s = PHRASES[p];
      el.textContent = s.slice(0, c);
      if (!del && c < s.length) c++;
      else if (!del) { del = true; return setTimeout(tick, 1800); }
      else if (c > 0) c--;
      else { del = false; p = (p + 1) % PHRASES.length; }
      setTimeout(tick, del ? 28 : 55);
    })();
  }

  // ---------- Agent loop widget ----------
  const LOOP = [
    { en: 'GOAL', th: 'เป้าหมาย', d: 'กำหนดเป้าหมายที่ชัด วัดได้ พร้อมขอบเขตและผู้รับผลลัพธ์' },
    { en: 'PLAN', th: 'วางแผน', d: 'แตกงานเป็นขั้นตอน ระบุ Assumption, Need Data และจุดเสี่ยงที่ต้องให้คนอนุมัติ' },
    { en: 'ACT', th: 'ลงมือทำ', d: 'เรียกเครื่องมือ อ่านไฟล์ ค้นเว็บ หรือสร้างเอกสาร ภายใต้สิทธิ์ที่อนุญาตเท่านั้น' },
    { en: 'OBSERVE', th: 'ดูผล', d: 'อ่านผลลัพธ์จากเครื่องมือ และตรวจว่าเป็นไปตามแผนหรือไม่' },
    { en: 'ADAPT', th: 'ปรับ', d: 'ปรับแผนเมื่อผลไม่ตรง หรือมีข้อมูลใหม่เข้ามา' },
    { en: 'VERIFY', th: 'ตรวจ', d: 'ตรวจตามเกณฑ์ “เสร็จและถูกต้อง” แยก Fact / Assumption / Need Data' },
    { en: 'DELIVER', th: 'ส่งมอบ', d: 'ส่งผลลัพธ์ พร้อมส่งต่อจุดที่ต้องให้มนุษย์ตัดสินใจหรืออนุมัติ' }
  ];
  function loopHTML() {
    const R = 120;
    return `<div class="loop reveal"><div class="orbit" id="orbit"><div class="ring"></div><div class="core"><img src="${LOGO}" alt=""></div><div class="dot" id="orbit-dot"></div>
      ${LOOP.map((s, i) => { const a = i / LOOP.length * 2 * Math.PI - Math.PI / 2; return `<button class="node" data-node="${i}" style="transform:translate(${Math.cos(a) * R}px,${Math.sin(a) * R}px)">${s.en}</button>`; }).join('')}
      </div><div class="loop-info"><div class="widget-tag">${icon('loop')}ขั้นที่ <span id="loop-n">1</span> / 7</div><h3 id="loop-t"></h3><div class="th" id="loop-th"></div><p id="loop-d"></p>
      <div class="loop-ctrl"><button class="btn primary" id="loop-play">${icon('pause')}<span>หยุด</span></button><button class="btn" id="loop-next">${icon('next')}<span>ถัดไป</span></button></div></div></div>`;
  }
  function initLoop() {
    const orbit = $('#orbit'); if (!orbit) return;
    let k = 0, playing = true;
    const R = 120;
    const show = i => {
      k = (i + LOOP.length) % LOOP.length;
      const s = LOOP[k], a = k / LOOP.length * 2 * Math.PI - Math.PI / 2;
      $$('.node', orbit).forEach((n, j) => n.classList.toggle('on', j === k));
      $('#orbit-dot').style.transform = `translate(${Math.cos(a) * (R - 46)}px,${Math.sin(a) * (R - 46)}px)`;
      $('#loop-n').textContent = k + 1; $('#loop-t').textContent = s.en; $('#loop-th').textContent = s.th; $('#loop-d').textContent = s.d;
    };
    const timer = setInterval(() => { if (playing) show(k + 1); }, 2600);
    cleanup.push(() => clearInterval(timer));
    const setPlay = p => { playing = p; $('#loop-play').innerHTML = p ? `${icon('pause')}<span>หยุด</span>` : `${icon('play')}<span>เล่นอัตโนมัติ</span>`; };
    orbit.addEventListener('click', e => { const n = e.target.closest('[data-node]'); if (n) { setPlay(false); show(+n.dataset.node); } });
    $('#loop-play').onclick = () => setPlay(!playing);
    $('#loop-next').onclick = () => { setPlay(false); show(k + 1); };
    show(0);
  }

  // ---------- Model picker ----------
  const MODELS = [
    { n: 'Luna', p: 1, d: 'แปล จัดหมวดหมู่ ดึงข้อมูล สรุปตามรูปแบบ งานปริมาณมาก', e: 1 },
    { n: 'Terra', p: 2, d: 'งานประจำวัน เอกสาร ตาราง วิเคราะห์ทั่วไป', e: 2 },
    { n: 'Sol', p: 3, d: 'โค้ด งานหลายเงื่อนไข เอกสารซับซ้อน Agent และงานวิชาชีพ', e: 2 },
    { n: 'Astra', p: 4, d: 'โจทย์ยากที่สุด หลายแหล่ง หลายเครื่องมือ ต้องการเหตุผลสูง', e: 3 }
  ];
  const EFFORT = [
    { n: 'None / Light', d: 'เปลี่ยนรูปแบบตรงไปตรงมา', x: 'แก้คำผิด แปล ประโยคสั้น' },
    { n: 'Low', d: 'งานกติกาชัด ต้องการเร็ว', x: 'สรุปอีเมล จัดหมวดหมู่' },
    { n: 'Medium', d: 'งานทั่วไปที่ต้องวิเคราะห์', x: 'รายงาน เปรียบเทียบ สรุป Excel' },
    { n: 'High', d: 'หลายเงื่อนไข ต้องตรวจความสอดคล้อง', x: 'วิเคราะห์ข้อกำหนด แก้บั๊ก วางกลยุทธ์' },
    { n: 'Extra High / Max', d: 'งานซับซ้อนมาก ข้อมูลขัดแย้ง หรือหลายขั้นตอน', x: 'Debug ระบบใหญ่ ตรวจข้ามเอกสารจำนวนมาก' },
    { n: 'Ultra / multi-agent', d: 'งานใหญ่ที่แบ่งส่วนอิสระทำพร้อมกันได้ (หากมี)', x: 'ค้นข้อมูล + วิเคราะห์ + ตรวจรูปแบบพร้อมกัน' }
  ];
  const TASKS = [
    { t: 'แปลอีเมล / ปรับภาษา', m: 0, e: 1, r: 'Luna + Low' },
    { t: 'สรุปเอกสารตามหัวข้อ', m: 0, e: 2, r: 'Luna + Medium หรือ Terra + Low' },
    { t: 'วิเคราะห์รายงานทั่วไป', m: 1, e: 2, r: 'Terra + Medium' },
    { t: 'เปรียบเทียบข้อกำหนดกับหลักฐานหลายรายการ', m: 2, e: 3, r: 'Sol + High' },
    { t: 'ตรวจความขัดแย้งข้ามเอกสารมาก', m: 3, e: 3, r: 'Astra + High' },
    { t: 'งานใหญ่แยกส่วนได้', m: 2, e: 5, r: 'Sol/Astra + การแบ่งงานแบบหลาย agent หากพร้อมใช้' }
  ];
  function modelWidget() {
    return widgetBox('Interactive', 'brain', 'เลือกโมเดลและระดับการคิดให้คุ้ม', `
      <label class="lbl">1) เลือกประเภทงาน</label>
      <select id="mp-task"><option value="">— เลือกงานเพื่อดูชุดเริ่มต้นที่แนะนำ —</option>${TASKS.map((t, i) => `<option value="${i}">${t.t}</option>`).join('')}</select>
      <label class="lbl" style="margin-top:16px">2) หรือเลือกโมเดลเอง</label>
      <div class="models">${MODELS.map((m, i) => `<button class="model" data-model="${i}"><div class="mn">${m.n}</div><div class="md-desc">${m.d}</div><div class="meter">${[1, 2, 3, 4].map(k => `<i class="${k <= m.p ? 'f' : ''}"></i>`).join('')}</div></button>`).join('')}</div>
      <label class="lbl">3) Thinking effort: <span id="mp-ename" style="color:var(--green-2)"></span></label>
      <input type="range" min="0" max="5" step="1" value="2" id="mp-effort" aria-label="Thinking effort">
      <div class="effort-scale"><span>Light</span><span>Low</span><span>Med</span><span>High</span><span>Max</span><span>Ultra</span></div>
      <div class="reco" id="mp-reco"></div>
      <p style="font-size:12.5px;color:var(--muted);margin:12px 0 0">ชื่อโมเดล การเปิดใช้ และตัวเลือกในเมนูอาจต่างกันตามแผน ประเทศ พื้นที่ทำงาน และช่วง rollout — ตรวจในบัญชีจริงเสมอ</p>`);
  }
  function initModel(root) {
    const sel = $('#mp-task', root); if (!sel) return;
    let m = 1, e = 2, task = null;
    const draw = () => {
      $$('.model', root).forEach((b, i) => b.classList.toggle('on', i === m));
      $('#mp-effort', root).value = e;
      $('#mp-ename', root).textContent = EFFORT[e].n;
      const E = EFFORT[e], M = MODELS[m];
      const tip = e >= 4 ? 'งานซับซ้อนมาก — ตรวจว่าข้อมูลครบก่อนเพิ่ม effort และให้ผู้เชี่ยวชาญตรวจงานวิกฤต'
        : e <= 1 && m >= 2 ? 'โมเดลสูงกับ effort ต่ำ — ถ้างานง่าย ลองโมเดลประหยัดกว่าก่อน'
          : 'เริ่มที่โมเดลและ effort ต่ำสุดที่ผ่านเกณฑ์ แล้วค่อยเพิ่มเมื่อจำเป็น';
      $('#mp-reco', root).innerHTML = `${task != null ? `<div style="font-size:13px;color:var(--muted)">งาน: ${TASKS[task].t}</div><div style="font-size:20px;margin:4px 0">ชุดเริ่มต้นที่แนะนำ: <b>${TASKS[task].r}</b></div>` : `<div style="font-size:20px;margin-bottom:4px"><b>${M.n}</b> + <b>${E.n}</b></div>`}
        <div style="font-size:14px">โมเดล ${M.n} เหมาะกับ: ${M.d}</div>
        <div style="font-size:14px">Effort ${E.n} ใช้เมื่อ: ${E.d} <span style="color:var(--muted)">(เช่น ${E.x})</span></div>
        <div style="font-size:13px;margin-top:8px;color:var(--muted)">💡 ${tip}</div>`;
    };
    sel.onchange = () => { if (sel.value === '') { task = null; } else { task = +sel.value; m = TASKS[task].m; e = TASKS[task].e; } draw(); };
    $$('.model', root).forEach(b => b.onclick = () => { m = +b.dataset.model; e = MODELS[m].e; task = null; sel.value = ''; draw(); });
    $('#mp-effort', root).oninput = ev => { e = +ev.target.value; task = null; sel.value = ''; draw(); };
    draw();
  }

  // ---------- Cost calculator ----------
  function costWidget() {
    return widgetBox('Interactive', 'coin', 'คำนวณต้นทุน API อย่างง่าย', `
      <div class="row">
        <div><label class="lbl">Input tokens ต่อครั้ง</label><input type="number" min="0" id="c-in" value="50000"></div>
        <div><label class="lbl">Output tokens ต่อครั้ง (รวม reasoning ตามเอกสารโมเดล)</label><input type="number" min="0" id="c-out" value="5000"></div>
        <div><label class="lbl">ราคา Input ต่อ 1M tokens (USD) <span class="badge assume">Assumption</span></label><input type="number" min="0" step="0.01" id="c-pin" value="2"></div>
        <div><label class="lbl">ราคา Output ต่อ 1M tokens (USD) <span class="badge assume">Assumption</span></label><input type="number" min="0" step="0.01" id="c-pout" value="8"></div>
        <div><label class="lbl">ค่าเครื่องมือ/ค้นเว็บอื่น ต่อครั้ง (USD)</label><input type="number" min="0" step="0.001" id="c-tool" value="0"></div>
        <div><label class="lbl">จำนวนครั้งต่อเดือน</label><input type="number" min="0" id="c-n" value="1000"></div>
      </div>
      <div class="row" style="margin-top:18px;align-items:end">
        <div><div style="font-size:13px;color:var(--muted)">ต่อครั้ง</div><div class="out-num" id="c-one">$0</div></div>
        <div><div style="font-size:13px;color:var(--muted)">ต่อเดือน</div><div class="out-num grad-text" id="c-month">$0</div></div>
      </div>
      <div class="cost-bars"><i id="cb-in" style="background:#10a37f"></i><i id="cb-out" style="background:#1ad1b0"></i><i id="cb-tool" style="background:#f5a524"></i></div>
      <div style="font-size:12.5px;color:var(--muted)"><span style="color:#10a37f">■</span> Input <span style="color:#1ad1b0;margin-left:10px">■</span> Output <span style="color:#f5a524;margin-left:10px">■</span> Tools</div>
      <div class="code" style="margin-top:14px"><div class="code-head"><span>สูตร</span></div><pre id="c-formula"></pre></div>
      <p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">ราคาเริ่มต้นเป็นตัวเลขสมมติเพื่อสาธิตเท่านั้น — ใส่ราคาจริงจากหน้า Pricing ของ OpenAI ล่าสุด และอย่าบวก reasoning ซ้ำหากรวมอยู่ใน Output แล้ว</p>`);
  }
  function animateNum(el, to) {
    const from = parseFloat(el.dataset.v || '0'); el.dataset.v = to;
    const t0 = performance.now();
    const fmt = v => '$' + (v < 1 ? v.toFixed(4) : v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
    (function f(t) { const k = Math.min(1, (t - t0) / 500); el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function initCost(root) {
    if (!$('#c-in', root)) return;
    const v = id => Math.max(0, parseFloat($(id, root).value) || 0);
    const calc = () => {
      const ci = v('#c-in') / 1e6 * v('#c-pin'), co = v('#c-out') / 1e6 * v('#c-pout'), ct = v('#c-tool');
      const one = ci + co + ct, tot = one || 1;
      animateNum($('#c-one', root), one); animateNum($('#c-month', root), one * v('#c-n'));
      $('#cb-in', root).style.width = ci / tot * 100 + '%'; $('#cb-out', root).style.width = co / tot * 100 + '%'; $('#cb-tool', root).style.width = ct / tot * 100 + '%';
      $('#c-formula', root).textContent = `Cost = (${v('#c-in').toLocaleString()} ÷ 1,000,000 × ${v('#c-pin')})\n     + (${v('#c-out').toLocaleString()} ÷ 1,000,000 × ${v('#c-pout')})\n     + ${v('#c-tool')}\n     = $${one.toFixed(4)} ต่อครั้ง`;
    };
    $$('input', root).forEach(i => i.addEventListener('input', calc));
    calc();
  }

  // ---------- Prompt builder ----------
  const PB_FIELDS = [
    ['ROLE', 'บทบาท', 'ให้ AI ทำหน้าที่อะไร เช่น นักวิเคราะห์ข้อมูลอาวุโส'],
    ['OBJECTIVE', 'เป้าหมาย', 'ผลลัพธ์สุดท้ายและใครจะใช้ เช่น รายงานผู้บริหาร 2 หน้าเพื่อใช้ตัดสินใจ'],
    ['DATA', 'ข้อมูลหลัก', 'ไฟล์/ข้อความ/ลิงก์ที่เป็น source of truth'],
    ['OUTPUT', 'รูปแบบผลลัพธ์', 'ตาราง/หัวข้อ/ภาษา/ความยาว/ไฟล์'],
    ['RULES', 'กฎเพิ่มเติม', 'ข้อจำกัด สิ่งที่ห้ามเดา มาตรฐานการทำงาน'],
    ['VALIDATION', 'ตรวจทานก่อนส่ง', 'ความถูกต้องของตัวเลข หน่วย วันที่ ความครบถ้วน']
  ];
  const PB_TOGGLES = [
    'แยก Fact / Assumption / Need Data',
    'ห้ามแต่งตัวเลข สถิติ ราคา ผลลัพธ์ หรือแหล่งอ้างอิง',
    'หากข้อมูลไม่พอ ให้ถามหรือระบุรายการข้อมูลที่ขาด',
    'ยังไม่ต้องสร้างผลลัพธ์สุดท้าย ให้เสนอแผนก่อน',
    'คงโครงสร้างเดิม แก้เฉพาะจุดที่ระบุ'
  ];
  const PB_PRESETS = {
    report: { ROLE: 'นักวิเคราะห์ธุรกิจที่เขียนรายงานผู้บริหาร', OBJECTIVE: 'สร้างรายงานผู้บริหารภาษาไทย 2 หน้า เพื่อให้ผู้บริหารตัดสินใจได้', DATA: 'ใช้ไฟล์แนบเป็นแหล่งข้อมูลหลัก', OUTPUT: 'Executive summary, KPI table, ความเสี่ยง, ข้อเสนอแนะ 3 ข้อ', RULES: '', VALIDATION: 'ตรวจหน่วย ตัวเลข และช่วงเวลาก่อนส่ง', t: [0, 1] },
    webapp: { ROLE: 'Software engineer ที่ใช้ Codex', OBJECTIVE: 'สร้างเว็บแอป [ชื่อระบบ] สำหรับ [ผู้ใช้] เพื่อแก้ปัญหา [งาน]', DATA: 'ข้อมูลเข้า: [ฟอร์ม/CSV/Excel/API]', OUTPUT: 'สรุป requirement, โครงสร้างไฟล์และ data model, หน้าจอและ workflow, แผนทดสอบ', RULES: 'ข้อจำกัด: offline / ไม่ส่งข้อมูลออก / ภาษาไทย / Responsive', VALIDATION: 'มีแผนทดสอบครบทุกหน้าจอ', t: [2, 3] },
    edit: { ROLE: 'บรรณาธิการภาษาไทยมืออาชีพ', OBJECTIVE: 'เกลาข้อความให้ลื่นไหล เป็นธรรมชาติ และเหมาะกับ [กลุ่มผู้อ่าน]', DATA: 'ข้อความที่แนบด้านล่าง', OUTPUT: '1) ฉบับแก้ไข 2) รายการจุดสำคัญที่ปรับ', RULES: 'คงสาระ ข้อเท็จจริง ตัวเลข และเจตนาเดิมไว้ครบ ไม่เพิ่มข้อมูลใหม่ ไม่ใช้คำโฆษณาเกินจริง', VALIDATION: 'ตัวเลขและชื่อเฉพาะตรงต้นฉบับ', t: [4] }
  };
  function promptWidget() {
    return widgetBox('Interactive', 'wand', 'Prompt Builder — สูตร 6 ส่วน', `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <span style="font-size:13px;color:var(--muted);align-self:center">เริ่มจากตัวอย่าง:</span>
        <button class="btn" data-preset="report">รายงานผู้บริหาร</button><button class="btn" data-preset="webapp">สร้างเว็บแอป (Codex)</button><button class="btn" data-preset="edit">เกลาภาษาไทย</button>
        <button class="btn" data-preset="clear">${icon('reset')}ล้าง</button>
      </div>
      <div class="pb-grid">
        <div class="pb-fields">
          ${PB_FIELDS.map(([k, th, ph]) => `<div><label class="lbl"><span class="pb-key">${k}</span> · ${th}</label><textarea class="field" rows="2" data-pb="${k}" placeholder="${ph}"></textarea></div>`).join('')}
          <div><label class="lbl">กฎมาตรฐาน (แตะเพื่อเปิด/ปิด)</label><div class="toggles">${PB_TOGGLES.map((t, i) => `<button class="tog" data-tog="${i}">${t}</button>`).join('')}</div></div>
        </div>
        <div class="pb-preview">
          <div class="quality"><span>ความครบของ Prompt</span><div class="qbar"><i id="pb-q"></i></div><b id="pb-qn">0/6</b></div>
          <div class="code"><div class="code-head"><span>Prompt พร้อมใช้</span><button class="copy" data-copy>${icon('copy')}<span>คัดลอก</span></button></div><pre id="pb-out"></pre></div>
        </div>
      </div>`);
  }
  function initPrompt(root) {
    if (!$('#pb-out', root)) return;
    const st = store.get('pb', { f: {}, t: [0, 1, 2] });
    const draw = () => {
      const f = st.f, lines = [];
      if (f.ROLE) lines.push(`บทบาท: คุณคือ ${f.ROLE}`);
      if (f.OBJECTIVE) lines.push(`\nเป้าหมาย: ${f.OBJECTIVE}`);
      if (f.DATA) lines.push(`\nข้อมูลหลัก: ${f.DATA}`);
      if (f.OUTPUT) lines.push(`\nรูปแบบผลลัพธ์: ${f.OUTPUT}`);
      const rules = [...st.t.sort().map(i => PB_TOGGLES[i]), ...(f.RULES ? f.RULES.split('\n').filter(Boolean) : [])];
      if (rules.length) lines.push(`\nกฎ:\n${rules.map(r => '- ' + r).join('\n')}`);
      if (f.VALIDATION) lines.push(`\nตรวจทานก่อนส่ง: ${f.VALIDATION}`);
      $('#pb-out', root).textContent = lines.join('\n').trim() || 'เริ่มกรอกช่องด้านซ้าย หรือเลือกตัวอย่างด้านบน — Prompt จะประกอบขึ้นที่นี่แบบเรียลไทม์';
      const n = PB_FIELDS.filter(([k]) => (f[k] || '').trim() || (k === 'RULES' && st.t.length)).length;
      $('#pb-q', root).style.width = n / 6 * 100 + '%'; $('#pb-qn', root).textContent = `${n}/6`;
      $$('[data-tog]', root).forEach(b => b.classList.toggle('on', st.t.includes(+b.dataset.tog)));
      store.set('pb', st);
    };
    const fill = () => $$('[data-pb]', root).forEach(t => { t.value = st.f[t.dataset.pb] || ''; });
    $$('[data-pb]', root).forEach(t => t.addEventListener('input', () => { st.f[t.dataset.pb] = t.value; draw(); }));
    $$('[data-tog]', root).forEach(b => b.onclick = () => { const i = +b.dataset.tog; st.t = st.t.includes(i) ? st.t.filter(x => x !== i) : [...st.t, i]; draw(); });
    $$('[data-preset]', root).forEach(b => b.onclick = () => {
      const p = PB_PRESETS[b.dataset.preset];
      if (p) { st.f = { ...p }; delete st.f.t; st.t = [...p.t]; } else { st.f = {}; st.t = []; }
      fill(); draw();
    });
    fill(); draw();
  }

  // ---------- Fact sorter ----------
  const SORT_ITEMS = [
    ['ยอดขายเดือนนี้ 2.4 ล้านบาท ตามไฟล์รายงานที่แนบ', 'Fact'],
    ['สมมติทำงาน 20 วันต่อเดือน เพื่อใช้คำนวณตัวอย่าง', 'Assumption'],
    ['จำนวนชั่วโมงทำงานจริงต่อคน — ยังไม่มีในไฟล์', 'Need Data'],
    ['ราคาวัตถุดิบตามใบเสนอราคาที่แนบมา', 'Fact'],
    ['ให้ลูกค้าใหม่เพิ่ม 10% เป็นสมมติฐานของ Scenario B', 'Assumption'],
    ['ต้นทุนค่าแรงต่อชั่วโมงของไลน์ผลิต B — ไม่มีแหล่งข้อมูล', 'Need Data'],
    ['วันที่ประกาศมีผลบังคับใช้ ตามเว็บไซต์หน่วยงานทางการที่อ้างอิง', 'Fact'],
    ['จำนวนผู้ใช้จริงต่อวันของระบบเดิม — ต้องขอจากทีม IT', 'Need Data']
  ];
  function sorterWidget() {
    return widgetBox('ฝึกทักษะ', 'sort', 'แยกข้อมูล: Fact / Assumption / Need Data', `
      <p style="margin:0 0 12px;color:var(--muted)">อ่านข้อความแล้วเลือกว่าควรจัดอยู่กลุ่มไหน — หลักนี้ช่วยกันไม่ให้ AI แต่งข้อมูล</p>
      <div class="quiz-bar"><i id="fs-bar" style="width:0"></i></div>
      <div id="fs-body"></div>`);
  }
  function initSorter(root) {
    const body = $('#fs-body', root); if (!body) return;
    let i = 0, score = 0;
    const draw = () => {
      $('#fs-bar', root).style.width = i / SORT_ITEMS.length * 100 + '%';
      if (i >= SORT_ITEMS.length) {
        body.innerHTML = `<div class="quiz-q">ได้ ${score}/${SORT_ITEMS.length} คะแนน</div><p style="color:var(--muted)">คำสั่งสำคัญ: “ห้ามแต่งสถิติ ตัวเลข ผลลัพธ์จริง ราคา รีวิว หรือแหล่งอ้างอิง หากข้อมูลไม่พอให้ระบุ Need Data”</p><button class="btn primary" id="fs-again">${icon('reset')}เล่นอีกครั้ง</button>`;
        $('#fs-again', root).onclick = () => { i = 0; score = 0; draw(); };
        if (score === SORT_ITEMS.length) confetti();
        return;
      }
      const [t] = SORT_ITEMS[i];
      body.innerHTML = `<div class="quiz-q" style="animation:pageIn .4s var(--ease)">“${t}”</div><div class="row3">${['Fact', 'Assumption', 'Need Data'].map(k => `<button class="quiz-opt" data-k="${k}" style="text-align:center"><span class="badge ${k === 'Fact' ? 'fact' : k === 'Assumption' ? 'assume' : 'need'}">${k}</span></button>`).join('')}</div>`;
      $$('[data-k]', body).forEach(b => b.onclick = () => {
        const ok = b.dataset.k === SORT_ITEMS[i][1];
        $$('[data-k]', body).forEach(x => { x.disabled = true; if (x.dataset.k === SORT_ITEMS[i][1]) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else score++;
        setTimeout(() => { i++; draw(); }, ok ? 700 : 1300);
      });
    };
    draw();
  }

  // ---------- Permissions ----------
  const PERMS = [
    { n: 'Read-only', x: 'อ่านไฟล์ ดูตาราง สรุปอีเมล', r: 1, c: '#10a37f' },
    { n: 'Draft only', x: 'ร่างอีเมล/เอกสาร แต่ไม่ส่งหรือบันทึก', r: 2, c: '#19c37d' },
    { n: 'Ask before action', x: 'ต้องขออนุมัติก่อนส่ง แก้ไข หรือสร้างรายการ', r: 3, c: '#1ad1b0' },
    { n: 'Allowed actions', x: 'ทำงานเฉพาะชุดที่กำหนด เช่น อัปเดต task ที่ได้รับมอบหมาย', r: 4, c: '#f5a524' },
    { n: 'Denied actions', x: 'ห้ามลบข้อมูล โอนเงิน เปลี่ยนสิทธิ์ หรือเผยแพร่ข้อมูล', r: 0, c: '#ef4444' }
  ];
  function permWidget() {
    return widgetBox('Interactive', 'lock', 'ออกแบบระดับสิทธิ์ของ Agent', `
      <div class="seg" id="perm-seg"><span class="pill"></span>${PERMS.map((p, i) => `<button data-p="${i}">${p.n}</button>`).join('')}</div>
      <div id="perm-out"></div>
      <p style="font-size:13px;color:var(--muted);margin:12px 0 0">เริ่มจากสิทธิ์น้อยที่สุด (least privilege) · ให้ร่างก่อนส่งจริงเสมอในช่วงเริ่มต้น · อนุมัติงานที่เกี่ยวกับเงิน ข้อมูลบุคคล ระบบผลิต หรือการสื่อสารภายนอก</p>`);
  }
  function initPerm(root) {
    const seg = $('#perm-seg', root); if (!seg) return;
    const pick = i => {
      const btns = $$('button', seg), b = btns[i], pill = $('.pill', seg);
      btns.forEach((x, j) => x.classList.toggle('on', j === i));
      pill.style.left = b.offsetLeft + 'px'; pill.style.width = b.offsetWidth + 'px'; pill.style.top = b.offsetTop + 'px'; pill.style.height = b.offsetHeight + 'px';
      pill.style.background = PERMS[i].c;
      const p = PERMS[i];
      $('#perm-out', root).innerHTML = `<div class="perm-out"><div style="font-size:20px;font-weight:800">${p.n}</div><div style="margin:4px 0 10px">${p.x}</div>
        <div style="font-size:13px;color:var(--muted)">${p.r ? 'ระดับอำนาจที่ AI ได้รับ' : 'สิ่งที่ห้าม AI ทำเด็ดขาด'}</div>
        <div class="meter" style="max-width:280px">${[1, 2, 3, 4].map(k => `<i style="${(p.r ? k <= p.r : true) ? `background:${p.c}` : ''}"></i>`).join('')}</div></div>`;
    };
    seg.onclick = e => { const b = e.target.closest('[data-p]'); if (b) pick(+b.dataset.p); };
    requestAnimationFrame(() => pick(0));
    const ro = new ResizeObserver(() => pick($$('button', seg).findIndex(b => b.classList.contains('on')) || 0));
    ro.observe(seg); cleanup.push(() => ro.disconnect());
  }

  // ---------- Checklist ----------
  const CHECK_ITEMS = (chById['16']?.body.match(/^- \[ \] .+$/gm) || []).map(l => l.replace(/^- \[ \] /, ''));
  function checklistWidget() {
    return widgetBox('Checklist', 'check', 'Checklist ก่อนส่งงาน', `
      <div class="check-head"><div class="pring"><svg viewBox="0 0 70 70"><circle cx="35" cy="35" r="30" class="bg"/><circle cx="35" cy="35" r="30" class="fg" id="ck-ring"/></svg><span id="ck-n">0%</span></div>
      <div><b>ตรวจครบทุกข้อก่อนส่งงานจริง</b><div style="font-size:13px;color:var(--muted)">สถานะถูกบันทึกไว้ในเครื่องนี้</div></div>
      <button class="btn" id="ck-reset" style="margin-left:auto">${icon('reset')}เริ่มใหม่</button></div>
      <div class="check-list">${CHECK_ITEMS.map((t, i) => `<div class="check-item" data-ck="${i}" role="checkbox" tabindex="0" aria-checked="false"><span class="box"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg></span><span>${inline(t)}</span></div>`).join('')}</div>`);
  }
  function initChecklist(root) {
    if (!$('#ck-ring', root)) return;
    let st = store.get('check', []);
    const draw = (celebrate) => {
      $$('[data-ck]', root).forEach(el => { const on = st.includes(+el.dataset.ck); el.classList.toggle('on', on); el.setAttribute('aria-checked', on); });
      const p = CHECK_ITEMS.length ? st.length / CHECK_ITEMS.length : 0;
      $('#ck-ring', root).style.strokeDashoffset = 188.5 * (1 - p); $('#ck-n', root).textContent = Math.round(p * 100) + '%';
      store.set('check', st);
      if (celebrate && p === 1) { confetti(); toast('พร้อมส่งงานแล้ว!'); }
    };
    const tog = el => { const i = +el.dataset.ck; st = st.includes(i) ? st.filter(x => x !== i) : [...st, i]; draw(true); };
    $$('[data-ck]', root).forEach(el => { el.onclick = () => tog(el); el.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tog(el); } }; });
    $('#ck-reset', root).onclick = () => { st = []; draw(); };
    draw();
  }

  // ---------- Glossary flashcards ----------
  const GLOSS = (chById['19']?.body.split('\n').filter(l => /^\|/.test(l)).slice(2) || []).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  function glossaryWidget() {
    return widgetBox('Flashcards', 'cards', `Glossary — ${GLOSS.length} คำศัพท์`, `
      <p style="margin:0 0 14px;color:var(--muted)">แตะการ์ดเพื่อพลิกดูความหมาย</p>
      <div class="cards-3d">${GLOSS.map(([k, v], i) => `<div class="flip reveal" style="transition-delay:${(i % 4) * 50}ms" data-flip tabindex="0" role="button"><div class="flip-in"><div class="flip-face flip-front"><div class="big">${esc(k)}</div><div class="hint" style="margin-top:8px">แตะเพื่อพลิก ↻</div></div><div class="flip-face flip-back">${esc(v)}</div></div></div>`).join('')}</div>`);
  }

  // ---------- Quiz ----------
  const QUIZ = [
    ['ต้องการให้ AI สร้าง แก้ และทดสอบเว็บแอป ควรใช้ส่วนใด?', ['Chat', 'ChatGPT Work', 'Codex', 'API'], 2, 'Codex = Build — สร้าง แก้ ทดสอบ หรือรีวิวซอฟต์แวร์', '9'],
    ['“Context window” หมายถึงอะไร?', ['ความจำถาวรของ AI', 'ปริมาณข้อความ ไฟล์ และประวัติที่ใส่ได้ในรอบนั้น', 'จำนวนโมเดลที่เลือกได้', 'ความเร็วในการตอบ'], 1, 'Context ใหญ่ไม่ใช่ความจำถาวร และข้อมูลมากเกินไปอาจกลบประเด็นสำคัญ', '5'],
    ['งานแปลอีเมล / ปรับภาษา ชุดเริ่มต้นที่แนะนำคือ?', ['Luna + Low', 'Astra + High', 'Sol + Max', 'Terra + Extra High'], 0, 'เริ่มที่โมเดลและ effort ต่ำสุดที่ผ่านเกณฑ์', '4'],
    ['“สมมติทำงาน 20 วันต่อเดือน” จัดอยู่กลุ่มใด?', ['Fact', 'Assumption', 'Need Data', 'Target'], 1, 'Assumption คือข้อสมมติที่ใช้เพื่อทำตัวอย่างหรือคำนวณ', '3'],
    ['งานใดยังไม่ควรมอบหมายให้ Agent แบบปล่อยอิสระ?', ['สรุปข่าวรายสัปดาห์', 'อนุมัติการเงินหรือโอนเงิน', 'รวบรวมข้อมูลจากหลายไฟล์', 'เตรียมเอกสารประชุม'], 1, 'การเงิน สัญญา การส่งข้อความภายนอก และการลบข้อมูลต้องมีมนุษย์อนุมัติ', '2'],
    ['วิธีสั่งแก้งานที่ประหยัดและได้งานดีคือ?', ['สั่งแก้ทีละประโยค', 'รวบรวม Feedback แล้วส่งครั้งเดียว', 'สั่ง “ทำใหม่ทั้งหมด” ทุกครั้ง', 'เปลี่ยนไปใช้โมเดลสูงสุด'], 1, 'รวมคำแก้แล้วระบุว่าคงอะไร แก้อะไร ในครั้งเดียว', '3'],
    ['ข้อใดคือการป้องกัน Prompt injection ที่ถูกต้อง?', ['ให้สิทธิ์ Agent ทุกระบบเพื่อความสะดวก', 'ให้ Agent ถือเนื้อหาภายนอกเป็น “ข้อมูล” ไม่ใช่ “คำสั่ง”', 'ปิด log เพื่อความเป็นส่วนตัว', 'อนุญาตให้ส่งข้อมูลออกอัตโนมัติ'], 1, 'จำกัดสิทธิ์ ยืนยันก่อน external action และตรวจ log', '14'],
    ['สไลด์ที่ต้องแก้ตัวเลขภายหลัง ควรสร้างอย่างไร?', ['ทำทั้งหน้าเป็นภาพเดียว', 'ใช้ Text box, Table และ Chart ที่แก้ไขได้', 'แปะภาพหน้าจอ Excel', 'ใช้ฟอนต์ตกแต่งให้มากที่สุด'], 1, 'อย่าสร้างสไลด์ทั้งหน้าเป็นภาพเดียว ถ้าต้องแก้คำ ตัวเลข หรือกราฟ', '13'],
    ['แผน ChatGPT กับ API ใช้แทนกันได้หรือไม่?', ['ได้ ใช้บัญชีเดียวกัน', 'ไม่ได้ — คนละระบบ แยกการเรียกเก็บเงิน', 'ได้เฉพาะแผน Pro', 'ได้เฉพาะ Enterprise'], 1, 'โควตาแชต เครดิต API key และโหมดความเร็วเป็นคนละระบบ', '6'],
    ['หลักเลือกโมเดลอย่างคุ้มค่าข้อแรกคือ?', ['เริ่มที่โมเดลสูงสุดเสมอ', 'เริ่มที่โมเดลและ effort ต่ำสุดที่ผ่านเกณฑ์', 'ใช้ effort Max ทุกงาน', 'เลือกตามความยาวคำตอบ'], 1, 'ถ้าข้อมูลยังไม่ครบ ให้เพิ่มข้อมูลก่อนเพิ่ม effort', '4']
  ];
  function quizWidget() { return widgetBox('แบบทดสอบ', 'quiz', 'ทดสอบความเข้าใจ', `<div class="quiz-bar"><i id="qz-bar" style="width:0"></i></div><div id="qz-body"></div>`); }
  function initQuiz(root) {
    const body = $('#qz-body', root); if (!body) return;
    let i = 0, score = 0;
    const draw = () => {
      $('#qz-bar', root).style.width = i / QUIZ.length * 100 + '%';
      if (i >= QUIZ.length) {
        const pct = Math.round(score / QUIZ.length * 100);
        body.innerHTML = `<div style="text-align:center;padding:10px 0"><div class="out-num grad-text" style="font-size:56px">${pct}%</div><div class="quiz-q">ตอบถูก ${score} จาก ${QUIZ.length} ข้อ</div><p style="color:var(--muted)">${pct >= 80 ? 'ยอดเยี่ยม! พร้อมนำไปใช้งานจริงแล้ว' : 'ลองทบทวนบทที่เกี่ยวข้อง แล้วทำใหม่อีกครั้ง'}</p><button class="btn primary" id="qz-again">${icon('reset')}ทำใหม่</button></div>`;
        $('#qz-again', root).onclick = () => { i = 0; score = 0; draw(); };
        store.set('quizBest', Math.max(store.get('quizBest', 0), pct));
        if (pct >= 80) confetti();
        return;
      }
      const [q, opts, ans, exp, ch] = QUIZ[i];
      body.innerHTML = `<div style="font-size:13px;color:var(--muted)">ข้อ ${i + 1} / ${QUIZ.length}</div><div class="quiz-q">${q}</div><div class="quiz-opts">${opts.map((o, j) => `<button class="quiz-opt" data-o="${j}">${String.fromCharCode(65 + j)}. ${o}</button>`).join('')}</div><div id="qz-exp"></div>`;
      $$('[data-o]', body).forEach(b => b.onclick = () => {
        const ok = +b.dataset.o === ans;
        if (ok) score++;
        $$('[data-o]', body).forEach(x => { x.disabled = true; if (+x.dataset.o === ans) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        $('#qz-exp', body).innerHTML = `<div class="quiz-exp">${ok ? '✅ ถูกต้อง' : '❌ ยังไม่ถูก'} — ${exp} <a href="#/ch/${ch}">อ่านบทที่ ${ch}</a><div style="margin-top:10px"><button class="btn primary" id="qz-next">${i + 1 < QUIZ.length ? 'ข้อต่อไป' : 'ดูผลคะแนน'} ${icon('arrow')}</button></div></div>`;
        $('#qz-next', body).onclick = () => { i++; draw(); };
      });
    };
    draw();
  }

  // ---------- Prompt library ----------
  function libraryWidget() {
    return widgetBox('Prompt Library', 'code', `รวม Prompt และ Template ทั้งหมด (${library.length})`, `
      <div class="lib-search">${icon('search')}<input type="text" id="lib-q" placeholder="ค้นหา Prompt เช่น รายงาน, Dashboard, ภาพ, Codex..."></div>
      <div id="lib-list"></div>`);
  }
  function initLibrary(root) {
    const list = $('#lib-list', root); if (!list) return;
    const draw = q => {
      const k = q.trim().toLowerCase();
      const items = library.filter(l => !k || (l.title + l.code + l.ch.title).toLowerCase().includes(k));
      list.innerHTML = items.map(l => `<div class="lib-item reveal in"><h4>${inline(l.title)}</h4><small><a href="#/ch/${l.ch.id}">บทที่ ${l.ch.num} · ${esc(l.ch.title)}</a></small>${codeHTML(l.code, l.lang)}</div>`).join('') || '<p style="color:var(--muted)">ไม่พบ Prompt ที่ตรงกับคำค้น</p>';
    };
    $('#lib-q', root).oninput = e => draw(e.target.value);
    draw('');
  }

  // ---------- widget registry ----------
  const W = {
    loop: { html: loopHTML, init: initLoop, title: 'วงจร Agent' },
    prompt: { html: promptWidget, init: initPrompt, title: 'Prompt Builder' },
    model: { html: modelWidget, init: initModel, title: 'เลือกโมเดล & Effort' },
    cost: { html: costWidget, init: initCost, title: 'คำนวณค่า API' },
    sorter: { html: sorterWidget, init: initSorter, title: 'Fact / Assumption / Need Data' },
    perm: { html: permWidget, init: initPerm, title: 'ระดับสิทธิ์ Agent' },
    checklist: { html: checklistWidget, init: initChecklist, title: 'Checklist ก่อนส่งงาน' },
    library: { html: libraryWidget, init: initLibrary, title: 'Prompt Library' },
    glossary: { html: glossaryWidget, init: () => { }, title: 'Glossary Flashcards' },
    quiz: { html: quizWidget, init: initQuiz, title: 'แบบทดสอบ' },
    modes: { html: () => widgetBox('Interactive', 'spark', 'Chat = Ask · Work = Do · Codex = Build · API = Integrate', modesHTML()), init: () => { }, title: 'เลือกเครื่องมือ' }
  };
  const CH_WIDGETS = { 1: ['modes', 'loop'], 2: ['loop'], 3: ['sorter'], 4: ['model'], 5: ['cost'], 7: ['prompt'], 14: ['perm'], 16: ['checklist'], 18: ['library'], 19: ['glossary'], summary: ['quiz'] };

  function tool(id) {
    const w = W[id]; if (!w) return home();
    const t = TOOLS.find(x => x.id === id);
    mount(`<div class="ch-hero"><span class="ch-kicker">${icon(t ? t.i : 'spark')}เครื่องมือ Interactive</span><h1>${w.title}</h1>${t ? `<div class="ch-meta">${t.d}</div>` : ''}</div>${w.html()}`, w.title, id === 'library' || id === 'glossary' || id === 'prompt');
    w.init(view);
  }

  // ---------- chapter ----------
  function chapter(id) {
    const c = chById[id]; if (!c) return home();
    const pos = chapters.indexOf(c), prev = chapters[pos - 1], next = chapters[pos + 1];
    const subs = [...c.body.matchAll(/^### (.+)$/gm)].map((m, i) => ({ t: m[1].replace(/^\d+\.\d+\s+/, ''), id: `s-${id}-${i + 1}` }));
    const lv = levelOf(id);
    const mins = Math.max(2, Math.round(c.body.length / 900));
    const ws = CH_WIDGETS[id] || [];
    mount(`
      <div class="ch-hero">
        <span class="ch-kicker">${icon('book')}${c.num ? `บทที่ ${c.num}` : 'สรุป'}${lv ? ` · ${lv.key}` : ''}</span>
        <h1>${esc(c.title)}</h1>
        <div class="ch-meta"><span>⏱ อ่านประมาณ ${mins} นาที</span><span>📑 ${subs.length} หัวข้อย่อย</span>${ws.length ? `<span>✨ มีเครื่องมือ Interactive</span>` : ''}${readSet.has(id) ? '<span style="color:var(--green-2)">✓ อ่านแล้ว</span>' : ''}</div>
        ${subs.length ? `<div class="toc-pills">${subs.map(s => `<a href="#/ch/${id}" data-scroll="${s.id}">${esc(s.t)}</a>`).join('')}${ws.length ? `<a href="#/ch/${id}" data-scroll="w-0" style="border-color:var(--green)">✨ ลองใช้งาน</a>` : ''}</div>` : ''}
      </div>
      <article class="md">${renderMD(c.body, id)}</article>
      ${ws.map((w, i) => `<div id="w-${i}">${W[w].html()}</div>`).join('')}
      <nav class="ch-nav">
        ${prev ? `<a href="#/ch/${prev.id}"><small>← ก่อนหน้า</small>${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="next" href="#/ch/${next.id}"><small>ถัดไป →</small>${esc(next.title)}</a>` : ''}
      </nav>`, c.num ? `${c.num}. ${c.title}` : c.title);
    ws.forEach(w => W[w].init(view));
    $$('.md h3, .md .tbl-wrap, .md .code, .md blockquote', view).forEach(el => el.classList.add('reveal'));
    enhance(view);
    currentCh = id;
    setTimeout(onScroll, 400);
  }
  let currentCh = null;

  // ---------- chat ----------
  let chatLog = [];
  const INTENTS = [
    [/คำนวณ|ต้นทุน|ค่าใช้จ่าย|cost|ราคา api/i, 'cost'],
    [/prompt|พรอมต์|พร้อมท์|คำสั่ง/i, 'prompt'],
    [/โมเดล|model|effort|luna|terra|sol|astra/i, 'model'],
    [/checklist|ตรวจงาน|ก่อนส่ง/i, 'checklist'],
    [/สิทธิ์|permission|injection/i, 'perm'],
    [/fact|assumption|need data/i, 'sorter'],
    [/quiz|แบบทดสอบ|ข้อสอบ/i, 'quiz'],
    [/ศัพท์|glossary|ความหมาย/i, 'glossary'],
    [/agent|เอเจนต์|loop|วงจร/i, 'loop']
  ];
  function chatPage() {
    mount(`<div class="chat" id="chat">${chatLog.length ? '' : `<div class="chat-empty"><div class="hero-logo" style="width:72px;height:72px"><img src="${LOGO}" alt="" style="width:48px;height:48px"></div><h1 class="greet" style="font-size:clamp(26px,4vw,38px)"><span class="grad-text">มีอะไรให้ช่วยในคู่มือนี้?</span></h1><div class="chips" style="margin-top:26px">${SUGGEST.map(s => `<button class="chip-card" data-ask="${esc(s.q)}"><span class="t">${s.q}</span><span class="ic">${icon(s.i)}</span></button>`).join('')}</div></div>`}</div>`, 'ผู้ช่วยถามตอบ');
    const box = $('#chat');
    chatLog.forEach(m => box.insertAdjacentHTML('beforeend', m));
    view.scrollTop = view.scrollHeight;
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    if (!location.hash.startsWith('#/chat')) { pendingQ = q; location.hash = '#/chat'; return; }
    const box = $('#chat'); if (!box) return;
    $('.chat-empty', box)?.remove();
    const um = `<div class="msg user"><div class="bubble">${esc(q)}</div></div>`;
    chatLog.push(um); box.insertAdjacentHTML('beforeend', um);
    box.insertAdjacentHTML('beforeend', `<div class="msg bot thinking" id="thinking"><div class="av"><img src="${LOGO}" alt=""></div><div class="bubble"><div class="think-line">กำลังค้นในคู่มือ ${chapters.length} บท...</div><div class="dots"><i></i><i></i><i></i></div></div></div>`);
    view.scrollTo({ top: view.scrollHeight, behavior: 'smooth' });
    setTimeout(() => answer(q), 650 + Math.random() * 400);
  }
  function answer(q) {
    $('#thinking')?.remove();
    const box = $('#chat'); if (!box) return;
    const res = search(q);
    const intent = INTENTS.find(([re]) => re.test(q));
    let html;
    if (!res.length) {
      html = `<p>ยังไม่พบหัวข้อที่ตรงกับคำถามนี้ในคู่มือ ลองใช้คำสำคัญอื่น เช่น <b>Prompt</b>, <b>โมเดล</b>, <b>Codex</b>, <b>dots</b>, <b>Token</b>, <b>Excel</b>, <b>ความปลอดภัย</b></p>`;
    } else {
      const top = res[0].e;
      html = `<div style="font-size:13px;color:var(--muted);margin-bottom:6px">จากคู่มือ · บทที่ ${top.ch.num || 'สรุป'} › ${esc(top.title)}</div><div class="md">${renderMD(top.md, 'a' + Date.now())}</div>`;
      html += `<div style="margin-top:10px">${res.map(r => `<a class="src" href="#/ch/${r.e.ch.id}">${icon('book')}${r.e.ch.num ? r.e.ch.num + '. ' : ''}${esc(r.e.title)}</a>`).join('')}</div>`;
    }
    const fups = [];
    if (intent) fups.push(`<button data-go="#/tool/${intent[1]}">✨ เปิดเครื่องมือ: ${W[intent[1]].title}</button>`);
    const sib = res.length ? index.filter(e => e.ch === res[0].e.ch && e.sub && e !== res[0].e).slice(0, 3) : [];
    sib.forEach(e => fups.push(`<button data-ask="${esc(e.title)}">${esc(e.title)}</button>`));
    html += fups.length ? `<div class="followups">${fups.join('')}</div>` : '';
    const msg = document.createElement('div');
    msg.className = 'msg bot';
    msg.innerHTML = `<div class="av"><img src="${LOGO}" alt=""></div><div class="bubble">${html}</div>`;
    box.appendChild(msg);
    chatLog.push(msg.outerHTML);
    // stream-in effect: reveal blocks one by one
    const blocks = $$('.bubble > *, .bubble .md > *', msg).filter(el => !el.classList.contains('md'));
    blocks.forEach(b => { b.style.opacity = 0; b.style.transform = 'translateY(6px)'; });
    blocks.forEach((b, i) => setTimeout(() => {
      b.style.transition = 'opacity .35s, transform .35s'; b.style.opacity = 1; b.style.transform = 'none';
      if (b.classList.contains('reveal-flow')) b.classList.add('in');
      view.scrollTo({ top: view.scrollHeight, behavior: 'smooth' });
    }, i * 110));
  }
  let pendingQ = null;

  // ---------- router ----------
  function route() {
    const parts = (location.hash || '#/home').split('/');
    const [, a, b] = parts;
    app.classList.remove('drawer');
    if (a === 'ch') chapter(b);
    else if (a === 'tool') tool(b);
    else if (a === 'chat') { chatPage(); if (pendingQ) { const q = pendingQ; pendingQ = null; ask(q); } }
    else home();
    if (a !== 'ch') currentCh = null;
    buildNav();
    $('#read-progress').style.width = 0;
    view.focus({ preventScroll: true });
  }

  // ---------- global events ----------
  const app = $('.app');
  function onScroll() {
    const max = view.scrollHeight - view.clientHeight;
    const p = max > 0 ? view.scrollTop / max : 1;
    $('#read-progress').style.width = currentCh ? p * 100 + '%' : 0;
    if (currentCh && p > .9) markRead(currentCh);
  }
  view.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('click', e => {
    const t = e.target;
    const askEl = t.closest('[data-ask]');
    if (askEl) { e.preventDefault(); ask(askEl.dataset.ask); return; }
    const go = t.closest('[data-go]');
    if (go) { location.hash = go.dataset.go; return; }
    const sc = t.closest('[data-scroll]');
    if (sc) { e.preventDefault(); document.getElementById(sc.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const flip = t.closest('[data-flip]');
    if (flip && !t.closest('a')) { flip.classList.toggle('on'); }
    const cp = t.closest('[data-copy]');
    if (cp) {
      const pre = cp.closest('.code').querySelector('pre');
      copyText(pre.textContent).then(() => { cp.classList.add('ok'); cp.querySelector('span').textContent = 'คัดลอกแล้ว'; toast('คัดลอก Prompt แล้ว'); setTimeout(() => { cp.classList.remove('ok'); cp.querySelector('span').textContent = 'คัดลอก'; }, 1600); });
    }
    const btn = t.closest('.btn, .send-btn');
    if (btn) {
      const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height), sp = document.createElement('span');
      sp.className = 'ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      btn.appendChild(sp); setTimeout(() => sp.remove(), 600);
    }
    if (!t.closest('.tools-pop') && !t.closest('#composer-plus')) $('.tools-pop')?.remove();
  });
  document.addEventListener('keydown', e => {
    const flip = e.target.closest?.('[data-flip]');
    if (flip && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flip.classList.toggle('on'); }
  });

  function copyText(s) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(s).catch(() => fallback());
    return Promise.resolve(fallback());
    function fallback() { const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* ignore */ } ta.remove(); }
  }
  let toastT;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200); }

  // composer
  const qEl = $('#q'), sendBtn = $('.send-btn');
  const fit = () => { qEl.style.height = 'auto'; qEl.style.height = Math.min(qEl.scrollHeight, 180) + 'px'; sendBtn.disabled = !qEl.value.trim(); };
  qEl.addEventListener('input', fit);
  qEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#composer').requestSubmit(); } });
  $('#composer').addEventListener('submit', e => { e.preventDefault(); const q = qEl.value; qEl.value = ''; fit(); ask(q); });
  fit();
  const setPh = () => { qEl.placeholder = innerWidth < 760 ? 'ถามเกี่ยวกับ ChatGPT, Codex, Agent...' : 'ถามอะไรก็ได้เกี่ยวกับ ChatGPT, Work, Codex, Agent...'; };
  setPh(); addEventListener('resize', setPh);
  $('#composer-plus').onclick = () => {
    if ($('.tools-pop')) return $('.tools-pop').remove();
    $('.composer-inner').insertAdjacentHTML('beforeend', `<div class="tools-pop">${TOOLS.slice(0, 7).map(t => `<a href="#/tool/${t.id}">${icon(t.i)}${t.t}</a>`).join('')}</div>`);
  };
  $('[data-new-chat]').addEventListener('click', () => { chatLog = []; if (location.hash === '#/chat') chatPage(); });

  // sidebar / theme
  if (store.get('collapsed', false)) app.classList.add('collapsed');
  $('#sb-toggle').onclick = () => { app.classList.toggle('collapsed'); store.set('collapsed', app.classList.contains('collapsed')); };
  $('#menu-btn').onclick = () => app.classList.add('drawer');
  $('#scrim').onclick = () => app.classList.remove('drawer');
  const setTheme = t => {
    document.documentElement.dataset.theme = t;
    $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', t === 'dark' ? '#0d0d0d' : '#ffffff'));
  };
  setTheme(store.get('theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  $('#theme-btn').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(t); store.set('theme', t); };

  // confetti
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti'), ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#10a37f', '#19c37d', '#1ad1b0', '#ffffff', '#0d0d0d', '#f5a524'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4, s: Math.random() * 6 + 4, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .3 }));
    let f = 0;
    (function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++f < 160) requestAnimationFrame(draw); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  // PWA: install + offline
  let deferred;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#install-btn').hidden = false; });
  $('#install-btn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#install-btn').hidden = true; };
  addEventListener('appinstalled', () => toast('ติดตั้งแอปเรียบร้อย'));
  const net = () => { $('#offline-badge').hidden = navigator.onLine; };
  addEventListener('online', net); addEventListener('offline', net); net();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ }));
  }

  addEventListener('hashchange', route);
  updateProgress();
  route();
})();
