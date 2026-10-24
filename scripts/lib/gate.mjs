// Email access gate — shared by the build and the tests.
// Allowed emails are NEVER written to dist/ in plain text: the build ships only salted SHA-256 hashes.
// Sources (all are merged):
//   1. env ALLOWED_EMAILS  (comma / newline / space separated — for Netlify Git deploys)
//   2. private/*.txt|*.csv|*.xlsx|*.json  (gitignored folder — for local builds)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

export const GATE_SALT = 'cpa26-gate-v1|';
export const normEmail = s => String(s || '').trim().toLowerCase();
export const EMAIL_RE = /[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
export const hashEmail = e => crypto.createHash('sha256').update(GATE_SALT + normEmail(e)).digest('hex');

export function loadAllowed(root) {
  const found = [];
  const src = [];
  if (process.env.ALLOWED_EMAILS) { found.push(...(process.env.ALLOWED_EMAILS.match(EMAIL_RE) || [])); src.push('env ALLOWED_EMAILS'); }
  const dir = path.join(root, 'private');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).sort()) {
      if (/^readme/i.test(f)) continue;
      const p = path.join(dir, f); const ext = path.extname(f).toLowerCase();
      let text = '';
      if (['.txt', '.csv', '.tsv', '.json', '.md'].includes(ext)) text = fs.readFileSync(p, 'utf8');
      else if (['.xlsx', '.xls'].includes(ext)) {
        // vendored SheetJS is a browser build: evaluate it in a sandbox to get the XLSX global
        const sb = {}; sb.self = sb; sb.window = sb; vm.createContext(sb);
        vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'vendor', 'xlsx.full.min.js'), 'utf8'), sb);
        const XLSX = sb.XLSX;
        const wb = XLSX.read(fs.readFileSync(p), { type: 'buffer' });
        text = wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n');
      } else continue;
      const m = text.match(EMAIL_RE) || [];
      if (m.length) { found.push(...m); src.push('private/' + f); }
    }
  }
  const emails = [...new Set(found.map(normEmail))];
  return { emails, sources: src };
}
