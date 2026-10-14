# private/ — รายชื่อ Email ที่เข้าใช้งานได้ (ไม่ถูก commit)

วางไฟล์รายชื่อ Email ที่นี่ (.txt / .csv / .xlsx / .json) — build จะดึงทุกข้อความที่เป็นรูปแบบ Email
แล้วแปลงเป็นค่า hash (SHA-256 + salt) ก่อนฝังในเว็บ ไม่มี Email ตัวจริงอยู่ใน dist/
ไฟล์ในโฟลเดอร์นี้ (ยกเว้น README) ถูก .gitignore ไม่ขึ้น GitHub

สำหรับ Netlify (deploy จาก Git): ตั้ง Environment variable `ALLOWED_EMAILS` = email คั่นด้วย , หรือขึ้นบรรทัดใหม่
ถ้าไม่มีรายชื่อเลย ระบบ Email gate จะปิด (ทุกคนเข้าได้) และ build จะแจ้งเตือน
