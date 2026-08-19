import type { Organization, AcademicSession } from "@/types";
import { getStudentCount } from "@/services/studentService";
import { getAdmissionDashboardStats } from "@/services/admissionService";
import {
  getSchoolClasses,
  getSections,
  getTeachers,
} from "@/services/academicService";
import type {
  DashboardMetrics,
  SetupProgressData,
  ActivityItem,
  DashboardAlertItem,
} from "../types";

export const getDashboardMetrics = async (
  orgId: string,
  sessionId?: string
): Promise<DashboardMetrics> => {
  let studentCountData = { total: 0, active: 0 };
  let admissionStatsData = { admissionsCompleted: 0, totalEnquiries: 0 };
  let teachersCount = 0;
  let classesCount = 0;
  let sectionsCount = 0;

  try {
    const [sc, adm, teachers, classes, sections] = await Promise.all([
      getStudentCount(orgId, sessionId).catch(() => ({ total: 0, active: 0 })),
      getAdmissionDashboardStats(orgId, sessionId).catch(() => ({ admissionsCompleted: 0, totalEnquiries: 0 })),
      getTeachers(orgId, "active").catch(() => []),
      getSchoolClasses(orgId, sessionId).catch(() => []),
      getSections(orgId, undefined, sessionId).catch(() => []),
    ]);

    studentCountData = sc;
    admissionStatsData = adm as any;
    teachersCount = teachers.length;
    classesCount = classes.length;
    sectionsCount = sections.length;
  } catch (e) {
    console.warn("Failed to fetch dashboard metric counts:", e);
  }

  return {
    totalStudents: {
      id: "students",
      title: "Total Students",
      value: studentCountData.total,
      subtext: studentCountData.total > 0 ? `${studentCountData.active} active students` : "No students enrolled yet",
      isConfigured: studentCountData.total > 0,
    },
    totalTeachers: {
      id: "teachers",
      title: "Total Teachers",
      value: teachersCount,
      subtext: teachersCount > 0 ? `${teachersCount} faculty educators` : "No faculty assigned yet",
      isConfigured: teachersCount > 0,
    },
    todayAttendance: {
      id: "attendance",
      title: "Today's Attendance",
      value: "Not configured",
      subtext: "Module unlocks in Phase 6",
      isConfigured: false,
    },
    todayCollection: {
      id: "collection",
      title: "Today's Collection",
      value: "Not configured",
      subtext: "Fee module unlocks in Phase 9",
      isConfigured: false,
    },
    pendingFees: {
      id: "pending_fees",
      title: "Pending Fees",
      value: "Not configured",
      subtext: "Fee module unlocks in Phase 9",
      isConfigured: false,
    },
    newAdmissions: {
      id: "admissions",
      title: "New Admissions",
      value: admissionStatsData.admissionsCompleted,
      subtext: admissionStatsData.admissionsCompleted > 0
        ? `${admissionStatsData.admissionsCompleted} completed • ${admissionStatsData.totalEnquiries} enquiries`
        : "No admissions finalized yet",
      isConfigured: admissionStatsData.admissionsCompleted > 0,
    },
    activeClasses: {
      id: "classes",
      title: "Active Classes",
      value: classesCount,
      subtext: classesCount > 0 ? `${classesCount} grade levels configured` : "No classes added yet",
      isConfigured: classesCount > 0,
    },
    activeSections: {
      id: "sections",
      title: "Active Sections",
      value: sectionsCount,
      subtext: sectionsCount > 0 ? `${sectionsCount} classrooms active` : "Section divisions",
      isConfigured: sectionsCount > 0,
    },
  };
};

export const calculateSetupProgress = (
  organization: Organization | null,
  activeSession: AcademicSession | null
): SetupProgressData => {
  const hasSchoolInfo = !!(organization?.name && organization?.code);
  const hasBranding = !!(organization?.primaryColor || organization?.logoUrl);
  const hasSession = !!activeSession;
  const hasClasses = false; // Phase 3
  const hasSections = false; // Phase 3
  const hasSubjects = false; // Phase 3
  const hasTeachers = false; // Phase 5

  const items = [
    { key: "info", label: "School Information", isCompleted: hasSchoolInfo, route: "/settings" },
    { key: "branding", label: "Branding & Logo", isCompleted: hasBranding, route: "/settings" },
    { key: "session", label: "Academic Session", isCompleted: hasSession, route: "/settings" },
    { key: "classes", label: "Classes", isCompleted: hasClasses },
    { key: "sections", label: "Sections", isCompleted: hasSections },
    { key: "subjects", label: "Subjects", isCompleted: hasSubjects },
    { key: "teachers", label: "Teachers", isCompleted: hasTeachers },
  ];

  const completedCount = items.filter((i) => i.isCompleted).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return {
    percentage,
    items,
  };
};

export const getRecentActivities = async (organization: Organization | null): Promise<ActivityItem[]> => {
  const activities: ActivityItem[] = [];

  if (organization?.createdAt) {
    activities.push({
      id: "act-1",
      action: "School Registered",
      description: `${organization.name} organization initialized on InSuite`,
      user: organization.principalName || "Admin",
      timestamp: "Recently",
      type: "system",
    });
  }

  if (organization?.logoUrl) {
    activities.push({
      id: "act-2",
      action: "Branding Assets Uploaded",
      description: "Official institutional crest & colors configured",
      user: "Admin",
      timestamp: "Recently",
      type: "branding",
    });
  }

  activities.push({
    id: "act-3",
    action: "Academic Calendar Initialized",
    description: "Session parameters established for tenant isolation",
    user: "System",
    timestamp: "Recently",
    type: "session",
  });

  return activities;
};

export const getDerivedAlerts = (
  organization: Organization | null,
  activeSession: AcademicSession | null
): DashboardAlertItem[] => {
  const alerts: DashboardAlertItem[] = [];

  if (!organization?.logoUrl) {
    alerts.push({
      id: "alert-logo",
      title: "School Logo Pending",
      description: "Upload an official crest for report cards and invoices.",
      severity: "info",
      actionLabel: "Upload Logo",
      actionRoute: "/settings",
    });
  }

  if (!activeSession) {
    alerts.push({
      id: "alert-session",
      title: "No Active Academic Session",
      description: "Set up an active academic calendar session to scope student records.",
      severity: "warning",
      actionLabel: "Configure Session",
      actionRoute: "/settings",
    });
  }

  alerts.push({
    id: "alert-setup",
    title: "Phase 1 Setup Active",
    description: "Institutional foundation is live. Academic and class structures will unlock next.",
    severity: "info",
    actionLabel: "View Settings",
    actionRoute: "/settings",
  });

  return alerts;
};
