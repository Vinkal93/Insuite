export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "leave";

export type PersonType = "student" | "staff";

export interface AttendanceRecord {
  id: string; // Deterministic: `${orgId}_${personType}_${personId}_${date}`
  organizationId: string;
  academicSessionId: string;
  personType: PersonType;
  personId: string;
  personName: string;
  rollNumber?: string;
  admissionNumber?: string;
  employeeId?: string;
  photoUrl?: string | null;
  date: string; // YYYY-MM-DD
  classId?: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  department?: string;
  designation?: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy: string;
  markedByName?: string;
  updatedAt?: string;
  updatedBy?: string;
  changeReason?: string;
  remarks?: string;
}

export type LeaveType = "casual" | "sick" | "earned" | "maternity" | "unpaid" | "other";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type LeaveApplicantType = "teacher" | "staff" | "student";

export interface LeaveRequest {
  id: string;
  organizationId: string;
  academicSessionId: string;
  applicantId: string;
  applicantName: string;
  applicantType: LeaveApplicantType;
  applicantRole?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  reason: string;
  attachmentUrl?: string | null;
  status: LeaveStatus;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSettingsConfig {
  defaultAttendanceStatus: AttendanceStatus;
  lateThresholdTime: string; // e.g. "08:30"
  halfDayThresholdHours: number; // e.g. 4
  allowAttendanceEditing: boolean;
  requireReasonForChange: boolean;
  enableParentNotification: boolean;
  workingDays: string[];
}

export interface AttendanceDashboardStats {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  leaveStudents: number;
  notMarkedStudents: number;
  attendancePercentage: number;
  totalStaff: number;
  presentStaff: number;
  absentStaff: number;
  leaveStaff: number;
  pendingLeaveRequests: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  admissionNumber?: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
  records: AttendanceRecord[];
}

export interface AttendanceAuditLog {
  id: string;
  organizationId: string;
  attendanceId: string;
  personName: string;
  date: string;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  reason: string;
}
