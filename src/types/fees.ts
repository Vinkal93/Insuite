export type FeeFrequency =
  | "Monthly"
  | "Quarterly"
  | "Half-Yearly"
  | "Yearly"
  | "One-Time"
  | "Custom";

export interface FeeComponent {
  id: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  description?: string;
}

export type FeeStructureStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface FeeStructure {
  id: string;
  organizationId: string;
  academicSessionId: string;
  classId: string;
  className?: string;
  name: string;
  frequency: FeeFrequency;
  components: FeeComponent[];
  totalAmount: number;
  status: FeeStructureStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type FeeInvoiceStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface InvoiceComponent {
  componentId: string;
  name: string;
  amount: number;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  admissionNumber?: string;
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  parentName?: string;
  parentMobile?: string;
  academicSessionId: string;
  feeStructureId: string;
  feeStructureName: string;
  dueDate: string;
  components: InvoiceComponent[];
  subtotal: number;
  discountAmount: number;
  discountId?: string;
  lateFeeAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: FeeInvoiceStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Card"
  | "Bank Transfer"
  | "Cheque"
  | "Other";

export interface FeePayment {
  id: string;
  receiptNumber: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  invoiceId: string;
  invoiceNumber: string;
  className?: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status: "SUCCESS" | "REFUNDED";
  collectedBy: string;
  collectedByName: string;
  createdAt: string;
}

export interface FeeRefund {
  id: string;
  organizationId: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  reason: string;
  approvedBy: string;
  approvedByName?: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface FeeDiscount {
  id: string;
  organizationId: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  applicableComponent?: string;
  reason: string;
  validityFrom?: string;
  validityTo?: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  requestedBy: string;
  requestedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeSettingsConfig {
  feeNumbering: {
    receiptPrefix: string;
    invoicePrefix: string;
  };
  lateFee: {
    enabled: boolean;
    type: "FIXED" | "PERCENTAGE";
    amount: number;
    gracePeriodDays: number;
  };
  paymentMethods: {
    cash: boolean;
    upi: boolean;
    card: boolean;
    bankTransfer: boolean;
    cheque: boolean;
  };
  receiptSettings: {
    showLogo: boolean;
    showPrincipalSign: boolean;
    termsAndConditions?: string;
    headerNotes?: string;
  };
  currency: string;
}

export interface FeeDashboardStats {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  todayCollection: number;
  thisMonthCollection: number;
  totalInvoices: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  defaultersCount: number;
  isConfigured: boolean;
}

export interface StudentFeeSummary {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className: string;
  sectionName?: string;
  parentName?: string;
  parentMobile?: string;
  totalAssigned: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  invoices: FeeInvoice[];
  payments: FeePayment[];
}
