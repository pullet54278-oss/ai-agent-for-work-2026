// ---------- หน้าจอจำลองที่เล่นเองได้ (Sim Player) ----------
// ฉากมาจาก content/sims/*.mjs (ตรวจตอน build) · หน้าจอวาดด้วย HTML (ไม่ใช่ภาพหน้าจอจริง) · โหมด ดูอัตโนมัติ / ลองกดเอง
const SIMS = D.sims || [];
const simsFor = n => SIMS.filter(s => s.page === n);
const simSlotHTML = n => simsFor(n).map(s => `<section class="sim" data-sim="${esc(s.id)}" aria-label="หน้าจอจำลอง: ${esc(s.title)}"></section>`).join('');
const SIM_W = 1280, SIM_H = 720;
const simClone = o => JSON.parse(JSON.stringify(o));
const simPlain = s => String(s).replace(/\*\*/g, '');
function simApply(st, s) {
  st = simClone(st);
  if (s.go) st.screen = s.go;
  if (s.tab) st.tab = s.tab;
  if (s.act === 'type') { const [k, id] = s.t.split(':'); if (k === 'field') st.f[id] = s.type; else if (k === 'describe') st.ddraft = s.type; else st.draft = s.type; }
  if (s.set) Object.assign(st, s.set);
  if (s.skill) st.skills = [...st.skills, s.skill];
  if (s.msgs) { st.msgs = [...st.msgs, ...s.msgs]; st.draft = ''; st.attach = null; }
  if (s.dmsgs) { st.dmsgs = [...(st.dmsgs || []), ...s.dmsgs]; st.ddraft = ''; }
  if (s.sites) st.sites = [...(st.sites || []), ...s.sites];
  if (s.cap) st.caps = (st.caps || []).includes(s.cap) ? st.caps.filter(c => c !== s.cap) : [...(st.caps || []), s.cap];
  st.toast = s.toast || '';
  return st;
}
function simState(sc, i) { let st = simClone(sc.init); st.toast = ''; for (let k = 0; k < i; k++) st = simApply(st, sc.steps[k]); return st; }

// --- หน้าจอจำลองแบบ Copilot (theme pack: copilot) ---
function simScreenHTML(st) {
  const T = t => `data-t="${t}"`;
  const rail = `<nav class="sm-rail" aria-label="เมนูจำลอง"><span class="sm-logo">${ic('sparkle')}</span>${[['chat', 'chat', 'Chat'], ['agents', 'bot', 'Agents & Skills']].map(([k, i, l]) => `<button type="button" class="sm-ri ${(k === 'chat') === (st.screen === 'chat') ? 'on' : ''}" ${T('rail:' + k)}>${ic(i)}<span>${l}</span></button>`).join('')}</nav>`;
  let main;
  if (st.screen === 'chat') {
    main = `<div class="sm-head"><b>Copilot Chat</b></div><div class="sm-chat sm-empty"><p class="sm-hello">${ic('sparkle')}<span>สวัสดี วันนี้ให้ช่วยอะไรดี</span></p></div><div class="sm-in"><span class="sm-ph">ถาม Copilot…</span><span class="sm-send">${ic('send')}</span></div>`;
  } else if (st.screen === 'agents') {
    main = `<div class="sm-head"><b>Agents & Skills</b><button type="button" class="sm-btn pri" ${T('btn:new-agent')}>${ic('edit')}<span>New agent</span></button></div><div class="sm-cards">${['Researcher', 'Analyst', 'Prompt Coach', 'ผู้ช่วยสรุปประชุม', 'ผู้ช่วยตรวจเอกสาร', 'ผู้ช่วยวางแผนงาน'].map(n => `<div class="sm-card">${ic('bot')}<b>${esc(n)}</b><small>Agent</small></div>`).join('')}</div>`;
  } else {
    const fld = (id, label, ph, tall) => `<button type="button" class="sm-field ${tall ? 'tall' : ''}" ${T('field:' + id)}><small>${label}</small><span class="v" data-v="${id}">${st.f[id] ? esc(st.f[id]) : `<i>${ph}</i>`}</span></button>`;
    const tabs = [['describe', 'Describe'], ['configure', 'Configure'], ['try', 'Try it']].map(([k, l]) => `<button type="button" class="sm-tab ${st.tab === k ? 'on' : ''}" ${T('tab:' + k)}>${l}</button>`).join('');
    let body;
    const msgHTML = m => `<div class="sm-msg ${m.r}">${m.r === 'a' ? ic(m.ic || 'bot') : ''}<span>${m.file ? `<span class="sm-chip">${ic('document')}${esc(m.file)}</span>` : ''}${m.skill ? `<span class="sm-chip sk">${ic('layer')}ใช้ Skill: ${esc(m.skill)}</span>` : ''}${esc(m.t)}${m.out ? `<span class="sm-chip out">${ic('document_text')}${esc(m.out)}</span>` : ''}</span></div>`;
    if (st.tab === 'describe') body = `<div class="sm-chat"><div class="sm-msg a">${ic('sparkle')}<span>บอกฉันว่าอยากให้ Agent ช่วยงานอะไร แล้วฉันจะช่วยร่างการตั้งค่าให้</span></div>${(st.dmsgs || []).map(m => msgHTML({ ...m, ic: 'sparkle' })).join('')}</div><div class="sm-in"><button type="button" class="sm-txt" ${T('describe:input')}><span class="v" data-v="ddraft">${st.ddraft ? esc(st.ddraft) : '<i>บรรยาย Agent ที่ต้องการ…</i>'}</span></button><button type="button" class="sm-send on" ${T('describe:send')} aria-label="ส่ง">${ic('send')}</button></div>`;
    else if (st.tab === 'configure') body = `<div class="sm-form">${fld('name', 'Name', 'ตั้งชื่อ Agent')}${fld('desc', 'Description', 'Agent นี้ทำอะไร')}${fld('instr', 'Instructions', 'บอก Agent ว่าต้องทำงานอย่างไร', true)}
      <div class="sm-sec"><div><b>Knowledge</b><small>${(st.sites || []).length ? st.sites.map(u => `<span class="sm-chip">${ic('globe')}${esc(u)}</span>`).join(' ') : 'เว็บไซต์สาธารณะ ≤ 4 แหล่ง'}</small></div><button type="button" class="sm-btn" ${T('knowledge:add')}>${ic('link')}<span>Add</span></button></div>
      <div class="sm-sec"><div><b>Capabilities</b><small>เปิดเฉพาะที่งานต้องใช้</small></div><div class="sm-caps">${[['web', 'globe', 'Web search'], ['code', 'code', 'Code interpreter'], ['image', 'sparkle', 'Image generator']].map(([k, i, l]) => `<button type="button" class="sm-cap ${(st.caps || []).includes(k) ? 'on' : ''}" ${T('cap:' + k)} aria-pressed="${(st.caps || []).includes(k)}">${ic(i)}<span>${l}</span><i></i></button>`).join('')}</div></div>
      <div class="sm-sec"><div><b>Skills</b><small>${st.skills.length ? st.skills.map(s => `<span class="sm-chip">${ic('layer')}${esc(s)}</span>`).join(' ') : 'ยังไม่มี Skill'}</small></div><button type="button" class="sm-btn" ${T('skills:add')}>${ic('arrow_upload')}<span>Add</span></button></div></div>`;
    else body = `<div class="sm-chat">${st.msgs.length ? st.msgs.map(msgHTML).join('') : `<p class="sm-hello">${ic('bot')}<span>ทดสอบ ${esc(st.f.name || 'Agent')} ที่นี่ก่อนแชร์</span></p>`}</div>
      <div class="sm-in"><button type="button" class="sm-icb" ${T('try:attach')} aria-label="แนบไฟล์">${ic('attach')}</button>${st.attach ? `<span class="sm-chip">${ic('document')}${esc(st.attach)}</span>` : ''}<button type="button" class="sm-txt" ${T('try:input')}><span class="v" data-v="draft">${st.draft ? esc(st.draft) : '<i>พิมพ์คำถามทดสอบ…</i>'}</span></button><button type="button" class="sm-send on" ${T('try:send')} aria-label="ส่ง">${ic('send')}</button></div>`;
    main = `<div class="sm-head"><b>${esc(st.created ? st.f.name : 'New agent')}</b><div class="sm-tabs" role="presentation">${tabs}</div>${st.created ? `<button type="button" class="sm-btn" ${T('btn:share')}>${ic('people_team')}<span>${st.shared ? 'Shared' : 'Share'}</span></button>` : ''}<button type="button" class="sm-btn pri" ${T('btn:create')}>${st.created ? 'Update' : 'Create'}</button></div><div class="sm-body">${body}</div>`;
  }
  const share = st.dialog === 'share' ? `<div class="sm-dlg"><div class="sm-dlg-in"><b>Share ${esc(st.f.name)}</b><small>เลือกคนที่ใช้ Agent นี้ได้</small>${[['me', 'person', 'เฉพาะฉัน', 'ใช้ทดสอบก่อนแชร์'], ['people', 'people_team', 'บางคนในองค์กร', 'ทีมที่ทำงานนี้จริง (แนะนำ)'], ['org', 'organization', 'ทุกคนในองค์กร', 'ต้องผ่านผู้มีอำนาจอนุมัติ']].map(([k, i, l, d]) => `<button type="button" class="sm-opt" ${T('share:' + k)}>${ic(i)}<span><b>${l}</b><small>${d}</small></span></button>`).join('')}</div></div>` : '';
  const dlg = st.dialog === 'skill' ? `<div class="sm-dlg"><div class="sm-dlg-in"><b>Add skill</b><small>อัปโหลดแพ็กเกจ .zip ที่มี SKILL.md</small>${st.upload ? `<div class="sm-file">${ic('folder')}<div><b>sop-assistant.zip</b><small>name: sop-assistant · description: ตอบคำถามวิธีปฏิบัติงานจาก SOP…</small><small>ไฟล์: SKILL.md · sop-biosecurity.pdf</small></div>${ic('checkmark_circle')}</div>` : `<button type="button" class="sm-drop" ${T('dialog:file')}>${ic('arrow_upload')}<span>เลือกไฟล์ .zip</span></button>`}<div class="sm-dlg-act"><span class="sm-btn ghost">Cancel</span><button type="button" class="sm-btn pri" ${T('dialog:add')}>Add</button></div></div></div>` : '';
  return `<div class="sm-app">${rail}<div class="sm-main">${main}</div>${dlg}${share}${st.toast ? `<div class="sm-toast">${ic('checkmark_circle')}<span>${esc(st.toast)}</span></div>` : ''}</div>`;
}

const SIM_CURSOR = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 2.5l14.5 9.2-6.3 1.4 3.6 6.6-2.7 1.5-3.6-6.6L6 19.2z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
function mountSim(el) {
  const sc = SIMS.find(s => s.id === el.dataset.sim); if (!sc || el.dataset.ready) return;
  el.dataset.ready = '1';
  const N = sc.steps.length, saved = store.get('cpa26-sim', {})[sc.id] || {};
  const P = { i: Math.min(saved.i || 0, N), mode: 'auto', playing: false, speed: 1, wrong: 0, run: 0, busy: false, scale: 1, cx: SIM_W / 2, cy: SIM_H - 120 };
  el.innerHTML = `<div class="sim-top"><div class="sim-tt">${ic('play_circle')}<div><b>หน้าจอจำลอง: ${esc(sc.title)}</b><small>${esc(sc.intro)}</small></div></div>
    <div class="sim-mode" role="group" aria-label="โหมดหน้าจอจำลอง"><button type="button" data-mode="auto" aria-pressed="true">${ic('play')}<span>ดูอัตโนมัติ</span></button><button type="button" data-mode="guided" aria-pressed="false">${ic('cursor_click')}<span>ลองกดเอง</span></button></div></div>
    <p class="sim-note">${ic('info')}<span>หน้าจอจำลองเพื่อการเรียน ไม่ใช่ภาพหน้าจอจริง · ชื่อเมนูอ้างอิงเอกสาร Microsoft · ตรวจกับบัญชีจริงก่อนสอน</span></p>
    <div class="sim-vp" tabindex="0" aria-label="หน้าจอจำลอง · Space เล่น/หยุด · ลูกศรซ้าย/ขวา เปลี่ยนขั้น"><div class="sim-stage" style="width:${SIM_W}px;height:${SIM_H}px"><div class="sim-screen"></div><div class="sim-ring" hidden></div><div class="sim-cursor" aria-hidden="true">${SIM_CURSOR}</div></div>
      <div class="sim-tip" role="status" aria-live="polite"></div>
      <div class="sim-end" hidden></div>
      <button type="button" class="sim-big" aria-label="เล่นหน้าจอจำลอง">${ic('play')}</button></div>
    <div class="sim-bar"><button type="button" class="btn btn-subtle" data-act="prev" aria-label="ขั้นก่อนหน้า">${ic('previous')}</button><button type="button" class="btn btn-primary" data-act="play" aria-label="เล่น">${ic('play')}</button><button type="button" class="btn btn-subtle" data-act="next" aria-label="ขั้นถัดไป">${ic('next')}</button>
      <div class="sim-prog"><div class="sim-fill"></div><div class="sim-dots">${sc.steps.map((s, k) => `<button type="button" data-go="${k}" aria-label="ไปขั้นที่ ${k + 1}: ${esc(simPlain(s.tip))}"></button>`).join('')}</div></div>
      <span class="sim-count" aria-live="off"></span><label class="sr-only" for="sp-${sc.id}">ความเร็ว</label><select id="sp-${sc.id}" data-act="speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select><button type="button" class="btn btn-subtle" data-act="reset" aria-label="เริ่มใหม่">${ic('arrow_reset')}</button></div>
    <details class="sim-tx"><summary>${ic('text_bullet_list_square')}<span>ขั้นตอนทั้งหมดแบบข้อความ (${N} ขั้น)</span></summary><ol>${sc.steps.map(s => `<li>${md(s.tip)}</li>`).join('')}</ol></details>`;
  const vp = el.querySelector('.sim-vp'), stage = el.querySelector('.sim-stage'), screen = el.querySelector('.sim-screen'), ring = el.querySelector('.sim-ring'), cur = el.querySelector('.sim-cursor'), tip = el.querySelector('.sim-tip'), end = el.querySelector('.sim-end'), big = el.querySelector('.sim-big');
  const save = extra => { const all = store.get('cpa26-sim', {}); all[sc.id] = { ...(all[sc.id] || {}), i: P.i, ...extra }; store.set('cpa26-sim', all); };
  const tgt = () => P.i < N ? screen.querySelector(`[data-t="${sc.steps[P.i].t}"]`) : null;
  const box = t => { const r = t.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: (r.left - s.left) / P.scale, y: (r.top - s.top) / P.scale, w: r.width / P.scale, h: r.height / P.scale }; };
  const setCur = (x, y) => { P.cx = x; P.cy = y; cur.style.transform = `translate(${x}px,${y}px)`; };
  function placeTip() {
    const t = tgt(); tip.classList.remove('dock', 'left', 'below', 'above');
    if (!t || P.i >= N) { tip.hidden = true; return; }
    tip.hidden = false;
    if (vp.clientWidth < 640) { tip.classList.add('dock'); tip.style.left = tip.style.top = ''; return; }
    const r = t.getBoundingClientRect(), v = vp.getBoundingClientRect(), tw = Math.min(300, v.width * 0.42), th = tip.offsetHeight || 90;
    let x = r.right - v.left + 14, y = r.top - v.top + r.height / 2 - th / 2;
    if (x + tw > v.width - 8) { x = r.left - v.left - tw - 14; tip.classList.add('left'); }
    if (x < 8) { x = Math.max(8, Math.min(v.width - tw - 8, r.left - v.left)); y = r.bottom - v.top + 12; tip.classList.remove('left'); tip.classList.add('below'); if (y + th > v.height - 8) { y = r.top - v.top - th - 12; tip.classList.replace('below', 'above'); } }
    tip.style.width = tw + 'px'; tip.style.left = x + 'px'; tip.style.top = Math.max(8, Math.min(v.height - th - 8, y)) + 'px';
  }
  function layout() {
    P.scale = Math.min(1, vp.clientWidth / SIM_W) || 1;
    stage.style.transform = `scale(${P.scale})`;
    const sh = SIM_H * P.scale + 'px';
    if (vp.clientWidth < 640) { vp.style.height = ''; vp.style.paddingTop = sh; } else { vp.style.paddingTop = ''; vp.style.height = sh; }
    const t = tgt();
    if (t) { const b = box(t); ring.hidden = false; Object.assign(ring.style, { left: b.x - 6 + 'px', top: b.y - 6 + 'px', width: b.w + 12 + 'px', height: b.h + 12 + 'px' }); } else ring.hidden = true;
    placeTip();
  }
  function draw() {
    screen.innerHTML = simScreenHTML(simState(sc, P.i));
    screen.inert = P.mode === 'auto';
    el.classList.toggle('guided', P.mode === 'guided');
    ring.classList.toggle('strong', P.wrong >= 2);
    const s = sc.steps[P.i];
    tip.innerHTML = s ? `<small>ขั้นที่ ${P.i + 1}/${N}</small><p>${P.wrong >= 2 ? '<b>กดที่จุดที่มีวงแสง · </b>' : ''}${md(s.tip)}</p>` : '';
    el.querySelector('.sim-count').textContent = P.i >= N ? `ครบ ${N}/${N} ขั้น` : `ขั้นที่ ${P.i + 1}/${N}`;
    el.querySelector('.sim-fill').style.width = (P.i / N * 100) + '%';
    el.querySelectorAll('.sim-dots button').forEach((b, k) => { b.classList.toggle('d', k < P.i); b.classList.toggle('on', k === P.i); b.setAttribute('aria-current', k === P.i ? 'step' : 'false'); });
    el.querySelectorAll('.sim-tx li').forEach((li, k) => li.classList.toggle('on', k === P.i));
    el.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === P.mode)));
    end.hidden = P.i < N;
    big.hidden = !(P.mode === 'auto' && !P.playing && P.i === 0);
    const pb = el.querySelector('[data-act="play"]'); pb.innerHTML = ic(P.playing ? 'pause' : 'play'); pb.setAttribute('aria-label', P.playing ? 'หยุด' : 'เล่น');
    if (P.i >= N) end.innerHTML = `<div>${ic('trophy')}<b>ทำครบ ${N} ขั้นแล้ว</b><p>${esc(sc.title)}</p><span><button type="button" class="btn btn-primary" data-act="replay">${ic('arrow_reset')}<span>เล่นซ้ำ</span></button> <button type="button" class="btn btn-outline" data-act="try">${ic('cursor_click')}<span>ลองกดเอง</span></button></span></div>`;
    layout(); save();
  }
  const alive = id => P.playing && id === P.run && el.isConnected;
  const dur = ms => reduceMotion() ? 0 : ms / P.speed;
  async function moveTo(t) {
    const b = box(t), x = b.x + Math.min(b.w * 0.5, 60), y = b.y + b.h * 0.55, d = dur(Math.max(350, Math.min(900, Math.hypot(x - P.cx, y - P.cy) * 0.9)));
    if (d && cur.animate) await cur.animate([{ transform: `translate(${P.cx}px,${P.cy}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: d, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' }).finished.catch(() => {});
    setCur(x, y);
  }
  async function press(t) {
    fxSound('click'); cur.classList.add('press'); t.classList.add('sm-press');
    await fxWait(dur(220)); cur.classList.remove('press');
  }
  async function perform(id) {
    const s = sc.steps[P.i];
    if (s.act === 'type') {
      const v = screen.querySelector(`[data-v="${s.t === 'try:input' ? 'draft' : s.t.split(':')[1]}"]`);
      const parts = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(s.type)].map(x => x.segment) : [...s.type];
      if (v && !reduceMotion()) {
        const per = Math.max(1, Math.ceil(parts.length / 70)), gap = id == null ? 8 : Math.max(8, 22 / P.speed);
        v.textContent = '';
        for (let k = 0; k < parts.length; k += per) { if (id != null && !alive(id)) return false; v.textContent += parts.slice(k, k + per).join(''); v.scrollTop = v.scrollHeight; await fxWait(gap); }
      }
    }
    P.i++; P.wrong = 0;
    draw();
    if (P.i >= N) finish();
    return true;
  }
  function finish() {
    const st = store.get('cpa26-sim', {})[sc.id] || {}, dn = { ...(st.done || {}), [P.mode]: true };
    save({ done: dn }); fxSound('done'); if (!el.closest('.jr')) fxConfetti(); fxAnnounce(`ทำครบ ${N} ขั้นแล้ว: ${sc.title}`);
    fxBadgeCheck();
    el.dispatchEvent(new CustomEvent('sim:done', { bubbles: true, detail: { id: sc.id, mode: P.mode } }));
    if (dn.auto && dn.guided) toast('ฝึกครบทั้ง 2 โหมดแล้ว');
  }
  async function play() {
    if (P.playing) return;
    if (P.i >= N) { P.i = 0; setCur(SIM_W / 2, SIM_H - 120); }
    if (P.mode !== 'auto') { P.mode = 'auto'; }
    P.playing = true; const id = ++P.run; draw();
    while (alive(id) && P.i < N) {
      await fxWait(Math.min(4200, (1000 + simPlain(sc.steps[P.i].tip).length * 26)) / P.speed);
      if (!alive(id)) break;
      const t = tgt(); if (!t) break;
      await moveTo(t); if (!alive(id)) break;
      await press(t); if (!alive(id)) break;
      if (!(await perform(id))) break;
    }
    if (id === P.run) { P.playing = false; draw(); }
  }
  function pause() { if (P.playing) { P.playing = false; P.run++; draw(); } }
  function go(k) { pause(); P.i = Math.max(0, Math.min(N, k)); P.wrong = 0; draw(); const t = tgt(); if (t) { const b = box(t); setCur(b.x + Math.min(b.w * 0.5, 60), b.y + b.h * 0.55); } fxAnnounce(P.i < N ? `ขั้นที่ ${P.i + 1}: ${simPlain(sc.steps[P.i].tip)}` : 'จบหน้าจอจำลอง'); }
  function setMode(m) { pause(); P.mode = m; P.i = 0; P.wrong = 0; setCur(SIM_W / 2, SIM_H - 120); draw(); fxAnnounce(m === 'guided' ? 'โหมดลองกดเอง: กดที่จุดที่มีวงแสง' : 'โหมดดูอัตโนมัติ: กดเล่น'); if (m === 'guided') { const t = tgt(); if (t) t.focus({ preventScroll: true }); } }
  // ลองกดเอง: กดถูกจุด → ไปขั้นถัดไป · กดผิด → คำใบ้ (ผิด 2 ครั้ง → วงแสงเข้ม + ข้อความชัดขึ้น)
  stage.addEventListener('click', async e => {
    if (P.mode !== 'guided' || P.i >= N || P.busy) return;
    const t = e.target.closest('[data-t]'), want = sc.steps[P.i].t;
    if (t && t.dataset.t === want) {
      P.busy = true; const b = box(t); setCur(b.x + Math.min(b.w * 0.5, 60), b.y + b.h * 0.55);
      await press(t); await perform(null); P.busy = false;
      const n = tgt(); if (n) n.focus({ preventScroll: true });
    } else {
      P.wrong++; fxSound('err'); draw(); tip.classList.remove('shake'); void tip.offsetWidth; tip.classList.add('shake');
      fxAnnounce('ยังไม่ใช่จุดนี้ · ' + simPlain(sc.steps[P.i].tip));
    }
  });
  el.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]'); if (m) return setMode(m.dataset.mode);
    const a = e.target.closest('[data-act]'); const g = e.target.closest('[data-go]');
    if (g) return go(+g.dataset.go);
    if (e.target.closest('.sim-big')) return play();
    if (!a || a.tagName === 'SELECT') return;
    const k = a.dataset.act;
    if (k === 'play') P.playing ? pause() : (P.mode === 'guided' ? setMode('auto') : 0, play());
    else if (k === 'prev') go(P.i - 1);
    else if (k === 'next') go(P.i + 1);
    else if (k === 'reset' || k === 'replay') { go(0); setCur(SIM_W / 2, SIM_H - 120); if (k === 'replay') { P.mode = 'auto'; play(); } }
    else if (k === 'try') setMode('guided');
  });
  el.querySelector('[data-act="speed"]').addEventListener('change', e => { P.speed = +e.target.value || 1; });
  el.addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(P.i + (e.key === 'ArrowRight' ? 1 : -1)); return; }
    if ((e.key === ' ' || e.key === 'k') && (e.target === vp || e.target === el)) { e.preventDefault(); e.stopPropagation(); P.playing ? pause() : play(); }
  });
  // มือถือ: ลากซ้าย/ขวาเพื่อเปลี่ยนขั้น
  let sw = null;
  vp.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sw = { x: e.clientX, y: e.clientY }; }, { passive: true });
  vp.addEventListener('pointerup', e => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.abs(dx) > 48 && Math.abs(dy) < 40) go(P.i + (dx < 0 ? 1 : -1)); }, { passive: true });
  vp.addEventListener('pointercancel', () => { sw = null; });
  if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(vp); else addEventListener('resize', layout);
  setCur(P.cx, P.cy); draw();
}
