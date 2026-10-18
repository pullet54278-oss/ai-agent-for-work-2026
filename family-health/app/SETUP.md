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

**แก้สคริปต์ภายหลัง:** วางโค้ดใหม่ → 💾 → Deploy → **Manage deployments → ✏️ → Version: New version → Deploy** (URL เดิม ไม่ต้องแก้แอป) · ทำให้อัตโนมัติได้ ดูขั้นที่ 8.2

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

## 8. ตั้งให้อัปเดตอัตโนมัติ (ทำครั้งเดียว)

### 8.1 แอป: Netlify build เองทุกครั้งที่มีโค้ดใหม่ใน GitHub
1. https://app.netlify.com → เปิดเว็บ → **Project configuration → Build & deploy → Continuous deployment → Link repository**
2. เลือก **GitHub** → repo `pullet54278-oss/ai-agent-for-work-2026` (ถ้าไม่เห็น กด *Configure the Netlify app on GitHub* แล้วอนุญาต repo นี้)
3. **Branch to deploy:** `claude/relaxed-davinci-qji2eu` · **Base directory:** `family-health/app` → Save
4. ตรวจที่ **Deploys**: build ล่าสุดต้องขึ้นชื่อ commit และ **Published** (Environment variables เดิมยังอยู่)

### 8.2 สคริปต์: GitHub ส่ง Code.gs ขึ้น Apps Script เอง (ไม่บังคับ)
ไฟล์ `.github/workflows/apps-script.yml` จะตรวจ Code.gs ด้วยชุดทดสอบ แล้วส่งขึ้นโปรเจกต์ Apps Script และอัปเดต deployment เดิม (ลิงก์ `/exec` ไม่เปลี่ยน)

> ต้องเก็บสิทธิ์เข้าบัญชี Google (ไฟล์ `.clasprc.json`) ไว้ใน GitHub Secrets — ใครที่เป็นเจ้าของ repo หรือแก้ workflow ได้จะใช้สิทธิ์นี้ได้ ถ้าไม่สบายใจ ให้ข้ามข้อนี้และอัปเดตสคริปต์เองตาม "แก้สคริปต์ภายหลัง" ในขั้นที่ 5

1. เปิด API: https://script.google.com/home/usersettings → **Google Apps Script API: On**
2. ติดตั้ง Node.js (https://nodejs.org เลือก LTS) บนคอมพิวเตอร์ → เปิด Command Prompt / Terminal แล้วพิมพ์
   ```
   npx @google/clasp@2.4.2 login
   ```
   เบราว์เซอร์จะเปิดให้เลือกบัญชีเจ้าของ Sheet → Allow → จะได้ไฟล์ `.clasprc.json` ในโฟลเดอร์ผู้ใช้
   (Windows: `C:\Users\<ชื่อ>\.clasprc.json` · Mac: `~/.clasprc.json`) → เปิดด้วย Notepad แล้วคัดลอกทั้งหมด
3. เก็บ ID 2 ตัวจาก Apps Script
   - **Script ID:** ⚙️ Project Settings → IDs → Script ID
   - **Deployment ID:** Deploy → Manage deployments → เลือก Web app ที่ใช้อยู่ → Deployment ID (ขึ้นต้น `AKfycb…` คือส่วนกลางของลิงก์ `/exec`)
4. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret** สร้าง 3 ตัว
   | Name | Value |
   |---|---|
   | `CLASPRC_JSON` | เนื้อหาไฟล์ `.clasprc.json` ทั้งหมด |
   | `APPS_SCRIPT_ID` | Script ID |
   | `APPS_SCRIPT_DEPLOYMENT_ID` | Deployment ID |
5. ทดสอบ: GitHub → **Actions → Deploy Apps Script → Run workflow** → ต้องขึ้น ✅ แล้วใน Apps Script → Manage deployments จะเห็นเวอร์ชันใหม่ชื่อ `auto …`
6. ลบไฟล์ `.clasprc.json` ในเครื่องได้ (หรือเก็บไว้ถ้าจะใช้ clasp ต่อ) · ถ้าจะยกเลิกสิทธิ์ภายหลัง: https://myaccount.google.com/permissions → ลบ "clasp"

**หมายเหตุ:** ถ้าสคริปต์เวอร์ชันใหม่ขอสิทธิ์เพิ่ม (เช่น บริการ Google ใหม่) ต้องเปิด Apps Script แล้วรัน `setup` เองหนึ่งครั้งเพื่อกด Allow

---

### ใช้งานประจำวัน
- **ดึงข้อมูลล่าสุด:** กด 🔄 มุมบน (ข้อมูลที่อีกฝ่ายเพิ่งบันทึกจะมาหลังกด)
- **แก้ข้อมูลใน Sheet ตรง ๆ ได้** แต่ห้ามเปลี่ยนชื่อแท็บหรือหัวคอลัมน์ · คอลัมน์ `id` ต้องไม่ซ้ำ
- **ปิดเครื่อง/ไม่มีเน็ต:** แอปเปิดดูข้อมูลล่าสุดที่เก็บในเครื่องได้ แต่บันทึกใหม่ต้องมีเน็ต

### สำหรับนักพัฒนา
| คำสั่ง (ในโฟลเดอร์ `family-health/app`) | ทำอะไร |
|---|---|
| `npm run dev` | รันในเครื่อง (ค่าจาก `.env.local`) · `VITE_API_URL=mock npm run dev` ใช้หลังบ้านจำลอง |
| `npm test` | รันชุดทดสอบทั้งหมด: `test:api` + `test:growth` + `test:logic` |
| `npm run test:api` | ทดสอบ `Code.gs` ด้วยบริการ Google จำลอง (ตรวจ token, สิทธิ์อีเมล, บันทึก, Calendar) |
| `npm run test:growth` | ตรวจ z-score กับค่าที่ WHO ตีพิมพ์ |
| `npm run test:logic` | ตรวจยา G-6-PD, ป่วยซ้ำ, เทอม/ปีของค่าใช้จ่าย, นัดวัคซีนเข็มถัดไป |
| `scripts/make-who-lms.sh` | ดาวน์โหลดตาราง LMS ของ WHO และสร้าง `src/data/who-lms.ts` ใหม่ |
| `npm run test:e2e` | ทดสอบทั้งแอปกับหลังบ้านจำลอง (ต้องมี `npm i -D playwright`) |
