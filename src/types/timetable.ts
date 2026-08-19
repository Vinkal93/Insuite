export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type PeriodType = "Regular" | "Break" | "Lunch" | "Assembly" | "Other";

export type PeriodStatus = "active" | "inactive";

export interface Period {
  id: string;
  organizationId: string;
  name: string;
  number: number;
  startTime: string; // HH:mm format, e.g. "09:00"
  endTime: string; // HH:mm format, e.g. "09:45"
  type: PeriodType;
  status: PeriodStatus;
  createdAt: string;
  updatedAt: string;
}

export type RoomType =
  | "Classroom"
  | "Laboratory"
  | "Computer Lab"
  | "Library"
  | "Auditorium"
  | "Other";

export type RoomStatus = "Available" | "Unavailable";

export interface Room {
  id: string;
  organizationId: string;
  name: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  floor: string;
  building: string;
  status: RoomStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TimetableEntry {
  id: string;
  organizationId: string;
  academicSessionId: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  roomId?: string;
  roomName?: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  periodNumber?: number;
  periodName?: string;
  startTime?: string;
  endTime?: string;
  status: "active" | "inactive";
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type SubstitutionStatus = "Pending" | "Assigned" | "Completed" | "Cancelled";

export interface Substitution {
  id: string;
  organizationId: string;
  academicSessionId: string;
  date: string; // YYYY-MM-DD
  periodId: string;
  periodName?: string;
  periodNumber?: number;
  startTime?: string;
  endTime?: string;
  absentTeacherId: string;
  absentTeacherName?: string;
  substituteTeacherId: string;
  substituteTeacherName?: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  subjectId: string;
  subjectName?: string;
  reason: string;
  notes?: string;
  status: SubstitutionStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TimetableSettingsConfig {
  workingDays: DayOfWeek[];
  defaultView: "grid" | "list";
  allowSaturday: boolean;
  allowSunday: boolean;
  conflictRules: {
    teacher: boolean;
    class: boolean;
    room: boolean;
  };
  substitutionSettings: {
    notifyTeacher: boolean;
    autoDetectAbsences: boolean;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface TimetableStats {
  totalScheduledClasses: number;
  todaysPeriods: number;
  freeTeachers: number;
  freeRooms: number;
  pendingSubstitutions: number;
  totalRooms: number;
  totalPeriods: number;
}
