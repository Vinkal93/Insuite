export type AssignmentType =
  | "Homework"
  | "Classwork"
  | "Project"
  | "Worksheet"
  | "Practice"
  | "Other";

export type AssignmentStatus = "draft" | "published" | "closed" | "archived";

export type TargetStudentType = "ALL_STUDENTS" | "SELECTED_STUDENTS";

export type GradeType = "Marks" | "Grade" | "Percentage" | "Rubric";

export interface AssignmentAttachment {
  id?: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface AssignmentGradingConfig {
  enabled: boolean;
  maximumMarks?: number;
  passingMarks?: number;
  gradeType?: GradeType;
}

export interface Assignment {
  id: string;
  organizationId: string;
  academicSessionId: string;
  title: string;
  description: string;
  type: AssignmentType;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  targetType: TargetStudentType;
  assignedStudentIds?: string[];
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  instructions: string;
  attachments?: AssignmentAttachment[];
  grading: AssignmentGradingConfig;
  status: AssignmentStatus;
  publishedAt?: string;
  publishedBy?: string;
  submissionsCount?: number;
  gradedCount?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type SubmissionStatus =
  | "Pending"
  | "Submitted"
  | "Late"
  | "Needs Grading"
  | "Graded"
  | "Returned"
  | "Resubmission Required";

export interface Submission {
  id: string;
  organizationId: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentRollNumber?: string;
  studentAdmissionNumber?: string;
  attemptNumber: number;
  content?: string;
  attachments?: AssignmentAttachment[];
  submittedAt: string;
  status: SubmissionStatus;
  late: boolean;
  marks?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  gradedByName?: string;
  returnedAt?: string;
  returnedBy?: string;
  resubmissionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceCategory =
  | "Notes"
  | "Worksheets"
  | "PDF"
  | "Presentation"
  | "Video Link"
  | "Reference"
  | "Other";

export interface AcademicResource {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  category: ResourceCategory;
  fileName?: string;
  storagePath?: string;
  downloadUrl?: string;
  mimeType?: string;
  fileSize?: number;
  externalUrl?: string;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
}

export interface AcademicWorkSettingsConfig {
  assignmentDefaults: {
    defaultType: AssignmentType;
    allowLateSubmission: boolean;
    gracePeriodHours: number;
    allowResubmission: boolean;
  };
  gradingSettings: {
    defaultMaxMarks: number;
    defaultGradeType: GradeType;
    autoCalculatePercentage: boolean;
  };
  attachmentSettings: {
    maxFileSizeMB: number;
    allowedMimeTypes: string[];
  };
  notificationSettings: {
    notifyOnPublish: boolean;
    notifyOnGrading: boolean;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface AcademicWorkStats {
  activeAssignments: number;
  pendingSubmissions: number;
  overdueWork: number;
  completedWork: number;
  needsGrading: number;
  totalResources: number;
}
