// ---------- ความต่อเนื่อง: เหรียญ · แบบทดสอบท้ายบท + เช็กลิสต์ความปลอดภัย ----------
const BADGE_SEEN = 'cpa26-badges';
const chqPassed = () => { const b = store.get('cpa26-quiz', {}); return Object.keys(b).filter(k => /^ch-\d+$/.test(k) && b[k] >= 3).length; };
function badgeGot(b) {
  if (b.rule === 'journey') return !!(store.get('cpa26-journey', null) || {}).finished;
  if (b.rule === 'forge') return store.get('cpa26-forge-best', 0) >= b.n;
  if (b.rule === 'sims') return Object.values(store.get('cpa26-sim', {})).filter(s => s && s.done && s.done.guided).length >= b.n;
  if (b.rule === 'quiz') return chqPassed() >= b.n;
  return false;
}
function badgeList() {
  return [
    ...(D.badges || []).map(b => ({ ...b, sp: true, got: badgeGot(b) })),
    ...ALLCH.map(ch => ({ k: 'ch' + ch.n, icon: ch.excel ? 'table' : ch.deep ? 'hat_graduation' : 'ribbon', t: ch.excel ? 'AI + Excel · ' + ch.title : ch.deep ? 'Deep · ' + ch.title : `บทที่ ${ch.n}`, d: ch.deep || ch.excel ? `เรียนครบ ${ch.pages.length} หน้า` : ch.title, g: ch.group, got: chapterDone(ch) === ch.pages.length }))
  ];
}
// ครั้งแรกบนเครื่องนี้: บันทึกเหรียญที่ได้อยู่แล้วแบบเงียบ ไม่แจ้งเตือนย้อนหลัง
if (store.get(BADGE_SEEN, null) == null) store.set(BADGE_SEEN, badgeList().filter(b => b.got).map(b => b.k));
function fxBadgeCheck() {
  const seen = new Set(store.get(BADGE_SEEN, [])), fresh = badgeList().filter(b => b.got && !seen.has(b.k));
  if (!fresh.length) return;
  fresh.forEach(b => seen.add(b.k)); store.set(BADGE_SEEN, [...seen]);
  const names = fresh.map(b => b.t).join(' · ');
  setTimeout(() => { toast('ได้เหรียญใหม่: ' + names); fxAnnounce('ได้เหรียญใหม่: ' + names); fxSound('done'); if (fresh.some(b => b.sp) && Date.now() - (window.__fx.lastConfetti || 0) > 3000) fxConfetti(); }, 900);
}
function badgeCabinetHTML() {
  const L = badgeList(), got = L.filter(b => b.got).length;
  const tile = b => `<li class="bd ${b.got ? 'got' : ''} ${b.sp ? 'sp' : ''}" ${b.g ? `style="${gvar(b.g)}"` : ''} title="${esc(b.d)}"><span class="bd-ic">${ic(b.got ? b.icon : 'lock_closed')}</span><b>${esc(b.t)}</b><small>${esc(b.d)}</small><span class="sr-only">${b.got ? 'ได้แล้ว' : 'ยังไม่ได้'}</span></li>`;
  return `<section class="badges" aria-labelledby="bdH"><h2 class="sec" id="bdH">${ic('ribbon')}<span>ตู้เหรียญ · ได้แล้ว ${got}/${L.length}</span></h2>
    <h3 class="sub">เหรียญพิเศษ</h3><ul class="bd-grid">${L.filter(b => b.sp).map(tile).join('')}</ul>
    <h3 class="sub">เหรียญจบบท</h3><ul class="bd-grid sm">${L.filter(b => !b.sp).map(tile).join('')}</ul></section>`;
}
// ท้ายหน้าสุดท้ายของแต่ละบทหลัก: แบบทดสอบ 3 ข้อ + เช็กลิสต์ความปลอดภัย 5 ข้อ
function chapterCheckHTML(n) {
  const p = PI.get(n); if (!p || isDeep(n) || isEx(n)) return '';
  const ch = CH.get(p.chapter), C = (D.checks || {})[ch.n];
  if (!C || ch.pages[ch.pages.length - 1] !== n) return '';
  const id = 'ch-' + ch.n;
  return `<section class="chk-end card" aria-labelledby="chkH">
    <div class="chk-h"><span class="chk-ic">${ic('ribbon')}</span><div><small>ทบทวนท้ายบทที่ ${ch.n}</small><h2 id="chkH">${esc(ch.title)}</h2></div></div>
    <div class="deep-w quiz" data-quiz="${id}"><h3 class="sub">${ic('question_circle')}<span>แบบทดสอบ 3 ข้อ</span></h3>
    ${C.quiz.map((q, i) => `<fieldset data-a="${q.a}"><legend>${i + 1}. ${esc(q.q)}</legend>${q.opts.map((o, k) => `<label class="qopt"><input type="radio" name="${id}-q${i}" value="${k}"><span>${esc(o)}</span></label>`).join('')}<p class="qwhy" hidden></p><span class="qwhy-t" hidden>${esc(q.why)}</span></fieldset>`).join('')}
    <div class="quiz-ctl"><button type="button" class="btn btn-primary" data-quiz-check>${ic('checkmark_circle')}<span>ตรวจคำตอบ</span></button><button type="button" class="btn btn-subtle" data-quiz-reset>${ic('arrow_clockwise')}<span>เริ่มใหม่</span></button></div>
    <p class="qres" role="status" aria-live="polite"></p></div>
    <div class="chk-safe"><h3 class="sub">${ic('shield_checkmark')}<span>เช็กลิสต์ความปลอดภัยก่อนใช้งานจริง</span></h3><ul class="vlist" data-k="safety">${C.safety.map(x => `<li><label><input type="checkbox"><span>${esc(x)}</span></label></li>`).join('')}</ul><p class="hint" data-vcount></p></div>
  </section>`;
}
