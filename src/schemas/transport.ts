import { z } from "zod";

export const transportVehicleSchema = z.object({
  vehicleNumber: z.string().min(2, "Vehicle number is required"),
  registrationNumber: z.string().min(4, "Registration number is required"),
  type: z.enum(["Bus", "Van", "Car", "Other"]).default("Bus"),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().min(1980).max(2100).optional().nullable(),
  capacity: z.number().min(1, "Capacity must be at least 1 seat"),
  fuelType: z.enum(["Diesel", "Petrol", "CNG", "Electric", "Other"]).default("Diesel"),
  color: z.string().optional().nullable(),
  ownershipType: z.enum(["Owned", "Leased", "Contracted"]).default("Owned"),
  assignedRouteId: z.string().optional().nullable(),
  assignedDriverId: z.string().optional().nullable(),
  insuranceExpiry: z.string().optional().nullable(),
  fitnessExpiry: z.string().optional().nullable(),
  permitExpiry: z.string().optional().nullable(),
  pollutionExpiry: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive", "Maintenance", "Retired"]).default("Active"),
});

export type TransportVehicleInput = z.infer<typeof transportVehicleSchema>;

export const transportRouteStopItemSchema = z.object({
  stopId: z.string().min(1),
  stopName: z.string().min(1),
  stopCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  pickupTime: z.string().min(1, "Pickup time is required"),
  dropTime: z.string().min(1, "Drop time is required"),
  sequence: z.number().min(1),
});

export const transportRouteSchema = z.object({
  name: z.string().min(2, "Route name is required"),
  code: z.string().min(2, "Route code is required"),
  description: z.string().optional().nullable(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  stops: z.array(transportRouteStopItemSchema).default([]),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type TransportRouteInput = z.infer<typeof transportRouteSchema>;

export const transportStopSchema = z.object({
  name: z.string().min(2, "Stop name is required"),
  code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  defaultPickupTime: z.string().optional().nullable(),
  defaultDropTime: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type TransportStopInput = z.infer<typeof transportStopSchema>;

export const transportDriverSchema = z.object({
  staffId: z.string().min(1, "Staff member selection is required"),
  licenseNumber: z.string().min(3, "License number is required"),
  licenseType: z.string().default("Commercial Heavy Vehicle"),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  experienceYears: z.number().min(0).optional().nullable(),
  medicalExpiry: z.string().optional().nullable(),
  assignedVehicleId: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive", "Suspended"]).default("Active"),
});

export type TransportDriverInput = z.infer<typeof transportDriverSchema>;

export const studentTransportAssignmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  academicSessionId: z.string().min(1, "Academic session is required"),
  routeId: z.string().min(1, "Route is required"),
  stopId: z.string().min(1, "Stop is required"),
  pickupDrop: z.enum(["Both", "Pickup Only", "Drop Only"]).default("Both"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional().nullable(),
  status: z.enum(["Active", "Suspended", "Cancelled"]).default("Active"),
});

export type StudentTransportAssignmentInput = z.infer<
  typeof studentTransportAssignmentSchema
>;

export const transportTripSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  date: z.string().min(1, "Date is required"),
  tripType: z.enum(["Morning Pickup", "Afternoon Drop", "Special", "Other"]),
  scheduledStart: z.string().min(1, "Scheduled start time is required"),
  scheduledEnd: z.string().min(1, "Scheduled end time is required"),
  remarks: z.string().optional().nullable(),
});

export type TransportTripInput = z.infer<typeof transportTripSchema>;

export const transportMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.enum(["Service", "Repair", "Inspection", "Tyre", "Battery", "Other"]),
  description: z.string().min(2, "Description is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  estimatedCost: z.number().min(0).optional().nullable(),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type TransportMaintenanceInput = z.infer<typeof transportMaintenanceSchema>;

export const transportSettingsSchema = z.object({
  defaultPickupDropOption: z.enum(["Both", "Pickup Only", "Drop Only"]).default("Both"),
  docExpiryWarningDays: z.number().min(1).max(180).default(30),
  maxStudentCapacityBufferPercentage: z.number().min(0).max(50).default(0),
  liveTrackingConfigured: z.boolean().default(false),
  trackingProvider: z.string().optional().nullable(),
  allowOvercapacityAssignment: z.boolean().default(false),
  defaultTripStartTimeMorning: z.string().default("07:00"),
  defaultTripStartTimeAfternoon: z.string().default("14:00"),
});

export type TransportSettingsInput = z.infer<typeof transportSettingsSchema>;
