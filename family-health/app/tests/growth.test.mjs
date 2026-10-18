// ตรวจการคำนวณ z-score กับค่าอ้างอิงที่ตีพิมพ์ของ WHO: npm run test:growth
import { buildSync } from 'esbuild'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
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
// เกินช่วงของดัชนี → ไม่มีข้อมูล (น้ำหนักตามอายุถึง 10 ปี, น้ำหนักตามส่วนสูงถึง 5 ปี)
assert.equal(g.lmsFor('wfa', 1, 121.5), null); n++
assert.equal(g.lmsFor('wfh', 1, 61, 110), null); n++
// ต่อจาก 2006 ไป 2007 ที่ 60 เดือนแบบไม่กระโดด (ค่ากลางส่วนสูงชายต่างกันไม่ถึง 0.5 ซม.)
near(g.lmsFor('hfa', 1, 60.01)[1], g.lmsFor('hfa', 1, 60)[1], 0.5, 'HFA continuity at 5y')
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

// อายุ 5–19 ปี: เทียบกับ z-score ที่ WHO คำนวณไว้ในชุดข้อมูลตัวอย่างของ anthroplus (ปัดทศนิยม 2 ตำแหน่ง)
const cases = JSON.parse(readFileSync(new URL('./who2007-cases.json', import.meta.url), 'utf8'))
for (const c of cases) {
  const z = (ind, x, wb) => { const lms = g.lmsFor(ind, c.sex, c.age); return lms ? g.zScore(x, lms, wb) : null }
  const check = (got, want, ind) => {
    if (want == null) { assert.equal(got, null, `${ind} should be outside range at ${c.age}m`); n++; return }
    near(got, want, 0.006, `${ind} sex ${c.sex} age ${c.age}`)
  }
  check(z('hfa', c.h, false), c.zhfa, 'hfa')
  check(c.age >= 60 && c.age <= 120 ? z('wfa', c.w, true) : null, c.zwfa, 'wfa')
  check(z('bfa', g.bmi(c.w, c.h), true), c.zbfa, 'bfa')
}
// หลัง 5 ปี: ไม่ใช้น้ำหนักตามส่วนสูงแล้ว ใช้ BMI ตามอายุแทน
assert.deepEqual(g.assess(1, 72, 20, 116).map((x) => x.indicator), ['wfa', 'hfa', 'bfa']); n++
assert.deepEqual(g.assess(1, 150, 40, 145).map((x) => x.indicator), ['hfa', 'bfa'], 'no WFA after 10 years'); n++
assert.equal(g.classify('bfa', 1.2).label, 'น้ำหนักเกิน'); n++
// อัตราการเพิ่มส่วนสูง: 6 ซม. ใน 1 ปี
const v = g.heightVelocity([{ date: '2025-05-01', heightCm: 100 }, { date: '2025-11-01', heightCm: 103 }, { date: '2026-05-01', heightCm: 106 }])
near(v.cmPerYear, 6, 0.05, 'height velocity'); assert.equal(v.from, '2025-05-01'); n++
assert.equal(g.heightVelocity([{ date: '2026-01-01', heightCm: 100 }, { date: '2026-03-01', heightCm: 101 }]), null, 'needs ≥ 6 months'); n++
console.log(`${n} passed`)
