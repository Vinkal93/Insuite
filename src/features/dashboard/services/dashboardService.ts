import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Organization, AcademicSession, DayOfWeek } from "@/types";
import { getStudentCount, listStudents } from "@/services/studentService";
import { getTeachers, getSchoolClasses, getSections, getSubjects } from "@/services/academicService";
import { getAttendanceDashboardStats } from "@/services/attendanceService";
import {
  getAdmissionDashboardStats,
  listEnquiries,
  listApplications,
  listAdmissions,
} from "@/services/admissionService";
import { getAcademicWorkStats } from "@/services/academicWorkService";
import { getRecentAuditLogs } from "@/services/auditService";
import type {
  Dashboard2KPIs,
  TodayAtSchoolData,
  AttendanceOverviewData,
  AdmissionsFunnelData,
  FeeSnapshotData,
  ClassDistributionItem,
  TodayTimetableItem,
  AttentionItem,
  UpcomingEventItem,
  SetupProgressData,
  ActivityItem,
} from "../types";

const DAYS_MAP: DayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function fetchDashboard2KPIs(
  orgId: string,
  sessionId?: string
): Promise<Dashboard2KPIs> {
  const todayStr = new Date().toISOString().split("T")[0];
  const dayOfWeek = DAYS_MAP[new Date().getDay()];

  const [
    studentCountData,
    teachersList,
    attendanceStats,
    admissionStats,
    academicWorkStats,
    timetableDocs,
  ] = await Promise.all([
    getStudentCount(orgId, sessionId).catch(() => ({ total: 0, active: 0 })),
    getTeachers(orgId, "active").catch(() => []),
    getAttendanceDashboardStats(orgId, todayStr, sessionId).catch(() => null),
    getAdmissionDashboardStats(orgId, sessionId).catch(() => null),
    getAcademicWorkStats(orgId, sessionId).catch(() => null),
    getDocs(
      query(
        collection(db, "organizations", orgId, "timetableEntries"),
        where("dayOfWeek", "==", dayOfWeek),
        limit(50)
      )
    ).catch(() => ({ docs: [] })),
  ]);

  const totalStudents = studentCountData.active || studentCountData.total || 0;
  const totalTeachers = teachersList.length;

  let attendancePercentage: number | null = null;
  let presentStudents = 0;
  let totalAttended = 0;

  if (attendanceStats && (attendanceStats.presentStudents > 0 || attendanceStats.absentStudents > 0)) {
    presentStudents = attendanceStats.presentStudents;
    totalAttended = attendanceStats.totalStudents;
    attendancePercentage =
      totalAttended > 0 ? Math.round((presentStudents / totalAttended) * 1000) / 10 : 0;
  }

  const newAdmissionsCount = admissionStats?.admissionsCompleted || 0;
  const pendingEnquiriesCount = admissionStats?.pendingFollowUps || admissionStats?.totalEnquiries || 0;
  const activeAssignmentsCount = academicWorkStats?.activeAssignments || 0;
  const needsGradingCount = academicWorkStats?.needsGrading || 0;
  const scheduledPeriodsCount = timetableDocs.docs.length;

  return {
    totalStudents: {
      value: totalStudents,
      subtext: totalStudents > 0 ? "Active Students" : "No students enrolled",
    },
    totalTeachers: {
      value: totalTeachers,
      subtext: totalTeachers > 0 ? "Active Teaching Staff" : "No faculty added",
    },
    todayAttendance: {
      percentage: attendancePercentage,
      present: presentStudents,
      total: totalAttended,
      isConfigured: attendanceStats !== null,
    },
    pendingFees: {
      value: null,
      overdue: null,
      isConfigured: false, // Will activate in Phase 9 Fees module
    },
    newAdmissions: {
      value: newAdmissionsCount,
      subtext: "This session",
    },
    pendingEnquiries: {
      value: pendingEnquiriesCount,
      subtext: pendingEnquiriesCount > 0 ? "Requires follow-up" : "All follow-ups clear",
    },
    assignments: {
      value: activeAssignmentsCount,
      needsGrading: needsGradingCount,
    },
    todaySchedule: {
      periodsCount: scheduledPeriodsCount,
      subtext: scheduledPeriodsCount > 0 ? `${scheduledPeriodsCount} classes today` : "No classes scheduled",
    },
  };
}

export async function fetchTodayAtSchool(
  orgId: string,
  totalStudents: number,
  totalTeachers: number
): Promise<TodayAtSchoolData> {
  const todayStr = new Date().toISOString().split("T")[0];
  const dayOfWeek = DAYS_MAP[new Date().getDay()];

  const [studentAtt, staffAtt, timetableDocs] = await Promise.all([
    getAttendanceDashboardStats(orgId, todayStr).catch(() => null),
    getDocs(
      query(
        collection(db, "organizations", orgId, "attendance"),
        where("date", "==", todayStr),
        where("personType", "==", "staff")
      )
    ).catch(() => ({ docs: [] })),
    getDocs(
      query(
        collection(db, "organizations", orgId, "timetableEntries"),
        where("dayOfWeek", "==", dayOfWeek)
      )
    ).catch(() => ({ docs: [] })),
  ]);

  const hasAttendance = !!studentAtt && studentAtt.totalStudents > 0;
  const studentsPresent = studentAtt?.presentStudents || 0;
  const studentsAbsent = (studentAtt?.absentStudents || 0) + (studentAtt?.leaveStudents || 0);
  const studentsNotMarked = Math.max(0, totalStudents - (studentAtt?.totalStudents || 0));

  const staffDocs = staffAtt.docs.map((d) => d.data());
  const teachersPresent = staffDocs.filter((d: any) => d.status === "PRESENT" || d.status === "LATE" || d.status === "present").length;
  const teachersAbsent = staffDocs.filter((d: any) => d.status === "ABSENT" || d.status === "ON_LEAVE" || d.status === "absent").length;

  const classesScheduled = timetableDocs.docs.length;

  return {
    studentsPresent,
    studentsAbsent,
    studentsNotMarked,
    teachersPresent,
    teachersAbsent,
    classesScheduled,
    periodsCompleted: Math.min(classesScheduled, Math.max(0, Math.floor(classesScheduled * 0.4))),
    hasAttendance,
  };
}

export async function fetchAttendanceOverview(orgId: string): Promise<AttendanceOverviewData> {
  const todayStr = new Date().toISOString().split("T")[0];
  const stats = await getAttendanceDashboardStats(orgId, todayStr).catch(() => null);

  if (!stats || stats.totalStudents === 0) {
    return {
      percentage: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      hasData: false,
    };
  }

  const percentage = Math.round((stats.presentStudents / stats.totalStudents) * 1000) / 10;
  return {
    percentage,
    present: stats.presentStudents,
    absent: stats.absentStudents,
    late: stats.lateStudents,
    leave: stats.leaveStudents,
    hasData: true,
  };
}

export async function fetchAdmissionsFunnel(
  orgId: string,
  sessionId?: string
): Promise<AdmissionsFunnelData> {
  const [enquiries, applications, admissions] = await Promise.all([
    listEnquiries(orgId, { sessionId }).catch(() => []),
    listApplications(orgId, { sessionId }).catch(() => []),
    listAdmissions(orgId, { sessionId }).catch(() => []),
  ]);

  const contacted = enquiries.filter(
    (e) => e.status === "CONTACTED" || e.status === "COUNSELLING_SCHEDULED" || e.status === "APPLICATION_SUBMITTED" || e.status === "ADMITTED"
  ).length;

  const counselling = enquiries.filter(
    (e) => e.status === "COUNSELLING_SCHEDULED" || e.status === "APPLICATION_SUBMITTED" || e.status === "ADMITTED"
  ).length;

  const underReview = applications.filter((a) => a.status === "UNDER_REVIEW" || a.status === "SUBMITTED").length;
  const approved = applications.filter((a) => a.status === "APPROVED" || a.status === "OFFERED" || a.status === "ADMITTED").length;
  const admitted = admissions.length;

  return {
    enquiries: enquiries.length,
    contacted,
    counselling,
    applications: applications.length,
    underReview,
    approved,
    admitted,
  };
}

export async function fetchStudentDistribution(
  orgId: string,
  sessionId?: string
): Promise<ClassDistributionItem[]> {
  const [classes, students] = await Promise.all([
    getSchoolClasses(orgId, sessionId).catch(() => []),
    listStudents(orgId, { sessionId, status: "ACTIVE" }).catch(() => []),
  ]);

  return classes.map((c) => {
    const count = students.filter(
      (s) => s.academic.classId === c.id || s.academic.className === c.name
    ).length;
    return {
      classId: c.id,
      className: c.name,
      count,
    };
  });
}

export async function fetchTodayTimetable(orgId: string): Promise<TodayTimetableItem[]> {
  const dayOfWeek = DAYS_MAP[new Date().getDay()];
  const snap = await getDocs(
    query(
      collection(db, "organizations", orgId, "timetableEntries"),
      where("dayOfWeek", "==", dayOfWeek),
      limit(6)
    )
  ).catch(() => ({ docs: [] }));

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      time: `${data.startTime || "09:00"} - ${data.endTime || "09:45"}`,
      className: data.className || "Class",
      sectionName: data.sectionName || "A",
      subjectName: data.subjectName || "Subject",
      teacherName: data.teacherName || "Teacher",
      roomName: data.roomName || "Main Hall",
    };
  });
}

export async function fetchAttentionRequired(
  orgId: string,
  sessionId?: string
): Promise<AttentionItem[]> {
  const items: AttentionItem[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const [attStats, enqs, apps, acStats] = await Promise.all([
      getAttendanceDashboardStats(orgId, todayStr, sessionId).catch(() => null),
      listEnquiries(orgId, { sessionId, status: "HOT" }).catch(() => []),
      listApplications(orgId, { sessionId, status: "UNDER_REVIEW" }).catch(() => []),
      getAcademicWorkStats(orgId, sessionId).catch(() => null),
    ]);

    if (!attStats || attStats.totalStudents === 0) {
      items.push({
        id: "att_unmarked",
        title: "Daily Attendance Pending",
        description: "Student roll call has not been recorded yet today.",
        count: 1,
        severity: "error",
        actionRoute: "/attendance/students/take",
      });
    }

    if (enqs.length > 0) {
      items.push({
        id: "hot_enquiries",
        title: `${enqs.length} High-Priority Enquiries`,
        description: "Enquiries requiring prompt admission coordinator response.",
        count: enqs.length,
        severity: "warning",
        actionRoute: "/admissions/enquiries",
      });
    }

    if (apps.length > 0) {
      items.push({
        id: "apps_review",
        title: `${apps.length} Applications Under Review`,
        description: "Documents and eligibility verification required.",
        count: apps.length,
        severity: "warning",
        actionRoute: "/admissions/applications",
      });
    }

    if (acStats && acStats.needsGrading > 0) {
      items.push({
        id: "needs_grading",
        title: `${acStats.needsGrading} Submissions Need Grading`,
        description: "Student homework tasks awaiting marks and feedback.",
        count: acStats.needsGrading,
        severity: "info",
        actionRoute: "/academic-work/grading",
      });
    }
  } catch (e) {
    // Non-fatal
  }

  return items;
}

export async function fetchRecentActivities(orgId: string): Promise<ActivityItem[]> {
  const logs = await getRecentAuditLogs(orgId, 6).catch(() => []);
  return logs.map((l) => ({
    id: l.id,
    action: l.action.replace(/_/g, " "),
    description: l.metadata?.name || l.metadata?.title || `${l.entityType} ${l.entityId.slice(0, 6)}`,
    user: l.actorName || "Admin",
    timestamp: l.timestamp,
  }));
}

export async function fetchSetupProgress(
  orgId: string,
  organization: Organization | null
): Promise<SetupProgressData> {
  const [sessions, classes, sections, subjects, teachers] = await Promise.all([
    getDocs(collection(db, "organizations", orgId, "academicSessions")).catch(() => ({ docs: [] })),
    getDocs(collection(db, "organizations", orgId, "classes")).catch(() => ({ docs: [] })),
    getDocs(collection(db, "organizations", orgId, "sections")).catch(() => ({ docs: [] })),
    getDocs(collection(db, "organizations", orgId, "subjects")).catch(() => ({ docs: [] })),
    getDocs(collection(db, "organizations", orgId, "teachers")).catch(() => ({ docs: [] })),
  ]);

  const checklist = [
    { key: "school_info", label: "School Information", isCompleted: !!organization?.name && !!organization?.code, route: "/setup" },
    { key: "branding", label: "School Branding & Colors", isCompleted: !!organization?.primaryColor, route: "/setup" },
    { key: "session", label: "Academic Session", isCompleted: sessions.docs.length > 0, route: "/academics/sessions" },
    { key: "classes", label: "Class Grades", isCompleted: classes.docs.length > 0, route: "/academics/classes" },
    { key: "sections", label: "Class Sections", isCompleted: sections.docs.length > 0, route: "/academics/sections" },
    { key: "subjects", label: "Subject Curriculum", isCompleted: subjects.docs.length > 0, route: "/academics/subjects" },
    { key: "teachers", label: "Faculty & Staff", isCompleted: teachers.docs.length > 0, route: "/academics/teachers" },
  ];

  const completedCount = checklist.filter((item) => item.isCompleted).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);

  return {
    percentage,
    isComplete: percentage === 100,
    items: checklist,
  };
}
