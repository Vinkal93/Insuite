import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  AttendanceSettingsConfig,
  AttendanceDashboardStats,
  StudentAttendanceSummary,
  AttendanceAuditLog,
} from "@/types";
import type {
  BulkStudentAttendanceInput,
  BulkStaffAttendanceInput,
  LeaveRequestInput,
  AttendanceSettingsInput,
} from "@/schemas";
import { getSchoolClassById, getSectionById } from "./academicService";
import { getStudentCount } from "./studentService";
import { getTeachers } from "./academicService";

const DEFAULT_SETTINGS: AttendanceSettingsConfig = {
  defaultAttendanceStatus: "present",
  lateThresholdTime: "08:30",
  halfDayThresholdHours: 4,
  allowAttendanceEditing: true,
  requireReasonForChange: true,
  enableParentNotification: false,
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/**
 * Generate deterministic Document ID for single day attendance
 */
export function getAttendanceDocId(personType: string, personId: string, date: string): string {
  return `${personType}_${personId}_${date}`;
}

// ----------------------------------------------------
// ATTENDANCE SETTINGS
// ----------------------------------------------------

export async function getAttendanceSettings(organizationId: string): Promise<AttendanceSettingsConfig> {
  try {
    const docRef = doc(db, "organizations", organizationId, "attendanceSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return DEFAULT_SETTINGS;
    }
    return snap.data() as AttendanceSettingsConfig;
  } catch (error) {
    console.error("getAttendanceSettings error:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateAttendanceSettings(
  organizationId: string,
  input: AttendanceSettingsInput,
  updatedBy: string
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "attendanceSettings", "config");
  await setDoc(
    docRef,
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy,
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// STUDENT ATTENDANCE
// ----------------------------------------------------

/**
 * Query student attendance records for a specific date, class, and section
 */
export async function getStudentAttendanceForDate(
  organizationId: string,
  date: string,
  classId?: string,
  sectionId?: string,
  academicSessionId?: string
): Promise<AttendanceRecord[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "attendance");
    let q = query(
      collRef,
      where("personType", "==", "student"),
      where("date", "==", date)
    );

    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }
    if (classId) {
      q = query(q, where("classId", "==", classId));
    }
    if (sectionId) {
      q = query(q, where("sectionId", "==", sectionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AttendanceRecord);
  } catch (error) {
    console.error("getStudentAttendanceForDate error:", error);
    return [];
  }
}

/**
 * Save or update bulk student attendance records
 */
export async function saveBulkStudentAttendance(
  organizationId: string,
  input: BulkStudentAttendanceInput,
  markedBy: string,
  markedByName: string = "Admin"
): Promise<{ savedCount: number }> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // Fetch Class and Section names for indexing
  let className = "Class";
  let sectionName = "Section";
  try {
    const [cls, sec] = await Promise.all([
      getSchoolClassById(organizationId, input.classId),
      getSectionById(organizationId, input.sectionId),
    ]);
    if (cls) className = cls.name;
    if (sec) sectionName = sec.name;
  } catch (e) {
    // ignore
  }

  for (const entry of input.entries) {
    const docId = getAttendanceDocId("student", entry.personId, input.date);
    const docRef = doc(db, "organizations", organizationId, "attendance", docId);

    const record: AttendanceRecord = {
      id: docId,
      organizationId,
      academicSessionId: input.academicSessionId,
      personType: "student",
      personId: entry.personId,
      personName: entry.personName,
      rollNumber: entry.rollNumber || "",
      admissionNumber: entry.admissionNumber || "",
      photoUrl: entry.photoUrl || null,
      date: input.date,
      classId: input.classId,
      className,
      sectionId: input.sectionId,
      sectionName,
      status: entry.status,
      markedAt: now,
      markedBy,
      markedByName,
      updatedAt: now,
      updatedBy: markedBy,
      remarks: entry.remarks || "",
    };

    batch.set(docRef, record, { merge: true });
  }

  await batch.commit();
  return { savedCount: input.entries.length };
}

/**
 * Update single attendance record with audit reason
 */
export async function updateSingleAttendanceStatus(
  organizationId: string,
  recordId: string,
  newStatus: AttendanceStatus,
  changeReason: string,
  updatedBy: string,
  updatedByName: string = "Admin"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "attendance", recordId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error("Attendance record not found");
  }

  const existing = snap.data() as AttendanceRecord;
  const now = new Date().toISOString();

  // Update attendance record
  await updateDoc(docRef, {
    status: newStatus,
    changeReason,
    updatedAt: now,
    updatedBy,
  });

  // Log to audit collection
  const auditRef = doc(collection(db, "organizations", organizationId, "attendanceAuditLogs"));
  const auditData: AttendanceAuditLog = {
    id: auditRef.id,
    organizationId,
    attendanceId: recordId,
    personName: existing.personName,
    date: existing.date,
    oldStatus: existing.status,
    newStatus,
    changedBy: updatedBy,
    changedByName: updatedByName,
    changedAt: now,
    reason: changeReason,
  };
  await setDoc(auditRef, auditData);
}

// ----------------------------------------------------
// STAFF ATTENDANCE
// ----------------------------------------------------

/**
 * Query staff attendance records for a specific date
 */
export async function getStaffAttendanceForDate(
  organizationId: string,
  date: string,
  academicSessionId?: string
): Promise<AttendanceRecord[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "attendance");
    let q = query(
      collRef,
      where("personType", "==", "staff"),
      where("date", "==", date)
    );

    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AttendanceRecord);
  } catch (error) {
    console.error("getStaffAttendanceForDate error:", error);
    return [];
  }
}

/**
 * Save or update bulk staff attendance records
 */
export async function saveBulkStaffAttendance(
  organizationId: string,
  input: BulkStaffAttendanceInput,
  markedBy: string,
  markedByName: string = "Admin"
): Promise<{ savedCount: number }> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const entry of input.entries) {
    const docId = getAttendanceDocId("staff", entry.personId, input.date);
    const docRef = doc(db, "organizations", organizationId, "attendance", docId);

    const record: AttendanceRecord = {
      id: docId,
      organizationId,
      academicSessionId: input.academicSessionId,
      personType: "staff",
      personId: entry.personId,
      personName: entry.personName,
      employeeId: entry.employeeId || "",
      photoUrl: entry.photoUrl || null,
      date: input.date,
      status: entry.status,
      markedAt: now,
      markedBy,
      markedByName,
      updatedAt: now,
      updatedBy: markedBy,
      remarks: entry.remarks || "",
    };

    batch.set(docRef, record, { merge: true });
  }

  await batch.commit();
  return { savedCount: input.entries.length };
}

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------

export async function getAttendanceDashboardStats(
  organizationId: string,
  date: string,
  academicSessionId?: string
): Promise<AttendanceDashboardStats> {
  try {
    const [studentRecords, staffRecords, studentCountData, teachersList, pendingLeavesSnap] = await Promise.all([
      getStudentAttendanceForDate(organizationId, date, undefined, undefined, academicSessionId),
      getStaffAttendanceForDate(organizationId, date, academicSessionId),
      getStudentCount(organizationId, academicSessionId).catch(() => ({ total: 0, active: 0 })),
      getTeachers(organizationId, "active").catch(() => []),
      getDocs(
        query(
          collection(db, "organizations", organizationId, "leaveRequests"),
          where("status", "==", "pending")
        )
      ).catch(() => ({ docs: [] })),
    ]);

    const totalStudents = studentCountData.active || studentCountData.total;
    const presentStudents = studentRecords.filter((r) => r.status === "present").length;
    const absentStudents = studentRecords.filter((r) => r.status === "absent").length;
    const lateStudents = studentRecords.filter((r) => r.status === "late").length;
    const leaveStudents = studentRecords.filter((r) => r.status === "leave" || r.status === "half_day").length;
    const markedStudentsTotal = studentRecords.length;
    const notMarkedStudents = Math.max(0, totalStudents - markedStudentsTotal);

    const attendancePercentage =
      markedStudentsTotal > 0 ? Math.round(((presentStudents + lateStudents) / markedStudentsTotal) * 100) : 0;

    const totalStaff = teachersList.length;
    const presentStaff = staffRecords.filter((r) => r.status === "present").length;
    const absentStaff = staffRecords.filter((r) => r.status === "absent").length;
    const leaveStaff = staffRecords.filter((r) => r.status === "leave" || r.status === "half_day").length;

    return {
      totalStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      leaveStudents,
      notMarkedStudents,
      attendancePercentage,
      totalStaff,
      presentStaff,
      absentStaff,
      leaveStaff,
      pendingLeaveRequests: pendingLeavesSnap.docs.length,
    };
  } catch (error) {
    console.error("getAttendanceDashboardStats error:", error);
    return {
      totalStudents: 0,
      presentStudents: 0,
      absentStudents: 0,
      lateStudents: 0,
      leaveStudents: 0,
      notMarkedStudents: 0,
      attendancePercentage: 0,
      totalStaff: 0,
      presentStaff: 0,
      absentStaff: 0,
      leaveStaff: 0,
      pendingLeaveRequests: 0,
    };
  }
}

// ----------------------------------------------------
// STUDENT PROFILE ATTENDANCE HISTORY
// ----------------------------------------------------

export async function getStudentAttendanceHistory(
  organizationId: string,
  studentId: string,
  academicSessionId?: string
): Promise<AttendanceRecord[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "attendance");
    let q = query(
      collRef,
      where("personType", "==", "student"),
      where("personId", "==", studentId)
    );

    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }

    const snap = await getDocs(q);
    const records = snap.docs.map((d) => d.data() as AttendanceRecord);
    return records.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error("getStudentAttendanceHistory error:", error);
    return [];
  }
}

export async function getStudentAttendanceSummary(
  organizationId: string,
  studentId: string,
  academicSessionId?: string
): Promise<StudentAttendanceSummary> {
  const records = await getStudentAttendanceHistory(organizationId, studentId, academicSessionId);

  const totalDays = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const leave = records.filter((r) => r.status === "leave" || r.status === "half_day").length;
  const percentage = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

  return {
    studentId,
    studentName: records[0]?.personName || "Student",
    rollNumber: records[0]?.rollNumber,
    admissionNumber: records[0]?.admissionNumber,
    totalDays,
    present,
    absent,
    late,
    leave,
    percentage,
    records,
  };
}

// ----------------------------------------------------
// LEAVE MANAGEMENT
// ----------------------------------------------------

export async function createLeaveRequest(
  organizationId: string,
  input: LeaveRequestInput,
  applicantId: string,
  applicantName: string,
  applicantType: "teacher" | "staff" | "student" = "teacher",
  applicantRole: string = "Faculty",
  department: string = "General",
  academicSessionId: string = ""
): Promise<LeaveRequest> {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const docRef = doc(collection(db, "organizations", organizationId, "leaveRequests"));
  const now = new Date().toISOString();

  const newLeave: LeaveRequest = {
    id: docRef.id,
    organizationId,
    academicSessionId,
    applicantId,
    applicantName,
    applicantType,
    applicantRole,
    department,
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    days: calculatedDays,
    reason: input.reason,
    attachmentUrl: input.attachmentUrl || null,
    status: "pending",
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, newLeave);
  return newLeave;
}

export async function getLeaveRequests(
  organizationId: string,
  statusFilter?: string,
  applicantId?: string
): Promise<LeaveRequest[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "leaveRequests");
    let q = query(collRef, orderBy("createdAt", "desc"), limit(100));

    if (statusFilter && statusFilter !== "all") {
      q = query(collRef, where("status", "==", statusFilter), limit(100));
    }
    if (applicantId) {
      q = query(collRef, where("applicantId", "==", applicantId), limit(100));
    }

    const snap = await getDocs(q);
    const leaves = snap.docs.map((d) => d.data() as LeaveRequest);
    return leaves.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error("getLeaveRequests error:", error);
    return [];
  }
}

export async function approveOrRejectLeaveRequest(
  organizationId: string,
  leaveId: string,
  status: "approved" | "rejected",
  rejectionReason: string | undefined,
  approvedBy: string,
  approvedByName: string = "Admin"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "leaveRequests", leaveId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Leave request not found");

  const leave = snap.data() as LeaveRequest;
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status,
    rejectionReason: status === "rejected" ? rejectionReason : null,
    approvedBy,
    approvedByName,
    approvedAt: now,
    updatedAt: now,
  });

  // If approved, automatically propagate leave status to attendance records across dates
  if (status === "approved") {
    try {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const batch = writeBatch(db);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const personType = leave.applicantType === "student" ? "student" : "staff";
        const attDocId = getAttendanceDocId(personType, leave.applicantId, dateStr);
        const attRef = doc(db, "organizations", organizationId, "attendance", attDocId);

        const attRecord: AttendanceRecord = {
          id: attDocId,
          organizationId,
          academicSessionId: leave.academicSessionId,
          personType,
          personId: leave.applicantId,
          personName: leave.applicantName,
          date: dateStr,
          status: "leave",
          markedAt: now,
          markedBy: approvedBy,
          markedByName,
          updatedAt: now,
          updatedBy: approvedBy,
          remarks: `Approved ${leave.leaveType} leave`,
        };

        batch.set(attRef, attRecord, { merge: true });
      }

      await batch.commit();
    } catch (err) {
      console.warn("Failed to propagate approved leave to attendance records:", err);
    }
  }
}

// ----------------------------------------------------
// PHASE 12 ALIASES & HELPERS
// ----------------------------------------------------

export const getStaffAttendanceRecords = getStaffAttendanceForDate;
export const saveStaffAttendanceRecords = saveBulkStaffAttendance;
export const applyLeaveRequest = createLeaveRequest;

export async function getPendingLeaveRequests(organizationId: string): Promise<LeaveRequest[]> {
  return getLeaveRequests(organizationId, "pending");
}

export async function approveLeaveRequest(
  organizationId: string,
  leaveRequestId: string,
  approvedBy: string,
  approvedByName?: string
): Promise<void> {
  return approveOrRejectLeaveRequest(
    organizationId,
    leaveRequestId,
    "approved",
    approvedBy,
    approvedByName
  );
}

export async function rejectLeaveRequest(
  organizationId: string,
  leaveRequestId: string,
  rejectedBy: string,
  rejectedByName?: string,
  rejectionReason?: string
): Promise<void> {
  return approveOrRejectLeaveRequest(
    organizationId,
    leaveRequestId,
    "rejected",
    rejectedBy,
    rejectedByName,
    rejectionReason
  );
}

