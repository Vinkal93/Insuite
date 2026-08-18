import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Parent } from "@/types";
import { createAuditLog } from "./auditService";

export const createParent = async (
  orgId: string,
  data: Omit<Parent, "id" | "createdAt" | "updatedAt">,
  actor: { uid: string; name: string }
): Promise<Parent> => {
  const parentsCol = collection(db, "organizations", orgId, "parents");
  const newParentDoc = doc(parentsCol);

  const parent: Parent = {
    ...data,
    id: newParentDoc.id,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(newParentDoc, parent);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PARENT_CREATED",
    entityType: "PARENT",
    entityId: newParentDoc.id,
    metadata: { fullName: parent.fullName, relation: parent.relation },
  });

  return parent;
};

export const getParent = async (orgId: string, parentId: string): Promise<Parent | null> => {
  const parentRef = doc(db, "organizations", orgId, "parents", parentId);
  const snap = await getDoc(parentRef);
  if (!snap.exists()) return null;
  return snap.data() as Parent;
};

export const updateParent = async (
  orgId: string,
  parentId: string,
  data: Partial<Parent>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const parentRef = doc(db, "organizations", orgId, "parents", parentId);
  await updateDoc(parentRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PARENT_UPDATED",
    entityType: "PARENT",
    entityId: parentId,
  });
};

export const listParents = async (orgId: string, searchQuery?: string): Promise<Parent[]> => {
  const parentsCol = collection(db, "organizations", orgId, "parents");
  const q = query(parentsCol, orderBy("createdAt", "desc"), firestoreLimit(100));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Parent);

  if (searchQuery && searchQuery.trim() !== "") {
    const term = searchQuery.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.mobile.includes(term) ||
        (p.email && p.email.toLowerCase().includes(term))
    );
  }

  return list;
};

export const linkStudentToParent = async (
  orgId: string,
  parentId: string,
  studentId: string
): Promise<void> => {
  const parentRef = doc(db, "organizations", orgId, "parents", parentId);
  const snap = await getDoc(parentRef);
  if (snap.exists()) {
    const existing = (snap.data() as Parent).childrenIds || [];
    if (!existing.includes(studentId)) {
      await updateDoc(parentRef, {
        childrenIds: [...existing, studentId],
        updatedAt: new Date().toISOString(),
      });
    }
  }
};
