// Generate PWA / device icons into assets/icons/ (run locally once; the PNGs are committed).
// Source: assets/app-icon.png (the owner's square app icon) — falls back to assets/logo.png on a white tile.
// Needs ImageMagick (`convert`). Usage: node scripts/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets', 'icons');
const own = ['app-icon.png', 'app-icon.jpg', 'app-icon.jpeg', 'app-icon.webp', 'app-icon.svg'].map(f => path.join(ROOT, 'assets', f)).find(f => fs.existsSync(f));
const src = own || path.join(ROOT, 'assets', 'logo.png');
fs.mkdirSync(OUT, { recursive: true });
const im = args => execFileSync('convert', args, { stdio: 'inherit' });

const BG = '#F4F3F9'; // matches the light glass tile of the owner's icon
// clean faint speckles in the soft glow edge (alpha < ~12%) before scaling
const clean = ['-channel', 'A', '-level', '12%,100%', '+channel'];
// [file, size, content fraction, flatten on BG?]
//  any (Android/desktop): transparent · apple-touch (iOS shows transparency as black): flattened, full bleed
//  maskable: flattened, content inside the 80% safe zone
const sizes = own
  ? [['icon-192.png', 192, 1, false], ['icon-512.png', 512, 1, false], ['favicon-32.png', 32, 1, false], ['apple-touch-icon.png', 180, 1.06, true], ['maskable-512.png', 512, 0.84, true]]
  : [['icon-192.png', 192, 0.86, true], ['icon-512.png', 512, 0.86, true], ['favicon-32.png', 32, 0.96, true], ['apple-touch-icon.png', 180, 0.84, true], ['maskable-512.png', 512, 0.66, true]];
for (const [name, s, fit, flat] of sizes) {
  const inner = Math.round(s * fit);
  const args = [src, ...(own ? clean : []), '-filter', 'Lanczos', '-resize', `${inner}x${inner}`, '-background', flat ? (own ? BG : 'white') : 'none', '-gravity', 'center', '-extent', `${s}x${s}`];
  if (flat) args.push('-alpha', 'remove', '-alpha', 'off');
  im([...args, '-strip', path.join(OUT, name)]);
}
console.log(`icons from ${path.relative(ROOT, src)} → assets/icons/ (${sizes.map(s => s[0]).join(', ')})`);
