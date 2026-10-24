// Scheduled: rebuild the site every day so the embedded update snapshot and build date stay fresh.
// Runs at 23:00 UTC = 06:00 Asia/Bangkok (no DST). Needs a build hook URL in the BUILD_HOOK_URL
// environment variable (Site configuration → Build & deploy → Build hooks), scoped to Functions.
export default async (req) => {
  const { next_run } = await req.json().catch(() => ({}));
  const hook = Netlify.env.get('BUILD_HOOK_URL');
  if (!hook) { console.log('daily-rebuild: BUILD_HOOK_URL not set — skipped. Next run:', next_run); return; }
  const res = await fetch(hook + (hook.includes('?') ? '&' : '?') + 'trigger_title=' + encodeURIComponent('Daily Copilot updates refresh'), { method: 'POST' });
  console.log('daily-rebuild: build hook responded', res.status, '· next run', next_run);
};

export const config = { schedule: '0 23 * * *' };
