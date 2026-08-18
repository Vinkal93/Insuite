import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { StudentDocument, DocumentType } from "@/types";
import { createAuditLog } from "./auditService";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadStudentDocument = async (
  orgId: string,
  studentId: string,
  file: File,
  documentType: DocumentType,
  actor: { uid: string; name: string }
): Promise<StudentDocument> => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only PDF, JPG, PNG, and WebP are allowed.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds 5MB limit.");
  }

  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `organizations/${orgId}/students/${studentId}/documents/${docId}/${cleanFileName}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file);
  const downloadUrl = await getDownloadURL(fileRef);

  const docData: StudentDocument = {
    id: docId,
    studentId,
    organizationId: orgId,
    documentType,
    fileName: file.name,
    storagePath,
    downloadUrl,
    mimeType: file.type,
    fileSize: file.size,
    status: "ACTIVE",
    uploadedBy: actor.uid,
    uploadedByName: actor.name,
    uploadedAt: new Date().toISOString(),
  };

  const docRef = doc(db, "organizations", orgId, "students", studentId, "documents", docId);
  await setDoc(docRef, docData);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_UPLOADED",
    entityType: "DOCUMENT",
    entityId: docId,
    metadata: { studentId, documentType, fileName: file.name },
  });

  return docData;
};

export const getStudentDocuments = async (
  orgId: string,
  studentId: string
): Promise<StudentDocument[]> => {
  const docsCol = collection(db, "organizations", orgId, "students", studentId, "documents");
  const q = query(docsCol, where("status", "==", "ACTIVE"), orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as StudentDocument);
};

export const deleteStudentDocument = async (
  orgId: string,
  studentId: string,
  documentId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "students", studentId, "documents", documentId);
  await updateDoc(docRef, {
    status: "DELETED",
    deletedAt: new Date().toISOString(),
    deletedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_DELETED",
    entityType: "DOCUMENT",
    entityId: documentId,
    metadata: { studentId },
  });
};
