// Shared helpers for audit + e2e: static server for dist/ and Playwright loader
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { hashEmail, GATE_SALT, loadAllowed } from '../scripts/lib/gate.mjs';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const DIST = path.join(ROOT, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.css': 'text/css' };

// Apply the "/*" block of dist/_headers (as Netlify would) so tests run under the production CSP
function netlifyHeaders() {
  const f = path.join(DIST, '_headers');
  if (!fs.existsSync(f)) return {};
  const out = {}; let on = false;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (/^\S/.test(line)) { on = line.trim() === '/*'; continue; }
    const m = line.match(/^\s+([\w-]+):\s*(.+)$/);
    if (on && m) out[m[1]] = m[2];
  }
  return out;
}

// Email gate under test: the server swaps the build's gate list for a test list, so the real gate code runs
export const TEST_EMAIL = 'learner@example.com';
export const TEST_GATE = { on: true, salt: GATE_SALT, h: [hashEmail(TEST_EMAIL), hashEmail('second.person@example.org')].sort() };
// init script: mark this device as already signed in (served pages: test email · file://: first real allowed email, if any)
export function gateSeed() {
  const real = loadAllowed(ROOT).emails[0];
  return { script: ({ a, b }) => { try { if (!localStorage.getItem('cpa26-gate')) localStorage.setItem('cpa26-gate', JSON.stringify({ h: location.protocol === 'file:' ? b : a, m: 'le•••r@e•••.com', at: '2026-10-14T00:00:00Z' })); } catch (e) { } }, arg: { a: hashEmail(TEST_EMAIL), b: real ? hashEmail(real) : '' } };
}
export async function seededContext(browser, opts = {}) {
  const ctx = await browser.newContext(opts); const s = gateSeed(); await ctx.addInitScript(s.script, s.arg); return ctx;
}

export function serve(port = 0) {
  const H = netlifyHeaders();
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(DIST, path.normalize(p));
      if (!f.startsWith(DIST)) { r.writeHead(403); r.end(); return; }
      fs.readFile(f, (e, b) => {
        if (e) { r.writeHead(404); r.end('not found'); return; }
        if (path.basename(f) === 'index.html') b = Buffer.from(b.toString('utf8').replace(/(<script type="application\/json" id="gate-cfg">)[\s\S]*?(<\/script>)/, (m, a, c) => a + JSON.stringify(TEST_GATE) + c));
        r.writeHead(200, { ...H, 'content-type': TYPES[path.extname(f)] || (f.endsWith('.webmanifest') ? 'application/manifest+json' : 'application/octet-stream') });
        r.end(b);
      });
    }).listen(port, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

export async function loadPlaywright() {
  const req = createRequire(import.meta.url);
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', '@playwright/test']) {
    try { return req(p); } catch (e) { /* try next */ }
  }
  throw new Error('Playwright not found. Install with: npm i -D playwright && npx playwright install chromium');
}

export async function launch() {
  const pw = await loadPlaywright();
  const opts = {};
  if (fs.existsSync('/opt/pw-browsers/chromium')) {
    // sandboxed CI image: use the preinstalled browser if the bundled one is absent
    try { await pw.chromium.launch().then(b => b.close()); } catch (e) { opts.executablePath = '/opt/pw-browsers/chromium'; }
  }
  return pw.chromium.launch(opts);
}
