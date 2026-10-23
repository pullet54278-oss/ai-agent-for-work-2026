// ---------- FX core (v4): ตัวช่วยร่วมของลูกเล่น · เคารพ prefers-reduced-motion ทุกจุด ----------
window.__fx = { confetti: 0, audio: false };
const fxWait = ms => new Promise(r => setTimeout(r, ms));
function fxAnnounce(msg) {
  let a = document.getElementById('fxLive');
  if (!a) { a = document.createElement('div'); a.id = 'fxLive'; a.className = 'sr-only'; a.setAttribute('aria-live', 'polite'); document.body.appendChild(a); }
  a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 30);
}
function fxInView(el, cb, threshold = 0.3) {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); } }, { threshold });
  io.observe(el);
}
// หยุดแอนิเมชันพื้นหลังเมื่อแท็บถูกซ่อน
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('fx-hidden', document.hidden));
