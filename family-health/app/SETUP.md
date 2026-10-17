# ติดตั้งสมุดสุขภาพครอบครัว (ทำครั้งเดียว ประมาณ 20–30 นาที)

ทำบนคอมพิวเตอร์ (Windows/Mac) ด้วยบัญชี Google ของผู้ดูแลหลัก

## 1. สร้างโปรเจกต์ Firebase
1. เปิด https://console.firebase.google.com → **Create a project**
2. ตั้งชื่อ เช่น `family-health-app` → ปิด Google Analytics ได้ → Create

## 2. เปิดการเข้าสู่ระบบด้วย Google
1. เมนูซ้าย **Build → Authentication → Get started**
2. แท็บ **Sign-in method → Google → Enable** → เลือกอีเมลติดต่อ → Save

## 3. สร้างฐานข้อมูล Firestore
1. **Build → Firestore Database → Create database**
2. Location: **asia-southeast1 (Singapore)** — ใกล้ไทยที่สุด (เปลี่ยนภายหลังไม่ได้)
3. เลือก **Start in production mode** (กฎความปลอดภัยจริงจะ deploy ในขั้นที่ 6)

## 4. ผูกบัตร (แผน Blaze)
**⚙️ → Usage and billing → Modify plan → Blaze** แล้วตั้ง **Budget alert** เช่น 50 บาท/เดือน
ใช้ตอนระยะที่ 2 (แจ้งเตือน) และไฟล์แนบ — การใช้ของครอบครัวเดียวอยู่ในโควตาฟรี

## 5. ลงทะเบียนเว็บแอปและเอาค่าตั้งค่า
1. **⚙️ Project settings → General → Your apps → ไอคอน `</>` (Web)** → ตั้งชื่อ → Register
2. คัดลอกค่าใน `firebaseConfig`
3. ในโฟลเดอร์ `family-health/app` คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่า:
   ```
   VITE_FB_API_KEY=...            ← apiKey
   VITE_FB_AUTH_DOMAIN=...        ← authDomain
   VITE_FB_PROJECT_ID=...         ← projectId
   VITE_FB_STORAGE_BUCKET=...     ← storageBucket
   VITE_FB_MESSAGING_SENDER_ID=...← messagingSenderId
   VITE_FB_APP_ID=...             ← appId
   ```
   ค่าเหล่านี้ไม่ใช่รหัสลับ (อยู่ในเว็บอยู่แล้ว) ความปลอดภัยมาจากกฎ Firestore แต่ `.env.local` ไม่ถูก commit อยู่แล้ว

## 6. ติดตั้งเครื่องมือและเผยแพร่แอป
ต้องมี [Node.js 20+](https://nodejs.org) ก่อน แล้วเปิด Terminal:
```bash
cd family-health/app
npm install
npx firebase login
npx firebase use --add          # เลือกโปรเจกต์จากขั้นที่ 1 ตั้งชื่อ alias ว่า default
npm run deploy                  # build + deploy เว็บ + กฎ Firestore
```
เสร็จแล้วจะได้ลิงก์ `https://<project-id>.web.app`

## 7. ติดตั้งบนมือถือ Android
1. เปิดลิงก์ด้วย **Chrome** → เข้าสู่ระบบด้วย Google → **สร้างครอบครัว**
2. เมนู ⋮ → **ติดตั้งแอป / Add to Home screen** → จะได้ไอคอนบนหน้าจอ
3. **เพิ่มเติม → + เพิ่มโปรไฟล์**: ลูก (ติ๊ก G-6-PD ถ้ามี), พ่อ, แม่ (ใส่เบอร์โทรเพื่อแสดงในบัตรฉุกเฉิน)

## 8. เชิญคู่สมรส
**เพิ่มเติม → ส่งลิงก์เชิญ** → ส่งทาง LINE → อีกฝ่ายเปิดลิงก์ด้วย Chrome → เข้าสู่ระบบด้วย Google ของตัวเอง → **เข้าร่วม**
แล้วติดตั้งลงหน้าจอเหมือนขั้นที่ 7 — ข้อมูลจะตรงกันทั้งสองเครื่อง

---

### สำหรับนักพัฒนา
| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันในเครื่อง (ใช้ค่าจาก `.env.local`) |
| `npm run test:rules` | ทดสอบกฎความปลอดภัย Firestore กับ emulator (ต้องมี Java) |
| `npm run test:e2e` | ทดสอบทั้งระบบ: ล็อกอิน สร้างครอบครัว เพิ่มโปรไฟล์ บัตรฉุกเฉิน ตรวจชื่อยา เชิญสมาชิก (ต้องมี Java + `npm i -D playwright`) |
| `npm run deploy` | build และเผยแพร่ |

**ข้อจำกัดที่รู้อยู่:** ตอนนี้ข้อมูลยังต้องใช้อินเทอร์เน็ตตอนเปิดดู (ตัวแอปเปิดได้แม้ออฟไลน์)
เพราะแคชถาวรของ Firestore ค้างหลังรีโหลดในการทดสอบอัตโนมัติ — จะเปิดใช้หลังทดสอบบนมือถือจริง
