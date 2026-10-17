// ตรวจการคำนวณ z-score กับค่าอ้างอิงที่ตีพิมพ์ของ WHO: npm run test:growth
import { buildSync } from 'esbuild'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const out = join(mkdtempSync(join(tmpdir(), 'growth-')), 'growth.mjs')
buildSync({ entryPoints: [new URL('../src/lib/growth.ts', import.meta.url).pathname], bundle: true, format: 'esm', outfile: out })
const g = await import(out)

let n = 0
const near = (a, b, tol, msg) => { assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a.toFixed(3)} vs ${b}`); n++ }

// ตาราง z-score ของ WHO (ชาย): น้ำหนักตามอายุ 12 เดือน median 9.6, −2SD 7.7, +2SD 12.0
const wfa12 = g.lmsFor('wfa', 1, 12)
near(g.zScore(9.6, wfa12, true), 0, 0.05, 'boys WFA 12m median')
near(g.zScore(7.7, wfa12, true), -2, 0.06, 'boys WFA 12m -2SD')
near(g.zScore(12.0, wfa12, true), 2, 0.06, 'boys WFA 12m +2SD')
// ส่วนสูงตามอายุ ชาย 48 เดือน median 103.3
near(g.zScore(103.3, g.lmsFor('hfa', 1, 48), false), 0, 0.05, 'boys HFA 48m median')
// หญิง น้ำหนักตามอายุ 24 เดือน median 11.5
near(g.zScore(11.5, g.lmsFor('wfa', 2, 24), true), 0, 0.05, 'girls WFA 24m median')
// น้ำหนักตามส่วนสูง ชาย 100 ซม. median 15.4 (ใช้ตารางส่วนสูงเมื่ออายุ ≥ 24 เดือน)
near(g.zScore(15.4, g.lmsFor('wfh', 1, 36, 100), true), 0, 0.05, 'boys WFH 100cm median')
// อายุ < 24 เดือนใช้ตารางความยาว (คนละค่ากับตารางส่วนสูง)
assert.notDeepEqual(g.lmsFor('wfh', 1, 12, 80), g.lmsFor('wfh', 1, 30, 80)); n++
// valueAtZ เป็นตัวผกผันของ zScore
const l = g.lmsFor('wfa', 1, 30)
near(g.zScore(g.valueAtZ(l, 1.5), l, true), 1.5, 1e-9, 'valueAtZ inverse')
// นอกช่วง ±3 SD ใช้การปรับของ WHO: ห่างจาก +3SD เท่ากับช่วง 2→3 SD คือ z = 4
const sd3 = g.valueAtZ(l, 3), sd2 = g.valueAtZ(l, 2)
near(g.zScore(sd3 + (sd3 - sd2), l, true), 4, 1e-9, 'WHO restricted z above +3SD')
// เกินช่วง 0–5 ปี → ไม่มีข้อมูล
assert.equal(g.lmsFor('wfa', 1, 61), null); n++
// การแปลผล
assert.equal(g.classify('wfh', 0).label, 'สมส่วน'); n++
assert.equal(g.classify('wfh', 1.6).label, 'ท้วม'); n++
assert.equal(g.classify('wfh', 3.2).label, 'อ้วน'); n++
assert.equal(g.classify('wfa', -1.7).label, 'น้ำหนักค่อนข้างน้อย'); n++
assert.equal(g.classify('hfa', -2.5).label, 'เตี้ย'); n++
assert.equal(g.classify('wfa', -1.5).label, 'น้ำหนักตามเกณฑ์', 'boundary belongs to upper band'); n++
// assess รวมทุกดัชนี
const a = g.assess(1, 48, 16.3, 103.3)
assert.deepEqual(a.map((x) => x.indicator), ['wfa', 'hfa', 'wfh']); n++
assert.ok(a.every((x) => x.band.tone === 'ok')); n++
console.log(`${n} passed`)
