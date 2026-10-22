# Design spec — "Chat GPT AI Agents for Work": หน้าเครื่องมือ ChatGPT (ยังไม่สร้าง รอสั่ง "เริ่มสร้าง")

หลักการ: วาดหน้าจอจำลอง (HTML mockup) ใหม่จากภาพ ใช้ข้อมูลตัวอย่าง — ไม่ใช้ภาพจริงเพราะมีข้อมูลส่วนตัว
(ชื่อบัญชี, อีเมล billing, อุปกรณ์/ตำแหน่ง active sessions, ชื่อแชต/โปรเจกต์, ไฟล์ Drive)
แต่ละหัวข้อ = mockup + เคอร์เซอร์จำลองเดินตามขั้นตอน + hotspot + callout + stepper

## หมวด A — เริ่มต้น / หน้าจอหลัก
- A1 ทัวร์หน้าแรก (set1-home): New chat, Scheduled, Library, Plugins, Maps, Explore, Pinned, Projects, Chat|Work toggle, composer (+, Ask ChatGPT, Effort "Medium", mic, voice), suggestions
- A2 สลับ ChatGPT ↔ Codex (set1-app-switcher)
- A3 เมนูโปรไฟล์ (set1-profile-menu): Upgrade plan, Personalization, Profile, Settings, Help, Log out

## หมวด B — Settings (set1-settings-menu: Back to app, Search, Personal ...)
- B1 General: เปลี่ยนภาษา UI → ค้น "ไทย" (set1-settings-language)
- B2 Appearance: Mode (System/Light/Dark), Theme, Accent สี 8 แบบ + Custom, Background, Foreground, Advanced (set2-06)
- B3 Notifications: Codex, Group chats, Health, Library, Marketing, Personalized tips, Projects, Responses, Tasks → Push/Email (set2-07)
- B4 Security and login: Passkeys, Password, MFA (Authenticator app, Text message), Active sessions, Security history (set2-08, -09)
- B5 Archived chats: ค้นหา, กรอง, Unarchive / Delete (set2-10)
- B6 Parental controls: Add family member → email/phone, parent/child (set2-11)
- B7 Trusted contact (set2-12)
- B8 Voice: เลือกเสียง, Language, Enable Dictation, Recent recordings (set2-13, -14)
- B9 Storage: ใช้ไปเท่าไร, Files / Images (set2-15)
- B10 Personalization: Memory (Enable, Memory summary/Manage), Writing style, Reference photos (set3-16);
  Base style & tone, Warmth, Enthusiasm, Emoji, Visual answers, Headers and lists (set3-17);
  Custom instructions ChatGPT/Codex, Additional settings: Fast answers, Suggested prompts, Reference record history,
  Web search, ChatGPT Voice, Library search, Connector search... (set3-18)
- B11 Pets: เลือก/สร้าง/อัปโหลด companion (set3-19)
- B12 Keyboard: shortcuts Composer/Chat/App (set3-20)
- B13 Usage: Plan limits 5-hour / Weekly (ใช้ร่วม Codex, Work, Workspace Agents, ChatGPT for Excel; Chat ไม่นับ),
  Analytics by feature, Top chats, Plan usage history (set3-21..24) — เชื่อมกับบท 6 โควตา
- B14 Billing: Manage plan, Billing info, Payment methods, Cancel plan (set3-25)

- B15 Data controls: Shared links, Improve the model for everyone, Location, Work network access, Reset ChatGPT Work,
  Information shared with apps, Archived chats, Archive all, Delete all, Export data, Cookie preferences (เห็นในแชต ไม่มีไฟล์)
- B16 Plugins: Browse directory, ค้นหา, Default permission "Allow low-risk tools", รายการ plugin (Booking, Canva, ElevenLabs,
  GitHub, Gmail, Google Calendar/Contacts/Drive, LinkedIn, Netlify, Notion, Outlook, SharePoint, Shopee) + ระดับสิทธิ์ต่อ plugin
  (Allow low-risk / Allow all tools) — เชื่อมบท 14 (เห็นในแชต ไม่มีไฟล์)
- B17 Cloud computer (ChatGPT Work): Work cookies, website approvals = Always ask / Auto approve / Always allow (เตือนสีส้ม),
  Website permissions → Add website (Site or pattern + Browsing) (set4-26; 2 ภาพแรกเห็นในแชต)
- B18 Codex Cloud: Environments / Personal vault, Create environment (set4-27)
- B19 Code Review: เลือก repo GitHub, Automatic review, Review trigger (On PR open), Exhaustive review, Use credits (set4-28)

## หมวด C — เครื่องมือจากแถบซ้าย
- C1 Scheduled: พิมพ์ "Schedule a task", รายการ Daily/Weekly/Monitoring + Next run, Recommended, ตัวกรอง Active (set4-29) — เชื่อมบท 11.4
- C2 Library: แท็บ Suggested/Favorites/Folders/Images/All, ค้นหา, New, มุมมอง grid/list, ไฟล์จาก Drive/รูป/วิดีโอ (set4-30)
  - ปุ่มตั้งค่า: เปิด/ปิด Google Drive, Storage, Trash (set5-36)
  - ตัวกรอง: File type (Images, Documents, Spreadsheets, Presentations, PDFs), Source (Uploaded, Generated) + มุมมอง list มี Last activity (set5-37)
  - New: Note, Image, Document, Spreadsheet, Presentation, Folder, Upload files, Connect a plugin (set5-38)
- C3 Plugins (จากแถบซ้าย): แท็บ Plugins/Skills, ค้นหา, Installed, Public/Personal, Popular + ปุ่ม + ติดตั้ง, ปุ่ม Add, เฟือง=ไป Settings>Plugins (set5-39)
- C4 Skills: Instructions that extend ChatGPT's capabilities, Installed (เช่น skill-creator), Add (set5-40) — เชื่อมบท 14 + Agent

## คำถามค้าง (Need Data)

- ไอคอนมุมขวาบนหน้าแรก, รายการตัวเลือกใน Effort dropdown
- หน้า Codex, Projects (รอภาพ)

## เพิ่มเติม (ชุดภาพ 6–7)
- C4 Skills › Add → Create with chat / Create with editor / Upload from your computer (set6-41)
- C5 Maps: ช่อง "Ask ChatGPT what's nearby" + Effort + mic, แผนที่หมุดคะแนน, การ์ดสถานที่ (รูป, rating, ประเภท, ราคา, เปิด/ปิด) เลื่อนแนวนอน (set6-42) — เกี่ยวกับ Location ใน Data controls
- C6 Images: แท็บ Trending (Aerial view, Collector's tin, '80s flashback, Caricature, Sketch, Stickers, Photo booth, Y2K, Anime, 70s portrait, Impressionist ...)
  / Templates (Poster, Interior design, Logo, Illustration, Headshot, Icon, Product photo, Merch, Infographic, Flyer, Book cover, Packaging, Ad, Thumbnail ...)
  + ช่อง "Describe a new image" + Effort (set6-43, -44) — เชื่อมบท 12
- C7 Explore (GPTs): แบนเนอร์ "GPTs will be retired on December 11" → Explore plugins, ค้นหา, หมวด Top Picks/Images/Programming/Research & Analysis/
  Productivity/Writing/Lifestyle/Education, Featured, รายการจัดอันดับ + See more, My GPTs, + Create (set6-45, set7-46) — ติด badge Deprecated
- C8 Sites: "Turn your ideas into live websites", grid/list, ค้นหา, + Create Site, สถานะ Published/Not published, Shared with (Only you) (set7-47) — เชื่อมบท 9/17
- A4 Chat | Work toggle (set7-48)
- A5 หน้า Work: "What should we work on?", ข้อความเริ่ม "Create a new site with Sites", ตัวเลือกโมเดล+effort (เช่น "GPT-6 Luna High"), เมนู "+":
  Add photos & files, Add from library, Create image, Add browser tabs, Web search, Work in a project, Sketch ... (set7-49) — เชื่อมบท 8
- C9 ใช้ Plugin ในแชต (ตัวอย่าง Canva): หน้า plugin เต็มจอ, suggestion chips, Getting started cards, ช่อง "Work with ChatGPT" (set7-50) — เชื่อมบท 14
