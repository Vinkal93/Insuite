export type AcademicSessionStatus = "draft" | "active" | "completed" | "archived";
export type ClassStatus = "active" | "inactive" | "archived";
export type SectionStatus = "active" | "inactive" | "archived";
export type SubjectStatus = "active" | "inactive" | "archived";
export type SubjectType = "Core" | "Elective" | "Optional" | "Language" | "Practical" | "Other";
export type TeacherStatus = "active" | "inactive" | "on_leave" | "resigned" | "terminated";
export type AssignmentStatus = "active" | "inactive" | "transferred";

export interface AcademicSessionItem {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicSessionStatus;
  isActive: boolean;
  classesCount?: number;
  studentsCount?: number;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface SchoolClass {
  id: string;
  organizationId: string;
  academicSessionId: string;
  name: string;
  code: string;
  displayOrder: number;
  description?: string | null;
  status: ClassStatus;
  sectionsCount?: number;
  studentsCount?: number;
  subjectsCount?: number;
  classTeacherId?: string | null;
  classTeacherName?: string | null;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface Section {
  id: string;
  organizationId: string;
  academicSessionId: string;
  classId: string;
  className?: string;
  name: string;
  code: string;
  room?: string | null;
  capacity: number;
  classTeacherId?: string | null;
  classTeacherName?: string | null;
  studentsCount?: number;
  status: SectionStatus;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface SubjectMarks {
  maximum: number;
  passing: number;
  theory?: number;
  practical?: number;
}

export interface Subject {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: SubjectType;
  description?: string | null;
  marks: SubjectMarks;
  status: SubjectStatus;
  assignedClassIds?: string[];
  assignedTeacherIds?: string[];
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface ClassSubjectMapping {
  id: string;
  organizationId: string;
  academicSessionId: string;
  classId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  subjectType?: SubjectType;
  teacherId?: string | null;
  teacherName?: string | null;
  status: "active" | "inactive";
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface TeacherPersonal {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  photoUrl?: string | null;
  dob?: string | null;
  gender: "male" | "female" | "other";
  bloodGroup?: string | null;
}

export interface TeacherContact {
  mobile: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

export interface TeacherProfessional {
  joiningDate: string;
  department?: string | null;
  designation?: string | null;
  qualification?: string | null;
  experience?: string | null;
  specialization?: string | null;
}

export interface TeacherEmergency {
  contactName?: string | null;
  relation?: string | null;
  mobile?: string | null;
}

export interface TeacherDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Teacher {
  id: string;
  organizationId: string;
  employeeId: string;
  personal: TeacherPersonal;
  contact: TeacherContact;
  professional: TeacherProfessional;
  emergencyContact?: TeacherEmergency;
  documents?: TeacherDocument[];
  status: TeacherStatus;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface ClassTeacherAssignment {
  id: string;
  organizationId: string;
  academicSessionId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  teacherId: string;
  teacherName: string;
  teacherEmployeeId?: string;
  assignedDate: string;
  assignedBy: string;
  status: AssignmentStatus;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface SubjectTeacherAssignment {
  id: string;
  organizationId: string;
  academicSessionId: string;
  classId: string;
  className: string;
  sectionId?: string | null;
  sectionName?: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmployeeId?: string;
  assignedDate: string;
  assignedBy: string;
  status: AssignmentStatus;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface AcademicSettingsConfig {
  classCodeFormat: string;
  defaultSectionCapacity: number;
  sectionCodeFormat: string;
  subjectTypes: string[];
  defaultMaximumMarks: number;
  defaultPassingMarks: number;
  employeeIdFormat: string;
  defaultDesignations: string[];
  defaultDepartments: string[];
  sessionNamingFormat: string;
  updatedAt: any;
  updatedBy: string;
}

export interface AcademicDashboardStats {
  totalClasses: number;
  totalSections: number;
  totalSubjects: number;
  totalTeachers: number;
  activeSessionName: string;
  assignedTeachersCount: number;
  unassignedSubjectsCount: number;
  unassignedClassesCount: number;
}
