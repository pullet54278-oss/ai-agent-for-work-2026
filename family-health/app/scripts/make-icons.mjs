// สร้างไอคอน PNG จาก public/icons/favicon.svg (ใช้ Chromium ของ Playwright)
import { readFileSync } from 'node:fs'
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ?? 'playwright')

const svg = readFileSync('public/icons/favicon.svg', 'utf8')
// maskable: ย่อเนื้อหาให้อยู่ใน safe zone 80% โดยพื้นหลังยังเต็มกรอบ
const inner = svg.replace(/^<svg[^>]*>/, '').replace('<rect width="512" height="512" fill="url(#bg)"/>', '').replace(/<\/svg>\s*$/, '')
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#22b8e6"/>
  <g transform="translate(256 256) scale(0.78) translate(-256 -256)">${inner}</g></svg>`
const bgFix = maskable.replace('<g transform', '<rect width="512" height="512" fill="url(#bg)"/><g transform')

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const page = await browser.newPage()
async function render(src, size, out) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${src}`)
  await page.screenshot({ path: out, omitBackground: false })
}
await render(svg, 192, 'public/icons/icon-192.png')
await render(svg, 512, 'public/icons/icon-512.png')
await render(bgFix, 512, 'public/icons/maskable-512.png')
await browser.close()
console.log('icons written')
