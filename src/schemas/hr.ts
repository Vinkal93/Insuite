import { z } from "zod";

export const staffInputSchema = z.object({
  personal: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    middleName: z.string().optional().nullable(),
    lastName: z.string().min(1, "Last name is required"),
    photoUrl: z.string().optional().nullable(),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    bloodGroup: z.string().optional().nullable(),
  }),
  contact: z.object({
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    alternateMobile: z.string().optional().nullable(),
    email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pinCode: z.string().optional().nullable(),
  }),
  professional: z.object({
    employeeId: z.string().min(3, "Employee ID is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
    departmentId: z.string().min(1, "Department is required"),
    departmentName: z.string().min(1, "Department name is required"),
    designationId: z.string().min(1, "Designation is required"),
    designationName: z.string().min(1, "Designation name is required"),
    employmentType: z.enum([
      "Full Time",
      "Part Time",
      "Contract",
      "Temporary",
      "Intern",
      "Other",
    ]),
    qualification: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
    isTeachingStaff: z.boolean().default(false),
  }),
  emergencyContact: z
    .object({
      contactName: z.string().optional().nullable(),
      relation: z.string().optional().nullable(),
      mobile: z.string().optional().nullable(),
    })
    .optional(),
  status: z
    .enum(["Active", "Inactive", "On Leave", "Resigned", "Terminated", "Retired"])
    .default("Active"),
});

export type StaffInput = z.infer<typeof staffInputSchema>;

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  code: z.string().min(2, "Department code is required"),
  headStaffId: z.string().optional().nullable(),
  headStaffName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

export const designationSchema = z.object({
  name: z.string().min(2, "Designation name must be at least 2 characters"),
  departmentId: z.string().optional().nullable(),
  departmentName: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type DesignationInput = z.infer<typeof designationSchema>;

export const salaryComponentSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Component name required"),
  type: z.enum(["ALLOWANCE", "DEDUCTION"]),
  amount: z.number().min(0, "Amount must be positive"),
  isPercentage: z.boolean().optional(),
  percentageOf: z.literal("BASIC").optional(),
  description: z.string().optional(),
});

export const salaryStructureSchema = z.object({
  name: z.string().min(2, "Structure name required"),
  basicSalary: z.number().min(0, "Basic salary must be non-negative"),
  components: z.array(salaryComponentSchema).default([]),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>;

export const staffSalaryProfileSchema = z.object({
  structureId: z.string().optional().nullable(),
  structureName: z.string().optional().nullable(),
  basicSalary: z.number().min(0, "Basic salary must be non-negative"),
  allowances: z.array(salaryComponentSchema).default([]),
  deductions: z.array(salaryComponentSchema).default([]),
});

export type StaffSalaryProfileInput = z.infer<typeof staffSalaryProfileSchema>;

export const payrollProcessInputSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2050),
  staffIds: z.array(z.string()).min(1, "Select at least one staff member"),
});

export type PayrollProcessInput = z.infer<typeof payrollProcessInputSchema>;

export const staffStatusChangeSchema = z.object({
  status: z.enum(["Active", "Inactive", "On Leave", "Resigned", "Terminated", "Retired"]),
  effectiveDate: z.string().min(1, "Effective date is required"),
  reason: z.string().min(3, "Reason is required"),
  notes: z.string().optional().nullable(),
});

export type StaffStatusChangeInput = z.infer<typeof staffStatusChangeSchema>;

export const hrSettingsSchema = z.object({
  employeeIdPrefix: z.string().min(2, "Prefix required").default("INS-EMP"),
  autoGenerateEmployeeId: z.boolean().default(true),
  docExpiryWarningThresholdDays: z.number().min(1).max(180).default(30),
  employmentTypes: z.array(z.string()).min(1),
  leaveTypes: z.array(z.string()).min(1),
});

export type HrSettingsInput = z.infer<typeof hrSettingsSchema>;
