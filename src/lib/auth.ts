import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid))
  if (!userDoc.exists()) throw new Error('User profile not found')
  return { uid: credential.user.uid, ...userDoc.data() }
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function getUserProfile(uid: string) {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (!userDoc.exists()) return null
  return { uid, ...userDoc.data() }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
