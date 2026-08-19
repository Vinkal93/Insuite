import {
  doc,
  collection,
  collectionGroup,
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
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type {
  Assignment,
  AssignmentType,
  AssignmentStatus,
  Submission,
  SubmissionStatus,
  AcademicResource,
  ResourceCategory,
  AcademicWorkSettingsConfig,
  AcademicWorkStats,
  AssignmentAttachment,
} from "@/types";
import type {
  AssignmentInput,
  GradeSubmissionInput,
  ReturnSubmissionInput,
  AcademicResourceInput,
  AcademicWorkSettingsInput,
} from "@/schemas";
import {
  getSchoolClassById,
  getSectionById,
  getSubjectById,
  getTeacherById,
} from "./academicService";
import { createAuditLog } from "./auditService";

const DEFAULT_ACADEMIC_WORK_SETTINGS: AcademicWorkSettingsConfig = {
  assignmentDefaults: {
    defaultType: "Homework",
    allowLateSubmission: true,
    gracePeriodHours: 24,
    allowResubmission: true,
  },
  gradingSettings: {
    defaultMaxMarks: 100,
    defaultGradeType: "Marks",
    autoCalculatePercentage: true,
  },
  attachmentSettings: {
    maxFileSizeMB: 10,
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  notificationSettings: {
    notifyOnPublish: true,
    notifyOnGrading: true,
  },
};

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------

export async function getAcademicWorkStats(
  organizationId: string,
  academicSessionId?: string
): Promise<AcademicWorkStats> {
  try {
    const collRef = collection(db, "organizations", organizationId, "assignments");
    let q = query(collRef);
    if (academicSessionId) {
      q = query(q, where("academicSessionId", "==", academicSessionId));
    }
    const snap = await getDocs(q);
    const assignments = snap.docs.map((d) => d.data() as Assignment);

    const now = new Date().toISOString().split("T")[0];
    const activeAssignments = assignments.filter((a) => a.status === "published").length;
    const overdueWork = assignments.filter(
      (a) => a.status === "published" && a.dueDate < now
    ).length;
    const completedWork = assignments.filter((a) => a.status === "closed").length;

    // Get resources count
    const resColl = collection(db, "organizations", organizationId, "academicResources");
    const resSnap = await getDocs(query(resColl, where("status", "==", "active")));

    // Compute submissions stats
    let totalSubmissions = 0;
    let needsGrading = 0;
    for (const a of assignments) {
      totalSubmissions += a.submissionsCount || 0;
      const graded = a.gradedCount || 0;
      if ((a.submissionsCount || 0) > graded) {
        needsGrading += (a.submissionsCount || 0) - graded;
      }
    }

    return {
      activeAssignments,
      pendingSubmissions: Math.max(0, activeAssignments * 15 - totalSubmissions),
      overdueWork,
      completedWork,
      needsGrading,
      totalResources: resSnap.docs.length,
    };
  } catch (err) {
    console.error("getAcademicWorkStats error:", err);
    throw new Error("Unable to load academic work statistics.");
  }
}

// ----------------------------------------------------
// ASSIGNMENTS SERVICE
// ----------------------------------------------------

export async function getAssignments(
  organizationId: string,
  filters?: {
    type?: AssignmentType;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    teacherId?: string;
    status?: AssignmentStatus;
    academicSessionId?: string;
  }
): Promise<Assignment[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "assignments");
    let q = query(collRef, orderBy("createdAt", "desc"), limit(100));

    if (filters?.type) {
      q = query(collRef, where("type", "==", filters.type), orderBy("createdAt", "desc"));
    }
    if (filters?.classId) {
      q = query(q, where("classId", "==", filters.classId));
    }
    if (filters?.sectionId) {
      q = query(q, where("sectionId", "==", filters.sectionId));
    }
    if (filters?.subjectId) {
      q = query(q, where("subjectId", "==", filters.subjectId));
    }
    if (filters?.teacherId) {
      q = query(q, where("teacherId", "==", filters.teacherId));
    }
    if (filters?.status) {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters?.academicSessionId) {
      q = query(q, where("academicSessionId", "==", filters.academicSessionId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Assignment);
  } catch (error) {
    console.error("getAssignments error:", error);
    return [];
  }
}

export async function getAssignmentById(
  organizationId: string,
  assignmentId: string
): Promise<Assignment | null> {
  try {
    const docRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as Assignment;
  } catch (error) {
    console.error("getAssignmentById error:", error);
    return null;
  }
}

export async function createAssignment(
  organizationId: string,
  input: AssignmentInput,
  userId: string,
  userName: string = "Teacher"
): Promise<Assignment> {
  let className = "Class";
  let sectionName = "Section";
  let subjectName = "Subject";
  let teacherName = "Teacher";

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
  } catch (e) {
    // Non-fatal name lookup fallback
  }

  const docRef = doc(collection(db, "organizations", organizationId, "assignments"));
  const now = new Date().toISOString();

  const newAssignment: Assignment = {
    id: docRef.id,
    organizationId,
    academicSessionId: input.academicSessionId,
    title: input.title,
    description: input.description,
    type: input.type,
    classId: input.classId,
    className,
    sectionId: input.sectionId,
    sectionName,
    subjectId: input.subjectId,
    subjectName,
    teacherId: input.teacherId,
    teacherName,
    targetType: input.targetType,
    assignedStudentIds: input.assignedStudentIds || [],
    assignedDate: input.assignedDate,
    dueDate: input.dueDate,
    dueTime: input.dueTime || undefined,
    instructions: input.instructions,
    attachments: input.attachments || [],
    grading: {
      enabled: input.grading?.enabled ?? true,
      maximumMarks: input.grading?.maximumMarks || 100,
      passingMarks: input.grading?.passingMarks || 40,
      gradeType: input.grading?.gradeType || "Marks",
    },
    status: input.status,
    publishedAt: input.status === "published" ? now : undefined,
    publishedBy: input.status === "published" ? userId : undefined,
    submissionsCount: 0,
    gradedCount: 0,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  await setDoc(docRef, newAssignment);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "ASSIGNMENT_CREATED",
    entityType: "ASSIGNMENT",
    entityId: docRef.id,
    metadata: {
      title: input.title,
      type: input.type,
      status: input.status,
      className,
      subjectName,
    },
  });

  return newAssignment;
}

export async function updateAssignment(
  organizationId: string,
  assignmentId: string,
  input: Partial<AssignmentInput>,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
  const now = new Date().toISOString();

  const updatePayload: Record<string, any> = {
    ...input,
    updatedAt: now,
    updatedBy: userId,
  };

  if (input.status === "published") {
    updatePayload.publishedAt = now;
    updatePayload.publishedBy = userId;
  }

  await updateDoc(docRef, updatePayload);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "ASSIGNMENT_UPDATED",
    entityType: "ASSIGNMENT",
    entityId: assignmentId,
    metadata: {
      title: input.title,
      status: input.status,
    },
  });
}

export async function publishAssignment(
  organizationId: string,
  assignmentId: string,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "published",
    publishedAt: now,
    publishedBy: userId,
    updatedAt: now,
    updatedBy: userId,
  });

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "ASSIGNMENT_PUBLISHED",
    entityType: "ASSIGNMENT",
    entityId: assignmentId,
    metadata: { status: "published" },
  });
}

export async function closeAssignment(
  organizationId: string,
  assignmentId: string,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "closed",
    updatedAt: now,
    updatedBy: userId,
  });

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "ASSIGNMENT_CLOSED",
    entityType: "ASSIGNMENT",
    entityId: assignmentId,
    metadata: { status: "closed" },
  });
}

export async function archiveAssignment(
  organizationId: string,
  assignmentId: string,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "archived",
    updatedAt: now,
    updatedBy: userId,
  });

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "ASSIGNMENT_ARCHIVED",
    entityType: "ASSIGNMENT",
    entityId: assignmentId,
    metadata: { status: "archived" },
  });
}

export async function deleteAssignment(
  organizationId: string,
  assignmentId: string,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
  await deleteDoc(docRef);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "ASSIGNMENT_UPDATED",
    entityType: "ASSIGNMENT",
    entityId: assignmentId,
    metadata: { action: "DELETED" },
  });
}

export async function uploadAssignmentAttachment(
  organizationId: string,
  assignmentId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<AssignmentAttachment> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `organizations/${organizationId}/academicWork/${assignmentId}/attachments/${Date.now()}_${cleanName}`;
  const fileRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(prog);
      },
      (error) => {
        console.error("Upload error:", error);
        reject(new Error(`Failed to upload attachment: ${error.message}`));
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          name: file.name,
          url: downloadUrl,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        });
      }
    );
  });
}

// ----------------------------------------------------
// SUBMISSIONS SERVICE
// ----------------------------------------------------

export async function getSubmissionsForAssignment(
  organizationId: string,
  assignmentId: string,
  statusFilter?: string
): Promise<Submission[]> {
  try {
    const collRef = collection(
      db,
      "organizations",
      organizationId,
      "assignments",
      assignmentId,
      "submissions"
    );
    let q = query(collRef, orderBy("submittedAt", "desc"));
    if (statusFilter && statusFilter !== "all") {
      q = query(collRef, where("status", "==", statusFilter));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Submission);
  } catch (error) {
    console.error("getSubmissionsForAssignment error:", error);
    return [];
  }
}

export async function getSubmissionById(
  organizationId: string,
  assignmentId: string,
  submissionId: string
): Promise<Submission | null> {
  try {
    const docRef = doc(
      db,
      "organizations",
      organizationId,
      "assignments",
      assignmentId,
      "submissions",
      submissionId
    );
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as Submission;
  } catch (error) {
    console.error("getSubmissionById error:", error);
    return null;
  }
}

export async function gradeSubmission(
  organizationId: string,
  assignmentId: string,
  submissionId: string,
  input: GradeSubmissionInput,
  maxMarks: number = 100,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(
    db,
    "organizations",
    organizationId,
    "assignments",
    assignmentId,
    "submissions",
    submissionId
  );
  const now = new Date().toISOString();
  const percentage = Math.min(100, Math.max(0, (input.marks / maxMarks) * 100));

  let grade = "A";
  if (percentage < 50) grade = "F";
  else if (percentage < 60) grade = "D";
  else if (percentage < 70) grade = "C";
  else if (percentage < 85) grade = "B";
  else grade = "A";

  await updateDoc(docRef, {
    marks: input.marks,
    percentage: Math.round(percentage * 10) / 10,
    grade,
    feedback: input.feedback || null,
    status: "Graded",
    gradedAt: now,
    gradedBy: userId,
    gradedByName: userName,
    updatedAt: now,
  });

  // Increment assignment's gradedCount
  const assignRef = doc(db, "organizations", organizationId, "assignments", assignmentId);
  const aDoc = await getDoc(assignRef);
  if (aDoc.exists()) {
    const current = (aDoc.data() as Assignment).gradedCount || 0;
    await updateDoc(assignRef, { gradedCount: current + 1 });
  }

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "SUBMISSION_GRADED",
    entityType: "SUBMISSION",
    entityId: submissionId,
    metadata: {
      assignmentId,
      marks: input.marks,
      percentage,
      grade,
    },
  });
}

export async function returnSubmission(
  organizationId: string,
  assignmentId: string,
  submissionId: string,
  input: ReturnSubmissionInput,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(
    db,
    "organizations",
    organizationId,
    "assignments",
    assignmentId,
    "submissions",
    submissionId
  );
  const now = new Date().toISOString();

  const newStatus: SubmissionStatus =
    input.action === "Request Resubmission" ? "Resubmission Required" : "Returned";

  await updateDoc(docRef, {
    status: newStatus,
    feedback: input.feedback || null,
    resubmissionReason: input.resubmissionReason || null,
    returnedAt: now,
    returnedBy: userId,
    updatedAt: now,
  });

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action:
      input.action === "Request Resubmission"
        ? "SUBMISSION_RESUBMISSION_REQUESTED"
        : "SUBMISSION_RETURNED",
    entityType: "SUBMISSION",
    entityId: submissionId,
    metadata: {
      assignmentId,
      action: input.action,
      reason: input.resubmissionReason,
    },
  });
}

// ----------------------------------------------------
// RESOURCES SERVICE
// ----------------------------------------------------

export async function getAcademicResources(
  organizationId: string,
  filters?: {
    classId?: string;
    subjectId?: string;
    category?: ResourceCategory;
  }
): Promise<AcademicResource[]> {
  try {
    const collRef = collection(db, "organizations", organizationId, "academicResources");
    let q = query(collRef, where("status", "==", "active"), orderBy("createdAt", "desc"));

    if (filters?.classId) {
      q = query(q, where("classId", "==", filters.classId));
    }
    if (filters?.subjectId) {
      q = query(q, where("subjectId", "==", filters.subjectId));
    }
    if (filters?.category) {
      q = query(q, where("category", "==", filters.category));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AcademicResource);
  } catch (error) {
    console.error("getAcademicResources error:", error);
    return [];
  }
}

export async function createAcademicResource(
  organizationId: string,
  input: AcademicResourceInput,
  file?: File,
  userId: string = "system",
  userName: string = "Teacher"
): Promise<AcademicResource> {
  const docRef = doc(collection(db, "organizations", organizationId, "academicResources"));
  const now = new Date().toISOString();

  let downloadUrl = input.downloadUrl || undefined;
  let fileName = input.fileName || undefined;
  let fileSize = input.fileSize || undefined;
  let mimeType = input.mimeType || undefined;
  let storagePath: string | undefined = undefined;

  // Upload file to Firebase Storage if provided
  if (file) {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    storagePath = `organizations/${organizationId}/academicResources/${docRef.id}/${cleanName}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytesResumable(fileRef, file, { contentType: file.type });
    downloadUrl = await getDownloadURL(fileRef);
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || "application/octet-stream";
  }

  let className: string | undefined;
  let subjectName: string | undefined;
  if (input.classId) {
    const c = await getSchoolClassById(organizationId, input.classId);
    if (c) className = c.name;
  }
  if (input.subjectId) {
    const s = await getSubjectById(organizationId, input.subjectId);
    if (s) subjectName = s.name;
  }

  const resource: AcademicResource = {
    id: docRef.id,
    organizationId,
    title: input.title,
    description: input.description || undefined,
    classId: input.classId || undefined,
    className,
    subjectId: input.subjectId || undefined,
    subjectName,
    category: input.category,
    fileName,
    storagePath,
    downloadUrl,
    mimeType,
    fileSize,
    externalUrl: input.externalUrl || undefined,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: now,
    updatedAt: now,
    status: "active",
  };

  await setDoc(docRef, resource);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "RESOURCE_CREATED",
    entityType: "RESOURCE",
    entityId: docRef.id,
    metadata: {
      title: input.title,
      category: input.category,
      fileName,
    },
  });

  return resource;
}

export async function deleteAcademicResource(
  organizationId: string,
  resourceId: string,
  userId: string,
  userName: string = "Teacher"
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "academicResources", resourceId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data() as AcademicResource;
    if (data.storagePath) {
      try {
        const fileRef = ref(storage, data.storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn("Storage delete failed:", err);
      }
    }
  }

  await deleteDoc(docRef);

  await createAuditLog(organizationId, {
    actorId: userId,
    actorName: userName,
    action: "RESOURCE_DELETED",
    entityType: "RESOURCE",
    entityId: resourceId,
    metadata: { resourceId },
  });
}

// ----------------------------------------------------
// SETTINGS SERVICE
// ----------------------------------------------------

export async function getAcademicWorkSettings(
  organizationId: string
): Promise<AcademicWorkSettingsConfig> {
  try {
    const docRef = doc(db, "organizations", organizationId, "academicWorkSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return DEFAULT_ACADEMIC_WORK_SETTINGS;
    }
    return snap.data() as AcademicWorkSettingsConfig;
  } catch (error) {
    console.error("getAcademicWorkSettings error:", error);
    return DEFAULT_ACADEMIC_WORK_SETTINGS;
  }
}

export async function updateAcademicWorkSettings(
  organizationId: string,
  settings: AcademicWorkSettingsInput,
  userId: string
): Promise<void> {
  const docRef = doc(db, "organizations", organizationId, "academicWorkSettings", "config");
  const now = new Date().toISOString();
  await setDoc(docRef, {
    ...settings,
    updatedAt: now,
    updatedBy: userId,
  });
}
