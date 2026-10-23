// เหรียญพิเศษ (นอกจากเหรียญจบบทที่สร้างอัตโนมัติจากทุกบท) · rule: journey | forge | sims | quiz (n = จำนวนที่ต้องถึง)
export const BADGES = [
  { k: 'journey', icon: 'compass_northwest', t: 'นักเดินทาง Agent', d: 'ผ่านเส้นทาง 7 สถานีครบ', rule: 'journey' },
  { k: 'forge', icon: 'beaker', t: 'นักสร้าง Prompt', d: 'Prompt Lab เครื่องผลิตได้ ≥ 80 คะแนน โดยไม่ให้สิทธิ์เกินงาน', rule: 'forge', n: 80 },
  { k: 'sims', icon: 'cursor_click', t: 'ฝึกมือจนคล่อง', d: 'ทำหน้าจอจำลองแบบ "ลองกดเอง" ครบ 5 ฉาก', rule: 'sims', n: 5 },
  { k: 'quiz5', icon: 'question_circle', t: 'ทบทวนสม่ำเสมอ', d: 'ทำแบบทดสอบท้ายบทได้คะแนนเต็ม 5 บท', rule: 'quiz', n: 5 },
  { k: 'quiz27', icon: 'trophy', t: 'เชี่ยวชาญทุกบท', d: 'ทำแบบทดสอบท้ายบทได้คะแนนเต็มครบ 27 บท', rule: 'quiz', n: 27 }
];
