export interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  subtext: string;
  isConfigured: boolean;
  delta?: string;
  status?: "positive" | "negative" | "neutral";
}

export interface DashboardMetrics {
  totalStudents: MetricCardData;
  totalTeachers: MetricCardData;
  todayAttendance: MetricCardData;
  todayCollection: MetricCardData;
  pendingFees: MetricCardData;
  newAdmissions: MetricCardData;
  activeClasses: MetricCardData;
  activeSections: MetricCardData;
}

export interface SetupChecklistItem {
  key: string;
  label: string;
  isCompleted: boolean;
  route?: string;
}

export interface SetupProgressData {
  percentage: number;
  items: SetupChecklistItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  type: "profile" | "session" | "branding" | "security" | "system";
}

export interface DashboardAlertItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  actionLabel: string;
  actionRoute: string;
}
