export type EmploymentType =
  | "Full Time"
  | "Part Time"
  | "Contract"
  | "Temporary"
  | "Intern"
  | "Other";

export type StaffStatus =
  | "Active"
  | "Inactive"
  | "On Leave"
  | "Resigned"
  | "Terminated"
  | "Retired";

export interface StaffPersonal {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  photoUrl?: string | null;
  dob: string; // YYYY-MM-DD
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string | null;
}

export interface StaffContact {
  mobile: string;
  alternateMobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
}

export interface StaffProfessional {
  employeeId: string;
  joiningDate: string; // YYYY-MM-DD
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationName: string;
  employmentType: EmploymentType;
  qualification?: string | null;
  experience?: string | null;
  specialization?: string | null;
  isTeachingStaff: boolean;
  teacherId?: string | null;
}

export interface StaffEmergency {
  contactName?: string | null;
  relation?: string | null;
  mobile?: string | null;
}

export type StaffDocumentType =
  | "PHOTO"
  | "ID_PROOF"
  | "QUALIFICATION_CERTIFICATE"
  | "EXPERIENCE_CERTIFICATE"
  | "OTHER";

export type StaffDocumentStatus = "Valid" | "Expiring Soon" | "Expired" | "Missing";

export interface StaffDocument {
  id: string;
  name: string;
  documentType: StaffDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  storagePath?: string;
  mimeType?: string;
  expiryDate?: string | null; // YYYY-MM-DD
  status: StaffDocumentStatus;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Staff {
  id: string;
  organizationId: string;
  employeeId: string;
  fullName: string;
  personal: StaffPersonal;
  contact: StaffContact;
  professional: StaffProfessional;
  emergencyContact?: StaffEmergency;
  documents?: StaffDocument[];
  status: StaffStatus;
  statusReason?: string | null;
  statusEffectiveDate?: string | null;
  statusNotes?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  headStaffId?: string | null;
  headStaffName?: string | null;
  description?: string | null;
  staffCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Designation {
  id: string;
  organizationId: string;
  name: string;
  departmentId?: string | null;
  departmentName?: string | null;
  staffCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export type SalaryComponentType = "ALLOWANCE" | "DEDUCTION";

export interface SalaryComponent {
  id: string;
  name: string;
  type: SalaryComponentType;
  amount: number;
  isPercentage?: boolean;
  percentageOf?: "BASIC";
  description?: string;
}

export interface SalaryStructure {
  id: string;
  organizationId: string;
  name: string;
  basicSalary: number;
  components: SalaryComponent[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface StaffSalaryProfile {
  staffId: string;
  organizationId: string;
  structureId?: string | null;
  structureName?: string | null;
  basicSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  netSalary: number;
  updatedAt: string;
  updatedBy?: string;
}

export type PayrollStatus = "Draft" | "Processed" | "Approved" | "Paid" | "Cancelled";

export interface PayrollRecord {
  id: string;
  organizationId: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  departmentName: string;
  designationName: string;
  period: string; // YYYY-MM
  month: number;
  year: number;
  basic: number;
  allowances: SalaryComponent[];
  totalAllowances: number;
  deductions: SalaryComponent[];
  totalDeductions: number;
  gross: number;
  net: number;
  status: PayrollStatus;
  paymentMethod?: "Bank Transfer" | "Cheque" | "Cash" | "UPI" | "Direct Deposit";
  transactionReference?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  paidBy?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface HrDashboardStats {
  totalStaff: number;
  activeStaff: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  presentToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
  documentsExpiringSoon: number;
}

export interface HrSettingsConfig {
  employeeIdPrefix: string;
  autoGenerateEmployeeId: boolean;
  docExpiryWarningThresholdDays: number;
  employmentTypes: string[];
  leaveTypes: string[];
}
