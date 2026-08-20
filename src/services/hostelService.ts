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
  runTransaction,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Hostel,
  HostelBuilding,
  HostelFloor,
  HostelRoom,
  HostelBed,
  HostelAllocation,
  HostelAttendance,
  HostelLeaveRequest,
  HostelComplaint,
  HostelMaintenance,
  HostelSettingsConfig,
  HostelDashboardStats,
} from "@/types/hostel";
import { createAuditLog } from "./auditService";

export const DEFAULT_HOSTEL_SETTINGS: HostelSettingsConfig = {
  genderStrictness: true,
  maxOccupancyAlertPercent: 90,
  curfewTime: "20:00",
  allowStudentLeaveRequest: true,
  allowParentLeaveRequest: true,
};

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------

export const getHostelSettings = async (orgId: string): Promise<HostelSettingsConfig> => {
  const ref = doc(db, "organizations", orgId, "hostelSettings", "config");
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_HOSTEL_SETTINGS;
  return { ...DEFAULT_HOSTEL_SETTINGS, ...snap.data() } as HostelSettingsConfig;
};

export const updateHostelSettings = async (
  orgId: string,
  settings: Partial<HostelSettingsConfig>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "hostelSettings", "config");
  await setDoc(ref, settings, { merge: true });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SETTINGS_UPDATED",
    entityType: "HOSTEL_SETTINGS",
    entityId: "config",
    metadata: settings,
  });
};

// ----------------------------------------------------
// HOSTELS CRUD
// ----------------------------------------------------

export const createHostel = async (
  orgId: string,
  input: Omit<Hostel, "id" | "organizationId" | "createdAt" | "createdBy">,
  actor: { uid: string; name: string }
): Promise<Hostel> => {
  const col = collection(db, "organizations", orgId, "hostels");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const hostel: Hostel = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdBy: actor.name,
    createdAt: now,
  };

  await setDoc(newDoc, hostel);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "HOSTEL_CREATED",
    entityType: "HOSTEL",
    entityId: newDoc.id,
    metadata: { name: hostel.name, code: hostel.code },
  });

  return hostel;
};

export const updateHostel = async (
  orgId: string,
  hostelId: string,
  input: Partial<Hostel>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "hostels", hostelId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    ...input,
    updatedAt: now,
    updatedBy: actor.name,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "HOSTEL_UPDATED",
    entityType: "HOSTEL",
    entityId: hostelId,
    metadata: input,
  });
};

export const listHostels = async (orgId: string): Promise<Hostel[]> => {
  const col = collection(db, "organizations", orgId, "hostels");
  const snaps = await getDocs(col);
  const list = snaps.docs.map((d) => d.data() as Hostel);
  return list.sort((a, b) => a.name.localeCompare(b.name));
};

export const getHostel = async (orgId: string, hostelId: string): Promise<Hostel | null> => {
  const ref = doc(db, "organizations", orgId, "hostels", hostelId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Hostel;
};

// ----------------------------------------------------
// BUILDINGS & FLOORS
// ----------------------------------------------------

export const createHostelBuilding = async (
  orgId: string,
  input: Omit<HostelBuilding, "id" | "organizationId" | "createdAt">,
  actor: { uid: string; name: string }
): Promise<HostelBuilding> => {
  const col = collection(db, "organizations", orgId, "hostelBuildings");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const bld: HostelBuilding = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: now,
  };

  await setDoc(newDoc, bld);
  return bld;
};

export const listHostelBuildings = async (
  orgId: string,
  hostelId?: string
): Promise<HostelBuilding[]> => {
  const col = collection(db, "organizations", orgId, "hostelBuildings");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelBuilding);
  if (hostelId) {
    list = list.filter((b) => b.hostelId === hostelId);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
};

export const createHostelFloor = async (
  orgId: string,
  input: Omit<HostelFloor, "id" | "organizationId" | "createdAt">,
  actor: { uid: string; name: string }
): Promise<HostelFloor> => {
  const col = collection(db, "organizations", orgId, "hostelFloors");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const floor: HostelFloor = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: now,
  };

  await setDoc(newDoc, floor);
  return floor;
};

export const listHostelFloors = async (
  orgId: string,
  buildingId?: string
): Promise<HostelFloor[]> => {
  const col = collection(db, "organizations", orgId, "hostelFloors");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelFloor);
  if (buildingId) {
    list = list.filter((f) => f.buildingId === buildingId);
  }
  return list.sort((a, b) => a.floorNumber - b.floorNumber);
};

// ----------------------------------------------------
// ROOMS & BEDS
// ----------------------------------------------------

export const createHostelRoom = async (
  orgId: string,
  input: Omit<HostelRoom, "id" | "organizationId" | "occupiedCount" | "createdAt">,
  actor: { uid: string; name: string }
): Promise<HostelRoom> => {
  if (input.capacity <= 0) throw new Error("Room capacity must be greater than 0.");

  const roomCol = collection(db, "organizations", orgId, "hostelRooms");
  const newDoc = doc(roomCol);
  const now = new Date().toISOString();

  const room: HostelRoom = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    occupiedCount: 0,
    createdAt: now,
  };

  await setDoc(newDoc, room);

  // Automatically generate unique beds for the room
  const bedCol = collection(db, "organizations", orgId, "hostelBeds");
  for (let i = 1; i <= input.capacity; i++) {
    const bedDoc = doc(bedCol);
    const bedNumber = `BED-${input.roomNumber}-${String(i).padStart(2, "0")}`;
    const bed: HostelBed = {
      id: bedDoc.id,
      organizationId: orgId,
      hostelId: input.hostelId,
      buildingId: input.buildingId,
      floorId: input.floorId,
      roomId: room.id,
      roomNumber: input.roomNumber,
      bedNumber,
      status: "Available",
      createdAt: now,
    };
    await setDoc(bedDoc, bed);
  }

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ROOM_CREATED",
    entityType: "HOSTEL_ROOM",
    entityId: room.id,
    metadata: { roomNumber: room.roomNumber, capacity: room.capacity },
  });

  return room;
};

export const listHostelRooms = async (
  orgId: string,
  filters?: { hostelId?: string; buildingId?: string; floorId?: string }
): Promise<HostelRoom[]> => {
  const col = collection(db, "organizations", orgId, "hostelRooms");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelRoom);

  if (filters?.hostelId) list = list.filter((r) => r.hostelId === filters.hostelId);
  if (filters?.buildingId) list = list.filter((r) => r.buildingId === filters.buildingId);
  if (filters?.floorId) list = list.filter((r) => r.floorId === filters.floorId);

  return list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
};

export const listHostelBeds = async (
  orgId: string,
  filters?: { hostelId?: string; roomId?: string; status?: string }
): Promise<HostelBed[]> => {
  const col = collection(db, "organizations", orgId, "hostelBeds");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelBed);

  if (filters?.hostelId) list = list.filter((b) => b.hostelId === filters.hostelId);
  if (filters?.roomId) list = list.filter((b) => b.roomId === filters.roomId);
  if (filters?.status) list = list.filter((b) => b.status === filters.status);

  return list.sort((a, b) => a.bedNumber.localeCompare(b.bedNumber));
};

export const getAvailableBeds = async (orgId: string, roomId?: string): Promise<HostelBed[]> => {
  return listHostelBeds(orgId, { roomId, status: "Available" });
};

// ----------------------------------------------------
// ALLOCATIONS (ATOMIC TRANSACTIONAL ENGINE)
// ----------------------------------------------------

export const allocateStudentBed = async (
  orgId: string,
  input: {
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
    allocationDate: string;
    expectedCheckoutDate?: string;
    notes?: string;
  },
  actor: { uid: string; name: string }
): Promise<HostelAllocation> => {
  const bedRef = doc(db, "organizations", orgId, "hostelBeds", input.bedId);
  const roomRef = doc(db, "organizations", orgId, "hostelRooms", input.roomId);
  const allocCol = collection(db, "organizations", orgId, "hostelAllocations");
  const newAllocRef = doc(allocCol);
  const now = new Date().toISOString();

  let createdAllocation: HostelAllocation | null = null;

  await runTransaction(db, async (transaction) => {
    // 1. Verify Bed is Available
    const bedSnap = await transaction.get(bedRef);
    if (!bedSnap.exists()) throw new Error("Selected bed record does not exist.");
    const bedData = bedSnap.data() as HostelBed;

    if (bedData.status !== "Available") {
      throw new Error(`Bed ${bedData.bedNumber} is already occupied or unavailable.`);
    }

    // 2. Check if student already has active allocation
    const existingSnap = await getDocs(
      query(
        collection(db, "organizations", orgId, "hostelAllocations"),
        where("studentId", "==", input.studentId),
        where("status", "==", "Active")
      )
    );
    if (!existingSnap.empty) {
      throw new Error(`Student ${input.studentName} already has an active hostel bed allocated.`);
    }

    // 3. Update Room Occupied Count
    const roomSnap = await transaction.get(roomRef);
    if (roomSnap.exists()) {
      const roomData = roomSnap.data() as HostelRoom;
      transaction.update(roomRef, {
        occupiedCount: (roomData.occupiedCount || 0) + 1,
        updatedAt: now,
      });
    }

    // 4. Create Allocation Document
    const allocation: HostelAllocation = {
      ...input,
      id: newAllocRef.id,
      organizationId: orgId,
      status: "Active",
      createdBy: actor.name,
      createdAt: now,
    };
    transaction.set(newAllocRef, allocation);
    createdAllocation = allocation;

    // 5. Update Bed Status
    transaction.update(bedRef, {
      status: "Occupied",
      currentAllocationId: newAllocRef.id,
      currentStudentId: input.studentId,
      currentStudentName: input.studentName,
      updatedAt: now,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BED_ALLOCATED",
    entityType: "HOSTEL_ALLOCATION",
    entityId: newAllocRef.id,
    metadata: { student: input.studentName, bed: input.bedNumber, room: input.roomNumber },
  });

  return createdAllocation!;
};

export const transferStudentBed = async (
  orgId: string,
  allocationId: string,
  target: {
    hostelId: string;
    hostelName: string;
    buildingId: string;
    floorId: string;
    roomId: string;
    roomNumber: string;
    bedId: string;
    bedNumber: string;
    reason: string;
  },
  actor: { uid: string; name: string }
): Promise<void> => {
  const allocRef = doc(db, "organizations", orgId, "hostelAllocations", allocationId);
  const newBedRef = doc(db, "organizations", orgId, "hostelBeds", target.bedId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const allocSnap = await transaction.get(allocRef);
    if (!allocSnap.exists()) throw new Error("Allocation not found.");
    const oldAlloc = allocSnap.data() as HostelAllocation;

    if (oldAlloc.status !== "Active") {
      throw new Error("Cannot transfer an inactive allocation.");
    }

    // Check new bed
    const newBedSnap = await transaction.get(newBedRef);
    if (!newBedSnap.exists()) throw new Error("Target bed does not exist.");
    const newBed = newBedSnap.data() as HostelBed;
    if (newBed.status !== "Available") {
      throw new Error(`Target bed ${newBed.bedNumber} is not available.`);
    }

    // Release old bed
    const oldBedRef = doc(db, "organizations", orgId, "hostelBeds", oldAlloc.bedId);
    transaction.update(oldBedRef, {
      status: "Available",
      currentAllocationId: null,
      currentStudentId: null,
      currentStudentName: null,
      updatedAt: now,
    });

    // Update old room count
    const oldRoomRef = doc(db, "organizations", orgId, "hostelRooms", oldAlloc.roomId);
    const oldRoomSnap = await transaction.get(oldRoomRef);
    if (oldRoomSnap.exists()) {
      const oldRoomData = oldRoomSnap.data() as HostelRoom;
      transaction.update(oldRoomRef, {
        occupiedCount: Math.max(0, (oldRoomData.occupiedCount || 1) - 1),
        updatedAt: now,
      });
    }

    // Occupy new bed
    transaction.update(newBedRef, {
      status: "Occupied",
      currentAllocationId: allocationId,
      currentStudentId: oldAlloc.studentId,
      currentStudentName: oldAlloc.studentName,
      updatedAt: now,
    });

    // Update new room count
    const newRoomRef = doc(db, "organizations", orgId, "hostelRooms", target.roomId);
    const newRoomSnap = await transaction.get(newRoomRef);
    if (newRoomSnap.exists()) {
      const newRoomData = newRoomSnap.data() as HostelRoom;
      transaction.update(newRoomRef, {
        occupiedCount: (newRoomData.occupiedCount || 0) + 1,
        updatedAt: now,
      });
    }

    // Update allocation record
    transaction.update(allocRef, {
      hostelId: target.hostelId,
      hostelName: target.hostelName,
      buildingId: target.buildingId,
      floorId: target.floorId,
      roomId: target.roomId,
      roomNumber: target.roomNumber,
      bedId: target.bedId,
      bedNumber: target.bedNumber,
      reason: target.reason,
      updatedBy: actor.name,
      updatedAt: now,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BED_TRANSFERRED",
    entityType: "HOSTEL_ALLOCATION",
    entityId: allocationId,
    metadata: { newBed: target.bedNumber, reason: target.reason },
  });
};

export const checkoutStudentAllocation = async (
  orgId: string,
  allocationId: string,
  reason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const allocRef = doc(db, "organizations", orgId, "hostelAllocations", allocationId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const allocSnap = await transaction.get(allocRef);
    if (!allocSnap.exists()) throw new Error("Allocation not found.");
    const alloc = allocSnap.data() as HostelAllocation;

    if (alloc.status !== "Active") {
      throw new Error("Allocation is already checked out or completed.");
    }

    // Release bed
    const bedRef = doc(db, "organizations", orgId, "hostelBeds", alloc.bedId);
    transaction.update(bedRef, {
      status: "Available",
      currentAllocationId: null,
      currentStudentId: null,
      currentStudentName: null,
      updatedAt: now,
    });

    // Update room count
    const roomRef = doc(db, "organizations", orgId, "hostelRooms", alloc.roomId);
    const roomSnap = await transaction.get(roomRef);
    if (roomSnap.exists()) {
      const roomData = roomSnap.data() as HostelRoom;
      transaction.update(roomRef, {
        occupiedCount: Math.max(0, (roomData.occupiedCount || 1) - 1),
        updatedAt: now,
      });
    }

    // Update allocation
    transaction.update(allocRef, {
      status: "Completed",
      actualCheckoutDate: now.split("T")[0],
      reason,
      updatedBy: actor.name,
      updatedAt: now,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BED_CHECKOUT",
    entityType: "HOSTEL_ALLOCATION",
    entityId: allocationId,
    metadata: { reason },
  });
};

export const listHostelAllocations = async (
  orgId: string,
  filters?: { hostelId?: string; status?: string; studentId?: string }
): Promise<HostelAllocation[]> => {
  const col = collection(db, "organizations", orgId, "hostelAllocations");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelAllocation);

  if (filters?.hostelId) list = list.filter((a) => a.hostelId === filters.hostelId);
  if (filters?.status) list = list.filter((a) => a.status === filters.status);
  if (filters?.studentId) list = list.filter((a) => a.studentId === filters.studentId);

  return list.sort((a, b) => b.allocationDate.localeCompare(a.allocationDate));
};

export const getStudentHostelRecord = async (
  orgId: string,
  studentId: string
): Promise<HostelAllocation | null> => {
  const list = await listHostelAllocations(orgId, { studentId, status: "Active" });
  return list.length > 0 ? list[0] : null;
};

// ----------------------------------------------------
// HOSTEL ATTENDANCE
// ----------------------------------------------------

export const submitHostelAttendance = async (
  orgId: string,
  input: {
    hostelId: string;
    date: string;
    records: HostelAttendance["records"];
  },
  actor: { uid: string; name: string }
): Promise<void> => {
  const docId = `${input.hostelId}_${input.date}`;
  const ref = doc(db, "organizations", orgId, "hostelAttendance", docId);
  const now = new Date().toISOString();

  const attendance: HostelAttendance = {
    id: docId,
    organizationId: orgId,
    hostelId: input.hostelId,
    date: input.date,
    records: input.records,
    takenBy: actor.name,
    takenAt: now,
    createdAt: now,
  };

  await setDoc(ref, attendance, { merge: true });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "HOSTEL_ATTENDANCE_TAKEN",
    entityType: "HOSTEL_ATTENDANCE",
    entityId: docId,
    metadata: { date: input.date, studentCount: input.records.length },
  });
};

export const getHostelAttendanceByDate = async (
  orgId: string,
  hostelId: string,
  date: string
): Promise<HostelAttendance | null> => {
  const docId = `${hostelId}_${date}`;
  const ref = doc(db, "organizations", orgId, "hostelAttendance", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as HostelAttendance;
};

// ----------------------------------------------------
// LEAVE MANAGEMENT
// ----------------------------------------------------

export const createHostelLeaveRequest = async (
  orgId: string,
  input: Omit<HostelLeaveRequest, "id" | "organizationId" | "status" | "createdAt">
): Promise<HostelLeaveRequest> => {
  const col = collection(db, "organizations", orgId, "hostelLeaveRequests");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const req: HostelLeaveRequest = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    status: "Pending",
    createdAt: now,
  };

  await setDoc(newDoc, req);
  return req;
};

export const approveHostelLeaveRequest = async (
  orgId: string,
  leaveId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "hostelLeaveRequests", leaveId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status: "Approved",
    approvedBy: actor.name,
    approvedAt: now,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "LEAVE_APPROVED",
    entityType: "HOSTEL_LEAVE",
    entityId: leaveId,
    metadata: {},
  });
};

export const rejectHostelLeaveRequest = async (
  orgId: string,
  leaveId: string,
  rejectionReason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "hostelLeaveRequests", leaveId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status: "Rejected",
    rejectionReason,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "LEAVE_REJECTED",
    entityType: "HOSTEL_LEAVE",
    entityId: leaveId,
    metadata: { rejectionReason },
  });
};

export const listHostelLeaveRequests = async (
  orgId: string,
  filters?: { studentId?: string; status?: string }
): Promise<HostelLeaveRequest[]> => {
  const col = collection(db, "organizations", orgId, "hostelLeaveRequests");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelLeaveRequest);

  if (filters?.studentId) list = list.filter((l) => l.studentId === filters.studentId);
  if (filters?.status) list = list.filter((l) => l.status === filters.status);

  return list.sort((a, b) => b.fromDate.localeCompare(a.fromDate));
};

// ----------------------------------------------------
// COMPLAINTS
// ----------------------------------------------------

export const createHostelComplaint = async (
  orgId: string,
  input: Omit<HostelComplaint, "id" | "organizationId" | "status" | "createdAt">
): Promise<HostelComplaint> => {
  const col = collection(db, "organizations", orgId, "hostelComplaints");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const c: HostelComplaint = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    status: "Open",
    createdAt: now,
  };

  await setDoc(newDoc, c);
  return c;
};

export const updateHostelComplaintStatus = async (
  orgId: string,
  complaintId: string,
  status: HostelComplaint["status"],
  resolution: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "hostelComplaints", complaintId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status,
    resolution,
    resolvedAt: status === "Resolved" || status === "Closed" ? now : undefined,
    updatedAt: now,
  });
};

export const listHostelComplaints = async (
  orgId: string,
  filters?: { hostelId?: string; studentId?: string; status?: string }
): Promise<HostelComplaint[]> => {
  const col = collection(db, "organizations", orgId, "hostelComplaints");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelComplaint);

  if (filters?.hostelId) list = list.filter((c) => c.hostelId === filters.hostelId);
  if (filters?.studentId) list = list.filter((c) => c.studentId === filters.studentId);
  if (filters?.status) list = list.filter((c) => c.status === filters.status);

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// ----------------------------------------------------
// MAINTENANCE
// ----------------------------------------------------

export const createHostelMaintenance = async (
  orgId: string,
  input: Omit<HostelMaintenance, "id" | "organizationId" | "createdAt">
): Promise<HostelMaintenance> => {
  const col = collection(db, "organizations", orgId, "hostelMaintenance");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const m: HostelMaintenance = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: now,
  };

  await setDoc(newDoc, m);
  return m;
};

export const listHostelMaintenance = async (
  orgId: string,
  filters?: { hostelId?: string; status?: string }
): Promise<HostelMaintenance[]> => {
  const col = collection(db, "organizations", orgId, "hostelMaintenance");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as HostelMaintenance);

  if (filters?.hostelId) list = list.filter((m) => m.hostelId === filters.hostelId);
  if (filters?.status) list = list.filter((m) => m.status === filters.status);

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------

export const getHostelDashboardStats = async (orgId: string): Promise<HostelDashboardStats> => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [hostelsSnap, bedsSnap, allocsSnap, leavesSnap, complaintsSnap, maintSnap] =
    await Promise.all([
      getDocs(collection(db, "organizations", orgId, "hostels")),
      getDocs(collection(db, "organizations", orgId, "hostelBeds")),
      getDocs(collection(db, "organizations", orgId, "hostelAllocations")),
      getDocs(collection(db, "organizations", orgId, "hostelLeaveRequests")),
      getDocs(collection(db, "organizations", orgId, "hostelComplaints")),
      getDocs(collection(db, "organizations", orgId, "hostelMaintenance")),
    ]);

  const hostels = hostelsSnap.docs.map((d) => d.data() as Hostel);
  const beds = bedsSnap.docs.map((d) => d.data() as HostelBed);
  const allocs = allocsSnap.docs.map((d) => d.data() as HostelAllocation);
  const leaves = leavesSnap.docs.map((d) => d.data() as HostelLeaveRequest);
  const complaints = complaintsSnap.docs.map((d) => d.data() as HostelComplaint);
  const maint = maintSnap.docs.map((d) => d.data() as HostelMaintenance);

  const activeAllocs = allocs.filter((a) => a.status === "Active");
  const totalCapacity = hostels.reduce((acc, h) => acc + (h.capacity || 0), 0);
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;

  return {
    totalHostelsCount: hostels.length,
    totalCapacity,
    occupiedBedsCount: occupiedBeds,
    availableBedsCount: availableBeds,
    activeAllocationsCount: activeAllocs.length,
    todayAttendanceStats: {
      present: activeAllocs.length,
      absent: 0,
      leave: leaves.filter((l) => l.status === "Approved" && l.fromDate <= todayStr && l.toDate >= todayStr).length,
      total: activeAllocs.length,
    },
    pendingLeavesCount: leaves.filter((l) => l.status === "Pending").length,
    openComplaintsCount: complaints.filter((c) => c.status === "Open" || c.status === "In Progress").length,
    openMaintenanceCount: maint.filter((m) => m.status === "Open" || m.status === "In Progress").length,
  };
};
