import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AcademicSession } from "@/types";
import type { AcademicSessionInput } from "@/schemas";

export const createAcademicSession = async (
  orgId: string,
  input: AcademicSessionInput
): Promise<AcademicSession> => {
  const sessionsCol = collection(db, "organizations", orgId, "academicSessions");
  
  if (input.isActive) {
    // Deactivate existing active sessions
    const activeQuery = query(sessionsCol, where("isActive", "==", true));
    const activeSnapshot = await getDocs(activeQuery);
    const batch = writeBatch(db);
    activeSnapshot.docs.forEach((docItem) => {
      batch.update(docItem.ref, { isActive: false, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  const sessionRef = doc(sessionsCol);
  const newSession: AcademicSession = {
    id: sessionRef.id,
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    isActive: input.isActive,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(sessionRef, newSession);
  return newSession;
};

export const getAcademicSessions = async (orgId: string): Promise<AcademicSession[]> => {
  const sessionsCol = collection(db, "organizations", orgId, "academicSessions");
  const snapshot = await getDocs(sessionsCol);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicSession));
};

export const getActiveAcademicSession = async (orgId: string): Promise<AcademicSession | null> => {
  const sessionsCol = collection(db, "organizations", orgId, "academicSessions");
  const q = query(sessionsCol, where("isActive", "==", true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const first = snapshot.docs[0];
  return { id: first.id, ...first.data() } as AcademicSession;
};
