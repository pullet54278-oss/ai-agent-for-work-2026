// Render Deep Learning lessons (from scripts/lib/deep.mjs) into app HTML + native widgets.
import { esc, ic } from './render.mjs';
import { DEEP_QUIZ } from '../../content/deep-quizzes.mjs';

// deterministic shuffle so the correct option is not always first
function shuffle(opts, a, seed) {
  const idx = opts.map((_, i) => i);
  let x = seed * 9301 + 49297;
  for (let i = idx.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return { opts: idx.map(i => opts[i]), a: idx.indexOf(a) };
}

export function quizHTML(id, title, items, note = '') {
  return `<section class="deep-w quiz" data-quiz="${id}"><h2>${ic('question_circle')}<span>${esc(title)}</span></h2>${note ? `<p class="hint">${note}</p>` : ''}
  ${items.map((q, i) => `<fieldset data-a="${q.a}"><legend>${esc(q.q)}</legend>${q.opts.map((o, k) => `<label class="qopt"><input type="radio" name="${id}-q${i}" value="${k}"><span>${esc(o)}</span></label>`).join('')}<p class="qwhy" hidden></p><span class="qwhy-t" hidden>${esc(q.why)}</span></fieldset>`).join('')}
  <div class="quiz-ctl"><button type="button" class="btn btn-primary" data-quiz-check>${ic('checkmark_circle')}<span>ตรวจคำตอบ</span></button><button type="button" class="btn btn-subtle" data-quiz-reset>${ic('arrow_clockwise')}<span>เริ่มใหม่</span></button></div>
  <p class="qres" role="status" aria-live="polite"></p></section>`;
}
export const checklistHTML = (title, items, key = '0') => `<section class="deep-w"><h2>${ic('clipboard_task')}<span>${esc(title)}</span></h2><ul class="vlist" data-k="${key}">${items.map(x => `<li><label><input type="checkbox"><span>${esc(x)}</span></label></li>`).join('')}</ul><p class="hint" data-vcount></p></section>`;

function pbHTML(n, pb, title) {
  return `<section class="deep-w deep-pb" data-deep-pb="${n}" data-variant="${pb.variant}" data-lesson="${esc(title)}"><h2>${ic('edit')}<span>${esc(pb.title)}</span></h2>${pb.intro ? `<p class="hint">${esc(pb.intro)}</p>` : ''}
  <div class="pb-grid">${pb.fields.map(f => `<div class="field"><label for="dpb${n}-${f.id}">${esc(f.label)}</label><textarea id="dpb${n}-${f.id}" data-f="${f.id}" rows="2" placeholder="${esc(f.ph)}"></textarea></div>`).join('')}</div>
  <div class="prompt"><div class="prompt-head">${ic('sparkle')}<span>Prompt ที่สร้าง (อัปเดตทันทีเมื่อพิมพ์)</span><button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code data-pb-out></code></pre></div></section>`;
}
function decisionHTML(n, d) {
  return `<section class="deep-w deep-decision" data-decision="${n}"><h2>${ic('compass_northwest')}<span>${esc(d.title)}</span></h2><p class="hint">${esc(d.intro)}</p>
  <div class="field"><label for="dd${n}">${esc(d.label)}</label><select id="dd${n}">${d.opts.map(o => `<option value="${esc(o.v)}">${esc(o.t)}</option>`).join('')}</select></div>
  <div class="dec-out" role="status" aria-live="polite">${d.opts.map(o => `<div class="dec-item" data-v="${esc(o.v)}" hidden><p><b>แนวทาง:</b> ${esc(d.choices[o.v][0])}</p><p><b>สิ่งที่ต้องตรวจ:</b> ${esc(d.choices[o.v][1])}</p><p class="hint">เป็นคำแนะนำเบื้องต้น ไม่ใช่การยืนยันสิทธิ์</p></div>`).join('')}</div></section>`;
}

export function renderDeepLesson(l, { titleOf }) {
  const out = [];
  if (l.widgets.limits) out.push(`<p class="badge-verify" role="note">${ic('warning')}<span>สถานะฟีเจอร์ License และ Preview/GA เปลี่ยนได้ · ตรวจกับบัญชีจริงก่อนสอน (รายละเอียดที่หน้าภาพรวม Deep Learning)</span></p>`);
  if (l.headExtra) out.push(`<div class="deep-sec">${l.headExtra}</div>`);
  if (l.nav) out.push(`<div class="deep-sec deep-nav">${l.nav}</div>`);
  for (const p of l.parts) {
    if (p.kind === 'html') out.push(`<div class="deep-sec">${p.html}</div>`);
    else if (p.kind === 'ref') out.push(`<a class="callout deep-ref" href="#/deep">${ic('lightbulb')}<div><b>หลักคิดร่วมของทุกบท: Input → Process → Output → Verify</b><p>ส่วนนี้เหมือนกันทุกบทใน v10 จึงรวมไว้ที่หน้าภาพรวม Deep Learning ที่เดียว</p></div>${ic('chevron_right')}</a>`);
    else if (p.kind === 'dup') out.push(`<a class="callout deep-ref dup" href="#/d/${p.of}">${ic('book_open')}<div><b>${esc(p.title)}</b><p>เนื้อหาส่วนนี้ซ้ำกับบทที่ ${p.of} “${esc(titleOf(p.of))}” · เปิดอ่านฉบับเต็มที่บทนั้น</p></div>${ic('chevron_right')}</a>`);
    else if (p.kind === 'widget') {
      const w = l.widgets[p.w];
      if (p.id) out.push(`<span class="dl-anchor" id="dl${l.n}-${p.id}"></span>`);
      if (p.w === 'pb') out.push(pbHTML(l.n, w, l.title));
      else if (p.w === 'checklist') out.push(checklistHTML(w.title, w.items, 'dl'));
      else if (p.w === 'decision') out.push(decisionHTML(l.n, w));
      else if (p.w === 'quiz') {
        if (l.n === 1) out.push(quizHTML(`dq${l.n}`, w.title, w.items, w.intro ? esc(w.intro) : ''));
        else {
          const items = (DEEP_QUIZ[l.n] || []).map(([q, opts, a, why], i) => ({ q: `${i + 1}. ${q}`, why, ...shuffle(opts, a, l.n * 7 + i) }));
          if (items.length !== 3) throw new Error('missing lesson quiz for deep lesson ' + l.n);
          out.push(quizHTML(`dq${l.n}`, 'แบบทดสอบประจำบท (3 ข้อ)', items, 'คำถามเฉพาะหัวข้อบทนี้ · แบบทดสอบหลักการร่วม 5 ข้อ (ชุดเดิมที่ซ้ำทุกบท) อยู่ที่ <a href="#/deep">หน้าภาพรวม Deep Learning</a>'));
        }
      }
    }
  }
  return out.join('\n');
}
