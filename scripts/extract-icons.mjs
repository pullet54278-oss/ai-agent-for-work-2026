// One-time helper: copies the Fluent UI System Icons (MIT, © Microsoft) used by the app into src/icons.json.
// Usage: node scripts/extract-icons.mjs <path-to-@fluentui/svg-icons/icons>
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/extract-icons.mjs <icons dir>'); process.exit(1); }
const names = `home search bot sparkle document document_text copy checkmark checkmark_circle circle weather_moon weather_sunny
navigation chevron_right chevron_left chevron_down arrow_right arrow_left people_team calculator lightbulb beaker data_bar_vertical
shield_checkmark attach dismiss play filter book_open apps grid link open globe warning info target_arrow flowchart clipboard_task
chat building_factory money megaphone wrench arrow_trending_lines vehicle_truck box heart_pulse document_bullet_list board slide_text
table arrow_download edit question_circle trophy ribbon star history lock_closed person mail window code rocket toolbox flash timer
layer organization plug_connected cloud branch arrow_sync key tag data_trending chart_multiple document_search folder eye alert keyboard
food_grains cart receipt scales tasks_app arrow_clockwise people_community leaf_two dismiss_circle hat_graduation compass_northwest
text_bullet_list_square shield_task book_question_mark arrow_up chat_multiple settings arrow_upload`.split(/\s+/).filter(Boolean);
const out = {}; const missing = [];
for (const n of names) {
  for (const v of ['24_regular', '24_filled']) {
    const f = path.join(dir, `${n}_${v}.svg`);
    if (fs.existsSync(f)) {
      const svg = fs.readFileSync(f, 'utf8');
      const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/ fill="#212121"/g, '');
      out[v === '24_regular' ? n : n + '_f'] = inner;
    } else if (v === '24_regular') missing.push(n);
  }
}
fs.writeFileSync(new URL('../src/icons.json', import.meta.url), JSON.stringify(out));
console.log('icons:', Object.keys(out).length, 'missing:', missing.join(' ') || 'none');
