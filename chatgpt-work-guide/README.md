# ChatGPT Work Guide (PWA)

เว็บแอป PWA สำหรับ "คู่มือ ChatGPT, ChatGPT Work, Codex และ AI Agent สำหรับการทำงาน" — UI สไตล์ Copilot / Gemini, ธีมสีจากโลโก้ ChatGPT (ดำ/ขาว + เขียว `#10A37F`), ติดตั้งได้และใช้งานออฟไลน์ได้

## ฟีเจอร์
- หน้าแรกแบบ Gemini: โลโก้เรืองแสงหมุน, ข้อความไล่สี + พิมพ์อัตโนมัติ, การ์ดคำถามแนะนำ
- ผู้ช่วยถามตอบ (ค้นจากคู่มือในเครื่อง ไม่เรียก API) พร้อมแอนิเมชัน "กำลังคิด" และคำตอบที่ทยอยแสดง
- 21 บทเรียนจาก `content.md` พร้อม flow diagram เคลื่อนไหว, ปุ่มคัดลอก Prompt, ติดตามความคืบหน้าการอ่าน
- เครื่องมือ Interactive: วงจร Agent, Prompt Builder, เลือกโมเดล & Effort, คำนวณค่า API, Fact/Assumption/Need Data, ระดับสิทธิ์ Agent, Checklist, Prompt Library, Glossary flashcards, แบบทดสอบ
- ธีมมืด/สว่าง, รองรับมือถือ, `prefers-reduced-motion`

## รันในเครื่อง
```bash
cd chatgpt-work-guide
python3 -m http.server 8080   # เปิด http://localhost:8080
```
Service worker ต้องรันผ่าน http(s) (ไม่ทำงานกับ `file://`)

## แก้เนื้อหา
แก้ `content.md` แล้วรัน `node build.js` เพื่อสร้าง `content.js` ใหม่ และเพิ่มเลข `VERSION` ใน `sw.js` เพื่อให้ผู้ใช้ได้รับเวอร์ชันล่าสุด

## โลโก้
`icons/logo.svg` เป็นโลโก้แบบเวกเตอร์ที่วาดเลียนแบบโลโก้ ChatGPT หากมีไฟล์โลโก้ทางการ สามารถวางทับไฟล์นี้ได้ (และสร้าง `icon-*.png` ใหม่)
ChatGPT และโลโก้เป็นเครื่องหมายการค้าของ OpenAI — โปรดตรวจ OpenAI Brand Guidelines ก่อนเผยแพร่สาธารณะ
