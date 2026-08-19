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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Exam,
  ExamSchedule,
  ExamSubject,
  ExamMark,
  ExamResult,
  GradingScale,
  ExamSettingsConfig,
  ExamDashboardStats,
  ExamRankingItem,
  SubjectResult,
} from "@/types/exams";
import type {
  ExamInput,
  ExamScheduleInput,
  ExamSubjectInput,
  MarksEntryBulkInput,
  GradingScaleInput,
  ExamSettingsInput,
} from "@/schemas/exams";
import { createAuditLog } from "./auditService";
import { listStudents, getStudent } from "./studentService";
import { getSchoolClassById, getSectionById, getSubjectById } from "./academicService";
import { getRoomById } from "./timetableService";
import {
  calculateSubjectResult,
  calculateOverallResult,
  applyRankings,
  DEFAULT_GRADE_RULES,
} from "./resultCalculationService";

export const DEFAULT_EXAM_SETTINGS: ExamSettingsConfig = {
  examTypes: [
    "Unit Test",
    "Periodic Test",
    "Half Yearly",
    "Annual",
    "Pre-Board",
    "Board",
    "Practical",
    "Other",
  ],
  defaultPassingPercentage: 33,
  requireAllSubjectsPass: true,
  enableRankings: true,
  showAttendanceOnReportCard: true,
  reportCardHeaderNote: "Annual Academic Performance & Evaluation Report",
  reportCardFooterNote: "This is a computer-generated official grade sheet.",
};

// ----------------------------------------------------
// 1. EXAM SETTINGS & GRADING SCALES
// ----------------------------------------------------

export const getExamSettings = async (orgId: string): Promise<ExamSettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "examSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_EXAM_SETTINGS;
    return { ...DEFAULT_EXAM_SETTINGS, ...snap.data() } as ExamSettingsConfig;
  } catch (err) {
    console.error("getExamSettings error:", err);
    return DEFAULT_EXAM_SETTINGS;
  }
};

export const updateExamSettings = async (
  orgId: string,
  input: ExamSettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "examSettings", "config");
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
    action: "EXAM_SETTINGS_UPDATED",
    entityType: "EXAM_SETTINGS",
    entityId: "config",
  });
};

export const getGradingScale = async (orgId: string): Promise<GradingScale> => {
  try {
    const docRef = doc(db, "organizations", orgId, "gradingScales", "default");
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return {
        id: "default",
        organizationId: orgId,
        name: "Standard 8-Point Scale",
        isDefault: true,
        grades: DEFAULT_GRADE_RULES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return snap.data() as GradingScale;
  } catch (err) {
    console.error("getGradingScale error:", err);
    return {
      id: "default",
      organizationId: orgId,
      name: "Standard 8-Point Scale",
      isDefault: true,
      grades: DEFAULT_GRADE_RULES,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};

export const updateGradingScale = async (
  orgId: string,
  input: GradingScaleInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "gradingScales", "default");
  await setDoc(
    docRef,
    {
      id: "default",
      organizationId: orgId,
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_SETTINGS_UPDATED",
    entityType: "EXAM_SETTINGS",
    entityId: "gradingScale",
    metadata: { name: input.name },
  });
};

// ----------------------------------------------------
// 2. EXAMS CRUD
// ----------------------------------------------------

export const createExam = async (
  orgId: string,
  input: ExamInput,
  actor: { uid: string; name: string }
): Promise<Exam> => {
  const colRef = collection(db, "organizations", orgId, "exams");
  const docRef = doc(colRef);

  const exam: Exam = {
    id: docRef.id,
    organizationId: orgId,
    academicSessionId: input.academicSessionId,
    name: input.name,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    description: input.description || "",
    status: input.status || "Draft",
    classIds: input.classIds,
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  await setDoc(docRef, exam);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_CREATED",
    entityType: "EXAM",
    entityId: docRef.id,
    metadata: { name: exam.name, type: exam.type },
  });

  return exam;
};

export const getExam = async (orgId: string, examId: string): Promise<Exam | null> => {
  const docRef = doc(db, "organizations", orgId, "exams", examId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as Exam;
};

export const updateExam = async (
  orgId: string,
  examId: string,
  input: Partial<ExamInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "exams", examId);
  const cleanUpdates: Record<string, any> = {
    ...input,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  await updateDoc(docRef, cleanUpdates);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_UPDATED",
    entityType: "EXAM",
    entityId: examId,
  });
};

export const deleteExam = async (
  orgId: string,
  examId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "exams", examId);
  await deleteDoc(docRef);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_DELETED",
    entityType: "EXAM",
    entityId: examId,
  });
};

export const listExams = async (
  orgId: string,
  filters?: { sessionId?: string; status?: string }
): Promise<Exam[]> => {
  const colRef = collection(db, "organizations", orgId, "exams");
  let q = query(colRef, orderBy("createdAt", "desc"));

  if (filters?.sessionId) {
    q = query(colRef, where("academicSessionId", "==", filters.sessionId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Exam);

  if (filters?.status) {
    list = list.filter((e) => e.status === filters.status);
  }

  return list;
};

// ----------------------------------------------------
// 3. EXAM SUBJECTS CONFIGURATION
// ----------------------------------------------------

export const saveExamSubjects = async (
  orgId: string,
  examId: string,
  subjects: ExamSubjectInput[],
  actor: { uid: string; name: string }
): Promise<void> => {
  const batch = writeBatch(db);

  for (const s of subjects) {
    const docId = `exam_${examId}_cls_${s.classId}_subj_${s.subjectId}`;
    const docRef = doc(db, "organizations", orgId, "examSubjects", docId);
    const subjectData: ExamSubject = {
      id: docId,
      organizationId: orgId,
      examId,
      classId: s.classId,
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      maximumMarks: Number(s.maximumMarks),
      passingMarks: Number(s.passingMarks),
      theoryMarks: s.theoryMarks ? Number(s.theoryMarks) : undefined,
      practicalMarks: s.practicalMarks ? Number(s.practicalMarks) : undefined,
      weightage: s.weightage ? Number(s.weightage) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(docRef, subjectData, { merge: true });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_UPDATED",
    entityType: "EXAM",
    entityId: examId,
    metadata: { subjectCount: subjects.length },
  });
};

export const getExamSubjects = async (
  orgId: string,
  examId: string,
  classId?: string
): Promise<ExamSubject[]> => {
  const colRef = collection(db, "organizations", orgId, "examSubjects");
  let q = query(colRef, where("examId", "==", examId));

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as ExamSubject);

  if (classId) {
    list = list.filter((s) => s.classId === classId);
  }

  return list;
};

// ----------------------------------------------------
// 4. EXAM SCHEDULES (Strict Conflict Detection)
// ----------------------------------------------------

export const checkScheduleConflict = async (
  orgId: string,
  input: ExamScheduleInput,
  excludeScheduleId?: string
): Promise<{ hasConflict: boolean; reason?: string }> => {
  const colRef = collection(db, "organizations", orgId, "examSchedules");
  const q = query(
    colRef,
    where("date", "==", input.date)
  );

  const snap = await getDocs(q);
  const existingSchedules = snap.docs
    .map((d) => d.data() as ExamSchedule)
    .filter((s) => !excludeScheduleId || s.id !== excludeScheduleId);

  for (const s of existingSchedules) {
    // Check time overlap: (startA < endB && startB < endA)
    const isOverlapping = input.startTime < s.endTime && s.startTime < input.endTime;
    if (isOverlapping) {
      // 1. Same Class & Section conflict
      if (s.classId === input.classId && s.sectionId === input.sectionId) {
        return {
          hasConflict: true,
          reason: `Schedule conflict: ${s.className} (${s.sectionName}) already has an examination (${s.subjectName}) scheduled from ${s.startTime} to ${s.endTime} on this date.`,
        };
      }

      // 2. Same Room conflict (if room specified)
      if (input.roomId && s.roomId && s.roomId === input.roomId) {
        return {
          hasConflict: true,
          reason: `Room conflict: Room "${s.roomName || "Room"}" is already occupied for ${s.className} (${s.subjectName}) from ${s.startTime} to ${s.endTime}.`,
        };
      }
    }
  }

  return { hasConflict: false };
};

export const createExamSchedule = async (
  orgId: string,
  input: ExamScheduleInput,
  actor: { uid: string; name: string }
): Promise<ExamSchedule> => {
  // Validate conflict
  const conflict = await checkScheduleConflict(orgId, input);
  if (conflict.hasConflict) {
    throw new Error(conflict.reason || "Examination schedule conflict detected.");
  }

  const [exam, cls, sec, subj, rm] = await Promise.all([
    getExam(orgId, input.examId),
    getSchoolClassById(orgId, input.classId),
    getSectionById(orgId, input.sectionId),
    getSubjectById(orgId, input.subjectId),
    input.roomId ? getRoomById(orgId, input.roomId) : null,
  ]);

  const docRef = doc(collection(db, "organizations", orgId, "examSchedules"));
  const schedule: ExamSchedule = {
    id: docRef.id,
    organizationId: orgId,
    examId: input.examId,
    examName: exam?.name || "Exam",
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className: cls?.name || "Class",
    sectionId: input.sectionId,
    sectionName: sec?.name || "A",
    subjectId: input.subjectId,
    subjectName: subj?.name || "Subject",
    roomId: input.roomId,
    roomName: rm?.name,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    instructions: input.instructions,
    status: "Scheduled",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, schedule);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_SCHEDULE_CREATED",
    entityType: "EXAM_SCHEDULE",
    entityId: docRef.id,
    metadata: {
      examName: schedule.examName,
      className: schedule.className,
      subjectName: schedule.subjectName,
      date: schedule.date,
    },
  });

  return schedule;
};

export const updateExamSchedule = async (
  orgId: string,
  scheduleId: string,
  input: Partial<ExamScheduleInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "examSchedules", scheduleId);
  const cleanUpdates: Record<string, any> = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(docRef, cleanUpdates);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_SCHEDULE_UPDATED",
    entityType: "EXAM_SCHEDULE",
    entityId: scheduleId,
  });
};

export const deleteExamSchedule = async (
  orgId: string,
  scheduleId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "examSchedules", scheduleId);
  await deleteDoc(docRef);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "EXAM_SCHEDULE_DELETED",
    entityType: "EXAM_SCHEDULE",
    entityId: scheduleId,
  });
};

export const listExamSchedules = async (
  orgId: string,
  filters?: {
    examId?: string;
    sessionId?: string;
    classId?: string;
    sectionId?: string;
    date?: string;
  }
): Promise<ExamSchedule[]> => {
  const colRef = collection(db, "organizations", orgId, "examSchedules");
  let q = query(colRef, orderBy("date", "asc"));

  if (filters?.examId) {
    q = query(colRef, where("examId", "==", filters.examId), orderBy("date", "asc"));
  } else if (filters?.sessionId) {
    q = query(colRef, where("academicSessionId", "==", filters.sessionId), orderBy("date", "asc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as ExamSchedule);

  if (filters?.classId) {
    list = list.filter((s) => s.classId === filters.classId);
  }
  if (filters?.sectionId) {
    list = list.filter((s) => s.sectionId === filters.sectionId);
  }
  if (filters?.date) {
    list = list.filter((s) => s.date === filters.date);
  }

  return list;
};

// ----------------------------------------------------
// 5. MARKS ENTRY (Deterministic IDs & Bulk Transactions)
// ----------------------------------------------------

export const saveMarksBulk = async (
  orgId: string,
  input: MarksEntryBulkInput,
  actor: { uid: string; name: string }
): Promise<{ savedCount: number }> => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const entry of input.entries) {
    const docId = `exam_${input.examId}_subj_${input.subjectId}_stud_${entry.studentId}`;
    const docRef = doc(db, "organizations", orgId, "marks", docId);

    const markRecord: ExamMark = {
      id: docId,
      organizationId: orgId,
      examId: input.examId,
      examSubjectId: input.examSubjectId,
      subjectId: input.subjectId,
      studentId: entry.studentId,
      studentName: entry.studentName,
      rollNumber: entry.rollNumber || "",
      classId: input.classId,
      sectionId: input.sectionId,
      maximumMarks: Number(input.maximumMarks),
      marksObtained: entry.absent ? null : (entry.marksObtained !== null && entry.marksObtained !== undefined ? Number(entry.marksObtained) : null),
      absent: entry.absent,
      remarks: entry.remarks || "",
      status: "Entered",
      enteredBy: actor.uid,
      enteredByName: actor.name,
      enteredAt: now,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    batch.set(docRef, markRecord, { merge: true });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "MARKS_ENTERED",
    entityType: "EXAM_MARK",
    entityId: input.examId,
    metadata: {
      examId: input.examId,
      subjectId: input.subjectId,
      studentCount: input.entries.length,
    },
  });

  return { savedCount: input.entries.length };
};

export const getMarksForSubject = async (
  orgId: string,
  examId: string,
  subjectId: string,
  classId: string,
  sectionId?: string
): Promise<ExamMark[]> => {
  const colRef = collection(db, "organizations", orgId, "marks");
  let q = query(
    colRef,
    where("examId", "==", examId),
    where("subjectId", "==", subjectId),
    where("classId", "==", classId)
  );

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as ExamMark);

  if (sectionId) {
    list = list.filter((m) => m.sectionId === sectionId);
  }

  return list;
};

export const getMarksProgress = async (
  orgId: string,
  examId: string,
  classId?: string,
  sectionId?: string
): Promise<{ totalRequired: number; enteredCount: number; percentage: number }> => {
  const [students, examSubjects] = await Promise.all([
    listStudents(orgId, { classId, sectionId, status: "ACTIVE" }),
    getExamSubjects(orgId, examId, classId),
  ]);

  if (students.length === 0 || examSubjects.length === 0) {
    return { totalRequired: 0, enteredCount: 0, percentage: 0 };
  }

  const totalRequired = students.length * examSubjects.length;

  const marksCol = collection(db, "organizations", orgId, "marks");
  const q = query(marksCol, where("examId", "==", examId));
  const snap = await getDocs(q);

  let enteredList = snap.docs.map((d) => d.data() as ExamMark);
  if (classId) {
    enteredList = enteredList.filter((m) => m.classId === classId);
  }
  if (sectionId) {
    enteredList = enteredList.filter((m) => m.sectionId === sectionId);
  }

  const enteredCount = enteredList.filter((m) => m.absent || (m.marksObtained !== null && m.marksObtained !== undefined)).length;
  const percentage = totalRequired > 0 ? Math.min(100, Math.round((enteredCount / totalRequired) * 100)) : 0;

  return {
    totalRequired,
    enteredCount,
    percentage,
  };
};

// ----------------------------------------------------
// 6. RESULT PROCESSING & PUBLISHING
// ----------------------------------------------------

export const processClassResults = async (
  orgId: string,
  examId: string,
  classId: string,
  sectionId: string,
  actor: { uid: string; name: string }
): Promise<{ processedCount: number }> => {
  const [exam, students, examSubjects, gradingScale, examSettings, marksSnap] = await Promise.all([
    getExam(orgId, examId),
    listStudents(orgId, { classId, sectionId, status: "ACTIVE" }),
    getExamSubjects(orgId, examId, classId),
    getGradingScale(orgId),
    getExamSettings(orgId),
    getDocs(
      query(
        collection(db, "organizations", orgId, "marks"),
        where("examId", "==", examId),
        where("classId", "==", classId)
      )
    ),
  ]);

  if (!exam) throw new Error("Examination not found");
  if (students.length === 0) throw new Error("No active students found in this class/section");
  if (examSubjects.length === 0) throw new Error("No subjects configured for this examination");

  const marksList = marksSnap.docs.map((d) => d.data() as ExamMark);
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  const tempResults: ExamResult[] = [];

  for (const student of students) {
    const subjectResults: SubjectResult[] = [];

    for (const subj of examSubjects) {
      const markEntry = marksList.find(
        (m) => m.studentId === student.id && m.subjectId === subj.subjectId
      );

      const isAbsent = markEntry?.absent || false;
      const obtained = markEntry?.marksObtained !== undefined ? markEntry.marksObtained : null;

      const subRes = calculateSubjectResult(
        subj.subjectId,
        subj.subjectName,
        subj.maximumMarks,
        obtained,
        subj.passingMarks,
        isAbsent,
        gradingScale,
        markEntry?.remarks
      );
      subjectResults.push(subRes);
    }

    const overall = calculateOverallResult(
      subjectResults,
      examSettings.defaultPassingPercentage,
      examSettings.requireAllSubjectsPass,
      gradingScale
    );

    const resultDocId = `exam_${examId}_stud_${student.id}`;
    const resultRecord: ExamResult = {
      id: resultDocId,
      organizationId: orgId,
      examId,
      examName: exam.name,
      academicSessionId: exam.academicSessionId,
      studentId: student.id,
      studentName: student.fullName,
      studentIdentifier: student.studentId,
      admissionNumber: student.admissionNumber,
      rollNumber: student.academic?.rollNumber || "",
      classId,
      className: student.academic?.className || "Class",
      sectionId,
      sectionName: student.academic?.sectionName || "A",
      totalMaximum: overall.totalMaximum,
      totalObtained: overall.totalObtained,
      percentage: overall.percentage,
      grade: overall.grade,
      gradePoint: overall.gradePoint,
      resultStatus: overall.resultStatus,
      subjectResults,
      status: "processed",
      createdAt: now,
      updatedAt: now,
    };

    tempResults.push(resultRecord);
  }

  // Calculate competition rank
  const rankedResults = applyRankings(tempResults);

  for (const res of rankedResults) {
    const docRef = doc(db, "organizations", orgId, "results", res.id);
    batch.set(docRef, res, { merge: true });
  }

  // Update Exam status to "Result Processing" if Draft or Scheduled
  if (exam.status === "Draft" || exam.status === "Scheduled" || exam.status === "Ongoing") {
    const examRef = doc(db, "organizations", orgId, "exams", examId);
    batch.update(examRef, { status: "Result Processing", updatedAt: now, updatedBy: actor.uid });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "RESULT_PROCESSED",
    entityType: "EXAM_RESULT",
    entityId: examId,
    metadata: {
      examName: exam.name,
      classId,
      sectionId,
      processedCount: rankedResults.length,
    },
  });

  return { processedCount: rankedResults.length };
};

export const listResults = async (
  orgId: string,
  filters?: {
    examId?: string;
    classId?: string;
    sectionId?: string;
    studentId?: string;
    status?: string;
  }
): Promise<ExamResult[]> => {
  const colRef = collection(db, "organizations", orgId, "results");
  let q = query(colRef, orderBy("percentage", "desc"));

  if (filters?.examId) {
    q = query(colRef, where("examId", "==", filters.examId), orderBy("percentage", "desc"));
  } else if (filters?.studentId) {
    q = query(colRef, where("studentId", "==", filters.studentId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as ExamResult);

  if (filters?.classId) {
    list = list.filter((r) => r.classId === filters.classId);
  }
  if (filters?.sectionId) {
    list = list.filter((r) => r.sectionId === filters.sectionId);
  }
  if (filters?.status) {
    list = list.filter((r) => r.status === filters.status);
  }

  return list;
};

export const getResult = async (
  orgId: string,
  resultId: string
): Promise<ExamResult | null> => {
  const docRef = doc(db, "organizations", orgId, "results", resultId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as ExamResult;
};

export const publishResults = async (
  orgId: string,
  examId: string,
  classId?: string,
  sectionId?: string,
  actor?: { uid: string; name: string }
): Promise<{ publishedCount: number }> => {
  const results = await listResults(orgId, { examId, classId, sectionId });
  if (results.length === 0) throw new Error("No processed results available to publish");

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const r of results) {
    const docRef = doc(db, "organizations", orgId, "results", r.id);
    batch.update(docRef, {
      status: "published",
      publishedAt: now,
      publishedBy: actor?.uid || "Admin",
      publishedByName: actor?.name || "Admin",
      updatedAt: now,
    });
  }

  // Update Exam document status to "Published"
  const examRef = doc(db, "organizations", orgId, "exams", examId);
  batch.update(examRef, {
    status: "Published",
    updatedAt: now,
    updatedBy: actor?.uid || "Admin",
  });

  await batch.commit();

  if (actor) {
    await createAuditLog(orgId, {
      actorId: actor.uid,
      actorName: actor.name,
      action: "RESULT_PUBLISHED",
      entityType: "EXAM_RESULT",
      entityId: examId,
      metadata: { publishedCount: results.length },
    });
  }

  return { publishedCount: results.length };
};

export const unlockResult = async (
  orgId: string,
  resultId: string,
  reason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "results", resultId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "draft",
    unlockedAt: now,
    unlockedBy: actor.uid,
    unlockReason: reason,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "RESULT_UNLOCKED",
    entityType: "EXAM_RESULT",
    entityId: resultId,
    metadata: { reason },
  });
};

// ----------------------------------------------------
// 7. RANKINGS & DASHBOARD ANALYTICS
// ----------------------------------------------------

export const getClassRankings = async (
  orgId: string,
  examId: string,
  classId: string,
  sectionId?: string
): Promise<ExamRankingItem[]> => {
  const results = await listResults(orgId, { examId, classId, sectionId });
  if (results.length === 0) return [];

  const ranked = applyRankings(
    results.map((r) => ({
      ...r,
      totalObtained: r.totalObtained,
      percentage: r.percentage,
      resultStatus: r.resultStatus,
    }))
  );

  return ranked.map((r) => ({
    rank: r.rank,
    studentId: r.studentId,
    studentName: r.studentName,
    studentIdentifier: r.studentIdentifier,
    admissionNumber: r.admissionNumber,
    rollNumber: r.rollNumber,
    className: r.className,
    sectionName: r.sectionName,
    totalMaximum: r.totalMaximum,
    totalObtained: r.totalObtained,
    percentage: r.percentage,
    grade: r.grade,
    resultStatus: r.resultStatus,
  }));
};

export const getStudentResultHistory = async (
  orgId: string,
  studentId: string
): Promise<ExamResult[]> => {
  return await listResults(orgId, { studentId });
};

export const getExamDashboardStats = async (
  orgId: string,
  sessionId?: string
): Promise<ExamDashboardStats> => {
  const exams = await listExams(orgId, { sessionId });
  const results = await listResults(orgId);

  const activeExamsCount = exams.filter((e) => e.status === "Ongoing" || e.status === "Scheduled").length;
  const upcomingExamsCount = exams.filter((e) => e.status === "Draft" || e.status === "Scheduled").length;
  const completedExamsCount = exams.filter((e) => e.status === "Completed" || e.status === "Published").length;
  const resultsPublishedCount = results.filter((r) => r.status === "published").length;
  const marksPendingCount = exams.filter((e) => e.status === "Ongoing" || e.status === "Completed" || e.status === "Result Processing").length;

  return {
    totalExams: exams.length,
    activeExamsCount,
    upcomingExamsCount,
    completedExamsCount,
    marksPendingCount,
    resultsPublishedCount,
  };
};
