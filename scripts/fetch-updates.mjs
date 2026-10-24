// Build step: refresh data/copilot-updates.json from the official Microsoft 365 Roadmap RSS.
// Never fails the build — on any network/parse error the previous snapshot is kept.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/source.mjs';
import { fetchUpdates } from './lib/updates.mjs';

const FILE = path.join(ROOT, 'data', 'copilot-updates.json');
if (process.env.SKIP_UPDATES === '1') { console.log('updates: skipped (SKIP_UPDATES=1)'); process.exit(0); }
try {
  const data = await fetchUpdates();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 1));
  console.log(`updates: ${data.items.length} Copilot items from ${data.source.name} (feed ${data.feedUpdated})`);
} catch (e) {
  const prev = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;
  console.log(`updates: fetch failed (${e.cause?.code || e.message}) — keeping snapshot from ${prev ? prev.fetchedAt : 'none'}`);
}
