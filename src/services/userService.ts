import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as UserProfile;
};

export const syncUserProfileOnAuth = async (
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null
): Promise<UserProfile> => {
  const userRef = doc(db, "users", uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split("@")[0] || "User",
      photoURL: photoURL || null,
      phone: null,
      status: "active",
      currentOrganizationId: null,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      lastLoginAt: serverTimestamp() as any,
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  } else {
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(displayName && !existing.data()?.displayName ? { displayName } : {}),
      ...(photoURL && !existing.data()?.photoURL ? { photoURL } : {}),
    });
    return existing.data() as UserProfile;
  }
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<Pick<UserProfile, "displayName" | "phone" | "photoURL" | "currentOrganizationId">>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};
