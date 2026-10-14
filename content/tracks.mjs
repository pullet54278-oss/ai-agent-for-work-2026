// เส้นทางการเรียน (Learning Paths) — เรียงตามลำดับความสำคัญ: Copilot Agent เป็นอันดับแรก
// item: 'p:N' = หน้าในคอร์สหลัก (content/copilot-ai-agents-for-work.md) · 'd:N' = บทเรียนเชิงลึก (Deep Learning 36 บท) · 'x:slug' = หลักสูตร AI + Excel
// แต่ละส่วน (step) ร้อยเนื้อหาทั้งสองแหล่งที่พูดเรื่องเดียวกันไว้ด้วยกัน แทนการทำซ้ำเนื้อหา
export const TRACKS = [
  {
    key: 'agent', star: true, title: 'Copilot Agent', sub: 'เส้นทางหลัก: ตั้งแต่แนวคิด สร้าง ทดสอบ จนนำไปใช้งานจริง', icon: 'bot', color: 'eng',
    steps: [
      { t: '1 · เข้าใจ Agent', items: ['p:3', 'p:4', 'p:6', 'd:13'] },
      { t: '2 · จาก Prompt สู่ Agent', items: ['p:8', 'p:9', 'p:10', 'd:4'] },
      { t: '3 · สร้างและตั้งค่า Agent', items: ['p:18', 'p:19', 'p:20', 'p:21', 'p:24', 'd:14', 'd:15'] },
      { t: '4 · เลือก Agent ที่พร้อมใช้ (67 ตัว)', items: ['p:7', 'p:94', 'p:153', 'p:152', 'p:22'] },
      { t: '5 · เชื่อมระบบและทำงานอัตโนมัติ', items: ['p:30', 'p:31', 'p:47', 'd:16', 'd:17', 'd:18'] },
      { t: '6 · ทดสอบ ดูแล และควบคุมความเสี่ยง', items: ['d:19', 'd:22', 'd:24', 'd:25', 'p:154'] },
      { t: '7 · โปรเจกต์ปิดท้าย', items: ['d:35'] }
    ]
  },
  {
    key: 'office', title: 'Copilot ใน Excel, Word และ PowerPoint', sub: 'ใช้ Copilot ในแอป Office ตั้งแต่สูตรถึงรายงานและสไลด์', icon: 'window', color: 'data',
    steps: [
      { t: 'ภาพรวม 3 แอป', items: ['p:144'] },
      { t: 'Excel', items: ['p:145', 'd:7', 'p:28', 'p:39', 'p:40'] },
      { t: 'Word', items: ['p:146', 'd:6', 'p:27'] },
      { t: 'PowerPoint', items: ['p:147', 'd:8', 'p:29'] },
      { t: 'Outlook และ Teams', items: ['d:9', 'd:10'] }
    ]
  },
  {
    key: 'excel', title: 'AI + Excel Formula Mastery', sub: 'ให้ AI ช่วยเขียนสูตร Excel 3 ระดับ ตั้งแต่สูตรพื้นฐานถึง LET, LAMBDA, Power Query, Automation และ Dashboard', icon: 'table', color: 'xb',
    steps: [
      { t: 'เริ่มต้น: Course Map และ Prompt Framework', items: ['x:start', 'x:master-prompt'] },
      { t: 'Beginner: เปลี่ยนภาษาคนเป็นสูตร', items: ['x:b-overview', 'x:b1', 'x:b2', 'x:b3', 'x:b4', 'x:b5', 'x:b6', 'x:b7', 'x:b-workshop', 'x:b-quiz'] },
      { t: 'Intermediate: สูตรซ้อน + หลายตาราง', items: ['x:i-overview', 'x:i1', 'x:i2', 'x:i3', 'x:i4', 'x:i5', 'x:i6', 'x:i7', 'x:i-workshop', 'x:i-quiz'] },
      { t: 'Advanced: LET, LAMBDA, Power Query, Automation', items: ['x:a-overview', 'x:a1', 'x:a2', 'x:a3', 'x:a4', 'x:a5', 'x:a6', 'x:a7', 'x:a8', 'x:a-workshop', 'x:a-quiz'] },
      { t: 'เครื่องมือ: Prompt Library, Formula Lab, Dashboard', items: ['x:prompts', 'x:formulas', 'x:dashboard', 'x:workbook'] }
    ]
  },
  {
    key: 'browser', title: 'Copilot บนเบราว์เซอร์และ SharePoint', sub: 'ค้นข้อมูลพร้อมแหล่งอ้างอิง ส่งต่องานจากเว็บและอีเมล และใช้กับหน้า SharePoint', icon: 'globe', color: 'lp',
    steps: [
      { t: 'ค้นข้อมูลจากเว็บอย่างน่าเชื่อถือ', items: ['p:26', 'p:10', 'p:61'] },
      { t: 'ส่งต่องานจากเบราว์เซอร์และอีเมล', items: ['p:30', 'p:31'] },
      { t: 'SharePoint และ Knowledge ขององค์กร', items: ['p:15', 'd:11', 'd:12'] }
    ]
  },
  {
    key: 'tips', title: 'Tips & Tricks และเทคนิคขั้นสูง', sub: 'Prompt ขั้นสูง คลัง Prompt เครื่องมือช่วยเขียน และการตรวจคำตอบ', icon: 'sparkle', color: 'ci',
    steps: [
      { t: 'Prompt ที่ตรวจรับได้', items: ['d:4', 'p:8', 'p:9'] },
      { t: 'คลัง Prompt และเครื่องมือ', items: ['p:23', 'p:5'] },
      { t: 'ตรวจคำตอบก่อนใช้', items: ['d:5', 'p:40', 'p:61'] }
    ]
  },
  {
    key: 'apply', title: 'ประยุกต์ใช้กับงานจริง', sub: 'Agent ตามกลุ่มงาน Workflow ฟาร์มและโรงงาน งานตรวจประเมิน และข้อมูลการตัดสินใจ', icon: 'rocket', color: 'farm',
    steps: [
      { t: 'Agent ตามกลุ่มงานทั่วไป', items: ['p:32', 'p:42', 'p:49', 'p:56', 'p:63', 'p:75', 'p:81', 'p:87', 'p:148'] },
      { t: 'Agent จาก Workflow งานจริง', items: ['p:94', 'p:95', 'p:100', 'p:105', 'p:111', 'p:120', 'p:126', 'p:130', 'p:135', 'p:139'] },
      { t: 'เครื่องคำนวณ', items: ['p:70', 'p:115'] },
      { t: 'กรณีศึกษาเชิงลึก', items: ['d:28', 'd:29', 'd:30', 'd:31', 'd:32', 'd:33'] }
    ]
  },
  {
    key: 'foundation', title: 'พื้นฐาน บัญชี และการกำกับดูแล', sub: 'ระบบนิเวศ Copilot สิทธิ์บัญชี License ความปลอดภัย และ Governance', icon: 'shield_checkmark', color: 'qms',
    steps: [
      { t: 'ระบบนิเวศ Copilot', items: ['p:2', 'p:5', 'd:1', 'd:3'] },
      { t: 'บัญชีและสิทธิ์', items: ['p:11', 'p:12', 'p:13', 'p:14', 'p:16', 'p:17', 'd:2'] },
      { t: 'Microsoft 365 Personal', items: ['p:25', 'p:26', 'p:27', 'p:28', 'p:29'] },
      { t: 'ความปลอดภัยและข้อมูล', items: ['d:20', 'd:21', 'd:23'] },
      { t: 'Governance และ Operating Model', items: ['d:26', 'd:27', 'p:154'] }
    ]
  },
  {
    key: 'implement', title: 'นำไปใช้และประเมินผล', sub: 'แผนนำร่อง 90 วัน KPI ROI และแผนพัฒนาตนเอง', icon: 'trophy', color: 'rep',
    steps: [
      { t: 'นำร่องและวัดผล', items: ['d:34', 'p:155'] },
      { t: 'ประเมินตนเอง', items: ['d:36'] }
    ]
  }
];
