# ติดตั้งสมุดสุขภาพครอบครัว (ทำครั้งเดียว ประมาณ 30 นาที)

ทำบนคอมพิวเตอร์ ด้วยบัญชี Google ที่เป็นเจ้าของ Google Sheet ข้อมูล

```
มือถือพ่อ/แม่ (แอปบน Netlify) ──Google ID token──▶ Apps Script Web App ──▶ Google Sheet
                                                     └─ ทุกเช้า 06:00 ──▶ Google Calendar (เตือนนัด)
```

## 1. เปิด Google Sheet ข้อมูล
ใช้ Sheet ที่มีแท็บ `people, vaccines, appointments, measurements, illnesses, expenses, school`
(ถ้ายังไม่มี ให้สร้าง Google Sheet เปล่า — ขั้นที่ 4 จะสร้างแท็บให้เอง)

## 2. ใส่สคริปต์หลังบ้าน
1. ใน Sheet: **ส่วนขยาย (Extensions) → Apps Script**
2. ลบโค้ดเดิมในไฟล์ `Code.gs` ทั้งหมด แล้ววางโค้ดจาก [`family-health/apps-script/Code.gs`](../apps-script/Code.gs) → กด 💾 บันทึก
3. ตั้งชื่อโปรเจกต์ เช่น `สมุดสุขภาพ API`

## 3. สร้าง OAuth Client ID (ให้ปุ่ม "Sign in with Google" ทำงาน)
1. เปิด https://console.cloud.google.com → แถบบน **เลือกโปรเจกต์ → New project** ตั้งชื่อ `family-health` → Create
2. **APIs & Services → OAuth consent screen** (หรือ **Google Auth Platform → Branding**)
   - User type: **External** · App name: `สมุดสุขภาพครอบครัว` · ใส่อีเมลติดต่อ → Save
   - **Audience → Test users → Add users**: ใส่อีเมล Google ของพ่อและแม่
3. **Credentials (Clients) → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://<ชื่อเว็บ>.netlify.app` (จากขั้นที่ 6 — เพิ่มทีหลังได้) และ `http://localhost:5173`
   - Create → คัดลอก **Client ID** (ลงท้ายด้วย `.apps.googleusercontent.com`)

## 4. ตั้งค่าสคริปต์และรันครั้งแรก
1. ใน Apps Script: **⚙️ Project Settings → Script properties → Add script property**
   - `CLIENT_ID` = Client ID จากขั้นที่ 3
   - `ALLOWED_EMAILS` = อีเมลพ่อ,อีเมลแม่ (คั่นด้วยจุลภาค เช่น `a@gmail.com,b@gmail.com`)
2. กลับไปหน้าโค้ด เลือกฟังก์ชัน **`setup`** ที่แถบบน → **Run**
3. Google จะขอสิทธิ์ → เลือกบัญชี → ถ้าขึ้น "Google hasn't verified this app" กด **Advanced → Go to … (unsafe)** → **Allow**
   (เป็นสคริปต์ของคุณเอง สิทธิ์ที่ขอคือ Sheet นี้, สร้างนัดใน Calendar และตรวจ token กับ Google)
4. รันเสร็จจะได้: แท็บและหัวตารางครบ · ปฏิทินชื่อ **สมุดสุขภาพครอบครัว** ใน Google Calendar · ตั้งเวลาซิงก์ทุกเช้า 06:00

## 5. เผยแพร่เป็น Web App
1. **Deploy → New deployment → ⚙️ → Web app**
2. Execute as: **Me** · Who has access: **Anyone**
   ("Anyone" แค่ทำให้แอปเรียกได้ — ทุกคำขอต้องมี Google token ของอีเมลใน `ALLOWED_EMAILS` เท่านั้น คนอื่นจะได้ `forbidden`)
3. Deploy → คัดลอก **Web app URL** (ลงท้ายด้วย `/exec`)
4. ทดสอบ: เปิด URL ในเบราว์เซอร์ ต้องเห็น `{"ok":true,"app":"family-health"}`

**แก้สคริปต์ภายหลัง:** Deploy → **Manage deployments → ✏️ → Version: New version → Deploy** (URL เดิม ไม่ต้องแก้แอป)

## 6. เผยแพร่แอปบน Netlify
1. https://app.netlify.com → **Add new site → Import an existing project → GitHub** → เลือก repo นี้
2. **Base directory:** `family-health/app` (คำสั่ง build อ่านจาก `netlify.toml`)
3. **Environment variables:**
   | ชื่อ | ค่า |
   |---|---|
   | `VITE_GOOGLE_CLIENT_ID` | Client ID จากขั้นที่ 3 |
   | `VITE_API_URL` | Web app URL จากขั้นที่ 5 |
   | `VITE_SHEET_URL` | ลิงก์ Google Sheet (ไม่บังคับ — ใช้กับปุ่ม "เปิด Google Sheet") |
4. **Deploy** → ตั้งชื่อเว็บที่ Site configuration → Change site name
5. กลับไปเพิ่ม `https://<ชื่อเว็บ>.netlify.app` ใน **Authorized JavaScript origins** (ขั้นที่ 3)

## 7. ติดตั้งบนมือถือ Android (ทั้งพ่อและแม่)
1. เปิดลิงก์ Netlify ด้วย **Chrome** → **Sign in with Google**
2. เมนู ⋮ → **ติดตั้งแอป / Add to Home screen**
3. **การแจ้งเตือน:** เปิดแอป Google Calendar → ตรวจว่าปฏิทิน **สมุดสุขภาพครอบครัว** (ของผู้ติดตั้ง) หรือคำเชิญนัด (ของอีกฝ่าย) เปิดการแจ้งเตือนไว้
   - ผู้ติดตั้งสคริปต์: นัดอยู่ในปฏิทิน "สมุดสุขภาพครอบครัว"
   - อีกฝ่าย: ได้รับนัดเป็นคำเชิญ (guest) ในปฏิทินของตัวเองอัตโนมัติ

---

### ใช้งานประจำวัน
- **ดึงข้อมูลล่าสุด:** กด 🔄 มุมบน (ข้อมูลที่อีกฝ่ายเพิ่งบันทึกจะมาหลังกด)
- **แก้ข้อมูลใน Sheet ตรง ๆ ได้** แต่ห้ามเปลี่ยนชื่อแท็บหรือหัวคอลัมน์ · คอลัมน์ `id` ต้องไม่ซ้ำ
- **ปิดเครื่อง/ไม่มีเน็ต:** แอปเปิดดูข้อมูลล่าสุดที่เก็บในเครื่องได้ แต่บันทึกใหม่ต้องมีเน็ต

### สำหรับนักพัฒนา
| คำสั่ง (ในโฟลเดอร์ `family-health/app`) | ทำอะไร |
|---|---|
| `npm run dev` | รันในเครื่อง (ค่าจาก `.env.local`) · `VITE_API_URL=mock npm run dev` ใช้หลังบ้านจำลอง |
| `npm run test:api` | ทดสอบ `Code.gs` ด้วยบริการ Google จำลอง (ตรวจ token, สิทธิ์อีเมล, บันทึก, Calendar) |
| `npm run test:e2e` | ทดสอบทั้งแอปกับหลังบ้านจำลอง (ต้องมี `npm i -D playwright`) |
