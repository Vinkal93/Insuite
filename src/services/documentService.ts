import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  limit as firestoreLimit,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type {
  DocumentType,
  DocumentTemplate,
  IssuedDocument,
  DocumentJob,
  DocumentSettingsConfig,
  DocumentDashboardStats,
} from "@/types/document";
import { createAuditLog } from "./auditService";

export interface StudentKycDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  storagePath: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export const uploadStudentDocument = async (
  orgId: string,
  studentId: string,
  file: File,
  type: string,
  actor: { uid: string; name: string }
): Promise<StudentKycDocument> => {
  const docCol = collection(db, "organizations", orgId, "students", studentId, "documents");
  const newDocRef = doc(docCol);
  const now = new Date().toISOString();
  const filePath = `organizations/${orgId}/students/${studentId}/documents/${newDocRef.id}_${file.name}`;
  const sRef = storageRef(storage, filePath);

  await uploadBytes(sRef, file);
  const downloadUrl = await getDownloadURL(sRef);

  const docItem: StudentKycDocument = {
    id: newDocRef.id,
    name: file.name,
    type,
    url: downloadUrl,
    storagePath: filePath,
    size: file.size,
    uploadedAt: now,
    uploadedBy: actor.name,
  };

  await setDoc(newDocRef, docItem);
  return docItem;
};

export const getStudentDocuments = async (
  orgId: string,
  studentId: string
): Promise<StudentKycDocument[]> => {
  const docCol = collection(db, "organizations", orgId, "students", studentId, "documents");
  const snaps = await getDocs(docCol);
  return snaps.docs.map((d) => d.data() as StudentKycDocument);
};

export const deleteStudentDocument = async (
  orgId: string,
  studentId: string,
  documentId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "students", studentId, "documents", documentId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data() as StudentKycDocument;
    if (data.storagePath) {
      try {
        const sRef = storageRef(storage, data.storagePath);
        await deleteObject(sRef);
      } catch (err) {
        console.warn("deleteObject error:", err);
      }
    }
  }
  await deleteDoc(docRef);
};

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettingsConfig = {
  certificatePrefix: "INS-CERT",
  idCardPrefix: "INS-ID",
  nextCertSequence: 1,
  nextIdSequence: 1,
  defaultSignatoryName: "Principal",
  defaultSignatoryDesignation: "Head of Institution",
};

// ----------------------------------------------------
// SETTINGS & UNIQUE NUMBER GENERATOR (TRANSACTIONAL)
// ----------------------------------------------------

export const getDocumentSettings = async (orgId: string): Promise<DocumentSettingsConfig> => {
  const ref = doc(db, "organizations", orgId, "documentSettings", "config");
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_DOCUMENT_SETTINGS;
  return { ...DEFAULT_DOCUMENT_SETTINGS, ...snap.data() } as DocumentSettingsConfig;
};

export const updateDocumentSettings = async (
  orgId: string,
  settings: Partial<DocumentSettingsConfig>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "documentSettings", "config");
  await setDoc(ref, settings, { merge: true });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SETTINGS_UPDATED",
    entityType: "DOCUMENT_SETTINGS",
    entityId: "config",
    metadata: settings,
  });
};

export const generateUniqueDocumentNumber = async (
  orgId: string,
  type: "CERT" | "ID"
): Promise<string> => {
  const settingsRef = doc(db, "organizations", orgId, "documentSettings", "config");
  const year = new Date().getFullYear();

  let generatedNumber = "";

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(settingsRef);
    let currentConfig = snap.exists()
      ? (snap.data() as DocumentSettingsConfig)
      : { ...DEFAULT_DOCUMENT_SETTINGS };

    if (type === "CERT") {
      const seq = currentConfig.nextCertSequence || 1;
      const prefix = currentConfig.certificatePrefix || "INS-CERT";
      generatedNumber = `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
      transaction.set(settingsRef, { ...currentConfig, nextCertSequence: seq + 1 }, { merge: true });
    } else {
      const seq = currentConfig.nextIdSequence || 1;
      const prefix = currentConfig.idCardPrefix || "INS-ID";
      generatedNumber = `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
      transaction.set(settingsRef, { ...currentConfig, nextIdSequence: seq + 1 }, { merge: true });
    }
  });

  return generatedNumber;
};

// ----------------------------------------------------
// DOCUMENT TYPES
// ----------------------------------------------------

export const DEFAULT_DOCUMENT_TYPES: Omit<DocumentType, "id" | "organizationId" | "createdAt">[] = [
  {
    name: "Bonafide Certificate",
    code: "BONAFIDE",
    personType: "STUDENT",
    requiredFields: ["studentName", "admissionNumber", "className"],
    status: "ACTIVE",
  },
  {
    name: "Transfer Certificate (TC)",
    code: "TRANSFER",
    personType: "STUDENT",
    requiredFields: ["studentName", "admissionNumber", "className", "reason"],
    status: "ACTIVE",
  },
  {
    name: "Character Certificate",
    code: "CHARACTER",
    personType: "STUDENT",
    requiredFields: ["studentName", "admissionNumber", "className"],
    status: "ACTIVE",
  },
  {
    name: "Student ID Card",
    code: "STUDENT_ID",
    personType: "STUDENT",
    requiredFields: ["studentName", "admissionNumber", "className", "rollNumber"],
    status: "ACTIVE",
  },
  {
    name: "Staff ID Card",
    code: "STAFF_ID",
    personType: "STAFF",
    requiredFields: ["staffName", "employeeId", "designation"],
    status: "ACTIVE",
  },
  {
    name: "Experience Certificate",
    code: "EXPERIENCE",
    personType: "STAFF",
    requiredFields: ["staffName", "employeeId", "designation", "joiningDate"],
    status: "ACTIVE",
  },
];

export const listDocumentTypes = async (orgId: string): Promise<DocumentType[]> => {
  const col = collection(db, "organizations", orgId, "documentTypes");
  const snaps = await getDocs(col);
  if (snaps.empty) {
    // Seed default types
    const now = new Date().toISOString();
    const seeded: DocumentType[] = [];
    for (const dt of DEFAULT_DOCUMENT_TYPES) {
      const newDoc = doc(col);
      const item: DocumentType = {
        ...dt,
        id: newDoc.id,
        organizationId: orgId,
        createdAt: now,
      };
      await setDoc(newDoc, item);
      seeded.push(item);
    }
    return seeded;
  }
  return snaps.docs.map((d) => d.data() as DocumentType);
};

export const createDocumentType = async (
  orgId: string,
  input: Omit<DocumentType, "id" | "organizationId" | "createdAt">,
  actor: { uid: string; name: string }
): Promise<DocumentType> => {
  const col = collection(db, "organizations", orgId, "documentTypes");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const docType: DocumentType = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDoc, docType);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_TYPE_CREATED",
    entityType: "DOCUMENT_TYPE",
    entityId: newDoc.id,
    metadata: { name: docType.name, code: docType.code },
  });

  return docType;
};

// ----------------------------------------------------
// DOCUMENT TEMPLATES
// ----------------------------------------------------

export const DEFAULT_TEMPLATES: Omit<DocumentTemplate, "id" | "organizationId" | "createdAt">[] = [
  {
    name: "Standard Bonafide Certificate Template",
    documentType: "BONAFIDE",
    personType: "STUDENT",
    pageSize: "A4",
    orientation: "PORTRAIT",
    headerTitle: "BONAFIDE CERTIFICATE",
    headerSubtitle: "TO WHOMSOEVER IT MAY CONCERN",
    bodyContent: `This is to certify that **{{studentName}}**, son/daughter of **{{fatherName}}**, is a bonafide student of this institution studying in **Class {{className}} (Section {{sectionName}})** bearing Admission Number **{{admissionNumber}}** and Roll Number **{{rollNumber}}** during the academic year **{{academicSession}}**.\n\nAccording to school records, his/her date of birth is **{{dateOfBirth}}**. His/Her conduct and character during his/her tenure in the school have been **Good**.\n\nThis certificate is issued on request for educational purposes.`,
    footerContent: "Authorized Signatory • Seal of Institution",
    watermarkText: "ORIGINAL",
    status: "ACTIVE",
  },
  {
    name: "Transfer Certificate (TC) Standard",
    documentType: "TRANSFER",
    personType: "STUDENT",
    pageSize: "A4",
    orientation: "PORTRAIT",
    headerTitle: "TRANSFER CERTIFICATE",
    headerSubtitle: "OFFICIAL LEAVING RECORD",
    bodyContent: `1. Name of Student: **{{studentName}}**\n2. Father's/Guardian's Name: **{{fatherName}}**\n3. Mother's Name: **{{motherName}}**\n4. Admission Number: **{{admissionNumber}}**\n5. Class in which student was last studying: **Class {{className}} ({{sectionName}})**\n6. Academic Session: **{{academicSession}}**\n7. Whether student has paid all school dues: **Yes, cleared**\n8. General Conduct: **Satisfactory**\n9. Date of Application for Certificate: **{{issueDate}}**\n10. Reason for leaving the school: **On Parent Request**`,
    footerContent: "Class Teacher Signatory • Principal Signatory",
    watermarkText: "OFFICIAL TC",
    status: "ACTIVE",
  },
  {
    name: "Character & Conduct Certificate",
    documentType: "CHARACTER",
    personType: "STUDENT",
    pageSize: "A4",
    orientation: "PORTRAIT",
    headerTitle: "CHARACTER CERTIFICATE",
    headerSubtitle: "INSTITUTIONAL RECOMMENDATION",
    bodyContent: `This is to certify that **{{studentName}}**, bearing Admission Number **{{admissionNumber}}**, has been a student of **Class {{className}}** in our institution during the academic term **{{academicSession}}**.\n\nDuring his/her stay at our institution, he/she has displayed exemplary moral character, diligence in academics, and an obedient disposition. He/She has not participated in any adverse disciplinary actions.\n\nWe wish him/her the best in all future endeavors.`,
    footerContent: "Head of Institution • School Seal",
    status: "ACTIVE",
  },
  {
    name: "Standard Student ID Card (Front/Back)",
    documentType: "STUDENT_ID",
    personType: "STUDENT",
    pageSize: "CUSTOM_ID",
    orientation: "LANDSCAPE",
    headerTitle: "STUDENT IDENTITY CARD",
    bodyContent: `Student Name: **{{studentName}}**\nAdmission No: **{{admissionNumber}}**\nClass & Sec: **{{className}} - {{sectionName}}**\nRoll No: **{{rollNumber}}**\nAcademic Term: **{{academicSession}}**\nEmergency Contact: **{{emergencyPhone}}**`,
    footerContent: "This card is non-transferable and remains property of the school.",
    status: "ACTIVE",
  },
];

export const listDocumentTemplates = async (
  orgId: string,
  filters?: { documentType?: string; personType?: string }
): Promise<DocumentTemplate[]> => {
  const col = collection(db, "organizations", orgId, "documentTemplates");
  const snaps = await getDocs(col);

  if (snaps.empty) {
    // Seed initial default templates
    const now = new Date().toISOString();
    const seeded: DocumentTemplate[] = [];
    for (const tmpl of DEFAULT_TEMPLATES) {
      const newDoc = doc(col);
      const item: DocumentTemplate = {
        ...tmpl,
        id: newDoc.id,
        organizationId: orgId,
        createdAt: now,
      };
      await setDoc(newDoc, item);
      seeded.push(item);
    }
    return seeded;
  }

  let list = snaps.docs.map((d) => d.data() as DocumentTemplate);

  if (filters?.documentType) {
    list = list.filter((t) => t.documentType === filters.documentType);
  }
  if (filters?.personType) {
    list = list.filter((t) => t.personType === filters.personType);
  }

  return list;
};

export const getDocumentTemplate = async (
  orgId: string,
  templateId: string
): Promise<DocumentTemplate | null> => {
  const ref = doc(db, "organizations", orgId, "documentTemplates", templateId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as DocumentTemplate;
};

export const createDocumentTemplate = async (
  orgId: string,
  input: Omit<DocumentTemplate, "id" | "organizationId" | "createdAt">,
  actor: { uid: string; name: string }
): Promise<DocumentTemplate> => {
  const col = collection(db, "organizations", orgId, "documentTemplates");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const tmpl: DocumentTemplate = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDoc, tmpl);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TEMPLATE_CREATED",
    entityType: "DOCUMENT_TEMPLATE",
    entityId: newDoc.id,
    metadata: { name: tmpl.name, documentType: tmpl.documentType },
  });

  return tmpl;
};

export const updateDocumentTemplate = async (
  orgId: string,
  templateId: string,
  input: Partial<DocumentTemplate>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "documentTemplates", templateId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    ...input,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TEMPLATE_UPDATED",
    entityType: "DOCUMENT_TEMPLATE",
    entityId: templateId,
    metadata: input,
  });
};

// ----------------------------------------------------
// TEMPLATE COMPILER (SAFE VARIABLE SUBSTITUTION)
// ----------------------------------------------------

export const compileTemplateVariables = (
  templateString: string,
  variables: Record<string, string | number | undefined>
): string => {
  let result = templateString;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, String(value !== undefined && value !== null ? value : "—"));
  }
  return result;
};

// ----------------------------------------------------
// DOCUMENT ISSUANCE & REVOCATION
// ----------------------------------------------------

export const issueDocument = async (
  orgId: string,
  input: {
    documentTypeId: string;
    documentTypeName: string;
    templateId: string;
    templateName?: string;
    personType: "STUDENT" | "STAFF";
    personId: string;
    personName: string;
    personIdentifier: string;
    academicSessionId?: string;
    academicSessionName?: string;
    className?: string;
    sectionName?: string;
    variables: Record<string, string | number | undefined>;
  },
  actor: { uid: string; name: string }
): Promise<IssuedDocument> => {
  const tmpl = await getDocumentTemplate(orgId, input.templateId);
  if (!tmpl) {
    throw new Error("Selected document template was not found.");
  }

  const documentNumber = await generateUniqueDocumentNumber(
    orgId,
    input.personType === "STUDENT" && tmpl.documentType === "STUDENT_ID" ? "ID" : "CERT"
  );

  const issueDate = new Date().toISOString().split("T")[0];

  const enrichedVariables = {
    ...input.variables,
    documentNumber,
    issueDate,
    personName: input.personName,
    studentName: input.personName,
    staffName: input.personName,
    admissionNumber: input.personIdentifier,
    employeeId: input.personIdentifier,
    className: input.className || "",
    sectionName: input.sectionName || "",
    academicSession: input.academicSessionName || "",
  };

  const compiledContent = compileTemplateVariables(tmpl.bodyContent, enrichedVariables);

  const col = collection(db, "organizations", orgId, "issuedDocuments");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const issuedDoc: IssuedDocument = {
    id: newDoc.id,
    organizationId: orgId,
    documentTypeId: input.documentTypeId,
    documentTypeName: input.documentTypeName,
    templateId: input.templateId,
    templateName: tmpl.name,
    personType: input.personType,
    personId: input.personId,
    personName: input.personName,
    personIdentifier: input.personIdentifier,
    documentNumber,
    academicSessionId: input.academicSessionId,
    academicSessionName: input.academicSessionName,
    className: input.className,
    sectionName: input.sectionName,
    issueDate,
    status: "ISSUED",
    compiledContent,
    verificationEnabled: true,
    verificationUrl: `/verify/${documentNumber}`,
    issuedBy: actor.name,
    issuedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDoc, issuedDoc);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_ISSUED",
    entityType: "ISSUED_DOCUMENT",
    entityId: newDoc.id,
    metadata: {
      documentNumber,
      personName: input.personName,
      type: input.documentTypeName,
    },
  });

  return issuedDoc;
};

export const revokeDocument = async (
  orgId: string,
  documentId: string,
  revocationReason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "issuedDocuments", documentId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status: "REVOKED",
    revokedAt: now,
    revokedBy: actor.name,
    revocationReason,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_REVOKED",
    entityType: "ISSUED_DOCUMENT",
    entityId: documentId,
    metadata: { revocationReason },
  });
};

export const listIssuedDocuments = async (
  orgId: string,
  filters?: {
    personId?: string;
    personType?: string;
    status?: string;
    search?: string;
  }
): Promise<IssuedDocument[]> => {
  const col = collection(db, "organizations", orgId, "issuedDocuments");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as IssuedDocument);

  if (filters?.personId) {
    list = list.filter((d) => d.personId === filters.personId);
  }
  if (filters?.personType) {
    list = list.filter((d) => d.personType === filters.personType);
  }
  if (filters?.status) {
    list = list.filter((d) => d.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.personName.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.documentTypeName.toLowerCase().includes(q) ||
        d.personIdentifier.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getIssuedDocument = async (
  orgId: string,
  documentId: string
): Promise<IssuedDocument | null> => {
  const ref = doc(db, "organizations", orgId, "issuedDocuments", documentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as IssuedDocument;
};

// ----------------------------------------------------
// PUBLIC DOCUMENT VERIFICATION
// ----------------------------------------------------

export interface PublicVerificationResult {
  isValid: boolean;
  isRevoked: boolean;
  documentNumber: string;
  documentTypeName: string;
  personName: string;
  personIdentifier: string;
  issueDate: string;
  status: string;
  revocationReason?: string;
}

export const verifyDocumentPublic = async (
  orgId: string,
  documentNumber: string
): Promise<PublicVerificationResult | null> => {
  const col = collection(db, "organizations", orgId, "issuedDocuments");
  const q = query(col, where("documentNumber", "==", documentNumber), firestoreLimit(1));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docData = snap.docs[0].data() as IssuedDocument;

  return {
    isValid: docData.status === "ISSUED",
    isRevoked: docData.status === "REVOKED",
    documentNumber: docData.documentNumber,
    documentTypeName: docData.documentTypeName,
    personName: docData.personName,
    personIdentifier: docData.personIdentifier,
    issueDate: docData.issueDate,
    status: docData.status,
    revocationReason: docData.revocationReason,
  };
};

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------

export const getDocumentDashboardStats = async (
  orgId: string
): Promise<DocumentDashboardStats> => {
  const col = collection(db, "organizations", orgId, "issuedDocuments");
  const snaps = await getDocs(col);
  const docs = snaps.docs.map((d) => d.data() as IssuedDocument);

  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  const certs = docs.filter((d) => d.documentTypeName !== "Student ID Card" && d.documentTypeName !== "Staff ID Card");
  const idCards = docs.filter((d) => d.documentTypeName === "Student ID Card" || d.documentTypeName === "Staff ID Card");

  return {
    certificatesIssuedCount: certs.filter((d) => d.status === "ISSUED").length,
    certificatesThisMonthCount: certs.filter((d) => d.issueDate.startsWith(currentMonth)).length,
    idCardsGeneratedCount: idCards.length,
    documentsVerifiedCount: docs.filter((d) => d.verificationEnabled).length,
    revokedDocumentsCount: docs.filter((d) => d.status === "REVOKED").length,
  };
};
