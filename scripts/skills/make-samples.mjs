// สร้าง PDF ตัวอย่างของ Skill "sop-assistant" ด้วย Chromium (ข้อความไทยดึงกลับได้ครบ) · Usage: python3 scripts/skills/make_samples.py && node scripts/skills/make-samples.mjs
import fs from 'node:fs';
import path from 'node:path';
import { launch, ROOT } from '../../tests/lib.mjs';

const out = path.join(ROOT, 'content', 'skills', 'examples', 'sop-assistant');
fs.mkdirSync(out, { recursive: true });
const html = `<!doctype html><html lang="th"><meta charset="utf-8"><style>body{font:11pt/1.6 Tahoma,Loma,sans-serif;color:#111}h1{font-size:18pt}h2{font-size:13pt;margin-top:18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 6px;text-align:left}.n{color:#555;font-style:italic}</style>
<h1>ขั้นตอนการเข้า-ออกพื้นที่เลี้ยง (Biosecurity) · ตัวอย่าง</h1>
<p class="n">ข้อมูลตัวอย่างเพื่อการเรียน (สมมติ) · แทนด้วยไฟล์จริงขององค์กรก่อนใช้งาน</p>
<h2>1. วัตถุประสงค์</h2><p>ป้องกันเชื้อโรคเข้าสู่พื้นที่เลี้ยง โดยควบคุมบุคคล ยานพาหนะ และอุปกรณ์ที่เข้า-ออกทุกครั้ง</p>
<h2>2. ขอบเขต</h2><p>ใช้กับพนักงาน ผู้มาติดต่อ ผู้รับเหมา และยานพาหนะทุกคันที่เข้าพื้นที่เลี้ยง</p>
<h2>3. ผู้รับผิดชอบ</h2><p>ผู้รับผิดชอบพื้นที่เลี้ยงควบคุมให้ปฏิบัติตามขั้นตอน และผู้มีอำนาจอนุมัติพิจารณากรณียกเว้น</p>
<h2>4. ขั้นตอนการปฏิบัติ</h2>
<ol><li>ลงทะเบียนที่จุดรับรอง ระบุชื่อ วัตถุประสงค์ และสถานที่ที่ไปมาก่อนหน้า</li>
<li>ผู้ที่สัมผัสสัตว์ปีกจากที่อื่นภายใน 72 ชั่วโมง ห้ามเข้าพื้นที่ (ตัวเลขสมมติ ให้ใช้ตามที่องค์กรกำหนด)</li>
<li>ยานพาหนะผ่านจุดพ่นน้ำยาฆ่าเชื้อทั้งคัน รวมล้อและใต้ท้องรถ แล้วบันทึกเวลา</li>
<li>อาบน้ำ เปลี่ยนชุดและรองเท้าของพื้นที่เลี้ยง ห้ามนำของใช้ส่วนตัวเข้า</li>
<li>จุ่มเท้าในอ่างน้ำยาและล้างมือก่อนเข้าโรงเรือนทุกหลัง</li>
<li>เมื่อออกจากพื้นที่ ถอดชุดไว้ในจุดที่กำหนด และบันทึกเวลาออก</li></ol>
<h2>5. การบันทึก</h2>
<table><tr><th>บันทึก</th><th>ความถี่</th><th>ผู้บันทึก</th></tr><tr><td>สมุดผู้เข้าพื้นที่</td><td>ทุกครั้ง</td><td>จุดรับรอง</td></tr><tr><td>บันทึกการพ่นยายานพาหนะ</td><td>ทุกคัน</td><td>ผู้รับผิดชอบจุดพ่นยา</td></tr><tr><td>บันทึกการเปลี่ยนน้ำยาจุ่มเท้า</td><td>ทุกวัน</td><td>ผู้รับผิดชอบโรงเรือน</td></tr></table>
<h2>6. เมื่อพบความผิดปกติ</h2>
<ol><li>หยุดการเข้าพื้นที่ทันทีหากจุดฆ่าเชื้อไม่พร้อมใช้</li><li>แจ้งผู้รับผิดชอบพื้นที่เลี้ยงภายใน 1 ชั่วโมง</li><li>บันทึกเหตุการณ์และการแก้ไขในแบบบันทึกเหตุผิดปกติ</li></ol>
</html>`;
const b = await launch(); const p = await b.newPage();
await p.setContent(html);
await p.pdf({ path: path.join(out, 'sop-biosecurity.pdf'), format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' } });
await b.close();
console.log('ok', path.join(out, 'sop-biosecurity.pdf'));
