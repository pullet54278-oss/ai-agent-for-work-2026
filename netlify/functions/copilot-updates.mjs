// Live Microsoft Copilot updates for the homepage: GET /api/copilot-updates
// Fetches the official Microsoft 365 Roadmap RSS, keeps Copilot items, and lets the Netlify CDN
// cache the JSON for 6 hours (stale-while-revalidate 1 day), so the feed refreshes automatically.
import { fetchUpdates } from '../../scripts/lib/updates.mjs';

export default async () => {
  try {
    const data = await fetchUpdates({ timeoutMs: 12000, limit: 60 });
    return Response.json({ ...data, live: true }, {
      headers: {
        'Cache-Control': 'public, max-age=900',
        'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=21600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (e) {
    return Response.json({ error: 'feed_unavailable', detail: String(e.message || e) }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
};

export const config = { path: '/api/copilot-updates', method: 'GET' };
