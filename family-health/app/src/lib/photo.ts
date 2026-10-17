// ย่อรูปในเครื่องก่อนบันทึก: ตัดเป็นสี่เหลี่ยมจัตุรัสตรงกลาง แล้วเก็บเป็น JPEG ขนาดเล็ก
// (เซลล์ Google Sheet เก็บได้ไม่เกิน 50,000 ตัวอักษร)
const MAX_CHARS = 45_000

export async function photoToDataUrl(file: File, size = 256): Promise<string> {
  const img = await loadImage(file)
  const side = Math.min(img.width, img.height)
  const canvas = document.createElement('canvas')
  for (let px = size; px >= 96; px = Math.round(px * 0.8)) {
    canvas.width = canvas.height = px
    canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, px, px)
    for (const q of [0.85, 0.7, 0.55]) {
      const url = canvas.toDataURL('image/jpeg', q)
      if (url.length <= MAX_CHARS) return url
    }
  }
  throw new Error('รูปใหญ่เกินไป')
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('เปิดรูปไม่ได้')) }
    img.src = url
  })
}
