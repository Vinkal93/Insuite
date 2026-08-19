import { z } from "zod";

export const feeFrequencyEnum = z.enum([
  "Monthly",
  "Quarterly",
  "Half-Yearly",
  "Yearly",
  "One-Time",
  "Custom",
]);

export const feeComponentSchema = z.object({
  id: z.string().min(1, "Component ID required"),
  name: z.string().min(1, "Component name required"),
  amount: z.coerce.number().min(0, "Amount must be >= 0"),
  frequency: feeFrequencyEnum,
  isMandatory: z.boolean().default(true),
  description: z.string().optional(),
});

export const feeStructureSchema = z.object({
  name: z.string().min(2, "Fee structure name required"),
  academicSessionId: z.string().min(1, "Academic session required"),
  classId: z.string().min(1, "Class selection required"),
  frequency: feeFrequencyEnum,
  components: z.array(feeComponentSchema).min(1, "At least one fee component is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export type FeeStructureInput = z.infer<typeof feeStructureSchema>;

export const collectFeeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  invoiceId: z.string().min(1, "Invoice selection required"),
  amount: z.coerce.number().min(1, "Payment amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date required"),
  method: z.enum(["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type CollectFeeInput = z.infer<typeof collectFeeSchema>;

export const feeDiscountSchema = z.object({
  name: z.string().min(2, "Discount title required"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0.01, "Discount value must be greater than 0"),
  applicableComponent: z.string().optional(),
  reason: z.string().min(2, "Reason is required"),
  validityFrom: z.string().optional(),
  validityTo: z.string().optional(),
});

export type FeeDiscountInput = z.infer<typeof feeDiscountSchema>;

export const feeSettingsSchema = z.object({
  feeNumbering: z.object({
    receiptPrefix: z.string().min(1, "Receipt prefix required").default("REC"),
    invoicePrefix: z.string().min(1, "Invoice prefix required").default("INV"),
  }),
  lateFee: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
    amount: z.coerce.number().min(0).default(0),
    gracePeriodDays: z.coerce.number().min(0).default(7),
  }),
  paymentMethods: z.object({
    cash: z.boolean().default(true),
    upi: z.boolean().default(true),
    card: z.boolean().default(true),
    bankTransfer: z.boolean().default(true),
    cheque: z.boolean().default(true),
  }),
  receiptSettings: z.object({
    showLogo: z.boolean().default(true),
    showPrincipalSign: z.boolean().default(true),
    termsAndConditions: z.string().optional(),
    headerNotes: z.string().optional(),
  }),
  currency: z.string().min(1, "Currency code required").default("INR (₹)"),
});

export type FeeSettingsInput = z.infer<typeof feeSettingsSchema>;

export const generateInvoiceSchema = z.object({
  studentId: z.string().min(1, "Student required"),
  feeStructureId: z.string().min(1, "Fee structure required"),
  academicSessionId: z.string().min(1, "Academic session required"),
  dueDate: z.string().min(1, "Due date required"),
  discountId: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
