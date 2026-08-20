import { z } from "zod";

export const libraryCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  code: z.string().min(2, "Category code is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type LibraryCategoryInput = z.infer<typeof libraryCategorySchema>;

export const libraryAuthorSchema = z.object({
  name: z.string().min(2, "Author name must be at least 2 characters"),
  biography: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type LibraryAuthorInput = z.infer<typeof libraryAuthorSchema>;

export const libraryPublisherSchema = z.object({
  name: z.string().min(2, "Publisher name must be at least 2 characters"),
  contact: z.string().optional().nullable(),
  website: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type LibraryPublisherInput = z.infer<typeof libraryPublisherSchema>;

export const libraryBookSchema = z.object({
  title: z.string().min(2, "Book title is required"),
  subtitle: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  language: z.string().default("English"),
  edition: z.string().optional().nullable(),
  publicationYear: z.number().min(1800).max(2100).optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  categoryName: z.string().min(1, "Category name is required"),
  authorId: z.string().min(1, "Author is required"),
  authorName: z.string().min(1, "Author name is required"),
  publisherId: z.string().optional().nullable(),
  publisherName: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  coverUrl: z.string().optional().nullable(),
  format: z.enum(["Physical", "Digital", "Reference", "Other"]).default("Physical"),
  totalCopies: z.number().min(1, "Total copies must be at least 1"),
  shelf: z.string().optional().nullable(),
  rack: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  issueAllowed: z.boolean().default(true),
  renewalAllowed: z.boolean().default(true),
  maximumRenewals: z.number().min(0).default(2),
  loanDurationDays: z.number().min(1).default(14),
  fineApplicable: z.boolean().default(true),
  status: z.enum(["Active", "Archived"]).default("Active"),
});

export type LibraryBookInput = z.infer<typeof libraryBookSchema>;

export const libraryCopySchema = z.object({
  condition: z.enum(["New", "Good", "Fair", "Poor"]).default("Good"),
  shelf: z.string().optional().nullable(),
  rack: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z
    .enum(["Available", "Issued", "Reserved", "Lost", "Damaged", "Maintenance"])
    .default("Available"),
});

export type LibraryCopyInput = z.infer<typeof libraryCopySchema>;

export const issueBookSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  copyId: z.string().min(1, "Copy is required"),
  memberType: z.enum(["Student", "Staff"]),
  memberId: z.string().min(1, "Member is required"),
  dueAt: z.string().min(1, "Due date is required"),
  remarks: z.string().optional().nullable(),
});

export type IssueBookInput = z.infer<typeof issueBookSchema>;

export const returnBookSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  remarks: z.string().optional().nullable(),
  payFineNow: z.boolean().default(false),
  paymentMethod: z.string().optional().nullable(),
  transactionReference: z.string().optional().nullable(),
});

export type ReturnBookInput = z.infer<typeof returnBookSchema>;

export const reserveBookSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  memberType: z.enum(["Student", "Staff"]),
  memberId: z.string().min(1, "Member is required"),
});

export type ReserveBookInput = z.infer<typeof reserveBookSchema>;

export const waiveFineSchema = z.object({
  fineId: z.string().min(1, "Fine ID is required"),
  reason: z.string().min(3, "Reason for waiver is required"),
});

export type WaiveFineInput = z.infer<typeof waiveFineSchema>;

export const librarySettingsSchema = z.object({
  studentLoanLimit: z.number().min(1).max(20).default(3),
  staffLoanLimit: z.number().min(1).max(50).default(6),
  defaultLoanDurationDays: z.number().min(1).max(90).default(14),
  maxRenewals: z.number().min(0).max(10).default(2),
  finePerDay: z.number().min(0).max(1000).default(5),
  reservationExpiryDays: z.number().min(1).max(30).default(3),
  accessionPrefix: z.string().min(2).default("LIB"),
  autoGenerateAccessionNumber: z.boolean().default(true),
});

export type LibrarySettingsInput = z.infer<typeof librarySettingsSchema>;
