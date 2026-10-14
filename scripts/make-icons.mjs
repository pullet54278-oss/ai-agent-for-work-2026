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

// "any" icons: the full image; when only the wide logo exists, centre it on a white tile
// maskable: content kept inside the 80% safe zone on a white background
const sizes = [['icon-192.png', 192, 0.86], ['icon-512.png', 512, 0.86], ['apple-touch-icon.png', 180, 0.84], ['favicon-32.png', 32, 0.96], ['maskable-512.png', 512, 0.66]];
for (const [name, s, fit] of sizes) {
  const inner = Math.round(s * (own && !name.startsWith('maskable') ? 1 : fit));
  im([src, '-background', 'white', '-alpha', 'remove', '-resize', `${inner}x${inner}`, '-gravity', 'center', '-extent', `${s}x${s}`, '-strip', path.join(OUT, name)]);
}
console.log(`icons from ${path.relative(ROOT, src)} → assets/icons/ (${sizes.map(s => s[0]).join(', ')})`);
