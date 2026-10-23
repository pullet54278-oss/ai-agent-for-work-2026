// ---------- Skill Builder (หน้าเสริม 21A) ----------
// โยนไฟล์ PDF/Word/Excel → อ่านโครงสร้างในเครื่อง → เขียน SKILL.md → ตรวจกติกา Agent Builder → ดาวน์โหลด .zip (ไม่ส่งไฟล์ออก)
const SK = D.skillCfg || { limits: {}, types: { res: [], script: [] } };
const SK_TASKS = {
  qa: ['ตอบคำถามจากเอกสาร', ['อ่านไฟล์อ้างอิงที่เกี่ยวข้องกับคำถามก่อนตอบทุกครั้ง', 'หาหัวข้อหรือส่วนที่ตรงกับคำถาม', 'ตอบตามเนื้อหาในเอกสาร ถ้าเป็นขั้นตอนให้เรียงตามลำดับในเอกสาร', 'ระบุผู้รับผิดชอบ เงื่อนไข หรือบันทึกที่เกี่ยวข้อง (ถ้ามี)'], 'คำตอบสั้น 1–2 บรรทัด ตามด้วยรายละเอียดแบบมีเลขข้อ และบรรทัด "อ้างอิง: ชื่อไฟล์ · หัวข้อ"'],
  lookup: ['ค้นหาและแนะนำจากตาราง', ['อ่านทุกชีตที่เกี่ยวข้องก่อนตอบ', 'กรองข้อมูลตามเงื่อนไขที่ผู้ใช้ระบุ (เช่น รหัส หมวด กลุ่ม)', 'เปรียบเทียบตัวเลือก และคำนวณผลรวมหรือค่าเฉลี่ยเมื่อผู้ใช้ต้องการ', 'แนะนำตัวเลือกที่เหมาะที่สุด พร้อมเหตุผล'], 'ตารางผลลัพธ์ (คอลัมน์ตามไฟล์) ตามด้วยข้อสรุปและข้อแนะนำ 1–3 บรรทัด'],
  check: ['ตรวจตาม Checklist หรือเกณฑ์', ['อ่านเกณฑ์หรือ Checklist ในไฟล์อ้างอิง', 'เทียบข้อมูลที่ผู้ใช้ให้มาทีละข้อ', 'ระบุผล: ผ่าน / ไม่ผ่าน / ไม่พบหลักฐาน พร้อมเหตุผล', 'จัดลำดับสิ่งที่ต้องแก้ตามระดับความเสี่ยง'], 'ตาราง ข้อ | เกณฑ์ | ผล | หลักฐาน | สิ่งที่ต้องทำ ตามด้วยสรุป 3 บรรทัด'],
  report: ['สรุปและทำรายงาน', ['ดึงตัวเลขและประเด็นสำคัญจากไฟล์อ้างอิง', 'เทียบกับเป้าหมายหรือช่วงก่อนหน้า (ถ้ามีในไฟล์) และแสดงวิธีคำนวณ', 'สรุปแนวโน้ม จุดเด่น และจุดที่ต้องติดตาม', 'ร่างข้อความตามรูปแบบที่ผู้ใช้ต้องการ'], 'สรุป 5 บรรทัด + ตารางตัวเลขสำคัญ (ระบุหน่วยและช่วงเวลา)']
};
let sbState = { files: [], name: '', topic: '', task: 'qa', desc: '', md: '', dirty: false, busy: false, msg: '' };
const sbExt = n => (n.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
const sbSlug = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-').slice(0, 50).replace(/-+$/, '');
const sbYaml = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s*\n\s*/g, ' ') + '"';

// --- อ่าน .docx (zip) ในเครื่อง: word/document.xml → หัวข้อ + ข้อความ ---
async function sbInflate(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('เบราว์เซอร์นี้แตกไฟล์ไม่ได้');
  const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(ds).arrayBuffer());
}
async function sbZipEntry(buf, want) {
  const u = new Uint8Array(buf), v = new DataView(buf);
  let eo = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eo = i; break; }
  if (eo < 0) throw new Error('ไฟล์เสียหรือไม่ใช่เอกสาร Word');
  let p = v.getUint32(eo + 16, true); const n = v.getUint16(eo + 10, true);
  for (let i = 0; i < n; i++) {
    const method = v.getUint16(p + 10, true), cs = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + nl));
    if (name === want) {
      const start = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
      const body = u.subarray(start, start + cs);
      return method === 8 ? sbInflate(body) : body;
    }
    p += 46 + nl + xl + cl;
  }
  throw new Error('ไม่พบเนื้อหาเอกสาร (word/document.xml)');
}
const sbXml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
async function sbReadDocx(f) {
  const xml = new TextDecoder().decode(await sbZipEntry(await f.arrayBuffer(), 'word/document.xml'));
  const paras = xml.split(/<w:p[ >]/).slice(1).map(x => ({ style: (x.match(/<w:pStyle w:val="([^"]+)"/) || [, ''])[1], text: sbXml([...x.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map(m => m[1]).join('')).trim() })).filter(x => x.text);
  const text = paras.map(x => x.text).join('\n');
  let headings = paras.filter(x => /^(heading|title|หัวเรื่อง)/i.test(x.style) || /^Heading\d/.test(x.style)).map(x => x.text);
  const title = (paras.find(x => /^title/i.test(x.style)) || {}).text || '';
  if (!headings.length) headings = paHeadings(text, 40);
  return { text, headings: [...new Set(headings)].filter(h => h !== title).slice(0, 10), title, chars: text.replace(/\s/g, '').length };
}
async function sbAnalyze(f) {
  const ext = sbExt(f.name), info = { name: f.name, size: f.size, ext };
  const L = SK.limits;
  if (f.name.toLowerCase() === 'skill.md') { info.error = 'ไฟล์ชื่อ SKILL.md สร้างให้อัตโนมัติ · ใช้ช่องแก้ไขด้านขวาแทน'; return info; }
  if (![...SK.types.res, ...SK.types.script].includes(ext)) { info.error = 'ชนิดไฟล์ไม่รองรับใน Skill'; return info; }
  if (f.size > L.fileMB * 1048576) { info.error = `ไฟล์ใหญ่เกิน ${L.fileMB} MB`; return info; }
  try {
    if (ext === 'pdf') { const r = await paReadPDF(f); info.kind = 'pdf'; info.pages = r.pages; info.title = r.title || (r.text.split('\n').map(l => l.trim()).find(l => l.length >= 4 && l.length <= 80) || ''); info.headings = sbCleanHeads(paHeadings(r.text, 40), info.title); if (r.text.replace(/\s/g, '').length < 20) info.warn = 'ไม่พบข้อความ (อาจเป็นภาพสแกน) · Agent อาจอ่านเนื้อหาไม่ได้'; }
    else if (/^(xlsx|xls|xlsm|csv|tsv)$/.test(ext)) { info.kind = 'table'; info.sheets = (await paReadTable(f)).filter(s => s.cols.length); }
    else if (/^(docx|docm)$/.test(ext)) { const r = await sbReadDocx(f); info.kind = 'docx'; info.headings = sbCleanHeads(r.headings, r.title); info.title = r.title; if (r.chars < 20) info.warn = 'ไม่พบข้อความในเอกสาร'; }
    else if (/^(txt|md|html|htm|log|rtf)$/.test(ext)) { const t = await f.text(); info.kind = 'text'; info.headings = paHeadings(t.replace(/<[^>]+>/g, '\n')).slice(0, 10); }
    else info.kind = SK.types.script.includes(ext) ? 'script' : 'other';
  } catch (e) { info.kind = 'other'; info.warn = 'อ่านโครงสร้างไม่ได้ (' + (e && e.message || e) + ') · ยังใส่ใน zip ได้'; }
  return info;
}

// หัวข้อสำหรับ SKILL.md: สั้น ไม่ใช่ขั้นตอนย่อยหรือเศษบรรทัดที่ถูกตัด
const sbCleanHeads = (hs, title) => hs.filter(h => h !== title && h.length >= 4 && h.length <= 48 && !/^[^(]*\)$/.test(h)).slice(0, 10);
// --- สร้าง SKILL.md ---
function sbFileLine(x) {
  if (x.kind === 'table') return `- \`${x.name}\`\n${x.sheets.length ? x.sheets.slice(0, 8).map(s => `  - ชีต "${s.name}" (${s.rows.toLocaleString('th-TH')} แถว): ${s.cols.slice(0, 20).map(c => `${c.name} (${c.type})`).join(', ')}`).join('\n') : '  - (ไม่พบหัวคอลัมน์ · อธิบายคอลัมน์เพิ่มเอง)'}`;
  const what = x.kind === 'pdf' ? `PDF ${x.pages} หน้า` : x.kind === 'docx' ? 'เอกสาร Word' : x.kind === 'script' ? 'สคริปต์' : x.ext.toUpperCase();
  return `- \`${x.name}\` (${what})${x.headings && x.headings.length ? ` หัวข้อ: ${x.headings.slice(0, 8).join(' · ')}` : ' · อธิบายเนื้อหาไฟล์เพิ่มเอง'}`;
}
function sbDefaults() {
  const ok = sbState.files.filter(x => !x.error);
  const first = ok[0];
  if (!sbState.nameSet) { const b = first ? sbSlug(first.name.replace(/\.[^.]+$/, '')) : ''; sbState.name = (b ? b + '-assistant' : 'my-skill').slice(0, 64).replace(/-+$/, ''); }
  if (!sbState.topicSet) sbState.topic = first ? (first.title || first.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')).replace(/\s*[·(]\s*ตัวอย่าง\)?\s*$/, '').trim() : '';
  if (first && sbState.task === 'qa' && !sbState.taskSet && ok.every(x => x.kind === 'table')) sbState.task = 'lookup';
}
function sbDesc() {
  const t = SK_TASKS[sbState.task][0], ok = sbState.files.filter(x => !x.error);
  return sbState.desc.trim() || `${t}เรื่อง ${sbState.topic || '…'}${ok.length ? ` จากไฟล์ ${ok.map(x => x.name).join(', ')}` : ''} ใช้เมื่อผู้ใช้ถามหรือขอให้ช่วยงานเกี่ยวกับ ${sbState.topic || '…'}`;
}
function sbGenerate() {
  const [tl, steps, out] = SK_TASKS[sbState.task], ok = sbState.files.filter(x => !x.error);
  return `---
name: ${sbState.name}
description: ${sbYaml(sbDesc().slice(0, SK.limits.desc))}
---

# บทบาท
คุณคือผู้ช่วย${tl}เรื่อง ${sbState.topic || '…'} ตอบให้ถูกต้องตามไฟล์อ้างอิงใน Skill นี้ เข้าใจง่าย และตรวจสอบได้

# เมื่อใดใช้ Skill นี้
- ${sbDesc()}

# ไฟล์อ้างอิงใน Skill
${ok.length ? ok.map(sbFileLine).join('\n') : '- (ยังไม่มีไฟล์ · เพิ่มไฟล์ PDF, Word หรือ Excel)'}

# ขั้นตอน
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

# รูปแบบผลลัพธ์
${out}

# การตรวจสอบ
- อ้างอิงชื่อไฟล์และหัวข้อ/ชีตที่ใช้ทุกครั้ง
- ตัวเลข ชื่อ และเงื่อนไข ต้องตรงกับไฟล์ ตรวจซ้ำก่อนตอบ และแสดงวิธีคำนวณเมื่อคำนวณใหม่

# ข้อห้าม
- ห้ามแต่งข้อมูลที่ไม่มีในไฟล์อ้างอิง
- ห้ามเปิดเผยข้อมูลส่วนบุคคลหรือข้อมูลลับเกินจำเป็น
- ห้ามตัดสินใจหรืออนุมัติแทนผู้รับผิดชอบหรือผู้มีอำนาจอนุมัติ

# เมื่อไม่แน่ใจ
- ถ้าไม่พบคำตอบในไฟล์ ให้ตอบว่า "ไม่พบในเอกสารอ้างอิง" และแนะนำให้สอบถามผู้รับผิดชอบ
- ถ้าคำถามกำกวม ให้ถามกลับ 1–2 คำถามก่อนทำต่อ
`;
}

// --- ตรวจกติกา (Agent Builder · Preview) ---
function sbParse(md) {
  const m = md.replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: null, body: md };
  const get = k => { const r = m[1].match(new RegExp('^' + k + ':[ \\t]*(.*)$', 'm')); return r ? r[1].trim() : null; };
  return { fm: m[1], name: get('name'), descRaw: get('description'), body: md.replace(/\r/g, '').slice(m[0].length) };
}
function sbChecks() {
  const L = SK.limits, md = sbState.md, P = sbParse(md), files = sbState.files.filter(x => !x.error), C = [];
  const add = (lvl, t) => C.push([lvl, t]);
  if (!P.fm) add('err', 'SKILL.md ต้องขึ้นต้นด้วย YAML front matter ระหว่างเส้น --- (บรรทัดแรก) และปิดด้วย ---');
  else {
    if (!P.name) add('err', 'ไม่มีฟิลด์ name');
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(P.name)) add('err', `name "${P.name}" ต้องเป็นตัวพิมพ์เล็ก a–z ตัวเลข และ - เท่านั้น ไม่มีช่องว่าง ไม่ขึ้นต้น/ลงท้ายด้วย -`);
    else if (P.name.length > L.name) add('err', `name ยาว ${P.name.length} ตัวอักษร (สูงสุด ${L.name})`);
    else add('ok', `name: ${P.name}`);
    const d = P.descRaw == null ? '' : P.descRaw.replace(/^"([\s\S]*)"$/, '$1').replace(/^'([\s\S]*)'$/, '$1');
    if (!d) add('err', 'ไม่มีฟิลด์ description (Agent ใช้ข้อความนี้เลือกว่าจะใช้ Skill เมื่อใด)');
    else if (d.length > L.desc) add('err', `description ยาว ${d.length.toLocaleString('th-TH')} ตัวอักษร (สูงสุด ${L.desc.toLocaleString('th-TH')})`);
    else if (!/^["']/.test(P.descRaw) && /:\s|\s#/.test(P.descRaw)) add('err', 'description มีเครื่องหมาย : หรือ # ให้ใส่เครื่องหมาย " ครอบทั้งข้อความ');
    else add('ok', `description ${d.length.toLocaleString('th-TH')}/${L.desc.toLocaleString('th-TH')} ตัวอักษร`);
    if (d && !/ใช้เมื่อ|when/i.test(d)) add('warn', 'description ควรบอกว่า "ใช้เมื่อ…" เพื่อให้ Agent เลือกใช้ Skill ได้ถูก');
  }
  const bl = (P.body || '').length;
  if (bl >= L.instr) add('err', `คำสั่งยาว ${bl.toLocaleString('th-TH')} ตัวอักษร (ต้องน้อยกว่า ${L.instr.toLocaleString('th-TH')})`);
  else add('ok', `คำสั่ง ${bl.toLocaleString('th-TH')}/${L.instr.toLocaleString('th-TH')} ตัวอักษร`);
  const names = files.map(x => x.name.toLowerCase());
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  if (dup.length) add('err', 'มีชื่อไฟล์ซ้ำ: ' + [...new Set(dup)].join(', '));
  const total = files.reduce((a, x) => a + x.size, 0) + new Blob([md]).size;
  if (files.length + 1 > L.files) add('err', `ไฟล์ ${files.length + 1} ไฟล์ (สูงสุด ${L.files})`);
  if (total > L.zipMB * 1048576) add('err', `ขนาดรวม ${fmtSize(total)} เกิน ${L.zipMB} MB`);
  else add('ok', `ขนาด zip ประมาณ ${fmtSize(total)} (สูงสุด ${L.zipMB} MB · ไฟล์ละ ${L.fileMB} MB)`);
  sbState.files.filter(x => x.error).forEach(x => add('err', `${x.name}: ${x.error} (จะไม่ใส่ใน zip)`));
  files.filter(x => x.warn).forEach(x => add('warn', `${x.name}: ${x.warn}`));
  files.filter(x => P.body && !P.body.includes(x.name)).forEach(x => add('warn', `SKILL.md ยังไม่ได้อ้างถึงไฟล์ ${x.name}`));
  if (!files.length) add('warn', 'ยังไม่มีไฟล์ประกอบ (Skill ใช้ได้ แต่ไม่มีข้อมูลอ้างอิง)');
  add('info', 'ช่วง Preview: Agent ที่มี Skill ยังใช้ร่วมกับไฟล์ที่อัปโหลดเป็น Knowledge ไม่ได้ · ใส่ไฟล์ไว้ใน Skill แทน');
  return C;
}

// --- ZIP (STORE, UTF-8) ---
const SB_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const sbCrc = u => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = SB_CRC[(c ^ u[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function sbZip(entries) {
  const parts = [], cen = []; let off = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const { name, data } of entries) {
    const nm = new TextEncoder().encode(name), crc = sbCrc(data);
    const h = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, nm.length, 2], [28, 0, 2]].forEach(([o, v, s]) => s === 4 ? h.setUint32(o, v, true) : h.setUint16(o, v, true));
    parts.push(h.buffer, nm, data);
    const c = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, nm.length, 2], [42, off, 4]].forEach(([o, v, s]) => s === 4 ? c.setUint32(o, v, true) : c.setUint16(o, v, true));
    cen.push(c.buffer, nm);
    off += 30 + nm.length + data.length;
  }
  const cl = cen.reduce((a, b) => a + b.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, e.buffer], { type: 'application/zip' });
}

// --- UI ---
function sbFilesHTML() {
  if (!sbState.files.length) return '<p class="hint">ยังไม่มีไฟล์</p>';
  return `<ul class="sb-files">${sbState.files.map((x, i) => `<li class="${x.error ? 'bad' : x.warn ? 'warn' : ''}">${ic(x.error ? 'dismiss_circle' : x.kind === 'table' ? 'table' : x.kind === 'pdf' ? 'document' : 'document_text')}<span><b>${esc(x.name)}</b><small>${fmtSize(x.size)}${x.kind === 'pdf' ? ` · ${x.pages} หน้า` : ''}${x.kind === 'table' ? ` · ${x.sheets.length} ชีต` : ''}${x.headings && x.headings.length ? ` · ${x.headings.length} หัวข้อ` : ''}${x.error ? ' · ' + esc(x.error) : x.warn ? ' · ' + esc(x.warn) : ''}</small></span><button type="button" class="btn btn-subtle" data-sb-rm="${i}" aria-label="เอา ${esc(x.name)} ออก">${ic('dismiss')}</button></li>`).join('')}</ul>`;
}
function sbChecksHTML() {
  const C = sbChecks(), bad = C.filter(c => c[0] === 'err').length;
  return `<p class="sb-sum ${bad ? 'bad' : 'ok'}" data-sb-sum>${ic(bad ? 'warning' : 'checkmark_circle')}<span>${bad ? `ต้องแก้ ${bad} ข้อก่อนดาวน์โหลด` : 'ผ่านการตรวจ พร้อมดาวน์โหลด .zip'}</span></p><ul class="sb-checks">${C.map(([l, t]) => `<li class="${l}">${ic(l === 'ok' ? 'checkmark_circle' : l === 'err' ? 'dismiss_circle' : l === 'warn' ? 'warning' : 'info')}<span>${esc(t)}</span></li>`).join('')}</ul>`;
}
function sbRender(el) {
  const s = sbState;
  el.innerHTML = `<div class="sb-grid">
    <div class="card sb-in">
      <div class="drop sb-drop" tabindex="0" role="button" aria-label="เพิ่มไฟล์ประกอบของ Skill: ลากไฟล์มาวาง หรือกดเพื่อเลือกไฟล์">${ic('arrow_upload')}<b>ลากไฟล์ PDF / Word / Excel มาวาง หรือคลิกเพื่อเลือก</b><small>เลือกได้หลายไฟล์ · ไฟล์ละไม่เกิน ${SK.limits.fileMB} MB · อ่านในเครื่องเท่านั้น</small><input type="file" multiple hidden data-sb-file accept="${[...SK.types.res, ...SK.types.script].map(x => '.' + x).join(',')}"></div>
      <div data-sb-files>${sbFilesHTML()}</div>
      <p class="pa-status" role="status" aria-live="polite" data-sb-msg>${esc(s.msg)}</p>
      <div class="field"><label for="sbTopic">Skill นี้ช่วยงานเรื่องอะไร</label><input id="sbTopic" data-sb="topic" value="${esc(s.topic)}" placeholder="เช่น ขั้นตอนเข้า-ออกพื้นที่เลี้ยง"></div>
      <div class="pa-opts">
        <div class="field"><label for="sbTask">รูปแบบงาน</label><select id="sbTask" data-sb="task">${Object.entries(SK_TASKS).map(([k, v]) => `<option value="${k}" ${s.task === k ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select></div>
        <div class="field"><label for="sbName">name (ตัวพิมพ์เล็ก-ขีด)</label><input id="sbName" data-sb="name" value="${esc(s.name)}" placeholder="sop-assistant" spellcheck="false" autocapitalize="off"></div>
      </div>
      <div class="field"><label for="sbDesc">description (เว้นว่าง = สร้างให้)</label><textarea id="sbDesc" data-sb="desc" rows="3" placeholder="ทำอะไร + ใช้เมื่อใด">${esc(s.desc)}</textarea></div>
      <div class="pa-actions"><button type="button" class="btn btn-outline" data-sb-gen>${ic('arrow_sync')}<span>สร้าง SKILL.md ใหม่จากฟอร์ม</span></button><button type="button" class="btn btn-subtle" data-sb-clear>${ic('dismiss')}<span>ล้างทั้งหมด</span></button></div>
    </div>
    <div class="card sb-out">
      <div class="field"><div class="lbl-row"><label for="sbMd">SKILL.md (แก้ไขได้)</label><span class="cnt" data-sb-cnt></span></div><textarea id="sbMd" rows="18" spellcheck="false" data-sb-md>${esc(s.md)}</textarea></div>
      <div data-sb-checks>${sbChecksHTML()}</div>
      <div class="pa-actions"><button type="button" class="btn btn-primary" data-sb-dl>${ic('arrow_download')}<span>ดาวน์โหลด .zip</span></button><button type="button" class="btn btn-subtle" data-sb-copy>${ic('copy')}<span>คัดลอก SKILL.md</span></button></div>
      <p class="hint">${ic('lock_closed')} โครงสร้าง zip: SKILL.md อยู่ชั้นบนสุด + ไฟล์ประกอบ · อัปโหลดที่ Agent Builder → Configure → Skills → Add</p>
    </div>
  </div>`;
}
function sbRefresh(el, regen) {
  if (regen || !sbState.dirty) { sbDefaults(); sbState.md = sbGenerate(); sbState.dirty = false; }
  const md = el.querySelector('[data-sb-md]'); if (md && md.value !== sbState.md) md.value = sbState.md;
  ['name', 'topic'].forEach(k => { const i = el.querySelector(`[data-sb="${k}"]`); if (i && document.activeElement !== i && i.value !== sbState[k]) i.value = sbState[k]; });
  const t = el.querySelector('[data-sb="task"]'); if (t) t.value = sbState.task;
  el.querySelector('[data-sb-files]').innerHTML = sbFilesHTML();
  el.querySelector('[data-sb-checks]').innerHTML = sbChecksHTML();
  el.querySelector('[data-sb-msg]').textContent = sbState.msg;
  const body = (sbParse(sbState.md).body || '').length, cnt = el.querySelector('[data-sb-cnt]');
  cnt.textContent = `${body.toLocaleString('th-TH')}/${SK.limits.instr.toLocaleString('th-TH')}`; cnt.classList.toggle('over', body >= SK.limits.instr);
}
async function sbAdd(el, list) {
  const fs = [...list]; if (!fs.length || sbState.busy) return;
  sbState.busy = true; sbState.msg = `กำลังอ่าน ${fs.length} ไฟล์ในเครื่อง…`; sbRefresh(el);
  for (const f of fs) { const info = await sbAnalyze(f); info.file = f; sbState.files.push(info); }
  sbState.busy = false;
  const bad = fs.length - fs.filter((f, i) => !sbState.files[sbState.files.length - fs.length + i].error).length;
  sbState.msg = `เพิ่ม ${fs.length} ไฟล์แล้ว${bad ? ` · ใช้ไม่ได้ ${bad} ไฟล์` : ''}${sbState.dirty ? ' · คุณแก้ SKILL.md เอง จึงไม่เขียนทับ (กด "สร้าง SKILL.md ใหม่จากฟอร์ม" ถ้าต้องการ)' : ''}`;
  sbRefresh(el);
}
async function sbDownload(el, btn) {
  const C = sbChecks();
  if (C.some(c => c[0] === 'err')) { sbState.msg = 'ยังมีข้อที่ต้องแก้ (ดูรายการตรวจด้านขวา)'; sbRefresh(el); toast('ยังดาวน์โหลดไม่ได้ · แก้ข้อที่ขึ้นสีแดงก่อน'); return; }
  btn.disabled = true;
  try {
    const entries = [{ name: 'SKILL.md', data: new TextEncoder().encode(sbState.md.replace(/\r/g, '')) }];
    for (const x of sbState.files.filter(x => !x.error)) entries.push({ name: x.name, data: new Uint8Array(await x.file.arrayBuffer()) });
    const blob = sbZip(entries), name = (sbParse(sbState.md).name || 'skill') + '.zip';
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    sbState.msg = `ดาวน์โหลด ${name} แล้ว (${entries.length} ไฟล์ · ${fmtSize(blob.size)})`; toast('สร้าง ' + name + ' แล้ว');
  } catch (e) { sbState.msg = 'สร้าง zip ไม่ได้: ' + (e && e.message || e); }
  btn.disabled = false; sbRefresh(el);
}
function sbBindInner(el) {
  const input = el.querySelector('[data-sb-file]'), drop = el.querySelector('.sb-drop');
  drop.addEventListener('click', e => { if (e.target !== input) input.click(); });
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); sbAdd(el, e.dataTransfer.files); });
  input.addEventListener('change', () => { const l = [...input.files]; input.value = ''; sbAdd(el, l); });
  el.querySelectorAll('[data-sb]').forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => {
    const k = i.dataset.sb; sbState[k] = k === 'name' ? i.value.trim() : i.value; sbState[k + 'Set'] = true;
    if (sbState.dirty) sbState.msg = 'คุณแก้ SKILL.md เอง · กด "สร้าง SKILL.md ใหม่จากฟอร์ม" เพื่อใช้ค่าจากฟอร์ม';
    sbRefresh(el);
  }));
  el.querySelector('[data-sb-md]').addEventListener('input', e => { sbState.md = e.target.value; sbState.dirty = true; sbRefresh(el); });
}
function mountSkillBuilder(el) {
  if (!sbState.md) { sbDefaults(); sbState.md = sbGenerate(); }
  sbRender(el); sbBindInner(el); sbRefresh(el);
  el.addEventListener('click', e => {
    const rm = e.target.closest('[data-sb-rm]');
    if (rm) { sbState.files.splice(+rm.dataset.sbRm, 1); sbState.msg = 'เอาไฟล์ออกแล้ว'; sbRefresh(el); return; }
    if (e.target.closest('[data-sb-gen]')) { sbState.msg = 'สร้าง SKILL.md ใหม่จากฟอร์มแล้ว'; sbRefresh(el, true); return; }
    if (e.target.closest('[data-sb-clear]')) { sbState = { files: [], name: '', topic: '', task: 'qa', desc: '', md: '', dirty: false, busy: false, msg: 'ล้างแล้ว' }; sbDefaults(); sbState.md = sbGenerate(); sbRender(el); sbBindInner(el); sbRefresh(el); return; }
    const dl = e.target.closest('[data-sb-dl]'); if (dl) { sbDownload(el, dl); return; }
    const cp = e.target.closest('[data-sb-copy]'); if (cp) copyText(sbState.md, cp, el.querySelector('[data-sb-md]'));
  });
}
