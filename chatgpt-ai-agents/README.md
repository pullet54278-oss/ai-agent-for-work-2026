# Chat GPT AI Agents for Work (PWA)

แอปเรียนสร้าง AI Agent ด้วย ChatGPT แบบ Interactive — หน้าจอจำลองที่เคอร์เซอร์กดให้ดูหรือให้ผู้เรียนกดเอง, Prompt Lab ในทุกบทและทุกเครื่องมือ, ติดตั้งได้และใช้งานออฟไลน์

- บทเรียน: (1) สร้าง Agent ทำงานอัตโนมัติ (2) Projects (3) Skills + Plugins (4) Codex สร้างเว็บแอป (5) PWA + Deploy (6) Voice
- คลังเครื่องมือ: `js/tools.js` · เนื้อหาบทเรียนและฉากเดโม: `js/lessons.js` · เครื่องเล่นเดโม/หน้าจอจำลอง: `js/mock.js` + `mock.css`
- ภาคผนวก: คู่มือเดิม (`js/content.js` คัดลอกจาก `../chatgpt-work-guide/`)
- หน้าจอทั้งหมดเป็นหน้าจอจำลองด้วยข้อมูลตัวอย่าง ไม่มีภาพหน้าจอจริงหรือข้อมูลส่วนตัว

รันในเครื่อง: `python3 -m http.server 8080` ในโฟลเดอร์นี้ · Deploy: Netlify (publish directory = `chatgpt-ai-agents`, ดู `netlify.toml`)
อัปเดตแล้วให้เพิ่ม `VERSION` ใน `sw.js`
