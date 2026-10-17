// ทดสอบทั้งระบบกับหลังบ้านจำลอง (VITE_API_URL=mock): npm run test:e2e
import { mkdirSync } from 'node:fs'
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ?? 'playwright')

const S = 'test-results/'
mkdirSync(S, { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 400, height: 820 }, serviceWorkers: 'block' })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('dialog', (d) => d.accept())
let step = ''
const s = (name) => { step = name }

async function addPerson(rel, nick, full, birth, phone, g6pd) {
  await p.getByRole('button', { name: '+ เพิ่มโปรไฟล์' }).click()
  await p.locator('select.in').first().selectOption(rel)
  await p.getByLabel('ชื่อเล่น / ชื่อเรียก').fill(nick)
  await p.getByLabel('ชื่อ-นามสกุล').fill(full)
  if (birth) await p.getByLabel('วันเกิด').fill(birth)
  if (phone) await p.getByLabel('เบอร์โทร (แสดงในบัตรฉุกเฉิน)').fill(phone)
  if (g6pd) await p.getByLabel('มีภาวะพร่องเอนไซม์ G-6-PD').check()
  await p.getByRole('button', { name: 'บันทึก', exact: true }).click()
  await p.locator('.list-item b', { hasText: nick }).first().waitFor()
}

try {
  s('login as dad')
  await p.goto('http://127.0.0.1:4173/')
  await p.getByRole('button', { name: 'ทดสอบ: พ่อ' }).click()
  await p.getByText('เริ่มต้นใช้งาน').waitFor()

  s('add profiles')
  await p.getByRole('button', { name: 'เพิ่มโปรไฟล์' }).click()
  await addPerson('child', 'น้องทดสอบ', 'เด็กชายทดสอบ ระบบ', '2022-05-10', '', true)
  await addPerson('father', 'พ่อทดสอบ', 'นายทดสอบ ระบบ', '', '0811111111', false)
  await p.getByRole('button', { name: /หน้าหลัก/ }).click()
  await p.getByText('มีภาวะพร่องเอนไซม์ G-6-PD').waitFor()
  await p.getByText(/วัคซีนตามแผนงานที่ยังไม่มีบันทึก/).waitFor()

  s('record EPI vaccine from schedule row')
  await p.getByRole('button', { name: /วัคซีน/ }).first().click()
  await p.locator('.vrow', { hasText: 'วัณโรค (BCG)' }).click()
  await p.getByLabel('วันที่ฉีด').fill('2022-05-11')
  await p.getByLabel('สถานที่').fill('รพ.ทดสอบ')
  await p.getByRole('button', { name: 'บันทึก', exact: true }).click()
  await p.locator('.vrow', { hasText: 'วัณโรค (BCG)' }).locator('.pill.ok').waitFor()

  s('record optional vaccine and auto-create next appointment')
  await p.getByRole('button', { name: '+ บันทึกการฉีดวัคซีน' }).click()
  await p.getByLabel('วัคซีน').selectOption('DEN')
  await p.getByLabel('วันที่ฉีด').fill('2026-09-01')
  await p.getByLabel('ราคา (บาท)').fill('2500')
  await p.getByText(/สร้างนัดไข้เลือดออก \(Qdenga\) เข็มที่ 2/).waitFor()
  await p.screenshot({ path: S + 'v1-form.png' })
  await p.getByRole('button', { name: 'บันทึก', exact: true }).click()
  await p.locator('.vrow', { hasText: 'ไข้เลือดออก (Qdenga) เข็มที่ 1' }).waitFor()
  await p.getByText('2,500').first().waitFor()
  // นัดเข็ม 2 = 3 เดือนหลัง 1 ก.ย. 69 → 1 ธ.ค. 69
  await p.getByText('ไข้เลือดออก (Qdenga) เข็มที่ 2').first().waitFor()
  await p.screenshot({ path: S + 'v2-vaccines.png', fullPage: true })

  s('appointment on home, mark done')
  await p.getByRole('button', { name: /หน้าหลัก/ }).click()
  await p.getByText('ไข้เลือดออก (Qdenga) เข็มที่ 2').click()
  await p.screenshot({ path: S + 'v3-appt.png' })
  await p.getByRole('button', { name: '✓ ไปตามนัดแล้ว' }).click()
  await p.getByText('ยังไม่มีนัด').waitFor()

  s('G6PD checker and emergency card')
  await p.getByRole('button', { name: /G6PD/ }).first().click()
  await p.getByText('📞 พ่อ พ่อทดสอบ').waitFor()
  await p.getByLabel('ปิด').click()

  s('data survives reload')
  await p.reload()
  await p.getByText('มีภาวะพร่องเอนไซม์ G-6-PD').waitFor()

  s('second parent sees the same data')
  await p.getByRole('button', { name: /เพิ่มเติม/ }).click()
  await p.getByRole('button', { name: /ออกจากระบบ/ }).click()
  await p.getByRole('button', { name: 'ทดสอบ: แม่' }).click()
  await p.getByText('มีภาวะพร่องเอนไซม์ G-6-PD').waitFor()
  await p.getByRole('button', { name: /วัคซีน/ }).first().click()
  await p.locator('.vrow', { hasText: 'วัณโรค (BCG)' }).locator('.pill.ok').waitFor()

  s('stranger is refused')
  await p.getByRole('button', { name: /เพิ่มเติม/ }).click()
  await p.getByRole('button', { name: /ออกจากระบบ/ }).click()
  await p.getByRole('button', { name: 'ทดสอบ: คนนอก' }).click()
  await p.getByText(/ไม่มีสิทธิ์ใช้แอป/).waitFor()
  if (await p.getByText('เด็กชายทดสอบ ระบบ').count()) throw new Error('stranger can see data')
  await p.screenshot({ path: S + 'v4-stranger.png' })
  console.log('E2E OK')
} catch (e) {
  console.log('E2E FAIL at:', step, '-', e.message.slice(0, 300))
  await p.screenshot({ path: S + 'fail.png' })
  process.exitCode = 1
}
console.log('page errors:', errs)
if (errs.length) process.exitCode = 1
await b.close()
