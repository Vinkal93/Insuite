export type ExamStatus =
  | "Draft"
  | "Scheduled"
  | "Ongoing"
  | "Completed"
  | "Result Processing"
  | "Published"
  | "Archived";

export interface Exam {
  id: string;
  organizationId: string;
  academicSessionId: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: ExamStatus;
  classIds: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type ScheduleStatus = "Scheduled" | "Completed" | "Cancelled";

export interface ExamSchedule {
  id: string;
  organizationId: string;
  examId: string;
  examName?: string;
  academicSessionId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  roomId?: string;
  roomName?: string;
  date: string;
  startTime: string;
  endTime: string;
  instructions?: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSubject {
  id: string;
  organizationId: string;
  examId: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  maximumMarks: number;
  passingMarks: number;
  theoryMarks?: number;
  practicalMarks?: number;
  weightage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamMark {
  id: string;
  organizationId: string;
  examId: string;
  examSubjectId: string;
  subjectId: string;
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  admissionNumber?: string;
  rollNumber?: string;
  classId: string;
  sectionId: string;
  maximumMarks: number;
  marksObtained: number | null;
  absent: boolean;
  remarks?: string;
  status: "Entered" | "Verified" | "Locked";
  enteredBy: string;
  enteredByName?: string;
  enteredAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  maximumMarks: number;
  marksObtained: number | null;
  absent: boolean;
  percentage: number;
  grade: string;
  gradePoint: number;
  passed: boolean;
  remarks?: string;
}

export type ResultStatus = "Pass" | "Fail" | "Absent" | "Incomplete";

export interface ExamResult {
  id: string;
  organizationId: string;
  examId: string;
  examName: string;
  academicSessionId: string;
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  admissionNumber?: string;
  rollNumber?: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  totalMaximum: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  resultStatus: ResultStatus;
  subjectResults: SubjectResult[];
  status: "draft" | "processed" | "verified" | "published";
  publishedAt?: string;
  publishedBy?: string;
  publishedByName?: string;
  rank?: number;
  unlockedAt?: string;
  unlockedBy?: string;
  unlockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeRule {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  description?: string;
}

export interface GradingScale {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  grades: GradeRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamSettingsConfig {
  examTypes: string[];
  defaultPassingPercentage: number;
  requireAllSubjectsPass: boolean;
  enableRankings: boolean;
  showAttendanceOnReportCard: boolean;
  reportCardHeaderNote?: string;
  reportCardFooterNote?: string;
}

export interface ExamDashboardStats {
  totalExams: number;
  activeExamsCount: number;
  upcomingExamsCount: number;
  completedExamsCount: number;
  marksPendingCount: number;
  resultsPublishedCount: number;
}

export interface ExamRankingItem {
  rank: number;
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  admissionNumber?: string;
  rollNumber?: string;
  className: string;
  sectionName: string;
  totalMaximum: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  resultStatus: ResultStatus;
}
