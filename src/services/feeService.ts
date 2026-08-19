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
  limit as firestoreLimit,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  FeeStructure,
  FeeComponent,
  FeeInvoice,
  FeePayment,
  FeeDiscount,
  FeeSettingsConfig,
  FeeDashboardStats,
  StudentFeeSummary,
  FeeInvoiceStatus,
  PaymentMethod,
} from "@/types/fees";
import type {
  FeeStructureInput,
  CollectFeeInput,
  FeeDiscountInput,
  FeeSettingsInput,
  GenerateInvoiceInput,
} from "@/schemas/fees";
import { createAuditLog } from "./auditService";
import { listStudents, getStudent } from "./studentService";
import { getSchoolClassById } from "./academicService";

const DEFAULT_FEE_SETTINGS: FeeSettingsConfig = {
  feeNumbering: {
    receiptPrefix: "REC",
    invoicePrefix: "INV",
  },
  lateFee: {
    enabled: false,
    type: "FIXED",
    amount: 0,
    gracePeriodDays: 7,
  },
  paymentMethods: {
    cash: true,
    upi: true,
    card: true,
    bankTransfer: true,
    cheque: true,
  },
  receiptSettings: {
    showLogo: true,
    showPrincipalSign: true,
    termsAndConditions: "Fees once paid are non-refundable unless authorized by the school management.",
    headerNotes: "Official Institutional Payment Receipt",
  },
  currency: "INR (₹)",
};

// ----------------------------------------------------
// 1. SEQUENCE GENERATORS (Collision-Safe Counters)
// ----------------------------------------------------

export const generateNextReceiptNumber = async (
  orgId: string,
  prefix = "REC",
  year = new Date().getFullYear().toString()
): Promise<string> => {
  const counterRef = doc(db, "organizations", orgId, "counters", "receipts");
  const nextSeq = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const curr = snap.exists() ? snap.data().currentSequence || 0 : 0;
    const updated = curr + 1;
    t.set(counterRef, { currentSequence: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  });
  return `${prefix}-${year}-${nextSeq.toString().padStart(6, "0")}`;
};

export const generateNextInvoiceNumber = async (
  orgId: string,
  prefix = "INV",
  year = new Date().getFullYear().toString()
): Promise<string> => {
  const counterRef = doc(db, "organizations", orgId, "counters", "invoices");
  const nextSeq = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const curr = snap.exists() ? snap.data().currentSequence || 0 : 0;
    const updated = curr + 1;
    t.set(counterRef, { currentSequence: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  });
  return `${prefix}-${year}-${nextSeq.toString().padStart(6, "0")}`;
};

// ----------------------------------------------------
// 2. FEE SETTINGS
// ----------------------------------------------------

export const getFeeSettings = async (orgId: string): Promise<FeeSettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "feeSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_FEE_SETTINGS;
    return { ...DEFAULT_FEE_SETTINGS, ...snap.data() } as FeeSettingsConfig;
  } catch (err) {
    console.error("getFeeSettings error:", err);
    return DEFAULT_FEE_SETTINGS;
  }
};

export const updateFeeSettings = async (
  orgId: string,
  input: FeeSettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "feeSettings", "config");
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
    action: "FEE_SETTINGS_UPDATED",
    entityType: "FEE_SETTINGS",
    entityId: "config",
  });
};

// ----------------------------------------------------
// 3. FEE STRUCTURES CRUD
// ----------------------------------------------------

export const createFeeStructure = async (
  orgId: string,
  input: FeeStructureInput,
  actor: { uid: string; name: string }
): Promise<FeeStructure> => {
  const colRef = collection(db, "organizations", orgId, "feeStructures");
  const docRef = doc(colRef);

  // Fetch Class Name for convenience
  const schoolClass = await getSchoolClassById(orgId, input.classId).catch(() => null);
  const totalAmount = input.components.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const structure: FeeStructure = {
    id: docRef.id,
    organizationId: orgId,
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    className: schoolClass?.name || "Class",
    name: input.name,
    frequency: input.frequency,
    components: input.components,
    totalAmount,
    status: input.status || "ACTIVE",
    createdAt: new Date().toISOString(),
    createdBy: actor.uid,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  await setDoc(docRef, structure);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FEE_STRUCTURE_CREATED",
    entityType: "FEE_STRUCTURE",
    entityId: docRef.id,
    metadata: { name: structure.name, totalAmount },
  });

  return structure;
};

export const getFeeStructure = async (
  orgId: string,
  structureId: string
): Promise<FeeStructure | null> => {
  const docRef = doc(db, "organizations", orgId, "feeStructures", structureId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as FeeStructure;
};

export const updateFeeStructure = async (
  orgId: string,
  structureId: string,
  input: Partial<FeeStructureInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "feeStructures", structureId);
  const updates: Record<string, any> = {
    ...input,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  };

  if (input.components) {
    updates.totalAmount = input.components.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  }

  await updateDoc(docRef, updates);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FEE_STRUCTURE_UPDATED",
    entityType: "FEE_STRUCTURE",
    entityId: structureId,
  });
};

export const deactivateFeeStructure = async (
  orgId: string,
  structureId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "feeStructures", structureId);
  await updateDoc(docRef, {
    status: "INACTIVE",
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FEE_STRUCTURE_DEACTIVATED",
    entityType: "FEE_STRUCTURE",
    entityId: structureId,
  });
};

export const listFeeStructures = async (
  orgId: string,
  filters?: { sessionId?: string; classId?: string; status?: string }
): Promise<FeeStructure[]> => {
  const colRef = collection(db, "organizations", orgId, "feeStructures");
  let q = query(colRef, orderBy("createdAt", "desc"));

  if (filters?.sessionId) {
    q = query(colRef, where("academicSessionId", "==", filters.sessionId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as FeeStructure);

  if (filters?.classId) {
    list = list.filter((s) => s.classId === filters.classId);
  }
  if (filters?.status) {
    list = list.filter((s) => s.status === filters.status);
  }

  return list;
};

// ----------------------------------------------------
// 4. FEE INVOICES GENERATION & MANAGEMENT
// ----------------------------------------------------

export const generateInvoicesForClass = async (
  orgId: string,
  feeStructureId: string,
  dueDate: string,
  actor: { uid: string; name: string }
): Promise<{ createdCount: number }> => {
  const structure = await getFeeStructure(orgId, feeStructureId);
  if (!structure) throw new Error("Fee structure not found");

  const students = await listStudents(orgId, {
    sessionId: structure.academicSessionId,
    classId: structure.classId,
    status: "ACTIVE",
  });

  if (students.length === 0) return { createdCount: 0 };

  const settings = await getFeeSettings(orgId);
  let count = 0;

  for (const student of students) {
    const invNumber = await generateNextInvoiceNumber(orgId, settings.feeNumbering.invoicePrefix);
    const docRef = doc(collection(db, "organizations", orgId, "feeInvoices"));

    const subtotal = structure.components.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const invoice: FeeInvoice = {
      id: docRef.id,
      invoiceNumber: invNumber,
      organizationId: orgId,
      studentId: student.id,
      studentName: student.fullName,
      studentIdentifier: student.studentId,
      admissionNumber: student.admissionNumber,
      classId: student.academic.classId,
      className: student.academic.className,
      sectionId: student.academic.sectionId,
      sectionName: student.academic.sectionName,
      parentName: student.parent?.fatherName || student.parent?.motherName || "Guardian",
      parentMobile: student.contact?.mobile,
      academicSessionId: structure.academicSessionId,
      feeStructureId: structure.id,
      feeStructureName: structure.name,
      dueDate,
      components: structure.components.map((c) => ({
        componentId: c.id,
        name: c.name,
        amount: Number(c.amount || 0),
      })),
      subtotal,
      discountAmount: 0,
      lateFeeAmount: 0,
      totalAmount: subtotal,
      paidAmount: 0,
      balanceAmount: subtotal,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      createdBy: actor.uid,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    };

    await setDoc(docRef, invoice);
    count++;
  }

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FEE_INVOICE_GENERATED",
    entityType: "FEE_INVOICE",
    entityId: structure.id,
    metadata: { count, className: structure.className },
  });

  return { createdCount: count };
};

export const listFeeInvoices = async (
  orgId: string,
  filters?: {
    studentId?: string;
    sessionId?: string;
    classId?: string;
    status?: FeeInvoiceStatus | "";
    searchQuery?: string;
  }
): Promise<FeeInvoice[]> => {
  const colRef = collection(db, "organizations", orgId, "feeInvoices");
  let q = query(colRef, orderBy("createdAt", "desc"), firestoreLimit(200));

  if (filters?.studentId) {
    q = query(colRef, where("studentId", "==", filters.studentId), orderBy("createdAt", "desc"));
  } else if (filters?.sessionId) {
    q = query(colRef, where("academicSessionId", "==", filters.sessionId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as FeeInvoice);

  const todayStr = new Date().toISOString().split("T")[0];

  // Dynamically flag overdue status if past due date and still balance > 0
  list = list.map((inv) => {
    if (inv.status === "PENDING" || inv.status === "PARTIALLY_PAID") {
      if (inv.dueDate < todayStr && inv.balanceAmount > 0) {
        return { ...inv, status: "OVERDUE" as FeeInvoiceStatus };
      }
    }
    return inv;
  });

  if (filters?.classId) {
    list = list.filter((inv) => inv.classId === filters.classId);
  }
  if (filters?.status) {
    list = list.filter((inv) => inv.status === filters.status);
  }
  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    const term = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (inv) =>
        inv.studentName.toLowerCase().includes(term) ||
        inv.invoiceNumber.toLowerCase().includes(term) ||
        (inv.admissionNumber && inv.admissionNumber.toLowerCase().includes(term)) ||
        (inv.parentMobile && inv.parentMobile.includes(term))
    );
  }

  return list;
};

export const getFeeInvoice = async (
  orgId: string,
  invoiceId: string
): Promise<FeeInvoice | null> => {
  const docRef = doc(db, "organizations", orgId, "feeInvoices", invoiceId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as FeeInvoice;
};

// ----------------------------------------------------
// 5. PAYMENT COLLECTION (Strict Transactional Integrity)
// ----------------------------------------------------

export const collectFeePayment = async (
  orgId: string,
  input: CollectFeeInput,
  actor: { uid: string; name: string }
): Promise<FeePayment> => {
  const invoiceRef = doc(db, "organizations", orgId, "feeInvoices", input.invoiceId);
  const settings = await getFeeSettings(orgId);
  const receiptNumber = await generateNextReceiptNumber(orgId, settings.feeNumbering.receiptPrefix);

  const paymentDocRef = doc(collection(db, "organizations", orgId, "feePayments"));

  const newPayment = await runTransaction(db, async (transaction) => {
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) {
      throw new Error("Target invoice could not be found.");
    }

    const inv = invoiceSnap.data() as FeeInvoice;
    if (inv.status === "PAID") {
      throw new Error("This invoice is already fully paid.");
    }
    if (inv.status === "CANCELLED") {
      throw new Error("Cannot accept payment for a cancelled invoice.");
    }

    const payAmount = Number(input.amount);
    if (payAmount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }
    if (payAmount > inv.balanceAmount) {
      throw new Error(
        `Payment amount (₹${payAmount}) exceeds outstanding invoice balance (₹${inv.balanceAmount}).`
      );
    }

    const updatedPaid = (inv.paidAmount || 0) + payAmount;
    const updatedBalance = Math.max(0, inv.totalAmount - updatedPaid);
    const newStatus: FeeInvoiceStatus = updatedBalance === 0 ? "PAID" : "PARTIALLY_PAID";

    // 1. Update Invoice Atomically
    transaction.update(invoiceRef, {
      paidAmount: updatedPaid,
      balanceAmount: updatedBalance,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    });

    // 2. Create Payment Record Atomically
    const paymentRecord: FeePayment = {
      id: paymentDocRef.id,
      receiptNumber,
      organizationId: orgId,
      studentId: inv.studentId,
      studentName: inv.studentName,
      studentIdentifier: inv.studentIdentifier,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      className: inv.className,
      amount: payAmount,
      paymentDate: input.paymentDate || new Date().toISOString().split("T")[0],
      method: input.method as PaymentMethod,
      referenceNumber: input.referenceNumber || "",
      notes: input.notes || "",
      status: "SUCCESS",
      collectedBy: actor.uid,
      collectedByName: actor.name,
      createdAt: new Date().toISOString(),
    };

    transaction.set(paymentDocRef, paymentRecord);
    return paymentRecord;
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FEE_PAYMENT_COLLECTED",
    entityType: "FEE_PAYMENT",
    entityId: newPayment.id,
    metadata: {
      receiptNumber: newPayment.receiptNumber,
      amount: newPayment.amount,
      studentName: newPayment.studentName,
    },
  });

  return newPayment;
};

export const listFeePayments = async (
  orgId: string,
  filters?: {
    studentId?: string;
    invoiceId?: string;
    method?: PaymentMethod | "";
    searchQuery?: string;
  }
): Promise<FeePayment[]> => {
  const colRef = collection(db, "organizations", orgId, "feePayments");
  let q = query(colRef, orderBy("createdAt", "desc"), firestoreLimit(200));

  if (filters?.studentId) {
    q = query(colRef, where("studentId", "==", filters.studentId), orderBy("createdAt", "desc"));
  } else if (filters?.invoiceId) {
    q = query(colRef, where("invoiceId", "==", filters.invoiceId), orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as FeePayment);

  if (filters?.method) {
    list = list.filter((p) => p.method === filters.method);
  }
  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    const term = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.receiptNumber.toLowerCase().includes(term) ||
        p.studentName.toLowerCase().includes(term) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(term))
    );
  }

  return list;
};

export const getFeePayment = async (
  orgId: string,
  paymentId: string
): Promise<FeePayment | null> => {
  const docRef = doc(db, "organizations", orgId, "feePayments", paymentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as FeePayment;
};

// ----------------------------------------------------
// 6. STUDENT FEE PROFILE & LEDGER
// ----------------------------------------------------

export const getStudentFeeSummary = async (
  orgId: string,
  studentId: string
): Promise<StudentFeeSummary> => {
  const student = await getStudent(orgId, studentId);
  const [invoices, payments] = await Promise.all([
    listFeeInvoices(orgId, { studentId }),
    listFeePayments(orgId, { studentId }),
  ]);

  const totalAssigned = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPending = invoices.reduce(
    (sum, inv) => (inv.status !== "PAID" && inv.status !== "CANCELLED" ? sum + (inv.balanceAmount || 0) : sum),
    0
  );
  const totalOverdue = invoices.reduce(
    (sum, inv) => (inv.status === "OVERDUE" ? sum + (inv.balanceAmount || 0) : sum),
    0
  );

  return {
    studentId,
    studentName: student?.fullName || "Student",
    admissionNumber: student?.admissionNumber,
    className: student?.academic?.className || "Class",
    sectionName: student?.academic?.sectionName,
    parentName: student?.parent?.fatherName || student?.parent?.motherName,
    parentMobile: student?.contact?.mobile,
    totalAssigned,
    totalPaid,
    totalPending,
    totalOverdue,
    invoices,
    payments,
  };
};

// ----------------------------------------------------
// 7. DEFAULTERS
// ----------------------------------------------------

export const listDefaulters = async (
  orgId: string,
  filters?: { sessionId?: string; classId?: string }
): Promise<FeeInvoice[]> => {
  const allInvoices = await listFeeInvoices(orgId, {
    sessionId: filters?.sessionId,
    classId: filters?.classId,
  });

  return allInvoices.filter(
    (inv) => (inv.status === "OVERDUE" || inv.status === "PENDING" || inv.status === "PARTIALLY_PAID") && inv.balanceAmount > 0
  );
};

// ----------------------------------------------------
// 8. DISCOUNTS & CONCESSIONS
// ----------------------------------------------------

export const createFeeDiscount = async (
  orgId: string,
  input: FeeDiscountInput,
  actor: { uid: string; name: string }
): Promise<FeeDiscount> => {
  const docRef = doc(collection(db, "organizations", orgId, "discounts"));
  const discount: FeeDiscount = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    type: input.type,
    value: Number(input.value),
    applicableComponent: input.applicableComponent || "All Components",
    reason: input.reason,
    validityFrom: input.validityFrom,
    validityTo: input.validityTo,
    status: "APPROVED", // Auto-approved for admin/owner
    requestedBy: actor.uid,
    requestedByName: actor.name,
    approvedBy: actor.uid,
    approvedByName: actor.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, discount);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "DISCOUNT_CREATED",
    entityType: "DISCOUNT",
    entityId: docRef.id,
    metadata: { name: discount.name, value: discount.value },
  });

  return discount;
};

export const listFeeDiscounts = async (orgId: string): Promise<FeeDiscount[]> => {
  const colRef = collection(db, "organizations", orgId, "discounts");
  const snap = await getDocs(query(colRef, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as FeeDiscount);
};

// ----------------------------------------------------
// 9. DASHBOARD STATS AGGREGATOR
// ----------------------------------------------------

export const getFeeDashboardStats = async (
  orgId: string,
  sessionId?: string
): Promise<FeeDashboardStats> => {
  const [structures, invoices, payments] = await Promise.all([
    listFeeStructures(orgId, { sessionId }),
    listFeeInvoices(orgId, { sessionId }),
    listFeePayments(orgId),
  ]);

  if (structures.length === 0 && invoices.length === 0) {
    return {
      totalExpected: 0,
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      todayCollection: 0,
      thisMonthCollection: 0,
      totalInvoices: 0,
      paidInvoicesCount: 0,
      pendingInvoicesCount: 0,
      defaultersCount: 0,
      isConfigured: false,
    };
  }

  const totalExpected = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPending = invoices.reduce(
    (sum, inv) => (inv.status !== "PAID" && inv.status !== "CANCELLED" ? sum + (inv.balanceAmount || 0) : sum),
    0
  );
  const totalOverdue = invoices.reduce(
    (sum, inv) => (inv.status === "OVERDUE" ? sum + (inv.balanceAmount || 0) : sum),
    0
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const todayCollection = payments
    .filter((p) => p.paymentDate === todayStr && p.status === "SUCCESS")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const thisMonthCollection = payments
    .filter((p) => p.paymentDate && p.paymentDate.startsWith(currentMonthStr) && p.status === "SUCCESS")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidInvoicesCount = invoices.filter((inv) => inv.status === "PAID").length;
  const pendingInvoicesCount = invoices.filter((inv) => inv.status === "PENDING" || inv.status === "PARTIALLY_PAID").length;
  const defaultersCount = invoices.filter((inv) => inv.status === "OVERDUE" && inv.balanceAmount > 0).length;

  return {
    totalExpected,
    totalCollected,
    totalPending,
    totalOverdue,
    todayCollection,
    thisMonthCollection,
    totalInvoices: invoices.length,
    paidInvoicesCount,
    pendingInvoicesCount,
    defaultersCount,
    isConfigured: structures.length > 0 || invoices.length > 0,
  };
};
