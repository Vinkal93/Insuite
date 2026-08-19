export interface Dashboard2KPIs {
  totalStudents: {
    value: number;
    subtext: string;
  };
  totalTeachers: {
    value: number;
    subtext: string;
  };
  todayAttendance: {
    percentage: number | null;
    present: number;
    total: number;
    isConfigured: boolean;
  };
  pendingFees: {
    value: string | null;
    overdue: string | null;
    isConfigured: boolean;
  };
  newAdmissions: {
    value: number;
    subtext: string;
  };
  pendingEnquiries: {
    value: number;
    subtext: string;
  };
  assignments: {
    value: number;
    needsGrading: number;
  };
  todaySchedule: {
    periodsCount: number;
    subtext: string;
  };
}

export interface TodayAtSchoolData {
  studentsPresent: number;
  studentsAbsent: number;
  studentsNotMarked: number;
  teachersPresent: number;
  teachersAbsent: number;
  classesScheduled: number;
  periodsCompleted: number;
  hasAttendance: boolean;
}

export interface AttendanceOverviewData {
  percentage: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  hasData: boolean;
}

export interface AdmissionsFunnelData {
  enquiries: number;
  contacted: number;
  counselling: number;
  applications: number;
  underReview: number;
  approved: number;
  admitted: number;
}

export interface FeeSnapshotData {
  isConfigured: boolean;
  totalExpected: string;
  collected: string;
  pending: string;
  overdue: string;
  percentageCollected: number;
}

export interface ClassDistributionItem {
  classId: string;
  className: string;
  count: number;
}

export interface TodayTimetableItem {
  id: string;
  time: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  roomName: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: "error" | "warning" | "info";
  actionRoute: string;
}

export interface UpcomingEventItem {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
}

export interface SetupChecklistItem {
  key: string;
  label: string;
  isCompleted: boolean;
  route?: string;
}

export interface SetupProgressData {
  percentage: number;
  isComplete: boolean;
  items: SetupChecklistItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
}
