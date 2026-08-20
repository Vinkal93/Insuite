export type DocumentPersonType = "STUDENT" | "STAFF";

export type DocumentPageSize = "A4" | "CUSTOM_ID";

export type DocumentOrientation = "PORTRAIT" | "LANDSCAPE";

export type IssuedDocumentStatus = "DRAFT" | "GENERATED" | "ISSUED" | "REVOKED";

export type DocumentJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "PARTIALLY_FAILED" | "FAILED";

export interface DocumentType {
  id: string;
  organizationId: string;
  name: string; // e.g. "Bonafide Certificate", "Transfer Certificate", "Student ID Card"
  code: string; // e.g. "BONAFIDE", "TC", "STUDENT_ID"
  personType: DocumentPersonType;
  requiredFields: string[]; // e.g. ["admissionNumber", "className", "rollNumber"]
  templateIds?: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt?: string;
}

export interface SignatureConfig {
  name: string;
  designation: string;
  signatureUrl?: string;
}

export interface QrConfig {
  enabled: boolean;
  size?: number;
}

export interface DocumentTemplate {
  id: string;
  organizationId: string;
  name: string;
  documentType: string; // DocumentType code or name
  personType: DocumentPersonType;
  pageSize: DocumentPageSize;
  orientation: DocumentOrientation;
  headerTitle?: string;
  headerSubtitle?: string;
  bodyContent: string; // Template string with {{variable}} placeholders
  footerContent?: string;
  watermarkText?: string;
  signatureConfig?: SignatureConfig;
  qrConfig?: QrConfig;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt?: string;
}

export interface IssuedDocument {
  id: string;
  organizationId: string;
  documentTypeId: string;
  documentTypeName: string;
  templateId: string;
  templateName?: string;
  
  personType: DocumentPersonType;
  personId: string;
  personName: string;
  personIdentifier: string; // admissionNumber for student, employeeId for staff
  
  documentNumber: string; // e.g. "INS-CERT-2026-000001"
  
  academicSessionId?: string;
  academicSessionName?: string;
  className?: string;
  sectionName?: string;
  
  issueDate: string; // YYYY-MM-DD
  status: IssuedDocumentStatus;
  
  compiledContent: string; // HTML/formatted text snapshot
  storagePath?: string;
  fileUrl?: string;
  
  verificationEnabled: boolean;
  verificationUrl?: string;
  
  issuedBy: string;
  issuedAt: string;
  
  revokedBy?: string;
  revokedAt?: string;
  revocationReason?: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentJob {
  id: string;
  organizationId: string;
  type: "BULK_CERTIFICATE" | "BULK_ID_CARD";
  requestedBy: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: DocumentJobStatus;
  errors?: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DocumentSettingsConfig {
  certificatePrefix: string; // e.g. "INS-CERT"
  idCardPrefix: string; // e.g. "INS-ID"
  nextCertSequence: number; // e.g. 1
  nextIdSequence: number; // e.g. 1
  defaultSignatoryName: string; // e.g. "Dr. Principal"
  defaultSignatoryDesignation: string; // e.g. "Principal & Head of Institution"
  signatureUrl?: string;
  stampUrl?: string;
  qrVerificationBaseUrl?: string;
}

export interface DocumentDashboardStats {
  certificatesIssuedCount: number;
  certificatesThisMonthCount: number;
  idCardsGeneratedCount: number;
  documentsVerifiedCount: number;
  revokedDocumentsCount: number;
}
