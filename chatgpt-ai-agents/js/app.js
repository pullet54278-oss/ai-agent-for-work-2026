/* Chat GPT AI Agents for Work — app shell, router, pages, Prompt Lab */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gaw:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gaw:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const LESSONS = window.LESSONS, TOOLS = window.TOOLS, CATS = window.TOOL_CATS;
  const view = $('#view');
  let cleanup = [];

  // ---------- progress ----------
  const done = new Set(store.get('done', []));
  const visitedTools = new Set(store.get('tools', []));
  function updateProgress() {
    const total = LESSONS.length + TOOLS.length;
    const p = Math.round((done.size + visitedTools.size) / total * 100);
    $('#pc-text').textContent = p + '%';
    $('#pc-fg').style.strokeDashoffset = 94.25 * (1 - p / 100);
  }
  function completeLesson(id) {
    if (done.has(id)) return;
    done.add(id); store.set('done', [...done]); updateProgress();
    confetti(); sfx('win');
    const l = LESSONS.find(x => x.id === id);
    toast(`🏅 ได้รับเหรียญ “${l.title}”`);
  }

  // ---------- small UI helpers ----------
  let toastT;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
  let soundOn = store.get('sound', true), actx;
  function sfx(kind) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { tap: [880], ok: [660, 990], win: [523, 659, 784, 1046], bad: [220] }[kind] || [660];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * .09;
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.06, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + .3);
      });
    } catch { /* audio unavailable */ }
  }
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti'), ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#10a37f', '#19c37d', '#1ad1b0', '#ffffff', '#f5a524', '#a855f7'];
    const ps = Array.from({ length: 150 }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 17, vy: Math.random() * -15 - 4, s: Math.random() * 6 + 4, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .3 }));
    let f = 0;
    (function d() { ctx.clearRect(0, 0, cv.width, cv.height); ps.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }); if (++f < 170) requestAnimationFrame(d); else ctx.clearRect(0, 0, cv.width, cv.height); })();
  }
  function copyText(s) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(s).catch(fb);
    return Promise.resolve(fb());
    function fb() { const t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch { /* ignore */ } t.remove(); }
  }
  let io;
  function enhance(root) {
    io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    $$('.reveal', root).forEach(el => io.observe(el));
    $$('.tilt', root).forEach(el => {
      el.addEventListener('pointermove', ev => {
        const r = el.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(700px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-3px)`;
        el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('[data-count]', root).forEach(el => {
      const to = +el.dataset.count; let n = 0; const st = performance.now();
      (function f(t) { n = Math.min(1, (t - st) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - n, 3))); if (n < 1) requestAnimationFrame(f); })(st);
    });
  }
  function mount(html, title) {
    cleanup.forEach(f => f()); cleanup = [];
    view.innerHTML = `<div class="wrap page-enter">${html}</div>`;
    window.scrollTo({ top: 0 });
    document.title = title ? `${title} · Chat GPT AI Agents for Work` : 'Chat GPT AI Agents for Work';
    enhance(view);
  }

  // ---------- HOME ----------
  function home() {
    const last = store.get('last', null);
    const lastL = last && LESSONS.find(l => l.id === last);
    mount(`
      <section class="hero">
        <div class="hero-logo"><img src="icons/logo.svg" alt="ChatGPT logo"></div>
        <p class="eyebrow">Interactive Course · 2026</p>
        <h1 class="hero-title"><span class="grad-text">Chat GPT AI Agents</span><br>for Work</h1>
        <p class="hero-sub">เรียนสร้าง <b>Agent ที่ทำงานเองจนส่งงาน</b> ด้วยหน้าจอจำลองที่กดได้จริง และ <b>Prompt Lab</b> ในทุกเครื่องมือ</p>
        <div class="hero-cta">
          ${lastL ? `<a class="btn primary big" href="#/lesson/${lastL.id}">▶ เรียนต่อ: ${esc(lastL.title)}</a>` : `<a class="btn primary big" href="#/lesson/agent">▶ เริ่มบทเรียนแรก</a>`}
          <a class="btn big" href="#/tools">🧰 ดูเครื่องมือทั้งหมด</a>
        </div>
        <div class="stats">
          <div><b data-count="${LESSONS.length}">0</b><span>บทเรียน</span></div>
          <div><b data-count="${TOOLS.length}">0</b><span>เครื่องมือ</span></div>
          <div><b data-count="${LESSONS.length + TOOLS.length}">0</b><span>Prompt Lab</span></div>
        </div>
      </section>

      <section class="pipeline reveal">
        <h2 class="section-title">Agent ทำงานอย่างไร</h2>
        <div class="pipe">${LESSONS[0].stations.map((s, i) => `<a class="pipe-step" style="--i:${i}" href="#/lesson/agent" data-st="${s.key}"><span class="pipe-ic">${s.icon}</span><span>${s.title.split(':')[0]}</span></a>`).join('<i class="pipe-line"></i>')}</div>
      </section>

      <h2 class="section-title reveal">เส้นทางการเรียน</h2>
      <div class="lesson-grid">${LESSONS.map(lessonCard).join('')}</div>

      <h2 class="section-title reveal">เครื่องมือยอดนิยม</h2>
      <div class="tool-grid">${['computer', 'scheduled', 'chrome', 'skills', 'codexhome', 'approvals', 'projects', 'images'].map(id => toolCard(TOOLS.find(t => t.id === id))).join('')}</div>
      <p class="center"><a class="btn" href="#/tools">ดูทั้งหมด ${TOOLS.length} เครื่องมือ →</a></p>

      <p class="disclaimer">แอปการเรียนรู้ ไม่ใช่ผลิตภัณฑ์ทางการของ OpenAI · หน้าจอในบทเรียนเป็นหน้าจอจำลองด้วยข้อมูลตัวอย่าง · ชื่อเมนู โมเดล และสิทธิ์ใช้งานอาจต่างตามแผนและช่วง rollout</p>
    `);
  }
  function lessonCard(l) {
    return `<a class="lesson-card tilt reveal" href="#/lesson/${l.id}" style="--c:${l.color}">
      <span class="lc-n">บทที่ ${l.n}</span><span class="lc-ic">${l.icon}</span>
      <b>${esc(l.title)}</b><span class="lc-sub">${esc(l.sub)}</span>
      <span class="lc-meta">⏱ ${l.minutes} นาที · ${l.stations.reduce((a, s) => a + s.steps.length, 0)} ขั้นเดโม ${done.has(l.id) ? '<span class="lc-done">🏅 จบแล้ว</span>' : ''}</span></a>`;
  }
  function toolCard(t) {
    const c = CATS[t.cat];
    return `<a class="tool-card tilt reveal" href="#/tool/${t.id}" style="--c:${c.c}"><span class="tc-e">${t.e}</span><span><b>${esc(t.t)}</b><small>${esc(t.d)}</small></span>${visitedTools.has(t.id) ? '<i class="tc-v">✓</i>' : ''}</a>`;
  }

  // ---------- LESSON LIST ----------
  function lessons() {
    mount(`<div class="page-head"><span class="kicker">🎓 บทเรียน</span><h1>เส้นทางสร้าง AI Agent</h1><p class="muted">เรียงจากพื้นฐานถึงสร้างแอปจริง ทุกบทมีเดโมหน้าจอจำลอง Prompt Lab แบบทดสอบ และเช็กลิสต์</p></div>
      <div class="lesson-grid">${LESSONS.map(lessonCard).join('')}</div>
      <a class="appendix-link reveal" href="#/appendix">📖 ภาคผนวก: ความรู้พื้นฐาน ChatGPT, Prompt, โมเดล, ความปลอดภัย (20 บท) →</a>`, 'บทเรียน');
  }

  // ---------- LESSON ----------
  function lesson(id) {
    const l = LESSONS.find(x => x.id === id); if (!l) return home();
    store.set('last', id);
    const pos = LESSONS.indexOf(l), next = LESSONS[pos + 1], prev = LESSONS[pos - 1];
    const multi = l.stations.length > 1;
    mount(`
      <div class="lesson-hero" style="--c:${l.color}">
        <span class="kicker">บทที่ ${l.n} · ⏱ ${l.minutes} นาที</span>
        <h1><span class="lh-ic">${l.icon}</span> ${esc(l.title)}</h1>
        <p class="lead">${l.intro}</p>
        ${multi ? `<div class="station-pills">${l.stations.map((s, i) => `<button data-jump="st-${i}"><span>${s.icon}</span>${i + 1}. ${s.title.split(':')[0]}</button>`).join('')}</div>` : ''}
      </div>
      <div class="stations ${multi ? 'multi' : ''}">
        ${multi ? '<div class="track"><i id="track-fill"></i></div>' : ''}
        ${l.stations.map((s, i) => `
          <section class="station reveal" id="st-${i}">
            ${multi ? `<div class="st-dot">${s.icon}</div>` : ''}
            <div class="st-text">
              ${multi ? `<span class="st-n">สถานีที่ ${i + 1} / ${l.stations.length}</span>` : ''}
              <h2>${s.title}</h2>
              <p>${s.what}</p>
              <ul class="points">${s.points.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
            <div class="st-demo" data-demo="${i}"></div>
          </section>`).join('')}
      </div>
      <section class="reveal" id="lab"><div class="lab-host" data-lab="lesson"></div></section>
      <section class="two-col reveal">
        <div class="card"><h3>📝 แบบทดสอบ</h3><div id="quiz"></div></div>
        <div class="card"><h3>✅ เช็กลิสต์ก่อนใช้งานจริง</h3><div id="check"></div></div>
      </section>
      <div class="finish reveal"><button class="btn primary big" id="finish-btn">${done.has(l.id) ? '🏅 จบบทนี้แล้ว' : '🏁 ทำเครื่องหมายว่าเรียนจบ'}</button></div>
      <nav class="pn">${prev ? `<a href="#/lesson/${prev.id}"><small>← บทก่อนหน้า</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="#/lesson/${next.id}"><small>บทถัดไป →</small>${esc(next.title)}</a>` : `<a class="next" href="#/tools"><small>ต่อไป →</small>คลังเครื่องมือทั้งหมด</a>`}</nav>
    `, l.title);
    const demos = l.stations.map((s, i) => new window.Demo($(`[data-demo="${i}"]`), s.steps, {
      onChoice: c => sfx(c.level === 'good' ? 'ok' : c.level === 'bad' ? 'bad' : 'tap'),
      onDone: () => sfx('ok')
    }));
    cleanup.push(() => demos.forEach(d => d.destroy()));
    promptLab($('[data-lab="lesson"]'), l.lab, 'lab:' + l.id);
    quiz($('#quiz'), l.quiz);
    checklist($('#check'), l.check, 'chk:' + l.id);
    $('#finish-btn').onclick = () => { completeLesson(l.id); $('#finish-btn').textContent = '🏅 จบบทนี้แล้ว'; };
    $$('[data-jump]').forEach(b => b.onclick = () => document.getElementById(b.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' }));
    if (multi) {
      const fill = $('#track-fill'), box = $('.stations');
      const on = () => {
        const r = box.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .55 - r.top) / r.height));
        fill.style.height = p * 100 + '%';
        $$('.station').forEach(st => { const sr = st.getBoundingClientRect(); st.classList.toggle('active', sr.top < innerHeight * .55 && sr.bottom > innerHeight * .3); });
      };
      addEventListener('scroll', on, { passive: true }); on();
      cleanup.push(() => removeEventListener('scroll', on));
    }
  }

  // ---------- Prompt Lab ----------
  function promptLab(host, cfg, key) {
    const saved = store.get(key, null);
    const v = {}; cfg.fields.forEach(f => { v[f.k] = saved && saved[f.k] != null ? saved[f.k] : (f.def ?? ''); });
    host.innerHTML = `<div class="lab">
      <div class="lab-head"><span class="kicker">🧪 Prompt Lab</span><h2>${esc(cfg.title)}</h2><p class="muted">กรอกช่องด้านซ้าย Prompt จะประกอบขึ้นเองแบบเรียลไทม์ กด “จำลองการทำงาน” เพื่อดูว่า Agent จะทำอะไร</p></div>
      <div class="lab-grid">
        <div class="lab-fields">${cfg.fields.map(f => {
          if (f.type === 'select') return `<label>${f.label}<select data-k="${f.k}">${f.options.map(o => `<option${o === v[f.k] ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
          if (f.type === 'multi') return `<label>${f.label}<div class="chips" data-k="${f.k}">${f.options.map(o => `<button type="button" class="chip${(v[f.k] || []).includes(o) ? ' on' : ''}" data-o="${esc(o)}">${o}</button>`).join('')}</div></label>`;
          return `<label>${f.label}<textarea rows="${f.rows || 2}" data-k="${f.k}" placeholder="${esc(f.ph || '')}">${esc(v[f.k])}</textarea></label>`;
        }).join('')}
          <button class="btn ghost small" data-reset>↺ คืนค่าตัวอย่าง</button>
        </div>
        <div class="lab-out">
          <div class="meter"><span>ความพร้อมของคำสั่ง</span><div class="mbar"><i></i></div><b class="mval">0%</b></div>
          <div class="risks"></div>
          <div class="code"><div class="code-head"><span>Prompt พร้อมใช้</span><span><button class="copy" data-copy>📋 คัดลอก</button><a class="copy" target="_blank" rel="noopener" data-open>↗ เปิดใน ChatGPT</a></span></div><pre class="lab-pre"></pre></div>
          <button class="btn primary" data-sim>▶ จำลองการทำงาน</button>
          <div class="sim"></div>
        </div>
      </div></div>`;
    const pre = $('.lab-pre', host);
    const draw = () => {
      const txt = cfg.build(v);
      pre.textContent = txt;
      const filled = cfg.fields.filter(f => Array.isArray(v[f.k]) ? v[f.k].length : String(v[f.k] || '').trim()).length;
      const risks = cfg.risk ? cfg.risk(v) : [];
      const pct = Math.round(filled / cfg.fields.length * 100);
      $('.mbar i', host).style.width = pct + '%';
      $('.mbar i', host).classList.toggle('warn', risks.length > 0);
      $('.mval', host).textContent = pct + '%';
      $('.risks', host).innerHTML = risks.map(r => `<div class="risk">⚠️ ${esc(r)}</div>`).join('');
      $('[data-open]', host).href = 'https://chatgpt.com/?q=' + encodeURIComponent(txt);
      store.set(key, v);
    };
    host.addEventListener('input', e => { const k = e.target.dataset.k; if (k) { v[k] = e.target.value; draw(); } });
    host.addEventListener('change', e => { const k = e.target.dataset.k; if (k) { v[k] = e.target.value; draw(); } });
    host.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (chip) { const k = chip.parentElement.dataset.k, o = chip.dataset.o; v[k] = (v[k] || []).includes(o) ? v[k].filter(x => x !== o) : [...(v[k] || []), o]; chip.classList.toggle('on'); sfx('tap'); draw(); return; }
      if (e.target.closest('[data-reset]')) { cfg.fields.forEach(f => { v[f.k] = Array.isArray(f.def) ? [...f.def] : (f.def ?? ''); }); store.set(key, null); promptLab(host, cfg, key); return; }
      if (e.target.closest('[data-copy]')) { copyText(pre.textContent).then(() => { toast('📋 คัดลอก Prompt แล้ว'); sfx('ok'); }); return; }
      if (e.target.closest('[data-open]')) { copyText(pre.textContent); toast('คัดลอกแล้ว — ถ้าช่องพิมพ์ว่าง ให้วาง (Ctrl+V)'); return; }
      if (e.target.closest('[data-sim]')) runSim();
    });
    let simTok = 0;
    async function runSim() {
      const tok = ++simTok, box = $('.sim', host);
      const steps = cfg.sim ? cfg.sim(v) : [];
      box.innerHTML = `<div class="sim-win"><div class="sim-bar"><i></i><i></i><i></i><span>Agent กำลังทำงาน…</span></div><div class="sim-list"></div></div>`;
      const list = $('.sim-list', box);
      for (const s of steps) {
        if (tok !== simTok) return;
        list.insertAdjacentHTML('beforeend', `<div class="sim-step run"><i class="spin"></i><span>${esc(s)}</span></div>`);
        await new Promise(r => setTimeout(r, 520));
        const last = list.lastElementChild; last.classList.remove('run'); last.querySelector('i').outerHTML = '<i class="ok">✓</i>';
      }
      if (tok !== simTok) return;
      list.insertAdjacentHTML('beforeend', `<div class="sim-done">✅ Turn complete — ChatGPT finished a turn.</div>`);
      $('.sim-bar span', box).textContent = 'เสร็จแล้ว';
      sfx('ok');
    }
    draw();
  }

  function toolLab(t) {
    return {
      title: `ทดลองสั่งงาน: ${t.t}`,
      fields: [
        { k: 'task', label: 'คำสั่งหลัก (แก้ข้อความใน [ ] ให้เป็นงานของคุณ)', def: t.prompt, rows: 4 },
        { k: 'ctx', label: 'ข้อมูล / บริบทเพิ่มเติม', def: '', ph: 'เช่น ไฟล์ที่แนบ ผู้ใช้ผลงาน กำหนดส่ง' },
        { k: 'deny', label: 'ข้อห้าม', def: t.warn ? 'ขออนุญาตก่อนทำสิ่งที่มีผลภายนอก ห้ามลบข้อมูล' : '', ph: 'สิ่งที่ห้าม Agent ทำ' },
        { k: 'out', label: 'รูปแบบผลลัพธ์', type: 'select', options: ['ตอบในแชต', 'ตาราง', 'ไฟล์ที่แก้ไขได้', 'สรุป + Action items'], def: 'ตอบในแชต' }
      ],
      build: v => `${v.task}${v.ctx ? `\n\nข้อมูลเพิ่มเติม: ${v.ctx}` : ''}\nรูปแบบผลลัพธ์: ${v.out}${v.deny ? `\nข้อห้าม: ${v.deny}` : ''}\nถ้าข้อมูลไม่พอ ให้ถามก่อนหรือระบุ Need Data`,
      sim: v => [`${t.e} เปิด ${t.t}`, ...t.steps.slice(0, 3).map(s => '• ' + s.replace(/<[^>]+>/g, '').slice(0, 60)), `📦 ส่งผลลัพธ์: ${v.out}`],
      risk: v => { const r = []; if (/\[[^\]]+\]/.test(v.task)) r.push('ยังมีช่อง [ ... ] ที่ต้องแทนด้วยงานจริง'); if (t.warn && !v.deny) r.push('เครื่องมือนี้มีความเสี่ยง — ควรระบุข้อห้าม'); return r; }
    };
  }

  // ---------- quiz & checklist ----------
  function quiz(host, qs) {
    let i = 0, score = 0;
    const draw = () => {
      if (i >= qs.length) {
        host.innerHTML = `<div class="q-end"><b class="grad-text">${score}/${qs.length}</b><p>${score === qs.length ? 'ยอดเยี่ยม! เข้าใจครบ' : 'ลองทบทวนเดโมอีกครั้ง'}</p><button class="btn small" data-again>↻ ทำใหม่</button></div>`;
        $('[data-again]', host).onclick = () => { i = 0; score = 0; draw(); };
        if (score === qs.length) sfx('win');
        return;
      }
      const [q, opts, ans] = qs[i];
      host.innerHTML = `<div class="q-n">ข้อ ${i + 1}/${qs.length}</div><div class="q-q">${q}</div>${opts.map((o, j) => `<button class="q-opt" data-o="${j}">${o}</button>`).join('')}`;
      $$('[data-o]', host).forEach(b => b.onclick = () => {
        const ok = +b.dataset.o === ans; if (ok) score++;
        sfx(ok ? 'ok' : 'bad');
        $$('[data-o]', host).forEach(x => { x.disabled = true; if (+x.dataset.o === ans) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        setTimeout(() => { i++; draw(); }, 1100);
      });
    };
    draw();
  }
  function checklist(host, items, key) {
    let st = store.get(key, []);
    const draw = () => {
      host.innerHTML = `<div class="ck-bar"><i style="width:${st.length / items.length * 100}%"></i></div>` + items.map((t, i) => `<button class="ck${st.includes(i) ? ' on' : ''}" data-i="${i}"><span class="ck-box">✓</span>${t}</button>`).join('');
      $$('[data-i]', host).forEach(b => b.onclick = () => { const k = +b.dataset.i; st = st.includes(k) ? st.filter(x => x !== k) : [...st, k]; store.set(key, st); sfx('tap'); draw(); if (st.length === items.length) { toast('✅ พร้อมใช้งานจริง'); sfx('win'); } });
    };
    draw();
  }

  // ---------- TOOLS ----------
  function tools(q = '', cat = 'all') {
    mount(`<div class="page-head"><span class="kicker">🧰 คลังเครื่องมือ</span><h1>เครื่องมือทั้งหมด ${TOOLS.length} รายการ</h1><p class="muted">แตะการ์ดเพื่อดูขั้นตอนใช้งานแบบเคลื่อนไหว ข้อควรระวัง และ Prompt Lab</p></div>
      <div class="filters"><div class="search"><span>🔎</span><input id="tq" placeholder="ค้นหา เช่น Scheduled, Gmail, PWA, สิทธิ์…" value="${esc(q)}"></div>
      <div class="cat-chips"><button class="chip${cat === 'all' ? ' on' : ''}" data-cat="all">ทั้งหมด</button>${Object.entries(CATS).map(([k, c]) => `<button class="chip${cat === k ? ' on' : ''}" data-cat="${k}" style="--c:${c.c}">${c.t}</button>`).join('')}</div></div>
      <div id="tool-list"></div>`, 'เครื่องมือ');
    let cur = cat;
    const draw = () => {
      const k = $('#tq').value.trim().toLowerCase();
      const list = TOOLS.filter(t => (cur === 'all' || t.cat === cur) && (!k || (t.t + t.d + t.steps.join(' ')).toLowerCase().includes(k)));
      const groups = Object.keys(CATS).filter(c => list.some(t => t.cat === c));
      $('#tool-list').innerHTML = groups.map(g => `<h2 class="section-title" style="--c:${CATS[g].c}">${CATS[g].t}</h2><div class="tool-grid">${list.filter(t => t.cat === g).map(toolCard).join('')}</div>`).join('') || '<p class="muted center">ไม่พบเครื่องมือที่ตรงกับคำค้น</p>';
      enhance($('#tool-list'));
      $$('#tool-list .reveal').forEach(el => el.classList.add('in'));
    };
    $('#tq').oninput = draw;
    $$('[data-cat]').forEach(b => b.onclick = () => { cur = b.dataset.cat; $$('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    draw();
  }

  function tool(id) {
    const t = TOOLS.find(x => x.id === id); if (!t) return tools();
    if (!visitedTools.has(id)) { visitedTools.add(id); store.set('tools', [...visitedTools]); updateProgress(); }
    const c = CATS[t.cat], i = TOOLS.indexOf(t), prev = TOOLS[i - 1], next = TOOLS[i + 1];
    const l = t.lesson && LESSONS.find(x => x.id === t.lesson);
    mount(`
      <a class="back" href="#/tools">← คลังเครื่องมือ</a>
      <div class="tool-hero" style="--c:${c.c}"><span class="th-e">${t.e}</span><div><span class="kicker" style="color:${c.c}">${c.t}</span><h1>${esc(t.t)}</h1><p class="lead">${esc(t.d)}</p></div></div>
      <div class="tool-body">
        <div class="stepper" id="stepper">${t.steps.map((s, k) => `<div class="sp" style="--i:${k}"><span class="sp-n">${k + 1}</span><span class="sp-t">${esc(s)}</span></div>`).join('')}
          <button class="btn small" id="sp-play">▶ เล่นขั้นตอน</button></div>
        <aside class="tool-side">
          ${t.tip ? `<div class="note tip">💡 <b>เคล็ดลับ</b><br>${esc(t.tip)}</div>` : ''}
          ${t.warn ? `<div class="note warn">⚠️ <b>ข้อควรระวัง</b><br>${esc(t.warn)}</div>` : ''}
          ${l ? `<a class="note link" href="#/lesson/${l.id}">${l.icon} <b>ดูเดโมเต็มในบทที่ ${l.n}</b><br>${esc(l.title)} →</a>` : ''}
        </aside>
      </div>
      <section class="lab-host" data-lab="tool"></section>
      <nav class="pn">${prev ? `<a href="#/tool/${prev.id}"><small>← ก่อนหน้า</small>${prev.e} ${esc(prev.t)}</a>` : '<span></span>'}${next ? `<a class="next" href="#/tool/${next.id}"><small>ถัดไป →</small>${next.e} ${esc(next.t)}</a>` : ''}</nav>`, t.t);
    promptLab($('[data-lab="tool"]'), toolLab(t), 'tlab:' + t.id);
    const sps = $$('.sp'); let k = -1, timer;
    const go = n => { k = n; sps.forEach((s, j) => { s.classList.toggle('on', j === k); s.classList.toggle('past', j < k); }); };
    const play = () => { clearInterval(timer); go(0); timer = setInterval(() => { if (k >= sps.length - 1) { clearInterval(timer); $('#sp-play').textContent = '↻ เล่นอีกครั้ง'; return; } go(k + 1); sfx('tap'); }, 1500); $('#sp-play').textContent = '⏸ กำลังเล่น…'; };
    $('#sp-play').onclick = play;
    sps.forEach((s, j) => s.onclick = () => { clearInterval(timer); go(j); });
    setTimeout(play, 500);
    cleanup.push(() => clearInterval(timer));
  }

  // ---------- APPENDIX (original manual) ----------
  const RAW = (window.MANUAL_MD || '').replace(/^---[\s\S]*?\n---\n/, '');
  const chapters = [];
  { let cur = null; for (const line of RAW.split('\n')) { const m = line.match(/^## (.+)$/); if (m) { const nm = m[1].match(/^(\d+)\.\s+(.*)$/); cur = nm ? { id: nm[1], title: nm[2], lines: [] } : (m[1] === 'สรุปหนึ่งหน้า' ? { id: 'summary', title: m[1], lines: [] } : null); if (cur) chapters.push(cur); continue; } if (cur) cur.lines.push(line); } chapters.forEach(c => { c.body = c.lines.join('\n').replace(/\n---\s*$/, ''); }); }
  function inline(s) {
    let t = esc(s); const codes = [];
    t = t.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\[([^\]]+)\]\(#(\d+)-[^)]*\)/g, '<a href="#/appendix/$2">$1</a>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
  }
  function md(src) {
    const L = src.split('\n'); let h = '', i = 0, p = [];
    const fp = () => { if (p.length) { h += `<p>${inline(p.join(' '))}</p>`; p = []; } };
    while (i < L.length) {
      const ln = L[i]; let m;
      if (/^```/.test(ln)) { fp(); const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); i++; h += `<div class="code"><div class="code-head"><span>prompt</span><button class="copy" data-copypre>📋 คัดลอก</button></div><pre>${esc(b.join('\n'))}</pre></div>`; continue; }
      if ((m = ln.match(/^###+ (.+)/))) { fp(); h += `<h3>${inline(m[1])}</h3>`; i++; continue; }
      if (/^>/.test(ln)) { fp(); const b = []; while (i < L.length && /^>/.test(L[i])) b.push(L[i++].replace(/^>\s?/, '')); h += `<blockquote>${inline(b.join(' '))}</blockquote>`; continue; }
      if (/^\|/.test(ln)) { fp(); const r = []; while (i < L.length && /^\|/.test(L[i])) r.push(L[i++]); const cells = x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()); h += `<div class="tbl"><table><thead><tr>${cells(r[0]).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${r.slice(2).map(x => `<tr>${cells(x).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; continue; }
      if (/^([-*]|\d+\.) /.test(ln)) { fp(); const ol = /^\d/.test(ln), b = []; while (i < L.length && /^([-*]|\d+\.) /.test(L[i])) b.push(L[i++].replace(/^([-*]|\d+\.) (\[[ x]\] )?/, '')); h += `<${ol ? 'ol' : 'ul'}>${b.map(x => `<li>${inline(x)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`; continue; }
      if (/^---\s*$/.test(ln) || !ln.trim()) { fp(); i++; continue; }
      p.push(ln.trim()); i++;
    }
    fp(); return h;
  }
  function appendix(id) {
    if (id) {
      const c = chapters.find(x => x.id === id); if (!c) return appendix();
      const k = chapters.indexOf(c), prev = chapters[k - 1], next = chapters[k + 1];
      mount(`<a class="back" href="#/appendix">← ภาคผนวก</a><div class="page-head"><span class="kicker">📖 ภาคผนวก ${c.id === 'summary' ? '' : 'บทที่ ' + c.id}</span><h1>${esc(c.title)}</h1></div><article class="md">${md(c.body)}</article>
        <nav class="pn">${prev ? `<a href="#/appendix/${prev.id}"><small>←</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="#/appendix/${next.id}"><small>→</small>${esc(next.title)}</a>` : ''}</nav>`, c.title);
      return;
    }
    mount(`<div class="page-head"><span class="kicker">📖 ภาคผนวก</span><h1>ความรู้พื้นฐาน ChatGPT</h1><p class="muted">เนื้อหาคู่มือเดิม: ภาพรวม Chat/Work/Codex/API, Prompting, โมเดลและ Effort, Token, แพ็กเกจ, ความปลอดภัย และ Glossary</p></div>
      <div class="app-list">${chapters.map(c => `<a class="app-item reveal" href="#/appendix/${c.id}"><span>${c.id === 'summary' ? '★' : c.id}</span>${esc(c.title)}</a>`).join('')}</div>`, 'ภาคผนวก');
  }

  // ---------- router ----------
  function route() {
    const [, a, b] = (location.hash || '#/').split('/');
    const go = () => {
      if (a === 'lessons') lessons();
      else if (a === 'lesson') lesson(b);
      else if (a === 'tools') tools();
      else if (a === 'tool') tool(b);
      else if (a === 'appendix') appendix(b);
      else home();
      const nav = { lesson: 'lessons', tool: 'tools' }[a] || a || 'home';
      $$('[data-nav]').forEach(x => x.classList.toggle('active', x.dataset.nav === (nav === '' ? 'home' : nav)));
    };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(go); else go();
  }
  addEventListener('hashchange', route);
  addEventListener('scroll', () => { const m = document.documentElement.scrollHeight - innerHeight; $('#read-progress').style.width = (m > 0 ? scrollY / m * 100 : 0) + '%'; }, { passive: true });
  document.addEventListener('click', e => {
    const cp = e.target.closest('[data-copypre]');
    if (cp) copyText(cp.closest('.code').querySelector('pre').textContent).then(() => toast('📋 คัดลอกแล้ว'));
    const b = e.target.closest('.btn, .install-btn');
    if (b) { const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), sp = document.createElement('span'); sp.className = 'ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`; b.appendChild(sp); setTimeout(() => sp.remove(), 600); }
    if (e.target.closest('[data-close]') || e.target.classList.contains('modal-wrap')) $$('.modal-wrap').forEach(m => m.hidden = true);
  });

  // ---------- theme / sound ----------
  const setTheme = t => { document.documentElement.dataset.theme = t; $('#theme-btn').textContent = t === 'dark' ? '🌙' : '☀️'; $('meta[name="theme-color"]').content = t === 'dark' ? '#0d0d0d' : '#ffffff'; };
  setTheme(store.get('theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  $('#theme-btn').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(t); store.set('theme', t); };
  const setSound = () => { $('#sound-btn').textContent = soundOn ? '🔊' : '🔇'; };
  setSound(); $('#sound-btn').onclick = () => { soundOn = !soundOn; store.set('sound', soundOn); setSound(); sfx('tap'); };

  // ---------- install ----------
  let deferred = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ib = $('#install-btn');
  if (standalone()) ib.hidden = true;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; ib.classList.add('pulse'); });
  addEventListener('appinstalled', () => { ib.hidden = true; toast('✅ ติดตั้งแอปเรียบร้อย'); confetti(); });
  ib.onclick = async () => {
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice; deferred = null; if (r.outcome === 'accepted') ib.hidden = true; return; }
    $(isIOS ? '#ios-modal' : '#help-modal').hidden = false;
  };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ }));

  updateProgress();
  route();
})();
