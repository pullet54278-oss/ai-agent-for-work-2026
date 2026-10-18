// ทดสอบ Code.gs ใน Node ด้วยบริการ Google จำลอง: node apps-script/test.mjs
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import assert from 'node:assert/strict'

function makeSheet(name) {
  const rows = []
  const sh = {
    name,
    rows,
    getMaxRows: () => Math.max(rows.length, 1000),
    getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => rows[r - 1 + i]?.[c - 1 + j] ?? '')),
      getValue: () => rows[r - 1]?.[c - 1] ?? '',
      setValues: (vals) => vals.forEach((row, i) => { rows[r - 1 + i] ??= []; row.forEach((v, j) => { rows[r - 1 + i][c - 1 + j] = v }) }),
      setValue: (v) => { rows[r - 1] ??= []; rows[r - 1][c - 1] = v },
      setNumberFormat: () => {},
      setFontWeight: () => {},
    }),
    appendRow: (row) => rows.push(row.slice()),
    deleteRow: (n) => rows.splice(n - 1, 1),
    setFrozenRows: () => {},
  }
  return sh
}

function makeEnv({ tokens }) {
  const sheets = {}
  const props = { CLIENT_ID: 'client-123', ALLOWED_EMAILS: 'dad@example.com, Mom@example.com' }
  const cache = {}
  const events = {}
  let evSeq = 0
  const makeEvent = (title, start, opts, allDay) => {
    const id = 'ev' + ++evSeq
    const ev = { id, title, start, opts, allDay, reminders: [], deleted: false,
      getId: () => id, deleteEvent: () => { delete events[id] }, removeAllReminders: () => { ev.reminders = [] },
      addPopupReminder: (m) => ev.reminders.push(m) }
    events[id] = ev
    return ev
  }
  let calTz = 'UTC'
  const cal = { getId: () => 'cal-1', getName: () => 'สมุดสุขภาพครอบครัว', getTimeZone: () => calTz, setTimeZone: (z) => { calTz = z }, getEventById: (id) => events[id] ?? null,
    createEvent: (t, s, e, o) => makeEvent(t, s, o, false), createAllDayEvent: (t, d, o) => makeEvent(t, d, o, true) }
  const ctx = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({
      getSheetByName: (n) => sheets[n] ?? null,
      insertSheet: (n) => (sheets[n] = makeSheet(n)),
      setSpreadsheetTimeZone: () => {},
    }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v } }) },
    UrlFetchApp: { fetch: (url) => {
      const tok = decodeURIComponent(url.split('id_token=')[1])
      const info = tokens[tok]
      return { getResponseCode: () => (info ? 200 : 400), getContentText: () => JSON.stringify(info ?? { error: 'invalid' }) }
    } },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_a, s) => [...createHash('sha256').update(s).digest()],
      base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url'),
      formatDate: (d) => d.toISOString().slice(0, 10),
      parseDate: (s, tz, fmt) => {
        assert.equal(tz, 'Asia/Bangkok')
        const [d, t = '00:00'] = s.split(' ')
        return new Date(`${d}T${t}:00+07:00`)
      },
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    CalendarApp: { getCalendarById: (id) => (id === 'cal-1' ? cal : null), createCalendar: () => cal, Color: { BLUE: 'blue' } },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'dad@example.com' }) },
    ScriptApp: { getProjectTriggers: () => [], deleteTrigger: () => {},
      newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ inTimezone: () => ({ create: () => {} }) }) }) }) }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ text: s, setMimeType() { return this } }) },
  }
  vm.createContext(ctx)
  vm.runInContext(readFileSync(new URL('./Code.gs', import.meta.url), 'utf8') + '\nthis.__api = { doPost, doGet, setup, dailySync }', ctx)
  const call = (body) => JSON.parse(ctx.__api.doPost({ postData: { contents: JSON.stringify(body) } }).text)
  return { api: { ...ctx.__api, calTz: () => calTz }, call, sheets, events, props }
}

const future = Math.floor(Date.now() / 1000) + 3600
const tokens = {
  dad: { aud: 'client-123', email: 'dad@example.com', email_verified: 'true', exp: String(future) },
  mom: { aud: 'client-123', email: 'mom@example.com', email_verified: 'true', exp: String(future) },
  stranger: { aud: 'client-123', email: 'evil@example.com', email_verified: 'true', exp: String(future) },
  otherApp: { aud: 'someone-else', email: 'dad@example.com', email_verified: 'true', exp: String(future) },
  expired: { aud: 'client-123', email: 'dad@example.com', email_verified: 'true', exp: String(Math.floor(Date.now() / 1000) - 10) },
  unverified: { aud: 'client-123', email: 'dad@example.com', email_verified: 'false', exp: String(future) },
}

const { api, call, sheets, events } = makeEnv({ tokens })
let n = 0
const t = (name, fn) => { fn(); n++; console.log('✓', name) }

t('setup creates all tabs with headers', () => {
  assert.equal(api.setup(), 'ok')
  for (const tab of ['people', 'vaccines', 'appointments', 'measurements', 'illnesses', 'expenses', 'school', 'medicines', 'insurance']) {
    assert.ok(sheets[tab], tab)
    assert.equal(sheets[tab].rows[0][0], 'id')
  }
  assert.equal(api.setup(), 'ok', 'setup is idempotent')
})
t('doGet health check', () => assert.match(api.doGet().text, /family-health/))
t('no token is rejected', () => assert.deepEqual(call({ action: 'getAll' }), { ok: false, error: 'unauthenticated' }))
t('unknown token is rejected', () => assert.equal(call({ action: 'getAll', idToken: 'forged' }).error, 'invalid token'))
t('token for another app is rejected', () => assert.equal(call({ action: 'getAll', idToken: 'otherApp' }).error, 'invalid token'))
t('expired token is rejected', () => assert.equal(call({ action: 'getAll', idToken: 'expired' }).error, 'token expired'))
t('unverified email is rejected', () => assert.equal(call({ action: 'getAll', idToken: 'unverified' }).error, 'invalid token'))
t('email not in allowlist is rejected', () => assert.equal(call({ action: 'getAll', idToken: 'stranger' }).error, 'forbidden'))
t('allowlist is case-insensitive', () => assert.equal(call({ action: 'getAll', idToken: 'mom' }).ok, true))

t('upsert inserts then updates the same row', () => {
  const r = call({ action: 'upsert', table: 'people', idToken: 'dad',
    record: { id: 'p1', nickname: 'น้องทดสอบ', relation: 'child', g6pd: true, phone: '0811111111', hacker: 'x' } })
  assert.equal(r.ok, true)
  assert.equal(r.record.updatedBy, 'dad@example.com')
  assert.equal(r.record.g6pd, 'true')
  assert.equal(r.record.hacker, undefined, 'unknown columns are ignored')
  call({ action: 'upsert', table: 'people', idToken: 'mom', record: { id: 'p1', bloodGroup: 'O' } })
  const all = call({ action: 'getAll', idToken: 'dad' }).data.people
  assert.equal(all.length, 1)
  assert.equal(all[0].nickname, 'น้องทดสอบ', 'partial update keeps other fields')
  assert.equal(all[0].bloodGroup, 'O')
  assert.equal(all[0].phone, '0811111111', 'leading zero kept')
  assert.equal(all[0].updatedBy, 'mom@example.com')
})
t('unknown table is rejected', () => assert.equal(call({ action: 'upsert', table: 'secrets', idToken: 'dad', record: { id: 'x' } }).error, 'unknown table'))
t('record without id is rejected', () => assert.equal(call({ action: 'upsert', table: 'people', idToken: 'dad', record: {} }).error, 'missing id'))
t('values starting with = are stored as text, not formulas', () => {
  call({ action: 'upsert', table: 'people', idToken: 'dad', record: { id: 'p2', nickname: '=IMPORTXML("x")' } })
  const row = sheets.people.rows.find((r) => r[0] === 'p2')
  assert.equal(row[1], '\'=IMPORTXML("x")')
})
t('Date cells are returned as YYYY-MM-DD', () => {
  sheets.measurements.rows.push(['m1', 'p1', new Date('2026-10-17T00:00:00Z'), '16.8'])
  const m = call({ action: 'getAll', idToken: 'dad' }).data.measurements[0]
  assert.equal(m.date, '2026-10-17')
})

t('appointment creates an all-day calendar event inviting the other parent', () => {
  const r = call({ action: 'upsert', table: 'appointments', idToken: 'dad',
    record: { id: 'a1', personId: 'p1', type: 'vaccine', title: 'วัคซีนตับอักเสบเอ เข็ม 2', date: '2026-11-02', status: 'pending' } })
  const ev = events[r.record.calendarEventId]
  assert.ok(ev, 'event created')
  assert.equal(ev.title, 'น้องทดสอบ: วัคซีนตับอักเสบเอ เข็ม 2')
  assert.equal(ev.allDay, true)
  assert.equal(ev.opts.guests, 'mom@example.com', 'owner is not invited, the other parent is')
  assert.equal(ev.reminders.length, 2)
})
t('timed appointment creates timed event', () => {
  const r = call({ action: 'upsert', table: 'appointments', idToken: 'mom',
    record: { id: 'a2', personId: 'p1', title: 'หาหมอ', date: '2026-11-05', time: '09:30', status: 'pending' } })
  const ev = events[r.record.calendarEventId]
  assert.equal(ev.allDay, false)
  assert.equal(ev.start.toISOString(), '2026-11-05T02:30:00.000Z', '09:30 Bangkok time')
})
t('marking appointment done removes its event', () => {
  const before = sheets.appointments.rows.find((r) => r[0] === 'a1')
  const evId = before[9]
  call({ action: 'upsert', table: 'appointments', idToken: 'dad', record: { id: 'a1', status: 'done' } })
  assert.equal(events[evId], undefined)
  assert.equal(sheets.appointments.rows.find((r) => r[0] === 'a1')[9], '')
})
t('deleting appointment removes row and event', () => {
  const evId = sheets.appointments.rows.find((r) => r[0] === 'a2')[9]
  assert.equal(call({ action: 'delete', table: 'appointments', id: 'a2', idToken: 'dad' }).ok, true)
  assert.equal(events[evId], undefined)
  assert.equal(sheets.appointments.rows.some((r) => r[0] === 'a2'), false)
})
t('dailySync recreates an event deleted from the calendar', () => {
  const r = call({ action: 'upsert', table: 'appointments', idToken: 'dad',
    record: { id: 'a3', personId: 'p1', title: 'ไข้หวัดใหญ่', date: '2099-05-18', status: 'pending' } })
  delete events[r.record.calendarEventId]
  api.dailySync()
  const newId = sheets.appointments.rows.find((x) => x[0] === 'a3')[9]
  assert.ok(events[newId], 'event recreated')
})
t('setup moves the calendar to Bangkok time and re-invites future appointments', () => {
  const before = sheets.appointments.rows.find((x) => x[0] === 'a3')[9]
  api.setup()
  assert.equal(api.calTz(), 'Asia/Bangkok')
  const after = sheets.appointments.rows.find((x) => x[0] === 'a3')[9]
  assert.notEqual(after, before, 'event recreated')
  assert.equal(events[before], undefined, 'old event removed')
  assert.equal(events[after].opts.guests, 'mom@example.com')
})
console.log(`${n} passed`)
