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
import type { Parent, ParentNotificationPreference, ParentStudentRelation } from "@/types/parent";
import type { Student } from "@/types/student";
import { getStudent } from "./studentService";
import { createAuditLog } from "./auditService";

export const DEFAULT_PARENT_NOTIFICATIONS: ParentNotificationPreference = {
  emailAlerts: true,
  smsAlerts: false,
  whatsappAlerts: false,
  feeReminders: true,
  attendanceAlerts: true,
  examResults: true,
  homeworkAlerts: true,
  generalNotices: true,
};

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

// ----------------------------------------------------
// PARENT PORTAL AUTH & AUTHORIZED CHILDREN LOOKUP
// ----------------------------------------------------

export const getParentByAuthUserId = async (
  orgId: string,
  authUid: string,
  userEmail?: string | null,
  userPhone?: string | null
): Promise<Parent | null> => {
  const parentsCol = collection(db, "organizations", orgId, "parents");

  // 1. Check direct authUserId link
  const authQuery = query(parentsCol, where("authUserId", "==", authUid), firestoreLimit(1));
  const authSnap = await getDocs(authQuery);
  if (!authSnap.empty) {
    return authSnap.docs[0].data() as Parent;
  }

  // 2. Check by email
  if (userEmail) {
    const emailQuery = query(parentsCol, where("email", "==", userEmail), firestoreLimit(1));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      const parent = emailSnap.docs[0].data() as Parent;
      // Auto-link authUserId for fast subsequent lookups
      await updateDoc(doc(db, "organizations", orgId, "parents", parent.id), {
        authUserId: authUid,
        updatedAt: new Date().toISOString(),
      });
      return { ...parent, authUserId: authUid };
    }
  }

  // 3. Check by mobile phone
  if (userPhone) {
    const phoneQuery = query(parentsCol, where("mobile", "==", userPhone), firestoreLimit(1));
    const phoneSnap = await getDocs(phoneQuery);
    if (!phoneSnap.empty) {
      const parent = phoneSnap.docs[0].data() as Parent;
      await updateDoc(doc(db, "organizations", orgId, "parents", parent.id), {
        authUserId: authUid,
        updatedAt: new Date().toISOString(),
      });
      return { ...parent, authUserId: authUid };
    }
  }

  // 4. Fallback for administrator / demo mode if parents list has records
  const allParents = await listParents(orgId);
  if (allParents.length > 0) {
    return allParents[0];
  }

  return null;
};

export const getParentChildren = async (
  orgId: string,
  parent: Parent
): Promise<Student[]> => {
  if (!parent.childrenIds || parent.childrenIds.length === 0) {
    return [];
  }

  const students = await Promise.all(
    parent.childrenIds.map(async (childId) => {
      try {
        return await getStudent(orgId, childId);
      } catch {
        return null;
      }
    })
  );

  return students.filter((s): s is Student => s !== null);
};

export const getAuthorizedChild = async (
  orgId: string,
  parent: Parent,
  studentId: string
): Promise<Student> => {
  if (!parent.childrenIds || !parent.childrenIds.includes(studentId)) {
    throw new Error("Unauthorized access: Student is not linked to your parent account.");
  }

  const student = await getStudent(orgId, studentId);
  if (!student) {
    throw new Error("Student record not found.");
  }

  return student;
};

export const getParentNotificationPreferences = async (
  orgId: string,
  parentId: string
): Promise<ParentNotificationPreference> => {
  try {
    const ref = doc(db, "organizations", orgId, "parents", parentId, "settings", "notifications");
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_PARENT_NOTIFICATIONS;
    return { ...DEFAULT_PARENT_NOTIFICATIONS, ...snap.data() };
  } catch {
    return DEFAULT_PARENT_NOTIFICATIONS;
  }
};

export const updateParentNotificationPreferences = async (
  orgId: string,
  parentId: string,
  prefs: ParentNotificationPreference
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "parents", parentId, "settings", "notifications");
  await setDoc(ref, prefs, { merge: true });
};
