/**
 * สมุดสุขภาพครอบครัว — หลังบ้านบน Google Sheet
 *
 * ติดตั้ง: เปิด Google Sheet → ส่วนขยาย → Apps Script → วางไฟล์นี้ → รัน setup()
 * แล้วตั้ง Script properties: CLIENT_ID, ALLOWED_EMAILS (คั่นด้วย ,)
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
 *
 * "Anyone" หมายถึงใครก็เรียก URL ได้ แต่ทุกคำขอต้องแนบ Google ID token
 * ที่ออกให้แอปนี้ (CLIENT_ID) และเป็นอีเมลที่อยู่ใน ALLOWED_EMAILS เท่านั้น
 */

const TABLES = {
  people: ['id', 'nickname', 'fullName', 'relation', 'sex', 'birthDate', 'phone', 'bloodGroup', 'hospital', 'hn',
    'g6pd', 'allergies', 'notes', 'photo'],
  vaccines: ['id', 'personId', 'code', 'name', 'dose', 'date', 'lot', 'place', 'price', 'priceEstimate', 'notes'],
  appointments: ['id', 'personId', 'type', 'title', 'date', 'time', 'place', 'status', 'notes', 'calendarEventId'],
  measurements: ['id', 'personId', 'date', 'weightKg', 'heightCm', 'headCm', 'source', 'notes'],
  illnesses: ['id', 'personId', 'startDate', 'endDate', 'place', 'doctor', 'diagnosis', 'admitted', 'restDays',
    'medications', 'advice', 'cost', 'notes'],
  expenses: ['id', 'personId', 'date', 'category', 'item', 'amount', 'status', 'claim', 'period', 'notes'],
  school: ['id', 'personId', 'academicYear', 'term', 'program', 'subject', 'score', 'maxScore', 'grade', 'comment'],
  medicines: ['id', 'personId', 'name', 'generic', 'strength', 'purpose', 'dose', 'source', 'date', 'expiry', 'amount',
    'qty', 'status', 'notes'],
}
const META = ['createdAt', 'updatedAt', 'updatedBy']
const CALENDAR_NAME = 'สมุดสุขภาพครอบครัว'

// ---------- Web app ----------

function doGet() {
  return json_({ ok: true, app: 'family-health' })
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    const email = verifyToken_(req.idToken)
    return json_(Object.assign({ ok: true }, handle_(req, email)))
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) })
  }
}

function handle_(req, email) {
  switch (req.action) {
    case 'getAll':
      return { data: readAll_(), email: email }
    case 'upsert':
      return { record: withLock_(() => upsert_(req.table, req.record, email)) }
    case 'delete':
      withLock_(() => remove_(req.table, req.id))
      return {}
    default:
      throw new Error('unknown action')
  }
}

// ---------- Auth ----------

function verifyToken_(idToken) {
  if (!idToken) throw new Error('unauthenticated')
  const props = PropertiesService.getScriptProperties()
  const clientId = props.getProperty('CLIENT_ID')
  const allowed = (props.getProperty('ALLOWED_EMAILS') || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(String)
  if (!clientId || allowed.length === 0) throw new Error('server not configured')

  // จำผลตรวจ token ไว้ 10 นาที เพื่อไม่ต้องเรียก Google ทุกคำขอ
  const cache = CacheService.getScriptCache()
  const key = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken))
  let info = cache.get(key) ? JSON.parse(cache.get(key)) : null
  if (!info) {
    const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
      { muteHttpExceptions: true })
    if (res.getResponseCode() !== 200) throw new Error('invalid token')
    info = JSON.parse(res.getContentText())
  }
  if (info.aud !== clientId) throw new Error('invalid token')
  if (String(info.email_verified) !== 'true') throw new Error('invalid token')
  if (Number(info.exp) * 1000 < Date.now()) throw new Error('token expired')
  const email = String(info.email || '').toLowerCase()
  if (allowed.indexOf(email) < 0) throw new Error('forbidden')
  cache.put(key, JSON.stringify(info), 600)
  return email
}

// ---------- Data ----------

function sheet_(table) {
  if (!Object.prototype.hasOwnProperty.call(TABLES, table)) throw new Error('unknown table')
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table)
  if (!sh) throw new Error('missing sheet ' + table + ' (run setup)')
  return sh
}

function headers_(table) {
  return TABLES[table].concat(META)
}

/** ค่าในเซลล์ → ข้อความ (วันที่เป็น YYYY-MM-DD) ให้ฝั่งแอปแปลงชนิดเอง */
function cell_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, 'Asia/Bangkok', 'yyyy-MM-dd')
  if (v === null || v === undefined) return ''
  return String(v)
}

function readTable_(table) {
  const sh = sheet_(table)
  const values = sh.getDataRange().getValues()
  const head = values.shift() || []
  return values
    .filter((row) => row[0] !== '' && row[0] !== null)
    .map((row) => {
      const o = {}
      head.forEach((h, i) => { if (h) o[h] = cell_(row[i]) })
      return o
    })
}

function readAll_() {
  const out = {}
  Object.keys(TABLES).forEach((t) => { out[t] = readTable_(t) })
  return out
}

function findRow_(sh, id) {
  const ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues()
  for (let i = 1; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 1
  return -1
}

function upsert_(table, record, email) {
  if (!record || !record.id) throw new Error('missing id')
  const sh = sheet_(table)
  const head = headers_(table)
  const rowNo = findRow_(sh, record.id)
  const now = new Date().toISOString()
  let current = {}
  if (rowNo > 0) {
    const row = sh.getRange(rowNo, 1, 1, head.length).getValues()[0]
    head.forEach((h, i) => { current[h] = cell_(row[i]) })
  }
  const next = Object.assign({}, current)
  TABLES[table].forEach((k) => { if (k in record) next[k] = record[k] === null ? '' : String(record[k]) })
  next.createdAt = current.createdAt || now
  next.updatedAt = now
  next.updatedBy = email

  if (table === 'appointments') next.calendarEventId = syncEvent_(next) || ''

  // ข้อความที่ขึ้นต้นด้วย = จะกลายเป็นสูตรใน Sheet จึงใส่ ' นำหน้าให้เก็บเป็นข้อความ
  const row = head.map((h) => {
    const v = next[h] === undefined ? '' : next[h]
    return typeof v === 'string' && v.charAt(0) === '=' ? "'" + v : v
  })
  if (rowNo > 0) sh.getRange(rowNo, 1, 1, head.length).setValues([row])
  else sh.appendRow(row)
  return next
}

function remove_(table, id) {
  const sh = sheet_(table)
  const rowNo = findRow_(sh, id)
  if (rowNo < 0) return
  if (table === 'appointments') {
    const evId = sh.getRange(rowNo, headers_(table).indexOf('calendarEventId') + 1).getValue()
    deleteEvent_(evId)
  }
  sh.deleteRow(rowNo)
}

function withLock_(fn) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    return fn()
  } finally {
    lock.releaseLock()
  }
}

// ---------- Google Calendar ----------

function calendar_() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('CALENDAR_ID')
  let cal = id ? CalendarApp.getCalendarById(id) : null
  if (!cal) {
    cal = CalendarApp.createCalendar(CALENDAR_NAME, { color: CalendarApp.Color.BLUE })
    props.setProperty('CALENDAR_ID', cal.getId())
  }
  return cal
}

function guests_() {
  const owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase()
  return (PropertiesService.getScriptProperties().getProperty('ALLOWED_EMAILS') || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter((s) => s && s !== owner)
}

function personName_(personId) {
  const p = readTable_('people').filter((x) => x.id === personId)[0]
  return p ? (p.nickname || p.fullName) : ''
}

/** สร้าง/แก้นัดในปฏิทิน (คืน eventId) · นัดที่เสร็จหรือยกเลิกแล้วจะถูกลบออกจากปฏิทิน */
function syncEvent_(a) {
  if (!a.date || a.status === 'done' || a.status === 'cancelled') {
    deleteEvent_(a.calendarEventId)
    return ''
  }
  const cal = calendar_()
  const who = personName_(a.personId)
  const title = (who ? who + ': ' : '') + a.title
  const parts = a.date.split('-').map(Number)
  const day = new Date(parts[0], parts[1] - 1, parts[2])
  let ev = a.calendarEventId ? cal.getEventById(a.calendarEventId) : null
  if (ev) ev.deleteEvent()
  const opts = { description: [a.place, a.notes].filter(String).join('\n'), location: a.place || '', sendInvites: true,
    guests: guests_().join(',') }
  if (a.time) {
    const t = a.time.split(':').map(Number)
    const start = new Date(parts[0], parts[1] - 1, parts[2], t[0], t[1] || 0)
    ev = cal.createEvent(title, start, new Date(start.getTime() + 60 * 60 * 1000), opts)
    ev.removeAllReminders()
    ev.addPopupReminder(24 * 60)
    ev.addPopupReminder(120)
  } else {
    ev = cal.createAllDayEvent(title, day, opts)
    ev.removeAllReminders()
    ev.addPopupReminder((6 * 24 + 17) * 60) // 7 วันก่อน 07:00
    ev.addPopupReminder(17 * 60) // 1 วันก่อน 07:00
  }
  return ev.getId()
}

function deleteEvent_(eventId) {
  if (!eventId) return
  try {
    const ev = calendar_().getEventById(eventId)
    if (ev) ev.deleteEvent()
  } catch (e) {
    // นัดถูกลบจากปฏิทินไปแล้ว
  }
}

/** รันทุกเช้า: ตรวจว่านัดที่ยังไม่ถึงทุกนัดมีอยู่ในปฏิทิน (กรณีถูกลบเองหรือแก้ใน Sheet ตรง ๆ) */
function dailySync() {
  withLock_(() => {
    const sh = sheet_('appointments')
    const head = headers_('appointments')
    const today = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd')
    const cal = calendar_()
    readTable_('appointments').forEach((a) => {
      if (a.date < today || a.status === 'done' || a.status === 'cancelled') return
      if (a.calendarEventId && cal.getEventById(a.calendarEventId)) return
      const rowNo = findRow_(sh, a.id)
      a.calendarEventId = ''
      const id = syncEvent_(a)
      sh.getRange(rowNo, head.indexOf('calendarEventId') + 1).setValue(id)
    })
  })
}

// ---------- ติดตั้ง ----------

/** สร้างแท็บและหัวตารางที่ยังไม่มี, ตั้งทุกเซลล์เป็นข้อความ, ตั้ง trigger ทุกเช้า (รันซ้ำได้) */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ss.setSpreadsheetTimeZone('Asia/Bangkok')
  Object.keys(TABLES).forEach((t) => {
    let sh = ss.getSheetByName(t)
    if (!sh) sh = ss.insertSheet(t)
    const head = headers_(t)
    const existing = sh.getRange(1, 1, 1, head.length).getValues()[0]
    if (existing.join('') === '') sh.getRange(1, 1, 1, head.length).setValues([head])
    else if (existing.join('|') !== head.join('|')) throw new Error('หัวตารางแท็บ ' + t + ' ไม่ตรงกับที่แอปต้องการ')
    sh.getRange(1, 1, sh.getMaxRows(), head.length).setNumberFormat('@')
    sh.setFrozenRows(1)
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold')
  })
  ScriptApp.getProjectTriggers()
    .filter((tr) => tr.getHandlerFunction() === 'dailySync')
    .forEach((tr) => ScriptApp.deleteTrigger(tr))
  ScriptApp.newTrigger('dailySync').timeBased().everyDays(1).atHour(6).inTimezone('Asia/Bangkok').create()
  calendar_()
  return 'ok'
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
