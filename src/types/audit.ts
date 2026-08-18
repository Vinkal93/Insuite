export type AuditAction =
  | "STUDENT_CREATED"
  | "STUDENT_UPDATED"
  | "STUDENT_DEACTIVATED"
  | "PARENT_CREATED"
  | "PARENT_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED";

export type AuditEntityType = "STUDENT" | "PARENT" | "DOCUMENT" | "SCHOOL";

export interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
