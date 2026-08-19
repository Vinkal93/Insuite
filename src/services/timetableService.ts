import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Period,
  Room,
  TimetableEntry,
  Substitution,
  TimetableSettingsConfig,
  TimetableStats,
  DayOfWeek,
} from "@/types";
import type {
  PeriodInput,
  RoomInput,
  TimetableEntryInput,
  SubstitutionInput,
  TimetableSettingsInput,
} from "@/schemas";
import { getSchoolClassById, getSectionById, getSubjectById, getTeacherById, getTeachers } from "./academicService";
import { createAuditLog } from "./auditService";

const DEFAULT_TIMETABLE_SETTINGS: TimetableSettingsConfig = {
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  defaultView: "grid",
  allowSaturday: true,
  allowSunday: false,
  conflictRules: {
    teacher: true,
    class: true,
    room: true,
  },
  substitutionSettings: {
    notifyTeacher: false,
    autoDetectAbsences: true,
  },
};

// ----------------------------------------------------
// PERIODS SERVICE
// ----------------------------------------------------

export async function getPeriods(organizationId: string): Promise<Period[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "periods");
    const q = query(collRef, orderBy("number", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Period);
  } catch (error) {
    console.error("getPeriods error:", error);
    return [];
  }
}

export async function createPeriod(organizationId: string, input: PeriodInput): Promise<Period> {
  const existingPeriods = await getPeriods(organizationId);

  // Check for time overlap
  const overlap = existingPeriods.find((p) => {
    return (
      (input.startTime >= p.startTime && input.startTime < p.endTime) ||
      (input.endTime > p.startTime && input.endTime <= p.endTime) ||
      (input.startTime <= p.startTime && input.endTime >= p.endTime)
    );
  });

  if (overlap) {
    throw new Error(`Period timings overlap with existing period "${overlap.name}" (${overlap.startTime} - ${overlap.endTime}).`);
  }

  const docRef = doc(collection(db, "organizations", organizationId, "periods"));
  const now = new Date().toISOString();

  const newPeriod: Period = {
    id: docRef.id,
    organizationId,
    name: input.name,
    number: input.number,
    startTime: input.startTime,
    endTime: input.endTime,
    type: input.type,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, newPeriod);
  return newPeriod;
}

export async function updatePeriod(
  organizationId: string,
  periodId: string,
  input: PeriodInput
): Promise<void> {
  const existingPeriods = await getPeriods(organizationId);

  // Check for time overlap with others
  const overlap = existingPeriods.find((p) => {
    if (p.id === periodId) return false;
    return (
      (input.startTime >= p.startTime && input.startTime < p.endTime) ||
      (input.endTime > p.startTime && input.endTime <= p.endTime) ||
      (input.startTime <= p.startTime && input.endTime >= p.endTime)
    );
  });

  if (overlap) {
    throw new Error(`Period timings overlap with existing period "${overlap.name}" (${overlap.startTime} - ${overlap.endTime}).`);
  }

  const docRef = doc(db, "organizations", organizationId, "periods", periodId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    name: input.name,
    number: input.number,
    startTime: input.startTime,
    endTime: input.endTime,
    type: input.type,
    status: input.status,
    updatedAt: now,
  });
}

export async function deletePeriod(organizationId: string, periodId: string): Promise<void> {
  // Check if period is used in timetable entries
  const entriesSnap = await getDocs(
    query(
      collection(db, "organizations", organizationId, "timetableEntries"),
      where("periodId", "==", periodId),
      limit(1)
    )
  );

  if (!entriesSnap.empty) {
    throw new Error("Cannot delete this period because active timetable entries are scheduled during it.");
  }

  const docRef = doc(db, "organizations", organizationId, "periods", periodId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------
// ROOMS SERVICE
// ----------------------------------------------------

export async function getRooms(organizationId: string): Promise<Room[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "rooms");
    const q = query(collRef, orderBy("roomNumber", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Room);
  } catch (error) {
    console.error("getRooms error:", error);
    return [];
  }
}

export async function createRoom(
  organizationId: string,
  input: RoomInput,
  userId: string
): Promise<Room> {
  const docRef = doc(collection(db, "organizations", organizationId, "rooms"));
  const now = new Date().toISOString();

  const newRoom: Room = {
    id: docRef.id,
    organizationId,
    name: input.name,
    roomNumber: input.roomNumber,
    type: input.type,
    capacity: input.capacity,
    floor: input.floor,
    building: input.building,
    status: input.status,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  await setDoc(docRef, newRoom);
  return newRoom;
}

export async function updateRoom(
  organizationId: string,
  roomId: string,
  input: RoomInput,
  userId: string
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "rooms", roomId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    name: input.name,
    roomNumber: input.roomNumber,
    type: input.type,
    capacity: input.capacity,
    floor: input.floor,
    building: input.building,
    status: input.status,
    updatedAt: now,
    updatedBy: userId,
  });
}

export async function deleteRoom(organizationId: string, roomId: string): Promise<void> {
  const entriesSnap = await getDocs(
    query(
      collection(db, "organizations", organizationId, "timetableEntries"),
      where("roomId", "==", roomId),
      limit(1)
    )
  );

  if (!entriesSnap.empty) {
    throw new Error("Cannot delete this room because active timetable entries are scheduled in it.");
  }

  const docRef = doc(db, "organizations", organizationId, "rooms", roomId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------
// TIMETABLE ENTRIES & CONFLICT DETECTION
// ----------------------------------------------------

/**
 * Strict conflict check before saving any timetable entry
 */
export async function checkTimetableConflicts(
  organizationId: string,
  input: TimetableEntryInput,
  excludeEntryId?: string
): Promise<{ hasConflict: boolean; message?: string }> {
  const collRef = collection(db, "organizations", organizationId, "timetableEntries");

  // Query entries for the same DayOfWeek and PeriodId in the active academic session
  const q = query(
    collRef,
    where("academicSessionId", "==", input.academicSessionId),
    where("dayOfWeek", "==", input.dayOfWeek),
    where("periodId", "==", input.periodId)
  );

  const snap = await getDocs(q);
  const existingEntries = snap.docs
    .map((d) => d.data() as TimetableEntry)
    .filter((e) => !excludeEntryId || e.id !== excludeEntryId);

  // 1. Teacher Conflict: Teacher already teaching another class
  const teacherConflict = existingEntries.find((e) => e.teacherId === input.teacherId);
  if (teacherConflict) {
    return {
      hasConflict: true,
      message: `Teacher is already assigned to ${teacherConflict.className || "Class"} (${teacherConflict.sectionName || "Section"}) during ${input.dayOfWeek} at this period.`,
    };
  }

  // 2. Class & Section Conflict: Classroom already has another subject
  const sectionConflict = existingEntries.find(
    (e) => e.classId === input.classId && e.sectionId === input.sectionId
  );
  if (sectionConflict) {
    return {
      hasConflict: true,
      message: `This section already has "${sectionConflict.subjectName || "a subject"}" scheduled during ${input.dayOfWeek} at this period.`,
    };
  }

  // 3. Room Conflict: Room already occupied by another class
  if (input.roomId) {
    const roomConflict = existingEntries.find((e) => e.roomId === input.roomId);
    if (roomConflict) {
      return {
        hasConflict: true,
        message: `Room "${roomConflict.roomName || "Room"}" is already booked for ${roomConflict.className} (${roomConflict.sectionName}) during this period.`,
      };
    }
  }

  return { hasConflict: false };
}

export async function createTimetableEntry(
  organizationId: string,
  input: TimetableEntryInput,
  userId: string,
  userName: string = "Admin"
): Promise<TimetableEntry> {
  // 1. Check Conflicts
  const conflict = await checkTimetableConflicts(organizationId, input);
  if (conflict.hasConflict) {
    throw new Error(conflict.message || "Conflict detected with existing timetable schedule.");
  }

  // 2. Resolve Names
  let className = "Class";
  let sectionName = "Section";
  let subjectName = "Subject";
  let teacherName = "Teacher";
  let roomName = "";
  let periodName = "Period";
  let periodNumber = 1;
  let startTime = "09:00";
  let endTime = "09:45";

  try {
    const [cls, sec, sub, tch, periodDoc] = await Promise.all([
      getSchoolClassById(organizationId, input.classId),
      getSectionById(organizationId, input.sectionId),
      getSubjectById(organizationId, input.subjectId),
      getTeacherById(organizationId, input.teacherId),
      getDoc(doc(db, "organizations", organizationId, "periods", input.periodId)),
    ]);

    if (cls) className = cls.name;
    if (sec) sectionName = sec.name;
    if (sub) subjectName = sub.name;
    if (tch) teacherName = tch.personal.fullName;
    if (periodDoc.exists()) {
      const pData = periodDoc.data() as Period;
      periodName = pData.name;
      periodNumber = pData.number;
      startTime = pData.startTime;
      endTime = pData.endTime;
    }

    if (input.roomId) {
      const rDoc = await getDoc(doc(db, "organizations", organizationId, "rooms", input.roomId));
      if (rDoc.exists()) {
        roomName = (rDoc.data() as Room).name;
      }
    }
  } catch (e) {
    // ignore
  }

  const docRef = doc(collection(db, "organizations", organizationId, "timetableEntries"));
  const now = new Date().toISOString();

  const newEntry: TimetableEntry = {
    id: docRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className,
    sectionId: input.sectionId,
    sectionName,
    subjectId: input.subjectId,
    subjectName,
    teacherId: input.teacherId,
    teacherName,
    roomId: input.roomId || undefined,
    roomName: roomName || undefined,
    dayOfWeek: input.dayOfWeek,
    periodId: input.periodId,
    periodNumber,
    periodName,
    startTime,
    endTime,
    status: "active",
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  await setDoc(docRef, newEntry);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "TIMETABLE_CREATED",
    entityType: "TIMETABLE",
    entityId: docRef.id,
    metadata: {
      name: `${className} ${sectionName} - ${subjectName} (${input.dayOfWeek})`,
      ...input,
    },
  });

  return newEntry;
}

export async function updateTimetableEntry(
  organizationId: string,
  entryId: string,
  input: TimetableEntryInput,
  userId: string,
  userName: string = "Admin"
): Promise<void> {
  // Check conflicts excluding this entry
  const conflict = await checkTimetableConflicts(organizationId, input, entryId);
  if (conflict.hasConflict) {
    throw new Error(conflict.message || "Conflict detected with existing schedule.");
  }

  let className = "Class";
  let sectionName = "Section";
  let subjectName = "Subject";
  let teacherName = "Teacher";
  let roomName = "";

  try {
    const [cls, sec, sub, tch] = await Promise.all([
      getSchoolClassById(organizationId, input.classId),
      getSectionById(organizationId, input.sectionId),
      getSubjectById(organizationId, input.subjectId),
      getTeacherById(organizationId, input.teacherId),
    ]);

    if (cls) className = cls.name;
    if (sec) sectionName = sec.name;
    if (sub) subjectName = sub.name;
    if (tch) teacherName = tch.personal.fullName;

    if (input.roomId) {
      const rDoc = await getDoc(doc(db, "organizations", organizationId, "rooms", input.roomId));
      if (rDoc.exists()) {
        roomName = (rDoc.data() as Room).name;
      }
    }
  } catch (e) {
    // ignore
  }

  const docRef = doc(db, "organizations", organizationId, "timetableEntries", entryId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className,
    sectionId: input.sectionId,
    sectionName,
    subjectId: input.subjectId,
    subjectName,
    teacherId: input.teacherId,
    teacherName,
    roomId: input.roomId || null,
    roomName: roomName || null,
    dayOfWeek: input.dayOfWeek,
    periodId: input.periodId,
    updatedAt: now,
    updatedBy: userId,
  });

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "TIMETABLE_UPDATED",
    entityType: "TIMETABLE",
    entityId: entryId,
    metadata: {
      name: `${className} ${sectionName} - ${subjectName}`,
      ...input,
    },
  });
}

export async function deleteTimetableEntry(
  organizationId: string,
  entryId: string,
  userId: string,
  userName: string = "Admin"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "timetableEntries", entryId);
  await deleteDoc(docRef);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "TIMETABLE_DELETED",
    entityType: "TIMETABLE",
    entityId: entryId,
    metadata: { name: "Timetable Entry" },
  });
}

export async function getClassTimetable(
  organizationId: string,
  classId: string,
  sectionId: string,
  academicSessionId?: string
): Promise<TimetableEntry[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "timetableEntries");
    let q = query(
      collRef,
      where("classId", "==", classId),
      where("sectionId", "==", sectionId)
    );

    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TimetableEntry);
  } catch (error) {
    console.error("getClassTimetable error:", error);
    return [];
  }
}

export async function getTeacherTimetable(
  organizationId: string,
  teacherId: string,
  academicSessionId?: string
): Promise<TimetableEntry[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "timetableEntries");
    let q = query(collRef, where("teacherId", "==", teacherId));

    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TimetableEntry);
  } catch (error) {
    console.error("getTeacherTimetable error:", error);
    return [];
  }
}

export async function getRoomTimetable(
  organizationId: string,
  roomId: string,
  academicSessionId?: string
): Promise<TimetableEntry[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "timetableEntries");
    let q = query(collRef, where("roomId", "==", roomId));

    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TimetableEntry);
  } catch (error) {
    console.error("getRoomTimetable error:", error);
    return [];
  }
}

// ----------------------------------------------------
// SUBSTITUTIONS SERVICE
// ----------------------------------------------------

export async function getSubstitutions(
  organizationId: string,
  statusFilter?: string,
  dateFilter?: string,
  academicSessionId?: string
): Promise<Substitution[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "substitutions");
    let q = query(collRef, orderBy("createdAt", "desc"), limit(100));

    if (statusFilter && statusFilter !== "all") {
      q = query(collRef, where("status", "==", statusFilter), limit(100));
    }
    if (dateFilter) {
      q = query(collRef, where("date", "==", dateFilter), limit(100));
    }
    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Substitution);
  } catch (error) {
    console.error("getSubstitutions error:", error);
    return [];
  }
}

export async function createSubstitution(
  organizationId: string,
  input: SubstitutionInput,
  userId: string,
  userName: string = "Admin"
): Promise<Substitution> {
  if (input.absentTeacherId === input.substituteTeacherId) {
    throw new Error("Substitute teacher cannot be the same as the absent teacher.");
  }

  // Get day of week for the date
  const dateObj = new Date(input.date);
  const days: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeek = days[dateObj.getDay()];

  // Check if substitute teacher is already teaching another class during this date and period
  const existingSubTimetable = await getDocs(
    query(
      collection(db, "organizations", organizationId, "timetableEntries"),
      where("academicSessionId", "==", input.academicSessionId),
      where("teacherId", "==", input.substituteTeacherId),
      where("dayOfWeek", "==", dayOfWeek),
      where("periodId", "==", input.periodId),
      limit(1)
    )
  );

  if (!existingSubTimetable.empty) {
    const assignedClass = existingSubTimetable.docs[0].data() as TimetableEntry;
    throw new Error(
      `Selected substitute teacher is already scheduled to teach ${assignedClass.className} (${assignedClass.sectionName}) during this period on ${dayOfWeek}.`
    );
  }

  let absentTeacherName = "Teacher";
  let substituteTeacherName = "Teacher";
  let className = "Class";
  let sectionName = "Section";
  let subjectName = "Subject";
  let periodName = "Period";

  try {
    const [absT, subT, cls, sec, sub, pDoc] = await Promise.all([
      getTeacherById(organizationId, input.absentTeacherId),
      getTeacherById(organizationId, input.substituteTeacherId),
      getSchoolClassById(organizationId, input.classId),
      getSectionById(organizationId, input.sectionId),
      getSubjectById(organizationId, input.subjectId),
      getDoc(doc(db, "organizations", organizationId, "periods", input.periodId)),
    ]);

    if (absT) absentTeacherName = absT.personal.fullName;
    if (subT) substituteTeacherName = subT.personal.fullName;
    if (cls) className = cls.name;
    if (sec) sectionName = sec.name;
    if (sub) subjectName = sub.name;
    if (pDoc.exists()) periodName = (pDoc.data() as Period).name;
  } catch (e) {
    // ignore
  }

  const docRef = doc(collection(db, "organizations", organizationId, "substitutions"));
  const now = new Date().toISOString();

  const newSub: Substitution = {
    id: docRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    date: input.date,
    periodId: input.periodId,
    periodName,
    absentTeacherId: input.absentTeacherId,
    absentTeacherName,
    substituteTeacherId: input.substituteTeacherId,
    substituteTeacherName,
    classId: input.classId,
    className,
    sectionId: input.sectionId,
    sectionName,
    subjectId: input.subjectId,
    subjectName,
    reason: input.reason,
    notes: input.notes || undefined,
    status: input.status,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  await setDoc(docRef, newSub);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "SUBSTITUTION_CREATED",
    entityType: "SUBSTITUTION",
    entityId: docRef.id,
    metadata: {
      name: `Substitution: ${substituteTeacherName} for ${absentTeacherName}`,
      date: input.date,
      periodId: input.periodId,
    },
  });

  return newSub;
}

export async function updateSubstitutionStatus(
  organizationId: string,
  substitutionId: string,
  status: "Pending" | "Assigned" | "Completed" | "Cancelled",
  userId: string,
  userName: string = "Admin"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "substitutions", substitutionId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status,
    updatedAt: now,
    updatedBy: userId,
  });

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: status === "Cancelled" ? "SUBSTITUTION_CANCELLED" : "SUBSTITUTION_UPDATED",
    entityType: "SUBSTITUTION",
    entityId: substitutionId,
    metadata: { status },
  });
}

// ----------------------------------------------------
// TIMETABLE SETTINGS
// ----------------------------------------------------

export async function getTimetableSettings(organizationId: string): Promise<TimetableSettingsConfig> {
  try {
    const docRef = doc(db, "organizations", organizationId, "timetableSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return DEFAULT_TIMETABLE_SETTINGS;
    }
    return snap.data() as TimetableSettingsConfig;
  } catch (error) {
    console.error("getTimetableSettings error:", error);
    return DEFAULT_TIMETABLE_SETTINGS;
  }
}

export async function updateTimetableSettings(
  organizationId: string,
  input: TimetableSettingsInput,
  userId: string
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "timetableSettings", "config");
  await setDoc(
    docRef,
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// TIMETABLE DASHBOARD STATS
// ----------------------------------------------------

export async function getTimetableDashboardStats(
  organizationId: string,
  academicSessionId?: string
): Promise<TimetableStats> {
  try {
    const [periods, rooms, teachers, entriesSnap, pendingSubsSnap] = await Promise.all([
      getPeriods(organizationId),
      getRooms(organizationId),
      getTeachers(organizationId, "active"),
      getDocs(
        academicSessionId
          ? query(
              collection(db, "organizations", organizationId, "timetableEntries"),
              where("academicSessionId", "==", academicSessionId)
            )
          : collection(db, "organizations", organizationId, "timetableEntries")
      ),
      getDocs(
        query(
          collection(db, "organizations", organizationId, "substitutions"),
          where("status", "==", "Pending")
        )
      ),
    ]);

    const entries = entriesSnap.docs.map((d) => d.data() as TimetableEntry);

    // Get today's day of week
    const days: DayOfWeek[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayDay = days[new Date().getDay()];

    const todaysEntries = entries.filter((e) => e.dayOfWeek === todayDay);
    const assignedTeachersToday = new Set(todaysEntries.map((e) => e.teacherId));
    const occupiedRoomsToday = new Set(todaysEntries.map((e) => e.roomId).filter(Boolean));

    const totalScheduledClasses = new Set(entries.map((e) => `${e.classId}_${e.sectionId}`)).size;
    const freeTeachers = Math.max(0, teachers.length - assignedTeachersToday.size);
    const freeRooms = Math.max(0, rooms.length - occupiedRoomsToday.size);

    return {
      totalScheduledClasses,
      todaysPeriods: todaysEntries.length,
      freeTeachers,
      freeRooms,
      pendingSubstitutions: pendingSubsSnap.docs.length,
      totalRooms: rooms.length,
      totalPeriods: periods.length,
    };
  } catch (error) {
    console.error("getTimetableDashboardStats error:", error);
    return {
      totalScheduledClasses: 0,
      todaysPeriods: 0,
      freeTeachers: 0,
      freeRooms: 0,
      pendingSubstitutions: 0,
      totalRooms: 0,
      totalPeriods: 0,
    };
  }
}
