import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

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

  location: {
    district: string;
    area: string;
    address: string;
  };

  router: {
    ontType: string;
    model: string;
    serialNumber: string;
  };

  createdAt?: string;
  updatedAt?: string;
};

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    throw new Error("User profile not found");
  }

  return profile;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string) {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return null;
  }

  return {
    uid,
    ...userDoc.data(),
  } as CustomerProfile;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
