export type VisitorType =
  | "Parent"
  | "Guardian"
  | "Student"
  | "Vendor"
  | "Delivery"
  | "Staff"
  | "Alumni"
  | "Official"
  | "Other";

export type VisitorStatus = "Expected" | "Inside" | "Exited" | "Cancelled" | "Denied";

export type GatePassStatus = "Active" | "Used" | "Expired" | "Cancelled";

export type AppointmentStatus =
  | "Scheduled"
  | "Confirmed"
  | "Checked In"
  | "Completed"
  | "Cancelled"
  | "No Show";

export type CallDirection = "Incoming" | "Outgoing";

export type CallStatus = "Open" | "Resolved" | "Follow-up" | "Closed";

export type CorrespondenceType =
  | "Incoming Mail"
  | "Outgoing Mail"
  | "Courier"
  | "Parcel"
  | "Official Letter"
  | "Other";

export type CorrespondenceStatus =
  | "Received"
  | "Forwarded"
  | "Dispatched"
  | "Delivered"
  | "Returned"
  | "Closed";

export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";

export type TaskStatus = "Open" | "In Progress" | "Completed" | "Cancelled";

export interface FrontOfficeVisitor {
  id: string;
  organizationId: string;
  name: string;
  mobile: string;
  email?: string;
  organizationName?: string;
  visitorType: VisitorType;
  idType?: string;
  idNumber?: string; // Stored masked where appropriate
  vehicleNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface FrontOfficeVisit {
  id: string;
  organizationId: string;
  visitorId: string;
  visitorName: string;
  visitorMobile: string;
  visitorType: VisitorType;
  personToMeetId: string;
  personToMeetName: string;
  personToMeetType?: "STAFF" | "STUDENT";
  departmentName?: string;
  purpose: string;
  entryTime: string; // ISO string
  exitTime?: string; // ISO string
  status: "Inside" | "Exited";
  gatePassId?: string;
  gatePassNumber?: string;
  checkedOutBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrontOfficeGatePass {
  id: string;
  organizationId: string;
  passNumber: string; // e.g. "INS-GATE-2026-000001"
  visitorId: string;
  visitorName: string;
  visitId?: string;
  personToMeetName: string;
  purpose: string;
  passType: string;
  validFrom: string; // ISO or date-time
  validUntil: string; // ISO or date-time
  status: GatePassStatus;
  verificationEnabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrontOfficeAppointment {
  id: string;
  organizationId: string;
  visitorName: string;
  visitorMobile: string;
  personToMeetId: string;
  personToMeetName: string;
  departmentName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  notes?: string;
  status: AppointmentStatus;
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrontOfficeCall {
  id: string;
  organizationId: string;
  callerName: string;
  mobile: string;
  email?: string;
  direction: CallDirection;
  purpose: string;
  personToMeetName?: string;
  departmentName?: string;
  notes?: string;
  followUpDate?: string;
  status: CallStatus;
  assignedToName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrontOfficeCorrespondence {
  id: string;
  organizationId: string;
  type: CorrespondenceType;
  referenceNumber?: string;
  date: string; // YYYY-MM-DD
  sender: string;
  recipient: string;
  subject: string;
  description?: string;
  departmentName?: string;
  assignedToName?: string;
  attachmentUrl?: string;
  status: CorrespondenceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrontOfficeTask {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  assignedToName?: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  completedBy?: string;
  completedAt?: string;
  completionNote?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrontOfficeSettingsConfig {
  gatePassPrefix: string; // e.g. "INS-GATE"
  nextGatePassSeq: number; // e.g. 1
  requireIdProof: boolean;
  defaultPassValidityHours: number; // e.g. 4
  maskIdNumbers: boolean;
}

export interface FrontOfficeDashboardStats {
  todaysVisitorsCount: number;
  currentlyInsideCount: number;
  todaysAppointmentsCount: number;
  todaysCallsCount: number;
  openEnquiriesCount: number;
  pendingCorrespondenceCount: number;
  activeGatePassesCount: number;
}
