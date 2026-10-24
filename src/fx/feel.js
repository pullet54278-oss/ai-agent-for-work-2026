// ---------- ความรู้สึก: ระลอกปุ่ม · การ์ดเอียง · ตัวเลขนับขึ้น · พลุ · การ์ดเรียนต่อ ----------
document.addEventListener('pointerdown', e => {
  const b = e.target.closest && e.target.closest('.btn');
  if (!b || b.disabled || reduceMotion()) return;
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
  const w = document.createElement('span'); w.className = 'fx-ripw'; w.setAttribute('aria-hidden', 'true');
  const sp = document.createElement('span'); sp.className = 'fx-rip';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  w.appendChild(sp); b.appendChild(w);
  setTimeout(() => w.remove(), 700);
}, { passive: true });

const fxFine = matchMedia('(hover: hover) and (pointer: fine)');
let fxTiltEl = null, fxTiltRaf = 0;
document.addEventListener('pointermove', e => {
  if (!fxFine.matches || reduceMotion() || fxTiltRaf) return;
  fxTiltRaf = requestAnimationFrame(() => {
    fxTiltRaf = 0;
    const el = e.target.closest && e.target.closest('.ccard,.track,.tool,.sk-card,.stat-tile');
    if (fxTiltEl && fxTiltEl !== el) { fxTiltEl.style.transform = ''; fxTiltEl.classList.remove('fx-tilt'); fxTiltEl = null; }
    if (!el) return;
    fxTiltEl = el; el.classList.add('fx-tilt');
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-2px)`;
  });
}, { passive: true });
document.addEventListener('pointerleave', () => { if (fxTiltEl) { fxTiltEl.style.transform = ''; fxTiltEl = null; } });

// ตัวเลขนับขึ้น: ค่าจริงอยู่ใน DOM ตั้งแต่แรก (อ่านได้เสมอ) · เล่นเมื่อเห็นบนจอ
function fxCount(root) {
  if (reduceMotion()) return;
  $$('[data-count]', root).forEach(el => {
    const to = +el.dataset.count; if (!to) return;
    fxInView(el, () => {
      const t0 = performance.now(), d = 900;
      const f = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('th-TH'); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  });
}

// พลุ: canvas 1.6 วินาที สีจาก token ของธีม
function fxConfetti() {
  if (reduceMotion()) return;
  window.__fx.confetti++; window.__fx.lastConfetti = Date.now();
  const c = document.createElement('canvas'); c.className = 'fx-confetti'; c.setAttribute('aria-hidden', 'true');
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  c.width = W * dpr; c.height = H * dpr; document.body.appendChild(c);
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--accent', '--green', '--amber', '--red', '--g-agent'].map(v => cs.getPropertyValue(v).trim()).filter(Boolean);
  const P = Array.from({ length: 130 }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.35, y: H * 0.38, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 7 + 4, c: cols[Math.random() * cols.length | 0] || '#2557E0', a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
  const t0 = performance.now();
  const f = t => {
    const k = t - t0; x.clearRect(0, 0, W, H);
    for (const p of P) { p.vy += 0.34; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.globalAlpha = Math.max(0, 1 - k / 1600); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
    if (k < 1600) requestAnimationFrame(f); else c.remove();
  };
  requestAnimationFrame(f);
}

// การ์ดเรียนต่อจากเดิม (หน้าแรก)
function resumeCardHTML(last) {
  const p = last && PI.get(last);
  if (!p || last === 1) return '';
  const ch = CH.get(p.chapter), d = chapterDone(ch), n = ch.pages.length, pct = Math.round(d / n * 100);
  const sim = simsFor(last)[0], ss = sim && (store.get('cpa26-sim', {})[sim.id] || null);
  const label = isEx(last) ? 'AI + Excel · ' + p.k : isDeep(last) ? 'Deep Learning บท ' + p.k : 'หน้า ' + pageNo(p);
  return `<a class="callout resume resume-card" href="${hrefOf(last)}" style="${gvar(pageGroup(p))}"><span class="rc-ic">${ic('history')}</span><span class="rc-b"><small>เรียนต่อจากเดิม · ${esc(label)}</small><b>${esc(p.title)}</b><span class="rc-ch">${esc(ch.title)} · เรียนแล้ว ${d}/${n} หน้า (${pct}%)</span><span class="bar" aria-hidden="true"><i style="width:${pct}%"></i></span>${ss && ss.i ? `<span class="rc-sim">${ic('play_circle')}<span>หน้าจอจำลอง: ถึงขั้นที่ ${Math.min(ss.i + 1, sim.steps.length)}/${sim.steps.length}</span></span>` : ''}</span><span class="btn btn-primary rc-go">${ic('play')}<span>เรียนต่อจากเดิม</span></span></a>`;
}
