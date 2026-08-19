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
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type {
  AcademicSessionItem,
  SchoolClass,
  Section,
  Subject,
  ClassSubjectMapping,
  Teacher,
  TeacherDocument,
  ClassTeacherAssignment,
  SubjectTeacherAssignment,
  AcademicSettingsConfig,
  AcademicDashboardStats,
  TeacherStatus,
  Student,
} from "@/types";
import type {
  AcademicSessionInput,
  SchoolClassInput,
  SectionInput,
  SubjectInput,
  TeacherInput,
  ClassTeacherAssignmentInput,
  SubjectTeacherAssignmentInput,
  AcademicSettingsInput,
} from "@/schemas";

// ==========================================
// AUDIT LOGGING HELPER
// ==========================================
export const logAcademicAudit = async (
  organizationId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
) => {
  try {
    const auditRef = doc(collection(db, "organizations", organizationId, "auditLogs"));
    await setDoc(auditRef, {
      id: auditRef.id,
      organizationId,
      actorId,
      action,
      entityType,
      entityId,
      timestamp: serverTimestamp(),
      metadata: metadata || {},
    });
  } catch (err) {
    console.warn("Could not write academic audit log:", err);
  }
};

// ==========================================
// 1. ACADEMIC SESSIONS
// ==========================================

export const getAcademicSessionsList = async (
  organizationId: string
): Promise<AcademicSessionItem[]> => {
  const sessionsCol = collection(db, "organizations", organizationId, "academicSessions");
  const snap = await getDocs(sessionsCol);
  const sessions: AcademicSessionItem[] = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    sessions.push({
      id: docSnap.id,
      organizationId,
      name: data.name || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      status: (data.status || (data.isActive ? "active" : "draft")) as any,
      isActive: Boolean(data.isActive),
      classesCount: data.classesCount || 0,
      studentsCount: data.studentsCount || 0,
      createdAt: data.createdAt,
      createdBy: data.createdBy || "",
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy || "",
    });
  }

  // Sort: Active first, then by startDate descending
  return sessions.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return (b.startDate || "").localeCompare(a.startDate || "");
  });
};

export const getAcademicSessionById = async (
  organizationId: string,
  sessionId: string
): Promise<AcademicSessionItem | null> => {
  const docRef = doc(db, "organizations", organizationId, "academicSessions", sessionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    organizationId,
    name: data.name || "",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    status: (data.status || (data.isActive ? "active" : "draft")) as any,
    isActive: Boolean(data.isActive),
    classesCount: data.classesCount || 0,
    studentsCount: data.studentsCount || 0,
    createdAt: data.createdAt,
    createdBy: data.createdBy || "",
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy || "",
  };
};

export const createAcademicSessionFull = async (
  organizationId: string,
  input: AcademicSessionInput,
  userId: string
): Promise<AcademicSessionItem> => {
  const sessionsCol = collection(db, "organizations", organizationId, "academicSessions");

  // If set to active, deactivate existing active sessions
  if (input.isActive) {
    const existingActive = query(sessionsCol, where("isActive", "==", true));
    const activeSnap = await getDocs(existingActive);
    for (const d of activeSnap.docs) {
      await updateDoc(d.ref, {
        isActive: false,
        status: "completed",
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    }
  }

  const newDocRef = doc(sessionsCol);
  const newSession: AcademicSessionItem = {
    id: newDocRef.id,
    organizationId,
    name: input.name.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.isActive ? "active" : "draft",
    isActive: input.isActive,
    classesCount: 0,
    studentsCount: 0,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newDocRef, newSession);
  await logAcademicAudit(organizationId, userId, "SESSION_CREATED", "AcademicSession", newDocRef.id, {
    name: input.name,
    isActive: input.isActive,
  });

  return newSession;
};

export const updateAcademicSessionFull = async (
  organizationId: string,
  sessionId: string,
  data: Partial<AcademicSessionItem>,
  userId: string
): Promise<void> => {
  const sessionRef = doc(db, "organizations", organizationId, "academicSessions", sessionId);

  if (data.isActive) {
    const sessionsCol = collection(db, "organizations", organizationId, "academicSessions");
    const existingActive = query(sessionsCol, where("isActive", "==", true));
    const activeSnap = await getDocs(existingActive);
    for (const d of activeSnap.docs) {
      if (d.id !== sessionId) {
        await updateDoc(d.ref, {
          isActive: false,
          status: "completed",
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      }
    }
  }

  await updateDoc(sessionRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await logAcademicAudit(organizationId, userId, "SESSION_UPDATED", "AcademicSession", sessionId, data);
};

export const setActiveAcademicSessionFull = async (
  organizationId: string,
  sessionId: string,
  userId: string
): Promise<void> => {
  const sessionsCol = collection(db, "organizations", organizationId, "academicSessions");
  const activeSnap = await getDocs(query(sessionsCol, where("isActive", "==", true)));

  for (const d of activeSnap.docs) {
    if (d.id !== sessionId) {
      await updateDoc(d.ref, {
        isActive: false,
        status: "completed",
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    }
  }

  const targetRef = doc(sessionsCol, sessionId);
  await updateDoc(targetRef, {
    isActive: true,
    status: "active",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await logAcademicAudit(organizationId, userId, "SESSION_ACTIVATED", "AcademicSession", sessionId);
};

export const archiveAcademicSession = async (
  organizationId: string,
  sessionId: string,
  userId: string
): Promise<void> => {
  const sessionRef = doc(db, "organizations", organizationId, "academicSessions", sessionId);
  await updateDoc(sessionRef, {
    isActive: false,
    status: "archived",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "SESSION_ARCHIVED", "AcademicSession", sessionId);
};

// ==========================================
// 2. CLASSES
// ==========================================

export const getSchoolClasses = async (
  organizationId: string,
  sessionId?: string
): Promise<SchoolClass[]> => {
  const classesCol = collection(db, "organizations", organizationId, "classes");
  let q = query(classesCol);
  if (sessionId) {
    q = query(classesCol, where("academicSessionId", "==", sessionId));
  }

  const snap = await getDocs(q);
  const classes: SchoolClass[] = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as SchoolClass[];

  return classes.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const getSchoolClassById = async (
  organizationId: string,
  classId: string
): Promise<SchoolClass | null> => {
  const snap = await getDoc(doc(db, "organizations", organizationId, "classes", classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SchoolClass;
};

export const checkClassCodeAvailable = async (
  organizationId: string,
  sessionId: string,
  code: string,
  excludeClassId?: string
): Promise<boolean> => {
  const classesCol = collection(db, "organizations", organizationId, "classes");
  const q = query(
    classesCol,
    where("academicSessionId", "==", sessionId),
    where("code", "==", code.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;
  if (excludeClassId && snap.docs.length === 1 && snap.docs[0].id === excludeClassId) {
    return true;
  }
  return false;
};

export const createSchoolClass = async (
  organizationId: string,
  input: SchoolClassInput,
  userId: string
): Promise<SchoolClass> => {
  const newRef = doc(collection(db, "organizations", organizationId, "classes"));
  const newClass: SchoolClass = {
    id: newRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    displayOrder: input.displayOrder || 1,
    description: input.description || null,
    status: input.status || "active",
    sectionsCount: 0,
    studentsCount: 0,
    subjectsCount: 0,
    classTeacherId: null,
    classTeacherName: null,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newRef, newClass);

  // Auto create Section A
  const sectionRef = doc(collection(db, "organizations", organizationId, "sections"));
  const defaultSection: Section = {
    id: sectionRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    classId: newRef.id,
    className: input.name.trim(),
    name: "Section A",
    code: "A",
    room: "Room 101",
    capacity: 40,
    classTeacherId: null,
    classTeacherName: null,
    studentsCount: 0,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
  await setDoc(sectionRef, defaultSection);

  await updateDoc(newRef, { sectionsCount: 1 });
  newClass.sectionsCount = 1;

  await logAcademicAudit(organizationId, userId, "CLASS_CREATED", "Class", newRef.id, {
    name: input.name,
    code: input.code,
  });

  return newClass;
};

export const updateSchoolClass = async (
  organizationId: string,
  classId: string,
  data: Partial<SchoolClass>,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "classes", classId);
  await updateDoc(refDoc, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await logAcademicAudit(organizationId, userId, "CLASS_UPDATED", "Class", classId, data);
};

export const archiveSchoolClass = async (
  organizationId: string,
  classId: string,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "classes", classId);
  await updateDoc(refDoc, {
    status: "archived",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "CLASS_ARCHIVED", "Class", classId);
};

// Query real Phase 3 students linked to this class
export const getClassStudents = async (
  organizationId: string,
  classId: string,
  sessionId?: string
): Promise<Student[]> => {
  const studentsCol = collection(db, "organizations", organizationId, "students");
  let q = query(studentsCol, where("academic.classId", "==", classId));
  if (sessionId) {
    q = query(
      studentsCol,
      where("academic.classId", "==", classId),
      where("academic.sessionId", "==", sessionId)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
};

// ==========================================
// 3. SECTIONS
// ==========================================

export const getSections = async (
  organizationId: string,
  classId?: string,
  sessionId?: string
): Promise<Section[]> => {
  const sectionsCol = collection(db, "organizations", organizationId, "sections");
  let q = query(sectionsCol);
  if (classId && sessionId) {
    q = query(
      sectionsCol,
      where("classId", "==", classId),
      where("academicSessionId", "==", sessionId)
    );
  } else if (classId) {
    q = query(sectionsCol, where("classId", "==", classId));
  } else if (sessionId) {
    q = query(sectionsCol, where("academicSessionId", "==", sessionId));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Section[];
};

export const getSectionById = async (
  organizationId: string,
  sectionId: string
): Promise<Section | null> => {
  const snap = await getDoc(doc(db, "organizations", organizationId, "sections", sectionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Section;
};

export const checkSectionCodeAvailable = async (
  organizationId: string,
  classId: string,
  sessionId: string,
  code: string,
  excludeSectionId?: string
): Promise<boolean> => {
  const sectionsCol = collection(db, "organizations", organizationId, "sections");
  const q = query(
    sectionsCol,
    where("classId", "==", classId),
    where("academicSessionId", "==", sessionId),
    where("code", "==", code.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;
  if (excludeSectionId && snap.docs.length === 1 && snap.docs[0].id === excludeSectionId) {
    return true;
  }
  return false;
};

export const createSection = async (
  organizationId: string,
  input: SectionInput,
  userId: string
): Promise<Section> => {
  // Fetch class details for className
  const classDoc = await getDoc(doc(db, "organizations", organizationId, "classes", input.classId));
  const className = classDoc.exists() ? classDoc.data()?.name : "Class";

  // If classTeacherId provided, fetch teacher name
  let teacherName: string | null = null;
  if (input.classTeacherId) {
    const teacherDoc = await getDoc(
      doc(db, "organizations", organizationId, "teachers", input.classTeacherId)
    );
    if (teacherDoc.exists()) {
      teacherName = teacherDoc.data()?.personal?.fullName || null;
    }
  }

  const newRef = doc(collection(db, "organizations", organizationId, "sections"));
  const newSection: Section = {
    id: newRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    room: input.room || null,
    capacity: input.capacity || 40,
    classTeacherId: input.classTeacherId || null,
    classTeacherName: teacherName,
    studentsCount: 0,
    status: input.status || "active",
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newRef, newSection);

  // Update class sectionsCount
  if (classDoc.exists()) {
    const currentSections = classDoc.data()?.sectionsCount || 0;
    await updateDoc(classDoc.ref, { sectionsCount: currentSections + 1 });
  }

  await logAcademicAudit(organizationId, userId, "SECTION_CREATED", "Section", newRef.id, {
    name: input.name,
    classId: input.classId,
  });

  return newSection;
};

export const updateSection = async (
  organizationId: string,
  sectionId: string,
  data: Partial<Section>,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "sections", sectionId);
  await updateDoc(refDoc, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await logAcademicAudit(organizationId, userId, "SECTION_UPDATED", "Section", sectionId, data);
};

export const archiveSection = async (
  organizationId: string,
  sectionId: string,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "sections", sectionId);
  await updateDoc(refDoc, {
    status: "archived",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "SECTION_ARCHIVED", "Section", sectionId);
};

// Query real Phase 3 students linked to this section
export const getSectionStudents = async (
  organizationId: string,
  sectionId: string,
  sessionId?: string
): Promise<Student[]> => {
  const studentsCol = collection(db, "organizations", organizationId, "students");
  let q = query(studentsCol, where("academic.sectionId", "==", sectionId));
  if (sessionId) {
    q = query(
      studentsCol,
      where("academic.sectionId", "==", sectionId),
      where("academic.sessionId", "==", sessionId)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
};

// ==========================================
// 4. SUBJECTS & CLASS-SUBJECT MAPPING
// ==========================================

export const getSubjects = async (organizationId: string): Promise<Subject[]> => {
  const snap = await getDocs(collection(db, "organizations", organizationId, "subjects"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Subject[];
};

export const getSubjectById = async (
  organizationId: string,
  subjectId: string
): Promise<Subject | null> => {
  const snap = await getDoc(doc(db, "organizations", organizationId, "subjects", subjectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Subject;
};

export const checkSubjectCodeAvailable = async (
  organizationId: string,
  code: string,
  excludeSubjectId?: string
): Promise<boolean> => {
  const snap = await getDocs(
    query(
      collection(db, "organizations", organizationId, "subjects"),
      where("code", "==", code.toUpperCase())
    )
  );
  if (snap.empty) return true;
  if (excludeSubjectId && snap.docs.length === 1 && snap.docs[0].id === excludeSubjectId) {
    return true;
  }
  return false;
};

export const createSubject = async (
  organizationId: string,
  input: SubjectInput,
  userId: string
): Promise<Subject> => {
  const newRef = doc(collection(db, "organizations", organizationId, "subjects"));
  const newSubject: Subject = {
    id: newRef.id,
    organizationId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    type: input.type,
    description: input.description || null,
    marks: {
      maximum: input.maximumMarks,
      passing: input.passingMarks,
      theory: input.theoryMarks,
      practical: input.practicalMarks,
    },
    status: input.status || "active",
    assignedClassIds: [],
    assignedTeacherIds: [],
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newRef, newSubject);
  await logAcademicAudit(organizationId, userId, "SUBJECT_CREATED", "Subject", newRef.id, {
    name: input.name,
    code: input.code,
  });

  return newSubject;
};

export const updateSubject = async (
  organizationId: string,
  subjectId: string,
  data: Partial<Subject>,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "subjects", subjectId);
  await updateDoc(refDoc, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "SUBJECT_UPDATED", "Subject", subjectId, data);
};

export const archiveSubject = async (
  organizationId: string,
  subjectId: string,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "subjects", subjectId);
  await updateDoc(refDoc, {
    status: "archived",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "SUBJECT_ARCHIVED", "Subject", subjectId);
};

export const getClassSubjects = async (
  organizationId: string,
  classId: string,
  sessionId?: string
): Promise<ClassSubjectMapping[]> => {
  const col = collection(db, "organizations", organizationId, "classSubjectMappings");
  let q = query(col, where("classId", "==", classId));
  if (sessionId) {
    q = query(col, where("classId", "==", classId), where("academicSessionId", "==", sessionId));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassSubjectMapping[];
};

export const assignSubjectToClass = async (
  organizationId: string,
  sessionId: string,
  classId: string,
  subjectId: string,
  teacherId: string | null,
  userId: string
): Promise<ClassSubjectMapping> => {
  const [subjectDoc, classDoc] = await Promise.all([
    getDoc(doc(db, "organizations", organizationId, "subjects", subjectId)),
    getDoc(doc(db, "organizations", organizationId, "classes", classId)),
  ]);

  const subjectData = subjectDoc.data();
  const classData = classDoc.data();

  let teacherName: string | null = null;
  if (teacherId) {
    const teacherDoc = await getDoc(
      doc(db, "organizations", organizationId, "teachers", teacherId)
    );
    if (teacherDoc.exists()) {
      teacherName = teacherDoc.data()?.personal?.fullName || null;
    }
  }

  const mappingRef = doc(collection(db, "organizations", organizationId, "classSubjectMappings"));
  const newMapping: ClassSubjectMapping = {
    id: mappingRef.id,
    organizationId,
    academicSessionId: sessionId,
    classId,
    subjectId,
    subjectName: subjectData?.name || "Subject",
    subjectCode: subjectData?.code || "SUB",
    subjectType: subjectData?.type || "Core",
    teacherId: teacherId || null,
    teacherName,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(mappingRef, newMapping);

  // Update subject's assignedClassIds list
  const currentAssignedClasses = subjectData?.assignedClassIds || [];
  if (!currentAssignedClasses.includes(classId)) {
    await updateDoc(subjectDoc.ref, {
      assignedClassIds: [...currentAssignedClasses, classId],
    });
  }

  // Update class subjectsCount
  if (classDoc.exists()) {
    const currentSubjects = classData?.subjectsCount || 0;
    await updateDoc(classDoc.ref, { subjectsCount: currentSubjects + 1 });
  }

  await logAcademicAudit(organizationId, userId, "SUBJECT_ASSIGNED_TO_CLASS", "ClassSubjectMapping", mappingRef.id, {
    classId,
    subjectId,
  });

  return newMapping;
};

export const removeSubjectFromClass = async (
  organizationId: string,
  mappingId: string,
  userId: string
): Promise<void> => {
  const mappingRef = doc(db, "organizations", organizationId, "classSubjectMappings", mappingId);
  const snap = await getDoc(mappingRef);
  if (!snap.exists()) return;
  const data = snap.data();

  await deleteDoc(mappingRef);

  // Decrease class subjectsCount
  const classDoc = await getDoc(doc(db, "organizations", organizationId, "classes", data.classId));
  if (classDoc.exists()) {
    const currentSubjects = classDoc.data()?.subjectsCount || 1;
    await updateDoc(classDoc.ref, { subjectsCount: Math.max(0, currentSubjects - 1) });
  }

  await logAcademicAudit(organizationId, userId, "SUBJECT_REMOVED_FROM_CLASS", "ClassSubjectMapping", mappingId, {
    classId: data.classId,
    subjectId: data.subjectId,
  });
};

// ==========================================
// 5. TEACHERS
// ==========================================

export const getTeachers = async (
  organizationId: string,
  status?: string
): Promise<Teacher[]> => {
  const teachersCol = collection(db, "organizations", organizationId, "teachers");
  let q = query(teachersCol);
  if (status && status !== "all") {
    q = query(teachersCol, where("status", "==", status));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Teacher[];
};

export const getTeacherById = async (
  organizationId: string,
  teacherId: string
): Promise<Teacher | null> => {
  const snap = await getDoc(doc(db, "organizations", organizationId, "teachers", teacherId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Teacher;
};

export const generateTeacherEmployeeId = async (organizationId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = doc(db, "organizations", organizationId, "counters", `teacher_${year}`);

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextNum = 1;
    if (counterDoc.exists()) {
      nextNum = (counterDoc.data().current || 0) + 1;
      transaction.update(counterRef, { current: nextNum, updatedAt: serverTimestamp() });
    } else {
      transaction.set(counterRef, { current: 1, year, updatedAt: serverTimestamp() });
    }
    const padded = String(nextNum).padStart(4, "0");
    return `TCH-${year}-${padded}`;
  });
};

export const createTeacher = async (
  organizationId: string,
  input: TeacherInput,
  userId: string
): Promise<Teacher> => {
  const newRef = doc(collection(db, "organizations", organizationId, "teachers"));
  const fullName = `${input.personal.firstName} ${input.personal.middleName || ""} ${input.personal.lastName}`
    .replace(/\s+/g, " ")
    .trim();

  const newTeacher: Teacher = {
    id: newRef.id,
    organizationId,
    employeeId: input.professional.employeeId.toUpperCase(),
    personal: {
      ...input.personal,
      fullName,
      photoUrl: input.personal.photoUrl || null,
    },
    contact: {
      ...input.contact,
    },
    professional: {
      ...input.professional,
      employeeId: input.professional.employeeId.toUpperCase(),
    },
    emergencyContact: input.emergencyContact || null,
    documents: [],
    status: input.status || "active",
    assignedClasses: [],
    assignedSubjects: [],
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newRef, newTeacher);
  await logAcademicAudit(organizationId, userId, "TEACHER_CREATED", "Teacher", newRef.id, {
    employeeId: newTeacher.employeeId,
    fullName,
  });

  return newTeacher;
};

export const updateTeacher = async (
  organizationId: string,
  teacherId: string,
  data: Partial<Teacher>,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "teachers", teacherId);
  await updateDoc(refDoc, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "TEACHER_UPDATED", "Teacher", teacherId, data);
};

export const deactivateTeacher = async (
  organizationId: string,
  teacherId: string,
  status: TeacherStatus,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "teachers", teacherId);
  await updateDoc(refDoc, {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "TEACHER_STATUS_CHANGED", "Teacher", teacherId, { status });
};

export const uploadTeacherPhoto = async (
  organizationId: string,
  teacherId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `organizations/${organizationId}/teachers/${teacherId}/photo_${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snap.ref);

  const teacherRef = doc(db, "organizations", organizationId, "teachers", teacherId);
  await updateDoc(teacherRef, {
    "personal.photoUrl": downloadUrl,
    updatedAt: serverTimestamp(),
  });

  return downloadUrl;
};

export const uploadTeacherDoc = async (
  organizationId: string,
  teacherId: string,
  docName: string,
  docType: string,
  file: File
): Promise<TeacherDocument> => {
  const storageRef = ref(storage, `organizations/${organizationId}/teachers/${teacherId}/docs/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snap.ref);

  const newDoc: TeacherDocument = {
    id: `doc_${Date.now()}`,
    name: docName,
    type: docType,
    fileUrl: downloadUrl,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };

  const teacherRef = doc(db, "organizations", organizationId, "teachers", teacherId);
  const teacherSnap = await getDoc(teacherRef);
  const currentDocs = teacherSnap.data()?.documents || [];

  await updateDoc(teacherRef, {
    documents: [...currentDocs, newDoc],
    updatedAt: serverTimestamp(),
  });

  return newDoc;
};

export const deleteTeacherDoc = async (
  organizationId: string,
  teacherId: string,
  docId: string
): Promise<void> => {
  const teacherRef = doc(db, "organizations", organizationId, "teachers", teacherId);
  const teacherSnap = await getDoc(teacherRef);
  const currentDocs: TeacherDocument[] = teacherSnap.data()?.documents || [];

  await updateDoc(teacherRef, {
    documents: currentDocs.filter((d) => d.id !== docId),
    updatedAt: serverTimestamp(),
  });
};

// ==========================================
// 6. ASSIGNMENTS
// ==========================================

export const getClassTeacherAssignments = async (
  organizationId: string,
  sessionId?: string
): Promise<ClassTeacherAssignment[]> => {
  const col = collection(db, "organizations", organizationId, "classTeacherAssignments");
  let q = query(col);
  if (sessionId) {
    q = query(col, where("academicSessionId", "==", sessionId));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassTeacherAssignment[];
};

export const assignClassTeacher = async (
  organizationId: string,
  input: ClassTeacherAssignmentInput,
  userId: string
): Promise<ClassTeacherAssignment> => {
  const [classDoc, sectionDoc, teacherDoc] = await Promise.all([
    getDoc(doc(db, "organizations", organizationId, "classes", input.classId)),
    getDoc(doc(db, "organizations", organizationId, "sections", input.sectionId)),
    getDoc(doc(db, "organizations", organizationId, "teachers", input.teacherId)),
  ]);

  const className = classDoc.data()?.name || "Class";
  const sectionName = sectionDoc.data()?.name || "Section";
  const teacherName = teacherDoc.data()?.personal?.fullName || "Teacher";
  const teacherEmpId = teacherDoc.data()?.employeeId || "";

  // Deactivate any existing active class teacher assignment for this section
  const col = collection(db, "organizations", organizationId, "classTeacherAssignments");
  const existingActive = query(
    col,
    where("academicSessionId", "==", input.academicSessionId),
    where("sectionId", "==", input.sectionId),
    where("status", "==", "active")
  );
  const activeSnap = await getDocs(existingActive);
  for (const d of activeSnap.docs) {
    await updateDoc(d.ref, {
      status: "transferred",
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  // Create new active assignment
  const newRef = doc(col);
  const newAssignment: ClassTeacherAssignment = {
    id: newRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className,
    sectionId: input.sectionId,
    sectionName,
    teacherId: input.teacherId,
    teacherName,
    teacherEmployeeId: teacherEmpId,
    assignedDate: new Date().toISOString().split("T")[0],
    assignedBy: userId,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newRef, newAssignment);

  // Sync to Section doc
  await updateDoc(sectionDoc.ref, {
    classTeacherId: input.teacherId,
    classTeacherName: teacherName,
    updatedAt: serverTimestamp(),
  });

  // Sync to Class doc if not set
  if (classDoc.exists()) {
    await updateDoc(classDoc.ref, {
      classTeacherId: input.teacherId,
      classTeacherName: teacherName,
      updatedAt: serverTimestamp(),
    });
  }

  // Update Teacher's assignedClasses list
  const currentAssigned = teacherDoc.data()?.assignedClasses || [];
  const classLabel = `${className} (${sectionName})`;
  if (!currentAssigned.includes(classLabel)) {
    await updateDoc(teacherDoc.ref, {
      assignedClasses: [...currentAssigned, classLabel],
    });
  }

  await logAcademicAudit(organizationId, userId, "CLASS_TEACHER_ASSIGNED", "ClassTeacherAssignment", newRef.id, {
    classId: input.classId,
    sectionId: input.sectionId,
    teacherId: input.teacherId,
  });

  return newAssignment;
};

export const deactivateClassTeacherAssignment = async (
  organizationId: string,
  assignmentId: string,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "classTeacherAssignments", assignmentId);
  const snap = await getDoc(refDoc);
  if (snap.exists()) {
    const data = snap.data();
    await updateDoc(refDoc, {
      status: "inactive",
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Remove from Section doc
    const sectionRef = doc(db, "organizations", organizationId, "sections", data.sectionId);
    await updateDoc(sectionRef, {
      classTeacherId: null,
      classTeacherName: null,
      updatedAt: serverTimestamp(),
    });
  }

  await logAcademicAudit(organizationId, userId, "CLASS_TEACHER_ASSIGNMENT_DEACTIVATED", "ClassTeacherAssignment", assignmentId);
};

export const getSubjectTeacherAssignments = async (
  organizationId: string,
  sessionId?: string
): Promise<SubjectTeacherAssignment[]> => {
  const col = collection(db, "organizations", organizationId, "subjectTeacherAssignments");
  let q = query(col);
  if (sessionId) {
    q = query(col, where("academicSessionId", "==", sessionId));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SubjectTeacherAssignment[];
};

export const assignSubjectTeacher = async (
  organizationId: string,
  input: SubjectTeacherAssignmentInput,
  userId: string
): Promise<SubjectTeacherAssignment> => {
  const [classDoc, subjectDoc, teacherDoc] = await Promise.all([
    getDoc(doc(db, "organizations", organizationId, "classes", input.classId)),
    getDoc(doc(db, "organizations", organizationId, "subjects", input.subjectId)),
    getDoc(doc(db, "organizations", organizationId, "teachers", input.teacherId)),
  ]);

  let sectionName: string | null = null;
  if (input.sectionId) {
    const secDoc = await getDoc(
      doc(db, "organizations", organizationId, "sections", input.sectionId)
    );
    if (secDoc.exists()) sectionName = secDoc.data()?.name || null;
  }

  const className = classDoc.data()?.name || "Class";
  const subjectName = subjectDoc.data()?.name || "Subject";
  const subjectCode = subjectDoc.data()?.code || "SUB";
  const teacherName = teacherDoc.data()?.personal?.fullName || "Teacher";
  const teacherEmpId = teacherDoc.data()?.employeeId || "";

  // Check duplicate active assignment
  const col = collection(db, "organizations", organizationId, "subjectTeacherAssignments");
  let dupQuery = query(
    col,
    where("academicSessionId", "==", input.academicSessionId),
    where("classId", "==", input.classId),
    where("subjectId", "==", input.subjectId),
    where("teacherId", "==", input.teacherId),
    where("status", "==", "active")
  );
  if (input.sectionId) {
    dupQuery = query(
      col,
      where("academicSessionId", "==", input.academicSessionId),
      where("classId", "==", input.classId),
      where("sectionId", "==", input.sectionId),
      where("subjectId", "==", input.subjectId),
      where("teacherId", "==", input.teacherId),
      where("status", "==", "active")
    );
  }
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error("This subject teacher is already actively assigned to this class/section.");
  }

  const newRef = doc(col);
  const newAssignment: SubjectTeacherAssignment = {
    id: newRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className,
    sectionId: input.sectionId || null,
    sectionName,
    subjectId: input.subjectId,
    subjectName,
    subjectCode,
    teacherId: input.teacherId,
    teacherName,
    teacherEmployeeId: teacherEmpId,
    assignedDate: new Date().toISOString().split("T")[0],
    assignedBy: userId,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await setDoc(newRef, newAssignment);

  // Update Teacher's assignedSubjects list
  const currentAssignedSubs = teacherDoc.data()?.assignedSubjects || [];
  if (!currentAssignedSubs.includes(subjectName)) {
    await updateDoc(teacherDoc.ref, {
      assignedSubjects: [...currentAssignedSubs, subjectName],
    });
  }

  // Update Subject's assignedTeacherIds list
  const currentAssignedTeachers = subjectDoc.data()?.assignedTeacherIds || [];
  if (!currentAssignedTeachers.includes(input.teacherId)) {
    await updateDoc(subjectDoc.ref, {
      assignedTeacherIds: [...currentAssignedTeachers, input.teacherId],
    });
  }

  await logAcademicAudit(organizationId, userId, "SUBJECT_TEACHER_ASSIGNED", "SubjectTeacherAssignment", newRef.id, {
    classId: input.classId,
    subjectId: input.subjectId,
    teacherId: input.teacherId,
  });

  return newAssignment;
};

export const deactivateSubjectTeacherAssignment = async (
  organizationId: string,
  assignmentId: string,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "subjectTeacherAssignments", assignmentId);
  await updateDoc(refDoc, {
    status: "inactive",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "SUBJECT_TEACHER_ASSIGNMENT_DEACTIVATED", "SubjectTeacherAssignment", assignmentId);
};

export const getTeacherAssignments = async (
  organizationId: string,
  teacherId: string,
  sessionId?: string
): Promise<{
  classTeacherAssignments: ClassTeacherAssignment[];
  subjectTeacherAssignments: SubjectTeacherAssignment[];
}> => {
  const classCol = collection(db, "organizations", organizationId, "classTeacherAssignments");
  const subCol = collection(db, "organizations", organizationId, "subjectTeacherAssignments");

  let qClass = query(classCol, where("teacherId", "==", teacherId));
  let qSub = query(subCol, where("teacherId", "==", teacherId));

  if (sessionId) {
    qClass = query(classCol, where("teacherId", "==", teacherId), where("academicSessionId", "==", sessionId));
    qSub = query(subCol, where("teacherId", "==", teacherId), where("academicSessionId", "==", sessionId));
  }

  const [classSnap, subSnap] = await Promise.all([getDocs(qClass), getDocs(qSub)]);

  return {
    classTeacherAssignments: classSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassTeacherAssignment[],
    subjectTeacherAssignments: subSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as SubjectTeacherAssignment[],
  };
};

// ==========================================
// 7. ACADEMIC SETTINGS & DASHBOARD STATS
// ==========================================

export const getAcademicSettings = async (
  organizationId: string
): Promise<AcademicSettingsConfig> => {
  const snap = await getDoc(
    doc(db, "organizations", organizationId, "academicSettings", "config")
  );
  if (!snap.exists()) {
    return {
      classCodeFormat: "NUMERIC",
      defaultSectionCapacity: 40,
      sectionCodeFormat: "ALPHA",
      subjectTypes: ["Core", "Elective", "Optional", "Language", "Practical", "Other"],
      defaultMaximumMarks: 100,
      defaultPassingMarks: 33,
      employeeIdFormat: "TCH-YYYY-XXXX",
      defaultDesignations: [
        "Principal",
        "Vice Principal",
        "Headmaster / Headmistress",
        "PGT (Post Graduate Teacher)",
        "TGT (Trained Graduate Teacher)",
        "PRT (Primary Teacher)",
        "Assistant Teacher",
        "Special Educator",
        "Lab Assistant",
        "Librarian",
        "Physical Education Trainer",
      ],
      defaultDepartments: [
        "Mathematics",
        "Science",
        "English & Literature",
        "Social Studies & Humanities",
        "Hindi & Regional Languages",
        "Computer Science & IT",
        "Arts & Crafts",
        "Physical Education",
      ],
      sessionNamingFormat: "YYYY-YY",
      updatedAt: null,
      updatedBy: "",
    };
  }
  return snap.data() as AcademicSettingsConfig;
};

export const updateAcademicSettings = async (
  organizationId: string,
  input: AcademicSettingsInput,
  userId: string
): Promise<void> => {
  const refDoc = doc(db, "organizations", organizationId, "academicSettings", "config");
  await setDoc(refDoc, {
    ...input,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  await logAcademicAudit(organizationId, userId, "ACADEMIC_SETTINGS_UPDATED", "AcademicSettings", "config");
};

export const getAcademicDashboardStats = async (
  organizationId: string,
  sessionId?: string
): Promise<AcademicDashboardStats> => {
  const [classesList, sectionsList, subjectsList, teachersList, sessionsList, classTeacherAssignments, subjectTeacherAssignments] =
    await Promise.all([
      getSchoolClasses(organizationId, sessionId),
      getSections(organizationId, undefined, sessionId),
      getSubjects(organizationId),
      getTeachers(organizationId),
      getAcademicSessionsList(organizationId),
      getClassTeacherAssignments(organizationId, sessionId),
      getSubjectTeacherAssignments(organizationId, sessionId),
    ]);

  const activeSession = sessionsList.find((s) => s.isActive) || sessionsList[0];

  // Assigned teachers: unique teacher IDs actively assigned as Class Teacher or Subject Teacher
  const assignedTeacherIds = new Set<string>();
  classTeacherAssignments
    .filter((a) => a.status === "active")
    .forEach((a) => assignedTeacherIds.add(a.teacherId));
  subjectTeacherAssignments
    .filter((a) => a.status === "active")
    .forEach((a) => assignedTeacherIds.add(a.teacherId));

  // Unassigned subjects: subjects that have 0 assigned classes or 0 assigned teachers
  const unassignedSubjectsCount = subjectsList.filter(
    (s) => !s.assignedClassIds || s.assignedClassIds.length === 0
  ).length;

  // Unassigned classes: classes that have no class teacher assigned
  const unassignedClassesCount = classesList.filter(
    (c) => !c.classTeacherId && !classTeacherAssignments.some((a) => a.classId === c.id && a.status === "active")
  ).length;

  return {
    totalClasses: classesList.length,
    totalSections: sectionsList.length,
    totalSubjects: subjectsList.length,
    totalTeachers: teachersList.filter((t) => t.status === "active").length,
    activeSessionName: activeSession?.name || "None",
    assignedTeachersCount: assignedTeacherIds.size,
    unassignedSubjectsCount,
    unassignedClassesCount,
  };
};

export const getSectionsByClass = async (
  organizationId: string,
  classId: string
): Promise<Section[]> => {
  return await getSections(organizationId, classId);
};

export const getSubjectsByClass = async (
  organizationId: string,
  classId: string
): Promise<Subject[]> => {
  const mappings = await getClassSubjects(organizationId, classId);
  if (mappings.length > 0) {
    const subjs = await Promise.all(
      mappings.map((m) => getSubjectById(organizationId, m.subjectId))
    );
    const valid = subjs.filter(Boolean) as Subject[];
    if (valid.length > 0) return valid;
  }
  return await getSubjects(organizationId);
};

