import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore'

const env = await initializeTestEnvironment({ projectId: 'demo-fh', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } })
const dad = env.authenticatedContext('dad').firestore()
const mom = env.authenticatedContext('mom').firestore()
const evil = env.authenticatedContext('evil').firestore()
const anon = env.unauthenticatedContext().firestore()
let pass = 0, fail = 0
async function t(name, p) { try { await p; console.log('✓', name); pass++ } catch (e) { console.log('✗', name, e.message); fail++ } }

await t('dad creates family', assertSucceeds(setDoc(doc(dad, 'families/f1'), { name: 'F', members: ['dad'], memberNames: { dad: 'Pop' }, inviteCode: 'ABCDEF' })))
await t('dad sets users doc', assertSucceeds(setDoc(doc(dad, 'users/dad'), { familyId: 'f1' })))
await t('evil cannot create family with others', assertFails(setDoc(doc(evil, 'families/f2'), { name: 'X', members: ['evil', 'dad'], memberNames: {}, inviteCode: 'ABCDEF' })))
await t('dad adds person', assertSucceeds(addDoc(collection(dad, 'families/f1/people'), { nickname: 'kid' })))
await t('mom cannot read before join', assertFails(getDoc(doc(mom, 'families/f1'))))
await t('evil joins with wrong code', assertFails(updateDoc(doc(evil, 'families/f1'), { members: arrayUnion('evil'), 'memberNames.evil': 'E', joinCode: 'WRONG1' })))
await t('evil cannot add someone else', assertFails(updateDoc(doc(evil, 'families/f1'), { members: arrayUnion('other'), 'memberNames.other': 'E', joinCode: 'ABCDEF' })))
await t('evil cannot change inviteCode while joining', assertFails(updateDoc(doc(evil, 'families/f1'), { members: arrayUnion('evil'), 'memberNames.evil': 'E', joinCode: 'ZZZZZZ', inviteCode: 'ZZZZZZ' })))
await t('mom joins with right code', assertSucceeds(updateDoc(doc(mom, 'families/f1'), { members: arrayUnion('mom'), 'memberNames.mom': 'Om', joinCode: 'ABCDEF' })))
await t('mom reads family', assertSucceeds(getDoc(doc(mom, 'families/f1'))))
await t('mom writes person', assertSucceeds(addDoc(collection(mom, 'families/f1/people'), { nickname: 'mom' })))
await t('evil cannot read people', assertFails(getDoc(doc(evil, 'families/f1/people/x'))))
await t('anon cannot read', assertFails(getDoc(doc(anon, 'families/f1'))))
await t('member cannot kick/replace members', assertFails(updateDoc(doc(mom, 'families/f1'), { members: ['mom'] })))
await t('member can rename family', assertSucceeds(updateDoc(doc(mom, 'families/f1'), { name: 'New' })))
await t('evil cannot read users/dad', assertFails(getDoc(doc(evil, 'users/dad'))))
await env.cleanup()
console.log(`${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
