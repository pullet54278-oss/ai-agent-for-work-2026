// โหลดและตรวจฉากหน้าจอจำลอง (content/sims/*.mjs) ตอน build · ฉากผิด = build ล้ม
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const SIM_TARGETS = { chat: ['rail:chat', 'rail:agents'], agents: ['rail:chat', 'rail:agents', 'btn:new-agent'], builder: ['rail:chat', 'rail:agents', 'tab:describe', 'tab:configure', 'tab:try', 'field:name', 'field:desc', 'field:instr', 'btn:create', 'skills:add', 'dialog:file', 'dialog:add', 'try:attach', 'try:input', 'try:send', 'describe:input', 'describe:send', 'knowledge:add', 'cap:web', 'cap:code', 'cap:image', 'btn:share', 'share:me', 'share:people', 'share:org'] };
const ACTS = new Set(['click', 'type']);

export async function loadSims(root, pageExists) {
  const dir = path.join(root, 'content', 'sims');
  const out = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).sort()) {
    const sc = (await import(pathToFileURL(path.join(dir, f)).href)).default;
    const bad = m => { throw new Error(`sim ${f}: ${m}`); };
    if (!sc.id || !sc.title || !sc.init || !Array.isArray(sc.steps) || !sc.steps.length) bad('missing id/title/init/steps');
    if (sc.page !== 'journey' && !pageExists(sc.page)) bad('unknown page ' + sc.page);
    let screen = sc.init.screen, dialog = sc.init.dialog;
    sc.steps.forEach((s, i) => {
      const at = `step ${i + 1}`;
      if (!ACTS.has(s.act)) bad(`${at}: act ${s.act}`);
      if (!s.tip || !/[฀-๿]/.test(s.tip)) bad(`${at}: Thai tip required`);
      if (!(SIM_TARGETS[screen] || []).includes(s.t)) bad(`${at}: target ${s.t} not on screen ${screen}`);
      if (s.t.startsWith('dialog:') && dialog !== 'skill') bad(`${at}: skill dialog not open`);
      if (s.t.startsWith('share:') && dialog !== 'share') bad(`${at}: share dialog not open`);
      if (s.t === 'btn:share' && !s.set) bad(`${at}: btn:share must open the share dialog`);
      if (s.act === 'type' && typeof s.type !== 'string') bad(`${at}: type text required`);
      if (s.t === 'field:name' && s.type.length > 30) bad(`${at}: Agent name > 30`);
      if (s.t === 'field:desc' && s.type.length > 1000) bad(`${at}: description > 1000`);
      if (s.t === 'field:instr' && s.type.length > 8000) bad(`${at}: instructions > 8000`);
      if (s.go) screen = s.go;
      if (s.set && 'dialog' in s.set) dialog = s.set.dialog;
    });
    out.push(sc);
  }
  return out;
}
