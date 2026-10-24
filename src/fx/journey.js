// ---------- เส้นทาง 7 สถานี (#/journey) ----------
// เส้นวิ่งตามการเลื่อนหน้า · แต่ละสถานีมีหน้าจอจำลอง · สถานีขออนุญาตหยุดรอให้ผู้เรียนเลือก แล้วส่งผลต่อสถานีผลงาน
const JR_KEY = 'cpa26-journey';
const jrState = () => { const s = store.get(JR_KEY, null) || {}; return { done: s.done || [], consent: s.consent || null, finished: !!s.finished }; };
function jrConsentHTML(c, chosen) {
  const o = c.options.find(x => x.k === chosen);
  return `<div class="jr-consent" role="group" aria-label="หน้าต่างขออนุญาต (จำลอง)">
    <div class="jr-ask">${ic('shield_checkmark')}<div><b>Agent ขออนุญาต</b><p>${esc(c.ask)}</p></div></div>
    <div class="jr-opts">${c.options.map(x => `<button type="button" class="btn ${x.k === 'once' ? 'btn-primary' : 'btn-outline'} jr-opt" data-consent="${x.k}" aria-pressed="${x.k === chosen}">${esc(x.label)}</button>`).join('')}</div>
    <p class="jr-explain ${o ? 'tone-' + o.tone : ''}" data-jr-explain role="status" aria-live="polite">${o ? `${ic(o.tone === 'ok' ? 'checkmark_circle' : o.tone === 'warn' ? 'warning' : 'dismiss_circle')}<span><b>${esc(o.label)}:</b> ${esc(o.explain)}</span>` : `${ic('info')}<span>เส้นทางหยุดรอตรงนี้ · เลือก 1 ปุ่มเพื่อดูผลของแต่ละทางเลือก</span>`}</p>
    <p class="hint">${ic('warning')} ข้อความและปุ่มในหน้าต่างจริงอาจต่างจากนี้ · ตรวจกับบัญชีจริงก่อนสอน</p></div>`;
}
function jrCarryHTML(st) {
  const c = D.journey.stations.find(s => s.consent).consent, o = c.options.find(x => x.k === st.consent);
  return o ? `<span class="jr-carry tone-${o.tone}">${ic(o.tone === 'ok' ? 'checkmark_circle' : o.tone === 'warn' ? 'warning' : 'dismiss_circle')}<span><b>ผลจากสถานี 5 (${esc(o.label)}):</b> ${esc(o.next)}</span></span>` : `<span class="jr-carry">${ic('info')}<span>ยังไม่ได้เลือกที่สถานี 5 (ขออนุญาต) · <a href="#jr-consent" data-scroll="jr-consent">กลับไปเลือก</a></span></span>`;
}
function renderJourney() {
  cur = null;
  const J = D.journey, st = jrState(), N = J.stations.length;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('compass_northwest')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>เส้นทาง 7 สถานี</span></nav><h1>${esc(J.title)}</h1><p class="short">${esc(J.intro)}</p><div class="ph-meta"><span class="pill g" data-jr-count></span><button type="button" class="btn btn-subtle" data-jr-reset>${ic('arrow_reset')}<span>เริ่มเส้นทางใหม่</span></button></div></header>
  <div class="jr"><div class="jr-line" aria-hidden="true"><i class="jr-fill"></i></div>
  <ol class="jr-list">${J.stations.map((s, i) => `<li class="jr-st" id="jr-${s.key}" data-k="${s.key}">
    <span class="jr-dot" aria-hidden="true">${ic(s.icon)}<b>${i + 1}</b></span>
    <article class="card jr-card"><div class="jr-h"><small>สถานีที่ ${i + 1}/${N}</small><span class="jr-ok">${ic('checkmark_circle')}<span>ผ่านแล้ว</span></span></div><h2>${esc(s.title)}</h2><p class="jr-lead">${esc(s.lead)}</p>
    ${s.points ? `<ul class="jr-pts">${s.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    ${s.consent ? jrConsentHTML(s.consent, st.consent) : ''}
    ${s.key === 'result' ? `<p data-jr-carry>${jrCarryHTML(st)}</p>` : ''}
    ${s.sim ? `<section class="sim sim-sm" data-sim="${esc(s.sim)}" aria-label="หน้าจอจำลอง: ${esc(s.title)}"></section>` : ''}
    ${s.link && PI.has(s.link) ? `<a class="jr-link" href="${hrefOf(s.link)}">${ic('book_open')}<span>อ่านต่อ: หน้า ${s.link} · ${esc(PI.get(s.link).title)}</span></a>` : ''}</article></li>`).join('')}</ol></div>
  <section class="card jr-end" data-jr-end hidden>${ic('trophy')}<div><b>จบเส้นทาง 7 สถานีแล้ว</b><p>คุณผ่านครบทุกขั้นของการสร้าง Agent ตัวแรก · ต่อด้วยการเขียน Prompt ใน <a href="#/forge">Prompt Lab เครื่องผลิต</a> หรือสร้าง Agent จริงใน <a href="#/builder">Agent Builder Studio</a></p></div></section>
  ${copyLine()}`, 'เส้นทาง 7 สถานี');
  mount($('#main'), null);
  const root = $('#main .jr');
  const sync = () => {
    const s = jrState();
    $$('.jr-st', root).forEach(li => li.classList.toggle('done', s.done.includes(li.dataset.k)));
    $('[data-jr-count]').innerHTML = `${ic('checkmark_circle')}<span>ผ่านแล้ว ${s.done.length}/${N} สถานี</span>`;
    $('[data-jr-end]').hidden = s.done.length < N;
  };
  const mark = k => {
    const s = jrState(); if (s.done.includes(k)) return;
    s.done.push(k); const fin = s.done.length === N && !s.finished; if (fin) s.finished = true;
    store.set(JR_KEY, s); sync(); fxSound('ok'); if (fin) setTimeout(fxBadgeCheck, 400);
    if (fin) { fxConfetti(); fxSound('done'); toast('จบเส้นทาง 7 สถานีแล้ว'); fxAnnounce('จบเส้นทาง 7 สถานีแล้ว'); }
  };
  root.addEventListener('sim:done', e => { const li = e.target.closest('.jr-st'); if (li) mark(li.dataset.k); });
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-consent]'); if (!b) return;
    const s = jrState(); s.consent = b.dataset.consent; store.set(JR_KEY, s);
    const card = b.closest('.jr-card'), c = J.stations.find(x => x.consent).consent;
    card.querySelector('.jr-consent').outerHTML = jrConsentHTML(c, s.consent);
    $('[data-jr-carry]', root).innerHTML = jrCarryHTML(s);
    const o = c.options.find(x => x.k === s.consent); fxAnnounce(`${o.label}: ${o.explain}`);
    if (o.tone === 'stop') fxSound('err');
    mark('consent');
    const nb = card.querySelector(`[data-consent="${s.consent}"]`); if (nb) nb.focus({ preventScroll: true });
  });
  $('[data-jr-reset]').addEventListener('click', () => {
    store.set(JR_KEY, { done: [], consent: null, finished: false });
    const all = store.get('cpa26-sim', {}); J.stations.forEach(s => { if (s.sim) delete all[s.sim]; }); store.set('cpa26-sim', all);
    renderJourney(); toast('เริ่มเส้นทางใหม่แล้ว');
  });
  // เส้นสีวิ่งตามการเลื่อนหน้า
  const fill = $('.jr-fill', root), list = $('.jr-list', root);
  const onScroll = () => {
    if (!fill.isConnected) { removeEventListener('scroll', jrRaf); removeEventListener('resize', jrRaf); return; }
    const r = list.getBoundingClientRect(), mid = innerHeight * 0.55;
    const p = Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height)));
    fill.style.height = (p * 100).toFixed(1) + '%';
    $$('.jr-st', root).forEach(li => li.classList.toggle('passed', li.querySelector('.jr-dot').getBoundingClientRect().top < mid));
  };
  let raf = 0; const jrRaf = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); };
  addEventListener('scroll', jrRaf, { passive: true }); addEventListener('resize', jrRaf, { passive: true });
  sync(); onScroll(); renderTOC();
}
