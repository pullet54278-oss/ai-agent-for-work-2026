// ---------- Prompt Lab อัตโนมัติ (หน้าแรก) ----------
// วิเคราะห์ไฟล์/ข้อความในเครื่องแบบ rule-based แล้วสร้าง Prompt พร้อมใช้ · ไม่ส่งข้อมูลออกนอกเครื่อง
const PA_ACCEPT = /\.(pdf|xlsx|xls|csv|txt|md|docx|pptx)$/i;
const PA_MAX_MB = 25, PA_MAX_PAGES = 40, PA_TEXT_IN_PROMPT = 6000;
const PA_GOALS = [
  ['summary', 'สรุปสาระสำคัญ'], ['qa', 'ดึงประเด็น / ถาม-ตอบจากเอกสาร'], ['check', 'ตรวจความครบถ้วนและความเสี่ยง'],
  ['numbers', 'วิเคราะห์ตัวเลขและแนวโน้ม'], ['convert', 'เตรียมรายงาน / สไลด์ / Dashboard'], ['email', 'สื่อสารต่อ (อีเมล / ข้อความ)'], ['agent', 'สร้าง Copilot Agent สำหรับงานนี้']
];
const PA_AUD = ['ผู้บริหาร', 'ทีมงาน', 'ผู้รับผิดชอบงาน', 'ผู้มีอำนาจอนุมัติ', 'ลูกค้าหรือคู่ค้า'];
const PA_FMT = {
  table: ['ตารางสรุป + สรุป 5 บรรทัด', 'ตารางสรุปประเด็น (ประเด็น | รายละเอียด | ที่มา) ตามด้วยสรุป 5 บรรทัด'],
  bullets: ['หัวข้อย่อยกระชับ', 'หัวข้อย่อยกระชับ ไม่เกิน 10 ข้อ อ่านจบใน 2 นาที'],
  word: ['รายงาน Word 1–2 หน้า', 'รายงาน Word 1–2 หน้า มีหัวข้อ ย่อหน้าสั้น และตารางสรุป'],
  ppt: ['สไลด์ PowerPoint', 'สไลด์ PowerPoint 5–7 สไลด์ (หัวข้อสไลด์ + 3 bullet + ข้อความผู้บรรยาย)'],
  excel: ['ตาราง / Dashboard Excel', 'ตาราง Excel พร้อมสูตรที่ใช้ และข้อเสนอ Dashboard (KPI + กราฟ)']
};
const PA_TYPES = [
  ['meeting', 'บันทึกการประชุม', /ประชุม|วาระ|ผู้เข้าร่วม|มติ(?:ที่ประชุม)?|meeting|agenda|minutes/gi, ['มติหรือข้อสรุปแต่ละวาระ', 'ผู้รับผิดชอบและกำหนดเสร็จของแต่ละงาน', 'เรื่องที่ยังค้างหรือต้องตัดสินใจ']],
  ['procedure', 'ขั้นตอนงาน / คู่มือ', /ขั้นตอน|วิธีปฏิบัติ|คู่มือ|วิธีการ|ปฏิบัติดังนี้|procedure|step\s*\d|instruction/gi, ['ขั้นตอนครบและเรียงลำดับถูกต้อง', 'จุดตรวจสอบและเกณฑ์ผ่าน/ไม่ผ่าน', 'ผู้รับผิดชอบแต่ละขั้นและสิ่งที่ต้องบันทึก']],
  ['report', 'รายงานผล', /รายงาน|สรุปผล|ผลการ|ผลดำเนินงาน|เทียบกับเป้า|KPI|ยอดขาย|report|summary/gi, ['ตัวเลขสอดคล้องกันทุกจุด', 'ช่วงเวลาและแหล่งข้อมูลระบุชัด', 'ผลเทียบเป้าหมายหรือช่วงก่อนหน้า']],
  ['policy', 'นโยบาย / ข้อกำหนด', /นโยบาย|ข้อกำหนด|ระเบียบ|หลักเกณฑ์|มาตรฐาน|policy|requirement/gi, ['ขอบเขตและผู้ที่ต้องปฏิบัติตาม', 'ข้อยกเว้นและเงื่อนไข', 'วันที่มีผลและผู้มีอำนาจอนุมัติ']],
  ['contract', 'สัญญา / ข้อตกลง', /สัญญา|คู่สัญญา|ข้อตกลง|ค่าปรับ|ผิดสัญญา|contract|agreement/gi, ['คู่สัญญา ระยะเวลา และขอบเขตงาน', 'ค่าปรับ เงื่อนไขยกเลิก และภาระผูกพัน', 'ข้อความกำกวมที่ควรถามฝ่ายกฎหมาย']],
  ['invoice', 'ใบแจ้งหนี้ / เอกสารการเงิน', /ใบแจ้งหนี้|ใบกำกับ|ใบเสร็จ|ยอดชำระ|ภาษีมูลค่าเพิ่ม|invoice|VAT/gi, ['ยอดรวม ภาษี และส่วนลดคำนวณถูกต้อง', 'วันที่และเงื่อนไขการชำระ', 'รายการที่ไม่ตรงกับใบสั่งซื้อหรือสัญญา']],
  ['email', 'อีเมล / หนังสือติดต่อ', /เรียน\s|ขอแสดงความนับถือ|เรื่อง\s*:|Subject:|From:|Dear\s/gi, ['ประเด็นที่ผู้ส่งขอให้ตอบหรือดำเนินการ', 'กำหนดเวลาที่ระบุ', 'ข้อมูลที่ต้องแนบหรือยืนยันกลับ']],
  ['plan', 'แผนงาน / โครงการ', /แผนงาน|แผนการ|โครงการ|เป้าหมาย|ไตรมาส|timeline|milestone|project|plan/gi, ['เป้าหมายวัดผลได้', 'ไทม์ไลน์ ผู้รับผิดชอบ และงบประมาณ', 'ความเสี่ยงและแผนรองรับ']]
];
const PA_STOP = new Set(('และ หรือ ที่ ของ ใน การ ความ เป็น มี ให้ ได้ จะ ไม่ กับ จาก โดย เพื่อ แต่ ว่า นี้ นั้น ซึ่ง ก็ ไป มา อยู่ แล้ว ต้อง ทั้ง ตาม หาก ถ้า เมื่อ คือ ด้วย อย่าง เช่น ต่อ ยัง ทำ เรา คุณ เขา ผู้ ส่วน แต่ละ เพราะ จึง ทุก หนึ่ง สอง สาม ราย ครั้ง วัน เดือน ปี ข้อ หน้า กว่า ถึง ระหว่าง เกี่ยวกับ รวม ไว้ อีก ได้แก่ กัน ดังนี้ ดัง นำ ใช้ แบบ เรื่อง ตัว อื่น ๆ ฯลฯ ขึ้น ลง ออก เข้า เพิ่ม ใด ไหน อะไร ทาง จำนวน คน ละ ครับ ค่ะ คะ จ้า นะ ' +
  'the and or of to in for on with a an is are be by as at from that this it was were will can not have has its into per all any our your their').split(' '));
let paState = { profile: null, text: '', opts: { goal: 'summary', aud: 'ผู้บริหาร', fmt: 'table', extra: '', inc: true }, busy: false, status: '' };
let pdfLibP = null;

function paLoadPDF() {
  if (location.protocol === 'file:') return Promise.reject(new Error('อ่าน PDF ได้เมื่อเปิดแอปผ่านเว็บไซต์ (https) · เปิดจากไฟล์ในเครื่องไม่รองรับ'));
  if (!pdfLibP) pdfLibP = import(new URL('vendor/pdfjs/pdf.min.mjs', location.href).href).then(m => { m.GlobalWorkerOptions.workerSrc = new URL('vendor/pdfjs/pdf.worker.min.mjs', location.href).href; return m; }, e => { pdfLibP = null; throw new Error('โหลดตัวอ่าน PDF ไม่ได้ (ต้องเชื่อมต่ออินเทอร์เน็ตครั้งแรก)'); });
  return pdfLibP;
}
const paTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
// ฟอนต์ไทยหลายตัวใช้ glyph ตำแหน่งพิเศษ (Private Use Area U+F700–F71A) สำหรับสระบน/ล่างและวรรณยุกต์ → แปลงกลับเป็นอักษรไทยปกติ
const PA_TH_PUA = '\u0E10\u0E34\u0E35\u0E36\u0E37\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E0D\u0E31\u0E4D\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E38\u0E39\u0E3A';
const paFixThai = t => t.replace(/[\uF700-\uF71A]/g, c => PA_TH_PUA[c.charCodeAt(0) - 0xF700]).replace(/\u0E4D([\u0E48-\u0E4B]?)\u0E32/g, '$1\u0E33').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
async function paReadPDF(f) {
  const lib = await paLoadPDF();
  const task = lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, stopAtErrors: false });
  let doc;
  try { doc = await paTimeout(task.promise, 30000, 'อ่านไฟล์นานเกินไป'); }
  catch (e) { task.destroy(); throw new Error(e && e.name === 'PasswordException' ? 'PDF มีรหัสผ่าน · ปลดรหัสก่อนแล้วลองใหม่' : e && /Invalid|Missing|Unexpected|format/i.test(e.name + e.message) ? 'ไฟล์ PDF เสียหรือไม่ใช่ PDF' : (e.message || 'อ่าน PDF ไม่ได้')); }
  try {
    const pages = doc.numPages, n = Math.min(pages, PA_MAX_PAGES), out = [];
    for (let i = 1; i <= n; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      out.push(tc.items.map(it => (it.str || '') + (it.hasEOL ? '\n' : '')).join('').replace(/[ \t]+\n/g, '\n'));
    }
    let title = '';
    try { const md = await doc.getMetadata(); title = (md && md.info && md.info.Title || '').trim(); } catch (e) { /* ignore */ }
    return { pages, read: n, text: paFixThai(out.join('\n\n')), title };
  } finally { doc.destroy(); }
}
function paColType(vals) {
  const v = vals.filter(x => x !== '' && x != null);
  if (!v.length) return 'ว่าง';
  const share = fn => v.filter(fn).length / v.length;
  if (share(x => x instanceof Date || /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(String(x).trim())) >= .8) return 'วันที่';
  if (share(x => typeof x === 'number' || /^-?[\d,]+(\.\d+)?%?$/.test(String(x).trim())) >= .8) return 'ตัวเลข';
  if (share(x => /^[A-Z0-9][A-Z0-9\-_/.]{2,}$/i.test(String(x).trim()) && /\d/.test(String(x))) >= .8) return 'รหัส';
  return 'ข้อความ';
}
async function paReadTable(f) {
  const X = await loadXLSX();
  const wb = /\.csv$/i.test(f.name) ? X.read(await f.text(), { type: 'string', cellDates: true }) : X.read(await f.arrayBuffer(), { type: 'array', cellDates: true });
  return wb.SheetNames.slice(0, 12).map(name => {
    const rows = X.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: '' });
    const hi = rows.findIndex(r => r.filter(c => String(c).trim() !== '').length >= 2);
    if (hi < 0) return { name, cols: [], rows: 0 };
    const head = rows[hi], body = rows.slice(hi + 1), sample = body.slice(0, 300);
    const cols = head.map((c, i) => ({ name: String(c).trim(), i })).filter(c => c.name).slice(0, 40).map(c => ({ name: c.name, type: paColType(sample.map(r => r[c.i])), blank: body.filter(r => String(r[c.i] ?? '').trim() === '').length }));
    let dates = [];
    head.forEach((c, i) => { if (cols.find(x => x.name === String(c).trim() && x.type === 'วันที่')) sample.forEach(r => { const d = r[i] instanceof Date ? r[i] : null; if (d && !isNaN(d)) dates.push(d); }); });
    dates.sort((a, b) => a - b);
    const fmt = d => d.toISOString().slice(0, 10);
    return { name, cols, rows: body.length, range: dates.length ? fmt(dates[0]) + ' ถึง ' + fmt(dates[dates.length - 1]) : '' };
  });
}

// ---- วิเคราะห์ข้อความ ----
function paKeywords(text) {
  const cnt = new Map();
  const words = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(text)].filter(s => s.isWordLike).map(s => s.segment)
    : text.split(/[^\p{L}\p{N}]+/u);
  for (let w of words) {
    w = w.trim(); const lw = w.toLowerCase();
    if (!w || PA_STOP.has(lw) || /^\d|^[\d.,%]+$/.test(w)) continue;
    if (/^[a-z]/i.test(w) ? w.length < 3 : w.length < 3) continue;
    cnt.set(lw, { w, c: (cnt.get(lw)?.c || 0) + 1 });
  }
  return [...cnt.values()].filter(x => x.c >= 2).sort((a, b) => b.c - a.c || b.w.length - a.w.length).slice(0, 8).map(x => x.w);
}
function paHeadings(text) {
  const lines = text.split('\n').map(l => l.trim());
  const out = [];
  lines.forEach((l, i) => {
    if (l.length < 3 || l.length > 90 || out.length >= 8) return;
    const next = lines.slice(i + 1).find(Boolean) || '';
    const words = l.split(/\s+/).length;
    const isH = /^#{1,4}\s/.test(l) || /^(?:บทที่|ส่วนที่|หมวด(?:ที่)?|ข้อ)\s*\d/.test(l) || /^(?:\d{1,2}(?:\.\d{1,2}){0,2}[.)]?|[IVX]{1,4}\.|[ก-ฮ][.)])\s+\S/.test(l) && words <= 12 && !/[.。]$/.test(l) && !/\d/.test(l.replace(/^\S+\s+/, ''))
      || (/[:：]$/.test(l) && l.length <= 60) || (l.length <= 50 && words <= 7 && next.length > l.length * 1.6 && !/[.,;]$/.test(l) && !/^\d+([.,]\d+)?$/.test(l) && /\p{L}{2}/u.test(l));
    if (isH) { const h = l.replace(/^#{1,4}\s*/, '').replace(/[:：]$/, ''); if (!out.includes(h)) out.push(h); }
  });
  return out;
}
function paAnalyzeText(text) {
  const t = text.replace(/\r/g, '').replace(/ /g, ' ');
  const nums = t.match(/(?<![\p{L}])-?\d[\d,]*(?:\.\d+)?/gu) || [];
  const thai = (t.match(/[฀-๿]/g) || []).length, latin = (t.match(/[A-Za-z]/g) || []).length;
  const types = PA_TYPES.map(([k, label, re, checks]) => ({ k, label, checks, s: (t.match(re) || []).length })).sort((a, b) => b.s - a.s);
  const type = types[0].s >= 2 ? types[0] : { k: 'general', label: 'เอกสารทั่วไป', checks: ['ประเด็นหลักครบถ้วน', 'ข้อมูลที่ขาดหรือขัดแย้งกัน', 'สิ่งที่ต้องดำเนินการต่อ'] };
  return {
    chars: t.replace(/\s/g, '').length, lines: t.split('\n').filter(l => l.trim()).length,
    headings: paHeadings(t), keywords: paKeywords(t), nums: nums.length,
    pct: /\d\s*%|ร้อยละ|เปอร์เซ็นต์|percent/i.test(t),
    date: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|(?:ม\.ค|ก\.พ|มี\.ค|เม\.ย|พ\.ค|มิ\.ย|ก\.ค|ส\.ค|ก\.ย|ต\.ค|พ\.ย|ธ\.ค)\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d/.test(t),
    money: /บาท|฿|\$|USD|THB|ล้านบาท/i.test(t),
    table: t.split('\n').filter(l => /\t|\S {2,}\S.* {2,}\S|\|.*\|/.test(l)).length >= 3,
    lang: thai && latin ? (thai >= latin ? 'ไทย (มีภาษาอังกฤษปน)' : 'อังกฤษ (มีภาษาไทยปน)') : thai ? 'ไทย' : latin ? 'อังกฤษ' : '—',
    type
  };
}
async function paAnalyzeFile(f) {
  const base = { src: 'file', name: f.name, size: f.size, ext: (f.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase() };
  if (!PA_ACCEPT.test(f.name)) throw new Error('ชนิดไฟล์ไม่รองรับ · ใช้ PDF, Excel, CSV, TXT หรือวางข้อความ');
  if (f.size > PA_MAX_MB * 1048576) throw new Error(`ไฟล์ใหญ่เกิน ${PA_MAX_MB} MB`);
  if (base.ext === 'pdf') {
    const r = await paReadPDF(f);
    const a = paAnalyzeText(r.text);
    const p = { ...base, kind: 'pdf', pages: r.pages, read: r.read, title: r.title, ...a };
    if (a.chars < 20) { p.warn = 'ไม่พบข้อความ (อาจเป็นภาพสแกน) ในไฟล์นี้ · Prompt สร้างจากชื่อไฟล์และจำนวนหน้า ให้ Copilot อ่านภาพในไฟล์แทน'; p.empty = true; }
    else if (r.pages > r.read) p.warn = `อ่านข้อความ ${r.read} หน้าแรกจาก ${r.pages} หน้า`;
    return p;
  }
  if (/^(xlsx|xls|csv)$/.test(base.ext)) {
    const sheets = await paReadTable(f);
    const allCols = sheets.flatMap(s => s.cols);
    return { ...base, kind: 'table', sheets, nums: allCols.filter(c => c.type === 'ตัวเลข').length, date: allCols.some(c => c.type === 'วันที่'), headings: [], keywords: [], type: { k: 'table', label: 'ตารางข้อมูล', checks: ['คอลัมน์ว่างหรือค่าหาย', 'ค่าซ้ำ ค่าผิดปกติ และชนิดข้อมูลผิด', 'ผลรวมและตัวเลขสรุปตรงกับข้อมูลดิบ'] } };
  }
  if (/^(txt|md)$/.test(base.ext)) { const text = await f.text(); return { ...base, kind: 'txt', ...paAnalyzeText(text) }; }
  return { ...base, kind: 'other', headings: [], keywords: [], nums: 0, type: { k: 'general', label: base.ext === 'pptx' ? 'สไลด์นำเสนอ' : 'เอกสาร Word', checks: ['ประเด็นหลักครบถ้วน', 'ข้อมูลที่ขาดหรือขัดแย้งกัน', 'สิ่งที่ต้องดำเนินการต่อ'] }, warn: 'ไฟล์ Word/PowerPoint ยังอ่านเนื้อหาในเครื่องไม่ได้ · Prompt สร้างจากชื่อไฟล์ (ถ้าต้องการให้ละเอียดขึ้น วางข้อความหรือบันทึกเป็น PDF)', empty: true };
}

// ---- สร้าง Prompt ----
function paSourceLine(p) {
  if (p.src === 'text') return 'ข้อมูล: ข้อความที่แนบท้าย Prompt นี้';
  const what = p.kind === 'pdf' ? `PDF ${p.pages} หน้า` : p.kind === 'table' ? `ตาราง ${p.sheets.length} ชีต` : p.ext.toUpperCase();
  return `ข้อมูล: แนบไฟล์ "${p.name}" (${what}) ในแชทนี้`;
}
function paContext(p) {
  const L = [`ประเภทเอกสาร (ตรวจพบอัตโนมัติ): ${p.type.label}`];
  if (p.title) L.push(`ชื่อเรื่องในไฟล์: ${p.title}`);
  if (p.headings.length) L.push(`หัวข้อหลักที่พบ: ${p.headings.slice(0, 6).join(' / ')}`);
  if (p.keywords.length) L.push(`คำสำคัญ: ${p.keywords.slice(0, 8).join(', ')}`);
  if (p.kind === 'table') p.sheets.filter(s => s.cols.length).slice(0, 4).forEach(s => L.push(`ชีต "${s.name}" ${s.rows.toLocaleString('th-TH')} แถว · คอลัมน์: ${s.cols.map(c => `${c.name} (${c.type})`).join(', ')}${s.range ? ` · ช่วงวันที่ ${s.range}` : ''}`));
  return L.map(x => '- ' + x).join('\n');
}
const paRef = p => p.kind === 'pdf' ? 'เลขหน้า' : p.kind === 'table' ? 'ชีต คอลัมน์ และแถว' : 'หัวข้อหรือย่อหน้า';
function paChecks(p) {
  return `การตรวจสอบ:\n- อ้างอิง${paRef(p)}ที่มาของทุกประเด็นและทุกตัวเลข\n- ใช้เฉพาะข้อมูลในเอกสาร ห้ามแต่งเพิ่ม ถ้าไม่พบให้เขียนว่า "ไม่พบในเอกสาร"\n- แยกข้อเท็จจริงออกจากความเห็นหรือข้อสันนิษฐานให้ชัด`;
}
function paTail(p, o) {
  let s = o.extra.trim() ? `\n\nความต้องการเพิ่มเติม: ${o.extra.trim()}` : '';
  if (p.src === 'text' && o.inc && paState.text.trim()) {
    const t = paState.text.trim();
    s += `\n\n--- ข้อความ ---\n${t.length > PA_TEXT_IN_PROMPT ? t.slice(0, PA_TEXT_IN_PROMPT) + '\n[…ตัดเหลือ ' + PA_TEXT_IN_PROMPT.toLocaleString('th-TH') + ' ตัวอักษรแรก · ข้อความเต็มให้แนบเป็นไฟล์]' : t}\n--- จบข้อความ ---`;
  }
  return s;
}
function paNameOf(p) {
  const base = p.title || (p.src === 'text' ? (p.headings[0] || p.type.label) : p.name.replace(/\.[^.]+$/, ''));
  return base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function paBuild(p, o) {
  const fmt = PA_FMT[o.fmt][1], aud = o.aud, src = paSourceLine(p), ctx = paContext(p), chk = paChecks(p), tail = paTail(p, o);
  const isTable = p.kind === 'table', hasNum = isTable ? p.nums > 0 : p.nums >= 5;
  const heads = p.headings.slice(0, 5);
  const C = [];
  C.push(['summary', 'document_text', 'สรุปสาระสำคัญ (Executive Summary)', `งาน: สรุปสาระสำคัญของเอกสารนี้ให้${aud}อ่านเข้าใจได้ใน 2 นาที\n${src}\nบริบท:\n${ctx}\n\nความต้องการ:\n1. สรุปภาพรวมใน 3–5 บรรทัด: เรื่องอะไร ทำไมสำคัญ ต้องทำอะไรต่อ\n2. ประเด็นสำคัญไม่เกิน 7 ข้อ เรียงตามผลกระทบ${heads.length ? `\n3. ครอบคลุมหัวข้อ: ${heads.join(' / ')}` : ''}\n${heads.length ? 4 : 3}. ${hasNum ? 'ตัวเลขสำคัญพร้อมหน่วยและช่วงเวลา' : 'คำศัพท์หรือเงื่อนไขที่ผู้อ่านต้องรู้'}\n${heads.length ? 5 : 4}. สิ่งที่${aud}ต้องตัดสินใจหรือดำเนินการ\n\nรูปแบบผลลัพธ์: ${fmt}\n\n${chk}${tail}`]);
  const qs = heads.length ? heads.slice(0, 4).map(h => `- หัวข้อ "${h}" กำหนดอะไร ใครเกี่ยวข้อง และมีเงื่อนไขอะไรบ้าง`) : [`- เอกสารนี้ต้องการให้ใครทำอะไร ภายในเมื่อไร`, `- มีเงื่อนไข ข้อยกเว้น หรือเกณฑ์อะไรที่ต้องรู้`];
  if (p.keywords.length) qs.push(`- "${p.keywords[0]}"${p.keywords[1] ? ` และ "${p.keywords[1]}"` : ''} ถูกกล่าวถึงในบริบทใด`);
  if (isTable) qs.splice(0, qs.length, ...p.sheets.filter(s => s.cols.length).slice(0, 2).map(s => `- ชีต "${s.name}" บอกอะไร คอลัมน์ไหนสำคัญที่สุดและเพราะอะไร`), '- มีค่าไหนที่ผิดปกติหรือควรตรวจซ้ำ');
  C.push(['qa', 'question_circle', 'ดึงประเด็น / ถาม-ตอบจากเอกสาร', `งาน: อ่านเอกสารนี้แล้วตอบคำถามต่อไปนี้ทีละข้อ\n${src}\nบริบท:\n${ctx}\n\nคำถาม:\n${qs.join('\n')}\n- มีอะไรที่${aud}ควรถามเพิ่ม (เสนอ 3 คำถาม)\n\nรูปแบบผลลัพธ์: ตาราง คำถาม | คำตอบสั้น | ${paRef(p)}ที่อ้างอิง\nจากนั้นถามฉันกลับว่าต้องการเจาะลึกข้อไหน\n\n${chk}${tail}`]);
  C.push(['check', 'shield_checkmark', 'ตรวจความครบถ้วน ข้อมูลขาด และความเสี่ยง', `งาน: ตรวจเอกสารนี้ในฐานะผู้ตรวจทานก่อนส่งให้${aud}\n${src}\nบริบท:\n${ctx}\n\nตรวจตามรายการ:\n${p.type.checks.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n${p.type.checks.length + 1}. ข้อความกำกวม ตัวเลขหรือข้อมูลที่ขัดแย้งกันเอง\n${p.type.checks.length + 2}. ความเสี่ยงหากนำไปใช้ตามนี้ (ระดับ สูง/กลาง/ต่ำ)\n\nรูปแบบผลลัพธ์: ตาราง รายการตรวจ | ผล (ครบ/ไม่ครบ/ไม่พบ) | หลักฐาน | ข้อเสนอแก้ไข\nปิดท้ายด้วยสิ่งที่ต้องแก้ก่อนส่ง 3 ข้อ\n\n${chk}${tail}`]);
  if (hasNum || p.pct || p.money) {
    const cols = isTable ? p.sheets.flatMap(s => s.cols).filter(c => c.type === 'ตัวเลข').slice(0, 8).map(c => c.name) : [];
    const dcol = isTable ? (p.sheets.flatMap(s => s.cols).find(c => c.type === 'วันที่') || {}).name : '';
    C.push(['numbers', 'data_trending', 'วิเคราะห์ตัวเลขและแนวโน้ม', `งาน: วิเคราะห์ตัวเลขในเอกสารนี้และหาสิ่งที่${aud}ควรรู้\n${src}\nบริบท:\n${ctx}\n\nความต้องการ:\n1. ${cols.length ? `สรุปคอลัมน์ตัวเลข: ${cols.join(', ')} (รวม เฉลี่ย ต่ำสุด สูงสุด)` : `ดึงตัวเลขสำคัญทั้งหมดเป็นตาราง: ตัวเลข | หน่วย | ความหมาย | ${paRef(p)}`}\n2. ${dcol ? `แนวโน้มตาม "${dcol}" เทียบช่วงก่อนหน้า` : p.date ? 'แนวโน้มตามช่วงเวลาที่ระบุ' : 'เปรียบเทียบตัวเลขที่เกี่ยวข้องกัน'}${p.pct ? ' และตรวจว่าเปอร์เซ็นต์คำนวณถูกต้อง' : ''}\n3. ค่าผิดปกติ (สูง/ต่ำผิดปกติ) พร้อมเหตุผลที่เป็นไปได้\n4. ข้อสรุป 3 ข้อ และสิ่งที่ควรตรวจเพิ่ม\n\nรูปแบบผลลัพธ์: ${o.fmt === 'excel' ? fmt : 'ตารางตัวเลข + กราฟที่แนะนำ (ชนิดกราฟ แกน X/Y) + ข้อสรุป'}\n\n${chk}\n- แสดงวิธีคำนวณของตัวเลขที่คำนวณใหม่ทุกตัว${tail}`]);
  } else {
    C.push(['numbers', 'table', 'ดึงข้อมูลเป็นตารางพร้อมใช้', `งาน: ดึงข้อมูลสำคัญจากเอกสารนี้จัดเป็นตารางที่นำไปใช้ต่อใน Excel ได้\n${src}\nบริบท:\n${ctx}\n\nความต้องการ:\n1. เสนอคอลัมน์ที่เหมาะกับเอกสารนี้ (เช่น ${p.type.k === 'meeting' ? 'วาระ | มติ | ผู้รับผิดชอบ | กำหนดเสร็จ' : p.type.k === 'procedure' ? 'ลำดับ | ขั้นตอน | ผู้รับผิดชอบ | จุดตรวจ | บันทึก' : 'หัวข้อ | รายละเอียด | ผู้เกี่ยวข้อง | วันที่'})\n2. กรอกข้อมูลจากเอกสารให้ครบทุกแถว ช่องที่ไม่มีข้อมูลให้เว้นว่างและทำเครื่องหมาย\n3. สรุปใต้ตาราง 3 บรรทัด\n\nรูปแบบผลลัพธ์: ตาราง Markdown ที่คัดลอกไปวางใน Excel ได้\n\n${chk}${tail}`]);
  }
  const conv = o.fmt === 'ppt' || o.fmt === 'excel' ? o.fmt : 'word';
  const convTxt = {
    word: ['รายงาน Word', `จัดทำร่างรายงาน Word 1–2 หน้า สำหรับ${aud}\n\nโครงรายงาน:\n1. เรื่องและวัตถุประสงค์\n2. สรุปสำหรับผู้อ่าน (5 บรรทัด)\n3. รายละเอียดตามหัวข้อ${heads.length ? ` (${heads.slice(0, 4).join(' / ')})` : ''}\n4. ตารางสรุปตัวเลขหรือประเด็น\n5. ข้อเสนอและสิ่งที่ต้องดำเนินการ (ใคร ทำอะไร เมื่อไร)\n\nรูปแบบผลลัพธ์: ข้อความพร้อมวางใน Word ใช้หัวข้อระดับ 1–2 ย่อหน้าสั้น`],
    ppt: ['สไลด์ PowerPoint', `จัดทำโครงสไลด์ PowerPoint 5–7 สไลด์ สำหรับนำเสนอ${aud}\n\nโครงสไลด์:\n1. ชื่อเรื่องและประเด็นเดียวที่อยากให้จำ\n2. ภาพรวม / ที่มา\n3–5. ประเด็นหลัก${heads.length ? ` (${heads.slice(0, 3).join(' / ')})` : ''} สไลด์ละ 1 ประเด็น\n6. ตัวเลขหรือกราฟสำคัญ (ระบุชนิดกราฟ)\n7. ข้อเสนอและสิ่งที่ขอให้ตัดสินใจ\n\nรูปแบบผลลัพธ์: แต่ละสไลด์มี หัวข้อ | 3 bullet ไม่เกิน 12 คำ | ข้อความผู้บรรยาย 2–3 ประโยค | ภาพหรือกราฟที่แนะนำ`],
    excel: ['ตาราง / Dashboard Excel', `ออกแบบตารางและ Dashboard ใน Excel จากข้อมูลนี้ สำหรับ${aud}\n\nความต้องการ:\n1. โครงตาราง (ชื่อคอลัมน์ ชนิดข้อมูล ตัวอย่าง 3 แถว)${isTable ? '\n   ใช้คอลัมน์เดิมของไฟล์เป็นหลัก' : ''}\n2. KPI 3–5 ตัว พร้อมสูตร Excel ที่ใช้คำนวณ\n3. กราฟ 2–3 แบบ (ชนิดกราฟ ข้อมูลที่ใช้ เหตุผล)\n4. Conditional Formatting ที่ช่วยให้เห็นค่าผิดปกติ\n5. ขั้นตอนสร้างใน Excel ทีละขั้น\n\nรูปแบบผลลัพธ์: ตาราง + สูตร (บอกเวอร์ชัน Excel ที่ใช้ได้) + ขั้นตอน`]
  }[conv];
  C.push(['convert', conv === 'ppt' ? 'slide_text' : conv === 'excel' ? 'chart_multiple' : 'document', `แปลงเป็น${convTxt[0]}`, `งาน: ${convTxt[1].split('\n')[0]}\n${src}\nบริบท:\n${ctx}\n${convTxt[1].split('\n').slice(1).join('\n')}\n\n${chk}${tail}`]);
  C.push(['email', 'mail', 'ร่างอีเมล / ข้อความสื่อสาร', `งาน: ร่างอีเมลถึง${aud} เพื่อแจ้งสาระสำคัญจากเอกสารนี้และสิ่งที่ต้องดำเนินการ\n${src}\nบริบท:\n${ctx}\n\nความต้องการ:\n1. หัวเรื่องอีเมล 3 แบบให้เลือก (ไม่เกิน 60 ตัวอักษร)\n2. เนื้อหา: ที่มา 1 ประโยค · สาระสำคัญ 3–5 bullet · สิ่งที่ขอให้ดำเนินการพร้อมกำหนดเวลา\n3. น้ำเสียงสุภาพ กระชับ เหมาะกับ${aud}\n4. ข้อความสั้นสำหรับส่งทาง Teams (ไม่เกิน 3 บรรทัด)\n\nรูปแบบผลลัพธ์: อีเมลพร้อมส่ง และระบุตำแหน่งที่ต้องเติมข้อมูลด้วย [วงเล็บเหลี่ยม]\n\n${chk}\n- ไม่ใส่ข้อมูลส่วนบุคคลหรือข้อมูลลับเกินจำเป็น${tail}`]);
  const nm = ('ผู้ช่วย ' + paNameOf(p)).slice(0, 30).trim();
  const steps = p.type.k === 'table'
    ? ['ตรวจชื่อชีตและคอลัมน์ในไฟล์ที่แนบ ถ้าไม่ตรงกับที่คาดให้แจ้งก่อนทำงาน', 'ตรวจค่าว่าง ค่าซ้ำ และชนิดข้อมูลผิด', 'สรุปตัวเลขสำคัญและแนวโน้มตามคำขอ', 'เสนอสูตร Excel หรือกราฟเมื่อผู้ใช้ต้องการ']
    : ['อ่านไฟล์ที่ผู้ใช้แนบในแชททั้งหมดก่อนตอบ', 'สรุปประเด็นหลักและ' + p.type.checks[0], 'ตรวจ' + p.type.checks.slice(1).join(' และ '), 'จัดผลลัพธ์ตามรูปแบบที่กำหนดและระบุสิ่งที่ต้องทำต่อ'];
  const instr = `บทบาท\nคุณคือผู้ช่วยวิเคราะห์${p.type.label}${heads.length ? ` เชี่ยวชาญเรื่อง ${heads.slice(0, 2).join(' และ ')}` : ''} ทำงานให้${aud}\n\nเป้าหมาย\nช่วยอ่าน สรุป และตรวจ${p.type.label}ที่ผู้ใช้แนบ ให้ได้ผลลัพธ์ที่ถูกต้อง ตรวจสอบได้ และนำไปใช้ต่อได้ทันที\n\nข้อมูลนำเข้า\n- ไฟล์${p.kind === 'table' ? ' Excel/CSV' : p.kind === 'pdf' ? ' PDF' : ''}ที่ผู้ใช้แนบในแชทตอนเรียกใช้ (ไม่ใช้ไฟล์เป็น Knowledge)\n${p.kind === 'table' ? `- โครงสร้างที่คาดหวัง: ${p.sheets.filter(s => s.cols.length).slice(0, 2).map(s => `ชีต "${s.name}" คอลัมน์ ${s.cols.slice(0, 10).map(c => c.name).join(', ')}`).join(' · ')}\n` : ''}- คำถามหรือคำสั่งเพิ่มเติมจากผู้ใช้\n\nขั้นตอน\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nรูปแบบผลลัพธ์\n${fmt}\nขึ้นต้นด้วยสรุป 3 บรรทัด แล้วตามด้วยรายละเอียด\n\nการตรวจสอบ\n- อ้างอิง${paRef(p)}ที่มาทุกประเด็น\n- ตรวจตัวเลขซ้ำก่อนตอบ และแสดงวิธีคำนวณ\n${p.type.checks.map(c => '- ' + c).join('\n')}\n\nข้อห้าม\n- ห้ามแต่งข้อมูลที่ไม่มีในไฟล์\n- ห้ามเปิดเผยข้อมูลส่วนบุคคลหรือข้อมูลลับเกินจำเป็น\n- ห้ามตัดสินใจแทน${aud === 'ผู้มีอำนาจอนุมัติ' ? 'ผู้มีอำนาจอนุมัติ' : 'ผู้รับผิดชอบหรือผู้มีอำนาจอนุมัติ'}\n\nเมื่อไม่แน่ใจ\n- ถามผู้ใช้กลับ 1–3 คำถามก่อนทำต่อ\n- ถ้าไฟล์ไม่ครบหรืออ่านไม่ได้ ให้บอกว่าขาดอะไรและขอไฟล์เพิ่ม\n- ระบุระดับความมั่นใจ (สูง/กลาง/ต่ำ) ในข้อสรุปที่ไม่มีหลักฐานชัด${o.extra.trim() ? `\n\nหมายเหตุจากผู้สร้าง: ${o.extra.trim()}` : ''}`;
  C.push(['agent', 'bot', 'Agent Instructions 8 ส่วน (สร้าง Copilot Agent)', `Name: ${nm}\nDescription: ผู้ช่วยอ่าน สรุป และตรวจ${p.type.label} แนบไฟล์ในแชทแล้วสั่งงานได้ทันที\n\nInstructions:\n${instr}`, instr.length]);
  const gi = C.findIndex(c => c[0] === o.goal);
  if (gi > 0) C.unshift(C.splice(gi, 1)[0]);
  return C;
}

// ---- UI ----
function paSectionHTML() {
  const o = paState.opts;
  return `<section class="cgroup pa" id="plab" aria-labelledby="paT">
  <div class="pa-head"><h2 class="sec" id="paT">${ic('sparkle')}<span>Prompt Lab อัตโนมัติ</span></h2><span class="pill pa-new">${ic('flash')}<span>ใหม่</span></span></div>
  <p>โยนไฟล์ <b>PDF</b>, Excel, CSV หรือ<b>วางข้อความ</b> ระบบวิเคราะห์โครงสร้างเอกสารในเครื่องนี้ แล้วสร้าง Prompt พร้อมใช้ 7 แบบทันที · <b>ไม่ส่งไฟล์หรือข้อความออกจากเครื่อง</b> · ดู Prompt ตัวอย่าง 12 หมวดที่ <a href="#/p/23">Prompt Lab</a></p>
  <div class="pa-grid">
    <div class="card pa-in">
      <div class="drop pa-drop" tabindex="0" role="button" aria-label="เลือกไฟล์เพื่อสร้าง Prompt: ลากไฟล์มาวาง หรือกดเพื่อเลือกไฟล์">${ic('arrow_upload')}<b><span class="t-mouse">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</span><span class="t-touch">แตะเพื่อเลือกไฟล์ PDF / Excel</span></b><small>.pdf .xlsx .xls .csv .txt · สูงสุด ${PA_MAX_MB} MB · PDF อ่าน ${PA_MAX_PAGES} หน้าแรก</small><input type="file" hidden accept=".pdf,.xlsx,.xls,.csv,.txt,.md,.docx,.pptx" data-pa-file></div>
      <div class="field"><label for="paText">หรือวางข้อความ</label><textarea id="paText" rows="5" placeholder="วางเนื้อหาเอกสาร บันทึกประชุม อีเมล หรือขั้นตอนงานที่นี่…">${esc(paState.text)}</textarea></div>
      <div class="pa-opts">
        <div class="field"><label for="paGoal">เป้าหมาย</label><select id="paGoal" data-pa-opt="goal">${PA_GOALS.map(([k, t]) => `<option value="${k}" ${o.goal === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="paAud">ผู้อ่าน</label><select id="paAud" data-pa-opt="aud">${PA_AUD.map(t => `<option ${o.aud === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="paFmt">รูปแบบผลลัพธ์</label><select id="paFmt" data-pa-opt="fmt">${Object.entries(PA_FMT).map(([k, v]) => `<option value="${k}" ${o.fmt === k ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select></div>
        <div class="field"><label for="paExtra">ความต้องการเพิ่มเติม</label><input id="paExtra" data-pa-opt="extra" value="${esc(o.extra)}" placeholder="เช่น เน้นเรื่องต้นทุน · ภาษาอังกฤษ"></div>
      </div>
      <label class="pa-inc"><input type="checkbox" data-pa-opt="inc" ${o.inc ? 'checked' : ''}><span>ใส่ข้อความที่วางลงใน Prompt ด้วย (ไม่เกิน ${PA_TEXT_IN_PROMPT.toLocaleString('th-TH')} ตัวอักษร)</span></label>
      <div class="pa-actions"><button type="button" class="btn btn-primary" data-pa-go>${ic('sparkle')}<span>สร้าง Prompt จากข้อความ</span></button><button type="button" class="btn btn-subtle" data-pa-clear>${ic('dismiss')}<span>ล้าง</span></button></div>
      <p class="pa-status" role="status" aria-live="polite" data-pa-status>${esc(paState.status)}</p>
    </div>
    <div class="card pa-prof" data-pa-prof>${paProfileHTML()}</div>
  </div>
  <div class="pa-cards" data-pa-cards>${paCardsHTML()}</div>
</section>`;
}
function paProfileHTML() {
  const p = paState.profile;
  if (paState.busy) return `<div class="pa-empty">${ic('arrow_sync', 'spin')}<b>กำลังวิเคราะห์ในเครื่อง…</b><small>ไม่มีการอัปโหลดไฟล์</small></div>`;
  if (!p) return `<div class="pa-empty">${ic('document_search')}<b>ผลวิเคราะห์เอกสารจะแสดงที่นี่</b><small>ประเภทเอกสาร หัวข้อ คำสำคัญ ตัวเลข/วันที่ และโครงสร้างตาราง</small><ol class="pa-how"><li>โยนไฟล์หรือวางข้อความ</li><li>เลือกเป้าหมาย ผู้อ่าน และรูปแบบ</li><li>คัดลอก Prompt ไปใช้ใน Copilot พร้อมแนบไฟล์ในแชท</li></ol></div>`;
  const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : '';
  const yes = b => b ? 'พบ' : 'ไม่พบ';
  return `<h3 class="pa-ph">${ic(p.kind === 'pdf' ? 'document' : p.kind === 'table' ? 'table' : p.src === 'text' ? 'text_bullet_list_square' : 'document_text')}<span data-pa-name>${esc(p.src === 'text' ? 'ข้อความที่วาง' : p.name)}</span></h3>
  ${p.warn ? `<p class="badge-verify pa-warn" role="note" data-pa-warn>${ic('warning')}<span>${esc(p.warn)}</span></p>` : ''}
  <dl class="pa-dl">
    ${row('ประเภทที่ตรวจพบ', `<span class="pill">${esc(p.type.label)}</span>`)}
    ${row('ขนาด', [p.kind === 'pdf' ? `${p.pages} หน้า` : '', p.size != null ? fmtSize(p.size) : '', p.chars ? `${p.chars.toLocaleString('th-TH')} ตัวอักษร` : ''].filter(Boolean).join(' · '))}
    ${row('ภาษา', p.lang && p.lang !== '—' ? esc(p.lang) : '')}
    ${p.kind === 'table' ? row('ชีต', p.sheets.map(s => `<div class="pa-sheet"><b>${esc(s.name)}</b> · ${s.rows.toLocaleString('th-TH')} แถว${s.range ? ' · ' + esc(s.range) : ''}<div class="pa-chips">${s.cols.map(c => `<span class="chip" title="${esc(c.type)}${c.blank ? ` · ว่าง ${c.blank} แถว` : ''}">${esc(c.name)} <i>${esc(c.type)}</i></span>`).join('') || '<small>ไม่พบหัวคอลัมน์</small>'}</div></div>`).join('')) : ''}
    ${row('หัวข้อที่พบ', p.headings.length ? `<ul class="pa-heads">${p.headings.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : '')}
    ${row('คำสำคัญ', p.keywords.length ? `<div class="pa-chips">${p.keywords.map(k => `<span class="chip">${esc(k)}</span>`).join('')}</div>` : '')}
    ${p.kind !== 'table' && !p.empty ? row('ข้อมูลที่พบ', `ตัวเลข ${p.nums.toLocaleString('th-TH')} จุด · เปอร์เซ็นต์ ${yes(p.pct)} · วันที่ ${yes(p.date)} · จำนวนเงิน ${yes(p.money)} · ตาราง ${yes(p.table)}`) : ''}
  </dl>
  <p class="hint">${ic('lock_closed')} วิเคราะห์ในเบราว์เซอร์นี้เท่านั้น · Prompt สร้างจากแม่แบบตามโครงสร้างเอกสาร ตรวจและปรับก่อนใช้${p.kind === 'pdf' && !p.empty ? ' · PDF ภาษาไทยบางไฟล์ดึงสระหรือวรรณยุกต์ได้ไม่ครบ ตรวจหัวข้อก่อนใช้' : ''}</p>`;
}
function paCardsHTML() {
  const p = paState.profile;
  if (!p || paState.busy) return '';
  const cards = paBuild(p, paState.opts);
  return `<h3 class="pa-ch">${ic('chat')}<span>Prompt ที่สร้างให้ (${cards.length} แบบ)</span><small>คัดลอกไปวางใน Copilot Chat${p.src === 'text' ? '' : ' แล้วแนบไฟล์เดียวกันในแชท'}</small></h3>
  <div class="cards grid-2">${cards.map(([k, i, t, txt, n], idx) => `<article class="card pa-card ${idx === 0 ? 'rec' : ''}" data-pa-card="${k}"><div class="prompt"><div class="prompt-head">${ic(i)}<span>${idx === 0 ? 'แนะนำ · ' : ''}${esc(t)}</span>${n != null ? `<span class="cnt ${n > 8000 ? 'over' : ''}" title="Instructions ≤ 8,000 ตัวอักษร">${n.toLocaleString('th-TH')}/8,000</span>` : ''}<button type="button" class="btn btn-subtle btn-copy" data-copy>${ic('copy')}<span>คัดลอก</span></button></div><pre tabindex="0"><code>${esc(txt)}</code></pre></div></article>`).join('')}</div>`;
}
function paRefresh(root) {
  const sec = root.querySelector('#plab'); if (!sec) return;
  sec.querySelector('[data-pa-prof]').innerHTML = paProfileHTML();
  sec.querySelector('[data-pa-cards]').innerHTML = paCardsHTML();
  sec.querySelector('[data-pa-status]').textContent = paState.status;
}
async function paHandleFile(f, root) {
  if (!f || paState.busy) return;
  paState.busy = true; paState.status = `กำลังอ่าน ${f.name}…`; paRefresh(root);
  try {
    paState.profile = await paAnalyzeFile(f);
    paState.status = `วิเคราะห์ ${f.name} แล้ว · สร้าง Prompt 7 แบบ`;
  } catch (e) {
    paState.profile = null; paState.status = 'อ่านไฟล์ไม่ได้: ' + (e && e.message || e);
  }
  paState.busy = false; paRefresh(root);
  if (paState.profile) { toast('สร้าง Prompt แล้ว'); const c = root.querySelector('[data-pa-cards]'); if (c && c.scrollIntoView && innerWidth < 900) c.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); }
}
function paFromText(root, quiet) {
  const t = paState.text.trim();
  if (!t) { if (!quiet) { paState.status = 'วางข้อความก่อน หรือเลือกไฟล์'; paRefresh(root); } return; }
  if (t.length < 20) { paState.status = 'ข้อความสั้นเกินไป (อย่างน้อย 20 ตัวอักษร)'; paRefresh(root); return; }
  paState.profile = { src: 'text', kind: 'text', name: 'ข้อความ', ...paAnalyzeText(t) };
  paState.status = `วิเคราะห์ข้อความ ${paState.profile.chars.toLocaleString('th-TH')} ตัวอักษรแล้ว · สร้าง Prompt 7 แบบ`;
  paRefresh(root);
}
function wirePromptLab(root) {
  const sec = root.querySelector('#plab'); if (!sec) return;
  const input = sec.querySelector('[data-pa-file]'), drop = sec.querySelector('.pa-drop'), ta = sec.querySelector('#paText');
  drop.addEventListener('click', e => { if (e.target !== input) input.click(); });
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); paHandleFile(e.dataTransfer.files[0], root); });
  input.addEventListener('change', () => { paHandleFile(input.files[0], root); input.value = ''; });
  let tt;
  ta.addEventListener('input', () => { paState.text = ta.value; clearTimeout(tt); tt = setTimeout(() => { if (paState.text.trim().length >= 20 && !paState.busy) paFromText(root, true); }, 600); });
  ta.addEventListener('paste', () => setTimeout(() => { paState.text = ta.value; clearTimeout(tt); paFromText(root, true); }, 0));
  sec.querySelector('[data-pa-go]').addEventListener('click', () => { paState.text = ta.value; paFromText(root); });
  sec.querySelector('[data-pa-clear]').addEventListener('click', () => { paState.text = ''; ta.value = ''; paState.profile = null; paState.status = ''; paRefresh(root); ta.focus(); });
  sec.querySelectorAll('[data-pa-opt]').forEach(el => el.addEventListener(el.tagName === 'INPUT' && el.type !== 'checkbox' ? 'input' : 'change', () => {
    paState.opts[el.dataset.paOpt] = el.type === 'checkbox' ? el.checked : el.value;
    if (paState.profile) sec.querySelector('[data-pa-cards]').innerHTML = paCardsHTML();
  }));
}
