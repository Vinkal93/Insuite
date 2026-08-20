export type PtmMode = "IN_PERSON" | "ONLINE" | "HYBRID";

export type PtmEventStatus = "DRAFT" | "PUBLISHED" | "OPEN" | "CLOSED" | "COMPLETED" | "CANCELLED";

export type PtmSlotStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" | "COMPLETED";

export type PtmAppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface PtmEvent {
  id: string;
  organizationId: string;
  academicSessionId: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  mode: PtmMode;
  description?: string;
  status: PtmEventStatus;
  slotDuration: number; // in minutes (e.g. 15)
  targetClasses?: string[]; // classIds
  targetTeachers?: string[]; // teacherIds
  location?: string;
  meetingLink?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface PtmSlot {
  id: string;
  organizationId: string;
  eventId: string;
  teacherId: string;
  teacherName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: PtmSlotStatus;
  appointmentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PtmAppointment {
  id: string;
  organizationId: string;
  eventId: string;
  eventName: string;
  slotId: string;
  startTime: string;
  endTime: string;
  date: string;
  
  parentId: string;
  parentName: string;
  parentPhone?: string;
  
  studentId: string;
  studentName: string;
  
  teacherId: string;
  teacherName: string;
  
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId?: string;
  subjectName?: string;
  
  mode: PtmMode;
  location?: string;
  meetingLink?: string;
  
  status: PtmAppointmentStatus;
  bookedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  
  rescheduledFrom?: string;
  rescheduledTo?: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface PtmMeetingNote {
  id: string;
  organizationId: string;
  appointmentId: string;
  teacherId: string;
  studentId: string;
  internalNotes?: string;
  parentSummary?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PtmSettingsConfig {
  defaultSlotDuration: number; // default 15 mins
  cancellationWindowHours: number; // default 2 hours
  reminderTimingHours: number; // default 24 hours
  maxAppointmentsPerParent: number; // default 5
  maxAppointmentsPerTeacher: number; // default 30
  bookingStartTime?: string;
  bookingEndTime?: string;
}

export interface TeacherAvailability {
  id: string;
  organizationId: string;
  eventId: string;
  teacherId: string;
  teacherName: string;
  isAvailable: boolean;
  customStartTime?: string;
  customEndTime?: string;
  breakSlots?: string[];
  updatedAt: string;
}

export interface PtmDashboardStats {
  upcomingMeetingsCount: number;
  activeEventsCount: number;
  availableSlotsCount: number;
  bookedSlotsCount: number;
  completedMeetingsCount: number;
  cancelledMeetingsCount: number;
}
