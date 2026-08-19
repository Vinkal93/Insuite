export type AuditAction =
  | "STUDENT_CREATED"
  | "STUDENT_UPDATED"
  | "STUDENT_DEACTIVATED"
  | "PARENT_CREATED"
  | "PARENT_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  | "TIMETABLE_CREATED"
  | "TIMETABLE_UPDATED"
  | "TIMETABLE_DELETED"
  | "ROOM_CREATED"
  | "ROOM_UPDATED"
  | "PERIOD_CREATED"
  | "PERIOD_UPDATED"
  | "SUBSTITUTION_CREATED"
  | "SUBSTITUTION_UPDATED"
  | "SUBSTITUTION_CANCELLED";

export type AuditEntityType =
  | "STUDENT"
  | "PARENT"
  | "DOCUMENT"
  | "SCHOOL"
  | "TIMETABLE"
  | "ROOM"
  | "PERIOD"
  | "SUBSTITUTION";

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
