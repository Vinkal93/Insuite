import type { Organization, AcademicSession } from "@/types";
import type {
  DashboardMetrics,
  SetupProgressData,
  ActivityItem,
  DashboardAlertItem,
} from "../types";

export const getDashboardMetrics = async (
  _orgId: string,
  _sessionId?: string
): Promise<DashboardMetrics> => {
  // In Phase 2, we report real zero/unconfigured states without fabricating data.
  // Future modules in subsequent phases will query real collections.
  return {
    totalStudents: {
      id: "students",
      title: "Total Students",
      value: 0,
      subtext: "No students enrolled yet",
      isConfigured: false,
    },
    totalTeachers: {
      id: "teachers",
      title: "Total Teachers",
      value: 0,
      subtext: "No faculty assigned yet",
      isConfigured: false,
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
      value: 0,
      subtext: "Session enquiries & intake",
      isConfigured: false,
    },
    activeClasses: {
      id: "classes",
      title: "Active Classes",
      value: 0,
      subtext: "Nursery to Grade 12",
      isConfigured: false,
    },
    activeSections: {
      id: "sections",
      title: "Active Sections",
      value: 0,
      subtext: "Section divisions",
      isConfigured: false,
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
