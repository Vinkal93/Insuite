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
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student, StudentStatus, Gender } from "@/types";
import { createAuditLog } from "./auditService";

export const generateNextStudentId = async (
  orgId: string,
  sessionYear?: string
): Promise<string> => {
  const year = sessionYear || new Date().getFullYear().toString();
  const counterRef = doc(db, "organizations", orgId, "counters", "students");

  const nextSeq = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let current = 0;
    if (counterDoc.exists()) {
      current = counterDoc.data().currentSequence || 0;
    }
    const updated = current + 1;
    transaction.set(counterRef, { currentSequence: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  });

  const padded = nextSeq.toString().padStart(6, "0");
  return `INS-${year}-${padded}`;
};

export interface StudentListFilters {
  sessionId?: string;
  classId?: string;
  sectionId?: string;
  gender?: Gender | "";
  status?: StudentStatus | "";
  searchQuery?: string;
}

export const createStudent = async (
  orgId: string,
  data: Omit<Student, "id" | "createdAt" | "updatedAt">,
  actor: { uid: string; name: string }
): Promise<Student> => {
  const studentsCol = collection(db, "organizations", orgId, "students");
  const newStudentDoc = doc(studentsCol);

  const student: Student = {
    ...data,
    id: newStudentDoc.id,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  await setDoc(newStudentDoc, student);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STUDENT_CREATED",
    entityType: "STUDENT",
    entityId: newStudentDoc.id,
    metadata: {
      studentId: student.studentId,
      fullName: student.fullName,
      className: student.academic.className,
    },
  });

  return student;
};

export const getStudent = async (orgId: string, studentId: string): Promise<Student | null> => {
  const studentRef = doc(db, "organizations", orgId, "students", studentId);
  const snap = await getDoc(studentRef);
  if (!snap.exists()) return null;
  return snap.data() as Student;
};

export const updateStudent = async (
  orgId: string,
  studentId: string,
  data: Partial<Student>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const studentRef = doc(db, "organizations", orgId, "students", studentId);
  
  // Guard permanent student ID from modification
  const { studentId: _permanentId, createdAt: _created, createdBy: _by, ...safeUpdates } = data as any;

  await updateDoc(studentRef, {
    ...safeUpdates,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STUDENT_UPDATED",
    entityType: "STUDENT",
    entityId: studentId,
    metadata: {
      updatedFields: Object.keys(safeUpdates),
    },
  });
};

export const deactivateStudent = async (
  orgId: string,
  studentId: string,
  status: "INACTIVE" | "TRANSFERRED" | "WITHDRAWN",
  reason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const studentRef = doc(db, "organizations", orgId, "students", studentId);
  await updateDoc(studentRef, {
    status,
    deactivationReason: reason,
    deactivatedAt: new Date().toISOString(),
    deactivatedBy: actor.uid,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STUDENT_DEACTIVATED",
    entityType: "STUDENT",
    entityId: studentId,
    metadata: { status, reason },
  });
};

export const listStudents = async (
  orgId: string,
  filters?: StudentListFilters
): Promise<Student[]> => {
  const studentsCol = collection(db, "organizations", orgId, "students");
  let q = query(studentsCol, orderBy("createdAt", "desc"), firestoreLimit(100));

  if (filters?.sessionId) {
    q = query(studentsCol, where("academic.sessionId", "==", filters.sessionId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Student);

  // Apply in-memory multi-attribute filters & search efficiently
  if (filters?.classId) {
    list = list.filter((s) => s.academic.classId === filters.classId || s.academic.className === filters.classId);
  }
  if (filters?.sectionId) {
    list = list.filter((s) => s.academic.sectionId === filters.sectionId || s.academic.sectionName === filters.sectionId);
  }
  if (filters?.gender) {
    list = list.filter((s) => s.gender === filters.gender);
  }
  if (filters?.status) {
    list = list.filter((s) => s.status === filters.status);
  }
  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    const term = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.studentId.toLowerCase().includes(term) ||
        s.admissionNumber?.toLowerCase().includes(term) ||
        s.contact.mobile?.includes(term)
    );
  }

  return list;
};

export const getStudentCount = async (orgId: string, sessionId?: string): Promise<{ total: number; active: number }> => {
  const studentsCol = collection(db, "organizations", orgId, "students");
  let q = query(studentsCol);
  if (sessionId) {
    q = query(studentsCol, where("academic.sessionId", "==", sessionId));
  }
  const snap = await getDocs(q);
  const students = snap.docs.map((d) => d.data() as Student);
  const active = students.filter((s) => s.status === "ACTIVE").length;
  return {
    total: students.length,
    active,
  };
};

export const getStudentsBySection = async (
  orgId: string,
  classId: string,
  sectionId: string
): Promise<Student[]> => {
  return listStudents(orgId, { classId, sectionId, status: "ACTIVE" });
};
