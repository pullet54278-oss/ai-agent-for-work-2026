// Microsoft Copilot updates — parse the official Microsoft 365 Roadmap RSS and keep Copilot items.
// Shared by scripts/fetch-updates.mjs (build-time snapshot) and netlify/functions/copilot-updates.mjs (live API).
export const ROADMAP_RSS = 'https://www.microsoft.com/releasecommunications/api/v2/m365/rss';
export const ROADMAP_ITEM = id => `https://www.microsoft.com/microsoft-365/roadmap?id=${id}`;

const decode = s => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => decode(s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const tag = (x, name) => (x.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1] || '';

const STATUS = { 'In development': 'กำลังพัฒนา', 'Rolling out': 'กำลังทยอยเปิดใช้', 'Launched': 'เปิดใช้แล้ว' };
const RELEASE = ['General Availability', 'Preview', 'Targeted Release'];
// Thai topic buckets, in priority order (Agent first)
export const TOPICS = [
  { k: 'agent', th: 'Copilot Agent', re: /\bagents?\b|copilot studio|agent builder|agentic|\bMCP\b/i },
  { k: 'office', th: 'Excel · Word · PowerPoint', re: /\b(excel|word|powerpoint|onenote|loop)\b/i },
  { k: 'teams', th: 'Teams · Outlook', re: /\b(teams|outlook)\b/i },
  { k: 'browser', th: 'เบราว์เซอร์ · SharePoint', re: /\b(edge|sharepoint|onedrive|browser|bing)\b/i },
  { k: 'admin', th: 'ความปลอดภัยและการดูแลระบบ', re: /\b(purview|admin|security|compliance|dlp|governance|entra|intune|defender)\b/i }
];

export function parseRoadmap(xml, { limit = 80 } = {}) {
  const items = [];
  for (const m of String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const x = m[1];
    const title = strip(tag(x, 'title'));
    const desc = strip(tag(x, 'description'));
    if (!/copilot/i.test(title + ' ' + desc)) continue;
    const cats = [...x.matchAll(/<category>([\s\S]*?)<\/category>/g)].map(c => strip(c[1]));
    const id = strip(tag(x, 'guid'));
    const updated = strip(tag(x, 'a10:updated')) || new Date(strip(tag(x, 'pubDate'))).toISOString();
    const ga = (desc.match(/GA date:\s*([^\n]+)/) || [])[1] || '';
    const preview = (desc.match(/Preview date:\s*([^\n]+)/) || [])[1] || '';
    const summary = desc.replace(/(GA|Preview) date:[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    const status = cats.find(c => STATUS[c]) || '';
    const hay = title + ' ' + cats.join(' ') + ' ' + summary;
    const topic = (TOPICS.find(t => t.re.test(title)) || TOPICS.find(t => t.re.test(hay)) || { k: 'general' }).k;
    const products = cats.filter(c => !STATUS[c] && !RELEASE.includes(c) && !/Worldwide|GCC|DoD|Web|Desktop|Android|iOS|Mac|Linux|Education|Government/.test(c));
    items.push({ id, title, summary: summary.length > 420 ? summary.slice(0, 417).replace(/\s+\S*$/, '') + '…' : summary, url: ROADMAP_ITEM(id), updated, status, statusTh: STATUS[status] || '', ga, preview, topic, products: products.slice(0, 4), agent: /\bagents?\b|copilot studio|agent builder/i.test(hay) });
  }
  items.sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || (b.agent - a.agent));
  return items.slice(0, limit);
}

export async function fetchUpdates({ timeoutMs = 15000, limit = 80 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(ROADMAP_RSS, { signal: ctl.signal, headers: { 'user-agent': 'copilot-ai-agents-for-work/3 (+learning site)', accept: 'application/rss+xml, text/xml' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = await res.text();
    const items = parseRoadmap(xml, { limit });
    if (!items.length) throw new Error('no Copilot items in feed');
    const lastBuild = strip(tag(xml, 'lastBuildDate'));
    return { fetchedAt: new Date().toISOString(), feedUpdated: lastBuild ? new Date(lastBuild.replace(/ Z$/, ' GMT')).toISOString() : null, source: { name: 'Microsoft 365 Roadmap', url: 'https://www.microsoft.com/microsoft-365/roadmap?filters=Microsoft%20Copilot', rss: ROADMAP_RSS }, items };
  } finally { clearTimeout(t); }
}
