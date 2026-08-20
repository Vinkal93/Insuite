import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  FrontOfficeVisitor,
  FrontOfficeVisit,
  FrontOfficeGatePass,
  FrontOfficeAppointment,
  FrontOfficeCall,
  FrontOfficeCorrespondence,
  FrontOfficeTask,
  FrontOfficeSettingsConfig,
  FrontOfficeDashboardStats,
} from "@/types/frontOffice";
import { createAuditLog } from "./auditService";

export const DEFAULT_FRONT_OFFICE_SETTINGS: FrontOfficeSettingsConfig = {
  gatePassPrefix: "INS-GATE",
  nextGatePassSeq: 1,
  requireIdProof: false,
  defaultPassValidityHours: 4,
  maskIdNumbers: true,
};

// ----------------------------------------------------
// SETTINGS & UNIQUE GATE PASS NUMBER GENERATION
// ----------------------------------------------------

export const getFrontOfficeSettings = async (
  orgId: string
): Promise<FrontOfficeSettingsConfig> => {
  const ref = doc(db, "organizations", orgId, "frontOfficeSettings", "config");
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_FRONT_OFFICE_SETTINGS;
  return { ...DEFAULT_FRONT_OFFICE_SETTINGS, ...snap.data() } as FrontOfficeSettingsConfig;
};

export const updateFrontOfficeSettings = async (
  orgId: string,
  settings: Partial<FrontOfficeSettingsConfig>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "frontOfficeSettings", "config");
  await setDoc(ref, settings, { merge: true });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SETTINGS_UPDATED",
    entityType: "FRONT_OFFICE_SETTINGS",
    entityId: "config",
    metadata: settings,
  });
};

export const generateUniqueGatePassNumber = async (orgId: string): Promise<string> => {
  const settingsRef = doc(db, "organizations", orgId, "frontOfficeSettings", "config");
  const year = new Date().getFullYear();

  let generatedNumber = "";

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(settingsRef);
    let currentConfig = snap.exists()
      ? (snap.data() as FrontOfficeSettingsConfig)
      : { ...DEFAULT_FRONT_OFFICE_SETTINGS };

    const seq = currentConfig.nextGatePassSeq || 1;
    const prefix = currentConfig.gatePassPrefix || "INS-GATE";
    generatedNumber = `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
    transaction.set(settingsRef, { ...currentConfig, nextGatePassSeq: seq + 1 }, { merge: true });
  });

  return generatedNumber;
};

// ----------------------------------------------------
// VISITOR REGISTRATION & CHECK-IN / CHECK-OUT
// ----------------------------------------------------

export const registerAndCheckInVisitor = async (
  orgId: string,
  input: {
    visitor: Omit<FrontOfficeVisitor, "id" | "organizationId" | "createdAt" | "createdBy">;
    personToMeetId: string;
    personToMeetName: string;
    departmentName?: string;
    purpose: string;
  },
  actor: { uid: string; name: string }
): Promise<{ visitor: FrontOfficeVisitor; visit: FrontOfficeVisit; gatePass: FrontOfficeGatePass }> => {
  const now = new Date().toISOString();

  // 1. Create or Find Visitor Record
  const visitorCol = collection(db, "organizations", orgId, "frontOfficeVisitors");
  const visitorDoc = doc(visitorCol);

  const visitor: FrontOfficeVisitor = {
    ...input.visitor,
    id: visitorDoc.id,
    organizationId: orgId,
    createdAt: now,
    createdBy: actor.name,
  };
  await setDoc(visitorDoc, visitor);

  // 2. Generate Gate Pass
  const passNumber = await generateUniqueGatePassNumber(orgId);
  const passCol = collection(db, "organizations", orgId, "frontOfficeGatePasses");
  const passDoc = doc(passCol);

  const validUntilDate = new Date();
  validUntilDate.setHours(validUntilDate.getHours() + 4);

  const gatePass: FrontOfficeGatePass = {
    id: passDoc.id,
    organizationId: orgId,
    passNumber,
    visitorId: visitor.id,
    visitorName: visitor.name,
    personToMeetName: input.personToMeetName,
    purpose: input.purpose,
    passType: visitor.visitorType,
    validFrom: now,
    validUntil: validUntilDate.toISOString(),
    status: "Active",
    verificationEnabled: true,
    createdBy: actor.name,
    createdAt: now,
  };
  await setDoc(passDoc, gatePass);

  // 3. Create Visit Record (Status: Inside)
  const visitCol = collection(db, "organizations", orgId, "frontOfficeVisits");
  const visitDoc = doc(visitCol);

  const visit: FrontOfficeVisit = {
    id: visitDoc.id,
    organizationId: orgId,
    visitorId: visitor.id,
    visitorName: visitor.name,
    visitorMobile: visitor.mobile,
    visitorType: visitor.visitorType,
    personToMeetId: input.personToMeetId,
    personToMeetName: input.personToMeetName,
    departmentName: input.departmentName,
    purpose: input.purpose,
    entryTime: now,
    status: "Inside",
    gatePassId: gatePass.id,
    gatePassNumber: passNumber,
    createdAt: now,
  };
  await setDoc(visitDoc, visit);

  // Link visitId to gatePass
  await updateDoc(passDoc, { visitId: visit.id });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VISITOR_CHECKED_IN",
    entityType: "FRONT_OFFICE_VISIT",
    entityId: visit.id,
    metadata: { visitorName: visitor.name, passNumber, personToMeet: input.personToMeetName },
  });

  return { visitor, visit, gatePass };
};

export const checkOutVisitor = async (
  orgId: string,
  visitId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const visitRef = doc(db, "organizations", orgId, "frontOfficeVisits", visitId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(visitRef);
    if (!snap.exists()) throw new Error("Visit record not found.");
    const visit = snap.data() as FrontOfficeVisit;

    if (visit.status === "Exited") {
      throw new Error("Visitor is already checked out.");
    }

    transaction.update(visitRef, {
      status: "Exited",
      exitTime: now,
      checkedOutBy: actor.name,
      updatedAt: now,
    });

    if (visit.gatePassId) {
      const passRef = doc(db, "organizations", orgId, "frontOfficeGatePasses", visit.gatePassId);
      transaction.update(passRef, {
        status: "Used",
        updatedAt: now,
      });
    }
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VISITOR_CHECKED_OUT",
    entityType: "FRONT_OFFICE_VISIT",
    entityId: visitId,
    metadata: { exitTime: now },
  });
};

export const listVisits = async (
  orgId: string,
  filters?: { status?: string; search?: string; date?: string }
): Promise<FrontOfficeVisit[]> => {
  const col = collection(db, "organizations", orgId, "frontOfficeVisits");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as FrontOfficeVisit);

  if (filters?.status) {
    list = list.filter((v) => v.status === filters.status);
  }
  if (filters?.date) {
    list = list.filter((v) => v.entryTime.startsWith(filters.date!));
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (v) =>
        v.visitorName.toLowerCase().includes(q) ||
        v.visitorMobile.includes(q) ||
        v.personToMeetName.toLowerCase().includes(q) ||
        (v.gatePassNumber && v.gatePassNumber.toLowerCase().includes(q))
    );
  }

  return list.sort((a, b) => b.entryTime.localeCompare(a.entryTime));
};

export const listActiveVisitorsInside = async (orgId: string): Promise<FrontOfficeVisit[]> => {
  return listVisits(orgId, { status: "Inside" });
};

// ----------------------------------------------------
// GATE PASSES
// ----------------------------------------------------

export const listGatePasses = async (
  orgId: string,
  filters?: { status?: string; search?: string }
): Promise<FrontOfficeGatePass[]> => {
  const col = collection(db, "organizations", orgId, "frontOfficeGatePasses");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as FrontOfficeGatePass);

  if (filters?.status) {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.passNumber.toLowerCase().includes(q) ||
        p.visitorName.toLowerCase().includes(q) ||
        p.personToMeetName.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getGatePass = async (
  orgId: string,
  passId: string
): Promise<FrontOfficeGatePass | null> => {
  const ref = doc(db, "organizations", orgId, "frontOfficeGatePasses", passId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as FrontOfficeGatePass;
};

export const verifyGatePassPublic = async (
  passNumber: string
): Promise<FrontOfficeGatePass | null> => {
  const col = collection(db, "organizations", "global", "frontOfficeGatePasses");
  // In collection group queries
  const q = query(
    collection(db, "frontOfficeGatePasses"),
    where("passNumber", "==", passNumber),
    firestoreLimit(1)
  );
  try {
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as FrontOfficeGatePass;
  } catch (err) {
    return null;
  }
};

// ----------------------------------------------------
// APPOINTMENTS
// ----------------------------------------------------

export const createFrontOfficeAppointment = async (
  orgId: string,
  input: Omit<FrontOfficeAppointment, "id" | "organizationId" | "createdAt" | "createdBy">,
  actor: { uid: string; name: string }
): Promise<FrontOfficeAppointment> => {
  // Conflict Check
  const apptCol = collection(db, "organizations", orgId, "frontOfficeAppointments");
  const snaps = await getDocs(apptCol);
  const existing = snaps.docs.map((d) => d.data() as FrontOfficeAppointment);

  const conflict = existing.find(
    (a) =>
      a.date === input.date &&
      a.personToMeetId === input.personToMeetId &&
      a.status !== "Cancelled" &&
      a.startTime === input.startTime
  );

  if (conflict) {
    throw new Error(
      `Appointment conflict: ${input.personToMeetName} already has an appointment at ${input.startTime} on ${input.date}.`
    );
  }

  const newDoc = doc(apptCol);
  const now = new Date().toISOString();

  const appt: FrontOfficeAppointment = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdBy: actor.name,
    createdAt: now,
  };

  await setDoc(newDoc, appt);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPOINTMENT_CREATED",
    entityType: "FRONT_OFFICE_APPOINTMENT",
    entityId: newDoc.id,
    metadata: { visitorName: appt.visitorName, date: appt.date, time: appt.startTime },
  });

  return appt;
};

export const completeFrontOfficeAppointment = async (
  orgId: string,
  appointmentId: string,
  completionNotes: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "frontOfficeAppointments", appointmentId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status: "Completed",
    completedAt: now,
    completedBy: actor.name,
    completionNotes,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPOINTMENT_COMPLETED",
    entityType: "FRONT_OFFICE_APPOINTMENT",
    entityId: appointmentId,
    metadata: { completionNotes },
  });
};

export const cancelFrontOfficeAppointment = async (
  orgId: string,
  appointmentId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "frontOfficeAppointments", appointmentId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status: "Cancelled",
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPOINTMENT_CANCELLED",
    entityType: "FRONT_OFFICE_APPOINTMENT",
    entityId: appointmentId,
    metadata: {},
  });
};

export const listFrontOfficeAppointments = async (
  orgId: string,
  filters?: { date?: string; status?: string }
): Promise<FrontOfficeAppointment[]> => {
  const col = collection(db, "organizations", orgId, "frontOfficeAppointments");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as FrontOfficeAppointment);

  if (filters?.date) {
    list = list.filter((a) => a.date === filters.date);
  }
  if (filters?.status) {
    list = list.filter((a) => a.status === filters.status);
  }

  return list.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
};

// ----------------------------------------------------
// PHONE CALL LOGS
// ----------------------------------------------------

export const logFrontOfficeCall = async (
  orgId: string,
  input: Omit<FrontOfficeCall, "id" | "organizationId" | "createdAt" | "createdBy">,
  actor: { uid: string; name: string }
): Promise<FrontOfficeCall> => {
  const col = collection(db, "organizations", orgId, "frontOfficeCalls");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const callLog: FrontOfficeCall = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdBy: actor.name,
    createdAt: now,
  };

  await setDoc(newDoc, callLog);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "CALL_LOGGED",
    entityType: "FRONT_OFFICE_CALL",
    entityId: newDoc.id,
    metadata: { callerName: callLog.callerName, purpose: callLog.purpose },
  });

  return callLog;
};

export const listFrontOfficeCalls = async (orgId: string): Promise<FrontOfficeCall[]> => {
  const col = collection(db, "organizations", orgId, "frontOfficeCalls");
  const snaps = await getDocs(col);
  const list = snaps.docs.map((d) => d.data() as FrontOfficeCall);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// ----------------------------------------------------
// POSTAL / CORRESPONDENCE
// ----------------------------------------------------

export const createCorrespondence = async (
  orgId: string,
  input: Omit<FrontOfficeCorrespondence, "id" | "organizationId" | "createdAt" | "createdBy">,
  actor: { uid: string; name: string }
): Promise<FrontOfficeCorrespondence> => {
  const col = collection(db, "organizations", orgId, "frontOfficeCorrespondence");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const item: FrontOfficeCorrespondence = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdBy: actor.name,
    createdAt: now,
  };

  await setDoc(newDoc, item);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "CORRESPONDENCE_CREATED",
    entityType: "FRONT_OFFICE_CORRESPONDENCE",
    entityId: newDoc.id,
    metadata: { type: item.type, subject: item.subject },
  });

  return item;
};

export const listCorrespondence = async (orgId: string): Promise<FrontOfficeCorrespondence[]> => {
  const col = collection(db, "organizations", orgId, "frontOfficeCorrespondence");
  const snaps = await getDocs(col);
  const list = snaps.docs.map((d) => d.data() as FrontOfficeCorrespondence);
  return list.sort((a, b) => b.date.localeCompare(a.date));
};

// ----------------------------------------------------
// RECEPTION TASKS
// ----------------------------------------------------

export const createFrontOfficeTask = async (
  orgId: string,
  input: Omit<FrontOfficeTask, "id" | "organizationId" | "createdAt" | "createdBy">,
  actor: { uid: string; name: string }
): Promise<FrontOfficeTask> => {
  const col = collection(db, "organizations", orgId, "frontOfficeTasks");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const task: FrontOfficeTask = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdBy: actor.name,
    createdAt: now,
  };

  await setDoc(newDoc, task);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TASK_CREATED",
    entityType: "FRONT_OFFICE_TASK",
    entityId: newDoc.id,
    metadata: { title: task.title, priority: task.priority },
  });

  return task;
};

export const completeFrontOfficeTask = async (
  orgId: string,
  taskId: string,
  completionNote: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "frontOfficeTasks", taskId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    status: "Completed",
    completedBy: actor.name,
    completedAt: now,
    completionNote,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TASK_COMPLETED",
    entityType: "FRONT_OFFICE_TASK",
    entityId: taskId,
    metadata: { completionNote },
  });
};

export const listFrontOfficeTasks = async (orgId: string): Promise<FrontOfficeTask[]> => {
  const col = collection(db, "organizations", orgId, "frontOfficeTasks");
  const snaps = await getDocs(col);
  const list = snaps.docs.map((d) => d.data() as FrontOfficeTask);
  return list.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
};

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------

export const getFrontOfficeDashboardStats = async (
  orgId: string
): Promise<FrontOfficeDashboardStats> => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [visitsSnap, passesSnap, apptsSnap, callsSnap, corresSnap, enqSnap] = await Promise.all([
    getDocs(collection(db, "organizations", orgId, "frontOfficeVisits")),
    getDocs(collection(db, "organizations", orgId, "frontOfficeGatePasses")),
    getDocs(collection(db, "organizations", orgId, "frontOfficeAppointments")),
    getDocs(collection(db, "organizations", orgId, "frontOfficeCalls")),
    getDocs(collection(db, "organizations", orgId, "frontOfficeCorrespondence")),
    getDocs(collection(db, "organizations", orgId, "admissionsEnquiries")),
  ]);

  const visits = visitsSnap.docs.map((d) => d.data() as FrontOfficeVisit);
  const passes = passesSnap.docs.map((d) => d.data() as FrontOfficeGatePass);
  const appts = apptsSnap.docs.map((d) => d.data() as FrontOfficeAppointment);
  const calls = callsSnap.docs.map((d) => d.data() as FrontOfficeCall);
  const corres = corresSnap.docs.map((d) => d.data() as FrontOfficeCorrespondence);

  return {
    todaysVisitorsCount: visits.filter((v) => v.entryTime.startsWith(todayStr)).length,
    currentlyInsideCount: visits.filter((v) => v.status === "Inside").length,
    todaysAppointmentsCount: appts.filter((a) => a.date === todayStr).length,
    todaysCallsCount: calls.filter((c) => c.createdAt.startsWith(todayStr)).length,
    openEnquiriesCount: enqSnap.docs.length,
    pendingCorrespondenceCount: corres.filter((c) => c.status === "Received" || c.status === "Forwarded").length,
    activeGatePassesCount: passes.filter((p) => p.status === "Active").length,
  };
};
