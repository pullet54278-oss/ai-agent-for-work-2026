// ---------- Prompt Lab แบบเครื่องผลิต (#/forge) ----------
// ซ้าย: เป้าหมาย/ข้อมูล/สิทธิ์/ผลลัพธ์ · กลาง: Prompt พิมพ์ทีละตัว · ขวา: ภาพจำลอง Agent ทำงาน · มาตรวัดความพร้อมของคำสั่ง
const FG_LEVELS = [['read', 'อ่านอย่างเดียว', 'สรุป/ตอบในแชท'], ['write', 'สร้าง/แก้ไขไฟล์', 'ได้ไฟล์ Word/Excel/PowerPoint'], ['send', 'ส่งออกไปภายนอก', 'ส่งอีเมล/แชร์']];
const FG_APPROVE = [['ask', 'ถามทุกครั้ง'], ['once', 'อนุญาตครั้งนี้'], ['always', 'อนุญาตเสมอ']];
const FG_OUT = [['chat', 'ตอบในแชท (ตาราง + สรุป)', 'read', 'chat', ''], ['word', 'ไฟล์ Word', 'write', 'document', 'ผลลัพธ์.docx'], ['excel', 'ไฟล์ Excel', 'write', 'table', 'ผลลัพธ์.xlsx'], ['ppt', 'ไฟล์ PowerPoint', 'write', 'slide_text', 'ผลลัพธ์.pptx'], ['email', 'ร่างและส่งอีเมล', 'send', 'mail', '']];
const FG_PRESETS = [
  { t: 'สรุปรายงานประจำเดือน', f: { goal: 'สรุปยอดผลิตเดือนนี้เทียบเป้าหมายและเดือนก่อน พร้อมจุดที่ต้องติดตาม', data: 'ไฟล์ยอดผลิตรายวัน.xlsx ชีต "ผลผลิต"', level: 'write', approve: 'once', out: 'word', detail: '1 หน้า สำหรับผู้บริหาร', check: true } },
  { t: 'ตรวจ Checklist ก่อนตรวจประเมิน', f: { goal: 'ตรวจความพร้อมตาม Checklist และจัดลำดับหลักฐานที่ต้องเตรียมก่อน', data: 'ไฟล์ audit-checklist.xlsx ชีต Checklist และ NC History', level: 'read', approve: 'ask', out: 'chat', detail: 'ตารางเรียงตามความเสี่ยง', check: true } },
  { t: 'ร่างอีเมลแจ้งทีม', f: { goal: 'ร่างอีเมลแจ้งทีมเรื่องตารางอบรมเดือนหน้าและหลักสูตรที่ต้องเข้า', data: 'ไฟล์ training-catalog.xlsx', level: 'send', approve: 'always', out: 'email', detail: 'สุภาพ กระชับ ไม่เกิน 10 บรรทัด', check: true } }
];
const fgRank = k => FG_LEVELS.findIndex(x => x[0] === k);
const fgNeed = f => (FG_OUT.find(x => x[0] === f.out) || FG_OUT[0])[2];
// คะแนนความพร้อมของคำสั่ง 0–100 (ฟังก์ชันบริสุทธิ์ ทดสอบแยกได้)
function scorePrompt(f) {
  const goal = (f.goal || '').trim(), data = (f.data || '').trim(), detail = (f.detail || '').trim();
  const verb = /สรุป|วิเคราะห์|ตรวจ|เปรียบเทียบ|สร้าง|ร่าง|จัดทำ|คำนวณ|แนะนำ|จัดลำดับ|ค้นหา|ตอบ|ทำ|แปลง|summari[sz]e|analy[sz]e|check|compare|create|draft/i;
  const items = [];
  const g = goal.length >= 15 && verb.test(goal) ? 25 : goal.length >= 6 ? 10 : 0;
  items.push(['เป้าหมายชัด (มีคำกริยา + สิ่งที่ส่งมอบ)', g, 25]);
  const d = data.length >= 8 && /ไฟล์|\.xlsx|\.xls|\.csv|\.pdf|\.docx|ตาราง|ชีต|เว็บ|รายงาน|ข้อมูล|อีเมล/i.test(data) ? 20 : data.length >= 4 ? 10 : 0;
  items.push(['ระบุแหล่งข้อมูล', d, 20]);
  const o = (f.out ? 10 : 0) + (detail.length >= 4 ? 10 : 0);
  items.push(['รูปแบบผลลัพธ์ชัด', o, 20]);
  const c = f.check ? 15 : 0;
  items.push(['มีบรรทัดตรวจสอบ / ห้ามแต่งข้อมูล', c, 15]);
  const need = fgRank(fgNeed(f)), have = fgRank(f.level || 'read');
  const under = have < need, overLevel = have > need, always = f.approve === 'always';
  let pm = under ? 0 : overLevel ? 5 : 20; if (always && pm > 10) pm = 10;
  items.push(['สิทธิ์ต่ำที่สุดที่พอใช้', pm, 20]);
  const score = items.reduce((a, x) => a + x[1], 0);
  const over = overLevel || always;
  return { score, items, over, under, overLevel, always, need: FG_LEVELS[need][0], tone: over ? 'over' : under || score < 50 ? 'low' : score < 80 ? 'mid' : 'high' };
}
function forgePrompt(f) {
  const L = (FG_LEVELS.find(x => x[0] === f.level) || FG_LEVELS[0]), A = (FG_APPROVE.find(x => x[0] === f.approve) || FG_APPROVE[0]), O = (FG_OUT.find(x => x[0] === f.out) || FG_OUT[0]);
  return `งาน: ${f.goal.trim() || '[เป้าหมายของงาน]'}
ข้อมูล: ${f.data.trim() || '[แหล่งข้อมูล]'} (แนบไฟล์ในแชทนี้)
สิทธิ์ที่ให้: ${L[1]} · การขออนุญาต: ${A[1]}
รูปแบบผลลัพธ์: ${O[1]}${f.detail.trim() ? ' · ' + f.detail.trim() : ''}${f.check ? `
การตรวจสอบ:
- อ้างอิงที่มาของทุกตัวเลขและทุกประเด็น
- ห้ามแต่งข้อมูลที่ไม่มีในไฟล์ ถ้าไม่พบให้ตอบว่า "ไม่พบในข้อมูล"
- ถามฉันก่อนทำสิ่งที่เกินสิทธิ์ที่ให้ไว้` : ''}`;
}
function fgSteps(f, r) {
  const O = FG_OUT.find(x => x[0] === f.out) || FG_OUT[0];
  const S = [['document_search', `อ่านข้อมูล: ${f.data.trim() || '—'}`, ''], ['data_trending', 'วิเคราะห์ตามเป้าหมาย', '']];
  if (r.under) return [...S, ['dismiss_circle', `หยุด: สิทธิ์ไม่พอ (งานนี้ต้อง "${FG_LEVELS[fgRank(r.need)][1]}")`, 'stop']];
  if (f.level !== 'read' || f.out === 'email') S.push(r.always ? ['warning', 'ทำต่อทันทีโดยไม่ถาม (อนุญาตเสมอ)', 'warn'] : ['shield_checkmark', 'ขออนุญาตก่อนสร้างไฟล์/ส่งออก', 'ok']);
  if (f.out === 'email') S.push(['mail', r.always ? 'ส่งอีเมลออกไปทันที' : 'ร่างอีเมลไว้ รอคุณตรวจและกดส่ง', r.always ? 'warn' : '']);
  else if (f.out === 'chat') S.push(['chat', 'ตอบในแชท: ตาราง + สรุป 5 บรรทัด', '']);
  else S.push([O[3], 'สร้างไฟล์ผลงาน', '', O[4]]);
  return S;
}
let fgForm = { ...FG_PRESETS[0].f }, fgShown = '', fgTimer = 0, fgRun = 0;
function renderForge() {
  cur = null;
  const sel = (id, k, opts) => `<select id="${id}" data-fg="${k}">${opts.map(o => `<option value="${o[0]}" ${fgForm[k] === o[0] ? 'selected' : ''}>${esc(o[1])}${o[2] && k === 'level' ? ' · ' + esc(o[2]) : ''}</option>`).join('')}</select>`;
  setMain(`<header class="ph" style="--dc:var(--accent)">${art('beaker')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>Prompt Lab เครื่องผลิต</span></nav><h1>Prompt Lab เครื่องผลิต</h1><p class="short">กรอก 4 เรื่อง แล้วดู Prompt ประกอบตัวเอง พร้อมภาพจำลองว่า Agent จะทำอะไร · มาตรวัดเตือนเมื่อให้สิทธิ์สูงเกินงาน</p>
  <div class="ph-meta">${FG_PRESETS.map((p, i) => `<button type="button" class="btn btn-subtle" data-fg-preset="${i}">${ic('sparkle')}<span>${esc(p.t)}</span></button>`).join('')}</div></header>
  <div class="fg-grid">
    <div class="card fg-in">
      <div class="field"><label for="fgGoal">1. เป้าหมาย</label><textarea id="fgGoal" data-fg="goal" rows="3" placeholder="เช่น สรุปยอดผลิตเดือนนี้เทียบเป้าหมาย">${esc(fgForm.goal)}</textarea></div>
      <div class="field"><label for="fgData">2. ข้อมูล</label><input id="fgData" data-fg="data" value="${esc(fgForm.data)}" placeholder="เช่น ไฟล์ยอดผลิตรายวัน.xlsx"></div>
      <div class="field"><label for="fgLevel">3. สิทธิ์ที่ให้ Agent</label>${sel('fgLevel', 'level', FG_LEVELS)}</div>
      <div class="field"><label for="fgApprove">การขออนุญาต</label>${sel('fgApprove', 'approve', FG_APPROVE)}</div>
      <div class="field"><label for="fgOut">4. ผลลัพธ์</label>${sel('fgOut', 'out', FG_OUT)}</div>
      <div class="field"><label for="fgDetail">รายละเอียดผลลัพธ์</label><input id="fgDetail" data-fg="detail" value="${esc(fgForm.detail)}" placeholder="เช่น 1 หน้า สำหรับผู้บริหาร"></div>
      <label class="pa-inc"><input type="checkbox" data-fg="check" ${fgForm.check ? 'checked' : ''}><span>ให้ตรวจสอบที่มาและห้ามแต่งข้อมูล</span></label>
    </div>
    <div class="card fg-mid"><div class="fg-meter" data-fg-meter></div><div class="prompt"><div class="prompt-head">${ic('sparkle')}<span>Prompt</span><button type="button" class="btn btn-subtle" data-fg-skip>${ic('next')}<span>ข้ามการพิมพ์</span></button><button type="button" class="btn btn-subtle btn-copy" data-fg-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0" data-fg-out aria-live="off"></pre></div><p class="hint" data-fg-len></p></div>
    <div class="card fg-agent"><div class="fg-ah"><b>${ic('bot')}<span>Agent จะทำอะไร</span></b><button type="button" class="btn btn-outline" data-fg-run>${ic('play')}<span>จำลองการทำงาน</span></button></div><ol class="fg-steps" data-fg-steps></ol><p class="fg-done" data-fg-done hidden></p><p class="hint">${ic('info')} ภาพจำลองเพื่อการเรียน · ชื่อปุ่มขออนุญาตในบัญชีจริงอาจต่างจากนี้ · ตรวจกับบัญชีจริงก่อนสอน</p></div>
  </div>${copyLine()}`, 'Prompt Lab เครื่องผลิต');
  const root = $('#main .wrap');
  const out = $('[data-fg-out]', root);
  fgShown = ''; out.textContent = '';
  const meter = () => {
    const r = scorePrompt(fgForm), lbl = { over: 'สิทธิ์สูงเกินงาน', low: 'ยังไม่พร้อม', mid: 'พอใช้', high: 'พร้อมใช้' }[r.tone];
    $('[data-fg-meter]', root).innerHTML = `<div class="fg-mh"><b>ความพร้อมของคำสั่ง</b><span class="fg-score tone-${r.tone}" data-fg-score>${r.score}</span></div>
      <div class="fg-bar tone-${r.tone}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r.score}" aria-label="ความพร้อมของคำสั่ง ${r.score} คะแนน · ${lbl}"><i style="width:${r.score}%"></i></div><p class="fg-lbl tone-${r.tone}">${esc(lbl)}</p>
      <ul class="fg-items">${r.items.map(([t, g, m]) => `<li class="${g === m ? 'ok' : g ? 'part' : 'no'}">${ic(g === m ? 'checkmark_circle' : g ? 'warning' : 'dismiss_circle')}<span>${esc(t)}</span><b>${g}/${m}</b></li>`).join('')}</ul>
      ${r.over ? `<div class="fg-warn tone-over" data-fg-warn>${ic('warning')}<div><b>ให้สิทธิ์สูงเกินงาน</b><p>${r.overLevel ? `งานนี้ต้องการแค่ "${esc(FG_LEVELS[fgRank(r.need)][1])}" ` : ''}${r.always ? 'การเลือก "อนุญาตเสมอ" ทำให้ Agent ทำต่อโดยไม่ถาม ' : ''}· ลดสิทธิ์ให้พอดีงานเพื่อความปลอดภัย</p><button type="button" class="btn btn-outline" data-fg-fix>${ic('shield_checkmark')}<span>ลดสิทธิ์ให้พอดีงาน</span></button></div></div>` : ''}
      ${r.under ? `<div class="fg-warn tone-low" data-fg-warn>${ic('dismiss_circle')}<div><b>สิทธิ์ไม่พอ</b><p>ผลลัพธ์ที่เลือกต้อง "${esc(FG_LEVELS[fgRank(r.need)][1])}" · Agent จะทำไม่สำเร็จ</p><button type="button" class="btn btn-outline" data-fg-fix>${ic('shield_checkmark')}<span>ปรับสิทธิ์ให้พอดีงาน</span></button></div></div>` : ''}`;
    return r;
  };
  const steps = (animate) => {
    const r = scorePrompt(fgForm), S = fgSteps(fgForm, r), list = $('[data-fg-steps]', root), done = $('[data-fg-done]', root), id = ++fgRun;
    list.innerHTML = S.map(([i, t, tone, file]) => `<li class="${tone ? 'tone-' + tone : ''}">${ic(i)}<span>${esc(t)}${file ? `<span class="sm-chip out">${ic('document_text')}${esc(file)}</span>` : ''}</span></li>`).join('');
    done.hidden = true;
    const finish = () => { if (id !== fgRun) return; done.hidden = false; done.className = 'fg-done ' + (r.under ? 'tone-low' : 'tone-ok'); done.innerHTML = r.under ? `${ic('dismiss_circle')}<span>ทำไม่สำเร็จ · ปรับสิทธิ์ก่อน</span>` : `${ic('checkmark_circle')}<span>เสร็จแล้ว (Turn complete)</span>`; if (animate) fxSound(r.under ? 'err' : 'ok'); };
    const lis = $$('li', list);
    if (!animate || reduceMotion()) { lis.forEach(li => li.classList.add('in')); finish(); return; }
    lis.forEach((li, k) => setTimeout(() => { if (id === fgRun) { li.classList.add('in'); fxSound('click'); } }, 350 + k * 450));
    setTimeout(finish, 350 + lis.length * 450);
  };
  const typeTo = () => {
    const target = forgePrompt(fgForm); clearTimeout(fgTimer);
    $('[data-fg-len]', root).textContent = `${target.length.toLocaleString('th-TH')} ตัวอักษร`;
    let k = 0; while (k < fgShown.length && k < target.length && fgShown[k] === target[k]) k++;
    fgShown = fgShown.slice(0, k);
    if (reduceMotion()) { fgShown = target; out.textContent = target; out.classList.remove('typing'); steps(false); return; }
    const parts = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(target.slice(k))].map(x => x.segment) : [...target.slice(k)];
    let j = 0; out.classList.add('typing');
    const tick = () => {
      if (!out.isConnected) return;
      const n = Math.max(1, Math.ceil(parts.length / 120));
      fgShown += parts.slice(j, j + n).join(''); j += n; out.textContent = fgShown;
      if (j < parts.length) fgTimer = setTimeout(tick, 14); else { out.classList.remove('typing'); steps(true); }
    };
    tick();
  };
  const changed = () => { meter(); clearTimeout(fgTimer); fgTimer = setTimeout(typeTo, 250); };
  root.addEventListener('input', e => { const el = e.target.closest('[data-fg]'); if (!el) return; fgForm[el.dataset.fg] = el.type === 'checkbox' ? el.checked : el.value; changed(); });
  root.addEventListener('change', e => { const el = e.target.closest('select[data-fg]'); if (!el) return; fgForm[el.dataset.fg] = el.value; changed(); });
  root.addEventListener('click', e => {
    const p = e.target.closest('[data-fg-preset]'); if (p) { fgForm = { ...FG_PRESETS[+p.dataset.fgPreset].f }; renderForge(); return; }
    if (e.target.closest('[data-fg-skip]')) { clearTimeout(fgTimer); fgShown = forgePrompt(fgForm); out.textContent = fgShown; out.classList.remove('typing'); steps(false); return; }
    const cp = e.target.closest('[data-fg-copy]'); if (cp) { copyText(forgePrompt(fgForm), cp, out); return; }
    if (e.target.closest('[data-fg-run]')) { steps(true); return; }
    if (e.target.closest('[data-fg-fix]')) { fgForm.level = scorePrompt(fgForm).need; if (fgForm.approve === 'always') fgForm.approve = 'once'; $('#fgLevel').value = fgForm.level; $('#fgApprove').value = fgForm.approve; changed(); toast('ปรับสิทธิ์ให้พอดีงานแล้ว'); }
  });
  meter(); typeTo(); renderTOC();
}
window.__fx.scorePrompt = scorePrompt;
window.__fx.forgePrompt = forgePrompt;
