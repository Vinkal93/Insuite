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
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Enquiry,
  EnquiryStatus,
  FollowUp,
  CounsellingRecord,
  Application,
  ApplicationStatus,
  AdmissionRecord,
  AdmissionSettings,
} from "@/types/admission";
import { createStudent, generateNextStudentId, listStudents } from "./studentService";
import { createParent, listParents } from "./parentService";
import { createAuditLog } from "./auditService";

// Sequence generation helpers
export const generateNextEnquiryNumber = async (orgId: string, year = new Date().getFullYear().toString()): Promise<string> => {
  const counterRef = doc(db, "organizations", orgId, "counters", "enquiries");
  const nextSeq = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const curr = snap.exists() ? snap.data().currentSequence || 0 : 0;
    const updated = curr + 1;
    t.set(counterRef, { currentSequence: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  });
  return `ENQ-${year}-${nextSeq.toString().padStart(4, "0")}`;
};

export const generateNextApplicationNumber = async (orgId: string, year = new Date().getFullYear().toString()): Promise<string> => {
  const counterRef = doc(db, "organizations", orgId, "counters", "applications");
  const nextSeq = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const curr = snap.exists() ? snap.data().currentSequence || 0 : 0;
    const updated = curr + 1;
    t.set(counterRef, { currentSequence: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  });
  return `APP-${year}-${nextSeq.toString().padStart(4, "0")}`;
};

export const generateNextAdmissionNumber = async (orgId: string, year = new Date().getFullYear().toString()): Promise<string> => {
  const counterRef = doc(db, "organizations", orgId, "counters", "admissions");
  const nextSeq = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const curr = snap.exists() ? snap.data().currentSequence || 0 : 0;
    const updated = curr + 1;
    t.set(counterRef, { currentSequence: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  });
  return `ADM-${year}-${nextSeq.toString().padStart(4, "0")}`;
};

// ENQUIRIES CRUD
export const createEnquiry = async (
  orgId: string,
  data: Omit<Enquiry, "id" | "enquiryNumber" | "createdAt" | "updatedAt">,
  actor: { uid: string; name: string }
): Promise<Enquiry> => {
  const col = collection(db, "organizations", orgId, "enquiries");
  const newDoc = doc(col);
  const enquiryNumber = await generateNextEnquiryNumber(orgId);

  const enquiry: Enquiry = {
    ...data,
    id: newDoc.id,
    enquiryNumber,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
    createdByName: actor.name,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  await setDoc(newDoc, enquiry);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STUDENT_CREATED",
    entityType: "STUDENT",
    entityId: newDoc.id,
    metadata: { enquiryNumber, studentName: enquiry.student.fullName },
  });

  return enquiry;
};

export const getEnquiry = async (orgId: string, enquiryId: string): Promise<Enquiry | null> => {
  const ref = doc(db, "organizations", orgId, "enquiries", enquiryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Enquiry;
};

export const updateEnquiry = async (
  orgId: string,
  enquiryId: string,
  data: Partial<Enquiry>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "enquiries", enquiryId);
  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  });
};

export const listEnquiries = async (
  orgId: string,
  filters?: {
    sessionId?: string;
    classId?: string;
    source?: string;
    status?: string;
    searchQuery?: string;
  }
): Promise<Enquiry[]> => {
  const col = collection(db, "organizations", orgId, "enquiries");
  let q = query(col, orderBy("createdAt", "desc"), firestoreLimit(100));

  if (filters?.sessionId) {
    q = query(col, where("academicSessionId", "==", filters.sessionId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Enquiry);

  if (filters?.classId) {
    list = list.filter((e) => e.student.interestedClass === filters.classId);
  }
  if (filters?.source) {
    list = list.filter((e) => e.source === filters.source);
  }
  if (filters?.status) {
    list = list.filter((e) => e.status === filters.status);
  }
  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    const term = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.student.fullName.toLowerCase().includes(term) ||
        e.enquiryNumber.toLowerCase().includes(term) ||
        e.parent.mobile.includes(term) ||
        (e.parent.fatherName && e.parent.fatherName.toLowerCase().includes(term))
    );
  }

  return list;
};

// FOLLOW-UPS
export const createFollowUp = async (
  orgId: string,
  data: Omit<FollowUp, "id" | "createdAt">,
  actor: { uid: string; name: string }
): Promise<FollowUp> => {
  const col = collection(db, "organizations", orgId, "followUps");
  const newDoc = doc(col);

  const followUp: FollowUp = {
    ...data,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
  };

  await setDoc(newDoc, followUp);

  if (data.enquiryId) {
    await updateEnquiry(orgId, data.enquiryId, { nextFollowUpAt: data.scheduledDate }, actor);
  }

  return followUp;
};

export const listFollowUps = async (
  orgId: string,
  enquiryId?: string
): Promise<FollowUp[]> => {
  const col = collection(db, "organizations", orgId, "followUps");
  let q = query(col, orderBy("scheduledDate", "desc"), firestoreLimit(100));
  if (enquiryId) {
    q = query(col, where("enquiryId", "==", enquiryId), orderBy("scheduledDate", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FollowUp);
};

export const completeFollowUp = async (
  orgId: string,
  followUpId: string,
  outcome: FollowUp["outcome"],
  notes: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "followUps", followUpId);
  await updateDoc(ref, {
    status: "Completed",
    outcome,
    outcomeNotes: notes,
    completedAt: new Date().toISOString(),
    completedBy: actor.uid,
    completedByName: actor.name,
  });
};

// COUNSELLING
export const createCounselling = async (
  orgId: string,
  data: Omit<CounsellingRecord, "id" | "createdAt" | "updatedAt">
): Promise<CounsellingRecord> => {
  const col = collection(db, "organizations", orgId, "counselling");
  const newDoc = doc(col);

  const rec: CounsellingRecord = {
    ...data,
    id: newDoc.id,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(newDoc, rec);
  return rec;
};

export const listCounselling = async (orgId: string): Promise<CounsellingRecord[]> => {
  const col = collection(db, "organizations", orgId, "counselling");
  const q = query(col, orderBy("updatedAt", "desc"), firestoreLimit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CounsellingRecord);
};

// APPLICATIONS
export const createApplication = async (
  orgId: string,
  data: Omit<Application, "id" | "applicationNumber" | "createdAt" | "updatedAt">,
  actor: { uid: string; name: string }
): Promise<Application> => {
  const col = collection(db, "organizations", orgId, "applications");
  const newDoc = doc(col);
  const applicationNumber = await generateNextApplicationNumber(orgId);

  const app: Application = {
    ...data,
    id: newDoc.id,
    applicationNumber,
    organizationId: orgId,
    status: data.status || "Submitted",
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
    createdByName: actor.name,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  await setDoc(newDoc, app);
  return app;
};

export const getApplication = async (orgId: string, appId: string): Promise<Application | null> => {
  const ref = doc(db, "organizations", orgId, "applications", appId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Application;
};

export const updateApplication = async (
  orgId: string,
  appId: string,
  data: Partial<Application>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "applications", appId);
  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  });
};

export const listApplications = async (
  orgId: string,
  filters?: {
    sessionId?: string;
    status?: ApplicationStatus | "";
    classId?: string;
    searchQuery?: string;
  }
): Promise<Application[]> => {
  const col = collection(db, "organizations", orgId, "applications");
  let q = query(col, orderBy("createdAt", "desc"), firestoreLimit(100));

  if (filters?.sessionId) {
    q = query(col, where("academicSessionId", "==", filters.sessionId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Application);

  if (filters?.status) {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.classId) {
    list = list.filter((a) => a.applyingClass === filters.classId);
  }
  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    const term = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (a) =>
        a.student.fullName.toLowerCase().includes(term) ||
        a.applicationNumber.toLowerCase().includes(term) ||
        a.contact.mobile.includes(term)
    );
  }

  return list;
};

// ADMISSION CONVERSION (Direct Integration with Phase 3 Student & Parent Management)
export const convertApplicationToAdmission = async (
  orgId: string,
  applicationId: string,
  options: {
    sectionId?: string;
    sectionName?: string;
    admissionDate?: string;
    customAdmissionNumber?: string;
  },
  actor: { uid: string; name: string }
): Promise<{ studentId: string; admissionNumber: string; admissionId: string }> => {
  const app = await getApplication(orgId, applicationId);
  if (!app) throw new Error("Application not found");

  const admissionDate = options.admissionDate || new Date().toISOString().split("T")[0];
  const admissionNumber = options.customAdmissionNumber || (await generateNextAdmissionNumber(orgId));

  // 1. Create or link Parents
  let fatherId: string | undefined;
  let motherId: string | undefined;

  if (app.parent.fatherName) {
    const father = await createParent(
      orgId,
      {
        organizationId: orgId,
        firstName: app.parent.fatherName,
        lastName: app.student.lastName,
        fullName: app.parent.fatherName,
        relation: "FATHER",
        mobile: app.parent.fatherMobile || app.contact.mobile,
        email: app.parent.fatherEmail || "",
        occupation: app.parent.fatherOccupation || "",
        address: app.contact.addressLine,
        childrenIds: [],
        status: "ACTIVE",
      },
      actor
    );
    fatherId = father.id;
  }

  if (app.parent.motherName) {
    const mother = await createParent(
      orgId,
      {
        organizationId: orgId,
        firstName: app.parent.motherName,
        lastName: app.student.lastName,
        fullName: app.parent.motherName,
        relation: "MOTHER",
        mobile: app.parent.motherMobile || "",
        email: app.parent.motherEmail || "",
        occupation: app.parent.motherOccupation || "",
        address: app.contact.addressLine,
        childrenIds: [],
        status: "ACTIVE",
      },
      actor
    );
    motherId = mother.id;
  }

  // 2. Generate permanent Student ID & Create Student
  const autoStudentId = await generateNextStudentId(orgId);

  const student = await createStudent(
    orgId,
    {
      organizationId: orgId,
      studentId: autoStudentId,
      admissionNumber,
      firstName: app.student.firstName,
      middleName: app.student.middleName || "",
      lastName: app.student.lastName,
      fullName: app.student.fullName,
      photoUrl: app.student.photoUrl || "",
      dateOfBirth: app.student.dob,
      gender: app.student.gender,
      bloodGroup: app.student.bloodGroup || "",
      nationality: app.student.nationality || "Indian",
      religion: app.student.religion || "",
      category: app.student.category || "General",
      previousSchool: app.academicHistory.previousSchool || "",
      contact: {
        mobile: app.contact.mobile,
        email: app.contact.email || "",
      },
      address: {
        addressLine: app.contact.addressLine,
        city: app.contact.city || "",
        state: app.contact.state || "",
        postalCode: app.contact.postalCode || "",
        country: app.contact.country || "India",
      },
      academic: {
        sessionId: app.academicSessionId,
        sessionName: app.sessionName || "",
        classId: app.applyingClass,
        className: app.applyingClass,
        sectionId: options.sectionId || "Section A",
        sectionName: options.sectionName || "Section A",
        admissionDate,
      },
      parentIds: {
        fatherId,
        motherId,
      },
      status: "ACTIVE",
      createdBy: actor.uid,
      updatedBy: actor.uid,
    },
    actor
  );

  // 3. Create Admission Record
  const admissionsCol = collection(db, "organizations", orgId, "admissions");
  const newAdmissionDoc = doc(admissionsCol);

  const admissionRecord: AdmissionRecord = {
    id: newAdmissionDoc.id,
    admissionNumber,
    organizationId: orgId,
    academicSessionId: app.academicSessionId,
    sessionName: app.sessionName,
    applicationId: app.id,
    studentId: student.id,
    studentName: student.fullName,
    studentPhotoUrl: student.photoUrl,
    classId: app.applyingClass,
    className: app.applyingClass,
    sectionId: options.sectionId || "Section A",
    sectionName: options.sectionName || "Section A",
    admissionDate,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
    createdByName: actor.name,
  };

  await setDoc(newAdmissionDoc, admissionRecord);

  // 4. Update Application status to Converted
  await updateApplication(orgId, app.id, { status: "Converted" }, actor);

  return {
    studentId: student.id,
    admissionNumber,
    admissionId: newAdmissionDoc.id,
  };
};

export const listAdmissions = async (
  orgId: string,
  filters?: { sessionId?: string; classId?: string; searchQuery?: string }
): Promise<AdmissionRecord[]> => {
  const col = collection(db, "organizations", orgId, "admissions");
  let q = query(col, orderBy("admissionDate", "desc"), firestoreLimit(100));

  if (filters?.sessionId) {
    q = query(col, where("academicSessionId", "==", filters.sessionId), orderBy("admissionDate", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as AdmissionRecord);

  if (filters?.classId) {
    list = list.filter((a) => a.classId === filters.classId);
  }
  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    const term = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (a) =>
        a.studentName.toLowerCase().includes(term) ||
        a.admissionNumber.toLowerCase().includes(term)
    );
  }

  return list;
};

// ADMISSION DASHBOARD STATS
export interface AdmissionDashboardStats {
  totalEnquiries: number;
  newEnquiries: number;
  followUpsDue: number;
  totalApplications: number;
  pendingVerification: number;
  approvedApplications: number;
  admissionsCompleted: number;
  rejectedApplications: number;
  funnel: {
    enquiry: number;
    contacted: number;
    counselling: number;
    application: number;
    verification: number;
    approved: number;
    admitted: number;
  };
  sources: { source: string; count: number }[];
  todayFollowUps: FollowUp[];
  recentAdmissions: AdmissionRecord[];
}

export const getAdmissionDashboardStats = async (
  orgId: string,
  sessionId?: string
): Promise<AdmissionDashboardStats> => {
  const [enquiries, applications, followUps, admissions] = await Promise.all([
    listEnquiries(orgId, { sessionId }),
    listApplications(orgId, { sessionId }),
    listFollowUps(orgId),
    listAdmissions(orgId, { sessionId }),
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayFollowUps = followUps.filter((f) => f.scheduledDate <= todayStr && f.status === "Pending");

  // Funnel calculation
  const enquiryCount = enquiries.length;
  const contactedCount = enquiries.filter((e) => e.status !== "New").length;
  const counsellingCount = enquiries.filter((e) => e.status === "Counselling" || e.status === "Interested" || e.status === "Application Started" || e.status === "Converted").length;
  const appCount = applications.length;
  const verificationCount = applications.filter((a) => a.status === "Under Review" || a.status === "Documents Pending" || a.status === "Verified").length;
  const approvedCount = applications.filter((a) => a.status === "Approved" || a.status === "Converted").length;
  const admittedCount = admissions.length;

  // Source analytics
  const sourceMap: Record<string, number> = {};
  enquiries.forEach((e) => {
    sourceMap[e.source] = (sourceMap[e.source] || 0) + 1;
  });
  const sources = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));

  return {
    totalEnquiries: enquiries.length,
    newEnquiries: enquiries.filter((e) => e.status === "New").length,
    followUpsDue: todayFollowUps.length,
    totalApplications: applications.length,
    pendingVerification: applications.filter((a) => a.status === "Documents Pending" || a.status === "Under Review").length,
    approvedApplications: applications.filter((a) => a.status === "Approved").length,
    admissionsCompleted: admissions.length,
    rejectedApplications: applications.filter((a) => a.status === "Rejected").length,
    funnel: {
      enquiry: enquiryCount,
      contacted: contactedCount,
      counselling: counsellingCount,
      application: appCount,
      verification: verificationCount,
      approved: approvedCount,
      admitted: admittedCount,
    },
    sources,
    todayFollowUps: todayFollowUps.slice(0, 5),
    recentAdmissions: admissions.slice(0, 5),
  };
};

// SETTINGS
export const getAdmissionSettings = async (orgId: string): Promise<AdmissionSettings> => {
  const ref = doc(db, "organizations", orgId, "admissionSettings", "config");
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as AdmissionSettings;

  const defaultSettings: AdmissionSettings = {
    id: "config",
    organizationId: orgId,
    admissionPrefix: "ADM",
    admissionStartNumber: 1001,
    applicationPrefix: "APP",
    enquiryPrefix: "ENQ",
    defaultEnquiryStatus: "New",
    autoGenerateAdmissionNo: true,
    requiredDocuments: ["Birth Certificate", "Transfer Certificate", "Previous Marksheet", "Photo ID"],
    enquirySources: ["Website", "Walk-in", "Phone", "WhatsApp", "Referral", "Advertisement", "Social Media", "School Event"],
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, defaultSettings);
  return defaultSettings;
};

export const updateAdmissionSettings = async (orgId: string, settings: Partial<AdmissionSettings>): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "admissionSettings", "config");
  await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
};

// ----------------------------------------------------
// CAMPAIGNS CRUD
// ----------------------------------------------------

export const listCampaigns = async (orgId: string): Promise<any[]> => {
  const col = collection(db, "organizations", orgId, "admissionCampaigns");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
};

export const createCampaign = async (
  orgId: string,
  data: { name: string; source: any; startDate: string; endDate?: string | null; budget?: number | null; status?: "Active" | "Completed" | "Paused" },
  actor: { uid: string; name: string }
): Promise<any> => {
  const col = collection(db, "organizations", orgId, "admissionCampaigns");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const campaign = {
    id: newDoc.id,
    organizationId: orgId,
    name: data.name.trim(),
    source: data.source,
    startDate: data.startDate,
    endDate: data.endDate || null,
    budget: data.budget !== undefined && data.budget !== null ? Number(data.budget) : null,
    status: data.status || "Active",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
  };

  await setDoc(newDoc, campaign);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "CAMPAIGN_CREATED",
    entityType: "ADMISSION_CAMPAIGN",
    entityId: newDoc.id,
    metadata: { name: campaign.name },
  });

  return campaign;
};

export const updateCampaign = async (
  orgId: string,
  campaignId: string,
  data: Partial<any>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "admissionCampaigns", campaignId);
  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "CAMPAIGN_UPDATED",
    entityType: "ADMISSION_CAMPAIGN",
    entityId: campaignId,
  });
};

// ----------------------------------------------------
// WAITLIST CRUD
// ----------------------------------------------------

export const listWaitlist = async (orgId: string, sessionId?: string): Promise<any[]> => {
  const col = collection(db, "organizations", orgId, "admissionWaitlist");
  let q = query(col, orderBy("waitlistPosition", "asc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data());

  if (sessionId) {
    list = list.filter((w) => w.academicSessionId === sessionId);
  }
  return list;
};

export const addToWaitlist = async (
  orgId: string,
  data: { applicationId: string; priority?: "Low" | "Normal" | "High" | "Urgent"; notes?: string | null },
  actor: { uid: string; name: string }
): Promise<any> => {
  const app = await getApplication(orgId, data.applicationId);
  if (!app) throw new Error("Application not found.");

  const currentWaitlist = await listWaitlist(orgId, app.academicSessionId);
  const nextPos = currentWaitlist.length + 1;

  const col = collection(db, "organizations", orgId, "admissionWaitlist");
  const newDoc = doc(col);
  const now = new Date().toISOString();

  const record = {
    id: newDoc.id,
    organizationId: orgId,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    studentName: app.student.fullName,
    guardianName: app.parent.fatherName || app.parent.guardianName || app.parent.motherName || "Guardian",
    mobile: app.contact.mobile,
    applyingClass: app.applyingClass,
    academicSessionId: app.academicSessionId,
    waitlistPosition: nextPos,
    priority: data.priority || "Normal",
    status: "Waiting",
    notes: data.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDoc, record);
  await updateApplication(orgId, app.id, { status: "Waitlisted" as any }, actor);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "APPLICATION_WAITLISTED",
    entityType: "ADMISSION_WAITLIST",
    entityId: newDoc.id,
    metadata: { applicationNumber: app.applicationNumber, position: nextPos },
  });

  return record;
};

export const updateWaitlistStatus = async (
  orgId: string,
  waitlistId: string,
  status: "Waiting" | "Offered" | "Accepted" | "Declined" | "Expired" | "Removed",
  actor: { uid: string; name: string }
): Promise<void> => {
  const ref = doc(db, "organizations", orgId, "admissionWaitlist", waitlistId);
  await updateDoc(ref, {
    status,
    updatedAt: new Date().toISOString(),
  });
};

// ----------------------------------------------------
// DOCUMENT VERIFICATION
// ----------------------------------------------------

export const verifyApplicationDocument = async (
  orgId: string,
  applicationId: string,
  documentId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const app = await getApplication(orgId, applicationId);
  if (!app) throw new Error("Application not found.");

  const now = new Date().toISOString();
  const updatedDocs = (app.documents || []).map((doc) => {
    if (doc.id === documentId) {
      return {
        ...doc,
        status: "Verified" as const,
        verifiedBy: actor.name,
        verifiedAt: now,
        rejectionReason: undefined,
      };
    }
    return doc;
  });

  const allVerified = updatedDocs.every((d) => d.status === "Verified");

  await updateDoc(doc(db, "organizations", orgId, "applications", applicationId), {
    documents: updatedDocs,
    status: allVerified ? "Verified" : app.status,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_VERIFIED",
    entityType: "ADMISSION_DOCUMENT",
    entityId: documentId,
    metadata: { applicationId },
  });
};

export const rejectApplicationDocument = async (
  orgId: string,
  applicationId: string,
  documentId: string,
  reason: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const app = await getApplication(orgId, applicationId);
  if (!app) throw new Error("Application not found.");

  const now = new Date().toISOString();
  const updatedDocs = (app.documents || []).map((doc) => {
    if (doc.id === documentId) {
      return {
        ...doc,
        status: "Rejected" as const,
        rejectionReason: reason.trim(),
        verifiedBy: actor.name,
        verifiedAt: now,
      };
    }
    return doc;
  });

  await updateDoc(doc(db, "organizations", orgId, "applications", applicationId), {
    documents: updatedDocs,
    status: "Documents Pending",
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DOCUMENT_REJECTED",
    entityType: "ADMISSION_DOCUMENT",
    entityId: documentId,
    metadata: { applicationId, reason },
  });
};
