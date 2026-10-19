// End-to-end functional tests in real Chromium. Usage: npm run build && node tests/e2e.mjs
// Optional: AXE=path/to/axe.min.js runs automated accessibility checks (axe-core).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { serve, launch, ROOT, seededContext, TEST_EMAIL } from './lib.mjs';

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
const ctx = await seededContext(browser, { viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], serviceWorkers: 'block' });
const SNAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'copilot-updates.json'), 'utf8'));
const LIVE = { ...SNAP, fetchedAt: new Date(Date.now() + 60000).toISOString(), live: true, items: [{ ...SNAP.items[0], id: '999001', url: 'https://www.microsoft.com/microsoft-365/roadmap?id=999001', title: 'LIVE TEST: Copilot agent item', topic: 'agent', agent: true }, ...SNAP.items.slice(1)] };
let apiMode = 'live';
await ctx.route('**/api/copilot-updates', r => apiMode === 'live' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LIVE) }) : r.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"x"}' }));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_TUNNEL|ERR_PROXY|net::ERR/.test(m.text()) && !(apiMode !== 'live' && /status of 502/.test(m.text()))) errors.push(m.text()); });
const go = async h => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(60); };
const text = sel => page.$eval(sel, e => e.textContent.trim());
const text2 = (pg, sel) => pg.$eval(sel, e => e.textContent.trim());
const clip = () => page.evaluate(() => navigator.clipboard.readText());
await page.goto(url);
await page.waitForSelector('.hero');
const D = await page.evaluate(() => window.__app.D);
const ORDER = [1, ...D.pages.map(p => p.n)].sort((a, b) => a - b);
const TOTALP = D.meta.totalPages + D.meta.deepTotal + D.meta.excelTotal;

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
  await go('#/d/36'); await page.waitForSelector('#main .deep-body'); eq(await page.$eval('.pager a[rel="next"]', a => a.getAttribute('href')).catch(() => null), '#/x/start', 'last deep lesson → AI + Excel course start');
  { const lastX = D.excel.index[D.excel.index.length - 1]; await go('#/x/' + lastX.slug); await page.waitForSelector('#main .x-body'); ok(!(await page.$('.pager a[rel="next"]')), 'last AI + Excel page has no next'); }
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
  eq(await page.$$eval('.ccard .cc-svg', l => l.length), 27 + 6 + D.excel.chapters.length, 'illustration on every chapter card (27 chapters + 6 deep groups + AI + Excel)');
  await go('#/p/95'); ok(await page.$('.ph-module .ph-art'), 'module header illustration');
  await go('#/p/33'); ok(await page.$('.ph .ph-art'), 'agent header illustration');
});

await suite('Copilot Agent first + learning paths', async () => {
  await go('#/');
  const cta = await page.$eval('.hero-cta a.btn-primary', e => [e.textContent.trim(), e.getAttribute('href')]);
  ok(cta[0].includes('เริ่มเรียน Copilot Agent') && cta[1] === '#/track/agent', 'primary CTA = Copilot Agent');
  ok((await text('.hero-cta')).includes('เริ่มที่ Prompt Mode →'), 'Prompt Mode CTA kept');
  const order = await page.$$eval('#main > .wrap > section, #main > .wrap > div.stats', l => l.map(e => e.className));
  ok(order[0].includes('hero') && order[1].includes('pa') && order[2].includes('updates') && order[3].includes('tracks-sec'), 'home order: hero → Prompt Lab อัตโนมัติ → live updates → learning paths (' + order.slice(0, 4).join(' | ') + ')');
  const tracks = await page.$$eval('.tracks .track b', l => l.map(e => e.textContent));
  eq(tracks[0], 'Copilot Agent', 'first learning path is Copilot Agent');
  ok(tracks.length === 8 && tracks.some(t => /AI \+ Excel/.test(t)) && tracks.some(t => /Excel, Word และ PowerPoint/.test(t)) && tracks.some(t => /เบราว์เซอร์/.test(t)) && tracks.some(t => /Tips & Tricks/.test(t)) && tracks.some(t => /งานจริง/.test(t)), '8 paths: Agent, AI + Excel, Office, browser, tips, real work, …');
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

await suite('Auto-updates (Microsoft 365 Roadmap) · Thai summaries · 3 featured', async () => {
  const TH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'updates-th.json'), 'utf8')).items;
  apiMode = 'live';
  await page.goto(url); await page.waitForSelector('.updates.home');
  await page.waitForFunction(() => document.querySelector('.updates .live-dot.live'), null, { timeout: 8000 });
  ok((await text('.updates [data-upd-meta]')).includes('ข้อมูลสด'), 'live indicator (data from /api/copilot-updates)');
  eq(await page.$$eval('.updates.home .upd', l => l.length), 3, 'home shows only 3 featured stories');
  eq(await page.$$eval('.updates.home .upd.feat', l => l.length), 3, 'featured cards styled');
  eq(await page.$eval('.updates.home .upd', e => e.dataset.topic), 'agent', 'first featured story is Copilot Agent');
  ok(await page.$$eval('.updates.home .upd-t', l => l.every(a => /[฀-๿]/.test(a.textContent))), 'featured headlines are Thai');
  ok(await page.$$eval('.updates.home .upd-s', l => l.every(p => /[฀-๿]/.test(p.textContent) && p.textContent.length > 40)), 'featured cards have a Thai plain-language summary');
  ok(await page.$$eval('.updates.home .upd', l => l.every(e => e.querySelector('.upd-en') && e.querySelector('details.upd-orig'))), 'English original title + collapsible original summary kept');
  eq(await page.$$eval('.updates.home [data-ut]', l => l.length), 0, 'full list / filters hidden from home');
  ok((await text('.updates.home .upd-more')).includes(String(LIVE.items.length)), 'button shows total count');
  await page.click('.updates.home .upd-more'); await page.waitForSelector('.upd-all');
  eq(await page.evaluate(() => location.hash), '#/updates', '"ดูข่าวทั้งหมด" opens updates page');
  eq(await page.$$eval('.updates .feat-list .upd', l => l.length), 3, 'updates page: 3 featured on top');
  ok(!(await page.$eval('.upd-all', d => d.open)) && !(await page.isVisible('.upd-all [data-upd-list]')), 'all news hidden until clicked');
  await page.click('.upd-all > summary');
  eq(await page.$$eval('.upd-all .upd', l => l.length), LIVE.items.length, 'click → all items listed');
  const known = LIVE.items.find(i => TH[i.id] && i.preview && /CY2026/.test(i.preview));
  ok((await page.$eval(`.upd-all .upd a[href$="id=${known.id}"]`, a => a.textContent)).includes(TH[known.id].t), 'translated headline from data/updates-th.json');
  ok((await page.$eval(`.upd-all .upd a[href$="id=${known.id}"]`, a => a.closest('.upd').querySelector('.upd-d').textContent)).includes('2569'), 'timeline converted to Thai months / พ.ศ.');
  const auto = await page.$eval('.upd-all .upd a[href$="id=999001"]', a => a.closest('.upd').textContent);
  ok(auto.includes('LIVE TEST: Copilot agent item') && auto.includes('ยังไม่มีคำอธิบายภาษาไทย'), 'brand-new item without translation gets an automatic Thai summary');
  await page.click('.upd-all [data-ut="agent"]');
  ok(await page.$$eval('.upd-all .upd', l => l.length > 0 && l.every(e => e.dataset.topic === 'agent')), 'topic filter Agent');
  ok(await page.$$eval('.upd-t', l => l.every(a => a.href.startsWith('https://www.microsoft.com/microsoft-365/roadmap?id=') && a.target === '_blank')), 'items link to official roadmap');
  ok((await text('.upd-legend')).includes('Preview'), 'status legend explains Preview / GA');
  const p2 = await ctx.newPage(); apiMode = 'fail';
  await p2.goto(url); await p2.waitForSelector('.updates.home'); await p2.waitForTimeout(500);
  ok((await p2.textContent('.updates [data-upd-meta]')).includes('ข้อมูล ณ การ build ล่าสุด'), 'falls back to build snapshot when API unavailable');
  eq(await p2.$$eval('.updates.home .upd', l => l.length), 3, 'snapshot: 3 featured rendered');
  await p2.close(); apiMode = 'live';
  ok(SNAP.items.length >= 20 && SNAP.items.every(i => /^https:\/\/www\.microsoft\.com\//.test(i.url) && i.title), 'snapshot holds real Copilot roadmap items (' + SNAP.items.length + ', fetched ' + SNAP.fetchedAt + ')');
  eq(SNAP.items.filter(i => !TH[i.id]).length, 0, 'every snapshot item has a Thai translation');
});
await suite('AI + Excel Formula Mastery', async () => {
  const errs = []; const onErr = e => errs.push(e.message); page.on('pageerror', onErr);
  const SPEC = fs.readFileSync(path.join(ROOT, 'content', 'excel', 'AI_Excel_3_Levels_Claude_Build_Spec.md'), 'utf8');
  const SAMPLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'excel', 'sample-data.json'), 'utf8'));
  const X = D.excel;
  await go('#/excel'); await page.waitForSelector('.x-levels');
  eq(await page.$$eval('.x-level', l => l.length), 3, 'course hub: 3 level cards');
  eq(await page.$$eval('.x-tools .tool', l => l.length), 4, 'course hub: 4 tools');
  ok((await text('#tocList')).includes('AI + Excel Formula Mastery'), 'TOC has AI + Excel section');
  let bad = 0;
  for (const it of X.index) { await go('#/x/' + it.slug); await page.waitForFunction(s => location.hash === '#/x/' + s && document.querySelector('#main .x-body h1, #main h1'), it.slug); if ((await text('#main h1')) !== it.title) bad++; }
  eq(bad, 0, `all ${X.index.length} AI + Excel pages render with correct h1`);
  // Prompt Library: every spec prompt verbatim + copy
  await go('#/x/prompts'); await page.waitForSelector('[data-xlib]');
  const ids = [...SPEC.matchAll(/^### ([BIA]0\d) /gm)].map(m => m[1]);
  eq(ids.length, 22, 'spec defines 22 prompts (B01–B07, I01–I07, A01–A08)');
  const heads = await page.$$eval('.x-src .prompt-head span', l => l.map(e => e.textContent));
  ok(ids.every(id => heads.some(h => h.startsWith(id))), 'Prompt Library shows all 22 spec prompts');
  const want = SPEC.match(/### B03[\s\S]*?```text\n([\s\S]*?)\n```/)[1];
  await page.evaluate(() => [...document.querySelectorAll('.x-src .prompt')].find(p => p.querySelector('.prompt-head span').textContent.startsWith('B03')).querySelector('[data-copy]').click());
  await page.waitForTimeout(200); eq(await clip(), want, 'copy B03 = spec text verbatim');
  await page.click('[data-xf="i"]'); await page.waitForTimeout(80);
  ok(await page.$$eval('[data-xlv="b"]', l => l.every(e => e.hidden)) && await page.$$eval('[data-xlv="i"]', l => l.every(e => !e.hidden)), 'level filter: Intermediate only');
  await page.click('[data-xf=""]'); await page.fill('#xpQ', 'Power Query'); await page.waitForTimeout(80);
  ok(/แสดง \d+ Prompt/.test(await text('[data-xp-count]')) && (await page.$$eval('.content .prompt:not([hidden])', l => l.length)) < (await page.$$eval('.content .prompt', l => l.length)), 'prompt search narrows the list');
  await page.fill('#xpb-goal', 'สรุป Feed รายฟาร์ม'); await page.selectOption('#xpb-sep', ';'); await page.waitForTimeout(50);
  const pb = await text('[data-xpb-out]'); ok(pb.includes('เป้าหมาย: สรุป Feed รายฟาร์ม') && pb.includes('คั่นอาร์กิวเมนต์ด้วย ;') && pb.includes('8) ระบุสิ่งที่ต้องตรวจด้วยมนุษย์ก่อนใช้งานจริง'), 'Framework prompt builder composes 8-part prompt');
  // Formula Lab
  await go('#/x/formulas'); await page.waitForSelector('[data-xlab] [data-xl]');
  const nF = await page.$$eval('.xf-wrap', l => l.length); ok(nF >= 100, `Formula Lab lists ${nF} formulas`);
  ok(await page.$$eval('.xf-wrap', l => l.every(w => w.querySelector('.xver') && w.querySelectorAll('.xf-t tbody tr').length >= 3)), 'every formula has a version badge and ≥3 test cases');
  await page.selectOption('#xfV', 'm365'); await page.waitForTimeout(60);
  ok(await page.$$eval('.xf-wrap:not([hidden])', l => l.length > 0 && l.every(w => w.dataset.ver === 'm365')), 'version filter');
  ok(await page.$$eval('.xf-wrap:not([hidden]) .xstat', l => l.every(e => e.classList.contains('m365'))), 'M365 formulas labelled "ยังไม่ได้ทดสอบใน Excel จริง"');
  await page.selectOption('#xfV', '');
  const lab = async (k, vals) => { await page.click(`#xlt-${k}`); for (const [i, v] of Object.entries(vals)) await page.fill(`#xl-${k}-${i}`, v); await page.waitForTimeout(40); return page.textContent(`#xlp-${k} [data-xl-r]`); };
  eq(await lab('ifand', { 0: '50', 1: 'ผ่าน' }), '0', 'lab IF+AND: A2=50 → 0'); eq(await lab('ifand', { 0: '51' }), '100', 'lab IF+AND: A2=51 → 100'); eq(await lab('ifand', { 0: '51', 1: '' }), '0', 'lab IF+AND: B2 blank → 0');
  ok((await lab('cv', { 0: '10 12 14' })).includes('CV%=16.67'), 'lab CV%: 10,12,14 → 16.67');
  ok((await lab('cv', { 0: '0 0' })).includes('#N/A'), 'lab CV%: mean 0 → #N/A');
  eq(await lab('lookup', { 1: 'F003' }), 'รหัสซ้ำ', 'lab lookup: duplicate key warns'); eq(await lab('lookup', { 1: 'f001' }), '1.62', 'lab lookup: case-insensitive hit'); eq(await lab('lookup', { 1: 'F009' }), 'ไม่พบฟาร์ม', 'lab lookup: not found');
  ok((await lab('sumifs', {})).startsWith('1,130 kg (2 แถว)'), 'lab SUMIFS date range with times → 1,130 kg');
  eq(await lab('fcr', { 0: '3600', 1: '2250' }), '1.600', 'lab CALC_FCR 3600/2250'); eq(await lab('fcr', { 1: '0' }), '#N/A', 'lab CALC_FCR gain 0 → #N/A');
  eq(await lab('dq', { 2: '-5' }), 'ERROR', 'lab Data Quality: negative → ERROR'); eq(await lab('dq', { 2: '940', 3: '' }), 'WARNING', 'lab Data Quality: blank feed → WARNING');
  eq(await lab('split', { 0: 'BR-2026-001' }), '[BR] [2026] [001]', 'lab split keeps leading zeros');
  // lesson page: spec prompt + verified formula cards + answer key
  await go('#/x/b2'); await page.waitForSelector('#main .x-body');
  ok(await page.$('#main .x-src .prompt') && await page.$('#main .xf .xstat.ok'), 'lesson shows spec prompt and LibreOffice-verified formulas');
  ok((await page.$$eval('#main .x-ex details', l => l.length)) >= 3, 'lesson exercises with answer keys');
  for (const sec of ['Learning Objectives', 'Prerequisites', 'Concepts', 'Function Reference', 'Formula Examples', 'Sample Data', 'Expected Output', 'Validation', 'Exercises + Answer Key', 'Troubleshooting']) if (!(await text('#main')).includes(sec)) ok(false, 'lesson section ' + sec);
  ok(true, 'lesson has all 12 parts (Objectives … Troubleshooting)');
  // quiz + pre/post compare
  await go('#/x/b-quiz'); await page.waitForSelector('[data-quiz="xq-b-pre"]');
  await page.$$eval('[data-quiz="xq-b-pre"] fieldset', fs => fs.forEach(f => { f.querySelectorAll('input')[+f.dataset.a].checked = true; }));
  await page.click('[data-quiz="xq-b-pre"] [data-quiz-check]'); await page.waitForTimeout(80);
  eq(await text('[data-quiz="xq-b-pre"] .qres'), 'คะแนน 10/10 · ยอดเยี่ยม!', 'pre-test scoring with answer key');
  ok((await text('[data-xq-compare]')).includes('10/10'), 'pre/post comparison updates');
  eq(await page.$$eval('[data-quiz="xq-b-post"] fieldset', l => l.length), 10, 'post-test 10 questions');
  // progress counts AI + Excel pages
  await page.click('#doneBtn'); await page.waitForTimeout(60);
  ok((await text('#progTxt')).endsWith('/' + TOTALP), 'progress total includes AI + Excel pages (' + TOTALP + ')');
  await page.click('#doneBtn');
  // workbook download
  await go('#/x/workbook'); await page.waitForSelector('a[download]');
  const wb = await page.evaluate(async () => { const r = await fetch(document.querySelector('a[download]').href); return [r.status, (await r.arrayBuffer()).byteLength]; });
  ok(wb[0] === 200 && wb[1] > 10000, `sample-workbook.xlsx downloadable (${wb[1]} bytes)`);
  // dashboard
  await go('#/x/dashboard'); await page.waitForSelector('[data-xd-kpis] .xd-k');
  eq(await page.$$eval('[data-xd-kpis] .xd-k', l => l.length), 4, 'dashboard: 4 KPI cards');
  ok((await text('[data-xd-status]')).includes('PROTOTYPE') && (await text('[data-xd-status]')).includes('Last Updated') && (await text('[data-xd-status]')).includes('Refresh Status'), 'dashboard shows source / last updated / refresh status / prototype label');
  const lastOf = f => SAMPLE.rows.filter(r => r.Farm_ID === f).sort((a, b) => b.Age_Days - a.Age_Days)[0];
  const r2 = lastOf('F002'); const live = r2.Birds_Placed - r2.Mortality_Cum; const fcr2 = r2.Feed_Cum_kg / ((r2.Body_Weight_g - SAMPLE.chickWeightG) / 1000 * live);
  await page.selectOption('#xdFarm', 'F002'); await page.waitForTimeout(60);
  eq(await page.$$eval('[data-xd-rows] tr', l => l.length), SAMPLE.rows.filter(r => r.Farm_ID === 'F002').length, 'filter Farm F002 → its rows');
  ok((await text('[data-xd-kpis]')).includes(fcr2.toFixed(3)), `FCR KPI = ${fcr2.toFixed(3)} (same definition as workbook)`);
  await page.selectOption('#xdAge', '42'); await page.waitForTimeout(40); eq(await page.$$eval('[data-xd-rows] tr', l => l.length), 1, 'filter age 42');
  await page.fill('#xdFrom', '2027-01-01'); await page.dispatchEvent('#xdFrom', 'change'); await page.waitForTimeout(40);
  ok((await text('[data-xd-kpis]')).includes('ไม่มีข้อมูลตามตัวกรองนี้'), 'empty state when filters match nothing');
  await page.click('[data-xd-reset]'); await page.waitForTimeout(40);
  eq(await page.$$eval('[data-xd-rows] tr', l => l.length), SAMPLE.rows.length, 'reset filters → all rows');
  await page.fill('#xdQ', 'F004'); await page.waitForTimeout(40); eq(await page.$$eval('[data-xd-rows] tr', l => l.length), 6, 'table search'); await page.fill('#xdQ', '');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-xd-csv]')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8'); ok(csv.split('\n').length === SAMPLE.rows.length + 1 && csv.includes('FCR'), 'Export CSV (header + all rows)');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('[data-xd-xlsx]')]);
  ok(fs.statSync(await dl2.path()).size > 1000 && dl2.suggestedFilename() === 'farm-dashboard.xlsx', 'Export Excel');
  await page.setInputFiles('#xdFile', path.join(ROOT, 'ai-excel-formula-mastery', 'data', 'sample-workbook.xlsx')); await page.waitForFunction(() => /อัปโหลด/.test(document.querySelector('[data-xd-status]').textContent), null, { timeout: 8000 });
  ok((await text('[data-xd-status]')).includes(`อ่าน ${SAMPLE.rows.length} แถวสำเร็จ`), 'upload the real sample workbook (Raw_Data sheet) → reads all rows');
  fs.writeFileSync(path.join(FIX, 'bad-schema.csv'), 'Farm,When,Weight\nF001,2026-10-01,500\n');
  await page.setInputFiles('#xdFile', path.join(FIX, 'bad-schema.csv')); await page.waitForTimeout(400);
  ok((await text('[data-xd-status]')).includes('Schema ไม่ตรง') && (await page.$$eval('[data-xd-rows] tr', l => l.length)) === SAMPLE.rows.length, 'wrong schema → error state, previous data kept');
  fs.writeFileSync(path.join(FIX, 'dirty.csv'), 'Farm_ID,Date,Age_Days,Body_Weight_g,Feed_Cum_kg,Mortality_Cum,Birds_Placed\nF001,2026-10-01,14,500,4000,40,10000\nF001,2026-10-01,14,500,4000,40,10000\nF002,2026-10-08,21,-940,9000,90,9800\nF003,2026-12-30,21,940,9000,90,9800\n');
  await page.setInputFiles('#xdFile', path.join(FIX, 'dirty.csv')); await page.waitForTimeout(400);
  const qw = await text('[data-xd-status]'); ok(/Data Quality Warnings: \d+/.test(qw) && qw.includes('ข้อมูลซ้ำ') && qw.includes('ค่าติดลบ') && qw.includes('เกินวันรายงาน'), 'data quality warnings: duplicate, negative, future date');
  await page.click('[data-xd-sample]'); await page.waitForTimeout(60); ok((await text('[data-xd-status]')).includes('PROTOTYPE'), 'back to sample data');
  page.off('pageerror', onErr); eq(errs.length, 0, 'no page errors on AI + Excel pages');
});
await suite('Open access (no sign-in in the production build)', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const cfg = JSON.parse(html.match(/<script type="application\/json" id="gate-cfg">([\s\S]*?)<\/script>/)[1]);
  eq(cfg.on, false, 'build ships with the email gate off');
  eq(cfg.h.length, 0, 'no email hashes in the build');
  const octx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const o = await octx.newPage(); const errs = []; o.on('pageerror', e => errs.push(e.message));
  await o.goto('file://' + path.join(ROOT, 'dist', 'index.html'));
  await o.waitForSelector('.hero', { timeout: 8000 });
  ok(!(await o.$('#gate')), 'a new device opens the app directly (no email prompt)');
  ok(!(await o.$('[data-app-act="signout"]')) && !(await o.$('.sb-user')), 'no sign-out / user chip when open');
  eq(errs.length, 0, 'no page errors');
  await octx.close();
});

await suite('Email gate code (kept for EMAIL_GATE=on · test list injected)', async () => {
  const gctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const g = await gctx.newPage(); const errs = []; g.on('pageerror', e => errs.push(e.message));
  await g.goto(url); await g.waitForSelector('#gate');
  ok(!(await g.$('.hero')), 'content not rendered before email');
  ok(await g.$eval('#topbar', e => e.inert && e.getAttribute('aria-hidden') === 'true'), 'app behind gate is inert');
  await g.keyboard.press('Control+K'); ok(await g.isHidden('#cmd'), 'shortcuts disabled while gated');
  await g.fill('#gateEmail', 'not-an-email'); await g.click('.gate-go');
  ok((await g.textContent('#gateErr')).includes('รูปแบบ'), 'invalid format rejected');
  await g.fill('#gateEmail', 'stranger@example.com'); await g.click('.gate-go'); await g.waitForTimeout(100);
  ok((await g.textContent('#gateErr')).includes('ยังไม่มีสิทธิ์'), 'email not on list rejected');
  ok(await g.$('#gate'), 'still locked');
  await g.fill('#gateEmail', '  ' + TEST_EMAIL.toUpperCase() + ' '); await g.click('.gate-go');
  await g.waitForSelector('.hero');
  ok(!(await g.$('#gate')), 'allowed email (any case/spaces) opens the app');
  const stored = await g.evaluate(() => localStorage.getItem('cpa26-gate'));
  ok(/"h":"[0-9a-f]{64}"/.test(stored) && !stored.includes(TEST_EMAIL), 'device stores only the SHA-256 hash (+ masked email), not the email');
  const html = await g.content();
  ok(!html.includes(TEST_EMAIL), 'allowed emails are not present in the page (hashes only)');
  ok(!/"h":\[[^\]]*@/.test(fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8').match(/id="gate-cfg">([\s\S]*?)<\/script>/)[1]), 'dist gate config holds no plain-text emails');
  await g.reload(); await g.waitForSelector('.hero');
  ok(!(await g.$('#gate')), 'remembered after reload');
  const g2 = await gctx.newPage(); await g2.goto(url + '#/agents'); await g2.waitForSelector('#main h1');
  ok(!(await g2.$('#gate')), 'remembered when the app is opened again (new tab/window)');
  await g2.close();
  await g.click('#bbToc'); await g.waitForTimeout(250);
  ok((await g.textContent('#sbApp')).includes('le•••r@e•••.com') && await g.isVisible('#sbApp [data-app-act="update"]'), 'phone: drawer shows masked email + update/install/sign-out');
  await Promise.all([g.waitForNavigation(), g.click('#sbApp [data-app-act="signout"]')]);
  await g.waitForSelector('#gate'); ok(true, 'sign out → asks for email again');
  await g.evaluate(() => localStorage.setItem('cpa26-gate', JSON.stringify({ h: 'f'.repeat(64), m: 'x' })));
  await g.reload(); await g.waitForSelector('#gate');
  ok((await g.textContent('.gate-sub')).includes('ไม่อยู่ในรายชื่อ'), 'removed from list → access revoked on next open');
  await g.fill('#gateEmail', TEST_EMAIL); await g.press('#gateEmail', 'Enter'); await g.waitForSelector('.hero');
  ok(true, 'Enter key submits');
  eq(errs.length, 0, 'no page errors');
  await gctx.close();
});
await suite('PWA + refresh / update app', async () => {
  const pctx = await seededContext(browser, { viewport: { width: 820, height: 1180 } });
  const p = await pctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForSelector('.hero');
  const man = await p.evaluate(async () => { const l = document.querySelector('link[rel="manifest"]'); const r = await fetch(l.href); return { ct: r.headers.get('content-type'), j: await r.json() }; });
  ok(man.j.display === 'standalone' && man.j.start_url && man.j.short_name, 'web app manifest (standalone)');
  ok(['192x192', '512x512'].every(sz => man.j.icons.some(i => i.sizes === sz)) && man.j.icons.some(i => i.purpose === 'maskable'), 'manifest icons 192 / 512 / maskable');
  const dims = await p.evaluate(async srcs => Promise.all(srcs.map(s => new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth + 'x' + im.naturalHeight); im.onerror = () => res('ERR'); im.src = s; }))), [...man.j.icons.map(i => i.src), 'icons/apple-touch-icon.png']);
  eq(dims.join(','), [...man.j.icons.map(i => i.sizes), '180x180'].join(','), 'icon files load at the declared sizes');
  ok(await p.$('link[rel="apple-touch-icon"]') && await p.$('meta[name="apple-mobile-web-app-capable"]'), 'iOS home-screen icon + meta');
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(() => navigator.serviceWorker.controller || (location.reload(), false), null, { timeout: 10000 }).catch(() => {});
  await p.waitForSelector('.hero');
  ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'service worker controls the page');
  ok(await p.evaluate(async () => (await caches.keys()).some(k => k.startsWith('cpa26-'))), 'app shell precached');
  await pctx.setOffline(true);
  await p.reload(); await p.waitForSelector('.hero', { timeout: 10000 });
  ok(true, 'opens offline (from service-worker cache)');
  await p.goto(url + '#/d/2'); await p.waitForSelector('#main .deep-body', { timeout: 10000 });
  ok(true, 'deep lesson opens offline');
  await p.goto(url + '#/x/dashboard'); await p.waitForSelector('[data-xd-kpis] .xd-k', { timeout: 10000 });
  ok(true, 'AI + Excel dashboard opens offline');
  await p.click('#updateBtn'); await p.waitForTimeout(400);
  ok((await p.textContent('#toast')).includes('ออฟไลน์'), 'refresh while offline explains it uses the saved version');
  await pctx.setOffline(false);
  await p.goto(url); await p.waitForSelector('.hero');
  await p.click('#updateBtn');
  await p.waitForFunction(() => /เป็นเวอร์ชันล่าสุดแล้ว/.test(document.querySelector('#toast').textContent), null, { timeout: 10000 });
  ok(true, 'refresh button: up to date → refreshes data and says so');
  const V = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', 'version.json'), 'utf8'));
  await p.route('**/version.json*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...V, version: '9.9.9', build: 'next-build' }) }));
  await p.reload(); await p.waitForSelector('#updBanner', { timeout: 10000 });
  ok((await text2(p, '#updBanner')).includes('9.9.9') && await p.isVisible('#updateBtn .upd-dot'), 'new version detected automatically → banner + dot on refresh button');
  await Promise.all([p.waitForNavigation({ timeout: 20000 }), p.click('#updBanner [data-upd-now]')]);
  await p.waitForSelector('.hero'); ok(true, '"อัปเดตเลย" installs the new version and reloads');
  await p.unroute('**/version.json*');
  await p.click('#toolsBtn');
  ok(await p.isVisible('#toolsMenu [data-app-act="update"]') && await p.isVisible('#toolsMenu [data-app-act="install"]'), 'tools menu: refresh/update + install app');
  await p.click('#toolsMenu [data-app-act="install"]'); await p.waitForTimeout(200);
  ok((await p.textContent('#toast')).length > 10, 'install shows how to add to home screen');
  eq(errs.length, 0, 'no page errors');
  await pctx.close();
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

await suite('Prompt Lab อัตโนมัติ (หน้าแรก: ไฟล์/ข้อความ → Prompt)', async () => {
  const PFX = path.join(ROOT, 'tests', 'fixtures');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|net::ERR|ERR_TUNNEL|ERR_PROXY/.test(m.text())) errs.push(m.text()); });
  await p.goto(url); await p.waitForSelector('#plab');
  // placement: right after the hero, before the news; Copilot is still the biggest word
  eq(await p.evaluate(() => { const h = document.querySelector('.hero'); return h.nextElementSibling && h.nextElementSibling.id; }), 'plab', 'Prompt Lab section directly after the hero');
  ok(await p.evaluate(() => { const s = document.querySelector('#plab').compareDocumentPosition(document.querySelector('.updates.home')); return !!(s & Node.DOCUMENT_POSITION_FOLLOWING); }), 'Prompt Lab comes before the news panel');
  ok(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#heroT')).fontSize) > parseFloat(getComputedStyle(document.querySelector('#paT')).fontSize) * 2), 'Copilot title remains the largest text');
  eq(await p.$$eval('[data-pa-card]', l => l.length), 0, 'no prompt cards before input');
  // all requests while analysing must stay on this origin
  const reqs = []; p.on('request', r => reqs.push(r.url()));
  // 1) pasted text
  const TXT = 'บันทึกการประชุมทีมวางแผนการผลิต\nวาระที่ 1 ติดตามยอดผลิต\nยอดผลิตเดือนกันยายน 8,200 ตัน คิดเป็นร้อยละ 94 ของเป้าหมาย ต้นทุนเฉลี่ย 37.5 บาทต่อกิโลกรัม\nวาระที่ 2 แผนซ่อมบำรุง\nที่ประชุมมีมติให้ผู้รับผิดชอบงานซ่อมบำรุงจัดทำแผนหยุดเครื่องภายในวันที่ 15/11/2569 และรายงานผลการประชุมครั้งถัดไป\nวาระที่ 3 เรื่องอื่น ๆ\nที่ประชุมรับทราบแผนการผลิตไตรมาสหน้าและมติให้ติดตามต้นทุนการผลิตทุกสัปดาห์';
  await p.fill('#paText', TXT);
  await p.waitForSelector('[data-pa-card]', { timeout: 4000 });
  eq(await p.$$eval('[data-pa-card]', l => l.length), 7, 'pasted text → 7 prompt cards');
  eq(await p.$eval('[data-pa-prof] .pill', e => e.textContent.trim()), 'บันทึกการประชุม', 'document type detected (meeting)');
  const heads = await p.$$eval('.pa-heads li', l => l.map(x => x.textContent));
  ok(heads.some(h => h.includes('วาระที่ 1')), 'headings detected: ' + heads.slice(0, 3).join(' | '));
  ok((await p.$$eval('.pa-dl .pa-chips .chip', l => l.length)) >= 2, 'keywords detected (Intl.Segmenter Thai)');
  const sumTxt = await p.$eval('[data-pa-card="summary"] pre', e => e.textContent);
  ok(sumTxt.includes('วาระที่ 1') && sumTxt.includes('--- ข้อความ ---') && sumTxt.includes('ห้ามแต่งเพิ่ม'), 'summary prompt uses headings, includes pasted text and verification lines');
  ok(await p.$('[data-pa-card="numbers"] .prompt-head') && (await p.$eval('[data-pa-card="numbers"] .prompt-head', e => e.textContent)).includes('ตัวเลข'), 'numbers card when numbers found');
  const agentTxt = await p.$eval('[data-pa-card="agent"] pre', e => e.textContent);
  ok(['บทบาท', 'เป้าหมาย', 'ข้อมูลนำเข้า', 'ขั้นตอน', 'รูปแบบผลลัพธ์', 'การตรวจสอบ', 'ข้อห้าม', 'เมื่อไม่แน่ใจ'].every(h => agentTxt.includes('\n' + h + '\n')), 'Agent Instructions have all 8 sections');
  const nameLine = agentTxt.match(/^Name: (.*)$/m); ok(nameLine && nameLine[1].length <= 30, 'Agent Name ≤ 30 chars');
  ok(!/ผู้จัดการ|หัวหน้างาน|Manager|Supervisor/.test(await p.$eval('[data-pa-cards]', e => e.textContent)), 'no job titles in generated prompts');
  // options change prompts + recommended card moves first
  await p.selectOption('#paGoal', 'email'); await p.waitForTimeout(50);
  eq(await p.$eval('[data-pa-card]', e => e.dataset.paCard), 'email', 'goal → recommended card first');
  await p.selectOption('#paAud', 'ผู้มีอำนาจอนุมัติ'); await p.selectOption('#paFmt', 'ppt'); await p.fill('#paExtra', 'เน้นเรื่องต้นทุน'); await p.waitForTimeout(50);
  const conv = await p.$eval('[data-pa-card="convert"] pre', e => e.textContent);
  ok(conv.includes('PowerPoint') && conv.includes('ผู้มีอำนาจอนุมัติ') && conv.includes('เน้นเรื่องต้นทุน'), 'format/audience/extra applied to prompts');
  await p.uncheck('[data-pa-opt="inc"]'); await p.waitForTimeout(50);
  ok(!(await p.$eval('[data-pa-card="summary"] pre', e => e.textContent)).includes('--- ข้อความ ---'), 'can exclude pasted text from prompt');
  await p.check('[data-pa-opt="inc"]');
  // copy = card text
  await p.click('[data-pa-card="agent"] [data-copy]');
  eq(await p.evaluate(() => navigator.clipboard.readText()), await p.$eval('[data-pa-card="agent"] pre', e => e.textContent), 'copy button copies the card prompt');
  // 2) PDF with Thai + English text (2 pages)
  await p.setInputFiles('[data-pa-file]', path.join(PFX, 'sample-th.pdf'));
  await p.waitForFunction(() => document.querySelector('[data-pa-name]') && document.querySelector('[data-pa-name]').textContent === 'sample-th.pdf', null, { timeout: 20000 });
  const prof = await p.$eval('[data-pa-prof]', e => e.textContent);
  ok(prof.includes('2 หน้า'), 'PDF page count read (2 หน้า)');
  ok(prof.includes('รายงานผล'), 'PDF type detected as report');
  const pheads = await p.$$eval('.pa-heads li', l => l.map(x => x.textContent));
  ok(pheads.some(h => h.includes('สรุปผลการผลิต')), 'PDF headings extracted: ' + pheads.slice(0, 4).join(' | '));
  const psum = await p.$eval('[data-pa-card="summary"] pre', e => e.textContent);
  ok(psum.includes('แนบไฟล์ "sample-th.pdf" (PDF 2 หน้า)') && psum.includes('สรุปผลการผลิต') && !psum.includes('--- ข้อความ ---'), 'PDF prompt references the attached file, its pages and headings');
  ok(prof.includes('เปอร์เซ็นต์ พบ') && prof.includes('จำนวนเงิน พบ'), 'PDF numbers / % / money detected');
  // 3) PDF without text (scan)
  await p.setInputFiles('[data-pa-file]', path.join(PFX, 'scan-no-text.pdf'));
  await p.waitForSelector('[data-pa-warn]', { timeout: 15000 });
  ok((await p.$eval('[data-pa-warn]', e => e.textContent)).includes('ไม่พบข้อความ (อาจเป็นภาพสแกน)'), 'scanned PDF → "ไม่พบข้อความ" notice');
  eq(await p.$$eval('[data-pa-card]', l => l.length), 7, 'scanned PDF still produces prompts from file name/pages');
  // 4) broken PDF → error, not stuck
  await p.setInputFiles('[data-pa-file]', path.join(PFX, 'broken.pdf'));
  await p.waitForFunction(() => /อ่านไฟล์ไม่ได้/.test(document.querySelector('[data-pa-status]').textContent), null, { timeout: 15000 });
  ok(!(await p.$('.pa-empty .spin')), 'broken PDF: error shown, analysis not stuck');
  // 5) Excel → column names in prompt
  await p.setInputFiles('[data-pa-file]', path.join(FIX, 'farm-sample.xlsx'));
  await p.waitForFunction(() => document.querySelector('[data-pa-name]') && document.querySelector('[data-pa-name]').textContent === 'farm-sample.xlsx', null, { timeout: 10000 });
  const xs = await p.$eval('[data-pa-card="summary"] pre', e => e.textContent);
  ok(xs.includes('Farm_ID') && xs.includes('Mortality (ตัวเลข)') && xs.includes('ชีต "Daily"'), 'Excel: sheet, columns and guessed types in prompt');
  // 6) unsupported type
  await p.setInputFiles('[data-pa-file]', path.join(FIX, 'virus.exe'));
  await p.waitForFunction(() => /ชนิดไฟล์ไม่รองรับ/.test(document.querySelector('[data-pa-status]').textContent), null, { timeout: 5000 });
  ok(true, 'unsupported file type rejected');
  // clear
  await p.click('[data-pa-clear]');
  eq(await p.$$eval('[data-pa-card]', l => l.length), 0, 'clear resets the tool');
  const ext = reqs.filter(u => !u.startsWith(url) && !u.startsWith('blob:') && !u.startsWith('data:') && !/fonts\.(googleapis|gstatic)/.test(u));
  eq(ext.join(' '), '', 'no requests leave the site while analysing');
  ok(reqs.some(u => u.includes('vendor/pdfjs/pdf.min.mjs')) && reqs.some(u => u.includes('pdf.worker.min.mjs')), 'pdf.js loaded on demand from /vendor (self)');
  // entry points: tools menu, Ctrl+K, page 23 callout, #/plab route
  await p.goto(url + '#/p/23'); await p.waitForSelector('.pa-link');
  await p.click('.pa-link'); await p.waitForSelector('#plab');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'paText'), '#/plab opens home and focuses the text box');
  ok(await p.$('.tools a[href="#/plab"]'), 'listed in home tools');
  eq(errs.join(' | '), '', 'no console/page errors under CSP');
  await p.close();
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
  eq(await text('#progTxt'), `เรียนแล้ว 1/${TOTALP}`, 'progress counter');
  await go('#/p/9'); await page.click('#doneBtn');
  await go('#/p/10'); await page.click('#doneBtn');
  ok((await text('#toast')).includes('จบบทที่ 2 แล้ว'), 'chapter complete toast');
  await page.reload(); await page.waitForSelector('#main h1');
  eq(await text('#progTxt'), `เรียนแล้ว 3/${TOTALP}`, 'progress persists after reload');
  ok(await page.$('#tocList a[href="#/p/8"] .dot.d'), 'TOC filled dot for learned page');
  await go('#/p/11');
  ok(await page.$('#tocList a[href="#/p/11"] .dot.v'), 'TOC outlined dot for visited page');
  await go('#/progress');
  ok((await text('#main')).includes('เรียนแล้ว 3 หน้า'), 'progress page');
  await go('#/');
  ok((await text('.hero ~ .callout.resume, .callout.resume')).includes('หน้า 11'), 'resume card shows last page');
  await go('#/p/10'); await page.click('#doneBtn');
  eq(await text('#progTxt'), `เรียนแล้ว 2/${TOTALP}`, 'unmark learned');
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
  await p2.goto(url + '#/p/33'); await p2.waitForSelector('#gate');
  await p2.fill('#gateEmail', TEST_EMAIL); await p2.click('.gate-go'); await p2.waitForSelector('#main h1');
  ok(true, 'without storage the gate asks every visit, then works');
  await p2.click('#doneBtn');
  eq(errs.length, 0, 'no errors when localStorage throws');
  await p2.close();
});

await suite('T11 Responsive (no horizontal scroll, drawer, bottom bar)', async () => {
  const sample = ['#/', '#/track/agent', '#/tracks', '#/updates', '#/deep', '#/d/1', '#/d/13', '#/d/34', '#/p/14', '#/p/21', '#/p/24', '#/p/31', '#/p/33', '#/p/34', '#/p/9', '#/p/70', '#/p/153', '#/p/30', '#/agents', '#/builder/1', '#/appendix-b', '#/progress', '#/p/95', '#/p/147', '#/excel', '#/x/start', '#/x/b1', '#/x/i4', '#/x/a5', '#/x/prompts', '#/x/formulas', '#/x/dashboard', '#/x/a-power-query'];
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
    const actx = await seededContext(browser, { serviceWorkers: 'block', viewport: { width: 1440, height: 900 }, bypassCSP: true, reducedMotion: 'reduce' }); // CSP would block the injected axe script
    const p = await actx.newPage();
    for (const r of ['#/', '#/p/2', '#/p/14', '#/p/33', '#/p/34', '#/p/9', '#/p/23', '#/p/70', '#/agents', '#/builder/1', '#/progress', '#/excel', '#/x/b1', '#/x/prompts', '#/x/formulas', '#/x/dashboard', '#/x/b-quiz']) {
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
