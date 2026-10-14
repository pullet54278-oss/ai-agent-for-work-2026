// End-to-end functional tests in real Chromium. Usage: npm run build && node tests/e2e.mjs
// Optional: AXE=path/to/axe.min.js runs automated accessibility checks (axe-core).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { serve, launch, ROOT } from './lib.mjs';

const results = [];
let current = '';
const ok = (cond, msg) => { results.push({ suite: current, ok: !!cond, msg }); if (!cond) console.log('   ✗', msg); };
const eq = (a, b, msg) => ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
async function suite(name, fn) { current = name; console.log('▶', name); try { await fn(); } catch (e) { ok(false, 'threw: ' + e.message.split('\n')[0]); } }

// ---- fixtures: real .xlsx and .csv files built with the same SheetJS the app ships ----
const FIX = path.join(ROOT, 'test-results', 'fixtures');
fs.mkdirSync(FIX, { recursive: true });
const sandbox = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets', 'vendor', 'xlsx.full.min.js'), 'utf8'), sandbox);
const XLSX = sandbox.XLSX;
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Date', 'Farm_ID', 'House', 'Mortality', 'Feed_kg'], ['2026-10-01', 'F01', 'H1', 12, 3400], ['2026-10-02', 'F01', 'H1', 9, 3520]]), 'Daily');
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[], ['Code', 'Name'], ['F01', 'ฟาร์มตัวอย่าง']]), 'Master');
fs.writeFileSync(path.join(FIX, 'farm-sample.xlsx'), Buffer.from(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })));
fs.writeFileSync(path.join(FIX, 'sales.csv'), 'Month,Customer,Qty,Amount\n2026-09,C01,120,54000\n');
fs.writeFileSync(path.join(FIX, 'notes.pdf'), '%PDF-1.4\n%test\n');
fs.writeFileSync(path.join(FIX, 'virus.exe'), 'MZ');

const { srv, url } = await serve();
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const SNAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'copilot-updates.json'), 'utf8'));
const LIVE = { ...SNAP, fetchedAt: new Date(Date.now() + 60000).toISOString(), live: true, items: [{ ...SNAP.items[0], id: '999001', title: 'LIVE TEST: Copilot agent item', topic: 'agent', agent: true }, ...SNAP.items.slice(1)] };
let apiMode = 'live';
await ctx.route('**/api/copilot-updates', r => apiMode === 'live' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LIVE) }) : r.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"x"}' }));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_TUNNEL|ERR_PROXY|net::ERR/.test(m.text()) && !(apiMode !== 'live' && /status of 502/.test(m.text()))) errors.push(m.text()); });
const go = async h => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(60); };
const text = sel => page.$eval(sel, e => e.textContent.trim());
const clip = () => page.evaluate(() => navigator.clipboard.readText());
await page.goto(url);
await page.waitForSelector('.hero');
const D = await page.evaluate(() => window.__app.D);
const ORDER = [1, ...D.pages.map(p => p.n)].sort((a, b) => a - b);

await suite('T4 Navigation: every page renders with correct title', async () => {
  let bad = 0;
  for (const p of D.pages) {
    await go('#/p/' + p.n);
    const h1 = await text('#main h1');
    if (h1 !== p.title) { bad++; if (bad < 5) ok(false, `p${p.n} h1 "${h1}"`); }
  }
  eq(bad, 0, 'pages with wrong/missing h1 (of ' + D.pages.length + ')');
  eq(ORDER.length, 155, 'total pages incl. home');
  await go('#/p/33');
  await page.click('.pager a[rel="next"]'); await page.waitForTimeout(60);
  eq(await page.evaluate(() => location.hash), '#/p/34', 'pager next');
  await page.click('.pager a[rel="prev"]'); await page.waitForTimeout(60);
  eq(await page.evaluate(() => location.hash), '#/p/33', 'pager prev');
  await page.focus('#main'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60);
  eq(await page.evaluate(() => location.hash), '#/p/34', 'ArrowRight → next page');
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(60);
  eq(await page.evaluate(() => location.hash), '#/p/33', 'ArrowLeft → previous page');
  await go('#/p/155'); eq(await page.$eval('.pager a[rel="next"]', a => a.getAttribute('href')).catch(() => null), '#/d/1', 'last course page → Deep Learning lesson 1');
  await go('#/d/36'); await page.waitForSelector('#main .deep-body'); ok(!(await page.$('.pager a[rel="next"]')), 'last deep lesson has no next');
  for (const r of ['#/agents', '#/builder', '#/progress', '#/appendix-a', '#/appendix-b', '#/deep', '#/tracks', '#/track/agent', '#/updates', '#/d/13', '#/nonexistent']) { await go(r); ok(await page.$('#main h1'), 'route renders ' + r); }
  await go('#/p/2');
  ok((await text('.copy-line')) === '© 2026 Copilot AI Agents for Work · Created by Nattapon Yokkret', 'copyright line on page');
  ok(await page.$('#doneBtn'), 'mark-as-learned button present');
});

await suite('Brand + illustrations', async () => {
  await go('#/');
  const logos = await page.$$eval('img.copilot-mark', l => l.map(i => ({ ok: i.complete && i.naturalWidth > 0, alt: i.alt })));
  eq(logos.length, 2, 'official Copilot logo in top bar and hero');
  ok(logos.every(l => l.ok && l.alt === 'Microsoft Copilot'), 'logo images load with alt text');
  const h1 = await page.$eval('#heroT', e => { const c = getComputedStyle(e); return [c.color, c.backgroundImage, parseFloat(c.fontSize)]; });
  ok(h1[1] === 'none', 'Copilot wordmark uses plain text colour (no logo-imitating gradient)');
  ok(h1[2] >= 56, 'Copilot is the largest text on home (' + h1[2] + 'px)');
  ok(await page.$('.hero-scene'), 'hero illustration');
  eq(await page.$$eval('.ccard .cc-svg', l => l.length), 33, 'illustration on every chapter card (27 chapters + 6 deep groups)');
  await go('#/p/95'); ok(await page.$('.ph-module .ph-art'), 'module header illustration');
  await go('#/p/33'); ok(await page.$('.ph .ph-art'), 'agent header illustration');
});

await suite('Copilot Agent first + learning paths', async () => {
  await go('#/');
  const cta = await page.$eval('.hero-cta a.btn-primary', e => [e.textContent.trim(), e.getAttribute('href')]);
  ok(cta[0].includes('เริ่มเรียน Copilot Agent') && cta[1] === '#/track/agent', 'primary CTA = Copilot Agent');
  ok((await text('.hero-cta')).includes('เริ่มที่ Prompt Mode →'), 'Prompt Mode CTA kept');
  const order = await page.$$eval('#main > .wrap > section, #main > .wrap > div.stats', l => l.map(e => e.className));
  ok(order[0].includes('hero') && order[1].includes('updates') && order[2].includes('tracks-sec'), 'home order: hero → live updates → learning paths (' + order.slice(0, 3).join(' | ') + ')');
  const tracks = await page.$$eval('.tracks .track b', l => l.map(e => e.textContent));
  eq(tracks[0], 'Copilot Agent', 'first learning path is Copilot Agent');
  ok(tracks.length === 7 && tracks.some(t => /Excel, Word และ PowerPoint/.test(t)) && tracks.some(t => /เบราว์เซอร์/.test(t)) && tracks.some(t => /Tips & Tricks/.test(t)) && tracks.some(t => /งานจริง/.test(t)), '7 paths: Agent, Office, browser, tips, real work, …');
  ok(await page.$('.tracks .track.star'), 'Agent path featured');
  await go('#/track/agent');
  const items = await page.$$eval('.track-steps .toc-card', l => l.map(a => a.getAttribute('href')));
  ok(items.length >= 25 && items.some(h => h.startsWith('#/d/')) && items.some(h => h.startsWith('#/p/')), 'Agent path mixes course pages and deep lessons (' + items.length + ')');
  await page.click('.ph .btn-primary'); await page.waitForTimeout(80);
  eq(await page.evaluate(() => location.hash), '#/p/3', 'track "start" button opens first item');
  ok((await text('#main')).includes('เจาะลึกต่อใน Deep Learning') && await page.$('.related a[href="#/d/13"]'), 'course page links to related deep lesson (no duplicated content)');
});

await suite('Deep Learning 36 lessons', async () => {
  await go('#/deep');
  eq(await page.$$eval('#main .cgroup .toc-card[href^="#/d/"]', l => l.length), 36, 'overview lists 36 lessons');
  await page.waitForSelector('#deepShared .quiz');
  ok((await text('#deepShared')).includes('Input') && (await text('#deepShared')).includes('Verify'), 'shared principles shown once on overview');
  for (const n of [1, 7, 13, 22, 35, 36]) {
    await go('#/d/' + n); await page.waitForSelector('#main .deep-body .deep-sec', { timeout: 8000 });
    ok((await text('#main h1')).length > 5, `lesson ${n} renders`);
  }
  await go('#/d/13'); await page.waitForSelector('#main .quiz');
  eq(await page.$$eval('#main .quiz fieldset', l => l.length), 3, 'lesson-specific quiz has 3 questions');
  ok(!(await text('#main .quiz')).includes('ก่อนเริ่มงานควรระบุอะไร'), 'generic 5-question quiz not repeated in lessons');
  ok(await page.$('#main a.deep-ref[href="#/deep"]'), 'principles replaced by link to overview');
  ok(await page.$('#main a.deep-ref.dup'), 'duplicated deep block replaced by link to the lesson that keeps it');
  ok(await page.$('#main .related a[href="#/p/3"]'), 'lesson links to related course pages');
  await page.click('#main [data-quiz-check]');
  ok((await text('#main .qres')).includes('ยังไม่ได้ตอบ 3 ข้อ'), 'quiz reports unanswered');
  const answers = await page.$$eval('#main .quiz fieldset', l => l.map(f => +f.dataset.a));
  for (let i = 0; i < answers.length; i++) await page.check(`#main input[name="dq13-q${i}"][value="${answers[i]}"]`);
  await page.click('#main [data-quiz-check]');
  eq(await text('#main .qres'), 'คะแนน 3/3 · ยอดเยี่ยม!', 'quiz scoring');
  ok(await page.$('#main .qopt.right'), 'correct answers highlighted');
  await page.click('#main [data-quiz-reset]'); eq(await text('#main .qres'), '', 'quiz reset');
  const correctIdx = await page.$$eval('#main .quiz fieldset', l => l.map(f => +f.dataset.a));
  ok(new Set(Object.values(await page.evaluate(() => { const r = {}; return r; }))).size >= 0 && correctIdx.length === 3, 'answer positions present');
  await page.fill('#main [data-deep-pb] textarea[data-f="f0"]', 'สรุป KPI รายสัปดาห์');
  ok((await text('#main [data-pb-out]')).includes('เป้าหมายและผู้ใช้: สรุป KPI รายสัปดาห์') && (await text('#main [data-pb-out]')).includes('หัวข้อ: AI Agents & Agentic Work'), 'deep prompt builder composes live');
  await page.click('#main [data-deep-pb] [data-copy]'); ok((await clip()).startsWith('บทบาท: ผู้เชี่ยวชาญด้าน Microsoft Copilot'), 'deep prompt copy');
  await page.check('#main .vlist li:first-child input'); ok((await text('#main [data-vcount]')).startsWith('ทำแล้ว 1/8'), 'deep checklist counter');
  await go('#/d/1'); await page.waitForSelector('#main [data-decision]');
  await page.selectOption('#main [data-decision] select', 'action');
  ok((await text('#main .dec-item:not([hidden])')).includes('Copilot Studio/Workflow'), 'lesson 1 decision tool');
  eq(await page.$$eval('#main .quiz fieldset', l => l.length), 10, 'lesson 1 keeps its own 10-question quiz');
  await page.click('#main .deep-nav a[data-scroll]'); eq(await page.evaluate(() => location.hash), '#/d/1', 'in-lesson anchors do not break routing');
  await page.click('#doneBtn'); ok((await text('#progTxt')).startsWith('เรียนแล้ว') && (await page.$('#tocList a[href="#/d/1"] .dot.d')), 'deep lesson progress tracked in TOC');
  await page.click('#doneBtn');
  await page.keyboard.press('Control+k'); await page.fill('#cmdQ', 'Golden Dataset');
  ok((await page.$$eval('#cmdList li[data-i] b', l => l.map(x => x.textContent))).some(t => /Agent Testing/.test(t)), 'search finds deep lessons'); await page.keyboard.press('Escape');
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'deep-data.js'), 'utf8');
  ok(!/\son(click|change)=/.test(html) && !/<script/.test(html), 'no inline handlers or scripts in deep content (CSP-safe)');
  ok(!/ผู้จัดการ|หัวหน้างาน|\bSOP-\d{2,}/.test(html), 'job titles / document numbers replaced');
});

await suite('Auto-updates (Microsoft 365 Roadmap)', async () => {
  apiMode = 'live';
  await page.goto(url); await page.waitForSelector('.updates.home');
  await page.waitForFunction(() => document.querySelector('.updates .live-dot.live'), null, { timeout: 8000 });
  ok((await text('.updates')).includes('LIVE TEST: Copilot agent item'), 'homepage shows live updates from /api/copilot-updates');
  ok((await text('.updates [data-upd-meta]')).includes('ข้อมูลสด'), 'live indicator');
  eq(await page.$$eval('.updates.home .upd', l => l.length), 6, '6 items on home');
  await page.click('.updates.home [data-ut="agent"]');
  ok(await page.$$eval('.updates.home .upd', l => l.every(e => e.dataset.topic === 'agent')), 'topic filter Agent');
  await page.click('.updates.home a[href="#/updates"]'); await page.waitForTimeout(80);
  ok((await page.$$eval('.updates .upd', l => l.length)) > 6, 'updates page lists all');
  ok(await page.$$eval('.upd-t', l => l.every(a => a.href.startsWith('https://www.microsoft.com/microsoft-365/roadmap?id=') && a.target === '_blank')), 'items link to official roadmap');
  const p2 = await ctx.newPage(); apiMode = 'fail';
  await p2.goto(url); await p2.waitForSelector('.updates.home'); await p2.waitForTimeout(500);
  ok((await p2.textContent('.updates [data-upd-meta]')).includes('ข้อมูล ณ การ build ล่าสุด'), 'falls back to build snapshot when API unavailable');
  eq(await p2.$$eval('.updates.home .upd', l => l.length), 6, 'snapshot items rendered');
  await p2.close(); apiMode = 'live';
  ok(SNAP.items.length >= 20 && SNAP.items.every(i => /^https:\/\/www\.microsoft\.com\//.test(i.url) && i.title), 'snapshot holds real Copilot roadmap items (' + SNAP.items.length + ', fetched ' + SNAP.fetchedAt + ')');
});

await suite('Version + credit', async () => {
  await go('#/');
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  ok((await text('.ver-line')).includes('เวอร์ชัน ' + v) && (await text('.ver-line')).includes('Nattapon Yokkret'), 'version + creator on every page footer');
  ok((await text('.hero')).includes('v' + v), 'version badge on home');
  await go('#/d/5'); await page.waitForSelector('#main .deep-body'); ok((await text('.copy-line')).includes('Created by Nattapon Yokkret'), 'credit on deep lessons');
});

await suite('T5 Search (Ctrl+K)', async () => {
  await go('#/p/2');
  await page.keyboard.press('Control+k');
  ok(await page.isVisible('#cmd'), 'Ctrl+K opens search');
  ok(await page.evaluate(() => document.activeElement.id === 'cmdQ'), 'search input focused');
  await page.fill('#cmdQ', 'Salmonella');
  const n = await page.$$eval('#cmdList li[data-i]', l => l.length);
  ok(n > 3, 'results for "Salmonella": ' + n);
  await page.fill('#cmdQ', 'Data Dictionary');
  ok((await page.$$eval('#cmdList li[data-i] b', l => l.map(x => x.textContent))).some(t => /Consolidation/.test(t)), 'search by input data finds agent');
  await page.fill('#cmdQ', 'Prompt Lab');
  await page.keyboard.press('ArrowDown');
  eq(await page.$eval('#cmdList li[aria-selected="true"]', e => e.dataset.i), '1', 'ArrowDown moves selection');
  await page.keyboard.press('ArrowUp');
  const target = await page.$eval('#cmdList li[aria-selected="true"] b', e => e.textContent);
  await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  ok(!(await page.isVisible('#cmd')), 'Enter closes and navigates');
  ok((await text('#main h1')).length > 0 && target.length > 0, 'navigated to "' + target + '"');
  await page.keyboard.press('Control+k'); await page.keyboard.press('Escape');
  ok(!(await page.isVisible('#cmd')), 'Esc closes search');
  await page.click('#searchBtn'); ok(await page.isVisible('#cmd'), 'search button opens'); await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k'); await page.fill('#cmdQ', 'zzzxxyy');
  ok((await text('#cmdList')).includes('ไม่พบผลลัพธ์'), 'empty state'); await page.keyboard.press('Escape');
});

await suite('T6 Agent Directory + finder', async () => {
  await go('#/agents');
  eq(await page.$$eval('#dirList .acard', l => l.length), 67, 'directory shows all agents');
  eq(await page.$$eval('.fchip', l => l.length), 18, 'chips: all + 17 groups');
  await page.click('.fchip[data-g="fin"]');
  eq(await page.$$eval('#dirList .acard', l => l.length), Object.values(D.agents).filter(a => a.group === 'fin').length, 'filter by group fin');
  await page.click('.fchip[data-g=""]');
  await page.selectOption('#dirR', 'connected');
  eq(await page.$$eval('#dirList .acard', l => l.length), 9, 'filter readiness connected = 9');
  await page.selectOption('#dirR', '');
  await page.fill('#dirQ', 'Salmonella');
  ok((await page.$$eval('#dirList .acard', l => l.length)) >= 1, 'text filter');
  await page.fill('#dirQ', '');
  await page.click('#finderBtn');
  ok(await page.isVisible('#finder'), 'finder modal opens');
  await page.click('#finder .fchip[data-g="lab"]');
  const labN = await page.$$eval('#fdList .acard', l => l.length);
  eq(labN, 4, 'finder lab agents');
  await page.click('#fdList .acard h3 a');
  await page.waitForTimeout(80);
  ok(!(await page.isVisible('#finder')), 'clicking card closes finder');
  ok(/^#\/p\/\d+$/.test(await page.evaluate(() => location.hash)), 'clicking card opens agent page');
  await page.click('#finderBtn'); await page.keyboard.press('Escape'); ok(!(await page.isVisible('#finder')), 'Esc closes finder');
  // agent 28 (no agent page in source) resolves to its flow page with builder
  await go('#/p/73');
  ok(await page.$('[data-builder="28"] .builder-in'), 'p73 shows builder for agent #28 (from JSON)');
});

await suite('T7 Agent Builder panel: copy, counters, attachments', async () => {
  await go('#/p/33');
  const nameCnt = await page.$eval('[data-builder] [data-block="name"] .cnt', e => e.textContent);
  eq(nameCnt, '24/30 ตัวอักษร', 'name counter');
  ok((await page.$eval('[data-builder] [data-block="description"] .cnt', e => e.textContent)) === '162/1,000', 'description counter');
  const instrCnt = await page.$eval('[data-builder] [data-block="instructions"] .cnt', e => e.textContent);
  ok(/^2,864\/8,000/.test(instrCnt), 'instructions counter live ' + instrCnt);
  eq(await page.$$eval('[data-builder] .sites li', l => l.length), 4, '4 websites');
  ok((await page.$$eval('[data-builder] .sites a', l => l.map(a => a.target))).every(t => t === '_blank'), 'website links open in new tab');
  await page.click('[data-builder] [data-block="name"] [data-copy]');
  eq(await clip(), 'Data Consolidation Agent', 'copy Name');
  ok(await page.isVisible('#toast'), 'toast shown after copy');
  await page.click('[data-copy-urls]');
  eq((await clip()).split('\n').length, 4, 'copy 4 URLs');
  await page.click('[data-copy-all]');
  const all = await clip();
  ok(all.startsWith('Name: Data Consolidation Agent\n\nDescription:') && all.includes('Starter prompts:\n'), 'copy all settings');
  // attach real files
  await page.setInputFiles('[data-builder] input[type="file"]', [path.join(FIX, 'farm-sample.xlsx'), path.join(FIX, 'sales.csv'), path.join(FIX, 'notes.pdf'), path.join(FIX, 'virus.exe')]);
  await page.waitForSelector('[data-block="start"]', { timeout: 8000 });
  const ins = await page.$eval('[data-builder] [data-block="instructions"] pre', e => e.textContent);
  const sec3 = ins.slice(ins.indexOf('3. ข้อมูลนำเข้า'), ins.indexOf('4. ขั้นตอน'));
  ok(sec3.includes('farm-sample.xlsx') && sec3.includes('ชีต "Daily" (2 แถว): Date, Farm_ID, House, Mortality, Feed_kg'), 'xlsx sheet+columns inserted in Instructions section 3');
  ok(sec3.includes('ชีต "Master" (1 แถว): Code, Name'), 'header row found below blank row');
  ok(sec3.includes('sales.csv') && sec3.includes('Month, Customer, Qty, Amount'), 'csv columns inserted');
  ok(sec3.includes('notes.pdf'), 'non-spreadsheet listed by name');
  ok(!ins.includes('virus.exe'), 'unsupported file not inserted');
  ok((await text('[data-builder] .att')).includes('ชนิดไฟล์ไม่รองรับ'), 'unsupported file flagged');
  const kn = await page.$eval('[data-builder] [data-block="knowledge"] pre', e => e.textContent);
  ok(kn.includes('ไฟล์งานจริง (แนบในแชทตอนใช้งาน ไม่ได้เพิ่มเป็น Knowledge):') && kn.includes('- farm-sample.xlsx'), 'files listed in Knowledge');
  ok((await page.$eval('[data-block="start"] pre', e => e.textContent)).includes('@Data Consolidation Agent แนบไฟล์: farm-sample.xlsx, sales.csv, notes.pdf'), 'start prompt block added');
  const cnt2 = await page.$eval('[data-builder] [data-block="instructions"] .cnt', e => e.textContent);
  ok(cnt2 !== instrCnt, 'instructions counter updates after attach');
  await page.click('[data-builder] [data-rm="0"]');
  ok(!(await page.$eval('[data-builder] [data-block="instructions"] pre', e => e.textContent)).includes('farm-sample.xlsx'), 'remove attachment updates Instructions');
  // drag & drop
  const dt = await page.evaluateHandle(() => { const d = new DataTransfer(); d.items.add(new File(['a,b\n1,2'], 'drop.csv', { type: 'text/csv' })); return d; });
  await page.dispatchEvent('[data-builder] .drop', 'drop', { dataTransfer: dt });
  await page.waitForFunction(() => document.querySelector('[data-builder] [data-block="instructions"] pre').textContent.includes('drop.csv'));
  ok(true, 'drag & drop file read');
  // all 67 agents have complete builder data within limits
  const lim = Object.values(D.agents).filter(a => !(a.builder.name.length <= 30 && a.builder.description.length <= 1000 && a.builder.instructions.length <= 8000 && a.builder.sites.length === 4));
  eq(lim.length, 0, 'all 67 agents within Agent Builder limits with 4 websites');
});

await suite('T7b Agent Builder Studio', async () => {
  await go('#/builder/1');
  eq(await page.inputValue('#stName'), 'Data Consolidation Agent', 'studio loads agent template');
  eq(await page.$$eval('#stSec li.ok', l => l.length), 8, 'all 8 instruction sections detected');
  await page.fill('#stU0', 'https://example.org/a/b/c');
  ok((await text('[data-um="0"]')).includes('ลึก 3 ระดับ'), 'depth > 2 rejected');
  await page.fill('#stU0', 'https://example.org/page?id=1');
  ok((await text('[data-um="0"]')).includes('?'), '? rejected');
  await page.fill('#stU0', 'https://www.iso.org/standard/66912.html');
  ok((await page.$eval('[data-ust="0"]', e => e.className)).includes('ok'), 'valid 2-level URL accepted');
  await page.fill('#stName', 'ชื่อ Agent ที่ยาวเกินสามสิบตัวอักษรแน่นอนครับ');
  ok((await page.$eval('[data-cnt="name"]', e => e.className)).includes('over'), 'name over limit flagged');
  await page.click('#stCopy');
  ok((await clip()).startsWith('Name: ชื่อ Agent ที่ยาวเกิน'), 'studio copy all');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#stDl')]);
  ok(dl.suggestedFilename().endsWith('-setup.txt'), 'download .txt ' + dl.suggestedFilename());
  await page.click('#stReset');
  eq(await page.inputValue('#stName'), '', 'reset to blank');
  ok((await page.inputValue('#stInstr')).includes('#### 8. เมื่อข้อมูลไม่พอหรือไม่แน่ใจ'), 'blank 8-section scaffold');
  ok(await page.evaluate(() => location.hash) === '#/builder', 'template load switches to draft URL');
  await page.fill('#stName', 'Draft Agent'); await page.reload(); await page.waitForSelector('#stName');
  eq(await page.inputValue('#stName'), 'Draft Agent', 'studio draft persists after reload');
});

await suite('T8 Prompt Builder', async () => {
  await page.evaluate(() => localStorage.removeItem('cpa26-pb'));
  await go('#/p/9');
  ok((await text('#pbOut0')).includes('เป้าหมาย: จัดลำดับคิวไก่เข้าเชือดรายวัน'), 'default prompt 1');
  await page.fill('#pbTask', 'สรุปยอดขายรายเดือน');
  ok((await text('#pbOut0')).includes('เป้าหมาย: สรุปยอดขายรายเดือน'), 'prompt 1 updates instantly');
  ok((await text('#pbOut1')).includes('งาน: สรุปยอดขายรายเดือน') && (await text('#pbOut1')).includes('ช่วยเขียนการตั้งค่า Copilot Agent สำหรับ Agent Builder ให้ครบ:'), 'prompt 2 uses page-8 template');
  await page.fill('#pbRef', 'มาตรฐานบัญชีรายได้');
  ok((await text('#pbOut2')).startsWith('ค้นหาเว็บไซต์ที่น่าเชื่อถือเกี่ยวกับ "มาตรฐานบัญชีรายได้" 5 แหล่ง'), 'prompt 3 replaces [หัวข้อ]');
  await page.selectOption('#pbOut', 'Dashboard ใน Excel');
  ok((await text('#pbOut0')).includes('รูปแบบผลลัพธ์: Dashboard ใน Excel'), 'output format select');
  await page.reload(); await page.waitForSelector('#pbTask');
  eq(await page.inputValue('#pbTask'), 'สรุปยอดขายรายเดือน', 'values persist after reload');
  await page.click('[data-pb-reset]');
  eq(await page.inputValue('#pbTask'), 'จัดลำดับคิวไก่เข้าเชือดรายวัน', 'reset to example');
  await page.click('.pb-res [data-copy]');
  ok((await clip()).startsWith('เป้าหมาย: จัดลำดับคิวไก่เข้าเชือดรายวัน'), 'copy prompt');
});

await suite('T9 Calculators', async () => {
  await go('#/p/70');
  const v = async i => text(`[data-out="${i}"]`);
  eq(await v(0), '1.60 บาท', 'feed Δ live kg (FCR 1.60 × 1)');
  eq(await v(1), '2.22 บาท', 'per kg meat (÷ 72%)');
  eq(await v(2), '1,600,000 บาท', 'per month');
  eq(await v(3), '19,200,000 บาท', 'per year');
  await page.fill('#c-dp', '0.5'); eq(await v(2), '800,000 บาท', 'recalculates instantly');
  await page.fill('#c-fcr', '1.55'); await page.fill('#c-dp', '1'); eq(await v(2), '1,550,000 บาท', 'FCR change');
  await page.fill('#c-yld', '0'); eq(await v(1), '—', 'yield 0 guarded');
  await page.fill('#c-dp', '-1'); eq(await v(0), '—', 'negative input guarded');
  ok((await text('[data-f="0"]')).length > 0, 'formula detail shown');
  await page.click('[data-calc-reset]'); eq(await v(3), '19,200,000 บาท', 'reset');
  await go('#/p/115');
  eq(await v(0), '54 วัน', 'cycle');
  eq(await v(1), '104,000 ตัว', 'chicks per day');
  eq(await v(2), '5,616,000 ตัว', 'capacity');
  eq(await v(3), '≈ 281 หลัง', 'houses (ceil 280.8)');
  await page.fill('#c-rest', '10'); eq(await v(3), '≈ 260 หลัง', 'rest 10 days');
  await page.fill('#c-cap', '0'); eq(await v(3), '—', 'capacity 0 guarded');
});

await suite('Agent Flow player', async () => {
  await go('#/p/34');
  eq(await page.$$eval('.fsteps li', l => l.length), 5, '5 steps');
  ok((await text('.chatwin-bar')).includes('หน้าต่างจำลอง'), 'simulated window label');
  await page.click('[data-play]');
  await page.waitForTimeout(1200);
  eq(await page.$$eval('.fsteps li.on', l => l.length), 1, 'highlights one step at a time');
  await page.waitForFunction(() => document.querySelectorAll('.chat .bub.a:not(.typing)').length >= 6, null, { timeout: 9000 });
  ok((await text('.chat')).includes('ผลลัพธ์:'), 'final output bubble');
  await page.click('[data-reset]');
  eq(await page.$$eval('.chat .bub.a', l => l.length), 0, 'reset clears chat');
});

await suite('Prompt Lab tabs + supplements', async () => {
  await go('#/p/23');
  eq(await page.$$eval('.plab [role="tab"]', l => l.length), 12, '12 categories');
  await page.click('.plab [role="tab"]:nth-child(5)');
  ok(await page.isVisible('#plp-4') && !(await page.isVisible('#plp-0')), 'tab switch');
  await page.focus('#plt-4'); await page.keyboard.press('ArrowRight');
  ok(await page.isVisible('#plp-5'), 'arrow-key tab navigation');
  eq(await page.evaluate(() => location.hash), '#/p/23', 'arrow keys inside tabs do not change page');
  eq(await page.$$eval('.plab [role="tabpanel"] .prompt', l => l.length), 24, '24 prompts');
  // supplement on every page
  const missing = [];
  for (const p of D.pages) if (!p.supp.includes('ส่วนขยายการเรียนรู้')) missing.push(p.n);
  eq(missing.length, 0, 'supplement present on all 154 content pages');
  await go('#/p/33');
  await page.click('#st-verify');
  ok(await page.isVisible('#sp-verify'), 'supplement tab switch');
  await page.check('#sp-verify .vlist li:first-child input');
  await page.reload(); await page.waitForSelector('#st-verify'); await page.click('#st-verify');
  ok(await page.isChecked('#sp-verify .vlist li:first-child input'), 'verify checklist persists');
});

await suite('T10 Learning progress', async () => {
  await page.evaluate(() => { localStorage.removeItem('cpa26-done'); localStorage.removeItem('cpa26-visited'); });
  await page.reload(); await page.waitForSelector('#main h1');
  await go('#/p/8');
  await page.click('#doneBtn');
  eq(await page.getAttribute('#doneBtn', 'aria-pressed'), 'true', 'mark learned');
  eq(await text('#progTxt'), 'เรียนแล้ว 1/191', 'progress counter');
  await go('#/p/9'); await page.click('#doneBtn');
  await go('#/p/10'); await page.click('#doneBtn');
  ok((await text('#toast')).includes('จบบทที่ 2 แล้ว'), 'chapter complete toast');
  await page.reload(); await page.waitForSelector('#main h1');
  eq(await text('#progTxt'), 'เรียนแล้ว 3/191', 'progress persists after reload');
  ok(await page.$('#tocList a[href="#/p/8"] .dot.d'), 'TOC filled dot for learned page');
  await go('#/p/11');
  ok(await page.$('#tocList a[href="#/p/11"] .dot.v'), 'TOC outlined dot for visited page');
  await go('#/progress');
  ok((await text('#main')).includes('เรียนแล้ว 3 หน้า'), 'progress page');
  await go('#/');
  ok((await text('.hero ~ .callout.resume, .callout.resume')).includes('หน้า 11'), 'resume card shows last page');
  await go('#/p/10'); await page.click('#doneBtn');
  eq(await text('#progTxt'), 'เรียนแล้ว 2/191', 'unmark learned');
});

await suite('TOC filter + theme', async () => {
  await go('#/p/2');
  await page.selectOption('#tocGroup', 'lab');
  const vis = await page.$$eval('#tocList .pl a', l => l.map(a => a.getAttribute('href')));
  ok(vis.length >= 4 && vis.length <= 6, 'group filter lab shows ' + vis.length + ' pages');
  await page.selectOption('#tocGroup', '');
  await page.fill('#tocQ', 'Dashboard');
  ok((await page.$$eval('#tocList .pl a', l => l.length)) >= 2, 'text filter');
  await page.fill('#tocQ', '');
  await page.click('.ch-h[data-ch="5"]');
  ok(await page.isVisible('#pl-5'), 'chapter expands');
  const before = await page.getAttribute('html', 'data-theme');
  await page.click('#themeBtn');
  const after = await page.getAttribute('html', 'data-theme');
  ok(before !== after, 'theme toggles ' + before + '→' + after);
  await page.reload(); await page.waitForSelector('#main h1');
  eq(await page.getAttribute('html', 'data-theme'), after, 'theme persists');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(after === 'dark' ? bg === 'rgb(11, 15, 30)' : bg === 'rgb(242, 244, 250)', 'body background token ' + bg);
  if (after === 'dark') { const chip = await page.$eval('.topbar .logo-chip', e => getComputedStyle(e).backgroundColor); eq(chip, 'rgb(244, 246, 253)', 'dark mode logo on light chip'); }
  await page.click('#themeBtn');
});

await suite('Storage unavailable', async () => {
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errs = []; p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(url + '#/p/33'); await p2.waitForSelector('#main h1');
  await p2.click('#doneBtn');
  eq(errs.length, 0, 'no errors when localStorage throws');
  await p2.close();
});

await suite('T11 Responsive (no horizontal scroll, drawer, bottom bar)', async () => {
  const sample = ['#/', '#/track/agent', '#/tracks', '#/updates', '#/deep', '#/d/1', '#/d/13', '#/d/34', '#/p/14', '#/p/21', '#/p/24', '#/p/31', '#/p/33', '#/p/34', '#/p/9', '#/p/70', '#/p/153', '#/p/30', '#/agents', '#/builder/1', '#/appendix-b', '#/progress', '#/p/95', '#/p/147'];
  for (const [w, h] of [[1440, 900], [1024, 768], [820, 1180], [400, 800], [390, 844], [360, 740]]) {
    const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h });
    await p.goto(url); await p.waitForSelector('.hero');
    const over = [];
    for (const r of sample) {
      await p.evaluate(x => { location.hash = x; }, r); await p.waitForTimeout(60);
      const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      if (sw[0] > sw[1]) over.push(`${r} ${sw[0]}>${sw[1]}`);
    }
    eq(over.join(', '), '', `no horizontal page scroll at ${w}px`);
    if (w < 900) {
      ok(await p.isVisible('.bottombar'), `bottom bar visible at ${w}px`);
      ok(!(await p.isVisible('#tocList a')) || !(await p.$eval('#sidebar', e => e.classList.contains('open'))), 'drawer closed by default');
      await p.click('#bbToc'); await p.waitForTimeout(350);
      ok(await p.$eval('#sidebar', e => e.classList.contains('open')), `drawer opens at ${w}px`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(50);
      ok(!(await p.$eval('#sidebar', e => e.classList.contains('open'))), 'Esc closes drawer');
      await p.evaluate(() => { location.hash = '#/p/40'; }); await p.waitForTimeout(60);
      await p.click('#bbNext'); await p.waitForTimeout(60);
      eq(await p.evaluate(() => location.hash), '#/p/41', 'bottom bar next');
      await p.click('#bbFinder'); ok(await p.isVisible('#finder'), 'bottom bar agent finder'); await p.keyboard.press('Escape');
      const bw = await p.$eval('.btn-primary, .bottombar button', e => e.getBoundingClientRect().height);
      ok(bw >= 36, 'touch target height ' + bw);
    } else {
      ok(!(await p.isVisible('.bottombar')), `no bottom bar at ${w}px`);
    }
    if (w >= 1280) {
      await p.evaluate(() => { location.hash = '#/p/33'; }); await p.waitForTimeout(80);
      const pos = await p.$eval('.builder', e => getComputedStyle(e).position);
      eq(pos, 'sticky', 'agent builder panel sticky on wide screens');
      const cols = await p.$eval('.agent-layout', e => getComputedStyle(e).gridTemplateColumns.split(' ').length);
      eq(cols, 2, 'agent page has 2 columns on desktop');
    }
    await p.close();
  }
});

await suite('T12 Accessibility', async () => {
  const p = await ctx.newPage();
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.goto(url + '#/p/34'); await p.waitForSelector('[data-play]');
  await p.keyboard.press('Tab');
  ok(await p.evaluate(() => document.activeElement.classList.contains('skip')), 'first Tab reaches skip link');
  await p.click('[data-play]'); await p.waitForTimeout(150);
  eq(await p.$$eval('.chat .bub.a', l => l.length), 6, 'reduced motion: flow completes instantly');
  let outline = 'none';
  for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); const o = await p.evaluate(() => { const a = document.activeElement; return a && a.matches('button,a') && !a.classList.contains('skip') ? getComputedStyle(a).outlineStyle : null; }); if (o) { outline = o; break; } }
  ok(outline !== 'none', 'visible focus ring (' + outline + ')');
  const p3 = await ctx.newPage(); await p3.goto(url + '#/p/33'); await p3.waitForSelector('.drop');
  let chosen = false; p3.on('filechooser', () => { chosen = true; });
  await p3.focus('.drop'); await p3.keyboard.press('Enter'); await p3.waitForTimeout(400);
  ok(chosen, 'file drop zone operable by keyboard'); await p3.close();
  await p.goto(url + '#/p/33'); await p.waitForSelector('.drop');
  const noName = await p.$$eval('button', l => l.filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length);
  eq(noName, 0, 'all buttons have accessible names');
  const imgs = await p.$$eval('img', l => l.filter(i => !i.alt).length); eq(imgs, 0, 'all images have alt');
  eq(await p.getAttribute('html', 'lang'), 'th', 'lang="th"');
  const axePath = process.env.AXE;
  if (axePath && fs.existsSync(axePath)) {
    const viol = {};
    const actx = await browser.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true, reducedMotion: 'reduce' }); // CSP would block the injected axe script
    const p = await actx.newPage();
    for (const r of ['#/', '#/p/2', '#/p/14', '#/p/33', '#/p/34', '#/p/9', '#/p/23', '#/p/70', '#/agents', '#/builder/1', '#/progress']) {
      for (const theme of ['light', 'dark']) {
        await p.goto(url + r); await p.waitForSelector('#main h1');
        await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
        await p.waitForTimeout(400);
        await p.addScriptTag({ path: axePath });
        const res = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 2).map(n => n.target.join(' ')) })));
        for (const v of res) { const k = v.id; viol[k] = viol[k] || { impact: v.impact, pages: [], nodes: 0, sample: v.sample }; viol[k].pages.push(r + ':' + theme); viol[k].nodes += v.n; }
      }
    }
    fs.writeFileSync(path.join(ROOT, 'test-results', 'axe.json'), JSON.stringify(viol, null, 2));
    const serious = Object.entries(viol).filter(([, v]) => v.impact === 'serious' || v.impact === 'critical');
    console.log('   axe violations:', Object.entries(viol).map(([k, v]) => `${k}(${v.impact},${v.nodes})`).join(' ') || 'none');
    eq(serious.map(([k]) => k).join(','), '', 'axe: no serious/critical WCAG 2 A/AA violations');
    await actx.close();
  } else ok(true, 'axe-core not provided (set AXE=path) — skipped');
  await p.close();
});

await suite('Offline file:// mode', async () => {
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(ROOT, 'dist', 'index.html') + '#/p/33');
  await p.waitForSelector('[data-builder] .builder-in');
  await p.setInputFiles('[data-builder] input[type="file"]', path.join(FIX, 'farm-sample.xlsx'));
  await p.waitForSelector('[data-block="start"]', { timeout: 8000 });
  eq(errs.length, 0, 'works when opened directly from disk (incl. SheetJS)');
  await p.close();
});

eq(errors.join(' | '), '', 'no console/page errors during the run');
await browser.close(); srv.close();
const pass = results.filter(r => r.ok).length;
const bySuite = {};
for (const r of results) { bySuite[r.suite] = bySuite[r.suite] || { pass: 0, fail: 0 }; bySuite[r.suite][r.ok ? 'pass' : 'fail']++; }
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'test-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), pass, fail: results.length - pass, bySuite, failures: results.filter(r => !r.ok) }, null, 2));
console.log(`\n${pass}/${results.length} checks passed`);
for (const [s, v] of Object.entries(bySuite)) console.log(`  ${v.fail ? '✗' : '✓'} ${s}: ${v.pass}/${v.pass + v.fail}`);
process.exitCode = pass === results.length ? 0 : 1;
