// ---------- เสียงเอฟเฟกต์ (Web Audio สังเคราะห์ ไม่มีไฟล์เสียง) · ปิดเป็นค่าเริ่มต้น · สร้าง AudioContext หลังผู้ใช้เปิดเท่านั้น ----------
let fxAC = null, fxSoundOn = !!store.get('cpa26-sound', false);
const FX_TONES = { click: [[880, 0.035]], ok: [[660, 0.07], [990, 0.11]], done: [[523, 0.09], [659, 0.09], [784, 0.09], [1046, 0.18]], err: [[233, 0.12]] };
function fxSound(kind) {
  if (!fxSoundOn) return;
  try {
    if (!fxAC) { fxAC = new (window.AudioContext || window.webkitAudioContext)(); window.__fx.audio = true; }
    if (fxAC.state === 'suspended') fxAC.resume();
    let t = fxAC.currentTime + 0.01;
    for (const [f, d] of FX_TONES[kind] || []) {
      const o = fxAC.createOscillator(), g = fxAC.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(fxAC.destination); o.start(t); o.stop(t + d + 0.03); t += d * 0.85;
    }
  } catch (e) { /* audio unavailable */ }
}
function fxSoundSync() {
  const t = fxSoundOn ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์', b = document.getElementById('soundBtn');
  if (b) { b.setAttribute('aria-pressed', String(fxSoundOn)); b.title = t; b.setAttribute('aria-label', t); b.innerHTML = ic(fxSoundOn ? 'speaker_2' : 'speaker_mute'); }
  $$('[data-sound-toggle]').forEach(x => { x.setAttribute('aria-pressed', String(fxSoundOn)); x.innerHTML = ic(fxSoundOn ? 'speaker_2' : 'speaker_mute') + `<span>${fxSoundOn ? 'ปิดเสียง' : 'เปิดเสียง'}</span>`; });
}
function fxSoundBtn() {
  fxSoundSync();
  document.addEventListener('click', e => {
    if (!e.target.closest('#soundBtn,[data-sound-toggle]')) return;
    fxSoundOn = !fxSoundOn; store.set('cpa26-sound', fxSoundOn); fxSoundSync();
    if (fxSoundOn) fxSound('ok');
    toast(fxSoundOn ? 'เปิดเสียงเอฟเฟกต์แล้ว' : 'ปิดเสียงเอฟเฟกต์แล้ว');
  });
}
