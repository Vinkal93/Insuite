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
  Staff,
  Department,
  Designation,
  StaffDocument,
  SalaryStructure,
  StaffSalaryProfile,
  PayrollRecord,
  HrDashboardStats,
  HrSettingsConfig,
  StaffDocumentType,
  StaffStatus,
  PayrollStatus,
} from "@/types/hr";
import type {
  StaffInput,
  DepartmentInput,
  DesignationInput,
  SalaryStructureInput,
  StaffSalaryProfileInput,
  PayrollProcessInput,
  StaffStatusChangeInput,
  HrSettingsInput,
} from "@/schemas/hr";
import { createAuditLog } from "./auditService";

export const DEFAULT_HR_SETTINGS: HrSettingsConfig = {
  employeeIdPrefix: "INS-EMP",
  autoGenerateEmployeeId: true,
  docExpiryWarningThresholdDays: 30,
  employmentTypes: [
    "Full Time",
    "Part Time",
    "Contract",
    "Temporary",
    "Intern",
    "Other",
  ],
  leaveTypes: ["Casual Leave", "Sick Leave", "Earned Leave", "Maternity Leave", "Unpaid Leave"],
};

// ----------------------------------------------------
// 1. HR SETTINGS & UNIQUE EMPLOYEE ID GENERATOR
// ----------------------------------------------------

export const getHrSettings = async (orgId: string): Promise<HrSettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "hrSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_HR_SETTINGS;
    return { ...DEFAULT_HR_SETTINGS, ...snap.data() } as HrSettingsConfig;
  } catch (err) {
    console.error("getHrSettings error:", err);
    return DEFAULT_HR_SETTINGS;
  }
};

export const updateHrSettings = async (
  orgId: string,
  input: HrSettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "hrSettings", "config");
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
    action: "HR_SETTINGS_UPDATED",
    entityType: "HR_SETTINGS",
    entityId: "config",
  });
};

export const generateNextEmployeeId = async (
  orgId: string,
  prefix = "INS-EMP"
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, "organizations", orgId, "counters", "employees");
  return await runTransaction(db, async (txn) => {
    const snap = await txn.get(counterRef);
    let nextCount = 1;
    if (snap.exists()) {
      nextCount = (snap.data().lastCount || 0) + 1;
    }
    txn.set(counterRef, { lastCount: nextCount, updatedAt: serverTimestamp() }, { merge: true });
    const padded = String(nextCount).padStart(5, "0");
    return `${prefix}-${currentYear}-${padded}`;
  });
};

// ----------------------------------------------------
// 2. DEPARTMENTS CRUD
// ----------------------------------------------------

export const listDepartments = async (orgId: string): Promise<Department[]> => {
  const colRef = collection(db, "organizations", orgId, "departments");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Department);
};

export const createDepartment = async (
  orgId: string,
  input: DepartmentInput,
  actor: { uid: string; name: string }
): Promise<Department> => {
  const colRef = collection(db, "organizations", orgId, "departments");
  const docRef = doc(colRef);
  const now = new Date().toISOString();

  const dept: Department = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    code: input.code.toUpperCase(),
    headStaffId: input.headStaffId || null,
    headStaffName: input.headStaffName || null,
    description: input.description || null,
    staffCount: 0,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, dept);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DEPARTMENT_CREATED",
    entityType: "DEPARTMENT",
    entityId: docRef.id,
    metadata: { name: dept.name, code: dept.code },
  });

  return dept;
};

export const updateDepartment = async (
  orgId: string,
  id: string,
  input: Partial<DepartmentInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "departments", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...input,
    code: input.code ? input.code.toUpperCase() : undefined,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DEPARTMENT_UPDATED",
    entityType: "DEPARTMENT",
    entityId: id,
  });
};

export const deactivateDepartment = async (
  orgId: string,
  id: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  // Check if staff belong to this department
  const staffQuery = query(
    collection(db, "organizations", orgId, "staff"),
    where("professional.departmentId", "==", id),
    where("status", "==", "Active")
  );
  const staffSnap = await getDocs(staffQuery);
  if (!staffSnap.empty) {
    throw new Error(
      `Cannot deactivate department: ${staffSnap.size} active staff members are assigned to it.`
    );
  }

  const docRef = doc(db, "organizations", orgId, "departments", id);
  await updateDoc(docRef, {
    status: "Inactive",
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DEPARTMENT_DEACTIVATED",
    entityType: "DEPARTMENT",
    entityId: id,
  });
};

// ----------------------------------------------------
// 3. DESIGNATIONS CRUD
// ----------------------------------------------------

export const listDesignations = async (orgId: string): Promise<Designation[]> => {
  const colRef = collection(db, "organizations", orgId, "designations");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Designation);
};

export const createDesignation = async (
  orgId: string,
  input: DesignationInput,
  actor: { uid: string; name: string }
): Promise<Designation> => {
  const colRef = collection(db, "organizations", orgId, "designations");
  const docRef = doc(colRef);
  const now = new Date().toISOString();

  const desig: Designation = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    departmentId: input.departmentId || null,
    departmentName: input.departmentName || null,
    staffCount: 0,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, desig);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DESIGNATION_CREATED",
    entityType: "DESIGNATION",
    entityId: docRef.id,
    metadata: { name: desig.name },
  });

  return desig;
};

export const updateDesignation = async (
  orgId: string,
  id: string,
  input: Partial<DesignationInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "designations", id);
  await updateDoc(docRef, {
    ...input,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DESIGNATION_UPDATED",
    entityType: "DESIGNATION",
    entityId: id,
  });
};

// ----------------------------------------------------
// 4. STAFF DIRECTORY & TEACHER IDENTITY SYNC
// ----------------------------------------------------

export const createStaff = async (
  orgId: string,
  input: StaffInput,
  actor: { uid: string; name: string }
): Promise<Staff> => {
  const colRef = collection(db, "organizations", orgId, "staff");
  const docRef = doc(colRef);
  const staffId = docRef.id;
  const now = new Date().toISOString();

  const fullName = [input.personal.firstName, input.personal.middleName, input.personal.lastName]
    .filter(Boolean)
    .join(" ");

  const staff: Staff = {
    id: staffId,
    organizationId: orgId,
    employeeId: input.professional.employeeId,
    fullName,
    personal: input.personal,
    contact: input.contact,
    professional: {
      ...input.professional,
      teacherId: input.professional.isTeachingStaff ? staffId : null,
    },
    emergencyContact: input.emergencyContact,
    documents: [],
    status: input.status || "Active",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  const batch = writeBatch(db);
  batch.set(docRef, staff);

  // If Teaching Staff, create/sync the teacher record in `teachers/{staffId}` for seamless academic integration
  if (input.professional.isTeachingStaff) {
    const teacherRef = doc(db, "organizations", orgId, "teachers", staffId);
    batch.set(teacherRef, {
      id: staffId,
      organizationId: orgId,
      employeeId: input.professional.employeeId,
      personal: {
        firstName: input.personal.firstName,
        middleName: input.personal.middleName || null,
        lastName: input.personal.lastName,
        photoUrl: input.personal.photoUrl || null,
        dob: input.personal.dob,
        gender: input.personal.gender,
        bloodGroup: input.personal.bloodGroup || null,
      },
      contact: {
        mobile: input.contact.mobile,
        email: input.contact.email || null,
        address: input.contact.address || null,
        city: input.contact.city || null,
        state: input.contact.state || null,
        postalCode: input.contact.pinCode || null,
      },
      professional: {
        joiningDate: input.professional.joiningDate,
        department: input.professional.departmentName || null,
        designation: input.professional.designationName || null,
        qualification: input.professional.qualification || null,
        experience: input.professional.experience || null,
        specialization: input.professional.specialization || null,
      },
      emergencyContact: input.emergencyContact || null,
      status: "active",
      assignedClasses: [],
      assignedSubjects: [],
      createdAt: now,
      createdBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STAFF_CREATED",
    entityType: "STAFF",
    entityId: staffId,
    metadata: {
      fullName,
      employeeId: staff.employeeId,
      department: input.professional.departmentName,
      isTeachingStaff: input.professional.isTeachingStaff,
    },
  });

  return staff;
};

export const getStaff = async (orgId: string, id: string): Promise<Staff | null> => {
  const docRef = doc(db, "organizations", orgId, "staff", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as Staff;
};

export const updateStaff = async (
  orgId: string,
  id: string,
  input: Partial<StaffInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "staff", id);
  const currentSnap = await getDoc(docRef);
  if (!currentSnap.exists()) {
    throw new Error("Staff record not found.");
  }
  const current = currentSnap.data() as Staff;
  const now = new Date().toISOString();

  let fullName = current.fullName;
  if (input.personal) {
    fullName = [
      input.personal.firstName || current.personal.firstName,
      input.personal.middleName !== undefined ? input.personal.middleName : current.personal.middleName,
      input.personal.lastName || current.personal.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const updatedStaff: Partial<Staff> = {
    fullName,
    personal: input.personal ? { ...current.personal, ...input.personal } : current.personal,
    contact: input.contact ? { ...current.contact, ...input.contact } : current.contact,
    professional: input.professional
      ? { ...current.professional, ...input.professional }
      : current.professional,
    emergencyContact:
      input.emergencyContact !== undefined ? input.emergencyContact : current.emergencyContact,
    status: input.status || current.status,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  const batch = writeBatch(db);
  batch.update(docRef, updatedStaff as Record<string, any>);

  // Sync to teacher profile if teaching staff
  const isTeaching = updatedStaff.professional?.isTeachingStaff;
  if (isTeaching) {
    const teacherRef = doc(db, "organizations", orgId, "teachers", id);
    batch.set(
      teacherRef,
      {
        id,
        organizationId: orgId,
        employeeId: updatedStaff.professional?.employeeId || current.employeeId,
        personal: updatedStaff.personal,
        contact: updatedStaff.contact,
        professional: {
          joiningDate: updatedStaff.professional?.joiningDate,
          department: updatedStaff.professional?.departmentName,
          designation: updatedStaff.professional?.designationName,
          qualification: updatedStaff.professional?.qualification,
          experience: updatedStaff.professional?.experience,
          specialization: updatedStaff.professional?.specialization,
        },
        emergencyContact: updatedStaff.emergencyContact,
        status: updatedStaff.status === "Active" ? "active" : "inactive",
        updatedAt: now,
        updatedBy: actor.uid,
      },
      { merge: true }
    );
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STAFF_UPDATED",
    entityType: "STAFF",
    entityId: id,
    metadata: { fullName },
  });
};

export const changeStaffStatus = async (
  orgId: string,
  id: string,
  input: StaffStatusChangeInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "staff", id);
  const now = new Date().toISOString();

  const batch = writeBatch(db);
  batch.update(docRef, {
    status: input.status,
    statusReason: input.reason,
    statusEffectiveDate: input.effectiveDate,
    statusNotes: input.notes || null,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  // Sync to teacher status
  const teacherRef = doc(db, "organizations", orgId, "teachers", id);
  const teacherSnap = await getDoc(teacherRef);
  if (teacherSnap.exists()) {
    batch.update(teacherRef, {
      status: input.status === "Active" ? "active" : "inactive",
      updatedAt: now,
      updatedBy: actor.uid,
    });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STAFF_STATUS_CHANGED",
    entityType: "STAFF",
    entityId: id,
    metadata: { newStatus: input.status, reason: input.reason, effectiveDate: input.effectiveDate },
  });
};

export const listStaff = async (
  orgId: string,
  filters?: {
    departmentId?: string;
    designationId?: string;
    employmentType?: string;
    status?: string;
    isTeachingStaff?: boolean;
  }
): Promise<Staff[]> => {
  const colRef = collection(db, "organizations", orgId, "staff");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Staff);

  if (filters?.departmentId && filters.departmentId !== "ALL") {
    list = list.filter((s) => s.professional.departmentId === filters.departmentId);
  }
  if (filters?.designationId && filters.designationId !== "ALL") {
    list = list.filter((s) => s.professional.designationId === filters.designationId);
  }
  if (filters?.employmentType && filters.employmentType !== "ALL") {
    list = list.filter((s) => s.professional.employmentType === filters.employmentType);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((s) => s.status === filters.status);
  }
  if (filters?.isTeachingStaff !== undefined) {
    list = list.filter((s) => s.professional.isTeachingStaff === filters.isTeachingStaff);
  }

  return list;
};

// ----------------------------------------------------
// 5. STAFF DOCUMENTS MANAGEMENT
// ----------------------------------------------------

export const uploadStaffDocument = async (
  orgId: string,
  staffId: string,
  file: File,
  documentType: StaffDocumentType,
  expiryDate?: string | null,
  actor?: { uid: string; name: string }
): Promise<StaffDocument> => {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `organizations/${orgId}/staff/${staffId}/documents/${timestamp}_${sanitizedFileName}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, { contentType: file.type });
  const fileUrl = await getDownloadURL(fileRef);

  const docId = `doc_${timestamp}`;
  const now = new Date().toISOString();

  // Compute status
  let status: "Valid" | "Expiring Soon" | "Expired" | "Missing" = "Valid";
  if (expiryDate) {
    const expiry = new Date(expiryDate).getTime();
    const today = new Date().getTime();
    const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      status = "Expired";
    } else if (diffDays <= 30) {
      status = "Expiring Soon";
    }
  }

  const staffDoc: StaffDocument = {
    id: docId,
    name: file.name,
    documentType,
    fileName: sanitizedFileName,
    fileUrl,
    fileSize: file.size,
    storagePath,
    mimeType: file.type,
    expiryDate: expiryDate || null,
    status,
    uploadedAt: now,
    uploadedBy: actor?.uid || "admin",
  };

  const staffRef = doc(db, "organizations", orgId, "staff", staffId);
  const snap = await getDoc(staffRef);
  if (snap.exists()) {
    const existingDocs: StaffDocument[] = snap.data().documents || [];
    await updateDoc(staffRef, {
      documents: [...existingDocs, staffDoc],
      updatedAt: now,
    });
  }

  if (actor) {
    await createAuditLog(orgId, {
      actorId: actor.uid,
      actorName: actor.name,
      action: "STAFF_DOCUMENT_UPLOADED",
      entityType: "STAFF_DOCUMENT",
      entityId: docId,
      metadata: { staffId, fileName: file.name, documentType },
    });
  }

  return staffDoc;
};

export const deleteStaffDocument = async (
  orgId: string,
  staffId: string,
  docId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const staffRef = doc(db, "organizations", orgId, "staff", staffId);
  const snap = await getDoc(staffRef);
  if (!snap.exists()) return;

  const existingDocs: StaffDocument[] = snap.data().documents || [];
  const targetDoc = existingDocs.find((d) => d.id === docId);

  if (targetDoc?.storagePath) {
    try {
      const fileRef = ref(storage, targetDoc.storagePath);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("Storage deletion note:", err);
    }
  }

  const updatedDocs = existingDocs.filter((d) => d.id !== docId);
  await updateDoc(staffRef, {
    documents: updatedDocs,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STAFF_DOCUMENT_DELETED",
    entityType: "STAFF_DOCUMENT",
    entityId: docId,
    metadata: { staffId },
  });
};

export const listAllStaffDocuments = async (
  orgId: string,
  filterStatus?: string
): Promise<{ staff: Staff; document: StaffDocument }[]> => {
  const staffList = await listStaff(orgId);
  const result: { staff: Staff; document: StaffDocument }[] = [];

  staffList.forEach((st) => {
    (st.documents || []).forEach((docItem) => {
      if (!filterStatus || filterStatus === "ALL" || docItem.status === filterStatus) {
        result.push({ staff: st, document: docItem });
      }
    });
  });

  return result;
};

// ----------------------------------------------------
// 6. SALARY STRUCTURES & STAFF SALARY PROFILES
// ----------------------------------------------------

export const listSalaryStructures = async (orgId: string): Promise<SalaryStructure[]> => {
  const colRef = collection(db, "organizations", orgId, "salaryStructures");
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as SalaryStructure);
};

export const createSalaryStructure = async (
  orgId: string,
  input: SalaryStructureInput,
  actor: { uid: string; name: string }
): Promise<SalaryStructure> => {
  const colRef = collection(db, "organizations", orgId, "salaryStructures");
  const docRef = doc(colRef);
  const now = new Date().toISOString();

  const structure: SalaryStructure = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    basicSalary: input.basicSalary,
    components: input.components || [],
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, structure);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SALARY_STRUCTURE_CREATED",
    entityType: "SALARY_STRUCTURE",
    entityId: docRef.id,
    metadata: { name: structure.name, basicSalary: structure.basicSalary },
  });

  return structure;
};

export const updateSalaryStructure = async (
  orgId: string,
  id: string,
  input: Partial<SalaryStructureInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "salaryStructures", id);
  await updateDoc(docRef, {
    ...input,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "SALARY_STRUCTURE_UPDATED",
    entityType: "SALARY_STRUCTURE",
    entityId: id,
  });
};

export const getStaffSalaryProfile = async (
  orgId: string,
  staffId: string
): Promise<StaffSalaryProfile | null> => {
  const docRef = doc(db, "organizations", orgId, "staffSalaryProfiles", staffId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as StaffSalaryProfile;
};

export const updateStaffSalaryProfile = async (
  orgId: string,
  staffId: string,
  input: StaffSalaryProfileInput,
  actor: { uid: string; name: string }
): Promise<StaffSalaryProfile> => {
  const docRef = doc(db, "organizations", orgId, "staffSalaryProfiles", staffId);
  const now = new Date().toISOString();

  const totalAllowances = (input.allowances || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalDeductions = (input.deductions || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const grossSalary = input.basicSalary + totalAllowances;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const profile: StaffSalaryProfile = {
    staffId,
    organizationId: orgId,
    structureId: input.structureId || null,
    structureName: input.structureName || null,
    basicSalary: input.basicSalary,
    allowances: input.allowances || [],
    deductions: input.deductions || [],
    grossSalary,
    netSalary,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, profile);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STAFF_SALARY_CONFIGURED",
    entityType: "STAFF",
    entityId: staffId,
    metadata: { grossSalary, netSalary },
  });

  return profile;
};

// ----------------------------------------------------
// 7. PAYROLL PROCESSING & LIFECYCLE
// ----------------------------------------------------

export const processPayroll = async (
  orgId: string,
  input: PayrollProcessInput,
  actor: { uid: string; name: string }
): Promise<PayrollRecord[]> => {
  const periodStr = `${input.year}-${String(input.month).padStart(2, "0")}`;
  const records: PayrollRecord[] = [];
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const staffId of input.staffIds) {
    const [staffDoc, profileDoc] = await Promise.all([
      getDoc(doc(db, "organizations", orgId, "staff", staffId)),
      getDoc(doc(db, "organizations", orgId, "staffSalaryProfiles", staffId)),
    ]);

    if (!staffDoc.exists()) continue;
    const staff = staffDoc.data() as Staff;
    const profile = profileDoc.exists() ? (profileDoc.data() as StaffSalaryProfile) : null;

    const basic = profile?.basicSalary || 0;
    const allowances = profile?.allowances || [];
    const deductions = profile?.deductions || [];

    const totalAllowances = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const gross = basic + totalAllowances;
    const net = Math.max(0, gross - totalDeductions);

    const recordId = `pay_${orgId}_${staffId}_${input.month}_${input.year}`;
    const recordRef = doc(db, "organizations", orgId, "payroll", recordId);

    const payrollRecord: PayrollRecord = {
      id: recordId,
      organizationId: orgId,
      staffId,
      staffName: staff.fullName,
      employeeId: staff.employeeId,
      departmentName: staff.professional.departmentName,
      designationName: staff.professional.designationName,
      period: periodStr,
      month: input.month,
      year: input.year,
      basic,
      allowances,
      totalAllowances,
      deductions,
      totalDeductions,
      gross,
      net,
      status: "Processed",
      createdAt: now,
      createdBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    batch.set(recordRef, payrollRecord);
    records.push(payrollRecord);
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PAYROLL_PROCESSED",
    entityType: "PAYROLL",
    entityId: periodStr,
    metadata: { count: records.length, period: periodStr },
  });

  return records;
};

export const approvePayroll = async (
  orgId: string,
  payrollId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "payroll", payrollId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Approved",
    approvedBy: actor.uid,
    approvedByName: actor.name,
    approvedAt: now,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PAYROLL_APPROVED",
    entityType: "PAYROLL",
    entityId: payrollId,
  });
};

export const markPayrollPaid = async (
  orgId: string,
  payrollId: string,
  paymentMethod: "Bank Transfer" | "Cheque" | "Cash" | "UPI" | "Direct Deposit",
  transactionReference: string | null,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "payroll", payrollId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Paid",
    paymentMethod,
    transactionReference: transactionReference || null,
    paidAt: now,
    paidBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PAYROLL_PAID",
    entityType: "PAYROLL",
    entityId: payrollId,
    metadata: { paymentMethod, transactionReference },
  });
};

export const listPayrollRecords = async (
  orgId: string,
  month?: number,
  year?: number,
  status?: string
): Promise<PayrollRecord[]> => {
  const colRef = collection(db, "organizations", orgId, "payroll");
  let q = query(colRef, orderBy("createdAt", "desc"));

  if (month && year) {
    const periodStr = `${year}-${String(month).padStart(2, "0")}`;
    q = query(colRef, where("period", "==", periodStr), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as PayrollRecord);

  if (status && status !== "ALL") {
    list = list.filter((p) => p.status === status);
  }

  return list;
};

// ----------------------------------------------------
// 8. HR DASHBOARD STATS
// ----------------------------------------------------

export const getHrDashboardStats = async (orgId: string): Promise<HrDashboardStats> => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [staffList, attendanceSnap, pendingLeavesSnap] = await Promise.all([
    listStaff(orgId),
    getDocs(
      query(
        collection(db, "organizations", orgId, "attendanceRecords"),
        where("personType", "==", "staff"),
        where("date", "==", todayStr)
      )
    ),
    getDocs(
      query(
        collection(db, "organizations", orgId, "leaveRequests"),
        where("applicantType", "in", ["staff", "teacher"]),
        where("status", "==", "pending")
      )
    ),
  ]);

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === "Active").length;
  const teachingStaff = staffList.filter(
    (s) => s.status === "Active" && s.professional.isTeachingStaff
  ).length;
  const nonTeachingStaff = staffList.filter(
    (s) => s.status === "Active" && !s.professional.isTeachingStaff
  ).length;

  const attendanceRecords = attendanceSnap.docs.map((d) => d.data());
  const presentToday = attendanceRecords.filter((r) => r.status === "present").length;
  const onLeaveToday = attendanceRecords.filter((r) => r.status === "leave").length;
  const pendingLeaves = pendingLeavesSnap.size;

  // Documents expiring in 30 days
  let documentsExpiringSoon = 0;
  const now = new Date().getTime();
  staffList.forEach((s) => {
    (s.documents || []).forEach((d) => {
      if (d.expiryDate) {
        const exp = new Date(d.expiryDate).getTime();
        const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 30) {
          documentsExpiringSoon++;
        }
      }
    });
  });

  return {
    totalStaff,
    activeStaff,
    teachingStaff,
    nonTeachingStaff,
    presentToday,
    onLeaveToday,
    pendingLeaves,
    documentsExpiringSoon,
  };
};
