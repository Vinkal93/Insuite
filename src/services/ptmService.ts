import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  PtmEvent,
  PtmSlot,
  PtmAppointment,
  PtmMeetingNote,
  PtmSettingsConfig,
  TeacherAvailability,
  PtmDashboardStats,
} from "@/types/ptm";
import { createAuditLog } from "./auditService";

export const DEFAULT_PTM_SETTINGS: PtmSettingsConfig = {
  defaultSlotDuration: 15,
  cancellationWindowHours: 2,
  reminderTimingHours: 24,
  maxAppointmentsPerParent: 5,
  maxAppointmentsPerTeacher: 30,
};

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------

export const getPtmSettings = async (orgId: string): Promise<PtmSettingsConfig> => {
  const ref = doc(db, "organizations", orgId, "ptmSettings", "config");
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_PTM_SETTINGS;
  return { ...DEFAULT_PTM_SETTINGS, ...snap.data() } as PtmSettingsConfig;
};

export const updatePtmSettings = async (
  orgId: string,
  settings: Partial<PtmSettingsConfig>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "ptmSettings", "config");
  await setDoc(ref, settings, { merge: true });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SETTINGS_UPDATED",
    entityType: "PTM_SETTINGS",
    entityId: "config",
    metadata: settings,
  });
};

// ----------------------------------------------------
// EVENTS MANAGEMENT
// ----------------------------------------------------

export const createPtmEvent = async (
  orgId: string,
  input: Omit<PtmEvent, "id" | "organizationId" | "createdAt" | "createdBy">,
  actor: { uid: string; name: string }
): Promise<PtmEvent> => {
  const col = collection(db, "organizations", orgId, "ptmEvents");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const event: PtmEvent = {
    ...input,
    id: newDoc.id,
    organizationId: orgId,
    createdBy: actor.uid,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDoc, event);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EVENT_CREATED",
    entityType: "PTM_EVENT",
    entityId: newDoc.id,
    metadata: { name: event.name, date: event.date },
  });

  return event;
};

export const updatePtmEvent = async (
  orgId: string,
  eventId: string,
  input: Partial<PtmEvent>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "ptmEvents", eventId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    ...input,
    updatedBy: actor.uid,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EVENT_UPDATED",
    entityType: "PTM_EVENT",
    entityId: eventId,
    metadata: input,
  });
};

export const getPtmEvent = async (orgId: string, eventId: string): Promise<PtmEvent | null> => {
  const ref = doc(db, "organizations", orgId, "ptmEvents", eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as PtmEvent;
};

export const listPtmEvents = async (
  orgId: string,
  filters?: { status?: string }
): Promise<PtmEvent[]> => {
  const col = collection(db, "organizations", orgId, "ptmEvents");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as PtmEvent);

  if (filters?.status) {
    list = list.filter((e) => e.status === filters.status);
  }

  return list.sort((a, b) => b.date.localeCompare(a.date));
};

// ----------------------------------------------------
// TIME SLOTS GENERATION & RETRIEVAL
// ----------------------------------------------------

export const generatePtmSlots = async (
  orgId: string,
  eventId: string,
  teachers: { id: string; name: string }[],
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
  actor: { uid: string; name: string }
): Promise<PtmSlot[]> => {
  const slotsCol = collection(db, "organizations", orgId, "ptmSlots");
  const slots: PtmSlot[] = [];

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (const t of teachers) {
    let current = startMinutes;
    while (current + slotDurationMinutes <= endMinutes) {
      const slotStartH = Math.floor(current / 60);
      const slotStartM = current % 60;
      const slotEndH = Math.floor((current + slotDurationMinutes) / 60);
      const slotEndM = (current + slotDurationMinutes) % 60;

      const slotStartStr = `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`;
      const slotEndStr = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`;

      const newSlotDoc = doc(slotsCol);
      const now = new Date().toISOString();

      const slot: PtmSlot = {
        id: newSlotDoc.id,
        organizationId: orgId,
        eventId,
        teacherId: t.id,
        teacherName: t.name,
        startTime: slotStartStr,
        endTime: slotEndStr,
        status: "AVAILABLE",
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(newSlotDoc, slot);
      slots.push(slot);

      current += slotDurationMinutes;
    }
  }

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SLOT_CREATED",
    entityType: "PTM_SLOTS",
    entityId: eventId,
    metadata: { count: slots.length, duration: slotDurationMinutes },
  });

  return slots;
};

export const listPtmSlots = async (
  orgId: string,
  eventId: string,
  teacherId?: string
): Promise<PtmSlot[]> => {
  const col = collection(db, "organizations", orgId, "ptmSlots");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as PtmSlot);

  list = list.filter((s) => s.eventId === eventId);
  if (teacherId) {
    list = list.filter((s) => s.teacherId === teacherId);
  }

  return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// ----------------------------------------------------
// ATOMIC BOOKING WITH DOUBLE-BOOKING PROTECTION
// ----------------------------------------------------

export const bookPtmSlotAtomic = async (
  orgId: string,
  slotId: string,
  appointmentData: Omit<PtmAppointment, "id" | "organizationId" | "slotId" | "status" | "bookedAt" | "createdAt" | "updatedAt">,
  actor: { uid: string; name: string }
): Promise<PtmAppointment> => {
  const slotRef = doc(db, "organizations", orgId, "ptmSlots", slotId);
  const apptCol = collection(db, "organizations", orgId, "ptmAppointments");
  const newApptDoc = doc(apptCol);
  const now = new Date().toISOString();

  let createdAppointment: PtmAppointment | null = null;

  await runTransaction(db, async (transaction) => {
    const slotSnap = await transaction.get(slotRef);
    if (!slotSnap.exists()) {
      throw new Error("Time slot does not exist.");
    }

    const slotData = slotSnap.data() as PtmSlot;
    if (slotData.status !== "AVAILABLE") {
      throw new Error("Sorry, this slot is no longer available. It was just booked by another parent.");
    }

    const appointment: PtmAppointment = {
      ...appointmentData,
      id: newApptDoc.id,
      organizationId: orgId,
      slotId,
      status: "CONFIRMED",
      bookedAt: now,
      confirmedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(newApptDoc, appointment);
    transaction.update(slotRef, {
      status: "BOOKED",
      appointmentId: newApptDoc.id,
      updatedAt: now,
    });

    createdAppointment = appointment;
  });

  if (!createdAppointment) {
    throw new Error("Failed to finalize appointment booking.");
  }

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPOINTMENT_BOOKED",
    entityType: "PTM_APPOINTMENT",
    entityId: newApptDoc.id,
    metadata: {
      slotId,
      studentName: appointmentData.studentName,
      teacherName: appointmentData.teacherName,
      time: `${appointmentData.startTime} - ${appointmentData.endTime}`,
    },
  });

  return createdAppointment;
};

// ----------------------------------------------------
// ATOMIC APPOINTMENT CANCELLATION
// ----------------------------------------------------

export const cancelPtmAppointment = async (
  orgId: string,
  appointmentId: string,
  cancellationReason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const apptRef = doc(db, "organizations", orgId, "ptmAppointments", appointmentId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const apptSnap = await transaction.get(apptRef);
    if (!apptSnap.exists()) throw new Error("Appointment not found.");

    const appt = apptSnap.data() as PtmAppointment;
    if (appt.status === "CANCELLED") {
      throw new Error("Appointment is already cancelled.");
    }

    const slotRef = doc(db, "organizations", orgId, "ptmSlots", appt.slotId);

    transaction.update(apptRef, {
      status: "CANCELLED",
      cancelledAt: now,
      cancelledBy: actor.name,
      cancellationReason,
      updatedAt: now,
    });

    transaction.update(slotRef, {
      status: "AVAILABLE",
      appointmentId: "",
      updatedAt: now,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPOINTMENT_CANCELLED",
    entityType: "PTM_APPOINTMENT",
    entityId: appointmentId,
    metadata: { cancellationReason },
  });
};

// ----------------------------------------------------
// MEETING COMPLETION & NOTES
// ----------------------------------------------------

export const completePtmAppointment = async (
  orgId: string,
  appointmentId: string,
  noteData: {
    internalNotes?: string;
    parentSummary?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
  },
  actor: { uid: string; name: string }
): Promise<void> => {
  const apptRef = doc(db, "organizations", orgId, "ptmAppointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Appointment not found.");
  const appt = apptSnap.data() as PtmAppointment;

  const now = new Date().toISOString();

  await updateDoc(apptRef, {
    status: "COMPLETED",
    completedAt: now,
    updatedAt: now,
  });

  const slotRef = doc(db, "organizations", orgId, "ptmSlots", appt.slotId);
  await updateDoc(slotRef, {
    status: "COMPLETED",
    updatedAt: now,
  });

  const noteCol = collection(db, "organizations", orgId, "ptmMeetingNotes");
  const newNoteDoc = doc(noteCol);
  const meetingNote: PtmMeetingNote = {
    id: newNoteDoc.id,
    organizationId: orgId,
    appointmentId,
    teacherId: appt.teacherId,
    studentId: appt.studentId,
    internalNotes: noteData.internalNotes || "",
    parentSummary: noteData.parentSummary || "",
    followUpRequired: noteData.followUpRequired || false,
    followUpDate: noteData.followUpDate || "",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newNoteDoc, meetingNote);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPOINTMENT_COMPLETED",
    entityType: "PTM_APPOINTMENT",
    entityId: appointmentId,
    metadata: { studentName: appt.studentName },
  });
};

export const getPtmMeetingNote = async (
  orgId: string,
  appointmentId: string
): Promise<PtmMeetingNote | null> => {
  const noteCol = collection(db, "organizations", orgId, "ptmMeetingNotes");
  const q = query(noteCol, where("appointmentId", "==", appointmentId), firestoreLimit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as PtmMeetingNote;
};

// ----------------------------------------------------
// LIST APPOINTMENTS & DASHBOARD STATS
// ----------------------------------------------------

export const listPtmAppointments = async (
  orgId: string,
  filters?: {
    eventId?: string;
    parentId?: string;
    studentId?: string;
    teacherId?: string;
    status?: string;
  }
): Promise<PtmAppointment[]> => {
  const col = collection(db, "organizations", orgId, "ptmAppointments");
  const snaps = await getDocs(col);
  let list = snaps.docs.map((d) => d.data() as PtmAppointment);

  if (filters?.eventId) list = list.filter((a) => a.eventId === filters.eventId);
  if (filters?.parentId) list = list.filter((a) => a.parentId === filters.parentId);
  if (filters?.studentId) list = list.filter((a) => a.studentId === filters.studentId);
  if (filters?.teacherId) list = list.filter((a) => a.teacherId === filters.teacherId);
  if (filters?.status) list = list.filter((a) => a.status === filters.status);

  return list.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
};

export const getPtmDashboardStats = async (orgId: string): Promise<PtmDashboardStats> => {
  const [eventsSnap, slotsSnap, apptsSnap] = await Promise.all([
    getDocs(collection(db, "organizations", orgId, "ptmEvents")),
    getDocs(collection(db, "organizations", orgId, "ptmSlots")),
    getDocs(collection(db, "organizations", orgId, "ptmAppointments")),
  ]);

  const events = eventsSnap.docs.map((d) => d.data() as PtmEvent);
  const slots = slotsSnap.docs.map((d) => d.data() as PtmSlot);
  const appts = apptsSnap.docs.map((d) => d.data() as PtmAppointment);

  return {
    upcomingMeetingsCount: appts.filter((a) => a.status === "CONFIRMED" || a.status === "REQUESTED").length,
    activeEventsCount: events.filter((e) => e.status === "OPEN" || e.status === "PUBLISHED").length,
    availableSlotsCount: slots.filter((s) => s.status === "AVAILABLE").length,
    bookedSlotsCount: slots.filter((s) => s.status === "BOOKED").length,
    completedMeetingsCount: appts.filter((a) => a.status === "COMPLETED").length,
    cancelledMeetingsCount: appts.filter((a) => a.status === "CANCELLED").length,
  };
};
