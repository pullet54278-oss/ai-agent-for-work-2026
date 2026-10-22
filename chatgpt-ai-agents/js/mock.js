/* Mock ChatGPT UI primitives + interactive demo player.
   Every screen is redrawn in HTML with sample data (no real screenshots / personal data). */
(() => {
  'use strict';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const I = {
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lib: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-1 2.5 15-3.5 1z"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    map: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    up: '<path d="M12 19V5m0 0-6 6m6-6 6 6"/>',
    wave: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    tab: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/>',
    pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
    code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  const ic = (n, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${I[n] || ''}</svg>`;
  const h = id => id ? ` data-h="${id}"` : '';

  const MK = {
    ic,
    side({ active = '', projects = ['รายงานยอดขาย', 'คอร์สอบรม AI', 'ตรวจมาตรฐานฟาร์ม'], newProj = null, title = 'ChatGPT' } = {}) {
      const it = (id, icon, t) => `<div class="mk-si${active === id ? ' on' : ''}"${h(id)}>${ic(icon)}<span>${t}</span></div>`;
      return `<aside class="mk-side"><div class="mk-brand">${title} ${ic('down', 12)}</div>
        ${it('new', 'edit', 'New chat')}${it('sched', 'clock', 'Scheduled')}${it('lib', 'lib', 'Library')}${it('plug', 'at', 'Plugins')}${it('maps', 'map', 'Maps')}${it('explore', 'dots', 'Explore')}
        <div class="mk-sh">Projects <span class="mk-add"${h('proj-add')}>${ic('plus', 13)}</span></div>
        ${newProj ? `<div class="mk-si mk-new-row on">${ic('folder')}<span>${esc(newProj)}</span></div>` : ''}
        ${projects.map(p => `<div class="mk-si">${ic('folder')}<span>${esc(p)}</span></div>`).join('')}
        <div class="mk-user"${h('user')}><span class="mk-av">AW</span><span>ผู้เรียน<br><small>Plus</small></span></div></aside>`;
    },
    composer({ ph = 'Ask ChatGPT', text = '', model = 'Medium', id = 'composer', chips = '', send = 'wave' } = {}) {
      return `<div class="mk-comp"${h(id)}>${chips}<div class="mk-in" data-h="input"><span data-type>${esc(text)}</span>${text ? '' : `<em>${esc(ph)}</em>`}</div>
        <div class="mk-ctl"><span class="mk-ib"${h('plus')}>${ic('plus')}</span><span class="mk-gap"></span>
        <span class="mk-model"${h('model')}>${model} ${ic('down', 12)}</span><span class="mk-ib">${ic('mic')}</span>
        <span class="mk-send ${send === 'stop' ? 'stop' : ''}"${h('send')}>${ic(send === 'up' ? 'up' : send === 'stop' ? 'stop' : 'wave')}</span></div></div>`;
    },
    toggle: (on, id) => `<span class="mk-tg${on ? ' on' : ''}"${h(id)}><i></i></span>`,
    select: (v, id) => `<span class="mk-sel"${h(id)}>${v} ${ic('down', 12)}</span>`,
    btn: (t, id, cls = '') => `<span class="mk-btn ${cls}"${h(id)}>${t}</span>`,
    row: (label, desc, ctl, id) => `<div class="mk-row"${h(id)}><div><b>${label}</b>${desc ? `<small>${desc}</small>` : ''}</div>${ctl}</div>`,
    menu: (items, style = '') => `<div class="mk-menu" style="${style}">${items.map(x => x === '-' ? '<hr>' : `<div class="mk-mi${x.on ? ' on' : ''}${x.warn ? ' warn' : ''}"${h(x.id)}>${x.icon ? ic(x.icon) : ''}<span><b>${x.t}</b>${x.d ? `<small>${x.d}</small>` : ''}</span>${x.check ? ic('check', 14) : ''}</div>`).join('')}</div>`,
    modal: (title, inner, style = '') => `<div class="mk-scrim"></div><div class="mk-modal" style="${style}"><div class="mk-mh"><b>${title}</b>${ic('x', 14)}</div>${inner}</div>`,
    settings(active, title, body) {
      const nav = ['General', 'Appearance', 'Notifications', 'Personalization', 'Plugins', 'Data controls', 'Cloud computer', 'Computer use', 'Usage'];
      return `<div class="mk-settings"><aside class="mk-snav"><div class="mk-si">← Back to app</div><div class="mk-sh">Personal</div>${nav.map(n => `<div class="mk-si${n === active ? ' on' : ''}"${h('nav-' + n.toLowerCase().replace(/ /g, '-'))}>${n}</div>`).join('')}</aside>
        <div class="mk-spage"><h3>${title}</h3>${body}</div></div>`;
    },
    win(body, { title = 'ChatGPT', tabs = '' } = {}) {
      return `<div class="mk-win"><div class="mk-bar"><i></i><i></i><i></i><span>${title}</span>${tabs}</div><div class="mk-body">${body}</div></div>`;
    },
    toggleCW: (mode = 'Chat') => `<div class="mk-cw"><span class="${mode === 'Chat' ? 'on' : ''}"${h('mode-chat')}>Chat</span><span class="${mode === 'Work' ? 'on' : ''}"${h('mode-work')}>Work</span></div>`,
    bubble: (t, who = 'user') => `<div class="mk-msg ${who}">${who === 'bot' ? '<span class="mk-bav"></span>' : ''}<div>${t}</div></div>`,
    approval: ({ icon = 'globe', app = 'Chrome', q, d }) => `<div class="mk-appr"><div class="mk-ah">${ic(icon)} ${app}</div><b>${q}</b><small>${d}</small>
      <div class="mk-abtns"><span class="mk-btn"${h('always')}>Always allow</span><span class="mk-gap"></span><span class="mk-btn"${h('deny')}>Deny <kbd>Esc</kbd></span><span class="mk-btn dark"${h('once')}>Allow once <kbd>↵</kbd></span></div></div>`,
    steps: (list, done) => `<div class="mk-work">${list.map((s, i) => `<div class="mk-ws ${i < done ? 'ok' : i === done ? 'run' : ''}">${i < done ? ic('check', 14) : i === done ? '<i class="mk-spin"></i>' : '<i class="mk-dot"></i>'}<span>${s}</span></div>`).join('')}</div>`
  };
  window.MK = MK;

  // ---------- Demo player ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 300) : ms));

  class Demo {
    constructor(host, steps, opts = {}) {
      this.host = host; this.steps = steps; this.i = 0; this.mode = 'auto'; this.alive = true; this.token = 0; this.opts = opts;
      host.classList.add('demo');
      host.innerHTML = `
        <div class="demo-stage"><div class="demo-inner"><div class="demo-screen"></div><div class="demo-cursor"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l16 9-7 2-3 7z" fill="#0d0d0d" stroke="#fff" stroke-width="1.5"/></svg></div><div class="demo-ring"></div></div>
          <div class="demo-badge">หน้าจอจำลอง</div></div>
        <div class="demo-cap"><div class="demo-num"></div><div class="demo-tip"></div></div>
        <div class="demo-ctl">
          <button class="dbtn" data-act="prev" aria-label="ย้อนกลับ">‹</button>
          <button class="dbtn main" data-act="play"></button>
          <button class="dbtn" data-act="next" aria-label="ถัดไป">›</button>
          <div class="demo-dots">${steps.map((_, i) => `<i data-go="${i}"></i>`).join('')}</div>
          <button class="dbtn mode" data-act="mode">👆 ลองกดเอง</button>
        </div>`;
      this.stage = host.querySelector('.demo-stage'); this.inner = host.querySelector('.demo-inner'); this.screen = host.querySelector('.demo-screen');
      this.cursor = host.querySelector('.demo-cursor'); this.ring = host.querySelector('.demo-ring');
      this.tip = host.querySelector('.demo-tip'); this.num = host.querySelector('.demo-num');
      this.playing = false;
      host.querySelector('.demo-ctl').addEventListener('click', e => {
        const b = e.target.closest('[data-act],[data-go]'); if (!b) return;
        if (b.dataset.go != null) { this.pause(); this.show(+b.dataset.go); return; }
        const a = b.dataset.act;
        if (a === 'play') this.playing ? this.pause() : this.play();
        if (a === 'next') { this.pause(); this.show(Math.min(this.i + 1, this.steps.length - 1)); }
        if (a === 'prev') { this.pause(); this.show(Math.max(this.i - 1, 0)); }
        if (a === 'mode') { this.mode = this.mode === 'auto' ? 'manual' : 'auto'; this.updateCtl(); this.show(this.i); if (this.mode === 'auto') this.play(); }
      });
      this.screen.addEventListener('click', e => this.onScreenClick(e));
      this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.stage);
      this.io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting && !this.started) { this.started = true; this.show(0); if (!opts.manualStart) this.play(); }
        if (!en.isIntersecting && this.playing) this.pause();
      }), { threshold: .35 });
      this.io.observe(host);
      this.screen.innerHTML = steps[0].scene();
      this.fit(); this.updateCtl();
      this.tip.textContent = 'เลื่อนมาที่นี่เพื่อเริ่มเดโม';
    }
    destroy() { this.alive = false; this.token++; this.ro.disconnect(); this.io.disconnect(); }
    fit() {
      const w = this.stage.clientWidth; this.base = Math.min(1, w / 880);
      // Small screens: zoom the "camera" onto the active hotspot so the mock stays readable.
      this.zoom = this.base < .62 ? Math.min(2, .8 / this.base) : 1;
      this.stage.style.height = 520 * this.base * (this.zoom > 1 ? 1.25 : 1) + 'px';
      this.cam();
    }
    cam(el) {
      const z = this.zoom || 1, s = this.base || 1;
      this.scale = s * z;
      let ox = 0, oy = 0;
      if (z > 1) {
        const t = el || this.target(this.steps[this.i] || {}) || this.screen.querySelector('.mk-modal, .mk-appr, .mk-menu');
        const vw = this.stage.clientWidth / this.scale, vh = this.stage.clientHeight / this.scale;
        if (t) {
          const p = this.pos(t), cx = p.x + p.w / 2, cy = p.y + p.h / 2;
          ox = Math.max(0, Math.min(880 - vw, cx - vw / 2)); oy = Math.max(0, Math.min(520 - vh, cy - vh / 2));
        } else { ox = (880 - vw) / 2; oy = (520 - vh) / 2; }
      }
      this.inner.style.transform = `scale(${this.scale}) translate(${-ox}px,${-oy}px)`;
    }
    updateCtl() {
      const p = this.host.querySelector('[data-act="play"]');
      p.innerHTML = this.playing ? '❚❚ หยุด' : (this.i >= this.steps.length - 1 && this.done ? '↻ เล่นใหม่' : '▶ เล่น');
      p.disabled = this.mode === 'manual';
      this.host.querySelector('[data-act="mode"]').classList.toggle('on', this.mode === 'manual');
      this.host.querySelectorAll('.demo-dots i').forEach((d, j) => { d.className = j < this.i ? 'past' : j === this.i ? 'on' : ''; });
    }
    play() { if (this.mode === 'manual') return; if (this.done && this.i >= this.steps.length - 1) { this.done = false; this.show(0); } this.playing = true; this.updateCtl(); this.run(); }
    pause() { this.playing = false; this.token++; this.updateCtl(); }
    target(step) { return step.hot ? this.screen.querySelector(`[data-h="${step.hot}"]`) : null; }
    pos(el) {
      const r = el.getBoundingClientRect(), b = this.inner.getBoundingClientRect(), s = b.width / 880 || 1;
      return { x: (r.left - b.left) / s, y: (r.top - b.top) / s, w: r.width / s, h: r.height / s };
    }
    show(i) {
      this.token++;
      this.i = i; const st = this.steps[i];
      this.screen.innerHTML = st.scene();
      this.screen.classList.remove('fade'); void this.screen.offsetWidth; this.screen.classList.add('fade');
      this.num.textContent = `ขั้น ${i + 1}/${this.steps.length}`;
      this.tip.innerHTML = st.tip;
      this.host.querySelector('.demo-choice')?.remove();
      const t = this.target(st);
      this.cam(t);
      this.ring.style.opacity = 0;
      if (t) {
        const p = this.pos(t);
        this.ring.style.cssText = `left:${p.x - 6}px;top:${p.y - 6}px;width:${p.w + 12}px;height:${p.h + 12}px;opacity:1`;
        if (this.mode === 'manual' || st.choices) { this.cursor.style.opacity = 0; t.classList.add('mk-hint'); }
        else this.cursor.style.opacity = 1;
      } else this.cursor.style.opacity = st.choices ? 0 : .0;
      if (st.choices) st.choices.forEach(c => this.screen.querySelector(`[data-h="${c.h}"]`)?.classList.add('mk-hint'));
      if (this.mode === 'manual' && st.hot) this.tip.innerHTML = st.tip + ' <span class="demo-try">👆 กดจุดที่กะพริบบนหน้าจอ</span>';
      if (st.choices) this.tip.innerHTML = st.tip + ' <span class="demo-try">👆 เลือกเองหนึ่งปุ่ม</span>';
      
      this.updateCtl();
      this.opts.onStep && this.opts.onStep(i);
    }
    async typeInto(text, tok) {
      const el = this.screen.querySelector('[data-type]'); if (!el) return;
      el.parentElement.querySelector('em')?.remove();
      el.textContent = '';
      for (const ch of text) { if (tok !== this.token) return; el.textContent += ch; await wait(28); }
    }
    async clickFx(t, tok) {
      const p = this.pos(t);
      this.cursor.style.opacity = 1;
      this.cursor.style.transform = `translate(${p.x + p.w / 2}px,${p.y + p.h / 2}px)`;
      await wait(750); if (tok !== this.token) return false;
      this.cursor.classList.add('click'); t.classList.add('mk-press');
      await wait(260); this.cursor.classList.remove('click');
      return tok === this.token;
    }
    async run() {
      const tok = ++this.token;
      while (this.playing && tok === this.token && this.alive) {
        const st = this.steps[this.i];
        if (st.choices) { this.playing = false; this.updateCtl(); return; }
        await wait(500); if (tok !== this.token) return;
        const t = this.target(st);
        if (t && !(await this.clickFx(t, tok))) return;
        if (st.typeText) await this.typeInto(st.typeText, tok);
        await wait(Math.max(1800, st.tip.replace(/<[^>]+>/g, '').length * 38)); if (tok !== this.token) return;
        if (this.i >= this.steps.length - 1) { this.playing = false; this.done = true; this.updateCtl(); this.finish(); return; }
        this.show(this.i + 1); this.token = tok;
      }
    }
    finish() {
      this.tip.innerHTML = '✅ จบเดโมแล้ว — กด “↻ เล่นใหม่” หรือสลับเป็น “👆 ลองกดเอง” เพื่อฝึกกดเอง';
      this.opts.onDone && this.opts.onDone();
    }
    async onScreenClick(e) {
      const st = this.steps[this.i];
      if (st.choices) {
        const el = e.target.closest('[data-h]'); if (!el) return;
        const c = st.choices.find(x => x.h === el.dataset.h); if (!c) return;
        this.screen.querySelectorAll('.mk-hint').forEach(x => x.classList.remove('mk-hint'));
        el.classList.add('mk-press');
        this.host.querySelector('.demo-choice')?.remove();
        this.host.querySelector('.demo-cap').insertAdjacentHTML('beforeend', `<div class="demo-choice ${c.level || ''}"><b>${c.label}</b> — ${c.result}<button class="dbtn main" data-next>ไปต่อ ›</button></div>`);
        this.host.querySelector('[data-next]').onclick = () => { if (this.i < this.steps.length - 1) { this.show(this.i + 1); if (this.mode === 'auto') this.play(); } else { this.done = true; this.finish(); } };
        this.opts.onChoice && this.opts.onChoice(c);
        return;
      }
      if (this.mode !== 'manual') return;
      const t = this.target(st);
      if (!t) { if (this.i < this.steps.length - 1) this.show(this.i + 1); return; }
      if (t.contains(e.target)) {
        const tok = this.token;
        t.classList.remove('mk-hint'); t.classList.add('mk-press');
        if (st.typeText) await this.typeInto(st.typeText, tok);
        await wait(500); if (tok !== this.token) return;
        if (this.i < this.steps.length - 1) this.show(this.i + 1); else { this.done = true; this.finish(); }
      } else {
        this.stage.classList.remove('shake'); void this.stage.offsetWidth; this.stage.classList.add('shake');
      }
    }
  }
  window.Demo = Demo;
})();
