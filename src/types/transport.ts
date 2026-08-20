export type VehicleType = "Bus" | "Van" | "Car" | "Other";

export type FuelType = "Diesel" | "Petrol" | "CNG" | "Electric" | "Other";

export type OwnershipType = "Owned" | "Leased" | "Contracted";

export type VehicleStatus = "Active" | "Inactive" | "Maintenance" | "Retired";

export type DocumentStatus = "Valid" | "Expiring Soon" | "Expired" | "Missing";

export type TripType = "Morning Pickup" | "Afternoon Drop" | "Special" | "Other";

export type TripStatus = "Scheduled" | "Started" | "Completed" | "Cancelled" | "Delayed";

export type MaintenanceType =
  | "Service"
  | "Repair"
  | "Inspection"
  | "Tyre"
  | "Battery"
  | "Other";

export type MaintenanceStatus =
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type PickupDropOption = "Both" | "Pickup Only" | "Drop Only";

export interface TransportVehicleDocument {
  id: string;
  type: "Insurance" | "Fitness" | "Permit" | "Pollution" | "Registration" | "Other";
  documentNumber: string;
  expiryDate: string; // YYYY-MM-DD
  fileUrl?: string | null;
  fileName?: string | null;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface TransportVehicle {
  id: string;
  organizationId: string;
  vehicleNumber: string; // e.g. "BUS-01"
  registrationNumber: string; // e.g. "DL-01-AB-1234"
  type: VehicleType;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  capacity: number;
  fuelType: FuelType;
  color?: string | null;
  ownershipType: OwnershipType;
  assignedRouteId?: string | null;
  assignedRouteName?: string | null;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  documents: TransportVehicleDocument[];
  insuranceExpiry?: string | null;
  fitnessExpiry?: string | null;
  permitExpiry?: string | null;
  pollutionExpiry?: string | null;
  status: VehicleStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface TransportRouteStopItem {
  stopId: string;
  stopName: string;
  stopCode?: string | null;
  address?: string | null;
  pickupTime: string; // "07:30"
  dropTime: string; // "14:30"
  sequence: number; // 1, 2, 3...
}

export interface TransportRoute {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  startTime: string; // "07:00"
  endTime: string; // "08:30"
  vehicleId?: string | null;
  vehicleNumber?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  stops: TransportRouteStopItem[];
  totalStudentsAssigned: number;
  status: "Active" | "Inactive";
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface TransportStop {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  defaultPickupTime?: string | null;
  defaultDropTime?: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface TransportDriver {
  id: string; // driver doc ID
  organizationId: string;
  staffId: string; // Links to existing Staff record
  name: string;
  employeeId: string;
  mobile: string;
  email?: string | null;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string; // YYYY-MM-DD
  experienceYears?: number | null;
  medicalExpiry?: string | null;
  assignedVehicleId?: string | null;
  assignedVehicleNumber?: string | null;
  assignedRouteId?: string | null;
  assignedRouteName?: string | null;
  status: "Active" | "Inactive" | "Suspended";
  createdAt: string;
  updatedAt: string;
}

export interface StudentTransportAssignment {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  academicSessionId: string;
  routeId: string;
  routeName: string;
  routeCode: string;
  stopId: string;
  stopName: string;
  pickupDrop: PickupDropOption;
  pickupTime: string;
  dropTime: string;
  vehicleId?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string | null;
  status: "Active" | "Suspended" | "Cancelled";
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface TransportTrip {
  id: string;
  organizationId: string;
  routeId: string;
  routeName: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  tripType: TripType;
  scheduledStart: string; // "07:00"
  scheduledEnd: string; // "08:15"
  actualStart?: string | null;
  actualEnd?: string | null;
  status: TripStatus;
  studentsBoarded?: number;
  remarks?: string | null;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    source: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransportMaintenance {
  id: string;
  organizationId: string;
  vehicleId: string;
  vehicleNumber: string;
  type: MaintenanceType;
  description: string;
  scheduledDate: string; // YYYY-MM-DD
  completedDate?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  vendor?: string | null;
  status: MaintenanceStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransportSettingsConfig {
  defaultPickupDropOption: PickupDropOption;
  docExpiryWarningDays: number;
  maxStudentCapacityBufferPercentage: number;
  liveTrackingConfigured: boolean;
  trackingProvider?: string | null;
  allowOvercapacityAssignment: boolean;
  defaultTripStartTimeMorning: string;
  defaultTripStartTimeAfternoon: string;
}

export interface TransportDashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  activeRoutes: number;
  assignedStudents: number;
  activeDrivers: number;
  todayTripsCount: number;
  expiringDocsCount: number;
}
