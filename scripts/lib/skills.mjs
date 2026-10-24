// หน้าเสริม 21A "Skill ของ Agent (SKILL.md / .zip)" + ตัวอย่าง Skill 5 แบบ (zip) · อ้างอิง Microsoft Learn (ก.ย. 2569)
// เนื้อหาเพิ่มเติมจากต้นฉบับ MD (ไม่แตะ content/copilot-ai-agents-for-work.md)
import fs from 'node:fs';
import path from 'node:path';
import { esc, inline, ic, codeHTML, tableHTML, verifyBadge } from './render.mjs';
import { zip } from './zip.mjs';

export const SKILL_LIMITS = { skills: 8, zipMB: 50, fileMB: 25, files: 350, depth: 3, instr: 20000, name: 64, desc: 1024 };
// Microsoft Learn · Custom skills in declarative agents (preview) · Supported file and script types
export const SKILL_TYPES = {
  res: ['json', 'xml', 'yaml', 'yml', 'ini', 'config', 'utf8', 'docx', 'doc', 'docm', 'pdf', 'txt', 'rtf', 'md', 'ppt', 'pptx', 'ppsm', 'xlsx', 'xls', 'xlsm', 'csv', 'tsv', 'html', 'htm', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'log'],
  script: ['py', 'js', 'mjs', 'cjs', 'ts', 'mts', 'sh', 'bash']
};
const SOURCES = [
  ['Add custom skills to your declarative agent in Agent Builder (preview)', 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder-add-skills'],
  ['Custom skills in declarative agents (preview)', 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/declarative-agent-skills'],
  ['Add and manage an uploaded skill (Copilot Studio)', 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-add-existing'],
  ['Agent Skills Specification (รูปแบบ SKILL.md)', 'https://agentskills.io/specification']
];
const EXAMPLES = [
  { slug: 'sop-assistant', title: 'ผู้ช่วยขั้นตอนงาน (SOP)', icon: 'clipboard_task', use: 'ตอบวิธีปฏิบัติงาน ลำดับขั้นตอน ผู้รับผิดชอบ และบันทึกที่ต้องทำ', from: 'PDF', try: ['ก่อนเข้าโรงเรือนต้องทำอะไรบ้าง เรียงตามลำดับ', 'ทำเช็กลิสต์ Biosecurity สำหรับติดหน้าจุดรับรอง', 'ถ้าจุดพ่นยายานพาหนะเสีย ต้องทำอย่างไร'] },
  { slug: 'training-advisor', title: 'ผู้ช่วยแนะนำหลักสูตรอบรม', icon: 'hat_graduation', use: 'ค้นหา เปรียบเทียบ และแนะนำหลักสูตรตามกลุ่มงาน พร้อมชั่วโมงรวม', from: 'Excel', try: ['ทีมจับและขนส่งต้องอบรมหลักสูตรอะไรบ้าง รวมกี่ชั่วโมง', 'หลักสูตรไหนต้องต่ออายุทุก 12 เดือน', 'แนะนำหลักสูตรด้านทักษะดิจิทัลสำหรับพนักงานสำนักงาน'] },
  { slug: 'audit-prep-assistant', title: 'ผู้ช่วยเตรียมการตรวจประเมิน', icon: 'shield_task', use: 'จัดลำดับหลักฐานที่ต้องเตรียมจาก Checklist และติดตาม NC ที่ยังไม่ปิด', from: 'Excel 2 ชีต', try: ['อีก 2 สัปดาห์มีตรวจประเมิน ต้องเตรียมอะไรก่อน', 'NC ที่ยังไม่ปิดมีอะไรบ้าง', 'ข้อ 4.1 ต้องเตรียมหลักฐานอะไร และเคยพบปัญหาอะไร'] },
  { slug: 'animal-welfare-advisor', title: 'ผู้ช่วยด้านสวัสดิภาพสัตว์', icon: 'heart_pulse', use: 'อธิบายแนวปฏิบัติตามคู่มือ และเทียบตัวชี้วัดกับเกณฑ์', from: 'Word', try: ['หลักอิสระ 5 ประการมีอะไรบ้าง', 'อัตราตายสะสมรุ่นนี้ 4.6% อยู่ในเกณฑ์ไหม', 'ข้อควรระวังตอนจับและขนส่งมีอะไร'] },
  { slug: 'esg-assistant', title: 'ผู้ช่วย ESG และความยั่งยืน', icon: 'leaf_two', use: 'สรุปเป้าหมาย ESG และผลตัวชี้วัดเทียบปีก่อนและเป้าหมาย', from: 'Word + Excel', try: ['ตัวชี้วัดไหนยังห่างจากเป้าหมาย 2570 มากที่สุด', 'สรุปผลด้านสิ่งแวดล้อมปี 2569 เป็น 5 บรรทัด', 'ร่างย่อหน้า ESG สำหรับสไลด์ผู้บริหาร'] }
];

const ul = a => `<ul>${a.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`;
const ol = a => `<ol>${a.map(x => `<li>${inline(x)}</li>`).join('')}</ol>`;
const sec = (id, icon, t) => `<h2 class="sec" id="${id}">${ic(icon)}<span>${esc(t)}</span></h2>`;
const card = (t, body, icon) => `<article class="card">${icon ? `<h3 class="sub">${ic(icon)}<span>${esc(t)}</span></h3>` : `<h3>${esc(t)}</h3>`}${body}</article>`;
const vlist = (key, items) => `<ul class="vlist" data-k="${key}">${items.map(x => `<li><label><input type="checkbox"><span>${inline(x)}</span></label></li>`).join('')}</ul><p class="hint" data-vcount></p>`;

export function readExamples(root) {
  const dir = path.join(root, 'content', 'skills', 'examples');
  return EXAMPLES.map(e => {
    const d = path.join(dir, e.slug);
    const files = fs.readdirSync(d).filter(f => !f.startsWith('.')).sort((a, b) => (a === 'SKILL.md' ? -1 : b === 'SKILL.md' ? 1 : a.localeCompare(b)));
    const skill = fs.readFileSync(path.join(d, 'SKILL.md'), 'utf8');
    const fm = skill.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) throw new Error(`${e.slug}/SKILL.md: missing YAML front matter`);
    const name = (fm[1].match(/^name:\s*(.+)$/m) || [])[1];
    const desc = ((fm[1].match(/^description:\s*(.+)$/m) || [])[1] || '').replace(/^"|"$/g, '');
    const body = skill.slice(fm[0].length);
    if (name !== e.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > SKILL_LIMITS.name) throw new Error(`${e.slug}: bad name ${name}`);
    if (!desc || desc.length > SKILL_LIMITS.desc) throw new Error(`${e.slug}: bad description`);
    if (body.length >= SKILL_LIMITS.instr) throw new Error(`${e.slug}: instructions too long`);
    for (const f of files.filter(f => f !== 'SKILL.md')) if (!SKILL_TYPES.res.includes(f.split('.').pop().toLowerCase())) throw new Error(`${e.slug}: unsupported file ${f}`);
    const entries = files.map(f => ({ name: f, data: fs.readFileSync(path.join(d, f)) }));
    return { ...e, name, desc, skill, files: entries.map(x => ({ name: x.name, size: x.data.length })), zip: zip(entries) };
  });
}

const kb = n => n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';

export function skillsPageHTML(examples) {
  const L = SKILL_LIMITS;
  const nav = [['sk-what', 'Skill คืออะไร'], ['sk-files', 'ไฟล์ที่อัปโหลดได้'], ['sk-md', 'โครงสร้าง SKILL.md'], ['sk-zip', 'โครงสร้าง .zip'], ['sk-limits', 'ข้อจำกัด'], ['sk-upload', 'วิธีอัปโหลด'], ['sk-convert', 'แปลง PDF/Word/Excel'], ['sk-builder', 'Skill Builder'], ['sk-examples', 'ตัวอย่าง 5 Skill'], ['sk-ws', 'Workshop'], ['sk-fix', 'ปัญหาที่พบบ่อย']];
  const template = `---
name: my-skill-name
description: "ทำอะไร + ใช้เมื่อใด (Agent เลือกใช้ Skill จากข้อความนี้)"
---

# บทบาท
คุณคือ …

# เมื่อใดใช้ Skill นี้
- …

# ไฟล์อ้างอิงใน Skill
- \`ชื่อไฟล์.pdf\` มีหัวข้อ … / \`ชื่อไฟล์.xlsx\` ชีต … คอลัมน์ …

# ขั้นตอน
1. อ่านไฟล์อ้างอิงก่อนตอบ
2. …

# รูปแบบผลลัพธ์
…

# การตรวจสอบ
- อ้างอิงชื่อไฟล์และหัวข้อ/ชีตที่ใช้ทุกครั้ง

# ข้อห้าม
- ห้ามแต่งข้อมูลที่ไม่มีในไฟล์

# เมื่อไม่แน่ใจ
- ถ้าไม่พบในไฟล์ ให้ตอบว่า "ไม่พบในเอกสาร" และถามกลับ`;
  const createPrompt = `สร้าง Agent ชื่อ "ผู้ช่วยขั้นตอนงาน" ที่ตอบคำถามวิธีปฏิบัติงานจากไฟล์ SOP
และเพิ่ม Skill ที่ทำงานเหมือนเดิมทุกครั้ง:
1. อ่านไฟล์ SOP ก่อนตอบ
2. ตอบเป็นขั้นตอนมีเลขข้อ ระบุผู้รับผิดชอบและบันทึกที่ต้องทำ
3. ถ้าไม่พบในเอกสาร ให้ตอบว่า "ไม่พบในเอกสาร SOP"
บรรจุเป็น Skill ที่มีคำสั่งชัดเจน เพื่อให้ผลลัพธ์รูปแบบเดียวกันทุกครั้ง`;

  return `<p class="lede">Skill คือ "ชุดวิธีทำงาน" ที่บรรจุเป็นไฟล์ <code>SKILL.md</code> พร้อมไฟล์ประกอบ (เช่น PDF, Word, Excel) แล้วเพิ่มเข้า Copilot Agent ทำให้ Agent ทำงานเฉพาะเรื่องได้เหมือนเดิมทุกครั้ง และเขียนคำสั่งได้ยาวกว่าช่อง Instructions</p>
  <div class="callout tip">${ic('info')}<div><b>หน้าเสริม · เพิ่มเติมจากต้นฉบับ</b><p>สรุปจาก Microsoft Learn (อัปเดต 30 ก.ย. 2569) · Skill ใน Agent Builder ยังเป็น <b>Preview</b> ใช้ได้เฉพาะองค์กรที่ลงทะเบียน <b>Microsoft Frontier Program</b> และมี License Microsoft 365 Copilot ที่รองรับ (หรือแบบจ่ายตามการใช้งาน)</p></div></div>
  ${verifyBadge('ชื่อเมนูและสิทธิ์ใช้งาน Skill อ้างอิงเอกสาร Microsoft · ตรวจกับบัญชีจริงก่อนสอน')}
  <nav class="sk-nav" aria-label="หัวข้อในหน้านี้">${nav.map(([id, t]) => `<a class="pill" href="#${id}" data-scroll="${id}">${esc(t)}</a>`).join('')}</nav>

  ${sec('sk-what', 'lightbulb', 'Skill คืออะไร ต่างจาก Instructions และ Knowledge อย่างไร')}
  <p>Skill เป็นส่วนประกอบแยกของ Agent ประกอบด้วยไฟล์ <code>SKILL.md</code> (ชื่อ + คำอธิบาย + คำสั่ง) และไฟล์ประกอบที่ไม่บังคับ เช่น แม่แบบ ข้อมูลอ้างอิง นิยาม หรือสคริปต์ Agent จะ<b>โหลดคำสั่งและไฟล์ของ Skill เฉพาะตอนที่งานต้องใช้</b> (progressive disclosure) จึงมีหลาย Skill ได้โดยไม่ทำให้ Agent สับสน</p>
  ${tableHTML([
    ['', 'Instructions', 'Knowledge', 'Skill', 'แนบไฟล์ในแชท'],
    ['ใช้ทำอะไร', 'บทบาทและกติการวมของ Agent', 'แหล่งค้นข้อมูลเพื่อตอบคำถาม', 'วิธีทำงานเฉพาะเรื่อง + ไฟล์ประกอบ ทำซ้ำได้เหมือนเดิม', 'ไฟล์งานจริงที่เปลี่ยนทุกครั้ง'],
    ['ขนาด', `≤ 8,000 ตัวอักษร`, 'เว็บไซต์ ≤ 4 แหล่ง (ตามกติกาคอร์ส)', `คำสั่ง < ${L.instr.toLocaleString('en-US')} ตัวอักษร · ≤ ${L.skills} Skill ต่อ Agent`, 'ตามขีดจำกัดของแชท'],
    ['Agent ใช้เมื่อไร', 'ทุกครั้ง', 'เมื่อคำถามต้องค้นข้อมูล', 'เมื่อคำขอตรงกับ description ของ Skill', 'เฉพาะแชทนั้น'],
    ['ตัวอย่าง', '"ตอบภาษาไทย อ้างอิงที่มา"', 'เว็บไซต์มาตรฐานสาธารณะ', 'SOP Assistant ที่มีไฟล์ SOP ในตัว', 'ไฟล์ Excel ผลผลิตเดือนนี้']
  ], { label: 'เปรียบเทียบ Instructions Knowledge Skill' })}
  <p class="hint">เคล็ดลับ: ใน Instructions ของ Agent ให้เขียนสั้น ๆ ว่าเมื่อใดควรใช้ Skill ไหน เช่น "คำถามเรื่องขั้นตอนงาน ให้ใช้ Skill sop-assistant" แล้วเก็บรายละเอียดทั้งหมดไว้ใน SKILL.md</p>

  ${sec('sk-files', 'arrow_upload', 'ไฟล์ที่อัปโหลดเป็น Skill ได้')}
  ${tableHTML([
    ['เครื่องมือ', 'รับไฟล์', 'หมายเหตุ'],
    ['**Agent Builder** (Microsoft 365 Copilot)', '**ไฟล์ .zip เท่านั้น** ที่มี SKILL.md', `ห้ามอัปโหลด SKILL.md เดี่ยว ๆ · zip ≤ ${L.zipMB} MB`],
    ['Copilot Studio', 'SKILL.md ไฟล์เดียว หรือ .zip ที่มี SKILL.md', 'สำหรับ Agent ที่สร้างในประสบการณ์ใหม่ของ Copilot Studio']
  ], { label: 'ไฟล์ที่อัปโหลดได้' })}
  <div class="callout">${ic('warning')}<div><b>อัปโหลด PDF, Excel หรือ Word ตรง ๆ เป็น Skill ไม่ได้</b><p>ต้องเขียน SKILL.md เป็นตัวสั่งงาน แล้วใส่ไฟล์เหล่านั้นไว้ใน .zip เดียวกันในฐานะ<b>ไฟล์ประกอบ (resource files)</b> · ไฟล์ประกอบไม่ใช่ Knowledge: Agent อ่านไฟล์เหล่านี้เมื่อใช้ Skill นั้น ตามขั้นตอนที่เขียนใน SKILL.md</p></div></div>

  ${sec('sk-md', 'document_text', 'โครงสร้าง SKILL.md')}
  <p>SKILL.md มี 2 ส่วน: <b>YAML front matter</b> ระหว่างเส้น <code>---</code> ด้านบน และ<b>คำสั่งแบบ Markdown</b> ด้านล่าง · แนะนำให้เขียนคำสั่งตามโครง 8 ส่วนของคอร์ส</p>
  ${codeHTML(template, 'แม่แบบ SKILL.md (คัดลอกได้)')}
  ${tableHTML([
    ['ฟิลด์', 'กติกา', 'ตัวอย่าง'],
    ['`name`', `จำเป็น · ใช้ตัวพิมพ์เล็ก a–z ตัวเลข และ - เท่านั้น ไม่ขึ้นต้น/ลงท้ายด้วย - · ≤ ${L.name} ตัวอักษร (ตามมาตรฐาน Agent Skills)`, '`sop-assistant` ✓ · `Farm SOP Assistant` ✗'],
    ['`description`', `จำเป็น · ≤ ${L.desc.toLocaleString('en-US')} ตัวอักษร · บอกว่า Skill ทำอะไร **และใช้เมื่อใด** เพราะ Agent เลือก Skill จากข้อความนี้ · ใส่เครื่องหมาย " ครอบ ถ้ามี : หรือ #`, '"ตอบคำถามวิธีปฏิบัติงานจาก SOP ใช้เมื่อผู้ใช้ถามขั้นตอน…"'],
    ['คำสั่ง (Markdown)', `ยาวไม่เกิน ${L.instr.toLocaleString('en-US')} ตัวอักษร · อ้างชื่อไฟล์ประกอบให้ตรงทุกตัวอักษร`, 'บทบาท · ขั้นตอน · รูปแบบผลลัพธ์ · การตรวจสอบ · ข้อห้าม · เมื่อไม่แน่ใจ']
  ], { label: 'ฟิลด์ใน SKILL.md' })}
  <p class="hint">ข้อผิดพลาดที่พบบ่อยที่สุดคือ front matter ผิดรูปแบบ (ไม่มีเส้น --- ปิด, ชื่อมีช่องว่าง, description มี : โดยไม่ใส่ " ครอบ) ทำให้ Skill โหลดไม่ขึ้น</p>

  ${sec('sk-zip', 'folder', 'โครงสร้างไฟล์ .zip')}
  ${codeHTML(`sop-assistant.zip
├── SKILL.md              ← จำเป็น · อยู่ชั้นบนสุดของ zip
├── sop-biosecurity.pdf   ← ไฟล์ประกอบ (ไม่บังคับ)
├── training-catalog.xlsx ← ไฟล์ประกอบ
└── templates/            ← โฟลเดอร์ย่อยได้ ลึกไม่เกิน ${L.depth} ชั้น
    └── report-template.docx`, 'โครงสร้าง zip', 'sk-tree')}
  ${ul(['**SKILL.md ต้องอยู่ชั้นบนสุด** · เวลาบีบอัด ให้เลือกไฟล์ทั้งหมด<b>ภายใน</b>โฟลเดอร์แล้วกด Compress/ส่งไปยัง ZIP (ถ้าคลิกขวาที่ตัวโฟลเดอร์ จะได้ zip ที่มีโฟลเดอร์ซ้อนอีกชั้น)', 'ตั้งชื่อไฟล์ประกอบให้สั้น ไม่มีอักขระพิเศษ และตรงกับที่เขียนใน SKILL.md', 'ใช้ Skill Builder ด้านล่างสร้าง zip ให้ถูกโครงสร้างอัตโนมัติได้'])}

  ${sec('sk-limits', 'shield_checkmark', 'ข้อจำกัด (Agent Builder · Preview)')}
  ${tableHTML([
    ['รายการ', 'ขีดจำกัด'],
    ['จำนวน Skill ต่อ Agent', `${L.skills} Skill`],
    ['ขนาดไฟล์ .zip', `≤ ${L.zipMB} MB ต่อแพ็กเกจ`],
    ['ขนาดแต่ละไฟล์', `≤ ${L.fileMB} MB`],
    ['จำนวนไฟล์', `≤ ${L.files} ไฟล์ รวมทุก Skill`],
    ['ความลึกของโฟลเดอร์', `≤ ${L.depth} ชั้น`],
    ['คำสั่งใน SKILL.md', `< ${L.instr.toLocaleString('en-US')} ตัวอักษร`],
    ['สร้าง Skill จากการอัปโหลดทีละไฟล์', 'ไม่รองรับ · ต้องอัปโหลด .zip ที่ครบ'],
    ['ใช้ Skill เดียวกันกับหลาย Agent', 'ยังไม่รองรับในช่วง Preview'],
    ['**ใช้ Skill ร่วมกับไฟล์ที่อัปโหลดเป็น Knowledge (embedded files)**', '**ยังไม่รองรับ** (ปัญหาที่ทราบแล้ว Microsoft มีแผนรองรับ) · ให้ใส่ไฟล์ไว้ใน Skill แทน']
  ], { label: 'ข้อจำกัดของ Skill' })}
  <div class="cards grid-2">
    ${card('ชนิดไฟล์ประกอบที่รองรับ', `<p class="sk-types">${SKILL_TYPES.res.map(t => `<code>.${t}</code>`).join(' ')}</p><p class="hint">สคริปต์: ${SKILL_TYPES.script.map(t => `<code>.${t}</code>`).join(' ')}</p>`, 'document')}
    ${card('ความปลอดภัยและที่เก็บไฟล์', ul(['ไฟล์ของ Skill เก็บใน SharePoint Embedded ของ Tenant องค์กร (ไม่ใช่เว็บสาธารณะ)', 'Sensitivity label ของไฟล์ยังคงอยู่และถูกบังคับใช้', 'สคริปต์รันใน sandbox: **ออกอินเทอร์เน็ตไม่ได้** ติดตั้งแพ็กเกจเพิ่มไม่ได้ เรียก Connector/MCP จากสคริปต์ไม่ได้', 'ผู้ดูแลระบบควบคุมการใช้ Skill ในองค์กรได้']), 'lock_closed')}
  </div>

  ${sec('sk-upload', 'arrow_upload', 'วิธีเพิ่ม Skill ใน Agent Builder')}
  <div class="cards grid-2">
    ${card('แบบที่ 1 · อัปโหลด .zip', ol(['เปิด Copilot Chat → **Agents & Skills** → เปิด Agent เดิม หรือ **New agent**', 'แท็บ **Configure** → ขยายหัวข้อ **Skills** → กด **Add**', 'อัปโหลดไฟล์ **.zip ที่ครบ** (ไม่ใช่ SKILL.md เดี่ยว)', 'ตรวจชื่อ คำอธิบาย คำสั่ง และรายชื่อไฟล์ที่ระบบอ่านได้', 'แท็บ **Try it** → พิมพ์คำขอที่ควรใช้ Skill นี้ แล้วดูว่า Agent ทำตามขั้นตอนใน SKILL.md']), 'arrow_upload')}
    ${card('แบบที่ 2 · ให้ Agent Builder สร้าง Skill จากคำบรรยาย', `<p>พิมพ์ในช่อง Message Agent Builder ให้สร้าง Agent พร้อม Skill ที่ทำงานซ้ำได้ แล้วตรวจในแท็บ Configure ว่ามี Skill ถูกสร้าง ถ้าไม่มี ให้ใช้แบบที่ 1</p>${codeHTML(createPrompt, 'Prompt ให้ Agent Builder สร้าง Skill')}`, 'sparkle')}
  </div>
  ${verifyBadge('ชื่อเมนู Agents & Skills · Configure · Skills · Add · Try it อ้างอิงเอกสาร Microsoft (ภาษาอังกฤษ) · ตรวจกับบัญชีจริงก่อนสอน')}

  ${sec('sk-convert', 'arrow_sync', 'แปลงงานจาก PDF / Word / Excel เป็น Skill')}
  <p>หลักคิด: <b>ไฟล์งาน = ข้อมูลอ้างอิง</b> · <b>SKILL.md = วิธีใช้ข้อมูลนั้น</b> · ใน SKILL.md ให้บอกว่าไฟล์มีอะไร (หัวข้อ ชีต คอลัมน์ หน่วย) และต้องใช้อย่างไร</p>
  <div class="cards grid-3">
    ${card('จาก PDF', ul(['ต้องเป็น PDF ที่มีข้อความ (เลือกข้อความได้) ไม่ใช่ภาพสแกน', 'ใน SKILL.md ระบุหัวข้อสำคัญในไฟล์ เพื่อให้ Agent หาเจอ', 'สั่งให้อ้างอิงหัวข้อหรือหน้า เช่น "อ้างอิง: หัวข้อ 4 ใน sop.pdf"']) + codeHTML(`# ไฟล์อ้างอิงใน Skill
- \`sop-biosecurity.pdf\` หัวข้อ: 1 วัตถุประสงค์ · 4 ขั้นตอน (6 ข้อ) · 5 การบันทึก · 6 เมื่อพบความผิดปกติ`, 'ตัวอย่าง: อธิบายไฟล์ PDF'), 'document')}
    ${card('จาก Word', ul(['ใช้ Heading 1/2 แบ่งหัวข้อ ช่วยให้อ่านโครงสร้างได้ถูก', 'ตารางใน Word ให้มีหัวตาราง ไม่รวมเซลล์ซับซ้อน', 'ถ้าเอกสารยาว แยกเป็นหลายไฟล์ตามเรื่อง แล้วบอกใน SKILL.md ว่าไฟล์ไหนใช้ตอบเรื่องใด']) + codeHTML(`# ไฟล์อ้างอิงใน Skill
- \`animal-welfare-guide.docx\` หัวข้อ: หลักอิสระ 5 ประการ · การตรวจประจำวัน · การจับและขนส่ง · ตัวชี้วัด (ตาราง)`, 'ตัวอย่าง: อธิบายไฟล์ Word'), 'document_text')}
    ${card('จาก Excel', ul(['แถวแรกเป็นหัวคอลัมน์ 1 แถว ไม่รวมเซลล์ (Merge)', '1 ชีต = 1 ตาราง · ตั้งชื่อชีตให้สื่อความหมาย', 'ใน SKILL.md อธิบายทุกคอลัมน์ หน่วย และความหมายของค่าพิเศษ (เช่น 0 = ไม่ต้องต่ออายุ)', 'บอกวิธีเชื่อมชีต เช่น "จับคู่ด้วยคอลัมน์ รหัส"']) + codeHTML(`# ไฟล์อ้างอิงใน Skill
- \`training-catalog.xlsx\`
  - ชีต "หลักสูตร": รหัส, หลักสูตร, หมวด, ชั่วโมง, … (0 = ไม่ต้องต่ออายุ)
  - ชีต "ข้อกำหนดตามงาน": กลุ่มงาน, หลักสูตรบังคับ, หลักสูตรแนะนำ`, 'ตัวอย่าง: อธิบายไฟล์ Excel'), 'table')}
  </div>
  <div class="callout">${ic('shield_checkmark')}<div><b>ก่อนใส่ไฟล์งานจริงใน Skill</b><p>ลบข้อมูลส่วนบุคคลและข้อมูลที่ไม่จำเป็น ตรวจ Sensitivity label และขออนุมัติจากผู้มีอำนาจอนุมัติ · คนที่ใช้ Agent ได้ จะได้คำตอบจากไฟล์ใน Skill ด้วย</p></div></div>

  ${sec('sk-builder', 'toolbox', 'Skill Builder: โยนไฟล์ → ได้ SKILL.md + .zip พร้อมอัปโหลด')}
  <p>เลือกไฟล์ PDF, Word หรือ Excel ระบบอ่านโครงสร้างไฟล์ (หัวข้อ ชีต คอลัมน์) <b>ในเบราว์เซอร์นี้</b> แล้วเขียน SKILL.md ให้ แก้ไขได้ ตรวจกติกาครบ แล้วดาวน์โหลด .zip · <b>ไม่ส่งไฟล์ออกจากเครื่อง</b></p>
  <div data-skill-builder></div>

  ${sec('sk-examples', 'arrow_download', 'ตัวอย่าง Skill 5 แบบ (ดาวน์โหลด .zip)')}
  <p>ไฟล์ประกอบในตัวอย่างเป็น<b>ข้อมูลสมมติเพื่อการเรียน</b> · ใช้ทดลองอัปโหลดได้ทันที แล้วเปลี่ยนเป็นไฟล์จริงขององค์กรภายหลัง</p>
  <div class="sk-ex">${examples.map(e => `<article class="card sk-card" data-skill-ex="${e.slug}">
    <div class="sk-ch"><span class="ti">${ic(e.icon)}</span><div><b>${esc(e.title)}</b><code>${esc(e.name)}</code></div><span class="pill">${esc(e.from)}</span></div>
    <p>${esc(e.use)}</p>
    <p class="hint">ไฟล์ใน zip: ${e.files.map(f => `<code>${esc(f.name)}</code>`).join(' ')} · ${kb(e.zip.length)}</p>
    <p class="hint"><b>ลองถาม:</b> ${e.try.map(esc).join(' · ')}</p>
    <div class="sk-act"><a class="btn btn-primary" href="skills/${e.slug}.zip" download="${e.slug}.zip">${ic('arrow_download')}<span>ดาวน์โหลด ${esc(e.slug)}.zip</span></a></div>
    <details class="sk-md"><summary>${ic('code')}<span>ดู SKILL.md</span></summary>${codeHTML(e.skill, e.slug + '/SKILL.md')}</details>
  </article>`).join('')}</div>

  ${sec('sk-ws', 'hat_graduation', 'Workshop: สร้าง Skill จากไฟล์งานของคุณ (30 นาที)')}
  <ol class="sk-steps">
    <li><b>เลือกงาน 1 เรื่อง</b> ที่ถามซ้ำบ่อยและมีเอกสารรองรับ เช่น ขั้นตอนงาน หลักสูตรอบรม Checklist</li>
    <li><b>เตรียมไฟล์ 1–3 ไฟล์</b> ลบข้อมูลที่ไม่ควรเปิดเผย ตรวจว่า PDF มีข้อความ และ Excel มีหัวคอลัมน์แถวเดียว</li>
    <li><b>ใช้ Skill Builder</b> โยนไฟล์ ตั้งชื่อ (ตัวพิมพ์เล็ก-ขีด) เขียน description ว่าทำอะไรและใช้เมื่อใด</li>
    <li><b>ปรับคำสั่ง</b> ในขั้นตอนและรูปแบบผลลัพธ์ให้ตรงงานจริง แล้วกดดาวน์โหลด .zip เมื่อผ่านการตรวจทุกข้อ</li>
    <li><b>อัปโหลดใน Agent Builder</b> (Configure → Skills → Add) และเขียน Instructions ของ Agent 1 บรรทัดว่าเมื่อใดใช้ Skill นี้</li>
    <li><b>ทดสอบ 5 คำถาม</b> ใน Try it: 3 ข้อที่คำตอบอยู่ในไฟล์ · 1 ข้อที่ต้องคำนวณหรือสรุป · 1 ข้อที่<b>ไม่มี</b>ในไฟล์ (ต้องตอบว่าไม่พบ)</li>
  </ol>
  <div class="cards grid-2">
    ${card('เฉลย · ตัวอย่างผลลัพธ์ที่ถูกต้อง (training-advisor)', `<p><b>คำถาม:</b> ทีมจับและขนส่งต้องอบรมหลักสูตรอะไรบ้าง รวมกี่ชั่วโมง</p>${ul(['บังคับ: TR001 Biosecurity พื้นฐาน (2 ชม.) · TR002 Animal Welfare พื้นฐาน (3 ชม.) · TR003 การจับและขนส่งสัตว์ปีกอย่างถูกวิธี (4 ชม.)', 'แนะนำ: TR008 การปฐมพยาบาลเบื้องต้น (6 ชม.)', 'รวมหลักสูตรบังคับ **9 ชั่วโมง** (รวมหลักสูตรแนะนำ 15 ชั่วโมง) · ต่ออายุทุก 12 เดือน', 'อ้างอิง: ชีต "ข้อกำหนดตามงาน" และ "หลักสูตร" ใน training-catalog.xlsx'])}`, 'checkmark_circle')}
    ${card('เกณฑ์ตรวจ Workshop', vlist('ws', ['zip มี SKILL.md อยู่ชั้นบนสุด และอัปโหลดผ่าน', '`name` เป็นตัวพิมพ์เล็ก-ขีด และ description บอก "ทำอะไร + ใช้เมื่อใด"', 'SKILL.md อธิบายไฟล์ประกอบทุกไฟล์ (หัวข้อ/ชีต/คอลัมน์)', 'คำตอบอ้างอิงชื่อไฟล์และหัวข้อ/ชีตที่ใช้', 'ตัวเลขในคำตอบตรงกับไฟล์ และคำนวณถูก', 'คำถามที่ไม่มีในไฟล์ Agent ตอบว่าไม่พบ ไม่แต่งเพิ่ม', 'ไม่มีข้อมูลส่วนบุคคลหรือข้อมูลลับในไฟล์ประกอบ']), 'clipboard_task')}
  </div>

  ${sec('sk-fix', 'wrench', 'ปัญหาที่พบบ่อยและวิธีแก้')}
  ${tableHTML([
    ['อาการ', 'สาเหตุที่เป็นไปได้', 'วิธีแก้'],
    ['ไม่เห็นหัวข้อ Skills ใน Configure', 'องค์กรยังไม่ได้อยู่ใน Frontier Program หรือ License ไม่รองรับ', 'ติดต่อผู้ดูแลระบบ · ระหว่างนี้ใช้ Instructions 8 ส่วน + แนบไฟล์ในแชท'],
    ['อัปโหลดแล้วขึ้น error', 'อัปโหลด SKILL.md เดี่ยว · zip มีโฟลเดอร์ซ้อน · front matter ผิดรูปแบบ', 'zip ใหม่ให้ SKILL.md อยู่ชั้นบนสุด · ตรวจเส้น --- และ name/description'],
    ['ไฟล์บางไฟล์ไม่ถูกอ่าน', 'ชนิดไฟล์ไม่รองรับ หรือไฟล์ใหญ่เกิน 25 MB', 'แปลงเป็นชนิดที่รองรับ (เช่น .pdf .xlsx .csv) หรือแยกไฟล์'],
    ['Agent ไม่ใช้ Skill', 'description ไม่บอกว่าใช้เมื่อใด หรือคำถามไม่ตรง', 'เขียน description ให้มีคำที่ผู้ใช้จะถาม · เพิ่มใน Instructions ว่าเมื่อใดใช้ Skill นี้'],
    ['Agent ตอบเกินข้อมูลในไฟล์', 'คำสั่งไม่ห้ามแต่งข้อมูล', 'เพิ่มข้อห้ามและ "เมื่อไม่แน่ใจ" ให้ตอบว่าไม่พบในเอกสาร'],
    ['ใส่ Skill แล้วไฟล์ Knowledge เดิมใช้ไม่ได้', 'ช่วง Preview ยังใช้ Skill ร่วมกับไฟล์ที่อัปโหลดเป็น Knowledge ไม่ได้', 'ย้ายไฟล์เหล่านั้นเข้าไปใน zip ของ Skill'],
    ['PDF ตอบไม่ได้', 'เป็นภาพสแกน ไม่มีข้อความ', 'ใช้ไฟล์ต้นฉบับ (Word) หรือทำ OCR ก่อน']
  ], { label: 'ปัญหาที่พบบ่อย' })}

  <h2 class="sec">${ic('link')}<span>แหล่งอ้างอิง</span></h2>
  <ul class="sk-src">${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${esc(t)}</a></li>`).join('')}</ul>`;
}

export const SKILL_PAGE = { n: 21.5, k: '21A', slug: 'agent-skills', chapter: 4, after: 21, type: 'skills', typeLabel: 'หน้าเสริม · Skill', icon: 'layer', title: 'Skill ของ Agent: SKILL.md และไฟล์ .zip', short: 'เพิ่มความสามารถเฉพาะเรื่องให้ Agent ด้วย Skill · แปลงไฟล์ PDF, Word, Excel เป็น Skill พร้อมตัวอย่าง 5 แบบและ Skill Builder' };
