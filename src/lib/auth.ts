import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { RouterType } from "./routerTypes";

export type CustomerProfile = {
  uid: string;
  role: "customer" | "staff" | "admin";

  fullName: string;
  email: string;
  phone: string;

  customerNumber: string;
  accountStatus: "active" | "suspended" | "expired";

  packageName: string;
  packagePrice: number;
  expiryDate: string;

  district: string;
  area: string;
  address: string;

  routerModel: string;
  routerSerial: string;
  routerType?: RouterType;

  staffId?: string;
  department?: string;
  position?: string;
};

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    await firebaseSignOut(auth);
    throw new Error("PROFILE_NOT_FOUND");
  }

  return profile;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("AUTH_REQUIRED");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function signOut() {
  await firebaseSignOut(auth);
  localStorage.removeItem("customerProfile");
}

export async function getUserProfile(uid: string) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return {
    uid,
    ...userSnap.data(),
  } as CustomerProfile;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
