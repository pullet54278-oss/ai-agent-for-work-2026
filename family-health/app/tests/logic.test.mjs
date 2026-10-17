// ตรรกะของหน้าจอ: ตรวจยา G-6-PD, ป่วยซ้ำ, ปี/เทอมของค่าใช้จ่าย, นัดวัคซีนเข็มถัดไป: npm run test:logic
import { buildSync } from 'esbuild'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'logic-'))
const src = new URL('../src/', import.meta.url).pathname
writeFileSync(join(dir, 'entry.ts'), `
export { g6pdHits, medList, repeatEpisodes } from '${src}screens/Illnesses'
export { yearOf, nextPeriod } from '${src}screens/Expenses'
export { nextDoseDate } from '${src}data/vaccines'
export { addMonths, isoDate } from '${src}lib/date'
`)
buildSync({ entryPoints: [join(dir, 'entry.ts')], bundle: true, format: 'esm', outfile: join(dir, 'out.mjs'), jsx: 'automatic',
  define: { 'import.meta.env': '{"VITE_API_URL":"mock"}' }, logLevel: 'error' })
const m = await import(join(dir, 'out.mjs'))
let n = 0
const t = (name, fn) => { fn(); n++; console.log('✓', name) }

t('medList splits on newline, comma, semicolon', () =>
  assert.deepEqual(m.medList('amoxicillin\nparacetamol, ibuprofen; '), ['amoxicillin', 'paracetamol', 'ibuprofen']))
t('G6PD avoid and caution drugs are flagged, safe ones are not', () => {
  const hits = m.g6pdHits('Amoxicillin 250mg\nCo-trimoxazole syrup\nparacetamol\nDiphenhydramine')
  assert.deepEqual(hits.map((h) => [h.med, h.item.level]), [['Co-trimoxazole syrup', 'avoid'], ['Diphenhydramine', 'caution']])
})
t('foods are not reported as drug hits', () => assert.equal(m.g6pdHits('ถั่วปากอ้า').length, 0))
t('Thai drug alias is matched', () => assert.equal(m.g6pdHits('แอสไพริน')[0].item.name, 'aspirin'))

const ill = (id, startDate, endDate = '') => ({ id, startDate, endDate, diagnosis: id })
t('repeat illnesses within 14 days are grouped', () => {
  const g = m.repeatEpisodes([ill('flu', '2025-07-14'), ill('tonsil', '2026-02-17'), ill('bronch', '2026-03-02'),
    ill('pneu', '2026-03-05', '2026-03-09'), ill('cold', '2026-06-14')])
  assert.deepEqual(g.map((x) => x.map((i) => i.id)), [['tonsil', 'bronch', 'pneu']])
})
t('gap is measured from the end of an admission', () => {
  const g = m.repeatEpisodes([ill('a', '2026-01-01', '2026-01-20'), ill('b', '2026-02-01')])
  assert.equal(g.length, 1)
})

t('yearOf uses period first, else Buddhist year of date', () => {
  assert.equal(m.yearOf({ period: '2569/2', date: '2027-01-01' }), '2569')
  assert.equal(m.yearOf({ period: '', date: '2026-03-09' }), '2569')
  assert.equal(m.yearOf({ period: '', date: '' }), 'ไม่ระบุ')
})
t('nextPeriod rolls terms and years', () => {
  assert.equal(m.nextPeriod('2569/1'), '2569/2')
  assert.equal(m.nextPeriod('2569/2'), '2570/1')
  assert.equal(m.nextPeriod('2569'), '2570')
})

t('next dose: Qdenga +3 months, hepatitis A +6, flu yearly, none after last dose', () => {
  assert.deepEqual(m.nextDoseDate('DEN', 1, '2026-07-17'), { dose: 2, date: '2026-10-17' })
  assert.deepEqual(m.nextDoseDate('HAV', 1, '2026-01-05'), { dose: 2, date: '2026-07-05' })
  assert.deepEqual(m.nextDoseDate('FLU', 3, '2026-05-05'), { dose: 4, date: '2027-05-05' })
  assert.equal(m.nextDoseDate('DEN', 2, '2026-10-17'), null)
  assert.equal(m.nextDoseDate('DTP', 4, '2023-11-10'), null, 'EPI doses follow the national schedule instead')
})
t('dates stay local (no UTC shift)', () => {
  assert.equal(m.isoDate(new Date(2026, 9, 17, 0, 30)), '2026-10-17')
  assert.equal(m.addMonths('2026-01-31', 1), '2026-02-28', 'clamped to month end')
  assert.equal(m.addMonths('2028-01-31', 1), '2028-02-29', 'leap year')
  assert.equal(m.addMonths('2026-11-15', 3), '2027-02-15', 'crosses year')
  assert.equal(m.addMonths('2026-03-15', -12), '2025-03-15', 'negative')
})
console.log(`${n} passed`)
