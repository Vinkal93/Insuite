import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type {
  TransportVehicle,
  TransportVehicleDocument,
  TransportRoute,
  TransportRouteStopItem,
  TransportStop,
  TransportDriver,
  StudentTransportAssignment,
  TransportTrip,
  TransportMaintenance,
  TransportSettingsConfig,
  TransportDashboardStats,
  VehicleStatus,
  TripStatus,
  MaintenanceStatus,
  DocumentStatus,
} from "@/types/transport";
import type {
  TransportVehicleInput,
  TransportRouteInput,
  TransportStopInput,
  TransportDriverInput,
  StudentTransportAssignmentInput,
  TransportTripInput,
  TransportMaintenanceInput,
  TransportSettingsInput,
} from "@/schemas/transport";
import { createAuditLog } from "./auditService";
import { getStudent } from "./studentService";
import { getStaff } from "./hrService";

export const DEFAULT_TRANSPORT_SETTINGS: TransportSettingsConfig = {
  defaultPickupDropOption: "Both",
  docExpiryWarningDays: 30,
  maxStudentCapacityBufferPercentage: 0,
  liveTrackingConfigured: false,
  trackingProvider: null,
  allowOvercapacityAssignment: false,
  defaultTripStartTimeMorning: "07:00",
  defaultTripStartTimeAfternoon: "14:00",
};

// Helper: Calculate document validity
export const calculateDocumentStatus = (
  expiryDateStr?: string | null,
  warningDays = 30
): DocumentStatus => {
  if (!expiryDateStr) return "Missing";
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const expiryDate = new Date(expiryDateStr);
  const today = new Date(todayStr);

  if (expiryDate < today) return "Expired";

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= warningDays) return "Expiring Soon";
  return "Valid";
};

// ----------------------------------------------------
// 1. SETTINGS
// ----------------------------------------------------

export const getTransportSettings = async (orgId: string): Promise<TransportSettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "transportSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_TRANSPORT_SETTINGS;
    return { ...DEFAULT_TRANSPORT_SETTINGS, ...snap.data() } as TransportSettingsConfig;
  } catch (err) {
    console.error("getTransportSettings error:", err);
    return DEFAULT_TRANSPORT_SETTINGS;
  }
};

export const updateTransportSettings = async (
  orgId: string,
  input: TransportSettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportSettings", "config");
  await setDoc(
    docRef,
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TRANSPORT_SETTINGS_UPDATED",
    entityType: "TRANSPORT_SETTINGS",
    entityId: "config",
  });
};

// ----------------------------------------------------
// 2. VEHICLES CRUD & DOCUMENTS
// ----------------------------------------------------

export const listVehicles = async (
  orgId: string,
  filters?: {
    type?: string;
    status?: string;
  }
): Promise<TransportVehicle[]> => {
  const colRef = collection(db, "organizations", orgId, "transportVehicles");
  const q = query(colRef, orderBy("vehicleNumber", "asc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as TransportVehicle);

  if (filters?.type && filters.type !== "ALL") {
    list = list.filter((v) => v.type === filters.type);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((v) => v.status === filters.status);
  }

  return list;
};

export const getVehicle = async (
  orgId: string,
  vehicleId: string
): Promise<TransportVehicle | null> => {
  const docRef = doc(db, "organizations", orgId, "transportVehicles", vehicleId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as TransportVehicle;
};

export const createVehicle = async (
  orgId: string,
  input: TransportVehicleInput,
  actor: { uid: string; name: string }
): Promise<TransportVehicle> => {
  const docRef = doc(collection(db, "organizations", orgId, "transportVehicles"));
  const now = new Date().toISOString();

  const vehicle: TransportVehicle = {
    id: docRef.id,
    organizationId: orgId,
    vehicleNumber: input.vehicleNumber.trim().toUpperCase(),
    registrationNumber: input.registrationNumber.trim().toUpperCase(),
    type: input.type,
    manufacturer: input.manufacturer?.trim() || null,
    model: input.model?.trim() || null,
    year: input.year ? Number(input.year) : null,
    capacity: Number(input.capacity),
    fuelType: input.fuelType,
    color: input.color?.trim() || null,
    ownershipType: input.ownershipType,
    assignedRouteId: input.assignedRouteId || null,
    assignedDriverId: input.assignedDriverId || null,
    documents: [],
    insuranceExpiry: input.insuranceExpiry || null,
    fitnessExpiry: input.fitnessExpiry || null,
    permitExpiry: input.permitExpiry || null,
    pollutionExpiry: input.pollutionExpiry || null,
    status: input.status || "Active",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, vehicle);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VEHICLE_CREATED",
    entityType: "TRANSPORT_VEHICLE",
    entityId: docRef.id,
    metadata: { vehicleNumber: vehicle.vehicleNumber, reg: vehicle.registrationNumber },
  });

  return vehicle;
};

export const updateVehicle = async (
  orgId: string,
  vehicleId: string,
  input: Partial<TransportVehicleInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportVehicles", vehicleId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...input,
    vehicleNumber: input.vehicleNumber ? input.vehicleNumber.trim().toUpperCase() : undefined,
    registrationNumber: input.registrationNumber
      ? input.registrationNumber.trim().toUpperCase()
      : undefined,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VEHICLE_UPDATED",
    entityType: "TRANSPORT_VEHICLE",
    entityId: vehicleId,
  });
};

export const uploadVehicleDocument = async (
  orgId: string,
  vehicleId: string,
  docType: TransportVehicleDocument["type"],
  documentNumber: string,
  expiryDate: string,
  file: File | null,
  actor: { uid: string; name: string }
): Promise<void> => {
  const vehicle = await getVehicle(orgId, vehicleId);
  if (!vehicle) throw new Error("Vehicle not found.");

  let downloadUrl: string | null = null;
  const docId = `doc_${Date.now()}`;
  const now = new Date().toISOString();

  if (file) {
    const fileExt = file.name.split(".").pop();
    const sanitizedName = `${Date.now()}_${docType.toLowerCase()}.${fileExt}`;
    const storagePath = `organizations/${orgId}/vehicles/${vehicleId}/documents/${sanitizedName}`;
    const fileRef = ref(storage, storagePath);
    const snap = await uploadBytes(fileRef, file);
    downloadUrl = await getDownloadURL(snap.ref);
  }

  const newDoc: TransportVehicleDocument = {
    id: docId,
    type: docType,
    documentNumber: documentNumber.trim(),
    expiryDate,
    fileUrl: downloadUrl,
    fileName: file ? file.name : null,
    uploadedAt: now,
    status: calculateDocumentStatus(expiryDate),
  };

  const updatedDocs = [...(vehicle.documents || []).filter((d) => d.type !== docType), newDoc];

  const updatePayload: any = {
    documents: updatedDocs,
    updatedAt: now,
  };

  if (docType === "Insurance") updatePayload.insuranceExpiry = expiryDate;
  if (docType === "Fitness") updatePayload.fitnessExpiry = expiryDate;
  if (docType === "Permit") updatePayload.permitExpiry = expiryDate;
  if (docType === "Pollution") updatePayload.pollutionExpiry = expiryDate;

  await updateDoc(doc(db, "organizations", orgId, "transportVehicles", vehicleId), updatePayload);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VEHICLE_DOCUMENT_UPLOADED",
    entityType: "TRANSPORT_VEHICLE",
    entityId: vehicleId,
    metadata: { docType, documentNumber, expiryDate },
  });
};

export const deleteVehicleDocument = async (
  orgId: string,
  vehicleId: string,
  docId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const vehicle = await getVehicle(orgId, vehicleId);
  if (!vehicle) throw new Error("Vehicle not found.");

  const docToDelete = (vehicle.documents || []).find((d) => d.id === docId);
  if (!docToDelete) return;

  if (docToDelete.fileUrl) {
    try {
      const fileRef = ref(storage, docToDelete.fileUrl);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("File deletion error from storage:", err);
    }
  }

  const updatedDocs = (vehicle.documents || []).filter((d) => d.id !== docId);
  await updateDoc(doc(db, "organizations", orgId, "transportVehicles", vehicleId), {
    documents: updatedDocs,
    updatedAt: new Date().toISOString(),
  });
};

// ----------------------------------------------------
// 3. ROUTES & STOPS CRUD
// ----------------------------------------------------

export const listRoutes = async (
  orgId: string,
  filters?: { status?: string }
): Promise<TransportRoute[]> => {
  const colRef = collection(db, "organizations", orgId, "transportRoutes");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as TransportRoute);

  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((r) => r.status === filters.status);
  }

  return list;
};

export const getRoute = async (
  orgId: string,
  routeId: string
): Promise<TransportRoute | null> => {
  const docRef = doc(db, "organizations", orgId, "transportRoutes", routeId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as TransportRoute;
};

export const createRoute = async (
  orgId: string,
  input: TransportRouteInput,
  actor: { uid: string; name: string }
): Promise<TransportRoute> => {
  const docRef = doc(collection(db, "organizations", orgId, "transportRoutes"));
  const now = new Date().toISOString();

  let vehicleNumber: string | null = null;
  let driverName: string | null = null;

  if (input.vehicleId) {
    const v = await getVehicle(orgId, input.vehicleId);
    if (v) vehicleNumber = v.vehicleNumber;
  }
  if (input.driverId) {
    const d = await getDriver(orgId, input.driverId);
    if (d) driverName = d.name;
  }

  const route: TransportRoute = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() || null,
    startTime: input.startTime,
    endTime: input.endTime,
    vehicleId: input.vehicleId || null,
    vehicleNumber,
    driverId: input.driverId || null,
    driverName,
    stops: input.stops || [],
    totalStudentsAssigned: 0,
    status: input.status || "Active",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, route);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ROUTE_CREATED",
    entityType: "TRANSPORT_ROUTE",
    entityId: docRef.id,
    metadata: { name: route.name, code: route.code },
  });

  return route;
};

export const updateRoute = async (
  orgId: string,
  routeId: string,
  input: Partial<TransportRouteInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportRoutes", routeId);
  const now = new Date().toISOString();

  let vehicleNumber: string | undefined = undefined;
  let driverName: string | undefined = undefined;

  if (input.vehicleId) {
    const v = await getVehicle(orgId, input.vehicleId);
    if (v) vehicleNumber = v.vehicleNumber;
  }
  if (input.driverId) {
    const d = await getDriver(orgId, input.driverId);
    if (d) driverName = d.name;
  }

  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    code: input.code ? input.code.trim().toUpperCase() : undefined,
    vehicleNumber,
    driverName,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ROUTE_UPDATED",
    entityType: "TRANSPORT_ROUTE",
    entityId: routeId,
  });
};

export const listStops = async (orgId: string): Promise<TransportStop[]> => {
  const colRef = collection(db, "organizations", orgId, "transportStops");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TransportStop);
};

export const createStop = async (
  orgId: string,
  input: TransportStopInput,
  actor: { uid: string; name: string }
): Promise<TransportStop> => {
  const docRef = doc(collection(db, "organizations", orgId, "transportStops"));
  const now = new Date().toISOString();

  const stop: TransportStop = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name.trim(),
    code: input.code?.trim().toUpperCase() || null,
    address: input.address?.trim() || null,
    latitude: input.latitude || null,
    longitude: input.longitude || null,
    defaultPickupTime: input.defaultPickupTime || null,
    defaultDropTime: input.defaultDropTime || null,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, stop);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STOP_CREATED",
    entityType: "TRANSPORT_STOP",
    entityId: docRef.id,
    metadata: { name: stop.name },
  });

  return stop;
};

export const updateStop = async (
  orgId: string,
  stopId: string,
  input: Partial<TransportStopInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportStops", stopId);
  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STOP_UPDATED",
    entityType: "TRANSPORT_STOP",
    entityId: stopId,
  });
};

export const deleteStop = async (
  orgId: string,
  stopId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  await deleteDoc(doc(db, "organizations", orgId, "transportStops", stopId));

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STOP_DELETED",
    entityType: "TRANSPORT_STOP",
    entityId: stopId,
  });
};

// ----------------------------------------------------
// 4. DRIVERS CRUD (LINKED TO STAFF)
// ----------------------------------------------------

export const listDrivers = async (orgId: string): Promise<TransportDriver[]> => {
  const colRef = collection(db, "organizations", orgId, "transportDrivers");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TransportDriver);
};

export const getDriver = async (
  orgId: string,
  driverId: string
): Promise<TransportDriver | null> => {
  const docRef = doc(db, "organizations", orgId, "transportDrivers", driverId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as TransportDriver;
};

export const createDriver = async (
  orgId: string,
  input: TransportDriverInput,
  actor: { uid: string; name: string }
): Promise<TransportDriver> => {
  const staff = await getStaff(orgId, input.staffId);
  if (!staff) throw new Error("Staff member not found.");

  const docRef = doc(collection(db, "organizations", orgId, "transportDrivers"));
  const now = new Date().toISOString();

  let assignedVehicleNumber: string | null = null;
  if (input.assignedVehicleId) {
    const v = await getVehicle(orgId, input.assignedVehicleId);
    if (v) assignedVehicleNumber = v.vehicleNumber;
  }

  const driver: TransportDriver = {
    id: docRef.id,
    organizationId: orgId,
    staffId: input.staffId,
    name: staff.fullName,
    employeeId: staff.employeeId,
    mobile: staff.contact.mobile,
    email: staff.contact.email || null,
    licenseNumber: input.licenseNumber.trim().toUpperCase(),
    licenseType: input.licenseType || "Commercial Heavy Vehicle",
    licenseExpiry: input.licenseExpiry,
    experienceYears: input.experienceYears ? Number(input.experienceYears) : null,
    medicalExpiry: input.medicalExpiry || null,
    assignedVehicleId: input.assignedVehicleId || null,
    assignedVehicleNumber,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, driver);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DRIVER_CREATED",
    entityType: "TRANSPORT_DRIVER",
    entityId: docRef.id,
    metadata: { name: driver.name, employeeId: driver.employeeId },
  });

  return driver;
};

export const updateDriver = async (
  orgId: string,
  driverId: string,
  input: Partial<TransportDriverInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportDrivers", driverId);
  const now = new Date().toISOString();

  let assignedVehicleNumber: string | undefined = undefined;
  if (input.assignedVehicleId) {
    const v = await getVehicle(orgId, input.assignedVehicleId);
    if (v) assignedVehicleNumber = v.vehicleNumber;
  }

  await updateDoc(docRef, {
    ...input,
    licenseNumber: input.licenseNumber
      ? input.licenseNumber.trim().toUpperCase()
      : undefined,
    assignedVehicleNumber,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DRIVER_UPDATED",
    entityType: "TRANSPORT_DRIVER",
    entityId: driverId,
  });
};

// ----------------------------------------------------
// 5. STUDENT TRANSPORT ASSIGNMENTS
// ----------------------------------------------------

export const listStudentAssignments = async (
  orgId: string,
  filters?: {
    routeId?: string;
    status?: string;
    studentId?: string;
  }
): Promise<StudentTransportAssignment[]> => {
  const colRef = collection(db, "organizations", orgId, "transportAssignments");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as StudentTransportAssignment);

  if (filters?.routeId && filters.routeId !== "ALL") {
    list = list.filter((a) => a.routeId === filters.routeId);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.studentId) {
    list = list.filter((a) => a.studentId === filters.studentId);
  }

  return list;
};

export const getStudentAssignment = async (
  orgId: string,
  studentId: string
): Promise<StudentTransportAssignment | null> => {
  const colRef = collection(db, "organizations", orgId, "transportAssignments");
  const q = query(
    colRef,
    where("studentId", "==", studentId),
    where("status", "==", "Active"),
    firestoreLimit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as StudentTransportAssignment;
};

export const assignStudentTransport = async (
  orgId: string,
  input: StudentTransportAssignmentInput,
  actor: { uid: string; name: string }
): Promise<StudentTransportAssignment> => {
  const [student, route, existingAssigns, settings] = await Promise.all([
    getStudent(orgId, input.studentId),
    getRoute(orgId, input.routeId),
    listStudentAssignments(orgId, { status: "Active" }),
    getTransportSettings(orgId),
  ]);

  if (!student) throw new Error("Student record not found.");
  if (!route) throw new Error("Transport route not found.");

  // Check duplicate active assignment
  const alreadyAssigned = existingAssigns.some(
    (a) => a.studentId === input.studentId && a.status === "Active"
  );
  if (alreadyAssigned) {
    throw new Error("Student is already assigned to an active transport route.");
  }

  // Capacity check
  if (route.vehicleId && !settings.allowOvercapacityAssignment) {
    const vehicle = await getVehicle(orgId, route.vehicleId);
    if (vehicle) {
      const assignedCount = existingAssigns.filter((a) => a.routeId === input.routeId).length;
      if (assignedCount >= vehicle.capacity) {
        throw new Error(
          `Vehicle ${vehicle.vehicleNumber} has reached its maximum seat capacity (${vehicle.capacity} seats).`
        );
      }
    }
  }

  const stopItem = route.stops.find((s) => s.stopId === input.stopId);
  const stopName = stopItem ? stopItem.stopName : "Designated Stop";
  const pickupTime = stopItem ? stopItem.pickupTime : route.startTime;
  const dropTime = stopItem ? stopItem.dropTime : route.endTime;

  const docRef = doc(collection(db, "organizations", orgId, "transportAssignments"));
  const now = new Date().toISOString();

  const assignment: StudentTransportAssignment = {
    id: docRef.id,
    organizationId: orgId,
    studentId: input.studentId,
    studentName: `${student.personal.firstName} ${student.personal.lastName}`,
    admissionNumber: student.admissionNumber || student.id,
    className: student.academic.className || "Class",
    sectionName: student.academic.sectionName || "A",
    academicSessionId: input.academicSessionId,
    routeId: input.routeId,
    routeName: route.name,
    routeCode: route.code,
    stopId: input.stopId,
    stopName,
    pickupDrop: input.pickupDrop,
    pickupTime,
    dropTime,
    vehicleId: route.vehicleId || null,
    vehicleNumber: route.vehicleNumber || null,
    driverName: route.driverName || null,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo || null,
    status: input.status || "Active",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  const batch = writeBatch(db);
  batch.set(docRef, assignment);
  batch.update(doc(db, "organizations", orgId, "transportRoutes", input.routeId), {
    totalStudentsAssigned: route.totalStudentsAssigned + 1,
    updatedAt: now,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STUDENT_TRANSPORT_ASSIGNED",
    entityType: "TRANSPORT_ASSIGNMENT",
    entityId: docRef.id,
    metadata: {
      studentName: assignment.studentName,
      routeName: route.name,
      stopName,
    },
  });

  return assignment;
};

export const cancelStudentTransportAssignment = async (
  orgId: string,
  assignmentId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportAssignments", assignmentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const assign = snap.data() as StudentTransportAssignment;
  const now = new Date().toISOString();

  const batch = writeBatch(db);
  batch.update(docRef, {
    status: "Cancelled",
    updatedAt: now,
    updatedBy: actor.uid,
  });

  const routeRef = doc(db, "organizations", orgId, "transportRoutes", assign.routeId);
  const routeSnap = await getDoc(routeRef);
  if (routeSnap.exists()) {
    const r = routeSnap.data() as TransportRoute;
    batch.update(routeRef, {
      totalStudentsAssigned: Math.max(0, r.totalStudentsAssigned - 1),
      updatedAt: now,
    });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STUDENT_TRANSPORT_REMOVED",
    entityType: "TRANSPORT_ASSIGNMENT",
    entityId: assignmentId,
    metadata: { studentName: assign.studentName, routeName: assign.routeName },
  });
};

// ----------------------------------------------------
// 6. TRIPS
// ----------------------------------------------------

export const listTrips = async (
  orgId: string,
  filters?: {
    date?: string;
    routeId?: string;
    status?: string;
  }
): Promise<TransportTrip[]> => {
  const colRef = collection(db, "organizations", orgId, "transportTrips");
  const q = query(colRef, orderBy("date", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as TransportTrip);

  if (filters?.date) {
    list = list.filter((t) => t.date === filters.date);
  }
  if (filters?.routeId && filters.routeId !== "ALL") {
    list = list.filter((t) => t.routeId === filters.routeId);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((t) => t.status === filters.status);
  }

  return list;
};

export const createTrip = async (
  orgId: string,
  input: TransportTripInput,
  actor: { uid: string; name: string }
): Promise<TransportTrip> => {
  const [route, vehicle, driver] = await Promise.all([
    getRoute(orgId, input.routeId),
    getVehicle(orgId, input.vehicleId),
    getDriver(orgId, input.driverId),
  ]);

  if (!route) throw new Error("Route not found.");
  if (!vehicle) throw new Error("Vehicle not found.");
  if (!driver) throw new Error("Driver not found.");

  if (vehicle.status !== "Active") {
    throw new Error(`Vehicle ${vehicle.vehicleNumber} is currently ${vehicle.status}.`);
  }
  if (driver.status !== "Active") {
    throw new Error(`Driver ${driver.name} is currently ${driver.status}.`);
  }

  const docRef = doc(collection(db, "organizations", orgId, "transportTrips"));
  const now = new Date().toISOString();

  const trip: TransportTrip = {
    id: docRef.id,
    organizationId: orgId,
    routeId: input.routeId,
    routeName: route.name,
    vehicleId: input.vehicleId,
    vehicleNumber: vehicle.vehicleNumber,
    driverId: input.driverId,
    driverName: driver.name,
    date: input.date,
    tripType: input.tripType,
    scheduledStart: input.scheduledStart,
    scheduledEnd: input.scheduledEnd,
    status: "Scheduled",
    remarks: input.remarks?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, trip);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TRIP_CREATED",
    entityType: "TRANSPORT_TRIP",
    entityId: docRef.id,
    metadata: { routeName: route.name, vehicleNumber: vehicle.vehicleNumber, date: trip.date },
  });

  return trip;
};

export const updateTripStatus = async (
  orgId: string,
  tripId: string,
  status: TripStatus,
  actualStart?: string | null,
  actualEnd?: string | null,
  actor?: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportTrips", tripId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status,
    actualStart: actualStart !== undefined ? actualStart : undefined,
    actualEnd: actualEnd !== undefined ? actualEnd : undefined,
    updatedAt: now,
  });

  if (actor) {
    await createAuditLog(orgId, {
      actorId: actor.uid,
      actorName: actor.name,
      action: status === "Started" ? "TRIP_STARTED" : status === "Completed" ? "TRIP_COMPLETED" : "TRIP_CANCELLED",
      entityType: "TRANSPORT_TRIP",
      entityId: tripId,
      metadata: { status },
    });
  }
};

// ----------------------------------------------------
// 7. MAINTENANCE
// ----------------------------------------------------

export const listMaintenanceRecords = async (
  orgId: string,
  vehicleId?: string
): Promise<TransportMaintenance[]> => {
  const colRef = collection(db, "organizations", orgId, "transportMaintenance");
  const q = query(colRef, orderBy("scheduledDate", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as TransportMaintenance);

  if (vehicleId) {
    list = list.filter((m) => m.vehicleId === vehicleId);
  }

  return list;
};

export const createMaintenanceRecord = async (
  orgId: string,
  input: TransportMaintenanceInput,
  actor: { uid: string; name: string }
): Promise<TransportMaintenance> => {
  const vehicle = await getVehicle(orgId, input.vehicleId);
  if (!vehicle) throw new Error("Vehicle not found.");

  const docRef = doc(collection(db, "organizations", orgId, "transportMaintenance"));
  const now = new Date().toISOString();

  const maintenance: TransportMaintenance = {
    id: docRef.id,
    organizationId: orgId,
    vehicleId: input.vehicleId,
    vehicleNumber: vehicle.vehicleNumber,
    type: input.type,
    description: input.description.trim(),
    scheduledDate: input.scheduledDate,
    estimatedCost: input.estimatedCost ? Number(input.estimatedCost) : null,
    vendor: input.vendor?.trim() || null,
    status: "Scheduled",
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, maintenance);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "MAINTENANCE_CREATED",
    entityType: "TRANSPORT_MAINTENANCE",
    entityId: docRef.id,
    metadata: { vehicleNumber: vehicle.vehicleNumber, type: maintenance.type },
  });

  return maintenance;
};

export const completeMaintenanceRecord = async (
  orgId: string,
  maintenanceId: string,
  actualCost: number,
  completedDate: string,
  notes: string | null,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "transportMaintenance", maintenanceId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Completed",
    actualCost: Number(actualCost),
    completedDate,
    notes: notes || undefined,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "MAINTENANCE_COMPLETED",
    entityType: "TRANSPORT_MAINTENANCE",
    entityId: maintenanceId,
    metadata: { actualCost, completedDate },
  });
};

// ----------------------------------------------------
// 8. DASHBOARD STATS
// ----------------------------------------------------

export const getTransportDashboardStats = async (
  orgId: string
): Promise<TransportDashboardStats> => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [vehiclesSnap, routesSnap, driversSnap, assignsSnap, tripsSnap, settings] =
    await Promise.all([
      getDocs(collection(db, "organizations", orgId, "transportVehicles")),
      getDocs(
        query(
          collection(db, "organizations", orgId, "transportRoutes"),
          where("status", "==", "Active")
        )
      ),
      getDocs(
        query(
          collection(db, "organizations", orgId, "transportDrivers"),
          where("status", "==", "Active")
        )
      ),
      getDocs(
        query(
          collection(db, "organizations", orgId, "transportAssignments"),
          where("status", "==", "Active")
        )
      ),
      getDocs(
        query(
          collection(db, "organizations", orgId, "transportTrips"),
          where("date", "==", todayStr)
        )
      ),
      getTransportSettings(orgId),
    ]);

  const vehicles = vehiclesSnap.docs.map((d) => d.data() as TransportVehicle);
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === "Maintenance").length;

  const activeRoutes = routesSnap.size;
  const activeDrivers = driversSnap.size;
  const assignedStudents = assignsSnap.size;
  const todayTripsCount = tripsSnap.size;

  let expiringDocsCount = 0;
  vehicles.forEach((v) => {
    const warningDays = settings.docExpiryWarningDays || 30;
    if (v.insuranceExpiry && calculateDocumentStatus(v.insuranceExpiry, warningDays) === "Expiring Soon") expiringDocsCount++;
    if (v.fitnessExpiry && calculateDocumentStatus(v.fitnessExpiry, warningDays) === "Expiring Soon") expiringDocsCount++;
    if (v.permitExpiry && calculateDocumentStatus(v.permitExpiry, warningDays) === "Expiring Soon") expiringDocsCount++;
    if (v.pollutionExpiry && calculateDocumentStatus(v.pollutionExpiry, warningDays) === "Expiring Soon") expiringDocsCount++;
  });

  return {
    totalVehicles,
    activeVehicles,
    maintenanceVehicles,
    activeRoutes,
    assignedStudents,
    activeDrivers,
    todayTripsCount,
    expiringDocsCount,
  };
};
