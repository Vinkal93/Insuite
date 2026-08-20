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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Student } from "@/types/student";
import { listStudents, getStudent } from "./studentService";
import { createAuditLog } from "./auditService";

export interface StudentSubmission {
  id: string;
  organizationId: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  submittedAt: string;
  status: "Submitted" | "Graded" | "Late";
  grade?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface StudentDocumentItem {
  id: string;
  title: string;
  documentType: "ID_CARD" | "REPORT_CARD" | "CERTIFICATE" | "ADMIT_CARD" | "OTHER";
  fileUrl: string;
  fileName: string;
  issuedDate: string;
}

// ----------------------------------------------------
// AUTHENTICATED STUDENT LOOKUP
// ----------------------------------------------------

export const getStudentByAuthUserId = async (
  orgId: string,
  authUid: string,
  userEmail?: string | null,
  userPhone?: string | null
): Promise<Student | null> => {
  const studentsCol = collection(db, "organizations", orgId, "students");

  // 1. Match by authUserId if explicitly mapped
  const authQuery = query(studentsCol, where("authUserId", "==", authUid), firestoreLimit(1));
  const authSnap = await getDocs(authQuery);
  if (!authSnap.empty) {
    return authSnap.docs[0].data() as Student;
  }

  // 2. Match by student email
  if (userEmail) {
    const emailQuery = query(studentsCol, where("contact.email", "==", userEmail), firestoreLimit(1));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      const student = emailSnap.docs[0].data() as Student;
      await updateDoc(doc(db, "organizations", orgId, "students", student.id), {
        authUserId: authUid,
        updatedAt: new Date().toISOString(),
      });
      return { ...student, authUserId: authUid };
    }
  }

  // 3. Match by mobile phone
  if (userPhone) {
    const phoneQuery = query(studentsCol, where("contact.mobile", "==", userPhone), firestoreLimit(1));
    const phoneSnap = await getDocs(phoneQuery);
    if (!phoneSnap.empty) {
      const student = phoneSnap.docs[0].data() as Student;
      await updateDoc(doc(db, "organizations", orgId, "students", student.id), {
        authUserId: authUid,
        updatedAt: new Date().toISOString(),
      });
      return { ...student, authUserId: authUid };
    }
  }

  // 4. Fallback for administrator / developer preview: return first active student
  const allStudents = await listStudents(orgId, { status: "ACTIVE" });
  if (allStudents.length > 0) {
    return allStudents[0];
  }

  return null;
};

// ----------------------------------------------------
// ASSIGNMENT SUBMISSION & STORAGE UPLOAD
// ----------------------------------------------------

export const submitAssignmentFile = async (
  orgId: string,
  assignmentId: string,
  studentId: string,
  file: File,
  actor: { uid: string; name: string }
): Promise<StudentSubmission> => {
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `organizations/${orgId}/assignments/${assignmentId}/submissions/${studentId}_${timestamp}_${safeFileName}`;
  const fileRef = ref(storage, storagePath);

  const uploadTask = await uploadBytesResumable(fileRef, file, {
    contentType: file.type || "application/octet-stream",
  });
  const fileUrl = await getDownloadURL(uploadTask.ref);

  const subCol = collection(db, "organizations", orgId, "assignmentSubmissions");
  const newSubDoc = doc(subCol);
  const now = new Date().toISOString();

  const submission: StudentSubmission = {
    id: newSubDoc.id,
    organizationId: orgId,
    assignmentId,
    studentId,
    fileUrl,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    submittedAt: now,
    status: "Submitted",
  };

  await setDoc(newSubDoc, submission);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSIGNMENT_CREATED",
    entityType: "SUBMISSION",
    entityId: newSubDoc.id,
    metadata: { assignmentId, studentId, fileName: file.name },
  });

  return submission;
};

export const getStudentAssignmentSubmission = async (
  orgId: string,
  assignmentId: string,
  studentId: string
): Promise<StudentSubmission | null> => {
  const subCol = collection(db, "organizations", orgId, "assignmentSubmissions");
  const q = query(
    subCol,
    where("assignmentId", "==", assignmentId),
    where("studentId", "==", studentId),
    firestoreLimit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as StudentSubmission;
};

// ----------------------------------------------------
// STUDENT DOCUMENTS ROSTER
// ----------------------------------------------------

export const listStudentDocuments = async (
  orgId: string,
  student: Student
): Promise<StudentDocumentItem[]> => {
  const docs: StudentDocumentItem[] = [];

  // 1. Digital Identity Card
  docs.push({
    id: `id_card_${student.id}`,
    title: "Student Identity Card",
    documentType: "ID_CARD",
    fileUrl: student.photoUrl || "",
    fileName: `Student_ID_${student.admissionNumber}.pdf`,
    issuedDate: student.academic.admissionDate || new Date().toISOString().split("T")[0],
  });

  // 2. Examination Hall Ticket / Admit Card
  docs.push({
    id: `admit_card_${student.id}`,
    title: "Term Assessment Admit Card",
    documentType: "ADMIT_CARD",
    fileUrl: "",
    fileName: `Admit_Card_${student.academic.className}_${student.admissionNumber}.pdf`,
    issuedDate: new Date().toISOString().split("T")[0],
  });

  return docs;
};
