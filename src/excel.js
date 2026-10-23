// ---------- AI + Excel Formula Mastery (inserted into app.js at build) ----------
let excelP = null;
function loadExcel() {
  if (!excelP) excelP = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'excel-data.js?v=' + encodeURIComponent(D.meta.buildId); sc.onload = () => { for (const p of XP) p.html = window.__EXCEL.html[p.n]; res(window.__EXCEL); }; sc.onerror = () => { excelP = null; rej(new Error('excel-data.js')); }; document.head.appendChild(sc); });
  return excelP;
}
const X_LV = [['b', 'Beginner', 'calculator', 'ระดับ 1'], ['i', 'Intermediate', 'table', 'ระดับ 2'], ['a', 'Advanced', 'flowchart', 'ระดับ 3']];
const xch = k => XCH.find(c => c.key === 'x' + k);
function renderExcelHome() {
  cur = null;
  const sc = store.get('cpa26-quiz', {});
  const pct = c => Math.round(chapterDone(c) / c.pages.length * 100);
  const tools = [['prompts', 'sparkle', 'Prompt Library', 'Prompt ต้นฉบับ B01–A08 + Framework Builder'], ['formulas', 'beaker', 'Formula Lab', 'สูตรทั้งหมดพร้อมกรณีทดสอบ + ตัวลองสูตร'], ['dashboard', 'data_bar_vertical', 'Interactive Dashboard', 'KPI · Filter · Chart · Export · อัปโหลดไฟล์'], ['workbook', 'document_text', 'ไฟล์ Excel ตัวอย่าง', 'sample-workbook.xlsx 6 ชีตหลัก']];
  setMain(`<div style="${gvar('x0')}"><header class="ph ph-module">${illus('x0', 'table', 'ph-art')}<nav class="crumb"><a href="#/">${ic('home')} หน้าแรก</a><span>›</span><span>AI + Excel Formula Mastery</span></nav><h1>AI + Excel Formula Mastery</h1><p class="short">หลักสูตร 3 ระดับ: เปลี่ยนภาษาคนเป็นสูตร → สูตรซ้อนหลายตาราง → LET, LAMBDA, Power Query, Automation และ Interactive Dashboard · ทุกสูตรบอกเวอร์ชัน ข้อสมมติ และกรณีทดสอบ</p>
  <div class="ph-meta"><a class="btn btn-primary" href="#/x/start">${ic('play')}<span>เริ่มที่ Course Map</span></a><span class="pill g">${ic('checkmark_circle')}<span>เรียนแล้ว ${XP.filter(p => done.has(p.n)).length}/${XP.length} หน้า</span></span></div></header>
  <section class="x-levels">${X_LV.map(([k, name, icn, lab]) => { const c = xch(k); const pre = sc[`xq-${k}-pre`], post = sc[`xq-${k}-post`]; return `<a class="x-level" href="#/x/${k}-overview" style="${gvar('x' + k)}"><span class="cc-art">${illus('x' + k, icn, 'cc-svg')}</span><span class="x-lv-b"><small>${lab} · ${name}</small><b>${esc(c.en)}</b><span class="tr-meta">${c.pages.length} หน้า · เรียนแล้ว ${pct(c)}%${pre != null ? ` · ก่อนเรียน ${pre}/10` : ''}${post != null ? ` · หลังเรียน ${post}/10` : ''}</span><span class="bar" aria-hidden="true"><i style="width:${pct(c)}%"></i></span></span></a>`; }).join('')}</section>
  <h2 class="sec">${ic('toolbox')}<span>เครื่องมือ</span></h2><div class="tools x-tools">${tools.map(([s, i, t, d]) => `<a class="tool" href="#/x/${s}"><span class="ti">${ic(i)}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></a>`).join('')}</div>
  ${XCH.map(c => `<section class="cgroup" style="${gvar(c.key)}"><h2 class="sec">${ic(c.icon)}<span>${esc(c.title)}</span></h2><p>${esc(c.desc)}</p><ul class="toc-cards">${c.pages.map(itemCardHTML).join('')}</ul></section>`).join('')}${copyLine()}</div>`, 'AI + Excel Formula Mastery');
  renderTOC();
}
function mountExcel(root) {
  $$('[data-xlib]', root).forEach(initXLib);
  $$('[data-xpb]', root).forEach(initXPB);
  $$('[data-xfl]', root).forEach(initXFormulaFilter);
  $$('[data-xlab]', root).forEach(initXLab);
  $$('[data-xdash]', root).forEach(el => loadExcel().then(X => initXDash(el, X)));
  $$('[data-xq-compare]', root).forEach(initXCompare);
}
// Prompt Library: search + level chips
function initXLib(box) {
  const page = box.closest('.content'); const q = $('#xpQ', box); let lv = '';
  const blocks = () => $$('.prompt', page).filter(p => !p.closest('[data-xpb]'));
  const draw = () => {
    const s = q.value.trim().toLowerCase(); let n = 0;
    $$('[data-xlv]', page).forEach(w => { w.hidden = !!lv && w.dataset.xlv !== lv && w.dataset.xlv !== 'core'; });
    blocks().forEach(b => { const hit = !s || b.textContent.toLowerCase().includes(s); b.hidden = !hit; if (hit && !b.closest('[hidden]')) n++; });
    $('[data-xp-count]', box).textContent = `แสดง ${n} Prompt`;
    $$('[data-xf]', box).forEach(c => c.setAttribute('aria-pressed', c.dataset.xf === lv));
  };
  q.addEventListener('input', draw);
  $$('[data-xf]', box).forEach(c => c.addEventListener('click', () => { lv = c.dataset.xf; draw(); }));
  draw();
}
// Prompt Framework builder (spec section 2)
function initXPB(box) {
  const key = 'cpa26-xpb'; const sv = store.get(key, {});
  const F = [['goal', 'เป้าหมาย', 'เช่น สรุปยอด Feed ต่อฟาร์มต่อเดือน'], ['data', 'ข้อมูล', 'ชื่อไฟล์/ชีต, คอลัมน์, ชนิดข้อมูล, ตัวอย่าง 3–5 แถว'], ['ver', 'เวอร์ชัน', ''], ['sep', 'รูปแบบสูตร', ''], ['rules', 'กฎธุรกิจ', 'นิยาม KPI, เงื่อนไข, หน่วย, การจัดการค่าที่ขาด/ข้อมูลซ้ำ'], ['size', 'ขนาดข้อมูล', 'จำนวนแถว/จำนวนไฟล์'], ['out', 'ผลลัพธ์', 'ตำแหน่งเซลล์, ตาราง, รายงาน, Dashboard']];
  const VER = ['Microsoft 365', 'Excel 2024', 'Excel 2021', 'Excel 2019', 'Excel Web'];
  box.innerHTML = `<section class="deep-w"><h2>${ic('edit')}<span>สร้าง Prompt จาก Framework มาตรฐาน</span></h2><p class="hint">กรอกเฉพาะข้อมูลงานของคุณ ระบบเติมโครง 8 ข้อตามต้นฉบับข้อ 2 ให้ (บันทึกในเบราว์เซอร์นี้)</p><div class="pb-grid">${F.map(([k, l, ph]) => `<div class="field"><label for="xpb-${k}">${l}</label>${k === 'ver' ? `<select id="xpb-${k}" data-f="${k}">${VER.map(v => `<option>${v}</option>`).join('')}</select>` : k === 'sep' ? `<select id="xpb-${k}" data-f="${k}"><option value=",">คั่นอาร์กิวเมนต์ด้วย ,</option><option value=";">คั่นอาร์กิวเมนต์ด้วย ;</option></select>` : `<textarea id="xpb-${k}" data-f="${k}" rows="2" placeholder="${esc(ph)}"></textarea>`}</div>`).join('')}</div>
  <div class="prompt"><div class="prompt-head">${ic('sparkle')}<span>Prompt ที่สร้าง</span><button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code data-xpb-out></code></pre></div></section>`;
  const els = $$('[data-f]', box);
  els.forEach(e => { if (sv[e.dataset.f] != null) e.value = sv[e.dataset.f]; });
  const gen = () => {
    const v = {}; els.forEach(e => { v[e.dataset.f] = e.value.trim(); });
    $('[data-xpb-out]', box).textContent = ['บทบาท: คุณเป็นผู้เชี่ยวชาญ Microsoft Excel และ Data Analytics', `เป้าหมาย: ${v.goal || '[ผลลัพธ์ที่ต้องการ]'}`, `ข้อมูล: ${v.data || '[ชื่อไฟล์/ชีต, คอลัมน์, ชนิดข้อมูล, ตัวอย่าง 3–5 แถว]'}`, `เวอร์ชัน: ${v.ver}`, `รูปแบบสูตร: คั่นอาร์กิวเมนต์ด้วย ${v.sep}`, `กฎธุรกิจ: ${v.rules || '[นิยาม KPI, เงื่อนไข, หน่วย, การจัดการค่าที่ขาด/ข้อมูลซ้ำ]'}`, `ขนาดข้อมูล: ${v.size || '[จำนวนแถว/จำนวนไฟล์]'}`, `ผลลัพธ์: ${v.out || '[ตำแหน่งเซลล์, ตาราง, รายงาน, Dashboard]'}`, '', 'โปรด:', '1) วิเคราะห์เป้าหมายและโครงสร้างข้อมูล', '2) เลือกฟังก์ชันหรือเครื่องมือที่เหมาะสม พร้อมเหตุผล', '3) ให้สูตรพร้อมวาง และระบุตำแหน่งที่จะวาง', '4) อธิบายสูตรทีละส่วนและแสดงตัวอย่าง Input → Output', '5) ทดสอบค่าปกติ ค่าว่าง ข้อมูลซ้ำ ขอบเขต และ Error', '6) เสนอทางเลือกสำหรับ Excel รุ่นเก่า', '7) ประเมินความเร็วและความเสี่ยงด้านคุณภาพข้อมูล', '8) ระบุสิ่งที่ต้องตรวจด้วยมนุษย์ก่อนใช้งานจริง'].join('\n');
    store.set(key, v);
  };
  els.forEach(e => e.addEventListener('input', gen)); els.forEach(e => e.addEventListener('change', gen)); gen();
}
function initXFormulaFilter(box) {
  const page = box.closest('.content'); const q = $('#xfQ', box), l = $('#xfL', box), v = $('#xfV', box);
  const draw = () => { const s = q.value.trim().toLowerCase(); let n = 0; $$('.xf-wrap', page).forEach(w => { const ok = (!l.value || w.dataset.xlv === l.value) && (!v.value || w.dataset.ver === v.value) && (!s || w.textContent.toLowerCase().includes(s)); w.hidden = !ok; if (ok) n++; }); $('[data-xf-count]', box).textContent = `แสดง ${n} สูตร`; };
  [q, l, v].forEach(e => e.addEventListener('input', draw)); draw();
}
function initXCompare(box) {
  const k = box.dataset.xqCompare;
  const draw = () => { const sc = store.get('cpa26-quiz', {}); const pre = sc[`xq-${k}-pre`], post = sc[`xq-${k}-post`]; const bar = (lab, v) => `<div class="x-cmp-r"><span>${lab}</span><span class="bar" aria-hidden="true"><i style="width:${v == null ? 0 : v * 10}%"></i></span><b>${v == null ? 'ยังไม่ทำ' : v + '/10'}</b></div>`; box.innerHTML = `<h3 class="sub">${ic('data_bar_vertical')}<span>เทียบคะแนนก่อน/หลังเรียน (คะแนนสูงสุดที่ทำได้)</span></h3>${bar('ก่อนเรียน', pre)}${bar('หลังเรียน', post)}${pre != null && post != null ? `<p class="hint">${post > pre ? `พัฒนาขึ้น ${post - pre} คะแนน` : post === pre ? 'คะแนนเท่าเดิม ลองทบทวนบทเรียนที่ตอบผิด' : 'ลองทบทวนบทเรียนแล้วทำใหม่'}</p>` : ''}`; };
  draw();
  box.closest('.content').addEventListener('click', e => { if (e.target.closest('[data-quiz-check]')) setTimeout(draw, 0); });
}

// ---------- Formula Lab: interactive calculators (Excel semantics re-implemented in JS) ----------
const xnum = s => { const t = String(s).trim(); if (t === '') return null; const n = Number(t.replace(/,/g, '')); return Number.isFinite(n) ? n : NaN; };
const xfmt = (v, d = 2) => typeof v === 'number' ? (Number.isInteger(v) ? fmt(v, 0) : fmt(v, d, d)) : esc(v);
const XSTAT = {
  mean: a => a.reduce((s, x) => s + x, 0) / a.length,
  median: a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
  sds: a => { const m = XSTAT.mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); },
  pinc: (a, p) => { const s = [...a].sort((x, y) => x - y), h = (s.length - 1) * p, lo = Math.floor(h); return s[lo] + (h - lo) * ((s[Math.min(lo + 1, s.length - 1)]) - s[lo]); }
};
const XLAB = [
  { k: 'ifand', t: 'IF + AND (B02)', f: '=IF(AND(A2>50,B2="ผ่าน"),100,0)', ui: [['A2', 'number', '51'], ['B2', 'text', 'ผ่าน']], run: v => { const a = xnum(v.A2); return { r: (a !== null && !Number.isNaN(a) && a > 50 && v.B2 === 'ผ่าน') ? 100 : 0, note: v.A2.trim() === '' ? 'A2 ว่าง: Excel มองเป็น 0 จึงไม่มากกว่า 50' : Number.isNaN(a) ? 'A2 เป็นข้อความ: การเปรียบเทียบข้อความกับตัวเลขใน Excel ให้ TRUE เสมอ (ข้อความ > ตัวเลข) — ตรวจชนิดข้อมูลด้วย ISNUMBER ก่อน' : a > 50 && v.B2 === 'ผ่าน' ? 'A2 > 50 และ B2 = "ผ่าน" ครบทั้งสองเงื่อนไข → 100' : a === 50 ? 'A2=50 ไม่ผ่าน เพราะเงื่อนไขคือ "มากกว่า" ไม่ใช่ "มากกว่าหรือเท่ากับ"' : v.B2 !== 'ผ่าน' ? 'B2 ไม่ใช่ "ผ่าน" (รวมกรณีว่าง) → 0' : 'A2 ไม่มากกว่า 50 → 0' }; }, fix: v => { const a = xnum(v.A2); return Number.isNaN(a) && v.B2 === 'ผ่าน' ? 100 : null; } },
  { k: 'age', t: 'อายุจากวันที่ Day 0 / Day 1 (B05)', f: '=B2-A2  ·  =B2-A2+1', ui: [['A2', 'date', '2026-10-01'], ['B2', 'date', '2026-10-22']], run: v => { const a = Date.parse(v.A2), b = Date.parse(v.B2); if (!a || !b) return { r: '#VALUE!', note: 'ต้องเป็นวันที่จริง ไม่ใช่ข้อความ' }; const d = Math.round((b - a) / 864e5); return { r: `Day 0: ${d} วัน · Day 1: ${d + 1} วัน`, note: d < 0 ? 'B2 อยู่ก่อน A2 — ควรแสดงคำเตือน เช่น =IF(B2<A2,"วันที่ประเมินก่อนวันเริ่ม",B2-A2)' : 'เลือกนิยาม Day 0 หรือ Day 1 ตามกฎธุรกิจให้ตรงกันทั้งองค์กร' }; } },
  { k: 'split', t: 'แยกรหัส BR-2026-001 (B04)', f: '=TEXTSPLIT(A2,"-")  ·  รุ่นเก่า: LEFT / MID / RIGHT', ui: [['A2', 'text', 'BR-2026-001']], run: v => { const s = v.A2.trim(); const p = s.split('-'); const ok = /^[A-Z]{2}-\d{4}-\d{3}$/.test(s); return { r: p.map(x => `[${x}]`).join(' '), note: ok ? 'เก็บ "001" เป็นข้อความเพื่อรักษาศูนย์นำหน้า (ถ้าแปลงเป็นตัวเลขจะเหลือ 1)' : `รูปแบบไม่ตรง XX-YYYY-NNN (${p.length} ส่วน) — ควรตรวจก่อน เช่น =IF(LEN(A2)-LEN(SUBSTITUTE(A2,"-",""))<>2,"รูปแบบผิด",...)` }; } },
  { k: 'cv', t: 'สถิติน้ำหนัก n · Mean · SD · %CV · P10/P90 · IQR (I03/A01)', f: '=IF(AVERAGE(B2:B101)=0,NA(),STDEV.S(B2:B101)/AVERAGE(B2:B101)*100)', ui: [['B2:B101', 'area', '940, 955, 910, 1002, 968, 921, 987, 899, 1010, 944']], run: v => { const raw = v['B2:B101'].split(/[\s,;]+/).filter(Boolean); const a = raw.map(xnum).filter(x => x !== null && !Number.isNaN(x)); const bad = raw.length - a.length; if (a.length < 2) return { r: '#DIV/0! (n < 2)', note: 'STDEV.S ต้องมีอย่างน้อย 2 ค่า' }; const m = XSTAT.mean(a); if (m === 0) return { r: '#N/A', note: 'ค่าเฉลี่ยเป็นศูนย์ — หารไม่ได้' }; const sd = XSTAT.sds(a); return { r: `n=${a.length} · Mean=${fmt(m, 2, 2)} · Median=${fmt(XSTAT.median(a), 2, 2)} · SD=${fmt(sd, 2, 2)} · CV%=${fmt(sd / m * 100, 2, 2)} · P10=${fmt(XSTAT.pinc(a, .1), 2, 2)} · P90=${fmt(XSTAT.pinc(a, .9), 2, 2)} · IQR=${fmt(XSTAT.pinc(a, .75) - XSTAT.pinc(a, .25), 2, 2)}`, note: (bad ? `ข้ามค่าที่ไม่ใช่ตัวเลข ${bad} ค่า (Excel ข้ามข้อความในช่วงเซลล์เช่นกัน) · ` : '') + 'ห้ามตีความ %CV เป็นเกณฑ์มาตรฐานสายพันธุ์โดยไม่มีข้อมูลอ้างอิง' }; } },
  { k: 'lookup', t: 'ค้นหา FCR + ตรวจรหัสซ้ำ (I01)', f: '=IF(COUNTIF(A2:A1000,G2)>1,"รหัสซ้ำ",XLOOKUP(G2,A2:A1000,D2:D1000,"ไม่พบฟาร์ม"))', ui: [['Master (Farm ID, FCR)', 'area', 'F001, 1.62\nF002, 1.66\nF003, 1.59\nF003, 1.61'], ['G2', 'text', 'F003']], run: v => { const rows = v['Master (Farm ID, FCR)'].split('\n').map(l => l.split(',').map(s => s.trim())).filter(r => r[0]); const key = v.G2.trim().toLowerCase(); const hit = rows.filter(r => r[0].toLowerCase() === key); return { r: hit.length > 1 ? 'รหัสซ้ำ' : hit.length ? hit[0][1] : 'ไม่พบฟาร์ม', note: 'XLOOKUP/COUNTIF ไม่สนตัวพิมพ์เล็ก-ใหญ่ · ถ้ามีรหัสซ้ำ สูตรนี้เตือนแทนการเลือกแถวแรกเงียบ ๆ' }; } },
  { k: 'sumifs', t: 'SUMIFS ช่วงวันที่ + ประเภทอาหาร (I02)', f: '=SUMIFS(D:D,A:A,"F001",C:C,"Starter",B:B,">="&DATE(2026,10,1),B:B,"<"&DATE(2026,11,1))', ui: [['ข้อมูล (Farm, วันที่-เวลา, Type, kg)', 'area', 'F001, 2026-09-30 23:00, Starter, 500\nF001, 2026-10-01 06:00, Starter, 520\nF001, 2026-10-31 18:30, Starter, 610\nF001, 2026-11-01 00:00, Starter, 640\nF001, 2026-10-15 08:00, Grower, 700\nF002, 2026-10-10 07:00, Starter, 480']], run: v => { let s = 0, n = 0; for (const l of v['ข้อมูล (Farm, วันที่-เวลา, Type, kg)'].split('\n')) { const [f, d, t, kg] = l.split(',').map(x => x && x.trim()); const ts = Date.parse((d || '').replace(' ', 'T')); if (f === 'F001' && t === 'Starter' && ts >= Date.parse('2026-10-01T00:00') && ts < Date.parse('2026-11-01T00:00')) { s += xnum(kg) || 0; n++; } } return { r: `${fmt(s, 2)} kg (${n} แถว)`, note: 'ใช้ "< วันที่ 1 เดือนถัดไป" จึงนับ 31 ต.ค. 18:30 ได้ แม้เซลล์มีเวลา และไม่นับ 1 พ.ย. 00:00' }; } },
  { k: 'fcr', t: 'CALC_FCR ด้วย LAMBDA (A02)', f: '=LAMBDA(feed_kg,weight_gain_kg,IF(AND(ISNUMBER(feed_kg),ISNUMBER(weight_gain_kg),weight_gain_kg>0),feed_kg/weight_gain_kg,NA()))', ui: [['feed_kg', 'text', '3600'], ['weight_gain_kg', 'text', '2250']], run: v => { const a = xnum(v.feed_kg), b = xnum(v.weight_gain_kg); const ok = a !== null && b !== null && !Number.isNaN(a) && !Number.isNaN(b) && b > 0; return { r: ok ? fmt(a / b, 3, 3) : '#N/A', note: 'Unit tests: (3600,2250)=1.600 · (3600,0)=#N/A · ("x",2250)=#N/A · ยืนยันนิยาม FCR และวิธีคำนวณ Weight Gain ตามมาตรฐานองค์กรก่อนใช้งานจริง' }; } },
  { k: 'dq', t: 'Data Quality Status (I06)', f: '=IF(A2="","ERROR",IF(NOT(ISNUMBER(C2)),"ERROR",IF(C2<0,"ERROR",IF(B2>ReportDate,"ERROR",IF(COUNTIFS(...)>1,"WARNING",IF(D2="","WARNING","PASS"))))))', ui: [['Farm_ID (A2)', 'text', 'F001'], ['Date (B2)', 'date', '2026-10-08'], ['Body_Weight_g (C2)', 'text', '940'], ['Feed_Cum_kg (D2)', 'text', '3600'], ['ซ้ำ Farm+Date?', 'select:ไม่ซ้ำ|ซ้ำ', 'ไม่ซ้ำ']], run: v => { const w = xnum(v['Body_Weight_g (C2)']); const d = Date.parse(v['Date (B2)']); const rep = Date.parse(D.excelReportDate || '2026-10-31'); const out = !v['Farm_ID (A2)'].trim() ? ['ERROR', 'ไม่มี Farm_ID'] : (w === null || Number.isNaN(w)) ? ['ERROR', 'Body_Weight_g ไม่ใช่ตัวเลข'] : w < 0 ? ['ERROR', 'ค่าติดลบ'] : d > rep ? ['ERROR', 'วันที่เกินวันรายงาน'] : v['ซ้ำ Farm+Date?'] === 'ซ้ำ' ? ['WARNING', 'ข้อมูลซ้ำ (Farm_ID + Date)'] : !v['Feed_Cum_kg (D2)'].trim() ? ['WARNING', 'Feed_Cum_kg ว่าง'] : ['PASS', 'ผ่าน']; return { r: out[0], note: `Reason: ${out[1]} · กฎตรวจรูปแบบ (ว่าง/ชนิด/ติดลบ/วันที่) แยกจากกฎธุรกิจ (ซ้ำ/ค่าว่างที่ให้ผู้รับผิดชอบตรวจ)` }; } }
];
function initXLab(box) {
  box.innerHTML = `<div class="tabs" data-tabs><div class="tablist" role="tablist" aria-label="ตัวลองสูตร">${XLAB.map((x, i) => `<button type="button" role="tab" id="xlt-${x.k}" aria-controls="xlp-${x.k}" aria-selected="${!i}" tabindex="${i ? -1 : 0}">${esc(x.t.split(' (')[0])}</button>`).join('')}</div>
  ${XLAB.map((x, i) => `<div role="tabpanel" id="xlp-${x.k}" aria-labelledby="xlt-${x.k}" ${i ? 'hidden' : ''} data-xl="${x.k}"><h3 class="sub">${esc(x.t)}</h3><pre class="xl-f" tabindex="0"><code>${esc(x.f)}</code></pre><div class="pb-grid">${x.ui.map(([lab, type, val], j) => { const id = `xl-${x.k}-${j}`; return `<div class="field"><label for="${id}">${esc(lab)}</label>${type === 'area' ? `<textarea id="${id}" data-k="${esc(lab)}" rows="4">${esc(val)}</textarea>` : type.startsWith('select:') ? `<select id="${id}" data-k="${esc(lab)}">${type.slice(7).split('|').map(o => `<option${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input id="${id}" data-k="${esc(lab)}" type="${type === 'date' ? 'date' : 'text'}" value="${esc(val)}" autocomplete="off">`}</div>`; }).join('')}</div>
  <div class="xl-out" role="status" aria-live="polite"><span class="xl-lab">ผลลัพธ์</span><b data-xl-r></b><p class="hint" data-xl-n></p></div></div>`).join('')}</div>`;
  $$('[data-xl]', box).forEach(p => {
    const x = XLAB.find(z => z.k === p.dataset.xl);
    const run = () => { const v = {}; $$('[data-k]', p).forEach(e => { v[e.dataset.k] = e.value; }); let o; try { o = x.run(v); } catch (err) { o = { r: '#VALUE!', note: 'ข้อมูลไม่ครบ' }; } $('[data-xl-r]', p).textContent = String(o.r); $('[data-xl-n]', p).textContent = o.note || ''; };
    $$('[data-k]', p).forEach(e => e.addEventListener('input', run)); run();
  });
  initTabs($('[data-tabs]', box));
}

// ---------- Interactive Dashboard (A05): Prototype data + user upload ----------
const XCOLS = ['Farm_ID', 'Date', 'Age_Days', 'Body_Weight_g', 'Feed_Cum_kg', 'Mortality_Cum', 'Birds_Placed'];
function xKpiRows(rows, chick) {
  return rows.map(r => { const live = r.Birds_Placed - r.Mortality_Cum; const gain = (r.Body_Weight_g - chick) / 1000 * live; return { ...r, Live: live, Gain: gain, FCR: gain > 0 ? r.Feed_Cum_kg / gain : null, Mort: r.Birds_Placed > 0 ? r.Mortality_Cum / r.Birds_Placed * 100 : null }; });
}
function xQuality(rows, reportDate) {
  const w = []; const seen = new Map();
  rows.forEach((r, i) => {
    const at = `แถว ${i + 2}`;
    for (const c of XCOLS) if (r[c] === '' || r[c] == null || (typeof r[c] === 'number' && Number.isNaN(r[c]))) w.push(`${at}: ${c} ว่างหรือไม่ใช่ตัวเลข`);
    if (['Body_Weight_g', 'Feed_Cum_kg', 'Mortality_Cum', 'Birds_Placed', 'Age_Days'].some(c => r[c] < 0)) w.push(`${at}: มีค่าติดลบ`);
    if (r.Date && reportDate && r.Date > reportDate) w.push(`${at}: วันที่ ${r.Date} เกินวันรายงาน ${reportDate}`);
    const k = r.Farm_ID + '|' + r.Date; if (seen.has(k)) w.push(`${at}: ข้อมูลซ้ำกับแถว ${seen.get(k)} (Farm_ID + Date)`); else seen.set(k, i + 2);
  });
  const byF = {}; rows.forEach(r => (byF[r.Farm_ID] ||= []).push(r));
  for (const [f, a] of Object.entries(byF)) { a.sort((x, y) => x.Age_Days - y.Age_Days); for (let i = 1; i < a.length; i++) { if (a[i].Feed_Cum_kg < a[i - 1].Feed_Cum_kg) w.push(`${f}: Feed_Cum_kg ลดลงที่อายุ ${a[i].Age_Days} วัน (ค่าสะสมไม่ควรลด)`); if (a[i].Mortality_Cum < a[i - 1].Mortality_Cum) w.push(`${f}: Mortality_Cum ลดลงที่อายุ ${a[i].Age_Days} วัน`); } }
  return w;
}
function xParseSheet(XL, wb) {
  const name = wb.SheetNames.includes('Raw_Data') ? 'Raw_Data' : wb.SheetNames[0];
  const aoa = XL.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
  const hi = aoa.findIndex(r => r.map(String).includes('Farm_ID'));
  if (hi < 0) throw new Error(`Schema ไม่ตรง: ไม่พบหัวคอลัมน์ Farm_ID ในชีต ${name} (ต้องมี ${XCOLS.join(", ")})`);
  const head = aoa[hi].map(h => String(h).trim()); const miss = XCOLS.filter(c => !head.includes(c));
  if (miss.length) throw new Error(`Schema ไม่ตรง: ขาดคอลัมน์ ${miss.join(', ')} (ชีต ${name})`);
  const idx = Object.fromEntries(XCOLS.map(c => [c, head.indexOf(c)]));
  const toDate = v => typeof v === 'number' ? new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10) : String(v).trim().slice(0, 10);
  const rows = aoa.slice(hi + 1).filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(XCOLS.map(c => { const v = r[idx[c]]; return [c, c === 'Farm_ID' ? String(v).trim() : c === 'Date' ? (v === '' ? '' : toDate(v)) : v === '' ? '' : Number(String(v).replace(/,/g, ''))]; })));
  if (!rows.length) throw new Error(`ชีต ${name} ไม่มีข้อมูล`);
  return { rows, sheet: name };
}
function initXDash(el, X) {
  const S = X.sample;
  const st = { src: 'ข้อมูลตัวอย่าง (Prototype) · ชีต Raw_Data ใน sample-workbook.xlsx', kind: 'sample', loadedAt: new Date(), status: 'ok', msg: 'โหลดข้อมูลตัวอย่างสำเร็จ', rows: S.rows.map(r => ({ ...r })), farm: '', from: '', to: '', age: '', q: '' };
  const fmtTime = d => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'medium' }).format(d);
  const targets = Object.fromEntries(S.farms.map(f => [f.Farm_ID, f.Target_FCR_42d]));
  el.innerHTML = `<div class="xd">
  <div class="xd-status" data-xd-status></div>
  <div class="xd-ctl"><label class="sr-only" for="xdFarm">ฟาร์ม</label><select id="xdFarm"><option value="">ทุกฟาร์ม</option></select>
   <label class="xd-l" for="xdFrom">ตั้งแต่</label><input id="xdFrom" type="date"><label class="xd-l" for="xdTo">ถึง</label><input id="xdTo" type="date">
   <label class="sr-only" for="xdAge">อายุ</label><select id="xdAge"><option value="">ทุกอายุ</option></select>
   <button type="button" class="btn btn-subtle" data-xd-reset>${ic('arrow_clockwise')}<span>ล้างตัวกรอง</span></button></div>
  <div class="xd-up"><label class="btn btn-outline" for="xdFile">${ic('arrow_upload')}<span>อัปโหลดไฟล์ Excel/CSV ของคุณ</span></label><input id="xdFile" class="sr-only" type="file" accept=".xlsx,.xls,.csv"><button type="button" class="btn btn-subtle" data-xd-sample hidden>${ic('arrow_sync')}<span>กลับไปใช้ข้อมูลตัวอย่าง</span></button>
   <button type="button" class="btn btn-subtle" data-xd-csv>${ic('arrow_download')}<span>Export CSV</span></button><button type="button" class="btn btn-subtle" data-xd-xlsx>${ic('arrow_download')}<span>Export Excel</span></button></div>
  <div class="xd-kpis" data-xd-kpis aria-live="polite"></div>
  <div class="xd-charts"><figure class="xd-fig"><figcaption>Body Weight (g) ตามอายุ</figcaption><div data-xd-line></div></figure><figure class="xd-fig"><figcaption>FCR ล่าสุดเทียบเป้า</figcaption><div data-xd-bar></div></figure></div>
  <div class="xd-tbl-h"><h3 class="sub">${ic('table')}<span>Data Table</span></h3><div class="input-ic">${ic('search')}<label class="sr-only" for="xdQ">ค้นหาในตาราง</label><input id="xdQ" type="search" placeholder="ค้นหา Farm, วันที่, อายุ…" autocomplete="off"></div></div>
  <div class="table-wrap" tabindex="0" role="region" aria-label="ตารางข้อมูล Dashboard"><table class="tbl xd-t"><thead><tr>${['Farm_ID', 'Date', 'Age', 'Body Weight (g)', 'Feed สะสม (kg)', 'Mortality สะสม', 'Live Birds', 'FCR', 'Mortality %'].map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody data-xd-rows></tbody></table></div>
  <p class="hint" data-xd-count></p></div>`;
  const $d = s => $(s, el);
  const opts = () => {
    const farms = [...new Set(st.rows.map(r => r.Farm_ID).filter(Boolean))].sort(); const ages = [...new Set(st.rows.map(r => r.Age_Days).filter(x => typeof x === 'number'))].sort((a, b) => a - b);
    $d('#xdFarm').innerHTML = '<option value="">ทุกฟาร์ม</option>' + farms.map(f => `<option${f === st.farm ? ' selected' : ''}>${esc(f)}</option>`).join('');
    $d('#xdAge').innerHTML = '<option value="">ทุกอายุ</option>' + ages.map(a => `<option value="${a}"${String(a) === st.age ? ' selected' : ''}>${a} วัน</option>`).join('');
  };
  const filtered = () => xKpiRows(st.rows, S.chickWeightG).filter(r => (!st.farm || r.Farm_ID === st.farm) && (!st.from || r.Date >= st.from) && (!st.to || r.Date <= st.to) && (!st.age || String(r.Age_Days) === st.age));
  const draw = () => {
    const rows = filtered(); const warn = xQuality(st.rows, S.reportDate);
    const last = st.rows.reduce((m, r) => r.Date > m ? r.Date : m, '');
    $d('[data-xd-status]').innerHTML = `<div class="xd-s"><span>${ic('document_text')}<b>Data Source</b>${esc(st.src)}</span><span>${ic('timer')}<b>Last Updated</b>${last ? esc(last) + ' (วันที่ล่าสุดในข้อมูล)' : '-'}</span><span>${ic('arrow_sync')}<b>Refresh Status</b><i class="xd-badge ${st.status}">${st.status === 'ok' ? 'สำเร็จ' : st.status === 'loading' ? 'กำลังโหลด…' : 'ล้มเหลว'}</i>${esc(st.msg)} · ${esc(fmtTime(st.loadedAt))}</span><span class="xd-mode">${st.kind === 'sample' ? 'PROTOTYPE · ข้อมูลตัวอย่าง' : 'ข้อมูลจากไฟล์ที่อัปโหลด · ไม่เชื่อมต่อแหล่งข้อมูลอัตโนมัติ'}</span></div>
      ${warn.length ? `<details class="xd-warn"><summary>${ic('warning')}<span>Data Quality Warnings: ${warn.length} รายการ</span></summary><ul>${warn.slice(0, 50).map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>` : `<p class="xd-ok">${ic('checkmark_circle')}<span>Data Quality: ไม่พบปัญหา (ค่าว่าง ค่าติดลบ ข้อมูลซ้ำ วันที่เกินวันรายงาน ค่าสะสมลดลง)</span></p>`}`;
    if (!rows.length) { $d('[data-xd-kpis]').innerHTML = `<p class="empty">${ic('filter')} ไม่มีข้อมูลตามตัวกรองนี้ · ลองล้างตัวกรอง</p>`; $d('[data-xd-line]').innerHTML = ''; $d('[data-xd-bar]').innerHTML = ''; $d('[data-xd-rows]').innerHTML = ''; $d('[data-xd-count]').textContent = 'แสดง 0 แถว'; return; }
    // latest row per farm within the filter
    const latest = Object.values(rows.reduce((m, r) => { if (!m[r.Farm_ID] || r.Age_Days > m[r.Farm_ID].Age_Days) m[r.Farm_ID] = r; return m; }, {}));
    const sum = (a, k) => a.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const gain = sum(latest, 'Gain'), live = sum(latest, 'Live');
    const fcr = gain > 0 ? sum(latest, 'Feed_Cum_kg') / gain : null;
    const bw = live > 0 ? latest.reduce((s, r) => s + r.Body_Weight_g * r.Live, 0) / live : null;
    const mort = sum(latest, 'Birds_Placed') > 0 ? sum(latest, 'Mortality_Cum') / sum(latest, 'Birds_Placed') * 100 : null;
    const kp = [['FCR', fcr == null ? '—' : fmt(fcr, 3, 3), 'อาหารสะสม ÷ น้ำหนักที่เพิ่ม (ล่าสุดของแต่ละฟาร์ม)', 'scales'], ['Body Weight', bw == null ? '—' : fmt(bw, 0) + ' g', 'เฉลี่ยถ่วงน้ำหนักด้วยไก่ที่ยังมีชีวิต', 'data_trending'], ['Mortality', mort == null ? '—' : fmt(mort, 2, 2) + ' %', 'สะสม ÷ ไก่ที่ลง', 'heart_pulse'], ['Feed Intake', fmt(sum(latest, 'Feed_Cum_kg'), 0) + ' kg', 'อาหารสะสมรวม (ล่าสุดของแต่ละฟาร์ม)', 'food_grains']];
    $d('[data-xd-kpis]').innerHTML = kp.map(([t, v, s, i]) => `<div class="stat-tile xd-k"><span class="st-ic">${ic(i)}</span><div><b>${v}</b><span>${t}</span><small>${s} · ${latest.length} ฟาร์ม</small></div></div>`).join('');
    // line chart
    const farms = [...new Set(rows.map(r => r.Farm_ID))].sort(); const W = 520, H = 230, P = 40;
    const xs = rows.map(r => r.Age_Days), ys = rows.map(r => r.Body_Weight_g); const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys) * 1.08;
    const X = a => P + (x1 === x0 ? (W - 2 * P) / 2 : (a - x0) / (x1 - x0) * (W - 2 * P)), Y = b => H - P + 10 - b / y1 * (H - 2 * P);
    const COL = ['var(--g-xb)', 'var(--g-xi)', 'var(--g-xa)', 'var(--g-xt)', 'var(--accent)', 'var(--g-x0)'];
    $d('[data-xd-line]').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="xd-svg" role="img" aria-label="กราฟเส้นน้ำหนักตัวตามอายุ ${farms.length} ฟาร์ม สูงสุด ${fmt(Math.max(...ys), 0)} กรัม">${[0, .25, .5, .75, 1].map(f => `<line x1="${P}" x2="${W - P}" y1="${Y(y1 * f)}" y2="${Y(y1 * f)}" class="xd-grid"/><text x="${P - 6}" y="${Y(y1 * f) + 4}" class="xd-ax" text-anchor="end">${fmt(y1 * f, 0)}</text>`).join('')}${[...new Set(xs)].sort((a, b) => a - b).map(a => `<text x="${X(a)}" y="${H - 8}" class="xd-ax" text-anchor="middle">${a}</text>`).join('')}${farms.map((f, k) => { const pts = rows.filter(r => r.Farm_ID === f).sort((a, b) => a.Age_Days - b.Age_Days); return `<polyline fill="none" stroke="${COL[k % COL.length]}" stroke-width="2.5" points="${pts.map(r => `${X(r.Age_Days)},${Y(r.Body_Weight_g)}`).join(' ')}"/>${pts.map(r => `<circle cx="${X(r.Age_Days)}" cy="${Y(r.Body_Weight_g)}" r="3.5" fill="${COL[k % COL.length]}"><title>${esc(f)} · อายุ ${r.Age_Days} วัน · ${fmt(r.Body_Weight_g, 0)} g</title></circle>`).join('')}`; }).join('')}</svg><p class="xd-leg">${farms.map((f, k) => `<span><i style="background:${COL[k % COL.length]}"></i>${esc(f)}</span>`).join('')}</p>`;
    const fm = Math.max(...latest.map(r => Math.max(r.FCR || 0, targets[r.Farm_ID] || 0)), 0.1) * 1.15; const bw2 = (W - 2 * P) / latest.length;
    $d('[data-xd-bar]').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="xd-svg" role="img" aria-label="กราฟแท่ง FCR ล่าสุดของ ${latest.length} ฟาร์ม เทียบเป้า">${latest.sort((a, b) => a.Farm_ID < b.Farm_ID ? -1 : 1).map((r, k) => { const h = (r.FCR || 0) / fm * (H - 2 * P), tx = P + k * bw2 + bw2 * .2, tw = bw2 * .6, t = targets[r.Farm_ID]; return `<rect x="${tx}" y="${H - P - h}" width="${tw}" height="${h}" rx="4" fill="${r.FCR > t ? 'var(--red, #D13438)' : COL[k % COL.length]}"><title>${esc(r.Farm_ID)} FCR ${r.FCR == null ? '—' : fmt(r.FCR, 3, 3)} (อายุ ${r.Age_Days} วัน)</title></rect><text x="${tx + tw / 2}" y="${H - P - h - 6}" text-anchor="middle" class="xd-v">${r.FCR == null ? '—' : fmt(r.FCR, 3, 3)}</text>${t ? `<line x1="${tx - 4}" x2="${tx + tw + 4}" y1="${H - P - t / fm * (H - 2 * P)}" y2="${H - P - t / fm * (H - 2 * P)}" class="xd-tgt"/>` : ''}<text x="${tx + tw / 2}" y="${H - 14}" text-anchor="middle" class="xd-ax">${esc(r.Farm_ID)} · ${r.Age_Days}d</text>`; }).join('')}</svg><p class="xd-leg"><span><i class="tgt"></i>เป้า FCR (Master_Data, ที่ 42 วัน)</span><span><i style="background:#D13438"></i>สูงกว่าเป้า</span></p>`;
    const q = st.q.trim().toLowerCase(); const shown = rows.filter(r => !q || [r.Farm_ID, r.Date, r.Age_Days].join(' ').toLowerCase().includes(q));
    $d('[data-xd-rows]').innerHTML = shown.map(r => `<tr><td>${esc(r.Farm_ID)}</td><td>${esc(r.Date)}</td><td>${r.Age_Days}</td><td>${xfmt(r.Body_Weight_g, 0)}</td><td>${xfmt(r.Feed_Cum_kg, 0)}</td><td>${xfmt(r.Mortality_Cum, 0)}</td><td>${xfmt(r.Live, 0)}</td><td>${r.FCR == null ? '#N/A' : fmt(r.FCR, 3, 3)}</td><td>${r.Mort == null ? '#N/A' : fmt(r.Mort, 2, 2)}</td></tr>`).join('') || '<tr><td colspan="9">ไม่พบรายการที่ค้นหา</td></tr>';
    $d('[data-xd-count]').textContent = `แสดง ${shown.length} จาก ${rows.length} แถวที่ผ่านตัวกรอง (ทั้งหมด ${st.rows.length} แถว)`;
  };
  const exportRows = () => filtered().map(r => ({ Farm_ID: r.Farm_ID, Date: r.Date, Age_Days: r.Age_Days, Body_Weight_g: r.Body_Weight_g, Feed_Cum_kg: r.Feed_Cum_kg, Mortality_Cum: r.Mortality_Cum, Birds_Placed: r.Birds_Placed, Live_Birds: r.Live, FCR: r.FCR == null ? '' : +r.FCR.toFixed(4), Mortality_pct: r.Mort == null ? '' : +r.Mort.toFixed(4) }));
  const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  $d('[data-xd-csv]').addEventListener('click', () => { const rs = exportRows(); if (!rs.length) return toast('ไม่มีข้อมูลให้ Export'); const head = Object.keys(rs[0]); const csv = '﻿' + [head.join(','), ...rs.map(r => head.map(h => /[",\n]/.test(String(r[h])) ? `"${String(r[h]).replace(/"/g, '""')}"` : r[h]).join(','))].join('\n'); download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'farm-dashboard.csv'); toast(`Export CSV ${rs.length} แถว`); });
  $d('[data-xd-xlsx]').addEventListener('click', () => { const rs = exportRows(); if (!rs.length) return toast('ไม่มีข้อมูลให้ Export'); loadXLSX().then(XL => { const wb = XL.utils.book_new(); XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(rs), 'Dashboard_Export'); XL.utils.book_append_sheet(wb, XL.utils.aoa_to_sheet([['Data Source', st.src], ['Exported at', new Date().toISOString()], ['Filters', `farm=${st.farm || 'all'} from=${st.from || '-'} to=${st.to || '-'} age=${st.age || 'all'}`]]), 'About'); download(new Blob([XL.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'farm-dashboard.xlsx'); toast(`Export Excel ${rs.length} แถว`); }, e => toast(e.message)); });
  $d('#xdFarm').addEventListener('change', e => { st.farm = e.target.value; draw(); });
  $d('#xdAge').addEventListener('change', e => { st.age = e.target.value; draw(); });
  $d('#xdFrom').addEventListener('change', e => { st.from = e.target.value; draw(); });
  $d('#xdTo').addEventListener('change', e => { st.to = e.target.value; draw(); });
  $d('#xdQ').addEventListener('input', e => { st.q = e.target.value; draw(); });
  $d('[data-xd-reset]').addEventListener('click', () => { Object.assign(st, { farm: '', from: '', to: '', age: '', q: '' }); ['#xdFrom', '#xdTo', '#xdQ'].forEach(s => { $d(s).value = ''; }); opts(); draw(); });
  $d('[data-xd-sample]').addEventListener('click', () => { Object.assign(st, { src: 'ข้อมูลตัวอย่าง (Prototype) · ชีต Raw_Data ใน sample-workbook.xlsx', kind: 'sample', rows: S.rows.map(r => ({ ...r })), status: 'ok', msg: 'โหลดข้อมูลตัวอย่างสำเร็จ', loadedAt: new Date(), farm: '', age: '' }); $d('[data-xd-sample]').hidden = true; opts(); draw(); });
  $d('#xdFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    st.status = 'loading'; st.msg = `กำลังอ่าน ${f.name}`; draw();
    Promise.all([loadXLSX(), f.arrayBuffer()]).then(([XL, buf]) => {
      const wb = XL.read(buf, { type: 'array', cellDates: false }); const { rows, sheet } = xParseSheet(XL, wb);
      Object.assign(st, { rows, src: `ไฟล์ที่อัปโหลด: ${f.name} · ชีต ${sheet}`, kind: 'upload', status: 'ok', msg: `อ่าน ${rows.length} แถวสำเร็จ`, loadedAt: new Date(), farm: '', age: '' });
      $d('[data-xd-sample]').hidden = false; opts(); draw(); toast(`โหลดข้อมูล ${rows.length} แถวจาก ${f.name}`);
    }).catch(err => { st.status = 'error'; st.msg = `${err.message} — ยังใช้ข้อมูลชุดเดิม`; st.loadedAt = new Date(); draw(); }).finally(() => { e.target.value = ''; });
  });
  opts(); draw();
}
