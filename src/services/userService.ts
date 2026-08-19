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
  
  const fastGetPromise = getDoc(userRef);
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
  const existing = await Promise.race([fastGetPromise, timeoutPromise]);

  if (!existing || !existing.exists()) {
    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split("@")[0] || "User",
      photoURL: photoURL || null,
      phone: null,
      status: "active",
      currentOrganizationId: null,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
      lastLoginAt: new Date().toISOString() as any,
    };
    setDoc(userRef, newProfile).catch(() => {});
    return newProfile;
  } else {
    updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(displayName && !existing.data()?.displayName ? { displayName } : {}),
      ...(photoURL && !existing.data()?.photoURL ? { photoURL } : {}),
    }).catch(() => {});
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
