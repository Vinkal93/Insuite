/**
 * InSuite Core Domain Models & RBAC Types
 */

export type Organization = {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  subdomain: string;
  branches: Branch[];
  currentSessionId: string;
  createdAt: string;
};

export type Branch = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isMainCampus: boolean;
};

export type AcademicSession = {
  id: string;
  organizationId: string;
  name: string; // e.g. "2026-27"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export type UserRole =
  | "super_admin"
  | "school_owner"
  | "principal"
  | "vice_principal"
  | "administrator"
  | "accountant"
  | "hr_manager"
  | "academic_coordinator"
  | "exam_coordinator"
  | "teacher"
  | "class_teacher"
  | "receptionist"
  | "librarian"
  | "transport_manager"
  | "parent"
  | "student";

export type PermissionKey =
  | "admissions.manage"
  | "students.view"
  | "students.edit"
  | "academics.manage"
  | "attendance.mark"
  | "attendance.reports"
  | "timetable.manage"
  | "homework.assign"
  | "exams.manage"
  | "exams.marks_entry"
  | "fees.collect"
  | "fees.defaulters_view"
  | "communication.broadcast"
  | "hr.leaves_approve"
  | "documents.generate"
  | "reports.export"
  | "settings.system";

export type StudentProfile = {
  id: string;
  organizationId: string;
  branchId: string;
  sessionId: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
  sectionName: string;
  parentId: string;
  attendancePercentage: number;
  feeStatus: "paid" | "partial" | "overdue";
};

export type ParentAccount = {
  id: string;
  organizationId: string;
  parentName: string;
  phone: string;
  email: string;
  children: {
    studentId: string;
    name: string;
    className: string;
    sectionName: string;
    avatarUrl?: string;
  }[];
};

export type DashboardAlert = {
  id: string;
  type: "fee_defaulters" | "consecutive_absentees" | "pending_leaves" | "pending_marks_entry";
  title: string;
  description: string;
  count: number;
  actionLabel: string;
  actionUrl: string;
  severity: "critical" | "warning" | "info";
};

export type SetupWizardStep = {
  step: number;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
};
