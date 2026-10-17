import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
}

export const configured = Boolean(config.apiKey && config.projectId)

const app = configured ? initializeApp(config) : null
export const auth = app ? getAuth(app) : null
// ใช้แคชในหน่วยความจำ: แคชถาวร (IndexedDB) ค้างหลังรีโหลดในการทดสอบอัตโนมัติ 4 ใน 6 ครั้ง
// จะเปิดใช้อีกครั้งหลังทดสอบบนมือถือ Android จริง (หน้าแอปยังเปิดได้แม้ออฟไลน์ผ่าน service worker)
export const db = app ? initializeFirestore(app, { localCache: memoryLocalCache() }) : null

// สำหรับทดสอบในเครื่อง: VITE_USE_EMULATOR=1 npm run dev (คู่กับ firebase emulators:start)
if (import.meta.env.VITE_USE_EMULATOR === '1' && auth && db) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  // emulator รับ id_token แบบ JSON ที่ไม่ได้เซ็น ใช้สำหรับทดสอบอัตโนมัติเท่านั้น (ไม่อยู่ใน production build)
  const a = auth
  Object.assign(window, {
    __testSignIn: (sub: string, name: string) =>
      signInWithCredential(a, GoogleAuthProvider.credential(JSON.stringify({ sub, email: `${sub}@example.com`, email_verified: true, name }))),
  })
}
