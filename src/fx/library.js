// ---------- คลังเครื่องมือ 40 หัวข้อ (#/lib, #/lib/{slug}) · การ์ดขยายเต็มจอด้วย View Transitions ----------
const LIB = D.library || [], LCATS = D.libCats || [];
const libCat = k => LCATS.find(c => c.k === k) || LCATS[0];
let libQ = '', libF = store.get('cpa26-libcat', '');
window.__fx.vt = 0;
function libGo(href, from) {
  const can = typeof document.startViewTransition === 'function' && !reduceMotion();
  if (!can) { location.hash = href; return; }
  window.__fx.vt++;
  if (from) { $$('.lib-hero').forEach(h => { h.style.viewTransitionName = 'none'; }); from.style.viewTransitionName = 'lib-hero'; }
  const back = href === '#/lib' && location.hash.startsWith('#/lib/') ? location.hash.slice(6) : null;
  history.pushState(null, '', href);
  const vt = document.startViewTransition(() => {
    if (from) from.style.viewTransitionName = '';
    route();
    if (back) { const c = document.querySelector(`[data-lib="${back}"]`); if (c) { c.style.viewTransitionName = 'lib-hero'; c.scrollIntoView({ block: 'center' }); } }
  });
  vt.finished.finally(() => { $$('[data-lib]').forEach(c => { c.style.viewTransitionName = ''; }); });
}
function libCardHTML(t) {
  const c = libCat(t.cat);
  return `<a class="lib-card" href="#/lib/${t.slug}" data-lib="${t.slug}" data-cat="${t.cat}" style="${gvar(c.g)}"><span class="lib-ic">${ic(t.icon)}</span><span class="lib-cat">${esc(c.t)}</span><b>${esc(t.title)}</b><small>${esc(t.short)}</small></a>`;
}
function renderLib() {
  cur = null;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('apps')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>คลังเครื่องมือ</span></nav><h1>คลังเครื่องมือ Copilot</h1><p class="short">${LIB.length} หัวข้อใช้งานจริง แบ่ง ${LCATS.length} หมวด · แตะการ์ดเพื่อเปิดหน้าเรื่องนั้น พร้อม Prompt ตัวอย่างและลิงก์ไปบทเรียน</p></header>
  <div class="lib-tools"><label class="sr-only" for="libQ">ค้นหาในคลังเครื่องมือ</label><div class="lib-search">${ic('search')}<input id="libQ" type="search" placeholder="ค้นหา เช่น Excel, อีเมล, สิทธิ์" value="${esc(libQ)}" autocomplete="off"></div>
  <div class="lib-chips" role="group" aria-label="กรองตามหมวด"><button type="button" class="chip" data-libcat="" aria-pressed="${!libF}">ทั้งหมด</button>${LCATS.map(c => `<button type="button" class="chip" data-libcat="${c.k}" aria-pressed="${libF === c.k}" style="${gvar(c.g)}">${ic(c.icon)}<span>${esc(c.t)}</span></button>`).join('')}</div></div>
  <p class="hint lib-count" data-lib-count role="status" aria-live="polite"></p>
  <div class="lib-grid" data-lib-grid>${LIB.map(libCardHTML).join('')}</div>
  <p class="empty" data-lib-empty hidden>ไม่พบหัวข้อที่ตรงกับคำค้น</p>
  ${verifyNote()}${copyLine()}`, 'คลังเครื่องมือ');
  const root = $('#main .wrap');
  const apply = () => {
    const q = libQ.trim().toLowerCase(); let n = 0;
    $$('[data-lib]', root).forEach(a => { const t = LIB.find(x => x.slug === a.dataset.lib); const hit = (!libF || t.cat === libF) && (!q || [t.title, t.short, ...t.points, libCat(t.cat).t].join(' ').toLowerCase().includes(q)); a.hidden = !hit; if (hit) n++; });
    $('[data-lib-count]', root).textContent = `แสดง ${n}/${LIB.length} หัวข้อ`;
    $('[data-lib-empty]', root).hidden = n > 0;
    $$('[data-libcat]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.libcat === libF)));
  };
  $('#libQ', root).addEventListener('input', e => { libQ = e.target.value; apply(); });
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-libcat]'); if (b) { libF = b.dataset.libcat; store.set('cpa26-libcat', libF); apply(); return; }
    const a = e.target.closest('[data-lib]'); if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); libGo(a.getAttribute('href'), a); }
  });
  apply(); renderTOC();
}
const verifyNote = () => `<p class="badge-verify" role="note">${ic('warning')}<span>ชื่อเมนูและความพร้อมของฟีเจอร์ขึ้นกับบัญชีและนโยบายองค์กร · ตรวจกับบัญชีจริงก่อนสอน</span></p>`;
function libLinkHTML(r) {
  if (r.startsWith('r:')) { const h = r.slice(2), t = TOOLS.find(x => x[0] === h); return `<li><a class="toc-card" href="${h}"><span class="tc-ic">${ic(t ? t[1] : 'open')}</span><span class="tc-b"><small>เครื่องมือ</small><b>${esc(t ? t[2] : h)}</b>${t ? `<span class="tc-s">${esc(t[3])}</span>` : ''}</span></a></li>`; }
  const n = refN(r); return n && PI.has(n) ? itemCardHTML(n) : '';
}
function renderLibItem(slug) {
  cur = null;
  const i = LIB.findIndex(x => x.slug === slug), t = LIB[i], c = libCat(t.cat);
  const pv = LIB[(i - 1 + LIB.length) % LIB.length], nx = LIB[(i + 1) % LIB.length];
  const same = LIB.filter(x => x.cat === t.cat && x.slug !== slug);
  setMain(`<div style="${gvar(c.g)}"><header class="ph lib-hero" style="view-transition-name:lib-hero">${illus(c.g, t.icon, 'ph-art')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><a href="#/lib" data-lib-back>คลังเครื่องมือ</a><span>›</span><span>${esc(c.t)}</span></nav><span class="pill g">${ic(c.icon)}<span>${esc(c.t)}</span></span><h1>${esc(t.title)}</h1><p class="short">${esc(t.short)}</p></header>
  <div class="lib-body">
    <section class="card"><h2 class="sec">${ic('lightbulb')}<span>หลักสำคัญ</span></h2><ul class="lib-pts">${t.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>
    <section class="card"><h2 class="sec">${ic('sparkle')}<span>Prompt ตัวอย่าง</span></h2><div class="prompt"><div class="prompt-head">${ic('sparkle')}<span>${esc(t.title)}</span><button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code>${esc(t.prompt)}</code></pre></div><p class="hint">แทนที่ข้อความใน [วงเล็บเหลี่ยม] ด้วยงานของคุณ แล้วแนบไฟล์ในแชท</p></section>
  </div>
  ${t.links.length ? `<h2 class="sec">${ic('book_open')}<span>อ่านต่อในคอร์ส</span></h2><ul class="toc-cards">${t.links.map(libLinkHTML).join('')}</ul>` : ''}
  ${same.length ? `<h2 class="sec">${ic(c.icon)}<span>หัวข้ออื่นในหมวด ${esc(c.t)}</span></h2><div class="lib-grid">${same.map(libCardHTML).join('')}</div>` : ''}
  <nav class="pager" aria-label="หัวข้อในคลัง"><a href="#/lib/${pv.slug}" rel="prev" data-lib="${pv.slug}"><small>← หัวข้อก่อนหน้า</small><b>${esc(pv.title)}</b></a><a class="nx" href="#/lib/${nx.slug}" rel="next" data-lib="${nx.slug}"><small>หัวข้อถัดไป →</small><b>${esc(nx.title)}</b></a></nav>
  ${verifyNote()}${copyLine()}</div>`, t.title);
  const root = $('#main .wrap');
  root.addEventListener('click', e => {
    if (e.target.closest('[data-lib-back]')) { e.preventDefault(); libGo('#/lib', null); return; }
    const a = e.target.closest('.lib-grid [data-lib]'); if (a && !e.ctrlKey && !e.metaKey) { e.preventDefault(); libGo(a.getAttribute('href'), a); }
  });
  renderTOC();
}
