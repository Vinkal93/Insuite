export type HostelType = "Boys" | "Girls" | "Mixed";
export type HostelStatus = "Active" | "Inactive";
export type BedStatus = "Available" | "Occupied" | "Reserved" | "Maintenance" | "Inactive";
export type AllocationStatus = "Active" | "Transferred" | "Completed" | "Cancelled";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled" | "Completed";
export type ComplaintPriority = "Low" | "Normal" | "High" | "Urgent";
export type ComplaintStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type MaintenanceStatus = "Open" | "In Progress" | "Completed" | "Cancelled";

export interface Hostel {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: HostelType;
  capacity: number;
  wardenId?: string;
  wardenName?: string;
  description?: string;
  status: HostelStatus;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface HostelBuilding {
  id: string;
  organizationId: string;
  hostelId: string;
  hostelName: string;
  name: string;
  code: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt?: string;
}

export interface HostelFloor {
  id: string;
  organizationId: string;
  hostelId: string;
  buildingId: string;
  buildingName: string;
  name: string;
  floorNumber: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelRoom {
  id: string;
  organizationId: string;
  hostelId: string;
  hostelName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomNumber: string;
  roomType: string; // e.g. Single, Double, Triple, Dormitory
  capacity: number;
  occupiedCount: number;
  status: "Active" | "Maintenance" | "Inactive";
  createdAt: string;
  updatedAt?: string;
}

export interface HostelBed {
  id: string;
  organizationId: string;
  hostelId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string; // e.g. "BED-A-101-01"
  status: BedStatus;
  currentAllocationId?: string;
  currentStudentId?: string;
  currentStudentName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelAllocation {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className?: string;
  hostelId: string;
  hostelName: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  roomNumber: string;
  bedId: string;
  bedNumber: string;
  allocationDate: string; // YYYY-MM-DD
  expectedCheckoutDate?: string; // YYYY-MM-DD
  actualCheckoutDate?: string; // YYYY-MM-DD
  status: AllocationStatus;
  notes?: string;
  reason?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelAttendanceRecord {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  roomNumber: string;
  bedNumber: string;
  status: "Present" | "Absent" | "Leave";
  remarks?: string;
}

export interface HostelAttendance {
  id: string;
  organizationId: string;
  hostelId: string;
  date: string; // YYYY-MM-DD
  records: HostelAttendanceRecord[];
  takenBy: string;
  takenAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelLeaveRequest {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  hostelId: string;
  hostelName?: string;
  roomNumber: string;
  bedNumber: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string;
  destination: string;
  emergencyContact: string;
  notes?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelComplaint {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  hostelName: string;
  roomId: string;
  roomNumber: string;
  category: string; // e.g. Plumbing, Electrical, Cleanliness, Food, Noise, Other
  title: string;
  description: string;
  priority: ComplaintPriority;
  assignedToId?: string;
  assignedToName?: string;
  status: ComplaintStatus;
  internalNotes?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelMaintenance {
  id: string;
  organizationId: string;
  hostelId: string;
  hostelName: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  roomNumber?: string;
  assetId?: string;
  assetName?: string;
  issue: string;
  priority: ComplaintPriority;
  assignedStaff?: string;
  estimatedCost?: number;
  actualCost?: number;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelSettingsConfig {
  genderStrictness: boolean;
  maxOccupancyAlertPercent: number;
  curfewTime: string; // HH:mm e.g. "20:00"
  allowStudentLeaveRequest: boolean;
  allowParentLeaveRequest: boolean;
}

export interface HostelDashboardStats {
  totalHostelsCount: number;
  totalCapacity: number;
  occupiedBedsCount: number;
  availableBedsCount: number;
  activeAllocationsCount: number;
  todayAttendanceStats: { present: number; absent: number; leave: number; total: number };
  pendingLeavesCount: number;
  openComplaintsCount: number;
  openMaintenanceCount: number;
}
