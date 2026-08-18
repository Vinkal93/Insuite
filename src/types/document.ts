export type DocumentType =
  | "BIRTH_CERTIFICATE"
  | "PREVIOUS_MARKSHEET"
  | "TRANSFER_CERTIFICATE"
  | "PHOTO_ID"
  | "OTHER";

export type DocumentStatus = "ACTIVE" | "DELETED";

export interface StudentDocument {
  id: string;
  studentId: string;
  organizationId: string;
  documentType: DocumentType;
  fileName: string;
  storagePath: string;
  downloadUrl: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}
