export type BookFormat = "Physical" | "Digital" | "Reference" | "Other";

export type BookStatus = "Active" | "Archived";

export type BookCopyStatus =
  | "Available"
  | "Issued"
  | "Reserved"
  | "Lost"
  | "Damaged"
  | "Maintenance";

export type LibraryMemberType = "Student" | "Staff";

export type LibraryTransactionStatus =
  | "Issued"
  | "Returned"
  | "Lost"
  | "Damaged"
  | "Cancelled";

export type LibraryReservationStatus =
  | "Pending"
  | "Ready"
  | "Issued"
  | "Expired"
  | "Cancelled";

export type LibraryFineStatus = "Pending" | "Paid" | "Waived" | "Cancelled";

export interface LibraryCategory {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  booksCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface LibraryAuthor {
  id: string;
  organizationId: string;
  name: string;
  biography?: string | null;
  booksCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface LibraryPublisher {
  id: string;
  organizationId: string;
  name: string;
  contact?: string | null;
  website?: string | null;
  booksCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface LibraryBookCopy {
  id: string;
  organizationId: string;
  bookId: string;
  accessionNumber: string; // e.g. LIB-2026-000001
  condition: "New" | "Good" | "Fair" | "Poor";
  shelf?: string | null;
  rack?: string | null;
  location?: string | null;
  status: BookCopyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryBook {
  id: string;
  organizationId: string;
  title: string;
  subtitle?: string | null;
  isbn?: string | null;
  language?: string | null;
  edition?: string | null;
  publicationYear?: number | null;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  publisherId?: string | null;
  publisherName?: string | null;
  subject?: string | null;
  tags?: string[];
  coverUrl?: string | null;
  format: BookFormat;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  shelf?: string | null;
  rack?: string | null;
  location?: string | null;
  issueAllowed: boolean;
  renewalAllowed: boolean;
  maximumRenewals: number;
  loanDurationDays: number;
  fineApplicable: boolean;
  status: BookStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface LibraryMember {
  id: string; // studentId or staffId
  organizationId: string;
  memberType: LibraryMemberType;
  name: string;
  identifier: string; // admissionNumber or employeeId
  departmentOrClass: string; // e.g. "Class 10-A" or "Mathematics Department"
  contactMobile?: string | null;
  contactEmail?: string | null;
  photoUrl?: string | null;
  status: "Active" | "Inactive" | "Blocked";
  booksIssuedCount: number;
  activeFinesAmount: number;
  createdAt: string;
}

export interface LibraryTransaction {
  id: string;
  organizationId: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl?: string | null;
  copyId: string;
  accessionNumber: string;
  memberType: LibraryMemberType;
  memberId: string;
  memberName: string;
  memberIdentifier: string; // admissionNumber or employeeId
  issuedAt: string; // ISO date
  issuedBy: string;
  issuedByName: string;
  dueAt: string; // YYYY-MM-DD
  returnedAt?: string | null;
  returnedBy?: string | null;
  returnedByName?: string | null;
  renewalCount: number;
  status: LibraryTransactionStatus;
  fineAmount?: number;
  finePaid?: boolean;
  fineId?: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryReservation {
  id: string;
  organizationId: string;
  bookId: string;
  bookTitle: string;
  memberType: LibraryMemberType;
  memberId: string;
  memberName: string;
  reservedAt: string;
  expiresAt: string;
  queuePosition: number;
  status: LibraryReservationStatus;
  allocatedCopyId?: string | null;
  allocatedAccessionNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryFine {
  id: string;
  organizationId: string;
  transactionId: string;
  bookId: string;
  bookTitle: string;
  copyId: string;
  accessionNumber: string;
  memberType: LibraryMemberType;
  memberId: string;
  memberName: string;
  daysOverdue: number;
  amount: number;
  reason: string;
  status: LibraryFineStatus;
  paidAt?: string | null;
  paidBy?: string | null;
  paidByName?: string | null;
  paymentMethod?: string | null;
  transactionReference?: string | null;
  waivedAt?: string | null;
  waivedBy?: string | null;
  waivedByName?: string | null;
  waiverReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibrarySettingsConfig {
  studentLoanLimit: number;
  staffLoanLimit: number;
  defaultLoanDurationDays: number;
  maxRenewals: number;
  finePerDay: number;
  reservationExpiryDays: number;
  accessionPrefix: string;
  autoGenerateAccessionNumber: boolean;
}

export interface LibraryDashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  overdueBooks: number;
  reservedBooks: number;
  pendingFinesCount: number;
  pendingFinesTotal: number;
}
