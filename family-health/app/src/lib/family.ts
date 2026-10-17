import { useEffect, useState } from 'react'
import {
  addDoc, arrayUnion, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import type { Family, Person } from './types'

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')
}

/**
 * ฟังการเปลี่ยนแปลงแบบลองใหม่อัตโนมัติ: หลังสร้าง/เข้าร่วมครอบครัว เซิร์ฟเวอร์อาจยังไม่เห็นสิทธิ์สมาชิก
 * ทำให้ listener แรกโดนปฏิเสธ ถ้าไม่ลองใหม่ หน้าจอจะค้างที่หน้าตั้งค่า
 */
function useRetryingListener(
  key: string | null,
  subscribe: (retry: (e: Error) => void) => () => void,
  onGiveUp?: () => void,
) {
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!key) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = subscribe((e) => {
      console.warn('listener error, retrying', key, attempt, e.message)
      if (attempt >= 6) onGiveUp?.()
      else timer = setTimeout(() => setAttempt((a) => a + 1), 1500)
    })
    return () => {
      unsub()
      clearTimeout(timer)
    }
    // subscribe เปลี่ยนทุก render; ผูกกับ key และจำนวนครั้งที่ลองใหม่เท่านั้น
  }, [key, attempt])
}

/** ดูว่าผู้ใช้อยู่ในครอบครัวไหน (users/{uid}.familyId) · undefined = กำลังโหลด */
export function useFamilyId(user: User | null): string | null | undefined {
  const [fid, setFid] = useState<string | null | undefined>(undefined)
  useEffect(() => setFid(undefined), [user])
  // ทันทีหลังล็อกอิน Firestore อาจยังไม่ได้ token ทำให้ listener แรกโดนปฏิเสธ จึงต้องลองใหม่
  useRetryingListener(user && db ? user.uid : null, (retry) =>
    onSnapshot(
      doc(db!, 'users', user!.uid),
      (s) => {
        if (s.exists()) setFid((s.data().familyId as string) ?? null)
        // แอปไม่มีการลบความเป็นสมาชิก: ถ้าเคยรู้ familyId แล้ว ไม่ลดกลับเป็น null จาก snapshot ที่ล้าหลัง
        // (พบว่าหลังเขียนเอกสารเอง บางครั้งได้ snapshot "ไม่มีเอกสาร" ย้อนหลังมาครั้งหนึ่ง)
        else if (!s.metadata.fromCache) setFid((cur) => cur ?? null)
      },
      retry,
    ),
    () => setFid(null),
  )
  return fid
}

/** undefined = กำลังโหลด, null = ไม่มี/เข้าไม่ได้ */
export function useFamily(fid: string | null | undefined): Family | null | undefined {
  const [fam, setFam] = useState<Family | null | undefined>(undefined)
  useEffect(() => setFam(fid ? undefined : null), [fid])
  useRetryingListener(fid && db ? fid : null, (retry) =>
    onSnapshot(
      doc(db!, 'families', fid!),
      (s) => {
        if (s.exists()) setFam({ id: s.id, ...s.data() } as Family)
        else if (!s.metadata.fromCache) setFam((cur) => cur ?? null) // ยังไม่อยู่ในแคช ≠ ไม่มีจริง
      },
      retry,
    ),
    () => setFam(null),
  )
  return fam
}

export function usePeople(fid: string | null | undefined): Person[] {
  const [people, setPeople] = useState<Person[]>([])
  useEffect(() => {
    if (!fid) setPeople([])
  }, [fid])
  useRetryingListener(fid && db ? fid : null, (retry) =>
    onSnapshot(
      query(collection(db!, 'families', fid!, 'people'), orderBy('createdAt')),
      (s) => setPeople(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Person)),
      retry,
    ),
  )
  return people
}

export async function createFamily(user: User, name: string): Promise<string> {
  const ref = doc(collection(db!, 'families'))
  await setDoc(ref, {
    name,
    members: [user.uid],
    memberNames: { [user.uid]: user.displayName ?? user.email ?? 'สมาชิก' },
    inviteCode: randomCode(),
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  })
  await setDoc(doc(db!, 'users', user.uid), { familyId: ref.id })
  return ref.id
}

/** เข้าร่วมครอบครัวด้วยลิงก์เชิญ รูปแบบ <familyId>.<code> */
export async function joinFamily(user: User, invite: string): Promise<void> {
  const [fid, code] = invite.trim().split('.')
  if (!fid || !code) throw new Error('ลิงก์เชิญไม่ถูกต้อง')
  await updateDoc(doc(db!, 'families', fid), {
    members: arrayUnion(user.uid),
    [`memberNames.${user.uid}`]: user.displayName ?? user.email ?? 'สมาชิก',
    joinCode: code,
  })
  await setDoc(doc(db!, 'users', user.uid), { familyId: fid })
}

export function inviteLink(fam: Family): string {
  return `${location.origin}${location.pathname}?join=${fam.id}.${fam.inviteCode}`
}

export async function savePerson(fid: string, p: Partial<Person> & { id?: string }): Promise<string> {
  const { id, ...data } = p
  if (id) {
    await updateDoc(doc(db!, 'families', fid, 'people', id), { ...data, updatedAt: serverTimestamp() })
    return id
  }
  const ref = await addDoc(collection(db!, 'families', fid, 'people'), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}
